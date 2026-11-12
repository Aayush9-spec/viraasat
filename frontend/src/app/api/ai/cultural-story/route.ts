import { NextRequest, NextResponse } from 'next/server';
import { generateImageCulturalStory } from '@/ai/flows/image-cultural-story';
import { isGeminiConfigured } from '@/ai/genkit';

export const maxDuration = 30; // Max execution time for vision models

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  const reqId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  try {
    const body = await req.json();
    if (!body || !body.imageDataUri) {
      return NextResponse.json(
        {
          success: false,
          story: '',
          isHandicraft: false,
          isAiGenerated: false,
          requestId: reqId,
          error: 'Missing image data. Please upload a handicraft photo.',
        },
        { status: 400 }
      );
    }

    const result = await generateImageCulturalStory({
      ...body,
      requestId: body.requestId || reqId,
    });

    const duration = Date.now() - startTime;
    return NextResponse.json(result, {
      status: 200,
      headers: {
        'X-Request-Id': result.requestId || reqId,
        'X-Response-Time-Ms': String(duration),
        'X-AI-Configured': String(isGeminiConfigured()),
      },
    });
  } catch (error: any) {
    console.error(`[API /api/ai/cultural-story] [${reqId}] Unhandled exception:`, error);
    return NextResponse.json(
      {
        success: false,
        story: '',
        isHandicraft: false,
        isAiGenerated: false,
        requestId: reqId,
        error: error?.message || 'Server error while analyzing craft image. Please try again.',
      },
      { status: 500 }
    );
  }
}
