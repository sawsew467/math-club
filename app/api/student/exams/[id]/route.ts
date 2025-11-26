import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/student/exams/[id] - Get a published exam with questions for students
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const supabase = createAdminClient()

    // Get exam (only if published)
    const { data: exam, error: examError } = await supabase
      .from('exams')
      .select('*')
      .eq('id', id)
      .eq('is_published', true)
      .single()

    if (examError) {
      if (examError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Exam not found or not published' }, { status: 404 })
      }
      throw examError
    }

    // Define types for query result
    type SubQuestionRow = {
      sub_order: number
      [key: string]: unknown
    }

    type QuestionRow = {
      sub_questions?: SubQuestionRow[]
      [key: string]: unknown
    }

    // Get questions with sub_questions
    const { data: questionsData, error: questionsError } = await supabase
      .from('questions')
      .select(`
        *,
        sub_questions (*)
      `)
      .eq('exam_id', id)
      .order('question_order', { ascending: true })

    if (questionsError) throw questionsError

    const questions = questionsData as unknown as QuestionRow[]

    // Sort sub_questions by order
    const sortedQuestions = (questions || []).map(q => ({
      ...q,
      sub_questions: (q.sub_questions || []).sort((a, b) => a.sub_order - b.sub_order)
    }))

    return NextResponse.json({
      exam: {
        ...exam,
        questions: sortedQuestions,
      },
    })
  } catch (error) {
    console.error('Error fetching exam:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exam' },
      { status: 500 }
    )
  }
}
