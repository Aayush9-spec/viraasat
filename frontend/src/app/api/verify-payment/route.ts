import { NextResponse } from 'next/server';
import crypto from 'node:crypto';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return NextResponse.json(
        { error: 'Razorpay secret key is not configured' },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    
    // Support both razorpay_ prefixed keys and standard keys
    const orderId = body.razorpay_order_id || body.order_id;
    const paymentId = body.razorpay_payment_id || body.payment_id;
    const signature = body.razorpay_signature || body.signature;

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        { error: 'Missing required fields: order_id, payment_id, and signature are required' },
        { status: 400 }
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
        { verified: false, error: 'Signature mismatch. Payment verification failed.' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      verified: true,
      message: 'Payment signature verified successfully',
      order_id: orderId,
      payment_id: paymentId,
    });
  } catch (error: any) {
    console.error('Error verifying Razorpay payment:', error);
    return NextResponse.json(
      { error: 'Failed to verify payment signature', details: error.message },
      { status: 500 }
    );
  }
}
