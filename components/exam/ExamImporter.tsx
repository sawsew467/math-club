"use client";

import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, FileText, AlertCircle, CheckCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Question } from "@/types/exam";
import { convertPDFToImages } from "@/lib/pdfToImages";

interface ExamImporterProps {
  onImportSuccess: (questions: Question[]) => void;
}

export function ExamImporter({ onImportSuccess }: ExamImporterProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError('Chỉ hỗ trợ file PDF. Vui lòng chọn file PDF.');
        setSelectedFile(null);
        return;
      }

      // Kiểm tra kích thước file (giới hạn 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File quá lớn. Vui lòng chọn file nhỏ hơn 10MB.');
        setSelectedFile(null);
        return;
      }

      setSelectedFile(file);
      setError(null);
      setSuccess(null);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setError('Vui lòng chọn file PDF trước');
      return;
    }

    setIsUploading(true);
    setError(null);
    setSuccess(null);
    setProgress(0);

    try {
      // Step 1: Convert PDF to images (client-side)
      setStatusMessage('Đang chuyển đổi PDF thành hình ảnh...');
      setProgress(10);

      const images = await convertPDFToImages(selectedFile, {
        scale: 2,
        maxPages: 10, // Limit to 10 pages to avoid too large request
      });

      setProgress(40);
      setStatusMessage(`Đã chuyển đổi ${images.length} trang. Đang gửi cho AI phân tích...`);

      // Step 2: Send images to API
      const response = await fetch('/api/exam/extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          images: images.map(img => img.base64),
        }),
      });

      setProgress(70);
      setStatusMessage('Đang xử lý kết quả từ AI...');

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Có lỗi xảy ra khi xử lý file');
      }

      if (data.success && data.questions) {
        setProgress(100);
        setStatusMessage('Hoàn thành!');
        setSuccess(data.message || `Đã trích xuất ${data.questions.length} câu hỏi thành công!`);
        onImportSuccess(data.questions);

        // Reset form after a delay
        setTimeout(() => {
          setSelectedFile(null);
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          setProgress(0);
          setStatusMessage('');
        }, 2000);
      } else {
        throw new Error('Không thể trích xuất câu hỏi từ file');
      }
    } catch (err) {
      const error = err as Error;
      console.error('Import error:', error);
      setError(error.message || 'Có lỗi xảy ra khi import đề thi');
      setProgress(0);
      setStatusMessage('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="mb-6 border-2 border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import đề thi từ file PDF
        </CardTitle>
        <CardDescription>
          Upload file PDF đề thi, AI sẽ tự động trích xuất câu hỏi.
          Bạn có thể xem lại và chỉnh sửa trước khi lưu.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Input */}
        <div className="flex flex-col gap-4">
          <div className="flex gap-2 items-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleButtonClick}
              disabled={isUploading}
            >
              <FileText className="h-4 w-4 mr-2" />
              Chọn file PDF
            </Button>

            {selectedFile && (
              <span className="text-sm text-muted-foreground">
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)
              </span>
            )}
          </div>

          {selectedFile && (
            <>
              <Button
                onClick={handleImport}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Trích xuất câu hỏi bằng AI
                  </>
                )}
              </Button>

              {isUploading && (
                <div className="space-y-2">
                  <Progress value={progress} className="w-full" />
                  <p className="text-sm text-muted-foreground text-center">
                    {statusMessage}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Success Alert */}
        {success && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {success}
            </AlertDescription>
          </Alert>
        )}

        {/* Instructions */}
        <div className="text-sm text-muted-foreground space-y-2 border-t pt-4">
          <p className="font-semibold">Tính năng mới - GPT-4 Vision:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>✅ <strong>Nhận dạng công thức toán</strong>: MathType, ký tự đặc biệt tự động convert sang LaTeX</li>
            <li>✅ <strong>Xử lý hình ảnh</strong>: AI mô tả chi tiết hình vẽ, đồ thị trong đề thi</li>
            <li>✅ <strong>Đa dạng dạng câu hỏi</strong>: Trắc nghiệm, Đúng/Sai, Điền vào, Tự luận</li>
            <li>✅ <strong>Giới hạn</strong>: Tối đa 10 trang đầu tiên, file {'<'} 10MB</li>
            <li>⚠️ <strong>Quan trọng</strong>: Luôn kiểm tra lại kết quả AI trước khi lưu!</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
