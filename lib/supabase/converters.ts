/**
 * Utility functions to convert between legacy app types and Supabase database types
 */

import type {
  Exam as LegacyExam,
  Question as LegacyQuestion,
  SubQuestion as LegacySubQuestion,
  ExamResult as LegacyExamResult,
} from '@/types/exam'

import type {
  Exam as DbExam,
  ExamWithQuestions as DbExamWithQuestions,
  Question as DbQuestion,
  QuestionWithSubQuestions as DbQuestionWithSubQuestions,
  SubQuestion as DbSubQuestion,
  ExamSession as DbExamSession,
  ExamSessionWithAnswers as DbExamSessionWithAnswers,
  ExamInsert,
  QuestionInsert,
  SubQuestionInsert,
  StudentAnswer,
  QuestionType,
} from '@/types/supabase'

// ============================================
// EXAM CONVERSIONS
// ============================================

/**
 * Convert database exam to legacy app exam format
 */
export function dbExamToLegacy(dbExam: DbExamWithQuestions): LegacyExam {
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
 * Convert database exam (without questions) to legacy format with empty questions
 */
export function dbExamBasicToLegacy(dbExam: DbExam): LegacyExam {
  return {
    id: dbExam.id,
    title: dbExam.title,
    description: dbExam.description || '',
    grade: dbExam.grade,
    subject: dbExam.subject,
    duration: dbExam.duration,
    questions: [],
    createdAt: new Date(dbExam.created_at),
    updatedAt: new Date(dbExam.updated_at),
    author: dbExam.author_name || '',
    totalPoints: dbExam.total_points,
    isPublished: dbExam.is_published,
  }
}

/**
 * Convert legacy exam to database insert format
 */
export function legacyExamToDbInsert(
  legacyExam: Partial<LegacyExam>,
  authorId?: string
): ExamInsert {
  return {
    id: legacyExam.id,
    title: legacyExam.title || 'Đề thi mới',
    description: legacyExam.description || null,
    grade: legacyExam.grade || 10,
    subject: legacyExam.subject || 'Toán',
    duration: legacyExam.duration || 60,
    is_published: legacyExam.isPublished || false,
    author_id: authorId || null,
    author_name: legacyExam.author || null,
  }
}

// ============================================
// QUESTION CONVERSIONS
// ============================================

/**
 * Convert database question to legacy format
 */
export function dbQuestionToLegacy(dbQuestion: DbQuestionWithSubQuestions): LegacyQuestion {
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
    subQuestions: dbQuestion.sub_questions?.map(dbSubQuestionToLegacy) || undefined,
  }
}

/**
 * Convert legacy question to database insert format
 */
export function legacyQuestionToDbInsert(
  legacyQuestion: LegacyQuestion,
  examId: string,
  order: number
): QuestionInsert {
  return {
    id: legacyQuestion.id,
    exam_id: examId,
    question_order: order,
    question_text: legacyQuestion.question,
    question_type: legacyQuestion.type as QuestionType,
    options: legacyQuestion.options || [],
    correct_answer: String(legacyQuestion.correctAnswer),
    explanation: legacyQuestion.explanation || null,
    points: legacyQuestion.points,
    image_url: legacyQuestion.imageUrl || null,
    image_description: legacyQuestion.imageDescription || null,
    rubric: legacyQuestion.rubric || null,
    sample_answer: legacyQuestion.sampleAnswer || null,
  }
}

/**
 * Get sub-questions insert data from legacy question
 */
export function legacySubQuestionsToDbInsert(
  legacyQuestion: LegacyQuestion
): Omit<SubQuestionInsert, 'question_id'>[] {
  if (!legacyQuestion.subQuestions) return []

  return legacyQuestion.subQuestions.map((sq, index) => ({
    label: sq.label,
    content: sq.content || null,
    is_correct: sq.correct,
    sub_order: index,
  }))
}

// ============================================
// SUB-QUESTION CONVERSIONS
// ============================================

/**
 * Convert database sub-question to legacy format
 */
export function dbSubQuestionToLegacy(dbSubQuestion: DbSubQuestion): LegacySubQuestion {
  return {
    label: dbSubQuestion.label,
    content: dbSubQuestion.content || undefined,
    correct: dbSubQuestion.is_correct,
  }
}

// ============================================
// EXAM RESULT CONVERSIONS
// ============================================

/**
 * Convert database session with answers to legacy ExamResult format
 */
export function dbSessionToLegacyResult(
  session: DbExamSessionWithAnswers,
  answers: StudentAnswer[]
): LegacyExamResult {
  return {
    examId: session.exam_id,
    studentName: session.student_name,
    score: session.score ?? 0,
    totalScore: session.total_score ?? 0,
    percentage: session.percentage ?? 0,
    answers: answers.map(answer => ({
      questionId: answer.question_id,
      userAnswer: parseUserAnswer(answer.user_answer),
      isCorrect: answer.is_correct ?? false,
    })),
    completedAt: session.completed_at ? new Date(session.completed_at) : new Date(),
    timeSpent: session.time_spent ?? 0,
  }
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Parse correct answer from string to appropriate type
 */
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
 * Parse user answer from string to appropriate type
 */
function parseUserAnswer(answer: string | null): number | string {
  if (!answer) return ''

  // Try to parse as number first
  const parsed = parseInt(answer, 10)
  if (!isNaN(parsed) && String(parsed) === answer) {
    return parsed
  }

  return answer
}

/**
 * Calculate score for a set of answers
 */
export function calculateScore(
  answers: Map<string, number | string>,
  questions: LegacyQuestion[]
): { score: number; totalScore: number; details: Array<{ questionId: string; isCorrect: boolean; pointsEarned: number }> } {
  let score = 0
  let totalScore = 0
  const details: Array<{ questionId: string; isCorrect: boolean; pointsEarned: number }> = []

  for (const question of questions) {
    totalScore += question.points
    const userAnswer = answers.get(question.id)
    let isCorrect = false
    let pointsEarned = 0

    if (userAnswer !== undefined) {
      if (question.type === 'true-false' && question.subQuestions) {
        // For true-false with 4 sub-questions, use fixed score table
        // 1 ý đúng = 0.1đ | 2 ý đúng = 0.25đ | 3 ý đúng = 0.5đ | 4 ý đúng = 1đ
        const userAnswers = typeof userAnswer === 'string'
          ? JSON.parse(userAnswer) as Record<string, boolean>
          : {}

        let correctCount = 0
        for (const subQ of question.subQuestions) {
          if (userAnswers[subQ.label] === subQ.correct) {
            correctCount++
          }
        }

        // Fixed score table for 4 sub-questions
        const scoreMap: Record<number, number> = { 0: 0, 1: 0.1, 2: 0.25, 3: 0.5, 4: 1 }
        pointsEarned = scoreMap[correctCount] || 0
        isCorrect = correctCount === 4
      } else if (question.type === 'essay') {
        // Essays need manual grading - mark as pending
        isCorrect = false
        pointsEarned = 0
      } else {
        // Multiple choice or fill-in
        isCorrect = String(userAnswer) === String(question.correctAnswer)
        pointsEarned = isCorrect ? question.points : 0
      }
    }

    score += pointsEarned
    details.push({
      questionId: question.id,
      isCorrect,
      pointsEarned,
    })
  }

  return { score, totalScore, details }
}
