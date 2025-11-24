'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useExamStore } from '@/store/exam-store';
import { PlusCircle, BookOpen, GraduationCap, Clock, User, Play, Edit, Trash2, Database } from 'lucide-react';
import { toast } from 'sonner';
import { initSampleData } from '@/lib/sample-data';

export default function HomePage() {
  const router = useRouter();
  const { exams, deleteExam, results } = useExamStore();

  // Filter published exams for students
  const publishedExams = exams.filter(exam => exam.isPublished);
  const draftExams = exams.filter(exam => !exam.isPublished);

  const handleDeleteExam = (id: string) => {
    if (confirm('Bạn có chắc muốn xóa đề thi này?')) {
      deleteExam(id);
      toast.success('Đã xóa đề thi');
    }
  };

  const getExamResult = (examId: string) => {
    return results.find(r => r.examId === examId);
  };

  const handleLoadSampleData = () => {
    const loaded = initSampleData();
    if (loaded) {
      toast.success('Đã tải dữ liệu mẫu thành công! Vui lòng refresh trang.');
      setTimeout(() => window.location.reload(), 1000);
    } else {
      toast.info('Dữ liệu mẫu đã tồn tại');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Math Club</h1>
              <p className="text-gray-600 mt-1">Hệ thống ôn luyện toán học THPT</p>
            </div>
            {exams.length === 0 && (
              <Button onClick={handleLoadSampleData} variant="outline">
                <Database className="mr-2 h-4 w-4" />
                Tải dữ liệu mẫu
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="student" className="space-y-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="student" className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4" />
              Học sinh
            </TabsTrigger>
            <TabsTrigger value="teacher" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Giáo viên
            </TabsTrigger>
          </TabsList>

          {/* Student Tab */}
          <TabsContent value="student" className="space-y-6">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold">Danh sách đề thi</h2>
              <p className="text-gray-600 mt-2">Chọn đề thi để bắt đầu làm bài</p>
            </div>

            {publishedExams.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Chưa có đề thi nào được xuất bản</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {publishedExams.map(exam => {
                  const result = getExamResult(exam.id);

                  return (
                    <Card key={exam.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{exam.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {exam.description}
                            </CardDescription>
                          </div>
                          <Badge variant="outline">Lớp {exam.grade}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Clock className="h-4 w-4" />
                          <span>{exam.duration} phút</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <BookOpen className="h-4 w-4" />
                          <span>{exam.questions.length} câu hỏi</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600">
                          <User className="h-4 w-4" />
                          <span>{exam.author}</span>
                        </div>
                        {result && (
                          <div className="mt-3 p-2 bg-green-50 rounded">
                            <p className="text-sm font-medium text-green-800">
                              Đã làm: {result.score}/{result.totalScore} điểm ({result.percentage.toFixed(0)}%)
                            </p>
                          </div>
                        )}
                      </CardContent>
                      <CardFooter className="gap-2">
                        <Button
                          className="flex-1"
                          onClick={() => router.push(`/student/exam/${exam.id}`)}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          {result ? 'Làm lại' : 'Làm bài'}
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
          </TabsContent>

          {/* Teacher Tab */}
          <TabsContent value="teacher" className="space-y-6">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-semibold">Quản lý đề thi</h2>
                <p className="text-gray-600 mt-1">Tạo và quản lý đề thi của bạn</p>
              </div>
              <Button onClick={() => router.push('/teacher/editor')}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Tạo đề thi mới
              </Button>
            </div>

            {/* Published Exams */}
            {publishedExams.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Đề thi đã xuất bản</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {publishedExams.map(exam => (
                    <Card key={exam.id}>
                      <CardHeader>
                        <CardTitle className="text-lg">{exam.title}</CardTitle>
                        <CardDescription>{exam.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2 mb-2">
                          <Badge>Lớp {exam.grade}</Badge>
                          <Badge variant="secondary">{exam.questions.length} câu</Badge>
                          <Badge variant="outline">{exam.totalPoints} điểm</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Tạo: {new Date(exam.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </CardContent>
                      <CardFooter className="gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/student/exam/${exam.id}`)}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Xem
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteExam(exam.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Xóa
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
                <h3 className="text-lg font-semibold mb-3">Bản nháp</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {draftExams.map(exam => (
                    <Card key={exam.id} className="border-dashed">
                      <CardHeader>
                        <CardTitle className="text-lg">{exam.title}</CardTitle>
                        <CardDescription>{exam.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2 mb-2">
                          <Badge variant="secondary">Nháp</Badge>
                          <Badge variant="outline">{exam.questions.length} câu</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Tạo: {new Date(exam.createdAt).toLocaleDateString('vi-VN')}
                        </p>
                      </CardContent>
                      <CardFooter className="gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteExam(exam.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Xóa
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {exams.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">Bạn chưa tạo đề thi nào</p>
                  <Button onClick={() => router.push('/teacher/editor')}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Tạo đề thi đầu tiên
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6">
          <p className="text-center text-gray-600 text-sm">
            © 2024 Math Club - Hệ thống ôn luyện toán học THPT
          </p>
        </div>
      </footer>
    </div>
  );
}