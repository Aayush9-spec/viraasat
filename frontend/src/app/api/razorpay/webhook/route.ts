import { NextResponse } from 'next/server';
import crypto from 'node:crypto';

export const runtime = 'nodejs';
// Webhooks are server-to-server; they don't go through Clerk auth.
export const dynamic = 'force-dynamic';

/**
 * Razorpay webhook receiver.
 *
 * Configure in: Razorpay Dashboard -> Webhooks -> Add new webhook
 *   URL:     https://YOUR_DOMAIN/api/razorpay/webhook
 *   Secret:  same as RAZORPAY_WEBHOOK_SECRET env var
 *   Events:  payment.captured, payment.failed, order.paid, refund.processed
 *
 * Always verify the X-Razorpay-Signature header before trusting the body.
 */
export async function POST(req: Request) {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    console.error('RAZORPAY_WEBHOOK_SECRET is not configured');
    return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
  }

  const signature = req.headers.get('x-razorpay-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const body = await req.text();
  const expected = crypto
    .createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  if (expected !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let event: { event?: string; payload?: unknown };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  switch (event.event) {
    case 'payment.captured':
      // TODO: mark the corresponding order as paid in Firestore
      console.log('payment.captured', event.payload);
      break;
    case 'payment.failed':
      // TODO: mark order as failed and release inventory hold
      console.log('payment.failed', event.payload);
      break;
    case 'refund.processed':
      // TODO: record refund, notify buyer/artisan
      console.log('refund.processed', event.payload);
      break;
    default:
      console.log('Unhandled Razorpay event:', event.event);
  }

  return NextResponse.json({ received: true });
}
