'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QuestionEditor } from '@/components/exam/QuestionEditor';
import { useExamStore } from '@/store/exam-store';
import { Question, Exam } from '@/types/exam';
import { Plus, Save, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';

export default function ExamEditorPage() {
  const router = useRouter();
  const addExam = useExamStore(state => state.addExam);

  const [examData, setExamData] = useState<Partial<Exam>>({
    title: '',
    description: '',
    grade: 10,
    subject: 'Toán học',
    duration: 60,
    questions: [],
    author: 'Giáo viên',
    isPublished: false,
  });

  const addQuestion = () => {
    const newQuestion: Question = {
      id: uuidv4(),
      question: '',
      imageUrl: '',
      options: ['', ''],
      correctAnswer: 0,
      explanation: '',
      points: 1,
      type: 'multiple-choice',
      rubric: ''
    };

    setExamData(prev => ({
      ...prev,
      questions: [...(prev.questions || []), newQuestion],
    }));
  };

  const updateQuestion = (index: number, updatedQuestion: Question) => {
    setExamData(prev => {
      const newQuestions = [...(prev.questions || [])];
      newQuestions[index] = updatedQuestion;
      return { ...prev, questions: newQuestions };
    });
  };

  const deleteQuestion = (index: number) => {
    setExamData(prev => ({
      ...prev,
      questions: (prev.questions || []).filter((_, i) => i !== index),
    }));
  };

  const calculateTotalPoints = () => {
    return examData.questions?.reduce((sum, q) => sum + q.points, 0) || 0;
  };

  const handleSave = (publish = false) => {
    if (!examData.title || !examData.description) {
      toast.error('Vui lòng điền đầy đủ thông tin đề thi');
      return;
    }

    if (!examData.questions || examData.questions.length === 0) {
      toast.error('Đề thi cần có ít nhất một câu hỏi');
      return;
    }

    const exam: Exam = {
      id: uuidv4(),
      title: examData.title,
      description: examData.description,
      grade: examData.grade!,
      subject: examData.subject!,
      duration: examData.duration!,
      questions: examData.questions,
      author: examData.author!,
      totalPoints: calculateTotalPoints(),
      isPublished: publish,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    addExam(exam);
    toast.success(publish ? 'Đề thi đã được xuất bản!' : 'Đề thi đã được lưu!');
    router.push('/');
  };

  return (
    <div className="container mx-auto py-8 max-w-6xl">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Tạo đề thi mới</CardTitle>
          <CardDescription>
            Soạn thảo đề thi với hỗ trợ công thức toán học
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Exam Information */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Tiêu đề đề thi</Label>
              <Input
                id="title"
                value={examData.title}
                onChange={(e) => setExamData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Ví dụ: Đề kiểm tra giữa kỳ 1"
              />
            </div>
            <div>
              <Label htmlFor="grade">Khối lớp</Label>
              <Select
                value={String(examData.grade)}
                onValueChange={(value) => setExamData(prev => ({ ...prev, grade: Number(value) }))}
              >
                <SelectTrigger id="grade">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">Lớp 10</SelectItem>
                  <SelectItem value="11">Lớp 11</SelectItem>
                  <SelectItem value="12">Lớp 12</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={examData.description}
              onChange={(e) => setExamData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Mô tả ngắn về đề thi..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="duration">Thời gian làm bài (phút)</Label>
              <Input
                id="duration"
                type="number"
                value={examData.duration}
                onChange={(e) => setExamData(prev => ({ ...prev, duration: Number(e.target.value) }))}
                min="15"
                max="180"
              />
            </div>
            <div>
              <Label htmlFor="author">Tác giả</Label>
              <Input
                id="author"
                value={examData.author}
                onChange={(e) => setExamData(prev => ({ ...prev, author: e.target.value }))}
                placeholder="Tên giáo viên"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-semibold">
            Danh sách câu hỏi ({examData.questions?.length || 0} câu - {calculateTotalPoints()} điểm)
          </h2>
          <Button onClick={addQuestion}>
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

        {examData.questions?.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                Chưa có câu hỏi nào. Nhấn "Thêm câu hỏi" để bắt đầu.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4 mt-8">
        <Button
          variant="outline"
          onClick={() => router.push('/')}
        >
          Hủy
        </Button>
        <Button
          variant="outline"
          onClick={() => handleSave(false)}
        >
          <Save className="mr-2 h-4 w-4" />
          Lưu nháp
        </Button>
        <Button
          onClick={() => handleSave(true)}
        >
          <Eye className="mr-2 h-4 w-4" />
          Xuất bản
        </Button>
      </div>
    </div>
  );
}