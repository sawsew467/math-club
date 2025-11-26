import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ExamUpdate, QuestionInsert, SubQuestionInsert } from '@/types/supabase'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/exams/[id] - Get a single exam with questions
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

    const { data, error } = await supabase
      .from('exams')
      .select(`
        *,
        questions (
          *,
          sub_questions (*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Exam not found' }, { status: 404 })
      }
      throw error
    }

    const exam = data as unknown as ExamWithQuestions

    // Sort questions and sub-questions
    const sortedQuestions = exam.questions
      ?.sort((a, b) => a.question_order - b.question_order)
      .map((q) => ({
        ...q,
        sub_questions: q.sub_questions?.sort((a, b) => a.sub_order - b.sub_order) || []
      }))

    const examWithSortedQuestions = {
      ...exam,
      questions: sortedQuestions
    }

    return NextResponse.json({ exam: examWithSortedQuestions })
  } catch (error) {
    console.error('Error fetching exam:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exam' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/exams/[id] - Update an exam with questions
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    // Verify teacher auth
    const authHeader = request.headers.get('x-teacher-auth')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacherEmail = process.env.TEACHER_EMAIL
    if (authHeader !== teacherEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { exam, questions } = body as {
      exam: ExamUpdate
      questions: (QuestionInsert & { subQuestions?: Omit<SubQuestionInsert, 'question_id'>[] })[]
    }

    const supabase = createAdminClient()

    // Update exam
    const { data: updatedExam, error: examError } = await supabase
      .from('exams')
      .update(exam)
      .eq('id', id)
      .select()
      .single()

    if (examError) throw examError

    // Delete existing questions (cascade deletes sub_questions)
    const { error: deleteError } = await supabase
      .from('questions')
      .delete()
      .eq('exam_id', id)

    if (deleteError) throw deleteError

    // Create new questions with sub-questions
    const createdQuestions = []
    for (let i = 0; i < questions.length; i++) {
      const { subQuestions, ...questionData } = questions[i]

      // Create question
      const { data: createdQuestion, error: questionError } = await supabase
        .from('questions')
        .insert({
          ...questionData,
          exam_id: id,
          question_order: i,
        })
        .select()
        .single()

      if (questionError) throw questionError

      // Create sub-questions if any
      if (subQuestions && subQuestions.length > 0) {
        const subQuestionsData = subQuestions.map((sq, idx) => ({
          ...sq,
          question_id: createdQuestion.id,
          sub_order: idx,
        }))

        const { data: createdSubQuestions, error: subError } = await supabase
          .from('sub_questions')
          .insert(subQuestionsData)
          .select()

        if (subError) throw subError

        createdQuestions.push({
          ...createdQuestion,
          sub_questions: createdSubQuestions || [],
        })
      } else {
        createdQuestions.push({
          ...createdQuestion,
          sub_questions: [],
        })
      }
    }

    return NextResponse.json({
      exam: {
        ...updatedExam,
        questions: createdQuestions,
      },
    })
  } catch (error) {
    console.error('Error updating exam:', error)
    return NextResponse.json(
      { error: 'Failed to update exam' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/exams/[id] - Delete an exam
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    // Verify teacher auth
    const authHeader = request.headers.get('x-teacher-auth')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacherEmail = process.env.TEACHER_EMAIL
    if (authHeader !== teacherEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting exam:', error)
    return NextResponse.json(
      { error: 'Failed to delete exam' },
      { status: 500 }
    )
  }
}
