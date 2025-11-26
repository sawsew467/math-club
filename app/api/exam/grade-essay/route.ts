import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface GradeRequest {
  questionText: string;
  studentAnswer: string;
  sampleAnswer: string;
  rubric: string;
  maxPoints: number;
}

// Extract base64 images from HTML content
function extractImagesFromHtml(html: string): string[] {
  const images: string[] = [];
  // Match both src="data:image..." and src='data:image...'
  const imgRegex = /<img[^>]+src=["']?(data:image\/[^"'\s>]+)["']?[^>]*>/gi;
  let match;
  while ((match = imgRegex.exec(html)) !== null) {
    if (match[1]) {
      images.push(match[1]);
    }
  }
  return images;
}

// Strip HTML tags but keep text content
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const body: GradeRequest = await request.json();
    const { questionText, studentAnswer, sampleAnswer, rubric, maxPoints } = body;

    if (!questionText || !studentAnswer) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // If no sample answer or rubric, cannot grade
    if (!sampleAnswer && !rubric) {
      return NextResponse.json({
        score: 0,
        feedback: 'Không có đáp án mẫu hoặc thang điểm để chấm bài.',
        needsManualGrading: true,
      });
    }

    // Extract images from student answer
    const studentImages = extractImagesFromHtml(studentAnswer);
    const studentTextContent = stripHtml(studentAnswer);
    const hasImages = studentImages.length > 0;

    console.log(`Grading essay - hasImages: ${hasImages}, imageCount: ${studentImages.length}`);

    const systemPrompt = `Bạn là giáo viên chấm bài thi toán học cấp THPT. Nhiệm vụ của bạn là chấm điểm câu trả lời tự luận của học sinh.

QUY TẮC CHẤM ĐIỂM:
1. Đọc kỹ câu trả lời của học sinh (có thể là text hoặc hình ảnh bài làm)
2. So sánh với đáp án mẫu - kiểm tra tính đúng đắn của phương pháp và kết quả
3. Cho điểm từng phần nếu học sinh làm đúng một phần
4. Nếu học sinh có cách giải khác nhưng đúng, vẫn cho điểm đầy đủ
5. Chỉ trừ điểm nếu có sai sót thực sự về tính toán hoặc lập luận

QUAN TRỌNG VỚI BÀI LÀM BẰNG HÌNH ẢNH:
- Đọc cẩn thận nội dung trong hình ảnh
- Kiểm tra từng bước giải, công thức, và kết quả cuối cùng
- Nếu kết quả đúng với đáp án mẫu, cho điểm đầy đủ
- Đừng trừ điểm chỉ vì format khác với đáp án mẫu

ĐỊNH DẠNG TRẢ LỜI (JSON):
{
  "score": <số điểm từ 0 đến ${maxPoints}>,
  "feedback": "<nhận xét ngắn gọn bằng tiếng Việt>"
}`;

    const userPrompt = `CÂU HỎI:
${stripHtml(questionText)}

ĐÁP ÁN MẪU:
${stripHtml(sampleAnswer) || '(Không có đáp án mẫu)'}

THANG ĐIỂM: Tổng ${maxPoints} điểm
${rubric ? stripHtml(rubric) : '(Không có thang điểm chi tiết - chấm theo mức độ hoàn thành)'}

CÂU TRẢ LỜI CỦA HỌC SINH:
${studentTextContent || '(Xem hình ảnh đính kèm)'}

Hãy chấm điểm câu trả lời trên. Nếu học sinh nộp bài bằng hình ảnh, hãy đọc kỹ nội dung trong ảnh.`;

    // Build message content - use GPT-4o for vision if there are images
    let messageContent: OpenAI.ChatCompletionContentPart[];

    if (hasImages) {
      // Include images for GPT-4o vision
      messageContent = [
        { type: 'text', text: userPrompt },
        ...studentImages.map((img) => ({
          type: 'image_url' as const,
          image_url: {
            url: img,
            detail: 'high' as const,
          },
        })),
      ];
    } else {
      messageContent = [{ type: 'text', text: userPrompt }];
    }

    const completion = await openai.chat.completions.create({
      model: hasImages ? 'gpt-4o' : 'gpt-4o-mini', // Use GPT-4o for vision when images present
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: messageContent },
      ],
      max_tokens: 500,
      temperature: 0.1,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content || '';

    try {
      const result = JSON.parse(responseText);

      // Validate and clamp score
      let score = parseFloat(result.score) || 0;
      score = Math.max(0, Math.min(maxPoints, score));

      // Round to nearest 0.25
      score = Math.round(score * 4) / 4;

      return NextResponse.json({
        score,
        feedback: result.feedback || '',
        needsManualGrading: false,
      });
    } catch {
      console.error('Failed to parse grading response:', responseText);
      return NextResponse.json({
        score: 0,
        feedback: 'Không thể chấm điểm tự động. Cần giáo viên chấm thủ công.',
        needsManualGrading: true,
      });
    }
  } catch (error) {
    console.error('Error grading essay:', error);
    return NextResponse.json(
      { error: 'Failed to grade essay' },
      { status: 500 }
    );
  }
}
