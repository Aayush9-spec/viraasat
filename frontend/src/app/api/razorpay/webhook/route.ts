import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { adminDb } from '@/lib/firebase/admin';
import { sendOrderConfirmation } from '@/lib/notifications/email';

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
 * Orders are matched directly by Razorpay order id (which is the Firestore
 * document id written at order creation).
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

  if (!adminDb) {
    console.error(
      'FIREBASE_SERVICE_ACCOUNT_JSON is not configured; payment status was not persisted.',
    );
    return NextResponse.json({ received: true });
  }

  let event: { event?: string; payload?: unknown };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const payload = event.payload as any;

  switch (event.event) {
    case 'payment.captured':
    case 'order.paid': {
      const paymentEntity = payload?.payment?.entity;
      const orderId = paymentEntity?.order_id || payload?.order?.entity?.id;
      const paymentId = paymentEntity?.id;

      if (!orderId) {
        console.warn('Razorpay paid event without an order id');
        break;
      }

      const ordersRef = adminDb.doc(`orders/${orderId}`);
      const snapshot = await ordersRef.get();

      if (!snapshot.exists) {
        // Legacy orders may live under a auto-generated id keyed by paymentId.
        const legacySnap = await adminDb
          .collection('orders')
          .where('paymentId', '==', paymentId)
          .get();
        for (const legacyDoc of legacySnap.docs) {
          if (legacyDoc.data().paymentStatus !== 'Paid') {
            await legacyDoc.ref.update({
              status: 'Processing',
              paymentStatus: 'Paid',
              capturedAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        }
        break;
      }

      const order = snapshot.data();
      if (!order) {
        break;
      }
      const capturedAmount = paymentEntity?.amount;
      if (capturedAmount !== undefined && typeof capturedAmount === 'number') {
        const expectedAmount = Math.round(order.totalAmount * 100);
        if (capturedAmount !== expectedAmount) {
          console.error(
            `Amount mismatch for order ${orderId}: captured ${capturedAmount}, expected ${expectedAmount}.`,
          );
          break;
        }
      } else {
        console.warn(`Razorpay captured event missing payment amount for order ${orderId}.`);
      }

      if (order.paymentStatus !== 'Paid') {
        await ordersRef.update({
          status: 'Processing',
          paymentStatus: 'Paid',
          paymentId: typeof paymentId === 'string' ? paymentId : null,
          capturedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        console.log(`Razorpay payment captured: ${paymentId} for order ${orderId}`);

        // Send order confirmation email
        const buyerEmail = order.shippingAddress?.email || order.buyerEmail;
        if (buyerEmail && typeof buyerEmail === 'string') {
          const shippingAddr = order.shippingAddress;
          const addressStr = shippingAddr
            ? `${shippingAddr.addressLine1 || ''}, ${shippingAddr.city || ''}, ${shippingAddr.state || ''} ${shippingAddr.zipCode || ''}`
            : '';
          await sendOrderConfirmation({
            to: buyerEmail,
            orderId,
            items: order.items || [],
            total: order.totalAmount || 0,
            shippingAddress: addressStr,
          });
        }
      }
      break;
    }

    case 'payment.failed': {
      const paymentEntity = payload?.payment?.entity;
      console.log(`Razorpay payment failed: ${paymentEntity?.id}`);
      break;
    }

    case 'refund.processed': {
      const refundEntity = payload?.refund?.entity;
      const paymentId = refundEntity?.payment_id;
      const snapshot = await adminDb
        .collection('orders')
        .where('paymentId', '==', paymentId)
        .get();
      for (const docSnap of snapshot.docs) {
        if (docSnap.data().paymentStatus !== 'Refunded') {
          await docSnap.ref.update({
            status: 'Cancelled',
            paymentStatus: 'Refunded',
            updatedAt: new Date().toISOString(),
          });
        }
      }
      console.log(`Razorpay refund processed for payment ${paymentId}`);
      break;
    }

    default:
      console.log('Unhandled Razorpay event:', event.event);
  }

  return NextResponse.json({ received: true });
}