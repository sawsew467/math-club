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
    const systemPrompt = `You are a Vietnamese math exam analyzer. Extract questions and answers from exam images.

=== STRUCTURE OF VIETNAMESE EXAMS ===
1. "ĐỀ THI" / "ĐỀ KIỂM TRA" - Exam questions (first pages)
2. "HƯỚNG DẪN CHẤM" / "ĐÁP ÁN" - Answer key (last pages)

=== CRITICAL RULES ===
⚠️ Extract answers ONLY from "HƯỚNG DẪN CHẤM" section - NEVER make up answers!
⚠️ If no answer exists in the PDF for a question, use empty string ""

=== QUESTION TYPES ===
- "multiple-choice": Options A, B, C, D → correctAnswer is index 0-3
- "true-false": Subquestions a, b, c, d with Đ/S → use subQuestions array
- "fill-in": Short answer → correctAnswer is the answer string
- "essay": Long answer → sampleAnswer is the full solution from answer key

=== FOR ESSAY QUESTIONS ===
- "sampleAnswer": Extract the COMPLETE solution from "HƯỚNG DẪN CHẤM"
- "explanation": Leave EMPTY "" (we use sampleAnswer for essays)
- "rubric": Leave EMPTY "" (only fill if there's EXPLICIT point breakdown like "a) 0.5đ, b) 0.5đ")

=== MATH FORMATTING ===
Wrap ALL math in $...$: $\\frac{1}{3}$, $x^2$, $(-\\infty; 0)$

=== JSON OUTPUT ===
{
  "questions": [{
    "question": "Question text with $LaTeX$",
    "type": "multiple-choice|true-false|fill-in|essay",
    "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
    "correctAnswer": 0,
    "explanation": "For MC/TF/fill-in: solution from answer key. For essay: empty string",
    "points": 0.25,
    "subQuestions": [{"label": "a", "content": "statement", "correct": true}],
    "sampleAnswer": "For essay only: full solution from HƯỚNG DẪN CHẤM",
    "rubric": "Only if explicit point breakdown exists, otherwise empty",
    "hasImage": true,
    "imageDescription": "Vietnamese description of image/graph"
  }]
}

=== RULES ===
- Process ALL pages including answer key at the end
- Use <br> for line breaks
- Use exact point values from exam`;

    const userPrompt = `Extract ALL questions from these ${images.length} exam pages.

INSTRUCTIONS:
1. Scan ALL pages - questions are at the start, answer key ("HƯỚNG DẪN CHẤM") is at the end
2. For each question, find its answer in the answer key section
3. For ESSAY questions: put the full solution in "sampleAnswer", leave "explanation" and "rubric" empty
4. DO NOT make up any answers - only extract what's in the document

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
