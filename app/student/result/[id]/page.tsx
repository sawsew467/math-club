'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import ContentDisplay from '@/components/editor/ContentDisplay';
import { ChatDialog } from '@/components/chat/ChatDialog';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useExamStore } from '@/store/exam-store';
import { CheckCircle2, XCircle, Home, RefreshCw, BookOpen, MessageCircle } from 'lucide-react';

export default function ExamResultPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const { getExam, getResult } = useExamStore();
  const exam = getExam(examId);
  const result = getResult(examId);

  const [showExplanations, setShowExplanations] = useState<Set<string>>(new Set());

  if (!exam || !result) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 container mx-auto py-8 px-4">
          <Alert>
            <AlertDescription>Không tìm thấy kết quả thi!</AlertDescription>
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

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      <main className="flex-1 container mx-auto py-8 max-w-5xl px-4">
      {/* Header with score */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-2xl">{exam.title}</CardTitle>
          <CardDescription>
            Học sinh: {result.studentName} • Ngày thi: {new Date(result.completedAt).toLocaleDateString('vi-VN')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Điểm số</p>
              <p className={`text-3xl font-bold ${getScoreColor(result.percentage)}`}>
                {result.score}/{result.totalScore}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Phần trăm</p>
              <p className={`text-3xl font-bold ${getScoreColor(result.percentage)}`}>
                {result.percentage.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Thời gian</p>
              <p className="text-xl font-semibold">
                {formatTime(result.timeSpent)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Đánh giá</p>
              <p className="text-xl font-semibold">
                {getScoreMessage(result.percentage)}
              </p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="flex gap-4 justify-center">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span>Đúng: {result.answers.filter(a => a.isCorrect).length}</span>
            </div>
            <div className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span>Sai: {result.answers.filter(a => !a.isCorrect).length}</span>
            </div>
          </div>
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
      <div className="flex gap-4 justify-center mt-8">
        <Button onClick={() => router.push('/exams')} variant="outline">
          <Home className="mr-2 h-4 w-4" />
          Danh sách đề thi
        </Button>
        <Button onClick={() => router.push(`/student/exam/${examId}`)}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Làm lại
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
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Câu {index + 1}</span>
              {question.type === 'essay' ? (
                <Badge className="bg-yellow-100 text-yellow-800">
                  Cần chấm điểm
                </Badge>
              ) : isCorrect ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                  Đúng
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800">
                  <XCircle className="mr-1 h-3 w-3" />
                  Sai
                </Badge>
              )}
              <Badge variant="outline">{question.points} điểm</Badge>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleExplanation}
              >
                <BookOpen className="mr-2 h-4 w-4" />
                {showExplanation ? 'Ẩn' : 'Xem'} giải thích
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChatOpen(true)}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
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

        {question.type === 'true-false' && (
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
              <ContentDisplay content={String(userAnswer || 'Không có câu trả lời')} />
            </div>
            <div className="p-3 bg-green-50 rounded-md">
              <p className="font-medium mb-2">Đáp án mẫu:</p>
              <ContentDisplay content={String(question.correctAnswer || '')} />
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

      <ChatDialog
        open={chatOpen}
        onOpenChange={setChatOpen}
        questionContext={questionContext}
      />
    </>
  );
}