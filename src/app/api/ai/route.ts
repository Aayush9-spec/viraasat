import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'active',
    provider: 'Google Genkit + Gemini',
    flows: ['chat', 'translate', 'vision']
  });
}
