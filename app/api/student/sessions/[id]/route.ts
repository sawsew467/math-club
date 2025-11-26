import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/student/sessions/[id] - Get a session with answers
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const supabase = createAdminClient()

    // Define types for nested query result
    type SubQuestionRow = {
      sub_order: number
      [key: string]: unknown
    }

    type QuestionRow = {
      question_order: number
      sub_questions?: SubQuestionRow[]
      [key: string]: unknown
    }

    type ExamWithQuestions = {
      questions?: QuestionRow[]
      [key: string]: unknown
    }

    type SessionWithExam = {
      exam?: ExamWithQuestions
      [key: string]: unknown
    }

    const { data, error } = await supabase
      .from('exam_sessions')
      .select(`
        *,
        student_answers (*),
        exam:exams (
          *,
          questions (
            *,
            sub_questions (*)
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Session not found' }, { status: 404 })
      }
      throw error
    }

    const session = data as unknown as SessionWithExam

    // Sort questions and sub_questions
    if (session.exam && session.exam.questions) {
      session.exam.questions = session.exam.questions
        .sort((a, b) => a.question_order - b.question_order)
        .map((q) => ({
          ...q,
          sub_questions: (q.sub_questions || []).sort((a, b) => a.sub_order - b.sub_order)
        }))
    }

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/student/sessions/[id] - Update session (save answer or complete)
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { action, answers, timeSpent, score, totalScore, percentage } = body

    const supabase = createAdminClient()

    if (action === 'save_answer') {
      // Save individual answer
      const { questionId, userAnswer, isCorrect, pointsEarned } = body

      const { data, error } = await supabase
        .from('student_answers')
        .upsert({
          session_id: id,
          question_id: questionId,
          user_answer: String(userAnswer),
          is_correct: isCorrect,
          points_earned: pointsEarned || 0,
        }, {
          onConflict: 'session_id,question_id',
        })
        .select()
        .single()

      if (error) throw error

      return NextResponse.json({ answer: data })
    }

    if (action === 'complete') {
      // Complete session and save all answers
      const { data: session, error: sessionError } = await supabase
        .from('exam_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
          time_spent: timeSpent,
          score: score,
          total_score: totalScore,
          percentage: percentage,
        })
        .eq('id', id)
        .select()
        .single()

      if (sessionError) throw sessionError

      // Save all answers
      if (answers && answers.length > 0) {
        const answersToInsert = answers.map((a: {
          questionId: string
          userAnswer: string | number
          isCorrect: boolean
          pointsEarned: number
        }) => ({
          session_id: id,
          question_id: a.questionId,
          user_answer: String(a.userAnswer),
          is_correct: a.isCorrect,
          points_earned: a.pointsEarned || 0,
        }))

        const { error: answersError } = await supabase
          .from('student_answers')
          .upsert(answersToInsert, {
            onConflict: 'session_id,question_id',
          })

        if (answersError) throw answersError
      }

      return NextResponse.json({ session })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating session:', error)
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    )
  }
}
