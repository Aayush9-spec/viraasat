import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { heritageChatFlow } from '@/ai/flows/chat';

// Simple in-process per-user daily budget for the Gemini-backed chat flow.
// Process-local only — fine for single-instance Vercel deployments. For
// multi-instance or serverless concurrency, swap to a shared store
// (Upstash Redis, Firestore counter, Vercel KV).
const DAILY_LIMIT = Number(process.env.CHAT_DAILY_LIMIT ?? 30);
const usage = new Map<string, { count: number; resetAt: number }>();

function currentWindow() {
  const now = Date.now();
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  return { dayStart: start.getTime(), now };
}

function checkAndIncrement(userId: string): { allowed: boolean; remaining: number; resetAt: number } {
  const { dayStart, now } = currentWindow();
  const entry = usage.get(userId);
  if (!entry || entry.resetAt !== dayStart) {
    usage.set(userId, { count: 1, resetAt: dayStart });
    return { allowed: true, remaining: DAILY_LIMIT - 1, resetAt: dayStart };
  }
  if (entry.count >= DAILY_LIMIT) {
    return { allowed: false, remaining: 0, resetAt: dayStart };
  }
  entry.count += 1;
  return { allowed: true, remaining: DAILY_LIMIT - entry.count, resetAt: dayStart };
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      // Stable error code; the FE maps it to a localized message.
      return NextResponse.json({ error: 'unauthorized', errorCode: 'CHAT_UNAUTHORIZED' }, { status: 401 });
    }

    const budget = checkAndIncrement(userId);
    if (!budget.allowed) {
      return NextResponse.json(
        {
          error: 'rate_limited',
          errorCode: 'CHAT_RATE_LIMITED',
          resetAt: new Date(budget.resetAt + 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(
              Math.ceil((budget.resetAt + 24 * 60 * 60 * 1000 - Date.now()) / 1000),
            ),
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
