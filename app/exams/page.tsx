"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { fetchPublishedExams, fetchStudentExamHistory, ExamAttempt } from "@/lib/api/student";
import { useAuth } from "@/contexts/AuthContext";
import { Exam } from "@/types/exam";
import {
  BookOpen,
  Clock,
  Play,
  Search,
  Filter,
  Loader2,
  RefreshCw,
  Trophy,
  RotateCcw,
  Eye,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";

export default function ExamsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [examAttempts, setExamAttempts] = useState<Map<string, ExamAttempt>>(new Map());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [gradeFilter, setGradeFilter] = useState<string>("all");

  const loadExams = async () => {
    setLoading(true);
    const result = await fetchPublishedExams();
    if (result.success && result.data) {
      setExams(result.data);
    } else {
      toast.error(result.error || "Không thể tải danh sách đề thi");
    }
    setLoading(false);
  };

  const loadHistory = async () => {
    if (!user?.id) return;

    const result = await fetchStudentExamHistory(user.id);
    if (result.success && result.data) {
      // Create a map of examId -> most recent attempt (API returns sorted by completed_at desc)
      const attemptsMap = new Map<string, ExamAttempt>();
      result.data.forEach((attempt) => {
        // Only keep the first (most recent) attempt for each exam
        if (!attemptsMap.has(attempt.examId)) {
          attemptsMap.set(attempt.examId, attempt);
        }
      });
      setExamAttempts(attemptsMap);
    }
  };

  useEffect(() => {
    loadExams();
  }, []);

  useEffect(() => {
    loadHistory();
  }, [user?.id]);

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600 bg-green-50 border-green-200";
    if (percentage >= 60) return "text-blue-600 bg-blue-50 border-blue-200";
    if (percentage >= 40) return "text-yellow-600 bg-yellow-50 border-yellow-200";
    return "text-red-600 bg-red-50 border-red-200";
  };

  // All exams from API are already published
  const publishedExams = exams;

  // Apply filters
  const filteredExams = publishedExams.filter((exam) => {
    const matchesSearch =
      exam.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGrade =
      gradeFilter === "all" || exam.grade === parseInt(gradeFilter);
    return matchesSearch && matchesGrade;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600">Đang tải danh sách đề thi...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
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
                Làm bài thi thử với đề thi chất lượng cao, được AI hỗ trợ giải
                thích chi tiết
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
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={loadExams}
                  title="Làm mới"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
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
                  {publishedExams.length === 0
                    ? "Chưa có đề thi nào"
                    : "Không tìm thấy đề thi"}
                </h3>
                <p className="text-gray-500 mb-6">
                  {publishedExams.length === 0
                    ? "Giáo viên chưa công bố đề thi nào. Vui lòng quay lại sau!"
                    : "Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm"}
                </p>
                <Button variant="outline" onClick={loadExams}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Làm mới
                </Button>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                {filteredExams.map((exam) => {
                  const attempt = examAttempts.get(exam.id);
                  const hasAttempt = !!attempt;

                  return (
                    <Card
                      key={exam.id}
                      className="group hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col"
                    >
                      <div
                        className={`h-1.5 ${
                          hasAttempt
                            ? "bg-gradient-to-r from-green-500 to-emerald-500"
                            : "bg-gradient-to-r from-blue-500 to-indigo-500"
                        }`}
                      />
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
                      <CardContent className="space-y-3 pb-3 flex-1">
                        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            <span>{exam.duration} phút</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <BookOpen className="h-4 w-4" />
                            <span>
                              {exam.questionCount ?? exam.questions.length} câu
                            </span>
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0 flex-col gap-2">
                        {/* Show previous result */}
                        {hasAttempt && (
                          <div
                            className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-sm ${getScoreColor(
                              attempt.percentage
                            )}`}
                          >
                            <div className="flex items-center gap-1.5">
                              <Trophy className="h-4 w-4" />
                              <span className="font-medium">Kết quả:</span>
                            </div>
                            <span className="font-bold">
                              {attempt.score}/{attempt.totalScore} ({Math.round(attempt.percentage)}%)
                            </span>
                          </div>
                        )}
                        {hasAttempt ? (
                          <div className="w-full flex gap-2">
                            <Button
                              variant="outline"
                              className="flex-1"
                              onClick={() => router.push(`/student/result/${attempt.id}`)}
                            >
                              <Eye className="mr-1.5 h-4 w-4" />
                              Xem kết quả
                            </Button>
                            <Button
                              className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                              onClick={() => router.push(`/student/exam/${exam.id}`)}
                            >
                              <RotateCcw className="mr-1.5 h-4 w-4" />
                              Làm lại
                            </Button>
                          </div>
                        ) : (
                          <Button
                            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                            onClick={() => router.push(`/student/exam/${exam.id}`)}
                          >
                            <Play className="mr-2 h-4 w-4" />
                            Bắt đầu làm bài
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
