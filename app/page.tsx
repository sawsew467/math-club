"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  Brain,
  BookOpen,
  Bot,
  CheckCircle,
  ArrowRight,
  Sparkles,
  Target,
  Users,
  TrendingUp,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
          <div className="container mx-auto px-4 py-20 md:py-32">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 text-blue-700 text-sm font-medium mb-6">
                <Sparkles className="h-4 w-4" />
                Nền tảng học tập thông minh
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                Chinh phục môn Toán
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {" "}cùng AI
                </span>
              </h1>
              <p className="text-lg md:text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                Math Club giúp học sinh THPT ôn luyện hiệu quả với hệ thống đề thi thông minh,
                hỗ trợ giải thích chi tiết bằng AI và công cụ sơ đồ tư duy trực quan.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild className="text-base">
                  <Link href="/exams">
                    <BookOpen className="mr-2 h-5 w-5" />
                    Bắt đầu ôn luyện
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base">
                  <Link href="/mind-maps">
                    <Brain className="mr-2 h-5 w-5" />
                    Khám phá sơ đồ tư duy
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Hai công cụ mạnh mẽ cho việc học
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Kết hợp ôn luyện đề thi với AI và sơ đồ tư duy để nắm vững kiến thức
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
              {/* Exam Practice Card */}
              <Card className="relative overflow-hidden border-2 hover:border-blue-200 transition-colors group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100 to-blue-50 rounded-bl-full -z-10" />
                <CardHeader>
                  <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <BookOpen className="h-7 w-7 text-blue-600" />
                  </div>
                  <CardTitle className="text-2xl">Ôn luyện đề thi</CardTitle>
                  <CardDescription className="text-base">
                    Làm bài thi thử với đề thi chất lượng cao, được AI hỗ trợ giải thích chi tiết
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span className="text-gray-600">Đề thi theo chuẩn của Bộ GD&ĐT</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span className="text-gray-600">Chấm điểm tự động, xem kết quả ngay</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span className="text-gray-600">AI giải thích từng câu hỏi chi tiết</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span className="text-gray-600">Hỗ trợ công thức toán học đẹp mắt</span>
                    </li>
                  </ul>
                  <Button asChild className="w-full group-hover:bg-blue-700">
                    <Link href="/exams">
                      Xem danh sách đề thi
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Mind Map Card */}
              <Card className="relative overflow-hidden border-2 hover:border-purple-200 transition-colors group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-100 to-purple-50 rounded-bl-full -z-10" />
                <CardHeader>
                  <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Brain className="h-7 w-7 text-purple-600" />
                  </div>
                  <CardTitle className="text-2xl">Sơ đồ tư duy</CardTitle>
                  <CardDescription className="text-base">
                    Tổng hợp các công cụ vẽ sơ đồ tư duy miễn phí, giúp hệ thống hóa kiến thức
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span className="text-gray-600">Danh sách công cụ vẽ sơ đồ miễn phí</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span className="text-gray-600">Hướng dẫn sử dụng chi tiết</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span className="text-gray-600">Mẫu sơ đồ tư duy cho môn Toán</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                      <span className="text-gray-600">Chia sẻ và lưu trữ online</span>
                    </li>
                  </ul>
                  <Button asChild variant="outline" className="w-full group-hover:bg-purple-50 group-hover:border-purple-300">
                    <Link href="/mind-maps">
                      Khám phá công cụ
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* AI Feature Section */}
        <section className="py-20 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/20 text-blue-300 text-sm font-medium mb-6">
                    <Bot className="h-4 w-4" />
                    Tính năng AI
                  </div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">
                    Trợ lý AI thông minh hỗ trợ 24/7
                  </h2>
                  <p className="text-lg text-gray-300 mb-8">
                    Không hiểu câu hỏi nào? Hãy hỏi AI! Trợ lý thông minh sẽ giải thích chi tiết,
                    gợi ý phương pháp giải và hướng dẫn bạn từng bước.
                  </p>
                  <ul className="space-y-4">
                    <li className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      </div>
                      <span>Giải thích lời giải chi tiết từng bước</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      </div>
                      <span>Gợi ý tài liệu và kiến thức liên quan</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      </div>
                      <span>Trả lời mọi thắc mắc về bài toán</span>
                    </li>
                  </ul>
                </div>
                <div className="relative">
                  <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
                        <Bot className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="font-medium">Trợ lý AI</p>
                        <p className="text-sm text-gray-400">Đang trực tuyến</p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <p className="text-sm text-gray-300">
                          Để giải bất phương trình $x^2 - 5x + 6 &gt; 0$, ta cần tìm nghiệm của phương trình $x^2 - 5x + 6 = 0$ trước...
                        </p>
                      </div>
                      <div className="bg-blue-500/20 rounded-lg p-4 ml-8">
                        <p className="text-sm text-blue-100">
                          Giải thích thêm về phương pháp đặt dấu ạ?
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto text-center">
              <div>
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-3">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">1000+</p>
                <p className="text-gray-600">Học sinh</p>
              </div>
              <div>
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <BookOpen className="h-6 w-6 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">500+</p>
                <p className="text-gray-600">Đề thi</p>
              </div>
              <div>
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center mx-auto mb-3">
                  <Target className="h-6 w-6 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">95%</p>
                <p className="text-gray-600">Hài lòng</p>
              </div>
              <div>
                <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <p className="text-3xl font-bold text-gray-900">+2.5</p>
                <p className="text-gray-600">Điểm trung bình</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Sẵn sàng chinh phục môn Toán?
            </h2>
            <p className="text-lg text-blue-100 mb-8 max-w-2xl mx-auto">
              Đăng ký miễn phí ngay hôm nay và bắt đầu hành trình học tập hiệu quả cùng Math Club
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild className="text-base">
                <Link href="/auth/register">
                  Đăng ký miễn phí
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-base bg-transparent text-white border-white hover:bg-white/10">
                <Link href="/exams">
                  Xem đề thi mẫu
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
