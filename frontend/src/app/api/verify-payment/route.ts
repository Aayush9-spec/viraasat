import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { env } from '@/config/env';
import { apiError } from '@/lib/api-response';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const keySecret = env.razorpay.keySecret;

    if (!keySecret) {
      return apiError('Razorpay secret key is not configured', 500, 'PAYMENT_CONFIG_MISSING');
    }

    const body = await req.json().catch(() => ({}));

    // Support both razorpay_ prefixed keys and standard keys
    const orderId = body.razorpay_order_id || body.order_id;
    const paymentId = body.razorpay_payment_id || body.payment_id;
    const signature = body.razorpay_signature || body.signature;

    if (!orderId || !paymentId || !signature) {
      return apiError(
        'Missing required fields: order_id, payment_id, and signature are required',
        400,
        'VALIDATION_ERROR'
      );
    }

    const bodyToSign = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(bodyToSign)
      .digest('hex');

    const isMatch = expectedSignature === signature;

    if (!isMatch) {
      return NextResponse.json(
        { success: false, verified: false, error: 'Signature mismatch. Payment verification failed.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      verified: true,
      message: 'Payment signature verified successfully',
      order_id: orderId,
      payment_id: paymentId,
    });
  } catch (error: unknown) {
    console.error('[Verify Payment Error]:', error);
    const message = error instanceof Error ? error.message : 'Unknown payment verification error';
    return apiError('Failed to verify payment signature', 500, 'VERIFICATION_FAILED', { details: message });
  }
}
