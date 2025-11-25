"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useExamStore } from "@/store/exam-store";
import { initSampleData } from "@/lib/sample-data";
import {
  BookOpen,
  Clock,
  User,
  Play,
  Search,
  Filter,
  CheckCircle2,
  Trophy,
  Database,
} from "lucide-react";
import { toast } from "sonner";

export default function ExamsPage() {
  const router = useRouter();
  const { exams, results } = useExamStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("all");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Filter published exams for students
  const publishedExams = exams.filter((exam) => exam.isPublished);

  // Apply filters
  const filteredExams = publishedExams.filter((exam) => {
    const matchesSearch =
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade = gradeFilter === "all" || exam.grade === parseInt(gradeFilter);
    return matchesSearch && matchesGrade;
  });

  const getExamResult = (examId: string) => {
    return results.find((r) => r.examId === examId);
  };

  const handleLoadSampleData = () => {
    const loaded = initSampleData();
    if (loaded) {
      toast.success("Đã tải dữ liệu mẫu thành công! Đang làm mới trang...");
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast.info("Dữ liệu mẫu đã tồn tại");
    }
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 to-indigo-50 py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Ôn luyện đề thi
              </h1>
              <p className="text-lg text-gray-600">
                Làm bài thi thử với đề thi chất lượng cao, được AI hỗ trợ giải thích chi tiết
              </p>
            </div>
          </div>
        </section>

        {/* Filters Section */}
        <section className="sticky top-16 z-40 bg-white border-b py-4">
          <div className="container mx-auto px-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between max-w-5xl mx-auto">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm đề thi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <Select value={gradeFilter} onValueChange={setGradeFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Lớp" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả lớp</SelectItem>
                      <SelectItem value="10">Lớp 10</SelectItem>
                      <SelectItem value="11">Lớp 11</SelectItem>
                      <SelectItem value="12">Lớp 12</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <span className="text-sm text-gray-500">
                  {filteredExams.length} đề thi
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Exams Grid */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            {filteredExams.length === 0 ? (
              <div className="max-w-md mx-auto text-center py-16">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {publishedExams.length === 0 ? "Chưa có đề thi nào" : "Không tìm thấy đề thi"}
                </h3>
                <p className="text-gray-500 mb-6">
                  {publishedExams.length === 0
                    ? "Hãy thử tải dữ liệu mẫu để bắt đầu ôn luyện"
                    : "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"}
                </p>
                {publishedExams.length === 0 && (
                  <Button onClick={handleLoadSampleData}>
                    <Database className="mr-2 h-4 w-4" />
                    Tải dữ liệu mẫu
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {filteredExams.map((exam) => {
                  const result = getExamResult(exam.id);

                  return (
                    <Card
                      key={exam.id}
                      className="group hover:shadow-lg transition-all duration-300 overflow-hidden"
                    >
                      <div className="h-1.5 bg-gradient-to-r from-blue-500 to-indigo-500" />
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <CardTitle className="text-lg line-clamp-2 group-hover:text-blue-600 transition-colors">
                              {exam.title}
                            </CardTitle>
                            <CardDescription className="mt-1 line-clamp-2">
                              {exam.description}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="shrink-0">
                            Lớp {exam.grade}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3 pb-3">
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            <span>{exam.duration} phút</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="h-4 w-4" />
                            <span>{exam.questions.length} câu</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <User className="h-4 w-4" />
                            <span>{exam.author}</span>
                          </div>
                        </div>

                        {result && (
                          <div className="flex items-center gap-2 p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                            <Trophy className="h-5 w-5 text-green-600" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-green-800">
                                {result.score}/{result.totalScore} điểm ({result.percentage.toFixed(0)}%)
                              </p>
                              <p className="text-xs text-green-600">
                                {new Date(result.completedAt).toLocaleDateString("vi-VN")}
                              </p>
                            </div>
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="gap-2 pt-0">
                        <Button
                          className="flex-1"
                          onClick={() => router.push(`/student/exam/${exam.id}`)}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          {result ? "Làm lại" : "Làm bài"}
                        </Button>
                        {result && (
                          <Button
                            variant="outline"
                            onClick={() => router.push(`/student/result/${exam.id}`)}
                          >
                            Xem kết quả
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
