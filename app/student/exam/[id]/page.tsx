'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import ContentDisplay from '@/components/editor/ContentDisplay';
import CustomEditorDynamic from '@/components/editor/CustomEditorDynamic';
import { fetchExamForStudent, createExamSession, completeExamSession, gradeEssayQuestion } from '@/lib/api/student';
import { Exam, Question, SubQuestion } from '@/types/exam';
import { Clock, ChevronLeft, ChevronRight, Send, Loader2, BookOpen, User, AlertTriangle, CheckCircle2, HelpCircle, ArrowLeft, Timer } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export default function ExamTakingPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;
  const { user, profile, isLoading: authLoading } = useAuth();

  const [exam, setExam] = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const [userAnswers, setUserAnswers] = useState<Map<string, number | string>>(new Map());
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [gradingStatus, setGradingStatus] = useState('');

  // Get student name from profile
  const studentName = profile?.full_name || '';
  const studentId = user?.id;

  const examStartTimeRef = useRef<Date | null>(null);
  const currentQuestion = exam?.questions[currentQuestionIndex];

  // Load exam on mount
  useEffect(() => {
    const loadExam = async () => {
      setIsLoading(true);
      const result = await fetchExamForStudent(examId);

      if (result.success && result.data) {
        setExam(result.data);
      } else {
        setError(result.error || 'Không tìm thấy đề thi');
      }
      setIsLoading(false);
    };

    loadExam();
  }, [examId]);

  // Timer effect
  useEffect(() => {
    if (!exam || !hasStarted || !examStartTimeRef.current) return;

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - examStartTimeRef.current!.getTime()) / 1000);
      const remaining = Math.max(0, exam.duration * 60 - elapsed);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        handleSubmit();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [exam, hasStarted]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartExam = async () => {
    if (!studentName) {
      toast.error('Vui lòng đăng nhập để làm bài!');
      router.push('/auth/login');
      return;
    }

    if (!exam) return;

    // Create session in Supabase with student info from auth
    const result = await createExamSession(examId, studentName, studentId);

    if (!result.success) {
      toast.error(result.error || 'Không thể bắt đầu bài thi');
      return;
    }

    setSessionId(result.data!.sessionId);
    setHasStarted(true);
    examStartTimeRef.current = new Date();
    setTimeRemaining(exam.duration * 60);
  };

  const setUserAnswer = (questionId: string, answer: number | string) => {
    setUserAnswers(prev => {
      const newAnswers = new Map(prev);
      newAnswers.set(questionId, answer);
      return newAnswers;
    });
  };

  const handleAnswerChange = (answer: string) => {
    if (currentQuestion) {
      setUserAnswer(currentQuestion.id, answer);
    }
  };

  // Handle true-false sub-question answer change
  const handleTrueFalseAnswer = (subLabel: string, value: boolean) => {
    if (!currentQuestion) return;

    // Get current answers or create empty object
    const currentAnswerStr = userAnswers.get(currentQuestion.id) as string || '{}';
    let currentAnswers: Record<string, boolean> = {};
    try {
      currentAnswers = JSON.parse(currentAnswerStr);
    } catch {
      currentAnswers = {};
    }

    // Update the specific sub-question answer
    currentAnswers[subLabel] = value;

    // Save as JSON string
    setUserAnswer(currentQuestion.id, JSON.stringify(currentAnswers));
  };

  // Get true-false answer for a specific sub-question
  const getTrueFalseAnswer = (subLabel: string): boolean | null => {
    if (!currentQuestion) return null;

    const answerStr = userAnswers.get(currentQuestion.id) as string;
    if (!answerStr) return null;

    try {
      const answers = JSON.parse(answerStr);
      return answers[subLabel] ?? null;
    } catch {
      return null;
    }
  };

  const goToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
  };

  // Check if a true-false question with subQuestions is answered
  const isTrueFalseAnswered = useCallback((questionId: string, subQuestions: SubQuestion[] | undefined) => {
    const answerStr = userAnswers.get(questionId) as string;
    if (!answerStr || !subQuestions) return false;

    try {
      const answers = JSON.parse(answerStr);
      // Check if all sub-questions have been answered
      return subQuestions.every(sub => answers[sub.label] !== undefined);
    } catch {
      return false;
    }
  }, [userAnswers]);

  const handleSubmit = async () => {
    if (!exam || !sessionId || isSubmitting) return;

    // Check unanswered questions (handle true-false with subQuestions differently)
    const unanswered = exam.questions.filter(q => {
      if (q.type === 'true-false' && q.subQuestions && q.subQuestions.length > 0) {
        return !isTrueFalseAnswered(q.id, q.subQuestions);
      }
      return !userAnswers.get(q.id);
    });

    if (unanswered.length > 0) {
      const confirmSubmit = confirm(
        `Bạn còn ${unanswered.length} câu chưa trả lời. Bạn có chắc muốn nộp bài?`
      );
      if (!confirmSubmit) return;
    }

    setIsSubmitting(true);

    // Calculate score - handle essay questions with AI grading
    let totalScore = 0;
    const answers: Array<{
      questionId: string;
      userAnswer: string | number;
      isCorrect: boolean;
      pointsEarned: number;
      aiFeedback?: string;
    }> = [];

    // Process questions sequentially (needed for AI grading)
    for (const question of exam.questions) {
      const userAnswer = userAnswers.get(question.id);

      // Handle true-false with subQuestions (4 mệnh đề cố định)
      // Cách tính điểm: 1 ý đúng = 0.1đ | 2 ý đúng = 0.25đ | 3 ý đúng = 0.5đ | 4 ý đúng = 1đ
      if (question.type === 'true-false' && question.subQuestions && question.subQuestions.length > 0) {
        let subCorrect = 0;

        try {
          const userAnswerObj = userAnswer ? JSON.parse(userAnswer as string) : {};

          question.subQuestions.forEach(sub => {
            if (userAnswerObj[sub.label] === sub.correct) {
              subCorrect++;
            }
          });
        } catch {
          // Invalid JSON, all wrong
        }

        // Bảng điểm cố định cho 4 mệnh đề
        const scoreMap: Record<number, number> = {
          0: 0,
          1: 0.1,
          2: 0.25,
          3: 0.5,
          4: 1,
        };
        const earnedScore = scoreMap[subCorrect] || 0;
        const isAllCorrect = subCorrect === 4;

        totalScore += earnedScore;
        answers.push({
          questionId: question.id,
          userAnswer: userAnswer || '',
          isCorrect: isAllCorrect,
          pointsEarned: earnedScore,
        });
        continue;
      }

      // Handle essay questions with AI grading
      if (question.type === 'essay') {
        const studentAnswer = String(userAnswer || '');

        // Only grade if student provided an answer
        if (hasContent(studentAnswer)) {
          // Show grading status
          const questionIndex = exam.questions.indexOf(question) + 1;
          setGradingStatus(`Đang chấm câu tự luận ${questionIndex}...`);

          const gradeResult = await gradeEssayQuestion(
            question.question,
            studentAnswer,
            question.sampleAnswer || question.explanation || '',
            question.rubric || '',
            question.points
          );

          if (gradeResult.success && gradeResult.data) {
            totalScore += gradeResult.data.score;
            answers.push({
              questionId: question.id,
              userAnswer: studentAnswer,
              isCorrect: gradeResult.data.score >= question.points * 0.8, // 80% is "correct"
              pointsEarned: gradeResult.data.score,
              aiFeedback: gradeResult.data.feedback,
            });
          } else {
            // AI grading failed, give 0 points
            answers.push({
              questionId: question.id,
              userAnswer: studentAnswer,
              isCorrect: false,
              pointsEarned: 0,
              aiFeedback: 'Không thể chấm điểm tự động. Vui lòng liên hệ giáo viên.',
            });
          }
        } else {
          // No answer provided
          answers.push({
            questionId: question.id,
            userAnswer: '',
            isCorrect: false,
            pointsEarned: 0,
          });
        }
        continue;
      }

      // Handle multiple-choice, fill-in questions
      const isCorrect = userAnswer !== undefined &&
        String(userAnswer) === String(question.correctAnswer);

      const pointsEarned = isCorrect ? question.points : 0;
      totalScore += pointsEarned;

      answers.push({
        questionId: question.id,
        userAnswer: userAnswer || '',
        isCorrect,
        pointsEarned,
      });
    }

    const timeSpent = exam.duration * 60 - timeRemaining;

    // Clear grading status and submit
    setGradingStatus('Đang lưu kết quả...');

    // Submit to Supabase
    const result = await completeExamSession(
      sessionId,
      answers,
      totalScore,
      exam.totalPoints,
      timeSpent
    );

    setIsSubmitting(false);
    setGradingStatus('');

    if (result.success) {
      toast.success('Đã nộp bài thành công!');
      router.push(`/student/result/${sessionId}`);
    } else {
      toast.error(result.error || 'Không thể nộp bài');
    }
  };

  // Auth loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-500">Đang kiểm tra đăng nhập...</p>
        </div>
      </div>
    );
  }

  // Not logged in - redirect to login
  if (!user || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="max-w-md mx-4">
          <CardHeader className="text-center">
            <CardTitle>Yêu cầu đăng nhập</CardTitle>
            <CardDescription>
              Bạn cần đăng nhập để làm bài thi
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={() => router.push('/auth/login')}
              className="w-full"
            >
              Đăng nhập
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/exams')}
              className="w-full"
            >
              Quay lại danh sách đề
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading exam state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-500">Đang tải đề thi...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !exam) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertDescription>{error || 'Không tìm thấy đề thi!'}</AlertDescription>
        </Alert>
        <Button onClick={() => router.push('/exams')} className="mt-4">
          Quay lại danh sách đề thi
        </Button>
      </div>
    );
  }

  // Start screen
  if (!hasStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" onClick={() => router.push('/exams')} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Quay lại danh sách đề thi
            </Button>
          </div>
        </div>

        <div className="container mx-auto py-8 px-4 max-w-2xl">
          <Card className="shadow-xl border-0">
            <div className="h-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-lg" />
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle className="text-2xl">{exam.title}</CardTitle>
              <CardDescription className="text-base">{exam.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Exam Info */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <Clock className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                  <p className="text-2xl font-bold text-gray-900">{exam.duration}</p>
                  <p className="text-sm text-gray-500">phút</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <HelpCircle className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <p className="text-2xl font-bold text-gray-900">{exam.questions.length}</p>
                  <p className="text-sm text-gray-500">câu hỏi</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 text-center col-span-2 md:col-span-1">
                  <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                  <p className="text-2xl font-bold text-gray-900">{exam.totalPoints}</p>
                  <p className="text-sm text-gray-500">tổng điểm</p>
                </div>
              </div>

              {/* Exam Details */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                  <BookOpen className="h-4 w-4" />
                  Thông tin đề thi
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 w-20">Môn học:</span>
                    <span className="font-medium text-blue-900">{exam.subject}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 w-20">Khối lớp:</span>
                    <span className="font-medium text-blue-900">Lớp {exam.grade}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600 w-20">Giáo viên:</span>
                    <span className="font-medium text-blue-900">{exam.author || 'Giáo viên'}</span>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-amber-50 rounded-lg p-4 border border-amber-200">
                <h3 className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Lưu ý trước khi làm bài
                </h3>
                <ul className="text-sm text-amber-800 space-y-1.5 list-disc list-inside">
                  <li>Đồng hồ sẽ bắt đầu đếm ngược khi bạn nhấn &quot;Bắt đầu làm bài&quot;</li>
                  <li>Bạn có thể di chuyển qua lại giữa các câu hỏi</li>
                  <li>Bài thi sẽ tự động nộp khi hết thời gian</li>
                  <li>Đảm bảo kết nối internet ổn định trong suốt bài thi</li>
                </ul>
              </div>

              {/* Student Info Display */}
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-green-600">Học sinh</p>
                    <p className="font-semibold text-green-900">{studentName}</p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleStartExam}
                className="w-full h-14 text-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                size="lg"
              >
                <Timer className="mr-2 h-5 w-5" />
                Bắt đầu làm bài
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Helper to check if HTML content has meaningful content (not just empty tags)
  const hasContent = (html: string): boolean => {
    if (!html) return false;
    // Remove HTML tags and check if there's text or image content
    const hasImage = html.includes('<img') || html.includes('data:image');
    const textContent = html.replace(/<[^>]*>/g, '').trim();
    return hasImage || textContent.length > 0;
  };

  // Calculate answered questions count
  const answeredCount = exam.questions.filter(q => {
    if (q.type === 'true-false' && q.subQuestions && q.subQuestions.length > 0) {
      return isTrueFalseAnswered(q.id, q.subQuestions);
    }
    const answer = userAnswers.get(q.id);
    if (q.type === 'essay') {
      return hasContent(String(answer || ''));
    }
    return answer !== undefined && answer !== '';
  }).length;

  // Exam taking screen
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <h1 className="font-semibold text-gray-900 hidden sm:block">{exam.title}</h1>
              <Badge variant="secondary" className="hidden md:flex">
                {exam.subject} - Lớp {exam.grade}
              </Badge>
            </div>

            <div className="flex items-center gap-4">
              {/* Progress indicator */}
              <div className="hidden sm:flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>{answeredCount}/{exam.questions.length} câu</span>
              </div>

              {/* Timer */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg
                ${timeRemaining < 60 ? 'bg-red-100 text-red-700 animate-pulse' :
                  timeRemaining < 300 ? 'bg-amber-100 text-amber-700' :
                  'bg-blue-100 text-blue-700'}`}
              >
                <Clock className="h-5 w-5" />
                <span className="font-bold">{formatTime(timeRemaining)}</span>
              </div>

              {/* Submit button in header */}
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span className="hidden sm:inline ml-2">Nộp bài</span>
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          <Progress
            value={(currentQuestionIndex + 1) / exam.questions.length * 100}
            className="h-1"
          />
        </div>
      </div>

      {/* Time warning */}
      {timeRemaining < 300 && timeRemaining > 0 && (
        <div className={`fixed top-20 left-1/2 -translate-x-1/2 z-40 px-6 py-3 rounded-lg shadow-lg
          ${timeRemaining < 60 ? 'bg-red-600 text-white' : 'bg-amber-500 text-white'}`}
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">
              {timeRemaining < 60 ? 'Còn chưa đầy 1 phút!' : `Còn ${Math.ceil(timeRemaining / 60)} phút!`}
            </span>
          </div>
        </div>
      )}

      {/* Main content with padding for fixed header */}
      <div className="container mx-auto px-4 pt-20 pb-8 max-w-6xl">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main content */}
          <div className="lg:col-span-3 space-y-4">
            <Card className="shadow-lg">
              <CardHeader className="border-b bg-gray-50">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                      {currentQuestionIndex + 1}
                    </div>
                    <div>
                      <CardTitle className="text-lg">Câu hỏi {currentQuestionIndex + 1}</CardTitle>
                      <CardDescription>
                        {currentQuestion?.type === 'multiple-choice' ? 'Trắc nghiệm' :
                         currentQuestion?.type === 'true-false' ? 'Đúng/Sai' :
                         currentQuestion?.type === 'essay' ? 'Tự luận' : 'Điền đáp án'}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className="text-base px-3 py-1">
                    {currentQuestion?.points} điểm
                  </Badge>
                </div>
              </CardHeader>
            <CardContent className="space-y-6 p-6">
              {currentQuestion && (
                <>
                  {/* Question content */}
                  <div className="prose prose-lg max-w-none">
                    <ContentDisplay content={currentQuestion.question} />
                    {currentQuestion.imageUrl && (
                      <div className="mt-4 p-2 bg-gray-50 rounded-lg inline-block">
                        <img
                          src={currentQuestion.imageUrl}
                          alt="Hình minh họa"
                          className="max-w-full rounded shadow-sm"
                        />
                      </div>
                    )}
                  </div>

                  {currentQuestion.type === 'essay' ? (
                    <div className="space-y-2">
                      <Label>Nhập câu trả lời của bạn:</Label>
                      <CustomEditorDynamic
                        key={currentQuestion.id}
                        value={String(userAnswers.get(currentQuestion.id) || '')}
                        onChange={(value) => handleAnswerChange(value)}
                        placeholder="Viết câu trả lời của bạn ở đây..."
                        minHeight="250px"
                      />
                    </div>
                  ) : currentQuestion.type === 'true-false' && currentQuestion.subQuestions && currentQuestion.subQuestions.length > 0 ? (
                    // True-false with multiple sub-questions
                    <div className="space-y-3">
                      <p className="text-sm text-gray-600 mb-4">
                        Chọn Đúng hoặc Sai cho mỗi mệnh đề:
                      </p>
                      {currentQuestion.subQuestions.map((sub) => {
                        const answer = getTrueFalseAnswer(sub.label);
                        return (
                          <div
                            key={sub.label}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                          >
                            <div className="flex-1 mr-4">
                              <span className="font-semibold mr-2">{sub.label})</span>
                              {sub.content && (
                                <ContentDisplay content={sub.content} className="inline" />
                              )}
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <Button
                                type="button"
                                size="sm"
                                variant={answer === true ? 'default' : 'outline'}
                                onClick={() => handleTrueFalseAnswer(sub.label, true)}
                                className={answer === true ? 'bg-green-600 hover:bg-green-700' : ''}
                              >
                                Đúng
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant={answer === false ? 'default' : 'outline'}
                                onClick={() => handleTrueFalseAnswer(sub.label, false)}
                                className={answer === false ? 'bg-red-600 hover:bg-red-700' : ''}
                              >
                                Sai
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : currentQuestion.type === 'true-false' ? (
                    // Simple true-false (no sub-questions)
                    <RadioGroup
                      value={String(userAnswers.get(currentQuestion.id) || '')}
                      onValueChange={handleAnswerChange}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="0" id="true" />
                        <Label htmlFor="true" className="font-normal cursor-pointer">
                          Đúng
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="1" id="false" />
                        <Label htmlFor="false" className="font-normal cursor-pointer">
                          Sai
                        </Label>
                      </div>
                    </RadioGroup>
                  ) : currentQuestion.type === 'multiple-choice' ? (
                    <RadioGroup
                      value={String(userAnswers.get(currentQuestion.id) || '')}
                      onValueChange={handleAnswerChange}
                    >
                      {currentQuestion.options.map((option, idx) => (
                        <div key={idx} className="flex items-start space-x-2">
                          <RadioGroupItem value={String(idx)} id={`option-${idx}`} />
                          <Label
                            htmlFor={`option-${idx}`}
                            className="font-normal cursor-pointer"
                          >
                            <span className="font-semibold mr-2">
                              {String.fromCharCode(65 + idx)}.
                            </span>
                            <ContentDisplay content={option} />
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    // Fill-in type
                    <div>
                      <Label>Điền đáp án:</Label>
                      <input
                        type="text"
                        className="mt-1 w-full px-3 py-2 border rounded-md"
                        value={String(userAnswers.get(currentQuestion.id) || '')}
                        onChange={(e) => handleAnswerChange(e.target.value)}
                        placeholder="Nhập đáp án..."
                      />
                    </div>
                  )}

                  {/* Navigation buttons - Hidden on mobile */}
                  <div className="hidden lg:flex justify-between pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={() => goToQuestion(currentQuestionIndex - 1)}
                      disabled={currentQuestionIndex === 0}
                      size="lg"
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Câu trước
                    </Button>
                    {currentQuestionIndex < exam.questions.length - 1 ? (
                      <Button
                        onClick={() => goToQuestion(currentQuestionIndex + 1)}
                        size="lg"
                      >
                        Câu tiếp theo
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        size="lg"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {isSubmitting ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="mr-2 h-4 w-4" />
                        )}
                        Nộp bài
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Question navigator - Hidden on mobile, shown on desktop */}
        <div className="hidden lg:block">
          <Card className="sticky top-24 shadow-lg">
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Danh sách câu hỏi
              </CardTitle>
              <div className="text-sm text-gray-500">
                Đã làm: {answeredCount}/{exam.questions.length} câu
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="grid grid-cols-5 gap-2">
                {exam.questions.map((question, idx) => {
                  // Check if answered (handle true-false with subQuestions)
                  let isAnswered = false;
                  if (question.type === 'true-false' && question.subQuestions && question.subQuestions.length > 0) {
                    isAnswered = isTrueFalseAnswered(question.id, question.subQuestions);
                  } else if (question.type === 'essay') {
                    isAnswered = hasContent(String(userAnswers.get(question.id) || ''));
                  } else {
                    isAnswered = userAnswers.has(question.id) && userAnswers.get(question.id) !== '';
                  }
                  const isCurrent = idx === currentQuestionIndex;

                  return (
                    <Button
                      key={question.id}
                      variant="outline"
                      size="sm"
                      onClick={() => goToQuestion(idx)}
                      className={`h-9 w-9 p-0 font-medium transition-all
                        ${isCurrent ? 'ring-2 ring-blue-500 bg-blue-600 text-white hover:bg-blue-700' :
                          isAnswered ? 'bg-green-100 text-green-700 border-green-300 hover:bg-green-200' :
                          'hover:bg-gray-100'}`}
                    >
                      {idx + 1}
                    </Button>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-blue-600 rounded flex items-center justify-center">
                    <span className="text-white text-[10px]">1</span>
                  </div>
                  <span className="text-gray-600">Câu đang làm</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-green-100 border border-green-300 rounded flex items-center justify-center">
                    <span className="text-green-700 text-[10px]">2</span>
                  </div>
                  <span className="text-gray-600">Đã trả lời</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border rounded flex items-center justify-center">
                    <span className="text-gray-400 text-[10px]">3</span>
                  </div>
                  <span className="text-gray-600">Chưa trả lời</span>
                </div>
              </div>

              <Button
                className="w-full mt-4 bg-green-600 hover:bg-green-700"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {gradingStatus || 'Đang nộp bài...'}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Nộp bài ({answeredCount}/{exam.questions.length})
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
      </div>

      {/* Mobile question navigator - Fixed bottom */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-3 z-40">
        <div className="flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToQuestion(currentQuestionIndex - 1)}
            disabled={currentQuestionIndex === 0}
            className="flex-1"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Trước
          </Button>

          <div className="flex items-center gap-1 px-2 text-sm font-medium">
            <span className="text-blue-600">{currentQuestionIndex + 1}</span>
            <span className="text-gray-400">/</span>
            <span>{exam.questions.length}</span>
          </div>

          {currentQuestionIndex < exam.questions.length - 1 ? (
            <Button
              size="sm"
              onClick={() => goToQuestion(currentQuestionIndex + 1)}
              className="flex-1"
            >
              Tiếp
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 mr-1" />}
              Nộp bài
            </Button>
          )}
        </div>
      </div>

      {/* Add padding at bottom for mobile nav */}
      <div className="lg:hidden h-16" />
    </div>
  );
}
