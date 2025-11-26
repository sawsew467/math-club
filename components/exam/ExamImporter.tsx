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
      // Step 1: Convert PDF to images (client-side) with lower scale for smaller payload
      setStatusMessage('Đang chuyển đổi PDF thành hình ảnh...');
      setProgress(5);

      const images = await convertPDFToImages(selectedFile, {
        scale: 1.5, // Reduced from 2 for smaller payload
        maxPages: 20,
      });

      setProgress(15);

      const totalPages = images.length;
      const BATCH_SIZE = 5; // Process 5 pages at a time to stay within Vercel limits
      const batches: string[][] = [];

      // Split images into batches
      for (let i = 0; i < images.length; i += BATCH_SIZE) {
        batches.push(images.slice(i, i + BATCH_SIZE).map(img => img.base64));
      }

      setStatusMessage(`Đã chuyển đổi ${totalPages} trang. Xử lý theo ${batches.length} đợt...`);

      // Step 2: Process batches sequentially
      const allQuestions: Question[] = [];

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const batchNum = batchIndex + 1;
        const startPage = batchIndex * BATCH_SIZE + 1;
        const endPage = Math.min((batchIndex + 1) * BATCH_SIZE, totalPages);

        setStatusMessage(`Đang phân tích trang ${startPage}-${endPage}/${totalPages} (đợt ${batchNum}/${batches.length})...`);

        // Calculate progress: 15% for conversion, 70% for processing batches, 15% for finishing
        const batchProgress = 15 + ((batchIndex + 1) / batches.length) * 70;
        setProgress(Math.round(batchProgress));

        const response = await fetch('/api/exam/extract', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            images: batch,
            batchInfo: {
              batchNumber: batchNum,
              totalBatches: batches.length,
              startPage,
              endPage,
              totalPages,
            },
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          // If one batch fails, continue with others but log error
          console.error(`Batch ${batchNum} failed:`, data.error);
          continue;
        }

        if (data.success && data.questions) {
          // Add batch questions with adjusted IDs
          const batchQuestions = data.questions.map((q: Question, idx: number) => ({
            ...q,
            id: `q-${Date.now()}-${allQuestions.length + idx}`,
          }));
          allQuestions.push(...batchQuestions);
        }
      }

      // Step 3: Deduplicate questions (remove duplicates that might appear across batches)
      setProgress(90);
      setStatusMessage('Đang xử lý và loại bỏ trùng lặp...');

      const uniqueQuestions = deduplicateQuestions(allQuestions);

      if (uniqueQuestions.length > 0) {
        setProgress(100);
        setStatusMessage('Hoàn thành!');
        setSuccess(`Đã trích xuất ${uniqueQuestions.length} câu hỏi từ ${totalPages} trang!`);
        onImportSuccess(uniqueQuestions);

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

  // Helper function to deduplicate questions based on content similarity
  const deduplicateQuestions = (questions: Question[]): Question[] => {
    const seen = new Map<string, Question>();

    for (const q of questions) {
      // Create a simple hash from first 100 chars of question text
      const textContent = q.question.replace(/<[^>]*>/g, '').trim();
      const hash = textContent.substring(0, 100).toLowerCase();

      if (!seen.has(hash)) {
        seen.set(hash, q);
      }
    }

    return Array.from(seen.values());
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
          <p className="font-semibold">Tính năng GPT-4 Vision:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>✅ <strong>Nhận dạng công thức toán</strong>: MathType, ký tự đặc biệt tự động convert sang LaTeX</li>
            <li>✅ <strong>Xử lý hình ảnh</strong>: AI mô tả chi tiết hình vẽ, đồ thị trong đề thi</li>
            <li>✅ <strong>Đa dạng dạng câu hỏi</strong>: Trắc nghiệm, Đúng/Sai, Điền vào, Tự luận</li>
            <li>✅ <strong>Xử lý PDF lớn</strong>: Tối đa 20 trang, xử lý theo batch 5 trang/lần</li>
            <li>⚠️ <strong>Quan trọng</strong>: Luôn kiểm tra lại kết quả AI trước khi lưu!</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
