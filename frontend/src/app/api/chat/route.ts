import { heritageChatFlow } from '@/ai/flows/chat';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, history, imageDataUri } = await req.json();
    
    const result = await heritageChatFlow({
      message,
      history,
      imageDataUri
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'Failed to process chat' }, { status: 500 });
  }
}
