import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * GET /api/student/sessions - Get student's exam history
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json(
        { error: 'studentId is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Get completed sessions for this student
    const { data: sessions, error } = await supabase
      .from('exam_sessions')
      .select('id, exam_id, score, total_score, percentage, completed_at, status')
      .eq('student_id', studentId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ sessions: sessions || [] })
  } catch (error) {
    console.error('Error fetching student sessions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/student/sessions - Create a new exam session
 * Deletes any previous sessions for this student+exam before creating a new one
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { examId, studentName, studentId } = body

    if (!examId || !studentName) {
      return NextResponse.json(
        { error: 'examId and studentName are required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Delete previous sessions for this student+exam (only keep latest)
    if (studentId) {
      // First get session IDs to delete their answers
      const { data: oldSessions } = await supabase
        .from('exam_sessions')
        .select('id')
        .eq('exam_id', examId)
        .eq('student_id', studentId)

      if (oldSessions && oldSessions.length > 0) {
        const sessionIds = oldSessions.map(s => s.id)

        // Delete student answers first (foreign key constraint)
        await supabase
          .from('student_answers')
          .delete()
          .in('session_id', sessionIds)

        // Then delete the sessions
        await supabase
          .from('exam_sessions')
          .delete()
          .in('id', sessionIds)
      }
    }

    // Create new session
    const { data: session, error } = await supabase
      .from('exam_sessions')
      .insert({
        exam_id: examId,
        student_name: studentName,
        student_id: studentId || null,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ session })
  } catch (error) {
    console.error('Error creating session:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}
