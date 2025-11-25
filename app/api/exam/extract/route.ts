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
    const systemPrompt = `You are a math exam analyzer that extracts questions from images and returns ONLY valid JSON.

CRITICAL RULES:
1. ALWAYS respond with ONLY a JSON object - NO markdown, NO text, NO explanations
2. Convert math formulas to LaTeX: x² → $x^2$, ∫ → $\\int$, fractions → $\\frac{a}{b}$
3. Question types: multiple-choice, true-false, fill-in, essay
4. For images/diagrams: describe in "imageDescription" field

JSON structure:
{
  "questions": [{
    "question": "text with LaTeX like $x^2$",
    "type": "multiple-choice",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": 0,
    "explanation": "text",
    "points": 1
  }]
}

Rules: correctAnswer is number (0-3) for multiple-choice, string for others. points: 1-3.`;

    const userPrompt = `Extract ALL questions from these ${images.length} pages. Return ONLY the JSON object.`;

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
      max_tokens: 4096,
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
      rubric: q.rubric || undefined,
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
