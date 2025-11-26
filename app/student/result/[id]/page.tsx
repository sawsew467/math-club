'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import ContentDisplay from '@/components/editor/ContentDisplay';
import { ChatPanel } from '@/components/chat/ChatPanel';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { fetchSessionResult } from '@/lib/api/student';
import { Exam, ExamResult } from '@/types/exam';
import { CheckCircle2, XCircle, Home, RefreshCw, BookOpen, MessageCircle, Loader2, Trophy, Clock, Target, TrendingUp, ArrowLeft } from 'lucide-react';

export default function ExamResultPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const [exam, setExam] = useState<Exam | null>(null);
  const [result, setResult] = useState<ExamResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showExplanations, setShowExplanations] = useState<Set<string>>(new Set());

  // Load result on mount
  useEffect(() => {
    const loadResult = async () => {
      setIsLoading(true);
      const response = await fetchSessionResult(sessionId);

      if (response.success && response.data) {
        setExam(response.data.exam);
        setResult(response.data.result);
      } else {
        setError(response.error || 'Không tìm thấy kết quả');
      }
      setIsLoading(false);
    };

    loadResult();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
            <p className="text-gray-500">Đang tải kết quả...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !exam || !result) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 container mx-auto py-8 px-4">
          <Alert>
            <AlertDescription>{error || 'Không tìm thấy kết quả thi!'}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push('/exams')} className="mt-4">
            <Home className="mr-2 h-4 w-4" />
            Xem đề thi khác
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const toggleExplanation = (questionId: string) => {
    const newSet = new Set(showExplanations);
    if (newSet.has(questionId)) {
      newSet.delete(questionId);
    } else {
      newSet.add(questionId);
    }
    setShowExplanations(newSet);
  };

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    if (percentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreMessage = (percentage: number) => {
    if (percentage >= 90) return 'Xuất sắc! 🌟';
    if (percentage >= 80) return 'Giỏi! 👏';
    if (percentage >= 70) return 'Khá! 👍';
    if (percentage >= 60) return 'Trung bình khá 📚';
    if (percentage >= 50) return 'Trung bình 📖';
    return 'Cần cố gắng thêm 💪';
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes} phút ${secs} giây`;
  };

  const correctCount = result.answers.filter(a => a.isCorrect).length;
  const incorrectCount = result.answers.filter(a => !a.isCorrect).length;

  // Determine score grade for styling
  const getScoreGradient = (percentage: number) => {
    if (percentage >= 80) return 'from-green-500 to-emerald-500';
    if (percentage >= 60) return 'from-yellow-500 to-amber-500';
    if (percentage >= 40) return 'from-orange-500 to-red-400';
    return 'from-red-500 to-red-600';
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 to-blue-50">
      <Header />
      <main className="flex-1 container mx-auto py-8 max-w-5xl px-4">
        {/* Back button */}
        <Button
          variant="ghost"
          onClick={() => router.push('/exams')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Quay lại danh sách đề thi
        </Button>

        {/* Hero Score Card */}
        <Card className="mb-8 overflow-hidden shadow-xl border-0">
          <div className={`h-2 bg-gradient-to-r ${getScoreGradient(result.percentage)}`} />
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center mb-4">
              <Trophy className={`h-10 w-10 ${result.percentage >= 60 ? 'text-yellow-500' : 'text-gray-400'}`} />
            </div>
            <CardTitle className="text-2xl md:text-3xl">{exam.title}</CardTitle>
            <CardDescription className="text-base">
              <span className="font-medium">{result.studentName}</span>
              <span className="mx-2">•</span>
              <span>{new Date(result.completedAt).toLocaleDateString('vi-VN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            {/* Main Score Display */}
            <div className="text-center mb-6">
              <div className={`inline-flex items-baseline gap-1 text-6xl md:text-7xl font-bold bg-gradient-to-r ${getScoreGradient(result.percentage)} bg-clip-text text-transparent`}>
                <span>{result.percentage.toFixed(0)}</span>
                <span className="text-3xl">%</span>
              </div>
              <p className="text-2xl mt-2">{getScoreMessage(result.percentage)}</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
                <Target className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                <p className="text-2xl font-bold text-blue-900">{result.score.toFixed(1)}/{result.totalScore}</p>
                <p className="text-sm text-blue-600">Điểm số</p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 text-center">
                <Clock className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                <p className="text-2xl font-bold text-purple-900">{formatTime(result.timeSpent)}</p>
                <p className="text-sm text-purple-600">Thời gian</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
                <CheckCircle2 className="h-6 w-6 mx-auto mb-2 text-green-600" />
                <p className="text-2xl font-bold text-green-900">{correctCount}</p>
                <p className="text-sm text-green-600">Câu đúng</p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 text-center">
                <XCircle className="h-6 w-6 mx-auto mb-2 text-red-600" />
                <p className="text-2xl font-bold text-red-900">{incorrectCount}</p>
                <p className="text-sm text-red-600">Câu sai</p>
              </div>
            </div>

            {/* Progress bar for correct/incorrect */}
            <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
              <div
                className="bg-gradient-to-r from-green-500 to-green-400 h-full transition-all duration-1000"
                style={{ width: `${(correctCount / exam.questions.length) * 100}%` }}
              />
            </div>
            <p className="text-center text-sm text-gray-500 mt-2">
              {correctCount}/{exam.questions.length} câu trả lời đúng
            </p>
          </CardContent>
        </Card>

      {/* Detailed results */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto">
          <TabsTrigger value="all">Tất cả</TabsTrigger>
          <TabsTrigger value="correct">Câu đúng</TabsTrigger>
          <TabsTrigger value="incorrect">Câu sai</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {exam.questions.map((question, index) => {
            const answer = result.answers.find(a => a.questionId === question.id);
            const isCorrect = answer?.isCorrect || false;

            return (
              <QuestionResult
                key={question.id}
                question={question}
                index={index}
                userAnswer={answer?.userAnswer}
                isCorrect={isCorrect}
                showExplanation={showExplanations.has(question.id)}
                onToggleExplanation={() => toggleExplanation(question.id)}
              />
            );
          })}
        </TabsContent>

        <TabsContent value="correct" className="space-y-4">
          {exam.questions
            .filter((q) => {
              const answer = result.answers.find(a => a.questionId === q.id);
              return answer?.isCorrect;
            })
            .map((question, index) => {
              const answer = result.answers.find(a => a.questionId === question.id);
              return (
                <QuestionResult
                  key={question.id}
                  question={question}
                  index={exam.questions.indexOf(question)}
                  userAnswer={answer?.userAnswer}
                  isCorrect={true}
                  showExplanation={showExplanations.has(question.id)}
                  onToggleExplanation={() => toggleExplanation(question.id)}
                />
              );
            })}
        </TabsContent>

        <TabsContent value="incorrect" className="space-y-4">
          {exam.questions
            .filter((q) => {
              const answer = result.answers.find(a => a.questionId === q.id);
              return !answer?.isCorrect;
            })
            .map((question, index) => {
              const answer = result.answers.find(a => a.questionId === question.id);
              return (
                <QuestionResult
                  key={question.id}
                  question={question}
                  index={exam.questions.indexOf(question)}
                  userAnswer={answer?.userAnswer}
                  isCorrect={false}
                  showExplanation={showExplanations.has(question.id)}
                  onToggleExplanation={() => toggleExplanation(question.id)}
                />
              );
            })}
        </TabsContent>
      </Tabs>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8 pb-8">
        <Button
          onClick={() => router.push('/exams')}
          variant="outline"
          size="lg"
          className="min-w-[180px]"
        >
          <Home className="mr-2 h-5 w-5" />
          Xem đề thi khác
        </Button>
        <Button
          onClick={() => router.push(`/student/exam/${result.examId}`)}
          size="lg"
          className="min-w-[180px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
        >
          <RefreshCw className="mr-2 h-5 w-5" />
          Làm lại bài thi
        </Button>
      </div>
      </main>
      <Footer />
    </div>
  );
}

// Component for displaying individual question result
function QuestionResult({
  question,
  index,
  userAnswer,
  isCorrect,
  showExplanation,
  onToggleExplanation
}: {
  question: any;
  index: number;
  userAnswer: any;
  isCorrect: boolean;
  showExplanation: boolean;
  onToggleExplanation: () => void;
}) {
  const [chatOpen, setChatOpen] = useState(false);

  // Strip HTML tags for question context
  const stripHtml = (html: string) => {
    if (!html) return '';
    if (typeof document === 'undefined') return html.replace(/<[^>]*>/g, '');
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const questionContext = {
    questionNumber: index + 1,
    question: question.question, // Raw HTML for display
    questionText: stripHtml(question.question), // Stripped for AI
    type: question.type,
    options: question.options,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation, // Raw HTML for display
    explanationText: stripHtml(question.explanation), // Stripped for AI
    userAnswer: userAnswer,
    isCorrect: isCorrect,
    points: question.points,
    subQuestions: question.subQuestions, // For true-false with multiple statements
    sampleAnswer: question.sampleAnswer, // For essay questions
  };

  return (
    <>
      <Card className={`overflow-hidden shadow-md transition-all hover:shadow-lg ${
        question.type === 'essay' ? 'border-l-4 border-l-yellow-400' :
        isCorrect ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'
      }`}>
        <CardHeader className="pb-3 bg-gradient-to-r from-gray-50 to-white">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                question.type === 'essay' ? 'bg-yellow-500' :
                isCorrect ? 'bg-green-500' : 'bg-red-500'
              }`}>
                {index + 1}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  {question.type === 'essay' ? (
                    <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                      Cần chấm điểm
                    </Badge>
                  ) : isCorrect ? (
                    <Badge className="bg-green-100 text-green-800 border-green-300">
                      <CheckCircle2 className="mr-1 h-3 w-3" />
                      Đúng
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-800 border-red-300">
                      <XCircle className="mr-1 h-3 w-3" />
                      Sai
                    </Badge>
                  )}
                  <Badge variant="secondary">{question.points} điểm</Badge>
                </div>
              </div>
            </div>
            <div className="flex gap-2 sm:ml-auto">
              {question.explanation && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleExplanation}
                  className="text-blue-600 hover:text-blue-700"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  {showExplanation ? 'Ẩn' : 'Xem'} giải thích
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChatOpen(true)}
                className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 border-indigo-200"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Hỏi AI
              </Button>
            </div>
          </div>
        </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="font-medium mb-2">Câu hỏi:</p>
          <ContentDisplay content={question.question} />
          {question.imageUrl && (
            <img
              src={question.imageUrl}
              alt="Hình minh họa"
              className="mt-2 max-w-md rounded border"
            />
          )}
        </div>

        {question.type === 'multiple-choice' && (
          <div className="space-y-2">
            {question.options.map((option: string, idx: number) => {
              const isUserAnswer = String(userAnswer) === String(idx);
              const isCorrectAnswer = idx === question.correctAnswer;

              return (
                <div
                  key={idx}
                  className={`p-2 rounded-md ${
                    isCorrectAnswer
                      ? 'bg-green-50 border border-green-300'
                      : isUserAnswer && !isCorrect
                      ? 'bg-red-50 border border-red-300'
                      : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <span className="font-semibold">
                      {String.fromCharCode(65 + idx)}.
                    </span>
                    <ContentDisplay content={option} className="inline" />
                    {isCorrectAnswer && (
                      <CheckCircle2 className="h-4 w-4 text-green-600 mt-1 ml-auto" />
                    )}
                    {isUserAnswer && !isCorrect && (
                      <XCircle className="h-4 w-4 text-red-600 mt-1 ml-auto" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {question.type === 'true-false' && question.subQuestions && question.subQuestions.length > 0 ? (
          // True-false with multiple sub-questions
          <div className="space-y-2">
            {(() => {
              // Parse user answers
              let userAnswerObj: Record<string, boolean> = {};
              try {
                if (userAnswer) {
                  userAnswerObj = JSON.parse(String(userAnswer));
                }
              } catch {
                userAnswerObj = {};
              }

              return question.subQuestions.map((sub: { label: string; content?: string; correct: boolean }) => {
                const userSubAnswer = userAnswerObj[sub.label];
                const isSubCorrect = userSubAnswer === sub.correct;
                const hasAnswered = userSubAnswer !== undefined;

                return (
                  <div
                    key={sub.label}
                    className={`p-3 rounded-md border ${
                      isSubCorrect
                        ? 'bg-green-50 border-green-300'
                        : hasAnswered
                        ? 'bg-red-50 border-red-300'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <span className="font-semibold mr-2">{sub.label})</span>
                        {sub.content && (
                          <ContentDisplay content={sub.content} className="inline" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-4">
                        {/* User's answer */}
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-gray-500">Bạn chọn:</span>
                          {hasAnswered ? (
                            <Badge variant={userSubAnswer ? 'default' : 'secondary'}>
                              {userSubAnswer ? 'Đúng' : 'Sai'}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Chưa trả lời</Badge>
                          )}
                        </div>
                        {/* Correct answer */}
                        <div className="flex items-center gap-1">
                          <span className="text-sm text-gray-500">Đáp án:</span>
                          <Badge className={sub.correct ? 'bg-green-600' : 'bg-red-600'}>
                            {sub.correct ? 'Đúng' : 'Sai'}
                          </Badge>
                        </div>
                        {/* Result icon */}
                        {isSubCorrect ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-600" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        ) : question.type === 'true-false' && (
          // Simple true-false (no sub-questions)
          <div className="space-y-2">
            <div className={`p-2 rounded-md ${
              question.correctAnswer === 0 ? 'bg-green-50 border border-green-300' :
              String(userAnswer) === '0' && !isCorrect ? 'bg-red-50 border border-red-300' : ''
            }`}>
              <div className="flex items-center gap-2">
                <span>Đúng</span>
                {question.correctAnswer === 0 && (
                  <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
                )}
                {String(userAnswer) === '0' && !isCorrect && (
                  <XCircle className="h-4 w-4 text-red-600 ml-auto" />
                )}
              </div>
            </div>
            <div className={`p-2 rounded-md ${
              question.correctAnswer === 1 ? 'bg-green-50 border border-green-300' :
              String(userAnswer) === '1' && !isCorrect ? 'bg-red-50 border border-red-300' : ''
            }`}>
              <div className="flex items-center gap-2">
                <span>Sai</span>
                {question.correctAnswer === 1 && (
                  <CheckCircle2 className="h-4 w-4 text-green-600 ml-auto" />
                )}
                {String(userAnswer) === '1' && !isCorrect && (
                  <XCircle className="h-4 w-4 text-red-600 ml-auto" />
                )}
              </div>
            </div>
          </div>
        )}

        {question.type === 'essay' && (
          <div className="space-y-3">
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="font-medium mb-2">Câu trả lời của bạn:</p>
              <ContentDisplay content={userAnswer || 'Không có câu trả lời'} />
            </div>
            <div className="p-3 bg-green-50 rounded-md">
              <p className="font-medium mb-2">Đáp án mẫu:</p>
              <ContentDisplay content={question.sampleAnswer || '(Chưa có đáp án mẫu)'} />
            </div>
            {question.rubric && (
              <div className="p-3 bg-blue-50 rounded-md">
                <p className="font-medium mb-2">Tiêu chí chấm điểm:</p>
                <ContentDisplay content={question.rubric} />
              </div>
            )}
            <Alert>
              <AlertDescription>
                Câu tự luận cần được giáo viên chấm điểm thủ công
              </AlertDescription>
            </Alert>
          </div>
        )}

        {question.type === 'fill-in' && (
          <div className="space-y-2">
            <div className={`p-2 rounded-md ${
              String(userAnswer) === String(question.correctAnswer)
                ? 'bg-green-50 border border-green-300'
                : 'bg-red-50 border border-red-300'
            }`}>
              <p>Câu trả lời của bạn: <strong>{userAnswer || '(Không trả lời)'}</strong></p>
            </div>
            <div className="p-2 bg-gray-50 rounded-md">
              <p>Đáp án đúng: <strong>{question.correctAnswer}</strong></p>
            </div>
          </div>
        )}

        {showExplanation && question.explanation && (
          <div className="mt-4 p-4 bg-blue-50 rounded-md">
            <p className="font-medium text-blue-900 mb-2">Giải thích:</p>
            <ContentDisplay content={question.explanation} />
          </div>
        )}
      </CardContent>
    </Card>

      <ChatPanel
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        questionContext={questionContext}
      />
    </>
  );
}
