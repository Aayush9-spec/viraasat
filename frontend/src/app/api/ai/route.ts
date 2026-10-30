import { NextResponse } from 'next/server';
export async function GET() {
  const configured=Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY || process.env.GOOGLE_API_KEY);
  return NextResponse.json({status:configured?'configured':'unavailable',provider:'Google Genkit + Gemini',inferenceVerified:false,flows:['chat','translate','vision'],imageEnhancementConfigured:configured && Boolean(process.env.GEMINI_IMAGE_MODEL)});
}
