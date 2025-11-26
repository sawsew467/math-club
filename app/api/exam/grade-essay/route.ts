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

    const systemPrompt = `Bạn là giáo viên chấm bài thi toán học cấp THPT. Nhiệm vụ của bạn là chấm điểm câu trả lời tự luận của học sinh.

QUY TẮC CHẤM ĐIỂM:
1. So sánh câu trả lời của học sinh với đáp án mẫu và thang điểm
2. Chấm điểm công bằng, chính xác theo từng tiêu chí trong thang điểm
3. Cho điểm từng phần nếu học sinh làm đúng một phần
4. Nếu học sinh có cách giải khác nhưng đúng, vẫn cho điểm đầy đủ
5. Trừ điểm nếu có sai sót về tính toán hoặc lập luận

ĐỊNH DẠNG TRẢ LỜI (JSON):
{
  "score": <số điểm từ 0 đến maxPoints>,
  "feedback": "<nhận xét ngắn gọn bằng tiếng Việt về bài làm, chỉ ra điểm đúng/sai>"
}

LƯU Ý:
- Điểm PHẢI là số (có thể có phần thập phân như 0.25, 0.5, 1.5)
- Feedback ngắn gọn, súc tích (1-3 câu)
- Chỉ trả về JSON, không có text khác`;

    const userPrompt = `CÂU HỎI:
${questionText}

ĐÁP ÁN MẪU:
${sampleAnswer || '(Không có đáp án mẫu)'}

THANG ĐIỂM (Tổng ${maxPoints} điểm):
${rubric || '(Không có thang điểm chi tiết)'}

CÂU TRẢ LỜI CỦA HỌC SINH:
${studentAnswer}

Hãy chấm điểm câu trả lời trên và trả về JSON.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use mini for faster, cheaper grading
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
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
