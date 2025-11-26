export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      exam_sessions: {
        Row: {
          completed_at: string | null
          created_at: string
          exam_id: string
          id: string
          percentage: number | null
          score: number | null
          started_at: string
          status: string
          student_id: string | null
          student_name: string
          time_spent: number | null
          total_score: number | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          exam_id: string
          id?: string
          percentage?: number | null
          score?: number | null
          started_at?: string
          status?: string
          student_id?: string | null
          student_name: string
          time_spent?: number | null
          total_score?: number | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          exam_id?: string
          id?: string
          percentage?: number | null
          score?: number | null
          started_at?: string
          status?: string
          student_id?: string | null
          student_name?: string
          time_spent?: number | null
          total_score?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exam_sessions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exam_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      exams: {
        Row: {
          author_id: string | null
          author_name: string | null
          created_at: string
          description: string | null
          duration: number
          grade: number
          id: string
          is_published: boolean
          subject: string
          title: string
          total_points: number
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          created_at?: string
          description?: string | null
          duration?: number
          grade: number
          id?: string
          is_published?: boolean
          subject?: string
          title: string
          total_points?: number
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          created_at?: string
          description?: string | null
          duration?: number
          grade?: number
          id?: string
          is_published?: boolean
          subject?: string
          title?: string
          total_points?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string
          grade: number | null
          id: string
          role: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name: string
          grade?: number | null
          id: string
          role?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string
          grade?: number | null
          id?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      questions: {
        Row: {
          correct_answer: string | null
          created_at: string
          exam_id: string
          explanation: string | null
          id: string
          image_description: string | null
          image_url: string | null
          options: Json | null
          points: number
          question_order: number
          question_text: string
          question_type: string
          rubric: string | null
          sample_answer: string | null
          updated_at: string
        }
        Insert: {
          correct_answer?: string | null
          created_at?: string
          exam_id: string
          explanation?: string | null
          id?: string
          image_description?: string | null
          image_url?: string | null
          options?: Json | null
          points?: number
          question_order?: number
          question_text: string
          question_type: string
          rubric?: string | null
          sample_answer?: string | null
          updated_at?: string
        }
        Update: {
          correct_answer?: string | null
          created_at?: string
          exam_id?: string
          explanation?: string | null
          id?: string
          image_description?: string | null
          image_url?: string | null
          options?: Json | null
          points?: number
          question_order?: number
          question_text?: string
          question_type?: string
          rubric?: string | null
          sample_answer?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_exam_id_fkey"
            columns: ["exam_id"]
            isOneToOne: false
            referencedRelation: "exams"
            referencedColumns: ["id"]
          },
        ]
      }
      student_answers: {
        Row: {
          created_at: string
          id: string
          is_correct: boolean | null
          points_earned: number | null
          question_id: string
          session_id: string
          updated_at: string
          user_answer: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_correct?: boolean | null
          points_earned?: number | null
          question_id: string
          session_id: string
          updated_at?: string
          user_answer?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_correct?: boolean | null
          points_earned?: number | null
          question_id?: string
          session_id?: string
          updated_at?: string
          user_answer?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_answers_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "exam_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sub_questions: {
        Row: {
          content: string | null
          created_at: string
          id: string
          is_correct: boolean
          label: string
          question_id: string
          sub_order: number
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean
          label: string
          question_id: string
          sub_order?: number
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          is_correct?: boolean
          label?: string
          question_id?: string
          sub_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "sub_questions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

// Custom type definitions
export type UserRole = 'student' | 'teacher'
export type QuestionType = 'multiple-choice' | 'true-false' | 'fill-in' | 'essay'
export type ExamSessionStatus = 'in_progress' | 'completed' | 'abandoned'

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Exam = Database['public']['Tables']['exams']['Row']
export type Question = Database['public']['Tables']['questions']['Row']
export type SubQuestion = Database['public']['Tables']['sub_questions']['Row']
export type ExamSession = Database['public']['Tables']['exam_sessions']['Row']
export type StudentAnswer = Database['public']['Tables']['student_answers']['Row']

// Insert types
export type ExamInsert = Database['public']['Tables']['exams']['Insert']
export type QuestionInsert = Database['public']['Tables']['questions']['Insert']
export type SubQuestionInsert = Database['public']['Tables']['sub_questions']['Insert']
export type ExamSessionInsert = Database['public']['Tables']['exam_sessions']['Insert']
export type StudentAnswerInsert = Database['public']['Tables']['student_answers']['Insert']

// Update types
export type ExamUpdate = Database['public']['Tables']['exams']['Update']
export type QuestionUpdate = Database['public']['Tables']['questions']['Update']
export type ExamSessionUpdate = Database['public']['Tables']['exam_sessions']['Update']
export type StudentAnswerUpdate = Database['public']['Tables']['student_answers']['Update']

// Extended types with relations
export interface ExamWithQuestions extends Exam {
  questions: QuestionWithSubQuestions[]
}

export interface QuestionWithSubQuestions extends Question {
  sub_questions: SubQuestion[]
}

export interface ExamSessionWithAnswers extends ExamSession {
  student_answers: StudentAnswer[]
  exam?: Exam
}
