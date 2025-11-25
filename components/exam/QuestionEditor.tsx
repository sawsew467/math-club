"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CustomEditorDynamic from "@/components/editor/CustomEditorDynamic";
import ContentDisplay from "@/components/editor/ContentDisplay";
import { Trash2, Plus, ImageIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Question } from "@/types/exam";

interface QuestionEditorProps {
  question: Question;
  index: number;
  onUpdate: (question: Question) => void;
  onDelete: () => void;
}

export function QuestionEditor({
  question,
  index,
  onUpdate,
  onDelete,
}: QuestionEditorProps) {
  const [isPreview, setIsPreview] = useState(true); // Default to preview mode

  const updateField = (field: keyof Question, value: any) => {
    onUpdate({ ...question, [field]: value });
  };

  const updateOption = (optionIndex: number, value: string) => {
    const newOptions = [...question.options];
    newOptions[optionIndex] = value;
    updateField("options", newOptions);
  };

  const addOption = () => {
    if (question.options.length < 6) {
      updateField("options", [...question.options, ""]);
    }
  };

  const removeOption = (optionIndex: number) => {
    if (question.options.length > 2) {
      const newOptions = question.options.filter((_, i) => i !== optionIndex);
      updateField("options", newOptions);

      // Adjust correct answer if needed
      if (typeof question.correctAnswer === 'number' && question.correctAnswer >= optionIndex && question.correctAnswer > 0) {
        updateField("correctAnswer", question.correctAnswer - 1);
      }
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          Câu {index + 1}
          {question.hasImage && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
              <ImageIcon className="h-3 w-3" />
              Có hình
            </span>
          )}
        </CardTitle>
        <div className="flex gap-2">
          <Button
            type="button"
            variant={isPreview ? "default" : "outline"}
            size="sm"
            onClick={() => setIsPreview(!isPreview)}
          >
            {isPreview ? "Chỉnh sửa" : "Xem trước"}
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isPreview ? (
          // Preview Mode
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Câu hỏi:</h4>
              <ContentDisplay content={question.question} />
              {question.imageUrl && (
                <img
                  src={question.imageUrl}
                  alt="Hình minh họa"
                  className="mt-2 max-w-md rounded border"
                />
              )}
              {question.imageDescription && !question.imageUrl && (
                <div className="mt-2 p-3 bg-yellow-50 rounded border border-yellow-200">
                  <div className="text-sm text-yellow-800">
                    <span className="font-medium">Mô tả hình:</span>{" "}
                    <ContentDisplay content={question.imageDescription} className="inline" />
                  </div>
                </div>
              )}
            </div>

            <div>
              <h4 className="font-semibold mb-2">Đáp án:</h4>
              {question.type === "essay" ? (
                <div className="space-y-2">
                  {/* Sample Answer - from sampleAnswer or correctAnswer */}
                  <div className="p-3 bg-gray-50 rounded">
                    <p className="text-sm font-medium mb-1">Đáp án mẫu:</p>
                    <ContentDisplay
                      content={question.sampleAnswer || String(question.correctAnswer || "")}
                    />
                  </div>
                  {/* Rubric - grading criteria */}
                  {question.rubric && (
                    <div className="p-3 bg-blue-50 rounded">
                      <p className="text-sm font-medium mb-1">Tiêu chí chấm:</p>
                      <ContentDisplay content={question.rubric} />
                    </div>
                  )}
                </div>
              ) : question.type === "multiple-choice" ? (
                <RadioGroup value={String(question.correctAnswer)} disabled>
                  {question.options.map((option, idx) => (
                    <div key={idx} className="flex items-start space-x-2 mb-2">
                      <RadioGroupItem value={String(idx)} />
                      <Label className="font-normal cursor-pointer">
                        <ContentDisplay content={option} />
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              ) : question.type === "true-false" ? (
                <div className="space-y-2">
                  {question.subQuestions && question.subQuestions.length > 0 ? (
                    question.subQuestions.map((sub, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="font-semibold">{sub.label})</span>
                        {sub.content && (
                          <span className="flex-1">
                            <ContentDisplay content={sub.content} />
                          </span>
                        )}
                        <span className={`px-2 py-1 rounded text-sm font-medium ${
                          sub.correct
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}>
                          {sub.correct ? "Đúng" : "Sai"}
                        </span>
                      </div>
                    ))
                  ) : (
                    <span>{question.correctAnswer === 0 ? "Đúng" : "Sai"}</span>
                  )}
                </div>
              ) : (
                <div>Điền vào: {String(question.correctAnswer)}</div>
              )}
            </div>

            <div>
              <h4 className="font-semibold mb-2">Giải thích:</h4>
              <ContentDisplay content={question.explanation} />
            </div>

            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>
                Loại:{" "}
                {question.type === "multiple-choice"
                  ? "Trắc nghiệm"
                  : question.type === "true-false"
                  ? "Đúng/Sai"
                  : question.type === "essay"
                  ? "Tự luận"
                  : "Điền vào"}
              </span>
              <span>Điểm: {question.points}</span>
            </div>
          </div>
        ) : (
          // Edit Mode
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Loại câu hỏi</Label>
                <Select
                  value={question.type}
                  onValueChange={(value: any) => updateField("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiple-choice">Trắc nghiệm</SelectItem>
                    <SelectItem value="true-false">Đúng/Sai</SelectItem>
                    <SelectItem value="fill-in">Điền vào</SelectItem>
                    <SelectItem value="essay">Tự luận</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Điểm</Label>
                <Input
                  type="number"
                  value={question.points}
                  onChange={(e) =>
                    updateField("points", Number(e.target.value))
                  }
                  min="1"
                  max="10"
                />
              </div>
            </div>

            <div>
              <Label>Câu hỏi</Label>
              <CustomEditorDynamic
                value={question.question}
                onChange={(value) => updateField('question', value)}
                placeholder="Nhập câu hỏi..."
                minHeight="150px"
              />
            </div>
            {/* Image Warning Alert - reminds to add image to editor */}
            {question.hasImage && (
              <Alert className="border-orange-500 bg-orange-50">
                <ImageIcon className="h-4 w-4 text-orange-600" />
                <AlertDescription className="text-orange-800">
                  <strong>Câu hỏi này có hình ảnh!</strong>
                  <p className="mt-1 text-sm">
                    Nhấn nút <strong>🖼️ (Insert image)</strong> trên thanh công cụ hoặc <strong>kéo thả ảnh</strong> vào editor để thêm hình.
                  </p>
                  {question.imageDescription && (
                    <div className="mt-2 text-sm bg-orange-100 p-2 rounded">
                      <strong>Mô tả hình:</strong>{" "}
                      <ContentDisplay content={question.imageDescription} className="inline" />
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            )}

            {question.type === "multiple-choice" && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Các lựa chọn</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addOption}
                    disabled={question.options.length >= 6}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Thêm lựa chọn
                  </Button>
                </div>
                <RadioGroup
                  value={String(question.correctAnswer)}
                  onValueChange={(value) =>
                    updateField("correctAnswer", Number(value))
                  }
                >
                  {question.options.map((option, idx) => (
                    <div key={idx} className="flex gap-2 items-start">
                      <RadioGroupItem value={String(idx)} className="mt-2" />
                      <div className="flex-1">
                        <CustomEditorDynamic
                          value={option}
                          onChange={(value: string) => updateOption(idx, value)}
                          placeholder={`Lựa chọn ${String.fromCharCode(
                            65 + idx
                          )}`}
                          minHeight="100px"
                        />
                      </div>
                      {question.options.length > 2 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeOption(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </RadioGroup>
                <p className="text-sm text-muted-foreground mt-2">
                  Click vào ô tròn để chọn đáp án đúng
                </p>
              </div>
            )}

            {question.type === "true-false" && (
              <div className="space-y-4">
                <Label>Các mệnh đề đúng/sai</Label>
                {question.subQuestions && question.subQuestions.length > 0 ? (
                  <div className="space-y-3">
                    {question.subQuestions.map((sub, idx) => (
                      <div key={idx} className="flex items-start gap-3 p-3 bg-gray-50 rounded">
                        <span className="font-semibold text-sm min-w-[20px]">{sub.label})</span>
                        <div className="flex-1">
                          {sub.content && (
                            <ContentDisplay content={sub.content} />
                          )}
                        </div>
                        <Select
                          value={sub.correct ? "true" : "false"}
                          onValueChange={(value) => {
                            const newSubQuestions = [...(question.subQuestions || [])];
                            newSubQuestions[idx] = { ...sub, correct: value === "true" };
                            updateField("subQuestions", newSubQuestions);
                          }}
                        >
                          <SelectTrigger className="w-[100px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="true">Đúng</SelectItem>
                            <SelectItem value="false">Sai</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Fallback for simple true-false
                  <RadioGroup
                    value={String(question.correctAnswer)}
                    onValueChange={(value) =>
                      updateField("correctAnswer", Number(value))
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="0" />
                      <Label>Đúng</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="1" />
                      <Label>Sai</Label>
                    </div>
                  </RadioGroup>
                )}
              </div>
            )}

            {question.type === "essay" && (
              <div className="space-y-4">
                <div>
                  <Label>Đáp án mẫu / Gợi ý trả lời</Label>
                  <CustomEditorDynamic
                    value={String(question.correctAnswer || "")}
                    onChange={(value: string) =>
                      updateField("correctAnswer", value)
                    }
                    placeholder="Nhập đáp án mẫu hoặc gợi ý trả lời..."
                    minHeight="200px"
                  />
                </div>
                <div>
                  <Label>Tiêu chí chấm điểm</Label>
                  <CustomEditorDynamic
                    value={question.rubric || ""}
                    onChange={(value: string) => updateField("rubric", value)}
                    placeholder="Nhập tiêu chí chấm điểm (ví dụ: Trình bày rõ ràng: 2đ, Đáp án đúng: 3đ...)"
                    minHeight="150px"
                  />
                </div>
              </div>
            )}

            <div>
              <Label>Giải thích chi tiết</Label>
              <CustomEditorDynamic
                value={question.explanation}
                onChange={(value: string) => updateField("explanation", value)}
                placeholder="Nhập giải thích cho đáp án đúng..."
                minHeight="150px"
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
