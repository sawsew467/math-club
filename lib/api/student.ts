import { Exam, Question, ExamResult } from '@/types/exam'
import type {
  QuestionType,
} from '@/types/supabase'

// ============================================
// Type Definitions
// ============================================

interface DbExam {
  id: string
  title: string
  description: string | null
  grade: number
  subject: string
  duration: number
  total_points: number
  is_published: boolean
  author_id: string | null
  author_name: string | null
  created_at: string
  updated_at: string
  questions?: DbQuestion[]
  question_count?: number // For list view
}

interface DbQuestion {
  id: string
  exam_id: string
  question_order: number
  question_text: string
  question_type: string
  options: unknown
  correct_answer: string | null
  explanation: string | null
  points: number
  image_url: string | null
  image_description: string | null
  rubric: string | null
  sample_answer: string | null
  sub_questions?: DbSubQuestion[]
}

interface DbSubQuestion {
  id: string
  question_id: string
  label: string
  content: string | null
  is_correct: boolean
  sub_order: number
}

interface DbSession {
  id: string
  exam_id: string
  student_id: string | null
  student_name: string
  started_at: string
  completed_at: string | null
  time_spent: number
  score: number
  total_score: number
  percentage: number
  status: string
  student_answers?: DbStudentAnswer[]
  exam?: DbExam
}

interface DbStudentAnswer {
  id: string
  session_id: string
  question_id: string
  user_answer: string | null
  is_correct: boolean | null
  points_earned: number
  ai_feedback: string | null
}

// ============================================
// Converters
// ============================================

function dbExamToLegacy(dbExam: DbExam): Exam {
  return {
    id: dbExam.id,
    title: dbExam.title,
    description: dbExam.description || '',
    grade: dbExam.grade,
    subject: dbExam.subject,
    duration: dbExam.duration,
    questions: (dbExam.questions || []).map(dbQuestionToLegacy),
    createdAt: new Date(dbExam.created_at),
    updatedAt: new Date(dbExam.updated_at),
    author: dbExam.author_name || '',
    totalPoints: dbExam.total_points,
    isPublished: dbExam.is_published,
  }
}

function dbQuestionToLegacy(dbQuestion: DbQuestion): Question {
  return {
    id: dbQuestion.id,
    question: dbQuestion.question_text,
    imageUrl: dbQuestion.image_url || undefined,
    imageDescription: dbQuestion.image_description || undefined,
    hasImage: !!dbQuestion.image_url,
    options: Array.isArray(dbQuestion.options) ? dbQuestion.options as string[] : [],
    correctAnswer: parseCorrectAnswer(dbQuestion.correct_answer, dbQuestion.question_type),
    explanation: dbQuestion.explanation || '',
    points: dbQuestion.points,
    type: dbQuestion.question_type as QuestionType,
    rubric: dbQuestion.rubric || undefined,
    sampleAnswer: dbQuestion.sample_answer || undefined,
    subQuestions: dbQuestion.sub_questions?.map(sq => ({
      label: sq.label,
      content: sq.content || undefined,
      correct: sq.is_correct,
    })) || undefined,
  }
}

function parseCorrectAnswer(
  answer: string | null,
  questionType: string
): number | string {
  if (!answer) return 0

  if (questionType === 'multiple-choice') {
    const parsed = parseInt(answer, 10)
    return isNaN(parsed) ? 0 : parsed
  }

  return answer
}

function dbSessionToResult(session: DbSession): ExamResult {
  return {
    examId: session.exam_id,
    studentName: session.student_name,
    score: session.score,
    totalScore: session.total_score,
    percentage: session.percentage,
    answers: (session.student_answers || []).map(a => ({
      questionId: a.question_id,
      userAnswer: parseUserAnswer(a.user_answer),
      isCorrect: a.is_correct ?? false,
      pointsEarned: a.points_earned,
      aiFeedback: a.ai_feedback || undefined,
    })),
    completedAt: session.completed_at ? new Date(session.completed_at) : new Date(),
    timeSpent: session.time_spent,
  }
}

function parseUserAnswer(answer: string | null): number | string {
  if (!answer) return ''

  const parsed = parseInt(answer, 10)
  if (!isNaN(parsed) && String(parsed) === answer) {
    return parsed
  }

  return answer
}

// ============================================
// API Functions
// ============================================

export interface StudentApiResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Fetch all published exams
 */
export async function fetchPublishedExams(): Promise<StudentApiResult<Exam[]>> {
  try {
    const response = await fetch('/api/student/exams')

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.error || 'Failed to fetch exams' }
    }

    const { exams } = await response.json()
    const legacyExams = exams.map((e: DbExam) => ({
      ...dbExamToLegacy(e),
      questions: [], // List view doesn't need full questions
      questionCount: e.question_count || 0, // Use the count from API
    }))

    return { success: true, data: legacyExams }
  } catch (error) {
    console.error('Error fetching exams:', error)
    return { success: false, error: 'Network error' }
  }
}

/**
 * Fetch a single published exam with questions
 */
export async function fetchExamForStudent(examId: string): Promise<StudentApiResult<Exam>> {
  try {
    const response = await fetch(`/api/student/exams/${examId}`)

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.error || 'Failed to fetch exam' }
    }

    const { exam } = await response.json()
    const legacyExam = dbExamToLegacy(exam)

    return { success: true, data: legacyExam }
  } catch (error) {
    console.error('Error fetching exam:', error)
    return { success: false, error: 'Network error' }
  }
}

/**
 * Create a new exam session
 */
export async function createExamSession(
  examId: string,
  studentName: string,
  studentId?: string
): Promise<StudentApiResult<{ sessionId: string }>> {
  try {
    const response = await fetch('/api/student/sessions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        examId,
        studentName,
        studentId,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.error || 'Failed to create session' }
    }

    const { session } = await response.json()

    return { success: true, data: { sessionId: session.id } }
  } catch (error) {
    console.error('Error creating session:', error)
    return { success: false, error: 'Network error' }
  }
}

/**
 * Save a single answer
 */
export async function saveAnswer(
  sessionId: string,
  questionId: string,
  userAnswer: string | number,
  isCorrect: boolean,
  pointsEarned: number
): Promise<StudentApiResult<void>> {
  try {
    const response = await fetch(`/api/student/sessions/${sessionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'save_answer',
        questionId,
        userAnswer: String(userAnswer),
        isCorrect,
        pointsEarned,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.error || 'Failed to save answer' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error saving answer:', error)
    return { success: false, error: 'Network error' }
  }
}

/**
 * Complete an exam session with all answers
 */
export async function completeExamSession(
  sessionId: string,
  answers: Array<{
    questionId: string
    userAnswer: string | number
    isCorrect: boolean
    pointsEarned: number
  }>,
  score: number,
  totalScore: number,
  timeSpent: number
): Promise<StudentApiResult<{ sessionId: string }>> {
  try {
    const percentage = totalScore > 0 ? (score / totalScore) * 100 : 0

    const response = await fetch(`/api/student/sessions/${sessionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'complete',
        answers,
        score,
        totalScore,
        percentage,
        timeSpent,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.error || 'Failed to complete session' }
    }

    return { success: true, data: { sessionId } }
  } catch (error) {
    console.error('Error completing session:', error)
    return { success: false, error: 'Network error' }
  }
}

/**
 * Fetch a session with exam and answers (for result page)
 */
export async function fetchSessionResult(
  sessionId: string
): Promise<StudentApiResult<{ exam: Exam; result: ExamResult }>> {
  try {
    const response = await fetch(`/api/student/sessions/${sessionId}`)

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.error || 'Failed to fetch result' }
    }

    const { session } = await response.json() as { session: DbSession }

    if (!session.exam) {
      return { success: false, error: 'Exam not found in session' }
    }

    const exam = dbExamToLegacy(session.exam)
    const result = dbSessionToResult(session)

    return { success: true, data: { exam, result } }
  } catch (error) {
    console.error('Error fetching result:', error)
    return { success: false, error: 'Network error' }
  }
}

/**
 * Fetch student's exam history (completed sessions)
 */
export interface ExamAttempt {
  id: string
  examId: string
  score: number
  totalScore: number
  percentage: number
  completedAt: Date
}

export async function fetchStudentExamHistory(
  studentId: string
): Promise<StudentApiResult<ExamAttempt[]>> {
  try {
    const response = await fetch(`/api/student/sessions?studentId=${studentId}`)

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.error || 'Failed to fetch history' }
    }

    const { sessions } = await response.json()
    const attempts: ExamAttempt[] = (sessions || []).map((s: {
      id: string
      exam_id: string
      score: number
      total_score: number
      percentage: number
      completed_at: string
    }) => ({
      id: s.id,
      examId: s.exam_id,
      score: s.score,
      totalScore: s.total_score,
      percentage: s.percentage,
      completedAt: new Date(s.completed_at),
    }))

    return { success: true, data: attempts }
  } catch (error) {
    console.error('Error fetching history:', error)
    return { success: false, error: 'Network error' }
  }
}

/**
 * Grade an essay question using AI
 */
export interface EssayGradeResult {
  score: number
  feedback: string
  needsManualGrading: boolean
}

export async function gradeEssayQuestion(
  questionText: string,
  studentAnswer: string,
  sampleAnswer: string,
  rubric: string,
  maxPoints: number
): Promise<StudentApiResult<EssayGradeResult>> {
  try {
    const response = await fetch('/api/exam/grade-essay', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        questionText,
        studentAnswer,
        sampleAnswer,
        rubric,
        maxPoints,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.error || 'Failed to grade essay' }
    }

    const result = await response.json()
    return { success: true, data: result }
  } catch (error) {
    console.error('Error grading essay:', error)
    return { success: false, error: 'Network error' }
  }
}
