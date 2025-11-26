"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { QuestionEditor } from "@/components/exam/QuestionEditor";
import { ExamImporter } from "@/components/exam/ExamImporter";
import { ExamPreview } from "@/components/exam/ExamPreview";
import { fetchExamById, updateExam as updateExamApi } from "@/lib/api/exams";
import { Question, Exam } from "@/types/exam";
import {
  Plus,
  Save,
  Eye,
  Upload,
  Edit,
  ArrowLeft,
  AlertCircle,
  Clock,
  FileText,
  GraduationCap,
  Settings,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { v4 as uuidv4 } from "uuid";

export default function EditExamPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [examData, setExamData] = useState<Partial<Exam>>({
    title: "",
    description: "",
    grade: 10,
    subject: "Toán học",
    duration: 60,
    questions: [],
    author: "Giáo viên",
    isPublished: false,
  });
  const [originalExam, setOriginalExam] = useState<Exam | null>(null);
  const [importedQuestions, setImportedQuestions] = useState<Question[] | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<string>("manual");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadExam = async () => {
      setIsLoading(true);
      const result = await fetchExamById(examId);

      if (result.success && result.data) {
        const exam = result.data;
        setOriginalExam(exam);
        setExamData({
          title: exam.title,
          description: exam.description,
          grade: exam.grade,
          subject: exam.subject,
          duration: exam.duration,
          questions: exam.questions,
          author: exam.author,
          isPublished: exam.isPublished,
        });
      } else {
        setError(result.error || "Không tìm thấy đề thi");
      }
      setIsLoading(false);
    };

    loadExam();
  }, [examId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-500">Đang tải đề thi...</p>
        </div>
      </div>
    );
  }

  if (error || !originalExam) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error || `Không tìm thấy đề thi với ID: ${examId}`}
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => router.push("/teacher")}
              className="mt-4 w-full"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Quay lại quản lý đề thi
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const addQuestion = () => {
    const newQuestion: Question = {
      id: uuidv4(),
      question: "",
      imageUrl: "",
      options: ["", ""],
      correctAnswer: 0,
      explanation: "",
      points: 1,
      type: "multiple-choice",
      rubric: "",
    };

    setExamData((prev) => ({
      ...prev,
      questions: [...(prev.questions || []), newQuestion],
    }));
  };

  const updateQuestion = (index: number, updatedQuestion: Question) => {
    setExamData((prev) => {
      const newQuestions = [...(prev.questions || [])];
      newQuestions[index] = updatedQuestion;
      return { ...prev, questions: newQuestions };
    });
  };

  const deleteQuestion = (index: number) => {
    setExamData((prev) => ({
      ...prev,
      questions: (prev.questions || []).filter((_, i) => i !== index),
    }));
  };

  const calculateTotalPoints = () => {
    return examData.questions?.reduce((sum, q) => sum + q.points, 0) || 0;
  };

  const handleImportSuccess = (questions: Question[]) => {
    setImportedQuestions(questions);
    toast.success("Đã trích xuất câu hỏi thành công! Vui lòng kiểm tra lại.");
  };

  const handleAcceptImport = () => {
    if (importedQuestions) {
      setExamData((prev) => ({
        ...prev,
        questions: [...(prev.questions || []), ...importedQuestions],
      }));
      setImportedQuestions(null);
      setActiveTab("manual");
      toast.success("Đã thêm câu hỏi vào đề thi!");
    }
  };

  const handleCancelImport = () => {
    setImportedQuestions(null);
    toast.info("Đã hủy import. Bạn có thể thử lại với file khác.");
  };

  const handleSave = async (publish = false) => {
    if (!examData.title || !examData.description) {
      toast.error("Vui lòng điền đầy đủ thông tin đề thi");
      return;
    }

    if (!examData.questions || examData.questions.length === 0) {
      toast.error("Đề thi cần có ít nhất một câu hỏi");
      return;
    }

    setIsSaving(true);

    const result = await updateExamApi(examId, {
      title: examData.title,
      description: examData.description,
      grade: examData.grade!,
      subject: examData.subject!,
      duration: examData.duration!,
      questions: examData.questions,
      author: examData.author!,
      totalPoints: calculateTotalPoints(),
      isPublished: publish,
    });

    setIsSaving(false);

    if (result.success) {
      toast.success(
        publish ? "Đề thi đã được xuất bản!" : "Đề thi đã được cập nhật!"
      );
      router.push("/teacher");
    } else {
      toast.error(result.error || "Không thể cập nhật đề thi");
    }
  };

  const questionCount = examData.questions?.length || 0;
  const totalPoints = calculateTotalPoints();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/teacher")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">Quay lại</span>
              </Button>
              <div className="h-6 w-px bg-gray-200" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Edit className="h-4 w-4 text-orange-600" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="font-semibold text-gray-900 text-sm leading-tight">
                    Chỉnh sửa đề thi
                  </h1>
                  <p className="text-xs text-gray-500 truncate max-w-[200px]">
                    {examData.title || "Chưa có tiêu đề"}
                  </p>
                </div>
                <div className="sm:hidden">
                  <h1 className="font-semibold text-gray-900 text-sm">
                    Chỉnh sửa
                  </h1>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <FileText className="h-4 w-4" />
                <span>{questionCount} câu hỏi</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CheckCircle className="h-4 w-4" />
                <span>{totalPoints} điểm</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>{examData.duration} phút</span>
              </div>
              {originalExam.isPublished && (
                <Badge className="bg-green-100 text-green-700">
                  Đã xuất bản
                </Badge>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSave(false)}
                className="hidden sm:flex"
                disabled={isSaving}
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Lưu
              </Button>
              <Button size="sm" onClick={() => handleSave(true)} disabled={isSaving}>
                {isSaving ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Eye className="h-4 w-4 mr-2" />
                )}
                {originalExam.isPublished ? "Cập nhật" : "Xuất bản"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Mobile Stats */}
        <div className="md:hidden mb-4">
          <div className="flex items-center justify-center gap-4 p-3 bg-white rounded-lg border">
            <div className="flex items-center gap-1 text-sm">
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{questionCount}</span>
              <span className="text-gray-500">câu</span>
            </div>
            <div className="h-4 w-px bg-gray-200" />
            <div className="flex items-center gap-1 text-sm">
              <CheckCircle className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{totalPoints}</span>
              <span className="text-gray-500">điểm</span>
            </div>
            <div className="h-4 w-px bg-gray-200" />
            <div className="flex items-center gap-1 text-sm">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="font-medium">{examData.duration}</span>
              <span className="text-gray-500">phút</span>
            </div>
          </div>
        </div>

        {/* Exam Info Card */}
        <Card className="mb-6">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-500" />
              <CardTitle className="text-lg">Thông tin đề thi</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <Label htmlFor="title">Tiêu đề đề thi *</Label>
                <Input
                  id="title"
                  value={examData.title}
                  onChange={(e) =>
                    setExamData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="Ví dụ: Đề kiểm tra giữa kỳ 1 - Chương Hàm số"
                  className="mt-1"
                />
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="description">Mô tả *</Label>
                <Textarea
                  id="description"
                  value={examData.description}
                  onChange={(e) =>
                    setExamData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Mô tả ngắn về nội dung, phạm vi kiến thức của đề thi..."
                  rows={2}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="grade">Khối lớp</Label>
                <Select
                  value={String(examData.grade)}
                  onValueChange={(value) =>
                    setExamData((prev) => ({ ...prev, grade: Number(value) }))
                  }
                >
                  <SelectTrigger id="grade" className="mt-1 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">Lớp 10</SelectItem>
                    <SelectItem value="11">Lớp 11</SelectItem>
                    <SelectItem value="12">Lớp 12</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="duration">Thời gian (phút)</Label>
                <Input
                  id="duration"
                  type="number"
                  value={examData.duration}
                  onChange={(e) =>
                    setExamData((prev) => ({
                      ...prev,
                      duration: Number(e.target.value),
                    }))
                  }
                  min="15"
                  max="180"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Import Preview - Show when questions are imported */}
        {importedQuestions && (
          <ExamPreview
            questions={importedQuestions}
            onQuestionsUpdate={setImportedQuestions}
            onAccept={handleAcceptImport}
            onCancel={handleCancelImport}
          />
        )}

        {/* Questions Section */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-gray-500" />
                <CardTitle className="text-lg">Câu hỏi</CardTitle>
                {questionCount > 0 && (
                  <Badge variant="secondary">
                    {questionCount} câu - {totalPoints} điểm
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs
              value={activeTab}
              onValueChange={setActiveTab}
              className="space-y-4"
            >
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <Edit className="h-4 w-4" />
                  Chỉnh sửa câu hỏi
                </TabsTrigger>
                <TabsTrigger value="import" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Thêm từ PDF
                </TabsTrigger>
              </TabsList>

              <TabsContent value="manual" className="space-y-4">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    Chỉnh sửa các câu hỏi hiện có hoặc thêm câu hỏi mới
                  </p>
                  <Button onClick={addQuestion} size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm câu hỏi
                  </Button>
                </div>

                {examData.questions?.map((question, index) => (
                  <QuestionEditor
                    key={question.id}
                    question={question}
                    index={index}
                    onUpdate={(q) => updateQuestion(index, q)}
                    onDelete={() => deleteQuestion(index)}
                  />
                ))}

                {questionCount === 0 && (
                  <div className="text-center py-12 border-2 border-dashed rounded-lg">
                    <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-2">Chưa có câu hỏi nào</p>
                    <p className="text-sm text-gray-400 mb-4">
                      Nhấn &quot;Thêm câu hỏi&quot; để bắt đầu hoặc chuyển sang
                      tab &quot;Thêm từ PDF&quot;
                    </p>
                    <Button onClick={addQuestion} variant="outline" size="sm">
                      <Plus className="mr-2 h-4 w-4" />
                      Thêm câu hỏi đầu tiên
                    </Button>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="import" className="space-y-4">
                <Alert>
                  <AlertDescription>
                    Import thêm câu hỏi từ file PDF. Các câu hỏi mới sẽ được
                    thêm vào cuối danh sách hiện có.
                  </AlertDescription>
                </Alert>
                <ExamImporter onImportSuccess={handleImportSuccess} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Bottom Actions - Mobile */}
        <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t p-4 flex gap-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => handleSave(false)}
            disabled={isSaving}
          >
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Lưu
          </Button>
          <Button className="flex-1" onClick={() => handleSave(true)} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Eye className="h-4 w-4 mr-2" />
            )}
            {originalExam.isPublished ? "Cập nhật" : "Xuất bản"}
          </Button>
        </div>

        {/* Spacer for mobile bottom actions */}
        <div className="sm:hidden h-20" />
      </main>
    </div>
  );
}
