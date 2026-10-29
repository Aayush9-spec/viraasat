import { sendOrderConfirmation } from '@/lib/notifications/email';
import { NextResponse } from 'next/server';
import { gateway, signatureMatches } from '@/lib/server/commerce';
import { check, database, failure, HttpError } from '@/lib/server/security';
export const runtime = 'nodejs';
export async function POST(req: Request) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) throw new HttpError(503, 'Webhook unavailable');
    const raw = await req.text();
    if (!signatureMatches(raw, req.headers.get('x-razorpay-signature'), secret)) throw new HttpError(400, 'Invalid signature');
    const event = JSON.parse(raw);
    if (!['payment.captured', 'order.paid', 'refund.processed'].includes(event.event)) return NextResponse.json({ received: true });
    const id = event.payload?.payment?.entity?.id || event.payload?.refund?.entity?.payment_id;
    if (typeof id !== 'string') throw new HttpError(400, 'Missing payment');
    // Fetch authoritative provider state; tolerate delayed/out-of-order webhook delivery.
    const payment = await gateway().payments.fetch(id);
    const db = database();
    const { data: row, error } = await db.from('commerce_orders').select('*').eq('razorpay_order_id', payment.order_id).maybeSingle();
    check(error);
    if (!row) throw new HttpError(503, 'Order has not been persisted yet');
    if (Number(payment.amount) !== row.amount || payment.currency !== 'INR') throw new HttpError(400, 'Payment amount mismatch');
    if (row.payment_id && row.payment_id !== id) throw new HttpError(409, 'Payment conflict');
    const refunded = Number(payment.amount_refunded || 0) >= row.amount;
    if (refunded) {
      const { error: e } = await db.from('commerce_orders').update({ payment_status: 'Refunded', payment_id: id, updated_at: new Date().toISOString() }).eq('id', row.id);
      check(e);
    } else if (payment.status === 'captured') {
      const { error: e } = await db.from('commerce_orders').update({ payment_status: 'Paid', payment_id: id, updated_at: new Date().toISOString() }).eq('id', row.id).eq('payment_status', 'Pending Payment');
      check(e);
      if (row.payment_status !== 'Refunded' && !row.confirmation_sent_at && row.payload.buyerEmail) {
        const sent = await sendOrderConfirmation({to:row.payload.buyerEmail,orderId:row.razorpay_order_id,
          items:row.payload.items,total:row.payload.totalAmount,
          shippingAddress:[row.payload.shippingAddress.addressLine1,row.payload.shippingAddress.city,row.payload.shippingAddress.state,row.payload.shippingAddress.zipCode].join(', ')});
        if(sent) {
          const {error: notificationError}=await db.from('commerce_orders').update({confirmation_sent_at:new Date().toISOString()}).eq('id',row.id);
          check(notificationError);
        }
      }
    }
    return NextResponse.json({ received: true });
  } catch (e) { return failure(e); }
}
