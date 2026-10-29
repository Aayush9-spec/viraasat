import { NextResponse } from 'next/server';
import { isGeminiConfigured } from '@/ai/genkit';

export async function GET() {
  const configured = isGeminiConfigured();
  return NextResponse.json({
    status: configured ? 'active' : 'fallback',
    configured,
    provider: 'Google Genkit + Gemini',
    model: 'gemini-1.5-flash',
    flows: ['description', 'translate', 'vision', 'chat'],
  });
}
