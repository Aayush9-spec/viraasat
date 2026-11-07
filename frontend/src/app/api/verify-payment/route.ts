import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { auth } from '@clerk/nextjs/server';
import { env } from '@/core/config/env';
import { apiError } from '@/core/api/api-response';
import { checkRateLimit, getClientIp, SecurityRateLimits } from '@/lib/rate-limiter';
import { logSecurityEvent } from '@/lib/security-logger';
import { VerifyPaymentSchema } from '@/lib/validation/schemas';

export const runtime = 'nodejs';

/**
 * Timing-safe HMAC signature verification preventing timing attacks.
 */
function verifyTimingSafeSignature(expected: string, actual: string): boolean {
  const bufExpected = Buffer.from(expected);
  const bufActual = Buffer.from(actual);
  if (bufExpected.length !== bufActual.length) {
    crypto.timingSafeEqual(bufExpected, bufExpected);
    return false;
  }
  return crypto.timingSafeEqual(bufExpected, bufActual);
}

export async function POST(req: Request) {
  const ip = getClientIp(req);

  // 1. Rate limiting on payment verification
  const rateLimit = checkRateLimit(`payment-verify:${ip}`, SecurityRateLimits.ORDER_CREATION);
  if (!rateLimit.allowed) {
    logSecurityEvent({
      type: 'RATE_LIMIT_EXCEEDED',
      ip,
      path: '/api/verify-payment',
    });
    return apiError('Too many verification requests. Please wait a moment.', 429, 'RATE_LIMIT_EXCEEDED');
  }

  try {
    const { userId } = await auth();

    const keySecret = env.razorpay.keySecret;
    if (!keySecret) {
      return apiError('Razorpay secret key is not configured', 500, 'PAYMENT_CONFIG_MISSING');
    }

    const rawBody = await req.json().catch(() => ({}));

    // Normalize keys (support razorpay_ prefixed keys and standard keys)
    const normalizedBody = {
      order_id: rawBody.razorpay_order_id || rawBody.order_id,
      payment_id: rawBody.razorpay_payment_id || rawBody.payment_id,
      signature: rawBody.razorpay_signature || rawBody.signature,
    };

    const parseResult = VerifyPaymentSchema.safeParse(normalizedBody);
    if (!parseResult.success) {
      return apiError(
        'Missing required fields: order_id, payment_id, and signature are required',
        400,
        'VALIDATION_ERROR'
      );
    }

    const { order_id, payment_id, signature } = parseResult.data;

    const bodyToSign = `${order_id}|${payment_id}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(bodyToSign)
      .digest('hex');

    // 2. Timing-safe comparison prevents timing attacks
    const isMatch = verifyTimingSafeSignature(expectedSignature, signature);

    if (!isMatch) {
      logSecurityEvent({
        type: 'PAYMENT_SIGNATURE_MISMATCH',
        userId,
        ip,
        path: '/api/verify-payment',
        details: { order_id, payment_id },
      });

      return NextResponse.json(
        { success: false, verified: false, error: 'Signature mismatch. Payment verification failed.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
      message: 'Payment signature verified successfully',
      order_id,
      payment_id,
    });
  } catch (error: unknown) {
    console.error('[Verify Payment Error]:', error);
    const message = error instanceof Error ? error.message : 'Unknown payment verification error';
    return apiError('Failed to verify payment signature', 500, 'VERIFICATION_FAILED', { details: message });
  }
}
