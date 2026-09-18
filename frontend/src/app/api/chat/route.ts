import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { heritageChatFlow } from '@/ai/flows/chat';
import { checkChatBudgetAsync } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'unauthorized', errorCode: 'CHAT_UNAUTHORIZED' }, { status: 401 });
    }

    const budget = await checkChatBudgetAsync(userId);
    if (!budget.allowed) {
      return NextResponse.json(
        {
          error: 'rate_limited',
          errorCode: 'CHAT_RATE_LIMITED',
          resetAt: new Date(budget.resetAt).toISOString(),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((budget.resetAt - Date.now()) / 1000)),
          },
        },
      );
    }

    const { message, history, imageDataUri } = await req.json();
    const result = await heritageChatFlow({ message, history, imageDataUri });

    return NextResponse.json(result, {
      headers: { 'X-Chat-Remaining': String(budget.remaining) },
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    return NextResponse.json({ error: 'service_error', errorCode: 'CHAT_SERVICE_ERROR' }, { status: 500 });
  }
}
