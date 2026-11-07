import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { checkRateLimit, getClientIp, SecurityRateLimits } from '@/lib/rate-limiter';
import { logSecurityEvent } from '@/lib/security-logger';
import { AdminPinSchema } from '@/lib/validation/schemas';

export const runtime = 'nodejs';

/**
 * Constant-time string comparison preventing timing attacks.
 */
function timingSafeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    // Perform dummy comparison to keep constant-time characteristics
    crypto.timingSafeEqual(bufA, bufA);
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export async function POST(req: Request) {
  const ip = getClientIp(req);

  // 1. Enforce strict rate limiting (5 attempts per 15 min per IP) to prevent brute force
  const rateLimit = checkRateLimit(`admin-pin:${ip}`, SecurityRateLimits.ADMIN_PIN);
  if (!rateLimit.allowed) {
    logSecurityEvent({
      type: 'ADMIN_PIN_RATE_LIMITED',
      ip,
      path: '/api/admin/verify-pin',
      details: { resetAt: new Date(rateLimit.resetAt).toISOString() },
    });
    return NextResponse.json(
      {
        valid: false,
        error: 'Too many failed passcode attempts. Please wait 15 minutes before retrying.',
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
        },
      }
    );
  }

  try {
    const rawBody = await req.json().catch(() => ({}));
    const parseResult = AdminPinSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { valid: false, error: 'Invalid passcode format.' },
        { status: 400 }
      );
    }

    const { pin } = parseResult.data;
    // Expected PIN from server-only environment variable. Do not expose via NEXT_PUBLIC_.
    const expectedPin = process.env.ADMIN_PIN;

    if (!expectedPin) {
      console.error('[Admin PIN Error] ADMIN_PIN is not configured in server environment.');
      return NextResponse.json(
        { valid: false, error: 'Administrative service is temporarily unavailable.' },
        { status: 503 }
      );
    }

    // 2. Constant-time comparison prevents timing side-channel attacks
    const isValid = timingSafeCompare(String(pin).trim(), expectedPin.trim());

    if (!isValid) {
      logSecurityEvent({
        type: 'ADMIN_PIN_FAILED',
        ip,
        path: '/api/admin/verify-pin',
        details: { remainingAttempts: rateLimit.remaining },
      });
      return NextResponse.json(
        {
          valid: false,
          error: `Invalid Administrator Passcode. ${rateLimit.remaining} attempts remaining before temporary lockout.`,
        },
        { status: 401 }
      );
    }

    logSecurityEvent({
      type: 'ADMIN_PIN_SUCCESS',
      ip,
      path: '/api/admin/verify-pin',
    });

    return NextResponse.json({ valid: true });
  } catch (err) {
    console.error('[Admin PIN Error]:', err);
    return NextResponse.json(
      { valid: false, error: 'Internal verification error.' },
      { status: 500 }
    );
  }
}
