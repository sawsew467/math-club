import { Exam, Question } from '@/types/exam'
import type {
  ExamWithQuestions as DbExamWithQuestions,
  QuestionWithSubQuestions as DbQuestionWithSubQuestions,
  QuestionType,
} from '@/types/supabase'

/**
 * Get teacher email from localStorage for API auth
 */
function getTeacherAuth(): string | null {
  if (typeof window === 'undefined') return null
  const auth = localStorage.getItem('teacherAuth')
  if (!auth) return null
  try {
    const parsed = JSON.parse(auth)
    return parsed.email
  } catch {
    return null
  }
}

/**
 * Convert DB exam to legacy format
 */
function dbExamToLegacy(dbExam: DbExamWithQuestions): Exam {
  return {
    id: dbExam.id,
    title: dbExam.title,
    description: dbExam.description || '',
    grade: dbExam.grade,
    subject: dbExam.subject,
    duration: dbExam.duration,
    questions: dbExam.questions.map(dbQuestionToLegacy),
    createdAt: new Date(dbExam.created_at),
    updatedAt: new Date(dbExam.updated_at),
    author: dbExam.author_name || '',
    totalPoints: dbExam.total_points,
    isPublished: dbExam.is_published,
  }
}

/**
 * Convert DB question to legacy format
 */
function dbQuestionToLegacy(dbQuestion: DbQuestionWithSubQuestions): Question {
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

/**
 * Convert legacy question to DB format for API
 */
function legacyQuestionToApi(question: Question) {
  return {
    question_text: question.question,
    question_type: question.type as QuestionType,
    options: question.options || [],
    correct_answer: String(question.correctAnswer),
    explanation: question.explanation || null,
    points: question.points,
    image_url: question.imageUrl || null,
    image_description: question.imageDescription || null,
    rubric: question.rubric || null,
    sample_answer: question.sampleAnswer || null,
    subQuestions: question.subQuestions?.map(sq => ({
      label: sq.label,
      content: sq.content || null,
      is_correct: sq.correct,
    })) || [],
  }
}

// ============================================
// API FUNCTIONS
// ============================================

export interface ExamApiResult {
  success: boolean
  data?: Exam[]
  error?: string
}

export interface SingleExamApiResult {
  success: boolean
  data?: Exam
  error?: string
}

/**
 * Fetch all exams for teacher
 */
export async function fetchExams(): Promise<ExamApiResult> {
  try {
    const teacherAuth = getTeacherAuth()
    if (!teacherAuth) {
      return { success: false, error: 'Not authenticated' }
    }

    const response = await fetch('/api/exams', {
      headers: {
        'x-teacher-auth': teacherAuth,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.error || 'Failed to fetch exams' }
    }

    const { exams } = await response.json()
    const legacyExams = exams.map(dbExamToLegacy)

    return { success: true, data: legacyExams }
  } catch (error) {
    console.error('Error fetching exams:', error)
    return { success: false, error: 'Network error' }
  }
}

/**
 * Fetch a single exam by ID
 */
export async function fetchExamById(id: string): Promise<SingleExamApiResult> {
  try {
    const response = await fetch(`/api/exams/${id}`)

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
 * Create a new exam
 */
export async function createExam(examData: Partial<Exam>): Promise<SingleExamApiResult> {
  try {
    const teacherAuth = getTeacherAuth()
    if (!teacherAuth) {
      return { success: false, error: 'Not authenticated' }
    }

    const apiExam = {
      title: examData.title || 'Untitled Exam',
      description: examData.description || null,
      grade: examData.grade || 10,
      subject: examData.subject || 'Toán',
      duration: examData.duration || 60,
      is_published: examData.isPublished || false,
    }

    const apiQuestions = (examData.questions || []).map(legacyQuestionToApi)

    const response = await fetch('/api/exams', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-teacher-auth': teacherAuth,
      },
      body: JSON.stringify({
        exam: apiExam,
        questions: apiQuestions,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.error || 'Failed to create exam' }
    }

    const { exam } = await response.json()
    const legacyExam = dbExamToLegacy(exam)

    return { success: true, data: legacyExam }
  } catch (error) {
    console.error('Error creating exam:', error)
    return { success: false, error: 'Network error' }
  }
}

/**
 * Update an existing exam
 */
export async function updateExam(id: string, examData: Partial<Exam>): Promise<SingleExamApiResult> {
  try {
    const teacherAuth = getTeacherAuth()
    if (!teacherAuth) {
      return { success: false, error: 'Not authenticated' }
    }

    const apiExam = {
      title: examData.title,
      description: examData.description || null,
      grade: examData.grade,
      subject: examData.subject,
      duration: examData.duration,
      is_published: examData.isPublished,
    }

    const apiQuestions = (examData.questions || []).map(legacyQuestionToApi)

    const response = await fetch(`/api/exams/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'x-teacher-auth': teacherAuth,
      },
      body: JSON.stringify({
        exam: apiExam,
        questions: apiQuestions,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.error || 'Failed to update exam' }
    }

    const { exam } = await response.json()
    const legacyExam = dbExamToLegacy(exam)

    return { success: true, data: legacyExam }
  } catch (error) {
    console.error('Error updating exam:', error)
    return { success: false, error: 'Network error' }
  }
}

/**
 * Delete an exam
 */
export async function deleteExam(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const teacherAuth = getTeacherAuth()
    if (!teacherAuth) {
      return { success: false, error: 'Not authenticated' }
    }

    const response = await fetch(`/api/exams/${id}`, {
      method: 'DELETE',
      headers: {
        'x-teacher-auth': teacherAuth,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.error || 'Failed to delete exam' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error deleting exam:', error)
    return { success: false, error: 'Network error' }
  }
}

/**
 * Get exam statistics
 */
export async function fetchExamStats(examId: string): Promise<{
  success: boolean
  data?: {
    totalSessions: number
    completedSessions: number
    averageScore: number
    averagePercentage: number
    highestScore: number
    lowestScore: number
  }
  error?: string
}> {
  try {
    const teacherAuth = getTeacherAuth()
    if (!teacherAuth) {
      return { success: false, error: 'Not authenticated' }
    }

    const response = await fetch(`/api/exams/${examId}/stats`, {
      headers: {
        'x-teacher-auth': teacherAuth,
      },
    })

    if (!response.ok) {
      const error = await response.json()
      return { success: false, error: error.error || 'Failed to fetch stats' }
    }

    const data = await response.json()
    return { success: true, data }
  } catch (error) {
    console.error('Error fetching exam stats:', error)
    return { success: false, error: 'Network error' }
  }
}
