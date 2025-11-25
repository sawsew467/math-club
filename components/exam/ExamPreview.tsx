"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { QuestionEditor } from "./QuestionEditor";
import { Question } from "@/types/exam";
import {
  CheckCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  ImageIcon,
} from "lucide-react";

interface ExamPreviewProps {
  questions: Question[];
  onQuestionsUpdate: (questions: Question[]) => void;
  onAccept: () => void;
  onCancel: () => void;
}

export function ExamPreview({
  questions,
  onQuestionsUpdate,
  onAccept,
  onCancel,
}: ExamPreviewProps) {
  const [expandedAll, setExpandedAll] = useState(false);

  const handleQuestionUpdate = (index: number, updatedQuestion: Question) => {
    const newQuestions = [...questions];
    newQuestions[index] = updatedQuestion;
    onQuestionsUpdate(newQuestions);
  };

  const handleQuestionDelete = (index: number) => {
    const newQuestions = questions.filter((_, i) => i !== index);
    onQuestionsUpdate(newQuestions);
  };

  const toggleExpandAll = () => {
    setExpandedAll(!expandedAll);
  };

  if (questions.length === 0) {
    return null;
  }

  return (
    <Card className="mb-6 border-green-500 border-2 gap-0">
      <CardHeader className="bg-green-50 py-4">
        <CardTitle className="flex items-center gap-2 text-green-800">
          <CheckCircle className="h-5 w-5" />
          Đề thi đã được trích xuất - Vui lòng kiểm tra
        </CardTitle>
        <CardDescription className="text-green-700">
          AI đã trích xuất <strong>{questions.length} câu hỏi</strong>. Vui lòng
          xem lại và chỉnh sửa nếu cần thiết trước khi lưu.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {/* Alert */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <strong>Quan trọng:</strong> AI có thể mắc lỗi trong quá trình trích
            xuất. Hãy kiểm tra kỹ từng câu hỏi, đặc biệt là:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Đáp án đúng đã được chọn chính xác chưa</li>
              <li>Công thức toán có hiển thị đúng không</li>
              <li>Các lựa chọn A, B, C, D có đầy đủ không</li>
              <li>Giải thích chi tiết có đầy đủ không</li>
            </ul>
          </AlertDescription>
        </Alert>

        {/* Actions */}
        <div className="flex justify-between items-center border-b pb-4">
          <div className="text-sm text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
            <span>
              Tổng số câu: <strong>{questions.length}</strong>
            </span>
            <span>
              Tổng điểm:{" "}
              <strong>{questions.reduce((sum, q) => sum + q.points, 0)}</strong>
            </span>
            {questions.filter((q) => q.hasImage).length > 0 && (
              <span className="text-orange-600 flex items-center gap-1">
                <ImageIcon className="h-4 w-4" />
                <strong>
                  {questions.filter((q) => q.hasImage).length}
                </strong>{" "}
                câu có hình
              </span>
            )}
          </div>
        </div>

        {/* Questions List */}
        <div className="space-y-4">
          {questions.map((question, index) => (
            <QuestionEditor
              key={question.id}
              question={question}
              index={index}
              onUpdate={(updated) => handleQuestionUpdate(index, updated)}
              onDelete={() => handleQuestionDelete(index)}
            />
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="flex gap-4 pt-6 border-t">
          <Button
            type="button"
            onClick={onAccept}
            className="flex-1 bg-green-600 hover:bg-green-700"
            size="lg"
          >
            <CheckCircle className="h-5 w-5 mr-2" />
            Xác nhận và sử dụng đề thi này
          </Button>
          <Button type="button" variant="outline" onClick={onCancel} size="lg">
            Hủy và import lại
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
