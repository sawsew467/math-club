"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { useExamStore } from "@/store/exam-store";
import { initSampleData } from "@/lib/sample-data";
import {
  PlusCircle,
  BookOpen,
  Clock,
  Edit,
  Trash2,
  Eye,
  Play,
  Database,
  FileText,
  Users,
  TrendingUp,
  BarChart3,
  LogIn,
} from "lucide-react";
import { toast } from "sonner";

export default function TeacherDashboard() {
  const router = useRouter();
  const { exams, deleteExam, results } = useExamStore();
  const [mounted, setMounted] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if user is logged in as teacher
    const mockUser = localStorage.getItem("mockUser");
    if (mockUser) {
      const user = JSON.parse(mockUser);
      if (user.role === "teacher") {
        setIsTeacher(true);
      }
    }
  }, []);

  const publishedExams = exams.filter((exam) => exam.isPublished);
  const draftExams = exams.filter((exam) => !exam.isPublished);

  const handleDeleteExam = (id: string) => {
    if (confirm("Bạn có chắc muốn xóa đề thi này?")) {
      deleteExam(id);
      toast.success("Đã xóa đề thi");
    }
  };

  const handleLoadSampleData = () => {
    const loaded = initSampleData();
    if (loaded) {
      toast.success("Đã tải dữ liệu mẫu thành công!");
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast.info("Dữ liệu mẫu đã tồn tại");
    }
  };

  if (!mounted) {
    return null;
  }

  // Show login prompt if not authenticated as teacher
  if (!isTeacher) {
    return (
      <div className="min-h-screen flex flex-col bg-gray-50">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="max-w-md w-full">
            <CardHeader className="text-center">
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                <LogIn className="h-8 w-8 text-blue-600" />
              </div>
              <CardTitle>Đăng nhập để tiếp tục</CardTitle>
              <CardDescription>
                Bạn cần đăng nhập với tài khoản giáo viên để truy cập trang quản lý đề thi
              </CardDescription>
            </CardHeader>
            <CardFooter className="flex-col gap-3">
              <Button asChild className="w-full">
                <Link href="/auth/login">Đăng nhập</Link>
              </Button>
              <p className="text-sm text-gray-500 text-center">
                Chọn tab "Giáo viên" khi đăng nhập
              </p>
            </CardFooter>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <main className="flex-1">
        {/* Header Section */}
        <section className="bg-white border-b">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Quản lý đề thi
                </h1>
                <p className="text-gray-600 mt-1">
                  Tạo, chỉnh sửa và quản lý các đề thi của bạn
                </p>
              </div>
              <div className="flex gap-3">
                {exams.length === 0 && (
                  <Button variant="outline" onClick={handleLoadSampleData}>
                    <Database className="mr-2 h-4 w-4" />
                    Tải dữ liệu mẫu
                  </Button>
                )}
                <Button asChild>
                  <Link href="/teacher/editor">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Tạo đề thi mới
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="container mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                    <FileText className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{exams.length}</p>
                    <p className="text-sm text-gray-500">Tổng đề thi</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                    <Eye className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{publishedExams.length}</p>
                    <p className="text-sm text-gray-500">Đã xuất bản</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center">
                    <Edit className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{draftExams.length}</p>
                    <p className="text-sm text-gray-500">Bản nháp</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{results.length}</p>
                    <p className="text-sm text-gray-500">Lượt làm bài</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Exams List */}
        <section className="container mx-auto px-4 py-6">
          {exams.length === 0 ? (
            <Card>
              <CardContent className="text-center py-16">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Chưa có đề thi nào
                </h3>
                <p className="text-gray-500 mb-6">
                  Bắt đầu bằng việc tạo đề thi đầu tiên hoặc tải dữ liệu mẫu
                </p>
                <div className="flex gap-3 justify-center">
                  <Button onClick={handleLoadSampleData} variant="outline">
                    <Database className="mr-2 h-4 w-4" />
                    Tải dữ liệu mẫu
                  </Button>
                  <Button asChild>
                    <Link href="/teacher/editor">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Tạo đề thi
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Published Exams */}
              {publishedExams.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Eye className="h-5 w-5 text-green-600" />
                    Đề thi đã xuất bản ({publishedExams.length})
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {publishedExams.map((exam) => (
                      <Card key={exam.id} className="group">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <CardTitle className="text-lg line-clamp-1">
                                {exam.title}
                              </CardTitle>
                              <CardDescription className="line-clamp-2 mt-1">
                                {exam.description}
                              </CardDescription>
                            </div>
                            <Badge className="bg-green-100 text-green-700 shrink-0">
                              Công khai
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-3">
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Badge variant="outline">Lớp {exam.grade}</Badge>
                            <Badge variant="secondary">{exam.questions.length} câu</Badge>
                            <Badge variant="secondary">{exam.totalPoints} điểm</Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Clock className="h-4 w-4" />
                            <span>{exam.duration} phút</span>
                            <span className="text-gray-300">•</span>
                            <span>
                              Tạo {new Date(exam.createdAt).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                        </CardContent>
                        <CardFooter className="gap-2 pt-0">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => router.push(`/teacher/editor/${exam.id}`)}
                          >
                            <Edit className="mr-1 h-4 w-4" />
                            Sửa
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/student/exam/${exam.id}`)}
                          >
                            <Play className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteExam(exam.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Draft Exams */}
              {draftExams.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Edit className="h-5 w-5 text-orange-600" />
                    Bản nháp ({draftExams.length})
                  </h2>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {draftExams.map((exam) => (
                      <Card key={exam.id} className="border-dashed group">
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <CardTitle className="text-lg line-clamp-1">
                                {exam.title || "Đề thi chưa đặt tên"}
                              </CardTitle>
                              <CardDescription className="line-clamp-2 mt-1">
                                {exam.description || "Chưa có mô tả"}
                              </CardDescription>
                            </div>
                            <Badge variant="secondary" className="shrink-0">
                              Nháp
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="pb-3">
                          <div className="flex flex-wrap gap-2 mb-3">
                            <Badge variant="outline">Lớp {exam.grade}</Badge>
                            <Badge variant="secondary">{exam.questions.length} câu</Badge>
                          </div>
                          <p className="text-sm text-gray-500">
                            Cập nhật {new Date(exam.updatedAt).toLocaleDateString("vi-VN")}
                          </p>
                        </CardContent>
                        <CardFooter className="gap-2 pt-0">
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => router.push(`/teacher/editor/${exam.id}`)}
                          >
                            <Edit className="mr-1 h-4 w-4" />
                            Tiếp tục chỉnh sửa
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteExam(exam.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </CardFooter>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
