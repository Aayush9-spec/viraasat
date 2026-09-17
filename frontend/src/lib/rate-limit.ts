import 'server-only';

import { adminDb, isAdminConfigured } from '@/lib/firebase/admin';

const DAILY_LIMIT = Number(process.env.CHAT_DAILY_LIMIT ?? 30);

interface UsageRecord {
  count: number;
  resetAt: number;
}

function currentWindowStart(): number {
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  return start.getTime();
}

/**
 * Shared (cross-instance) daily rate limiter backed by a Firestore counter
 * document. In-memory fallback is used only if Firestore is unavailable so
 * that staging/dev never blocks on a missing service-account secret.
 *
 * Each user gets a document at `rate_limits/chat_daily/{userId}` with fields:
 *   - count:    number of messages used today
 *   - resetAt:  epoch-ms of the current UTC day window
 *
 * A Firestore transaction ensures atomicity across concurrent requests.
 */
const memoryFallback = new Map<string, UsageRecord>();

export function checkChatBudget(userId: string): { allowed: boolean; remaining: number; resetAt: number } {
  const dayStart = currentWindowStart();
  const resetAt = dayStart + 24 * 60 * 60 * 1000;

  if (!adminDb || !isAdminConfigured()) {
    // Dev / no-backend fallback: use in-process Map. This means multi-instance
    // deployments without a service account will allow excess usage — but it
    // degrades open rather than blocking chat for everyone.
    const entry = memoryFallback.get(userId);
    if (!entry || entry.resetAt !== dayStart) {
      memoryFallback.set(userId, { count: 1, resetAt: dayStart });
      return { allowed: true, remaining: DAILY_LIMIT - 1, resetAt };
    }
    if (entry.count >= DAILY_LIMIT) {
      return { allowed: false, remaining: 0, resetAt };
    }
    entry.count += 1;
    return { allowed: true, remaining: DAILY_LIMIT - entry.count, resetAt };
  }

  // Production path: Firestore-backed counter with transaction.
  // We can't use async/await inside the route handler that calls sync code,
  // so this returns a Promise that the caller awaits.
  throw new FirestoreSyncError('async');
}

export class FirestoreSyncError extends Error {
  constructor(public mode: string) { super('Firestore sync error'); }
}

/**
 * Async version that uses Firestore transactions.
 * Returns the same shape as `checkChatBudget` but reads/writes via Firestore.
 */
export async function checkChatBudgetAsync(
  userId: string,
): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  if (!adminDb || !isAdminConfigured()) {
    return checkChatBudget(userId);
  }

  const dayStart = currentWindowStart();
  const resetAt = dayStart + 24 * 60 * 60 * 1000;
  const docRef = adminDb.collection('rate_limits').doc(`chat_daily:${userId}`);

  try {
    const result = await adminDb.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      let count = 0;
      let existingReset = 0;

      if (snap.exists) {
        const data = snap.data();
        count = data?.count ?? 0;
        existingReset = data?.resetAt ?? 0;
        if (existingReset !== dayStart) {
          count = 0;
        }
      }

      if (count >= DAILY_LIMIT) {
        return { allowed: false, count, resetAt };
      }

      tx.set(docRef, { count: count + 1, resetAt: dayStart }, { merge: true });
      return { allowed: true, count: count + 1, resetAt };
    });

    return {
      allowed: result.allowed,
      remaining: result.allowed ? DAILY_LIMIT - result.count : 0,
      resetAt,
    };
  } catch (err) {
    console.warn('Firestore rate-limit transaction failed, falling back to memory:', err);
    return checkChatBudget(userId);
  }
}
