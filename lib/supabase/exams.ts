import { createClient } from './client'
import type {
  Exam,
  ExamInsert,
  ExamUpdate,
  ExamWithQuestions,
  Question,
  QuestionInsert,
  QuestionUpdate,
  QuestionWithSubQuestions,
  SubQuestion,
  SubQuestionInsert,
} from '@/types/supabase'

// ============================================
// EXAM FUNCTIONS
// ============================================

/**
 * Get all published exams (for students)
 */
export async function getPublishedExams(): Promise<Exam[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('is_published', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get all exams for a teacher (including drafts)
 */
export async function getTeacherExams(authorId: string): Promise<Exam[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('author_id', authorId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get all exams (for teacher dashboard - includes all their exams)
 */
export async function getAllExams(): Promise<Exam[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

/**
 * Get a single exam by ID
 */
export async function getExamById(id: string): Promise<Exam | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  return data
}

/**
 * Get exam with all questions and sub-questions
 */
export async function getExamWithQuestions(id: string): Promise<ExamWithQuestions | null> {
  const supabase = createClient()

  // Get exam
  const { data: exam, error: examError } = await supabase
    .from('exams')
    .select('*')
    .eq('id', id)
    .single()

  if (examError) {
    if (examError.code === 'PGRST116') return null
    throw examError
  }

  // Get questions with sub_questions
  const { data: questions, error: questionsError } = await supabase
    .from('questions')
    .select(`
      *,
      sub_questions (*)
    `)
    .eq('exam_id', id)
    .order('question_order', { ascending: true })

  if (questionsError) throw questionsError

  return {
    ...exam,
    questions: (questions || []) as QuestionWithSubQuestions[],
  }
}

/**
 * Create a new exam
 */
export async function createExam(exam: ExamInsert): Promise<Exam> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exams')
    .insert(exam)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update an exam
 */
export async function updateExam(id: string, updates: ExamUpdate): Promise<Exam> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('exams')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete an exam (cascades to questions, sub_questions, sessions, answers)
 */
export async function deleteExam(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('exams')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Publish/unpublish an exam
 */
export async function toggleExamPublished(id: string, isPublished: boolean): Promise<Exam> {
  return updateExam(id, { is_published: isPublished })
}

// ============================================
// QUESTION FUNCTIONS
// ============================================

/**
 * Get all questions for an exam
 */
export async function getQuestionsByExamId(examId: string): Promise<QuestionWithSubQuestions[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('questions')
    .select(`
      *,
      sub_questions (*)
    `)
    .eq('exam_id', examId)
    .order('question_order', { ascending: true })

  if (error) throw error
  return (data || []) as QuestionWithSubQuestions[]
}

/**
 * Create a new question
 */
export async function createQuestion(question: QuestionInsert): Promise<Question> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('questions')
    .insert(question)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Create question with sub-questions (for true-false type)
 */
export async function createQuestionWithSubQuestions(
  question: QuestionInsert,
  subQuestions: Omit<SubQuestionInsert, 'question_id'>[]
): Promise<QuestionWithSubQuestions> {
  const supabase = createClient()

  // Create the question first
  const { data: createdQuestion, error: questionError } = await supabase
    .from('questions')
    .insert(question)
    .select()
    .single()

  if (questionError) throw questionError

  // Create sub-questions if any
  if (subQuestions.length > 0) {
    const subQuestionsWithQuestionId = subQuestions.map((sq, index) => ({
      ...sq,
      question_id: createdQuestion.id,
      sub_order: index,
    }))

    const { data: createdSubQuestions, error: subError } = await supabase
      .from('sub_questions')
      .insert(subQuestionsWithQuestionId)
      .select()

    if (subError) throw subError

    return {
      ...createdQuestion,
      sub_questions: createdSubQuestions || [],
    }
  }

  return {
    ...createdQuestion,
    sub_questions: [],
  }
}

/**
 * Update a question
 */
export async function updateQuestion(id: string, updates: QuestionUpdate): Promise<Question> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('questions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update question with sub-questions
 */
export async function updateQuestionWithSubQuestions(
  id: string,
  updates: QuestionUpdate,
  subQuestions: Omit<SubQuestionInsert, 'question_id'>[]
): Promise<QuestionWithSubQuestions> {
  const supabase = createClient()

  // Update the question
  const { data: updatedQuestion, error: questionError } = await supabase
    .from('questions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (questionError) throw questionError

  // Delete existing sub-questions
  const { error: deleteError } = await supabase
    .from('sub_questions')
    .delete()
    .eq('question_id', id)

  if (deleteError) throw deleteError

  // Create new sub-questions if any
  if (subQuestions.length > 0) {
    const subQuestionsWithQuestionId = subQuestions.map((sq, index) => ({
      ...sq,
      question_id: id,
      sub_order: index,
    }))

    const { data: createdSubQuestions, error: subError } = await supabase
      .from('sub_questions')
      .insert(subQuestionsWithQuestionId)
      .select()

    if (subError) throw subError

    return {
      ...updatedQuestion,
      sub_questions: createdSubQuestions || [],
    }
  }

  return {
    ...updatedQuestion,
    sub_questions: [],
  }
}

/**
 * Delete a question (cascades to sub_questions and student_answers)
 */
export async function deleteQuestion(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', id)

  if (error) throw error
}

/**
 * Reorder questions in an exam
 */
export async function reorderQuestions(
  examId: string,
  questionOrders: { id: string; order: number }[]
): Promise<void> {
  const supabase = createClient()

  // Update each question's order
  for (const { id, order } of questionOrders) {
    const { error } = await supabase
      .from('questions')
      .update({ question_order: order })
      .eq('id', id)
      .eq('exam_id', examId)

    if (error) throw error
  }
}

// ============================================
// SUB-QUESTION FUNCTIONS
// ============================================

/**
 * Get sub-questions for a question
 */
export async function getSubQuestionsByQuestionId(questionId: string): Promise<SubQuestion[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('sub_questions')
    .select('*')
    .eq('question_id', questionId)
    .order('sub_order', { ascending: true })

  if (error) throw error
  return data || []
}

/**
 * Create a sub-question
 */
export async function createSubQuestion(subQuestion: SubQuestionInsert): Promise<SubQuestion> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('sub_questions')
    .insert(subQuestion)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete a sub-question
 */
export async function deleteSubQuestion(id: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('sub_questions')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// ============================================
// BULK OPERATIONS
// ============================================

/**
 * Save exam with all questions (for editor save)
 * This will create/update the exam and all its questions
 */
export async function saveExamWithQuestions(
  exam: ExamInsert | (ExamUpdate & { id: string }),
  questions: (QuestionInsert & { subQuestions?: Omit<SubQuestionInsert, 'question_id'>[] })[]
): Promise<ExamWithQuestions> {
  const supabase = createClient()
  const isUpdate = 'id' in exam && exam.id

  let savedExam: Exam

  if (isUpdate) {
    // Update existing exam
    const { id, ...updates } = exam
    const examId = id as string
    const { data, error } = await supabase
      .from('exams')
      .update(updates)
      .eq('id', examId)
      .select()
      .single()

    if (error) throw error
    savedExam = data

    // Delete existing questions (will cascade to sub_questions)
    const { error: deleteError } = await supabase
      .from('questions')
      .delete()
      .eq('exam_id', examId)

    if (deleteError) throw deleteError
  } else {
    // Create new exam
    const { data, error } = await supabase
      .from('exams')
      .insert(exam as ExamInsert)
      .select()
      .single()

    if (error) throw error
    savedExam = data
  }

  // Create all questions
  const savedQuestions: QuestionWithSubQuestions[] = []

  for (let i = 0; i < questions.length; i++) {
    const { subQuestions, ...questionData } = questions[i]

    const questionInsert: QuestionInsert = {
      ...questionData,
      exam_id: savedExam.id,
      question_order: i,
    }

    const savedQuestion = await createQuestionWithSubQuestions(
      questionInsert,
      subQuestions || []
    )

    savedQuestions.push(savedQuestion)
  }

  return {
    ...savedExam,
    questions: savedQuestions,
  }
}
