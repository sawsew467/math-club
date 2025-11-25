# Hướng dẫn Import đề thi từ PDF bằng AI

## Tổng quan

Tính năng mới này cho phép giáo viên import đề thi từ file PDF một cách tự động bằng **GPT-4 Vision (OpenAI)**, giúp tiết kiệm thời gian tạo đề thi thủ công.

## Tính năng nổi bật 🚀

### ✅ **GPT-4 Vision - AI thông minh nhất hiện nay**
- **Nhận dạng công thức toán**: Tự động convert MathType, ký tự đặc biệt sang LaTeX ($x^2$, $\frac{a}{b}$)
- **Xử lý hình ảnh**: Mô tả chi tiết hình vẽ hình học, đồ thị, bảng biểu trong đề thi
- **Đa dạng dạng câu hỏi**: Trắc nghiệm, Đúng/Sai, Điền vào, Tự luận
- **Độ chính xác cao**: GPT-4o với detail='high' cho OCR tốt nhất

### ✅ **Quy trình tối ưu**
1. Client convert PDF → images (PDF.js)
2. Gửi images cho GPT-4 Vision
3. AI phân tích TẤT CẢ: text, công thức, hình ảnh
4. Trả về JSON có cấu trúc

## Cách sử dụng

### 1. Chuẩn bị

Đảm bảo bạn đã:
- Cài đặt dependencies: `pnpm install`
- Có API key từ OpenAI
- Đã có `OPENAI_API_KEY` trong file `.env.local` (thường đã có sẵn)

```bash
# .env.local
OPENAI_API_KEY=your_openai_api_key_here
```

**Lấy API key:** https://platform.openai.com/api-keys

### 2. Tạo đề thi với Import PDF

1. Truy cập trang **Tạo đề thi** (`/teacher/editor`)
2. Chọn tab **"Import từ PDF"**
3. Click **"Chọn file PDF"** và chọn file đề thi
4. Click **"Trích xuất câu hỏi bằng AI"**
5. Xem progress bar:
   - 10%: Đang convert PDF → images (client-side)
   - 40%: Đang gửi cho GPT-4 Vision
   - 70%: Đang xử lý kết quả
   - 100%: Hoàn thành!
6. Tổng thời gian: 20-60 giây tùy số trang

### 3. Kiểm tra và chỉnh sửa

Sau khi AI trích xuất xong:
- Xem lại **tất cả các câu hỏi** được extract
- **Kiểm tra kỹ:**
  - ✓ Đáp án đúng đã được chọn chính xác chưa
  - ✓ Công thức toán có hiển thị đúng không
  - ✓ Các lựa chọn A, B, C, D có đầy đủ không
  - ✓ Giải thích chi tiết có đầy đủ không
- **Chỉnh sửa** nếu cần bằng cách click "Chỉnh sửa" trên từng câu
- Click **"Xác nhận và sử dụng đề thi này"** khi đã hài lòng

### 4. Lưu đề thi

- Điền thông tin đề thi (tiêu đề, mô tả, thời gian...)
- Click **"Lưu nháp"** hoặc **"Xuất bản"**

## Lưu ý quan trọng ⚠️

### AI có thể mắc lỗi!

Mặc dù AI rất thông minh, nhưng vẫn có thể sai sót:
- **Đáp án sai:** AI có thể chọn nhầm đáp án đúng
- **Công thức sai:** Một số công thức phức tạp có thể bị trích xuất sai
- **Thiếu nội dung:** Đôi khi AI có thể bỏ sót câu hỏi hoặc đáp án

**👉 Do đó, LUÔN LUÔN kiểm tra kỹ trước khi lưu!**

## Các loại câu hỏi được hỗ trợ

1. **Trắc nghiệm (Multiple Choice):** Câu hỏi có 2-6 lựa chọn A, B, C, D...
2. **Đúng/Sai (True/False):** Câu hỏi chỉ có 2 lựa chọn
3. **Điền vào (Fill-in):** Câu hỏi yêu cầu điền câu trả lời ngắn
4. **Tự luận (Essay):** Câu hỏi yêu cầu trả lời chi tiết

## Yêu cầu file PDF

Để GPT-4 Vision trích xuất tốt nhất:
- ✅ File PDF có cấu trúc rõ ràng, không quá mờ
- ✅ Câu hỏi được đánh số (Câu 1, Câu 2...)
- ✅ Đáp án A, B, C, D được phân biệt rõ
- ✅ Có đáp án đúng hoặc hướng dẫn chấm
- ✅ **Công thức toán**: MathType, LaTeX, hoặc ký tự Unicode đều OK
- ✅ **Hình ảnh**: Hình vẽ, đồ thị, bảng biểu - AI sẽ mô tả chi tiết
- ✅ Kích thước file < 10MB
- ⚠️ Giới hạn: **Chỉ xử lý 10 trang đầu tiên**
- ❌ Tránh file scan chất lượng kém, độ phân giải thấp

## So sánh với tạo thủ công

| Tính năng | Import PDF | Tạo thủ công |
|-----------|-----------|--------------|
| Tốc độ | ⚡ Rất nhanh (1-2 phút) | 🐌 Chậm (10-30 phút) |
| Độ chính xác | ⚠️ Cần kiểm tra | ✅ 100% chính xác |
| Phù hợp | Đề thi sẵn có | Đề thi mới |
| Công sức | 🟢 Thấp | 🔴 Cao |

## Giá cả

- **OpenAI GPT-4o:** Tính phí theo token + vision tokens
- **Ước tính:** ~$0.10 - $0.30 per đề thi (tùy số trang và độ phức tạp)
  - Input: $2.50 per 1M tokens
  - Output: $10.00 per 1M tokens
  - Vision: Thêm ~$0.01-0.02 per image
- **Tiết kiệm:** Rất đáng so với 10-30 phút tạo thủ công!
- **Lưu ý**: Giới hạn 10 trang để tối ưu chi phí

## Troubleshooting

### Lỗi "Lỗi API key"
**Nguyên nhân:** OPENAI_API_KEY không hợp lệ hoặc thiếu
**Giải pháp:** Kiểm tra `OPENAI_API_KEY` trong `.env.local`

### Lỗi "Đã vượt quá giới hạn API"
**Nguyên nhân:** Hết quota hoặc rate limit
**Giải pháp:** Đợi 1 phút rồi thử lại, hoặc nâng cấp plan OpenAI

### AI trích xuất sai hoặc thiếu câu hỏi
**Nguyên nhân:** File PDF không rõ ràng hoặc cấu trúc phức tạp
**Giải pháp:**
- Thử lại với file PDF chất lượng tốt hơn
- Hoặc tạo thủ công cho đề thi đó

### File quá lớn hoặc quá nhiều trang
**Nguyên nhân:** File > 10MB hoặc > 10 trang
**Giải pháp:**
- Nén file PDF (giảm chất lượng hình ảnh)
- Hoặc chia đề thi thành nhiều file nhỏ hơn
- Chỉ 10 trang đầu tiên được xử lý

### Lỗi "Không thể chuyển đổi PDF"
**Nguyên nhân:** PDF bị lỗi hoặc browser không hỗ trợ
**Giải pháp:**
- Thử browser khác (Chrome, Firefox recommended)
- Hoặc export lại PDF từ Word/Google Docs

## Kết luận

Tính năng Import đề thi từ PDF giúp:
- ✅ Tiết kiệm thời gian đáng kể
- ✅ Giảm công sức cho giáo viên
- ✅ Vẫn cho phép kiểm tra và chỉnh sửa
- ✅ Giữ nguyên tính linh hoạt với editor cũ

**Khuyến nghị:** Sử dụng Import PDF cho đề thi sẵn có, vẫn dùng editor thủ công cho đề thi mới hoặc khi cần độ chính xác 100%.

---

**Cần hỗ trợ?** Liên hệ: [support@example.com](mailto:support@example.com)
