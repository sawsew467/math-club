"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import {
  Brain,
  ExternalLink,
  Star,
  Zap,
  Users,
  Globe,
  Palette,
  Share2,
  Cloud,
  Smartphone,
} from "lucide-react";

const mindMapTools = [
  {
    name: "Miro",
    description: "Bảng trắng trực tuyến mạnh mẽ với nhiều template sơ đồ tư duy đẹp mắt",
    url: "https://miro.com",
    logo: "🎨",
    features: ["Cộng tác realtime", "Template phong phú", "Tích hợp nhiều app"],
    pricing: "Miễn phí cơ bản",
    rating: 4.8,
    color: "from-yellow-400 to-orange-500",
  },
  {
    name: "Coggle",
    description: "Công cụ vẽ sơ đồ tư duy đơn giản, dễ sử dụng với giao diện trực quan",
    url: "https://coggle.it",
    logo: "🧠",
    features: ["Giao diện đơn giản", "Chia sẻ dễ dàng", "Lịch sử thay đổi"],
    pricing: "Miễn phí 3 sơ đồ",
    rating: 4.6,
    color: "from-blue-400 to-cyan-500",
  },
  {
    name: "MindMeister",
    description: "Ứng dụng sơ đồ tư duy chuyên nghiệp với tính năng thuyết trình tích hợp",
    url: "https://www.mindmeister.com",
    logo: "💡",
    features: ["Chế độ thuyết trình", "Xuất nhiều định dạng", "Mobile app"],
    pricing: "Miễn phí 3 sơ đồ",
    rating: 4.7,
    color: "from-purple-400 to-pink-500",
  },
  {
    name: "Whimsical",
    description: "Công cụ thiết kế flowchart và mindmap với giao diện hiện đại, tối giản",
    url: "https://whimsical.com",
    logo: "✨",
    features: ["Giao diện đẹp", "Flowchart + Mindmap", "Wireframe"],
    pricing: "Miễn phí 4 board",
    rating: 4.7,
    color: "from-indigo-400 to-blue-500",
  },
  {
    name: "Canva",
    description: "Nền tảng thiết kế đa năng với nhiều mẫu sơ đồ tư duy sáng tạo",
    url: "https://www.canva.com/graphs/mind-maps/",
    logo: "🎯",
    features: ["Template đẹp", "Kéo thả dễ dàng", "Xuất hình ảnh chất lượng cao"],
    pricing: "Miễn phí",
    rating: 4.8,
    color: "from-teal-400 to-green-500",
  },
  {
    name: "GitMind",
    description: "Công cụ sơ đồ tư duy miễn phí với AI hỗ trợ tạo nội dung",
    url: "https://gitmind.com",
    logo: "🚀",
    features: ["AI tạo nội dung", "Hoàn toàn miễn phí", "Đa nền tảng"],
    pricing: "Miễn phí",
    rating: 4.5,
    color: "from-rose-400 to-red-500",
  },
];

const benefits = [
  {
    icon: Zap,
    title: "Ghi nhớ nhanh hơn",
    description: "Sơ đồ tư duy giúp não bộ liên kết thông tin theo cách tự nhiên, tăng khả năng ghi nhớ lên 30%",
  },
  {
    icon: Brain,
    title: "Tư duy hệ thống",
    description: "Nhìn thấy bức tranh tổng thể và mối liên hệ giữa các khái niệm trong môn Toán",
  },
  {
    icon: Palette,
    title: "Sáng tạo hơn",
    description: "Kết hợp màu sắc, hình ảnh và từ khóa kích thích sự sáng tạo trong học tập",
  },
  {
    icon: Share2,
    title: "Chia sẻ dễ dàng",
    description: "Chia sẻ sơ đồ với bạn bè và thầy cô để cùng nhau học tập hiệu quả",
  },
];

export default function MindMapsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 text-sm font-medium mb-6">
                <Brain className="h-4 w-4" />
                Công cụ học tập
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Sơ đồ tư duy cho môn Toán
              </h1>
              <p className="text-lg text-gray-600 mb-8">
                Khám phá các công cụ vẽ sơ đồ tư duy miễn phí giúp bạn hệ thống hóa kiến thức,
                ghi nhớ công thức và nắm vững các chủ đề toán học một cách trực quan.
              </p>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-12">
              Tại sao nên dùng sơ đồ tư duy?
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {benefits.map((benefit, index) => (
                <div key={index} className="text-center p-6">
                  <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="h-7 w-7 text-purple-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-sm text-gray-600">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Tools Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
                Công cụ vẽ sơ đồ tư duy miễn phí
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Chọn công cụ phù hợp với nhu cầu của bạn. Tất cả đều có phiên bản miễn phí!
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {mindMapTools.map((tool, index) => (
                <Card key={index} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                  <div className={`h-2 bg-gradient-to-r ${tool.color}`} />
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{tool.logo}</span>
                        <div>
                          <CardTitle className="text-xl">{tool.name}</CardTitle>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-sm text-gray-600">{tool.rating}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {tool.pricing}
                      </Badge>
                    </div>
                    <CardDescription className="mt-3">
                      {tool.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {tool.features.map((feature, idx) => (
                        <span
                          key={idx}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700"
                        >
                          {feature}
                        </span>
                      ))}
                    </div>
                    <Button asChild className="w-full group-hover:bg-purple-600">
                      <a href={tool.url} target="_blank" rel="noopener noreferrer">
                        Truy cập {tool.name}
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Tips Section */}
        <section className="py-16 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold text-center text-gray-900 mb-12">
                Mẹo vẽ sơ đồ tư duy hiệu quả
              </h2>

              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-blue-600">1</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Bắt đầu từ trung tâm</h3>
                      <p className="text-sm text-gray-600">
                        Đặt chủ đề chính ở giữa, ví dụ: "Hàm số bậc hai" hoặc "Tích phân"
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-green-600">2</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Dùng từ khóa ngắn gọn</h3>
                      <p className="text-sm text-gray-600">
                        Chỉ viết từ khóa quan trọng, tránh câu dài. VD: "Công thức nghiệm", "Đồ thị"
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-purple-600">3</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Sử dụng màu sắc</h3>
                      <p className="text-sm text-gray-600">
                        Mỗi nhánh một màu khác nhau giúp phân biệt và ghi nhớ tốt hơn
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-orange-600">4</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Thêm hình ảnh và biểu tượng</h3>
                      <p className="text-sm text-gray-600">
                        Hình ảnh giúp não bộ liên kết thông tin nhanh hơn văn bản thuần túy
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-pink-600">5</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Liên kết các nhánh</h3>
                      <p className="text-sm text-gray-600">
                        Vẽ đường nối giữa các khái niệm liên quan để thấy mối quan hệ
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0">
                      <span className="font-bold text-cyan-600">6</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">Ôn tập thường xuyên</h3>
                      <p className="text-sm text-gray-600">
                        Xem lại sơ đồ định kỳ để củng cố kiến thức và bổ sung thêm
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-r from-purple-600 to-indigo-600">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Kết hợp sơ đồ tư duy với ôn luyện đề thi
            </h2>
            <p className="text-lg text-purple-100 mb-8 max-w-2xl mx-auto">
              Sau khi hệ thống kiến thức bằng sơ đồ tư duy, hãy làm đề thi để kiểm tra hiệu quả!
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/exams">
                Làm đề thi ngay
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
