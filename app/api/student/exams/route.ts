import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/student/exams - Get all published exams with question count
 */
export async function GET(_request: NextRequest) {
  try {
    const supabase = createAdminClient()

    // Get exams with question count using a join
    const { data: exams, error } = await supabase
      .from('exams')
      .select(`
        *,
        questions (id)
      `)
      .eq('is_published', true)
      .order('created_at', { ascending: false })

    if (error) throw error

    // Transform to include question_count
    const examsWithCount = (exams || []).map(exam => {
      const { questions, ...rest } = exam as { questions: { id: string }[], [key: string]: unknown }
      return {
        ...rest,
        question_count: questions?.length || 0
      }
    })

    return NextResponse.json({ exams: examsWithCount })
  } catch (error) {
    console.error('Error fetching published exams:', error)
    return NextResponse.json(
      { error: 'Failed to fetch exams' },
      { status: 500 }
    )
  }
}
