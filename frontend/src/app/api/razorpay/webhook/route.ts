import { NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { db } from '@/services/firebase/firestore';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';

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

  const payload = event.payload as any;

  switch (event.event) {
    case 'payment.captured':
    case 'order.paid': {
      const paymentEntity = payload?.payment?.entity;
      const orderId = paymentEntity?.order_id || payload?.order?.entity?.id;
      const paymentId = paymentEntity?.id;
      console.log(`Razorpay payment captured: ${paymentId} for order ${orderId}`);

      if (db) {
        try {
          const ordersRef = collection(db, 'orders');
          const q = query(ordersRef, where('paymentId', '==', paymentId));
          const snapshot = await getDocs(q);
          snapshot.forEach(async (docSnap) => {
            await updateDoc(doc(db, 'orders', docSnap.id), {
              status: 'Paid',
              updatedAt: new Date().toISOString(),
            });
          });
        } catch (e) {
          console.error('Error updating order status in Firestore:', e);
        }
      }
      break;
    }
    case 'payment.failed': {
      const paymentEntity = payload?.payment?.entity;
      const paymentId = paymentEntity?.id;
      console.log(`Razorpay payment failed: ${paymentId}`);

      if (db) {
        try {
          const ordersRef = collection(db, 'orders');
          const q = query(ordersRef, where('paymentId', '==', paymentId));
          const snapshot = await getDocs(q);
          snapshot.forEach(async (docSnap) => {
            await updateDoc(doc(db, 'orders', docSnap.id), {
              status: 'Payment Failed',
              updatedAt: new Date().toISOString(),
            });
          });
        } catch (e) {
          console.error('Error updating failed order status in Firestore:', e);
        }
      }
      break;
    }
    case 'refund.processed': {
      const refundEntity = payload?.refund?.entity;
      const paymentId = refundEntity?.payment_id;
      console.log(`Razorpay refund processed for payment ${paymentId}`);

      if (db) {
        try {
          const ordersRef = collection(db, 'orders');
          const q = query(ordersRef, where('paymentId', '==', paymentId));
          const snapshot = await getDocs(q);
          snapshot.forEach(async (docSnap) => {
            await updateDoc(doc(db, 'orders', docSnap.id), {
              status: 'Refunded',
              updatedAt: new Date().toISOString(),
            });
          });
        } catch (e) {
          console.error('Error updating refunded order status in Firestore:', e);
        }
      }
      break;
    }
    default:
      console.log('Unhandled Razorpay event:', event.event);
  }

  return NextResponse.json({ received: true });
}
