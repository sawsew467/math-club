// Sub-question for true-false type (Vietnamese "Trắc nghiệm đúng sai")
export interface SubQuestion {
  label: string; // a, b, c, d
  content?: string; // The statement content
  correct: boolean; // true = Đúng, false = Sai
}

export interface Question {
  id: string;
  question: string; // Nội dung câu hỏi (có thể chứa LaTeX)
  imageUrl?: string; // URL hình ảnh cho câu hỏi hình học
  imageDescription?: string; // Mô tả hình ảnh/đồ thị trong đề
  hasImage?: boolean; // Câu hỏi có chứa hình ảnh cần upload
  options: string[]; // Các lựa chọn (cho câu hỏi trắc nghiệm)
  correctAnswer: number | string; // Index của đáp án đúng hoặc đáp án mẫu cho tự luận
  explanation: string; // Giải thích chi tiết (có thể chứa LaTeX)
  points: number; // Điểm cho câu hỏi này
  type: 'multiple-choice' | 'true-false' | 'fill-in' | 'essay'; // Loại câu hỏi
  userAnswer?: number | string; // Câu trả lời của học sinh
  rubric?: string; // Tiêu chí chấm điểm cho câu tự luận
  subQuestions?: SubQuestion[]; // Các mệnh đề con cho câu hỏi đúng/sai
  sampleAnswer?: string; // Đáp án mẫu cho câu tự luận
}

export interface Exam {
  id: string;
  title: string;
  description: string;
  grade: number; // Lớp (10, 11, 12)
  subject: string; // Môn học
  duration: number; // Thời gian làm bài (phút)
  questions: Question[];
  questionCount?: number; // For list view when questions aren't loaded
  createdAt: Date;
  updatedAt: Date;
  author: string;
  totalPoints: number;
  isPublished: boolean;
}

export interface ExamResult {
  examId: string;
  studentName: string;
  score: number;
  totalScore: number;
  percentage: number;
  answers: Array<{
    questionId: string;
    userAnswer: number | string;
    isCorrect: boolean;
    pointsEarned?: number;
    aiFeedback?: string; // AI grading feedback for essay questions
  }>;
  completedAt: Date;
  timeSpent: number; // Thời gian làm bài (giây)
}