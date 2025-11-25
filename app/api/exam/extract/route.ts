import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { images } = body;

    if (!images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json(
        { error: 'Không tìm thấy hình ảnh từ PDF' },
        { status: 400 }
      );
    }

    console.log(`Processing ${images.length} PDF pages...`);

    // System message for better instruction following
    const systemPrompt = `You are a Vietnamese math exam analyzer. Your task is to extract BOTH questions AND their answer keys from exam images.

CRITICAL: Vietnamese exams often have TWO sections:
1. "ĐỀ THI" or "ĐỀ KIỂM TRA" - The exam questions
2. "HƯỚNG DẪN CHẤM" or "ĐÁP ÁN" - The answer key with detailed solutions

YOU MUST:
1. Extract ALL questions from the exam
2. Find the corresponding answers in "HƯỚNG DẪN CHẤM" section
3. Include COMPLETE detailed solutions/explanations (lời giải chi tiết)
4. For essay questions: include the full sample answer (đáp án mẫu) and grading rubric

MATH FORMATTING - CRITICAL:
ALL mathematical expressions MUST be wrapped in dollar signs $...$. Never output raw LaTeX commands.

CORRECT examples:
- Fractions: $\\frac{1}{3}$, $\\frac{x-1}{x+2}$ (NOT \\frac{1}{3})
- Infinity: $+\\infty$, $-\\infty$ (NOT +\\infty or -\infty)
- Intervals: $(-\\infty; 0)$, $(2; +\\infty)$, $[0; 2]$ (NOT (-\\infty; 0))
- Powers: $x^2$, $x^{n+1}$ (NOT x^2)
- Roots: $\\sqrt{x}$, $\\sqrt[3]{x}$ (NOT \\sqrt{x})
- Greek letters: $\\alpha$, $\\beta$, $\\Delta$ (NOT \\alpha)
- Equations: $y = f(x)$, $y' = 2x - 1$
- Sets: $x \\in \\mathbb{R}$, $\\forall x$
- Comparisons: $x \\leq 5$, $x \\geq 0$, $x \\neq 2$

WRONG: "A. (-\\infty; 0)" → CORRECT: "A. $(-\\infty; 0)$"
WRONG: "\\frac{1}{3}" → CORRECT: "$\\frac{1}{3}$"

For mixed text and math: "Hàm số $y = f(x)$ nghịch biến trên khoảng $(-\\infty; 0)$"

QUESTION TYPES:
- "multiple-choice": Trắc nghiệm khách quan (A, B, C, D)
- "true-false": Trắc nghiệm đúng sai (a, b, c, d with Đ/S)
- "fill-in": Trắc nghiệm trả lời ngắn
- "essay": Tự luận

IMAGE HANDLING:
- If a question contains an image (graph, diagram, table, figure), set "hasImage": true
- Describe the image in Vietnamese in "imageDescription" field
- For graphs: "Đồ thị hàm số y = f(x) với trục Ox, Oy, điểm cực trị tại..."
- For tables: "Bảng số liệu gồm 2 cột: thời gian (giây) và độ cao (mét)..."
- For geometry: "Hình tam giác ABC với AB = 5cm, góc A = 60°..."
- IMPORTANT: imageDescription MUST be in Vietnamese

JSON structure:
{
  "questions": [{
    "question": "Full question text with LaTeX",
    "type": "multiple-choice|true-false|fill-in|essay",
    "options": ["A. option", "B. option", "C. option", "D. option"],
    "correctAnswer": 0,
    "explanation": "COMPLETE detailed solution from Hướng dẫn chấm, including all steps",
    "points": 0.25,
    "subQuestions": [{"label": "a", "correct": true/false}],
    "sampleAnswer": "For essay: full sample answer",
    "rubric": "For essay: grading criteria with point breakdown",
    "hasImage": true,
    "imageDescription": "Detailed description of the image/graph/diagram in the question"
  }]
}

TEXT FORMATTING:
- Use HTML for formatting: <br> for line breaks, <p> for paragraphs
- For multi-line content (explanations, solutions), use <br> between lines
- Example: "Bước 1: Tính đạo hàm<br>$y' = 2x - 3$<br>Bước 2: Giải $y' = 0$<br>$2x - 3 = 0 \\Rightarrow x = \\frac{3}{2}$"
- Keep each option on a single line (no <br> inside options)

RULES:
- correctAnswer: number (0-3) for multiple-choice, string for fill-in/essay
- For true-false: use subQuestions array with {label, content, correct}
- points: Use exact points from exam (0.25, 0.5, 1.0, etc.)
- explanation MUST contain the FULL solution with step-by-step working
- Use <br> to separate steps in explanations for readability`;

    const userPrompt = `Extract ALL questions AND their COMPLETE answers/solutions from these ${images.length} exam pages.

IMPORTANT: Look for "HƯỚNG DẪN CHẤM" or "ĐÁP ÁN" sections and extract the FULL detailed solutions.
For each question, include:
1. The complete question text
2. All answer options (if applicable)
3. The correct answer
4. The COMPLETE explanation with all mathematical steps from the answer key
5. Point values

Return ONLY the JSON object.`;

    // Prepare messages with all page images
    const imageContents = images.map((base64String: string) => {
      // Ensure proper data URI format
      const imageUrl = base64String.startsWith('data:')
        ? base64String
        : `data:image/jpeg;base64,${base64String.replace(/^data:image\/\w+;base64,/, '')}`;

      return {
        type: 'image_url' as const,
        image_url: {
          url: imageUrl,
          detail: 'high' as const,
        },
      };
    });

    console.log('Calling OpenAI GPT-4o...');

    // Call OpenAI GPT-4o with system message
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: userPrompt,
            },
            ...imageContents,
          ],
        },
      ],
      max_tokens: 16384,
      temperature: 0,
      response_format: { type: 'json_object' } as any,
    });

    const choice = completion.choices[0];
    const finishReason = choice?.finish_reason;
    const responseText = choice?.message?.content || '';

    console.log('Received response from OpenAI');
    console.log('- Finish reason:', finishReason);
    console.log('- Response length:', responseText.length);
    console.log('- Response preview:', responseText.substring(0, 200));

    if (finishReason !== 'stop') {
      console.error('Unexpected finish_reason:', finishReason);
      if (finishReason === 'length') {
        throw new Error('Response quá dài. Vui lòng thử PDF có ít trang hơn.');
      } else if (finishReason === 'content_filter') {
        throw new Error('Nội dung bị chặn bởi bộ lọc. Vui lòng thử file PDF khác.');
      }
    }

    // Check if response is refusal
    if (responseText.toLowerCase().includes("i'm sorry") ||
        responseText.toLowerCase().includes("i cannot") ||
        responseText.toLowerCase().includes("i can't")) {
      console.error('OpenAI refused the request');
      throw new Error('OpenAI từ chối xử lý nội dung này. Vui lòng thử file PDF khác.');
    }

    // Remove markdown code blocks if present
    let jsonText = responseText.trim();
    if (jsonText.startsWith('```json')) {
      console.log('Removing ```json markdown wrapper');
      jsonText = jsonText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('```')) {
      console.log('Removing ``` markdown wrapper');
      jsonText = jsonText.replace(/^```\n?/, '').replace(/\n?```$/, '');
    } else if (jsonText.startsWith('#')) {
      console.error('ERROR: Response starts with markdown header #');
      throw new Error('AI trả về text thay vì JSON. Vui lòng thử lại.');
    }

    // Parse JSON
    let parsedData;
    try {
      parsedData = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Full response text:', jsonText.substring(0, 1000));
      throw new Error(`AI trả về định dạng không hợp lệ: ${jsonText.substring(0, 100)}...`);
    }

    // Handle both array and object with questions array
    const questions = Array.isArray(parsedData) ? parsedData : parsedData.questions || [];

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error('Không tìm thấy câu hỏi trong response.');
    }

    // Validate and add IDs
    const processedQuestions = questions.map((q: any, index: number) => ({
      id: `q-${Date.now()}-${index}`,
      question: q.question || '',
      type: q.type || 'multiple-choice',
      options: q.options || [],
      correctAnswer: q.correctAnswer ?? 0,
      explanation: q.explanation || '',
      points: q.points || 1,
      imageUrl: q.imageUrl || undefined,
      imageDescription: q.imageDescription || undefined,
      hasImage: q.hasImage || !!q.imageDescription, // Mark if question has image
      // New fields for Vietnamese exam format
      subQuestions: q.subQuestions || undefined, // For true-false questions
      sampleAnswer: q.sampleAnswer || undefined, // For essay questions
      rubric: q.rubric || undefined, // Grading criteria
    }));

    console.log(`Successfully extracted ${processedQuestions.length} questions`);

    return NextResponse.json({
      success: true,
      questions: processedQuestions,
      message: `Đã trích xuất ${processedQuestions.length} câu hỏi từ ${images.length} trang PDF`,
    });

  } catch (error: any) {
    console.error('Error extracting exam:', error);

    // Better error messages
    let errorMessage = 'Lỗi khi xử lý file';
    if (error.message?.includes('JSON') || error.message?.includes('parse')) {
      errorMessage = 'AI không thể phân tích đề thi. Vui lòng thử file PDF khác có cấu trúc rõ ràng hơn.';
    } else if (error.message?.includes('API key') || error.message?.includes('authentication')) {
      errorMessage = 'Lỗi API key. Vui lòng kiểm tra OPENAI_API_KEY trong .env.local';
    } else if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
      errorMessage = 'Đã vượt quá giới hạn API. Vui lòng thử lại sau.';
    } else if (error.message?.includes('từ chối') || error.message?.includes('refusal')) {
      errorMessage = error.message;
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: error.message
      },
      { status: 500 }
    );
  }
}
