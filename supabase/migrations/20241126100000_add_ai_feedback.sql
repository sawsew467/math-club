-- ============================================
-- Migration: Add AI Feedback column
-- Created: 2024-11-26
-- Description: Adds ai_feedback column to student_answers
--              for storing AI grading feedback on essay questions
-- ============================================

-- Add ai_feedback column to student_answers table
ALTER TABLE public.student_answers
ADD COLUMN IF NOT EXISTS ai_feedback TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.student_answers.ai_feedback IS 'AI-generated feedback for essay questions';
