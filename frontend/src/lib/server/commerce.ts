import 'server-only';
import crypto from 'node:crypto';
import Razorpay from 'razorpay';
import { z } from 'zod';
import { check, database, HttpError, identity } from './security';

export const checkoutInput = z.object({
  items: z.array(z.object({ productId: z.string().uuid(), quantity: z.number().int().min(1).max(99) })).min(1).max(100),
  shippingOption: z.enum(['standard', 'express']).default('standard'),
  idempotencyKey: z.string().uuid(),
  shipping: z.object({ fullName: z.string().trim().min(1).max(200), addressLine1: z.string().trim().min(1).max(500), addressLine2: z.string().max(500).default(''), city: z.string().trim().min(1), state: z.string().trim().min(1), zipCode: z.string().regex(/^\d{6}$/), country: z.literal('India').default('India'), phoneNumber: z.string().regex(/^\+?[\d\s-]{10,16}$/) }),
});
export function gateway() {
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;
  if (!key_id || !key_secret) throw new HttpError(503, 'Payments are temporarily unavailable');
  return new Razorpay({ key_id, key_secret });
}
export function signatureMatches(body: string, signature: unknown, secret: string) {
  if (typeof signature !== 'string' || !/^[a-f0-9]{64}$/i.test(signature)) return false;
  const expected = crypto.createHmac('sha256', secret).update(body).digest();
  return crypto.timingSafeEqual(expected, Buffer.from(signature, 'hex'));
}
export function totals(items: {unitPrice: number; quantity: number}[], express: boolean) {
  const subtotalPaise = items.reduce((n, i) => n + Math.round(i.unitPrice * 100) * i.quantity, 0);
  if (!Number.isSafeInteger(subtotalPaise) || subtotalPaise < 100) throw new HttpError(400, 'Invalid order amount');
  const taxPaise = Math.round(subtotalPaise * .18);
  const shippingPaise = express ? 14900 : 0;
  return { subtotal: subtotalPaise / 100, tax: taxPaise / 100, shippingFee: shippingPaise / 100, totalAmount: (subtotalPaise + taxPaise + shippingPaise) / 100, amount: subtotalPaise + taxPaise + shippingPaise };
}
export async function createOrder(body: unknown) {
  const user = await identity();
  const parsed = checkoutInput.safeParse(body);
  if (!parsed.success) throw new HttpError(400, 'Invalid cart or shipping details');
  const input = parsed.data;
  const ids = input.items.map(i => i.productId);
  if (new Set(ids).size !== ids.length) throw new HttpError(400, 'Duplicate product');
  const db = database();
  const requestHash = crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex');
  const { data: previous, error: lookupError } = await db.from('commerce_orders').select('*').eq('buyer_id', user.id).eq('idempotency_key', input.idempotencyKey).maybeSingle();
  check(lookupError);
  if (previous) {
    if (previous.request_hash !== requestHash) throw new HttpError(409, 'Checkout details changed; start a new checkout');
    if (!previous.razorpay_order_id) {
      // Recover an order created before a provider timeout or database write failure.
      const candidates = await gateway().orders.all({receipt:previous.id, count:100});
      const matches = candidates.items.filter(o => o.receipt === previous.id && Number(o.amount) === previous.amount && o.currency === 'INR');
      if (matches.length !== 1) throw new HttpError(409, 'Checkout needs reconciliation; contact support with your order reference before retrying');
      const recovered = matches[0];
      const {error} = await db.from('commerce_orders').update({razorpay_order_id:recovered.id}).eq('id',previous.id);
      check(error);
      previous.razorpay_order_id = recovered.id;
    }
    if (previous.payment_status !== 'Pending Payment') throw new HttpError(409, 'This order has already been paid; check My Orders');
    return { id: previous.razorpay_order_id, order_id: previous.razorpay_order_id, amount: previous.amount, currency: 'INR', existingOrder: true };
  }
  const { data: catalog, error } = await db.from('products').select('id,name,price,stock,images,artisan_id,is_active').in('id', ids);
  check(error);
  const items = input.items.map(i => {
    const p = catalog?.find(p => p.id === i.productId);
    if (!p || p.is_active === false) throw new HttpError(400, 'Product unavailable');
    const price = Number(p.price);
    if (!Number.isFinite(price) || price <= 0 || !Number.isInteger(p.stock) || p.stock < i.quantity) throw new HttpError(409, 'Product price or stock unavailable');
    return { productId: p.id, artisanId: p.artisan_id, productName: p.name, quantity: i.quantity, unitPrice: price, itemImageUrl: p.images?.[0] || '' };
  });
  const amounts = totals(items, input.shippingOption === 'express');
  const payment = gateway();
  const id = crypto.randomUUID();
  const payload = { buyerId: user.id, buyerEmail: user.email, items, ...amounts, currency: 'INR', shippingAddress: input.shipping, status: 'Pending', paymentStatus: 'Pending Payment', orderDate: new Date().toISOString() };
  const { error: reservationError } = await db.from('commerce_orders').insert({ id, buyer_id: user.id, idempotency_key: input.idempotencyKey, request_hash: requestHash, amount: amounts.amount, payload });
  if (reservationError?.code === '23505') throw new HttpError(409, 'Checkout is already being processed');
  if (reservationError?.code === '23514') throw new HttpError(409, 'Stock or price changed. Refresh your cart before paying');
  check(reservationError);
  // An ambiguous provider failure leaves the reservation pending; never charge again automatically.
  const order = await payment.orders.create({ amount: amounts.amount, currency: 'INR', receipt: id, notes: { clerkUserId: user.id } });
  const { error: saveError } = await db.from('commerce_orders').update({ razorpay_order_id: order.id }).eq('id', id);
  check(saveError);
  return { id: order.id, order_id: order.id, amount: amounts.amount, currency: 'INR' };
}
export async function ownedOrder(orderId: string) {
  const user = await identity();
  const { data, error } = await database().from('commerce_orders').select('*').eq('razorpay_order_id', orderId).eq('buyer_id', user.id).maybeSingle();
  check(error);
  if (!data) throw new HttpError(404, 'Order not found');
  return data;
}
export function presentOrder(row: Record<string, any>) {
  const sellerIds = [...new Set((row.payload.items || []).map((i: any) => i.artisanId))] as string[];
  const fulfillment = row.fulfillment || {};
  const statuses = sellerIds.map(id => fulfillment[id]?.status || 'Processing');
  const status = row.payment_status === 'Refunded' ? 'Cancelled' : row.payment_status === 'Pending Payment' ? 'Pending' :
    statuses.every(s => s === 'Delivered') ? 'Delivered' : statuses.every(s => ['Shipped','Delivered'].includes(s)) ? 'Shipped' : 'Processing';
  return { ...row.payload, id: row.razorpay_order_id || row.id, internalId: row.id,
    razorpayOrderId: row.razorpay_order_id, paymentId: row.payment_id, paymentStatus: row.payment_status,
    status, fulfillment, refundRequest: row.refund_request, refundedAmount: Number(row.refunded_amount || 0)/100, updatedAt: row.updated_at };
}
export async function verifyPayment(body: Record<string, unknown>) {
  const orderId = body.razorpay_order_id || body.order_id;
  const paymentId = body.razorpay_payment_id || body.payment_id;
  const signature = body.razorpay_signature || body.signature;
  if (typeof orderId !== 'string' || typeof paymentId !== 'string') throw new HttpError(400, 'Invalid payment details');
  const row = await ownedOrder(orderId);
  const provider = gateway();
  if (!signatureMatches(`${orderId}|${paymentId}`, signature, process.env.RAZORPAY_KEY_SECRET!)) throw new HttpError(400, 'Invalid signature');
  const payment = await provider.payments.fetch(paymentId);
  if (payment.order_id !== orderId || Number(payment.amount) !== row.amount || payment.currency !== 'INR') throw new HttpError(400, 'Payment does not match order');
  if (payment.status !== 'captured') throw new HttpError(409, 'Payment capture is pending; check order status shortly');
  if (Number(payment.amount_refunded || 0) > 0 || row.payment_status === 'Partially Refunded') throw new HttpError(409, 'Payment has a refund; check My Orders');
  if (row.payment_status === 'Refunded') throw new HttpError(409, 'Payment has been refunded');
  if (row.payment_id && row.payment_id !== paymentId) throw new HttpError(409, 'Order has a different payment');
  const { error } = await database().from('commerce_orders').update({ payment_status: 'Paid', payment_id: paymentId, updated_at: new Date().toISOString() }).eq('id', row.id).eq('payment_status', 'Pending Payment');
  check(error);
  // Re-read authoritative state in case a refund raced the confirmation.
  const updated = await ownedOrder(orderId);
  if (updated.payment_status !== 'Paid') throw new HttpError(409, 'Payment is not confirmed');
  return { verified: true, order_id: orderId, payment_id: paymentId };
}
