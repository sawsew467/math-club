-- ============================================
-- Migration: Create Exam Tables for Math Club
-- Created: 2024-11-26
-- Description: Creates tables for exams, questions,
--              exam sessions, and student answers
-- ============================================

-- ============================================
-- 1. EXAMS TABLE
-- Stores exam metadata
-- ============================================
CREATE TABLE IF NOT EXISTS public.exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    grade INTEGER NOT NULL CHECK (grade >= 10 AND grade <= 12),
    subject TEXT NOT NULL DEFAULT 'Toán',
    duration INTEGER NOT NULL DEFAULT 60, -- minutes
    total_points DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_published BOOLEAN NOT NULL DEFAULT false,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    author_name TEXT, -- Cached author name for display
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX IF NOT EXISTS exams_author_id_idx ON public.exams(author_id);
CREATE INDEX IF NOT EXISTS exams_is_published_idx ON public.exams(is_published);
CREATE INDEX IF NOT EXISTS exams_grade_idx ON public.exams(grade);
CREATE INDEX IF NOT EXISTS exams_created_at_idx ON public.exams(created_at DESC);

-- ============================================
-- 2. QUESTIONS TABLE
-- Stores individual questions for exams
-- ============================================
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    question_order INTEGER NOT NULL DEFAULT 0,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK (question_type IN ('multiple-choice', 'true-false', 'fill-in', 'essay')),
    options JSONB DEFAULT '[]'::jsonb, -- Array of option strings for multiple-choice
    correct_answer TEXT, -- Can be index (0-3) or string answer
    explanation TEXT,
    points DECIMAL(10,2) NOT NULL DEFAULT 1,
    image_url TEXT,
    image_description TEXT,
    rubric TEXT, -- Grading criteria for essays
    sample_answer TEXT, -- Sample answer for essays
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS questions_exam_id_idx ON public.questions(exam_id);
CREATE INDEX IF NOT EXISTS questions_order_idx ON public.questions(exam_id, question_order);

-- ============================================
-- 3. SUB_QUESTIONS TABLE
-- For true-false questions with multiple statements (a, b, c, d)
-- ============================================
CREATE TABLE IF NOT EXISTS public.sub_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    label TEXT NOT NULL, -- 'a', 'b', 'c', 'd'
    content TEXT,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    sub_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index
CREATE INDEX IF NOT EXISTS sub_questions_question_id_idx ON public.sub_questions(question_id);

-- ============================================
-- 4. EXAM_SESSIONS TABLE
-- Tracks when a student takes an exam
-- ============================================
CREATE TABLE IF NOT EXISTS public.exam_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    student_name TEXT NOT NULL, -- For display/guest mode
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    time_spent INTEGER DEFAULT 0, -- seconds
    score DECIMAL(10,2) DEFAULT 0,
    total_score DECIMAL(10,2) DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS exam_sessions_exam_id_idx ON public.exam_sessions(exam_id);
CREATE INDEX IF NOT EXISTS exam_sessions_student_id_idx ON public.exam_sessions(student_id);
CREATE INDEX IF NOT EXISTS exam_sessions_status_idx ON public.exam_sessions(status);
CREATE INDEX IF NOT EXISTS exam_sessions_completed_at_idx ON public.exam_sessions(completed_at DESC);

-- ============================================
-- 5. STUDENT_ANSWERS TABLE
-- Stores individual answers for each question
-- ============================================
CREATE TABLE IF NOT EXISTS public.student_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.exam_sessions(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    user_answer TEXT, -- Can be index, string, or JSON for true-false
    is_correct BOOLEAN, -- null for essays that need manual grading
    points_earned DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Ensure one answer per question per session
    UNIQUE(session_id, question_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS student_answers_session_id_idx ON public.student_answers(session_id);
CREATE INDEX IF NOT EXISTS student_answers_question_id_idx ON public.student_answers(question_id);

-- ============================================
-- 6. TRIGGERS FOR updated_at
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for each table
DROP TRIGGER IF EXISTS update_exams_updated_at ON public.exams;
CREATE TRIGGER update_exams_updated_at
    BEFORE UPDATE ON public.exams
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_questions_updated_at ON public.questions;
CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON public.questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_exam_sessions_updated_at ON public.exam_sessions;
CREATE TRIGGER update_exam_sessions_updated_at
    BEFORE UPDATE ON public.exam_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_student_answers_updated_at ON public.student_answers;
CREATE TRIGGER update_student_answers_updated_at
    BEFORE UPDATE ON public.student_answers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 7. FUNCTION TO CALCULATE EXAM TOTAL POINTS
-- ============================================
CREATE OR REPLACE FUNCTION calculate_exam_total_points()
RETURNS TRIGGER AS $$
BEGIN
    -- Update total_points in exams table
    UPDATE public.exams
    SET total_points = (
        SELECT COALESCE(SUM(points), 0)
        FROM public.questions
        WHERE exam_id = COALESCE(NEW.exam_id, OLD.exam_id)
    )
    WHERE id = COALESCE(NEW.exam_id, OLD.exam_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update total_points when questions change
DROP TRIGGER IF EXISTS update_exam_total_points_insert ON public.questions;
CREATE TRIGGER update_exam_total_points_insert
    AFTER INSERT ON public.questions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_exam_total_points();

DROP TRIGGER IF EXISTS update_exam_total_points_update ON public.questions;
CREATE TRIGGER update_exam_total_points_update
    AFTER UPDATE OF points ON public.questions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_exam_total_points();

DROP TRIGGER IF EXISTS update_exam_total_points_delete ON public.questions;
CREATE TRIGGER update_exam_total_points_delete
    AFTER DELETE ON public.questions
    FOR EACH ROW
    EXECUTE FUNCTION calculate_exam_total_points();

-- ============================================
-- 8. ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sub_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_answers ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 9. RLS POLICIES FOR EXAMS
-- ============================================

-- Anyone can view published exams
CREATE POLICY "Anyone can view published exams"
    ON public.exams
    FOR SELECT
    USING (is_published = true);

-- Teachers can view all their own exams (published or draft)
CREATE POLICY "Teachers can view own exams"
    ON public.exams
    FOR SELECT
    TO authenticated
    USING (
        author_id = auth.uid()
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'teacher'
        )
    );

-- Teachers can create exams
CREATE POLICY "Teachers can create exams"
    ON public.exams
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'teacher'
        )
    );

-- Teachers can update their own exams
CREATE POLICY "Teachers can update own exams"
    ON public.exams
    FOR UPDATE
    TO authenticated
    USING (author_id = auth.uid())
    WITH CHECK (author_id = auth.uid());

-- Teachers can delete their own exams
CREATE POLICY "Teachers can delete own exams"
    ON public.exams
    FOR DELETE
    TO authenticated
    USING (author_id = auth.uid());

-- ============================================
-- 10. RLS POLICIES FOR QUESTIONS
-- ============================================

-- Anyone can view questions of published exams
CREATE POLICY "Anyone can view questions of published exams"
    ON public.questions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.exams
            WHERE id = questions.exam_id AND is_published = true
        )
    );

-- Teachers can view questions of their own exams
CREATE POLICY "Teachers can view own exam questions"
    ON public.questions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.exams
            WHERE id = questions.exam_id AND author_id = auth.uid()
        )
    );

-- Teachers can create questions for their own exams
CREATE POLICY "Teachers can create questions"
    ON public.questions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.exams
            WHERE id = exam_id AND author_id = auth.uid()
        )
    );

-- Teachers can update questions of their own exams
CREATE POLICY "Teachers can update own questions"
    ON public.questions
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.exams
            WHERE id = questions.exam_id AND author_id = auth.uid()
        )
    );

-- Teachers can delete questions of their own exams
CREATE POLICY "Teachers can delete own questions"
    ON public.questions
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.exams
            WHERE id = questions.exam_id AND author_id = auth.uid()
        )
    );

-- ============================================
-- 11. RLS POLICIES FOR SUB_QUESTIONS
-- ============================================

-- Anyone can view sub_questions of questions in published exams
CREATE POLICY "Anyone can view sub_questions of published exams"
    ON public.sub_questions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.questions q
            JOIN public.exams e ON e.id = q.exam_id
            WHERE q.id = sub_questions.question_id AND e.is_published = true
        )
    );

-- Teachers can view sub_questions of their own exams
CREATE POLICY "Teachers can view own sub_questions"
    ON public.sub_questions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.questions q
            JOIN public.exams e ON e.id = q.exam_id
            WHERE q.id = sub_questions.question_id AND e.author_id = auth.uid()
        )
    );

-- Teachers can create sub_questions for their own exams
CREATE POLICY "Teachers can create sub_questions"
    ON public.sub_questions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.questions q
            JOIN public.exams e ON e.id = q.exam_id
            WHERE q.id = question_id AND e.author_id = auth.uid()
        )
    );

-- Teachers can update sub_questions of their own exams
CREATE POLICY "Teachers can update own sub_questions"
    ON public.sub_questions
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.questions q
            JOIN public.exams e ON e.id = q.exam_id
            WHERE q.id = sub_questions.question_id AND e.author_id = auth.uid()
        )
    );

-- Teachers can delete sub_questions of their own exams
CREATE POLICY "Teachers can delete own sub_questions"
    ON public.sub_questions
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.questions q
            JOIN public.exams e ON e.id = q.exam_id
            WHERE q.id = sub_questions.question_id AND e.author_id = auth.uid()
        )
    );

-- ============================================
-- 12. RLS POLICIES FOR EXAM_SESSIONS
-- ============================================

-- Students can view their own sessions
CREATE POLICY "Students can view own sessions"
    ON public.exam_sessions
    FOR SELECT
    TO authenticated
    USING (student_id = auth.uid());

-- Anonymous users can view sessions by ID (for result pages)
CREATE POLICY "Anyone can view sessions by direct access"
    ON public.exam_sessions
    FOR SELECT
    USING (true); -- Allow all reads, controlled by application

-- Students can create sessions
CREATE POLICY "Authenticated users can create sessions"
    ON public.exam_sessions
    FOR INSERT
    TO authenticated
    WITH CHECK (student_id = auth.uid());

-- Allow anonymous session creation (for guest mode)
CREATE POLICY "Anyone can create sessions"
    ON public.exam_sessions
    FOR INSERT
    WITH CHECK (student_id IS NULL);

-- Students can update their own sessions
CREATE POLICY "Students can update own sessions"
    ON public.exam_sessions
    FOR UPDATE
    TO authenticated
    USING (student_id = auth.uid());

-- Allow anonymous session updates
CREATE POLICY "Anyone can update own sessions"
    ON public.exam_sessions
    FOR UPDATE
    USING (student_id IS NULL);

-- Teachers can view sessions for their exams
CREATE POLICY "Teachers can view exam sessions"
    ON public.exam_sessions
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.exams
            WHERE id = exam_sessions.exam_id AND author_id = auth.uid()
        )
    );

-- ============================================
-- 13. RLS POLICIES FOR STUDENT_ANSWERS
-- ============================================

-- Students can view their own answers
CREATE POLICY "Students can view own answers"
    ON public.student_answers
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.exam_sessions
            WHERE id = student_answers.session_id AND student_id = auth.uid()
        )
    );

-- Anyone can view answers (for result pages)
CREATE POLICY "Anyone can view answers by session"
    ON public.student_answers
    FOR SELECT
    USING (true);

-- Students can create answers for their sessions
CREATE POLICY "Students can create answers"
    ON public.student_answers
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.exam_sessions
            WHERE id = session_id AND student_id = auth.uid()
        )
    );

-- Allow anonymous answer creation
CREATE POLICY "Anyone can create answers for anonymous sessions"
    ON public.student_answers
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.exam_sessions
            WHERE id = session_id AND student_id IS NULL
        )
    );

-- Students can update their own answers
CREATE POLICY "Students can update own answers"
    ON public.student_answers
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.exam_sessions
            WHERE id = student_answers.session_id AND student_id = auth.uid()
        )
    );

-- Allow anonymous answer updates
CREATE POLICY "Anyone can update anonymous answers"
    ON public.student_answers
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.exam_sessions
            WHERE id = student_answers.session_id AND student_id IS NULL
        )
    );

-- Teachers can view answers for their exams
CREATE POLICY "Teachers can view exam answers"
    ON public.student_answers
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.exam_sessions es
            JOIN public.exams e ON e.id = es.exam_id
            WHERE es.id = student_answers.session_id AND e.author_id = auth.uid()
        )
    );

-- ============================================
-- 14. GRANT PERMISSIONS
-- ============================================
GRANT ALL ON public.exams TO authenticated;
GRANT ALL ON public.questions TO authenticated;
GRANT ALL ON public.sub_questions TO authenticated;
GRANT ALL ON public.exam_sessions TO authenticated;
GRANT ALL ON public.student_answers TO authenticated;

-- Grant permissions for anonymous users
GRANT SELECT ON public.exams TO anon;
GRANT SELECT ON public.questions TO anon;
GRANT SELECT ON public.sub_questions TO anon;
GRANT SELECT, INSERT, UPDATE ON public.exam_sessions TO anon;
GRANT SELECT, INSERT, UPDATE ON public.student_answers TO anon;
