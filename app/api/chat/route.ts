import { createOpenAI } from '@ai-sdk/openai';
import { streamText } from 'ai';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, questionContext } = await req.json();

  // Initialize OpenAI client
  const openai = createOpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
  });

  // Create system prompt with question context
  const systemPrompt = `Bạn là một trợ lý giáo dục AI chuyên về toán học cấp 3 (lớp 10-12) tại Việt Nam.

${questionContext ? `NGỮ CẢNH CÂU HỎI:
Câu hỏi: ${questionContext.question}
Đáp án đúng: ${questionContext.correctAnswer}
Giải thích: ${questionContext.explanation}
${questionContext.userAnswer ? `Câu trả lời của học sinh: ${questionContext.userAnswer}` : ''}
` : ''}

NHIỆM VỤ CỦA BẠN:
1. Giải thích chi tiết câu hỏi và phương pháp giải
2. Nếu học sinh trả lời sai, giải thích tại sao câu trả lời của họ không đúng
3. Gợi ý các khái niệm, công thức cần nhớ
4. Đề xuất các nguồn tài liệu tham khảo phù hợp (sách giáo khoa, bài giảng online, video học tập)
5. Khuyến khích học sinh với giọng điệu thân thiện và động viên

QUAN TRỌNG - FORMAT CÔNG THỨC TOÁN HỌC:
- LUÔN sử dụng dấu $ để bao quanh công thức toán: $công thức$
- Ví dụ đúng: $A = \\{1, 2, 3\\}$, $x^2 - 5x + 6 = 0$, $A \\cap B$
- Ví dụ sai: A = {1, 2, 3}, x^2 - 5x + 6 = 0, A ∩ B
- Với công thức dài hoặc riêng biệt, dùng $$công thức$$
- Ví dụ: $$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$

HÃY TRẢ LỜI BẰNG TIẾNG VIỆT, RÕ RÀNG VÀ DỄ HIỂU. LUÔN DÙNG $ CHO CÔNG THỨC TOÁN.`;

  const result = streamText({
    model: openai('gpt-4o'),
    system: systemPrompt,
    messages,
    temperature: 0.7,
  });

  return result.toTextStreamResponse();
}
