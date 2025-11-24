import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Exam, Question, ExamResult } from '@/types/exam';

interface ExamStore {
  // Exams
  exams: Exam[];
  addExam: (exam: Exam) => void;
  updateExam: (id: string, exam: Partial<Exam>) => void;
  deleteExam: (id: string) => void;
  getExam: (id: string) => Exam | undefined;

  // Current exam being taken
  currentExam: Exam | null;
  setCurrentExam: (exam: Exam | null) => void;

  // User answers during exam
  userAnswers: Map<string, number | string>;
  setUserAnswer: (questionId: string, answer: number | string) => void;
  clearUserAnswers: () => void;

  // Exam results
  results: ExamResult[];
  addResult: (result: ExamResult) => void;
  getResult: (examId: string) => ExamResult | undefined;

  // Timer
  examStartTime: Date | null;
  setExamStartTime: (time: Date | null) => void;
}

export const useExamStore = create<ExamStore>()(
  persist(
    (set, get) => ({
      exams: [],

      addExam: (exam) => set((state) => ({
        exams: [...state.exams, exam]
      })),

      updateExam: (id, updatedExam) => set((state) => ({
        exams: state.exams.map((exam) =>
          exam.id === id ? { ...exam, ...updatedExam } : exam
        )
      })),

      deleteExam: (id) => set((state) => ({
        exams: state.exams.filter((exam) => exam.id !== id)
      })),

      getExam: (id) => {
        const state = get();
        return state.exams.find((exam) => exam.id === id);
      },

      currentExam: null,
      setCurrentExam: (exam) => set({ currentExam: exam }),

      userAnswers: new Map(),

      setUserAnswer: (questionId, answer) => set((state) => {
        const newAnswers = new Map(state.userAnswers);
        newAnswers.set(questionId, answer);
        return { userAnswers: newAnswers };
      }),

      clearUserAnswers: () => set({ userAnswers: new Map() }),

      results: [],

      addResult: (result) => set((state) => ({
        results: [...state.results, result]
      })),

      getResult: (examId) => {
        const state = get();
        return state.results.find((result) => result.examId === examId);
      },

      examStartTime: null,
      setExamStartTime: (time) => set({ examStartTime: time }),
    }),
    {
      name: 'exam-storage',
      partialize: (state) => ({
        exams: state.exams,
        results: state.results,
      }),
    }
  )
);