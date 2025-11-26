import { createClient } from './client'
import type {
  ExamSession,
  ExamSessionInsert,
  ExamSessionUpdate,
  ExamSessionWithAnswers,
  StudentAnswer,
  StudentAnswerInsert,
  StudentAnswerUpdate,
} from '@/types/supabase'

// ============================================
// EXAM SESSION FUNCTIONS
// ============================================

/**
 * Create a new exam session (when student starts an exam)
 */
export async function createExamSession(session: ExamSessionInsert): Promise<ExamSession> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exam_sessions')
    .insert(session)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get an exam session by ID
 */
export async function getExamSessionById(id: string): Promise<ExamSession | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exam_sessions')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

/**
 * Get exam session with answers and exam details
 */
export async function getExamSessionWithDetails(id: string): Promise<ExamSessionWithAnswers | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('exam_sessions')
    .select(`
      *,
      student_answers (*),
      exam:exams (*)
    `)
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data as ExamSessionWithAnswers
}

/**
 * Get sessions for a specific exam (for teacher to view submissions)
 */
export async function getSessionsByExamId(examId: string): Promise<ExamSession[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exam_sessions')
    .select('*')
    .eq('exam_id', examId)
    .order('completed_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get sessions for a student
 */
export async function getSessionsByStudentId(studentId: string): Promise<ExamSession[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exam_sessions')
    .select('*')
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get completed sessions for a specific exam by a student
 */
export async function getStudentExamResults(
  examId: string,
  studentId?: string
): Promise<ExamSession[]> {
  const supabase = createClient()
  let query = supabase
    .from('exam_sessions')
    .select('*')
    .eq('exam_id', examId)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })

  if (studentId) {
    query = query.eq('student_id', studentId)
  }

  const { data, error } = await query

  if (error) throw error
  return data || []
}

/**
 * Update an exam session
 */
export async function updateExamSession(
  id: string,
  updates: ExamSessionUpdate
): Promise<ExamSession> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exam_sessions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Complete an exam session with final score
 */
export async function completeExamSession(
  id: string,
  score: number,
  totalScore: number,
  timeSpent: number
): Promise<ExamSession> {
  const percentage = totalScore > 0 ? (score / totalScore) * 100 : 0

  return updateExamSession(id, {
    status: 'completed',
    completed_at: new Date().toISOString(),
    score,
    total_score: totalScore,
    percentage,
    time_spent: timeSpent,
  })
}

/**
 * Abandon an exam session
 */
export async function abandonExamSession(id: string): Promise<ExamSession> {
  return updateExamSession(id, {
    status: 'abandoned',
    completed_at: new Date().toISOString(),
  })
}

// ============================================
// STUDENT ANSWER FUNCTIONS
// ============================================

/**
 * Save or update a student answer
 */
export async function saveStudentAnswer(answer: StudentAnswerInsert): Promise<StudentAnswer> {
  const supabase = createClient()

  // Use upsert to handle both insert and update
  const { data, error } = await supabase
    .from('student_answers')
    .upsert(answer, {
      onConflict: 'session_id,question_id',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get all answers for a session
 */
export async function getAnswersBySessionId(sessionId: string): Promise<StudentAnswer[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('student_answers')
    .select('*')
    .eq('session_id', sessionId)

  if (error) throw error
  return data || []
}

/**
 * Get a specific answer
 */
export async function getAnswer(
  sessionId: string,
  questionId: string
): Promise<StudentAnswer | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('student_answers')
    .select('*')
    .eq('session_id', sessionId)
    .eq('question_id', questionId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  return data
}

/**
 * Update a student answer
 */
export async function updateStudentAnswer(
  id: string,
  updates: StudentAnswerUpdate
): Promise<StudentAnswer> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('student_answers')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Batch save answers (for submitting exam)
 */
export async function batchSaveAnswers(
  answers: StudentAnswerInsert[]
): Promise<StudentAnswer[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('student_answers')
    .upsert(answers, {
      onConflict: 'session_id,question_id',
    })
    .select()

  if (error) throw error
  return data || []
}

// ============================================
// STATISTICS FUNCTIONS
// ============================================

/**
 * Get exam statistics for a teacher
 */
export async function getExamStatistics(examId: string): Promise<{
  totalSessions: number
  completedSessions: number
  averageScore: number
  averagePercentage: number
  highestScore: number
  lowestScore: number
}> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('exam_sessions')
    .select('score, total_score, percentage, status')
    .eq('exam_id', examId)

  if (error) throw error

  const sessions = data || []
  const completedSessions = sessions.filter(s => s.status === 'completed')

  if (completedSessions.length === 0) {
    return {
      totalSessions: sessions.length,
      completedSessions: 0,
      averageScore: 0,
      averagePercentage: 0,
      highestScore: 0,
      lowestScore: 0,
    }
  }

  const scores = completedSessions.map(s => s.score ?? 0)
  const percentages = completedSessions.map(s => s.percentage ?? 0)

  return {
    totalSessions: sessions.length,
    completedSessions: completedSessions.length,
    averageScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0,
    averagePercentage: percentages.length > 0 ? percentages.reduce((a, b) => a + b, 0) / percentages.length : 0,
    highestScore: scores.length > 0 ? Math.max(...scores) : 0,
    lowestScore: scores.length > 0 ? Math.min(...scores) : 0,
  }
}

/**
 * Check if a student has already completed an exam
 */
export async function hasCompletedExam(
  examId: string,
  studentId?: string,
  studentName?: string
): Promise<ExamSession | null> {
  const supabase = createClient()
  let query = supabase
    .from('exam_sessions')
    .select('*')
    .eq('exam_id', examId)
    .eq('status', 'completed')

  if (studentId) {
    query = query.eq('student_id', studentId)
  } else if (studentName) {
    query = query.eq('student_name', studentName)
  }

  const { data, error } = await query.limit(1).single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data
}
