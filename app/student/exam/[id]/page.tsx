'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import ContentDisplay from '@/components/editor/ContentDisplay';
import CustomEditorDynamic from '@/components/editor/CustomEditorDynamic';
import { useExamStore } from '@/store/exam-store';
import { Clock, ChevronLeft, ChevronRight, Send } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { ExamResult, SubQuestion } from '@/types/exam';

export default function ExamTakingPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const {
    getExam,
    userAnswers,
    setUserAnswer,
    clearUserAnswers,
    setExamStartTime,
    examStartTime,
    addResult
  } = useExamStore();

  const exam = getExam(examId);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [studentName, setStudentName] = useState('');
  const [hasStarted, setHasStarted] = useState(false);

  const currentQuestion = exam?.questions[currentQuestionIndex];

  // Timer effect
  useEffect(() => {
    if (!exam || !hasStarted) return;

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - examStartTime!.getTime()) / 1000);
      const remaining = Math.max(0, exam.duration * 60 - elapsed);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        handleSubmit();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [exam, hasStarted, examStartTime]);

  // Initialize on mount
  useEffect(() => {
    clearUserAnswers();
  }, []);

  if (!exam) {
    return (
      <div className="container mx-auto py-8">
        <Alert>
          <AlertDescription>Không tìm thấy đề thi!</AlertDescription>
        </Alert>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartExam = () => {
    if (!studentName.trim()) {
      toast.error('Vui lòng nhập họ và tên!');
      return;
    }
    setHasStarted(true);
    setExamStartTime(new Date());
    setTimeRemaining(exam.duration * 60);
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
  const isTrueFalseAnswered = (questionId: string, subQuestions: SubQuestion[] | undefined) => {
    const answerStr = userAnswers.get(questionId) as string;
    if (!answerStr || !subQuestions) return false;

    try {
      const answers = JSON.parse(answerStr);
      // Check if all sub-questions have been answered
      return subQuestions.every(sub => answers[sub.label] !== undefined);
    } catch {
      return false;
    }
  };

  const handleSubmit = () => {
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

    // Calculate score
    let correctAnswers = 0;
    let totalScore = 0;
    const answers = exam.questions.map(question => {
      const userAnswer = userAnswers.get(question.id);

      // Handle true-false with subQuestions
      if (question.type === 'true-false' && question.subQuestions && question.subQuestions.length > 0) {
        let subCorrect = 0;
        const totalSubs = question.subQuestions.length;

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

        // All sub-questions must be correct for full points
        const isAllCorrect = subCorrect === totalSubs;
        // Partial scoring: proportional points based on correct sub-questions
        const partialScore = (subCorrect / totalSubs) * question.points;

        if (isAllCorrect) {
          correctAnswers++;
        }
        totalScore += partialScore;

        return {
          questionId: question.id,
          userAnswer: userAnswer || '',
          isCorrect: isAllCorrect,
          subCorrect,
          totalSubs
        };
      }

      // Handle other question types
      const isCorrect = userAnswer !== undefined &&
        String(userAnswer) === String(question.correctAnswer);

      if (isCorrect) {
        correctAnswers++;
        totalScore += question.points;
      }

      return {
        questionId: question.id,
        userAnswer: userAnswer || '',
        isCorrect
      };
    });

    const result: ExamResult = {
      examId: exam.id,
      studentName,
      score: totalScore,
      totalScore: exam.totalPoints,
      percentage: (totalScore / exam.totalPoints) * 100,
      answers,
      completedAt: new Date(),
      timeSpent: exam.duration * 60 - timeRemaining
    };

    addResult(result);
    toast.success('Đã nộp bài thành công!');
    router.push(`/student/result/${exam.id}`);
  };

  // Start screen
  if (!hasStarted) {
    return (
      <div className="container mx-auto py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{exam.title}</CardTitle>
            <CardDescription>{exam.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-semibold">Môn học:</span> {exam.subject}
              </div>
              <div>
                <span className="font-semibold">Khối lớp:</span> {exam.grade}
              </div>
              <div>
                <span className="font-semibold">Thời gian:</span> {exam.duration} phút
              </div>
              <div>
                <span className="font-semibold">Số câu:</span> {exam.questions.length}
              </div>
              <div>
                <span className="font-semibold">Tổng điểm:</span> {exam.totalPoints}
              </div>
              <div>
                <span className="font-semibold">Giáo viên:</span> {exam.author}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Họ và tên học sinh</Label>
              <input
                id="name"
                type="text"
                className="w-full px-3 py-2 border rounded-md"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Nhập họ và tên..."
              />
            </div>

            <Button
              onClick={handleStartExam}
              className="w-full"
              size="lg"
            >
              Bắt đầu làm bài
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Exam taking screen
  return (
    <div className="container mx-auto py-4 max-w-6xl">
      <div className="grid grid-cols-4 gap-4">
        {/* Main content */}
        <div className="col-span-3 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{exam.title}</CardTitle>
                  <CardDescription>
                    Câu {currentQuestionIndex + 1} / {exam.questions.length}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span className={`font-mono ${timeRemaining < 300 ? 'text-red-500' : ''}`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
              </div>
              <Progress
                value={(currentQuestionIndex + 1) / exam.questions.length * 100}
                className="mt-2"
              />
            </CardHeader>
            <CardContent className="space-y-6">
              {currentQuestion && (
                <>
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">
                        {currentQuestion.points} điểm
                      </Badge>
                      <Badge variant="outline">
                        {currentQuestion.type === 'multiple-choice' ? 'Trắc nghiệm' :
                         currentQuestion.type === 'true-false' ? 'Đúng/Sai' :
                         currentQuestion.type === 'essay' ? 'Tự luận' : 'Điền vào'}
                      </Badge>
                    </div>
                    <div className="text-lg">
                      <ContentDisplay content={currentQuestion.question} />
                      {currentQuestion.imageUrl && (
                        <img
                          src={currentQuestion.imageUrl}
                          alt="Hình minh họa"
                          className="mt-4 max-w-full rounded border"
                        />
                      )}
                    </div>
                  </div>

                  {currentQuestion.type === 'essay' ? (
                    <div className="space-y-2">
                      <Label>Nhập câu trả lời của bạn:</Label>
                      <CustomEditorDynamic
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

                  <div className="flex justify-between pt-4">
                    <Button
                      variant="outline"
                      onClick={() => goToQuestion(currentQuestionIndex - 1)}
                      disabled={currentQuestionIndex === 0}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Câu trước
                    </Button>
                    {currentQuestionIndex < exam.questions.length - 1 ? (
                      <Button
                        onClick={() => goToQuestion(currentQuestionIndex + 1)}
                      >
                        Câu tiếp
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSubmit}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Nộp bài
                      </Button>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Question navigator */}
        <div className="col-span-1">
          <Card className="sticky top-4">
            <CardHeader>
              <CardTitle className="text-sm">Danh sách câu hỏi</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                {exam.questions.map((question, idx) => {
                  // Check if answered (handle true-false with subQuestions)
                  let isAnswered = false;
                  if (question.type === 'true-false' && question.subQuestions && question.subQuestions.length > 0) {
                    isAnswered = isTrueFalseAnswered(question.id, question.subQuestions);
                  } else {
                    isAnswered = userAnswers.has(question.id) && userAnswers.get(question.id) !== '';
                  }
                  const isCurrent = idx === currentQuestionIndex;

                  return (
                    <Button
                      key={question.id}
                      variant={isCurrent ? 'default' : isAnswered ? 'secondary' : 'outline'}
                      size="sm"
                      onClick={() => goToQuestion(idx)}
                      className="h-8"
                    >
                      {idx + 1}
                    </Button>
                  );
                })}
              </div>

              <div className="mt-4 space-y-1 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-primary rounded"></div>
                  <span>Câu hiện tại</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-secondary rounded"></div>
                  <span>Đã trả lời</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border rounded"></div>
                  <span>Chưa trả lời</span>
                </div>
              </div>

              <Button
                className="w-full mt-4"
                variant="destructive"
                onClick={handleSubmit}
                size="sm"
              >
                <Send className="mr-2 h-4 w-4" />
                Nộp bài
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}