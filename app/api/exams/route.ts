import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { ExamInsert, QuestionInsert, SubQuestionInsert } from '@/types/supabase'

/**
 * GET /api/exams - Get all exams (for teachers)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify teacher auth from header
    const authHeader = request.headers.get('x-teacher-auth')
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const teacherEmail = process.env.TEACHER_EMAIL
    if (authHeader !== teacherEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createAdminClient()

    // Get all exams with questions
    const { data: exams, error } = await supabase
      .from('exams')
      .select(`
        *,
        questions (
          *,
          sub_questions (*)
        )
      `)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Sort questions by order
    const examsWithSortedQuestions = exams?.map(exam => ({
      ...exam,
      questions: exam.questions
        ?.sort((a: { question_order: number }, b: { question_order: number }) => a.question_order - b.question_order)
        .map((q: { sub_questions?: { sub_order: number }[] }) => ({
          ...q,
          sub_questions: q.sub_questions?.sort((a: { sub_order: number }, b: { sub_order: number }) => a.sub_order - b.sub_order) || []
        }))
    })) || []

    return NextResponse.json({ exams: examsWithSortedQuestions })
  } catch (error) {
    console.error('Error fetching exams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exams' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/exams - Create a new exam with questions
 */
export async function POST(request: NextRequest) {
  try {
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
      exam: ExamInsert
      questions: (QuestionInsert & { subQuestions?: Omit<SubQuestionInsert, 'question_id'>[] })[]
    }

    const supabase = createAdminClient()

    // Create exam
    const { data: createdExam, error: examError } = await supabase
      .from('exams')
      .insert({
        ...exam,
        author_name: 'Giáo viên',
      })
      .select()
      .single()

    if (examError) throw examError

    // Create questions with sub-questions
    const createdQuestions = []
    for (let i = 0; i < questions.length; i++) {
      const { subQuestions, ...questionData } = questions[i]

      // Create question
      const { data: createdQuestion, error: questionError } = await supabase
        .from('questions')
        .insert({
          ...questionData,
          exam_id: createdExam.id,
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
        ...createdExam,
        questions: createdQuestions,
      },
    })
  } catch (error) {
    console.error('Error creating exam:', error)
    return NextResponse.json(
      { error: 'Failed to create exam' },
      { status: 500 }
    )
  }
}
