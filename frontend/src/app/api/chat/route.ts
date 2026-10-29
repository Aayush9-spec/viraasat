import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { runHeritageChat } from '@/ai/flows/chat';
import { checkChatBudgetAsync } from '@/lib/rate-limit';

export async function POST(req: Request) {
  try {
    // Allow unauthenticated users with a shared guest budget
    const { userId } = await auth();
    const effectiveUserId = userId ?? `guest:${req.headers.get('x-forwarded-for') ?? 'anon'}`;

    const budget = await checkChatBudgetAsync(effectiveUserId);
    if (!budget.allowed) {
      const resetIn = Math.ceil((budget.resetAt - Date.now()) / 1000 / 60);
      return NextResponse.json(
        {
          error: 'rate_limited',
          errorCode: 'CHAT_RATE_LIMITED',
          response: `You've reached your daily message limit. Your limit resets in ${resetIn} minutes. Sign in to get a higher daily quota.`,
          resetAt: new Date(budget.resetAt).toISOString(),
        },
        {
          status: 200, // Return 200 so the UI shows the message rather than an error
          headers: {
            'Retry-After': String(Math.ceil((budget.resetAt - Date.now()) / 1000)),
          },
        },
      );
    }

    const { message, history, imageDataUri } = await req.json();
    const result = await runHeritageChat({ message, history, imageDataUri });

    return NextResponse.json(result, {
      headers: { 'X-Chat-Remaining': String(budget.remaining) },
    });
  } catch (error) {
    console.error('Chat API Error:', error);
    // Return a graceful error message rather than a 500 that breaks the UI
    return NextResponse.json({
      response: "I'm having a little trouble right now — the heritage archives are momentarily unavailable. Please try again in a few seconds!",
      activeAgent: 'System',
      errorCode: 'CHAT_SERVICE_ERROR',
    });
  }
}
