import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { env } from '@/core/config/env';
import { apiError } from '@/core/api/api-response';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const keyId = env.razorpay.keyId;
    const keySecret = env.razorpay.keySecret;

    if (!keyId || !keySecret) {
      return apiError('Razorpay API keys are not configured', 500, 'PAYMENT_CONFIG_MISSING');
    }

    const body = await req.json().catch(() => ({}));
    let { amount, currency = 'INR', receipt } = body || {};

    if (typeof amount !== 'number' || isNaN(amount)) {
      return apiError('Invalid or missing amount', 400, 'INVALID_AMOUNT');
    }

    // Validate minimum amount: 100 paise (₹1)
    if (amount < 100) {
      return apiError('Amount must be at least 100 paise', 400, 'MINIMUM_AMOUNT_ERROR');
    }

    if (!receipt) {
      receipt = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    }

    const instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const order = await instance.orders.create({
      amount: Math.round(amount),
      currency: currency.toUpperCase(),
      receipt,
    });

    return NextResponse.json({
      success: true,
      order_id: order.id,
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    });
  } catch (error: unknown) {
    console.error('[Create Order Error]:', error);
    const message = error instanceof Error ? error.message : 'Razorpay API error';
    return apiError('Failed to create order', 500, 'ORDER_CREATION_FAILED', { details: message });
  }
}
