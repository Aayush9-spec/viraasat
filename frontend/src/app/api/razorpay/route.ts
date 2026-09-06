import { auth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import crypto from 'node:crypto';
import { products } from '@/lib/data';
import { adminDb } from '@/lib/firebase/admin';

export const runtime = 'nodejs';

const GST_RATE = 0.18;
const SHIPPING_OPTIONS = [
  { id: 'standard', label: 'Standard', price: 0 },
  { id: 'express', label: 'Express', price: 149 },
];

const CATALOG = new Map(products.map((p) => [p.id, p]));

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var: ${name}`);
  }
  return value;
}

function httpError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

interface ShippingInput {
  fullName?: string;
  email?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  phoneNumber?: string;
}

function assertShipping(value: unknown): ShippingInput {
  if (!value || typeof value !== 'object') {
    throw new Error('Shipping details are required');
  }
  const s = value as Record<string, unknown>;
  for (const field of ['fullName', 'addressLine1', 'city', 'state', 'zipCode']) {
    const val = s[field];
    if (typeof val !== 'string' || val.trim().length === 0) {
      throw new Error(`Shipping field "${field}" is required`);
    }
  }
  return {
    fullName: String(s.fullName),
    email: typeof s.email === 'string' ? s.email : '',
    addressLine1: String(s.addressLine1),
    addressLine2: typeof s.addressLine2 === 'string' ? s.addressLine2 : '',
    city: String(s.city),
    state: String(s.state),
    zipCode: String(s.zipCode),
    country: typeof s.country === 'string' && s.country ? String(s.country) : 'India',
    phoneNumber: typeof s.phoneNumber === 'string' ? s.phoneNumber : '',
  };
}

// Create a Razorpay order. Amount is recomputed server-side from the catalog;
// the client may supply items, shipping option and an idempotency key only.
export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return httpError('Unauthorized', 401);
    }

    const body = await req.json();

    const rawItems = body?.items;
    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return httpError('Cart is empty', 400);
    }

    const shippingOption = body?.shippingOption ?? 'standard';
    if (!SHIPPING_OPTIONS.some((opt) => opt.id === shippingOption)) {
      return httpError('Invalid shipping option', 400);
    }

    const idempotencyKey = body?.idempotencyKey;
    if (typeof idempotencyKey !== 'string' || idempotencyKey.length < 8 || idempotencyKey.length > 128) {
      return httpError('A valid idempotency key is required', 400);
    }

    let shipping: ShippingInput;
    try {
      shipping = assertShipping(body?.shipping);
    } catch (error) {
      return httpError(error instanceof Error ? error.message : 'Invalid shipping details', 400);
    }

    const items = rawItems.map((item: unknown, index: number) => {
      const it = item as Record<string, unknown>;
      if (typeof it?.productId !== 'string' || typeof it?.quantity !== 'number') {
        throw new Error(`Cart item ${index} is invalid`);
      }
      const quantity = Math.floor(it.quantity);
      if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        throw new Error(`Cart item ${index} has an invalid quantity`);
      }
      const product = CATALOG.get(it.productId);
      if (!product) {
        throw new Error(`Unknown product: ${it.productId}`);
      }
      return {
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        itemImageUrl: product.images?.[0] ?? '',
      };
    });

    if (!adminDb) {
      console.error(
        'Order rejected: FIREBASE_SERVICE_ACCOUNT_JSON is not configured so the order cannot be persisted.',
      );
      return httpError('Orders are temporarily unavailable', 503);
    }

    // Idempotency: a completed attempt with the same key must not double-charge.
    const existingSnap = await adminDb
      .collection('orders')
      .where('idempotencyKey', '==', idempotencyKey)
      .get();
    let existingId: string | null = null;
    for (const existingDoc of existingSnap.docs) {
      if (existingDoc.data().buyerId === userId) {
        existingId = existingDoc.id;
        break;
      }
    }
    if (existingId) {
      const existingData = (await adminDb.doc(`orders/${existingId}`).get()).data();
      return NextResponse.json({
        existingOrder: true,
        id: existingId,
        ...existingData,
      });
    }

    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const shippingFee = SHIPPING_OPTIONS.find((opt) => opt.id === shippingOption)?.price ?? 0;
    const tax = Math.round(subtotal * GST_RATE * 100) / 100;
    const totalAmount = Math.round((subtotal + shippingFee + tax) * 100) / 100;

    const instance = new Razorpay({
      key_id: requireEnv('RAZORPAY_KEY_ID'),
      key_secret: requireEnv('RAZORPAY_KEY_SECRET'),
    });

    const order = await instance.orders.create({
      amount: Math.round(totalAmount * 100),
      currency: 'INR',
      receipt: `rcpt_${userId.slice(-8)}_${Date.now()}`,
      notes: { clerkUserId: userId, idempotencyKey },
    });

    const now = new Date().toISOString();
    await adminDb.doc(`orders/${order.id}`).set({
      buyerId: userId,
      buyerEmail: shipping.email || '',
      items,
      subtotal,
      shippingFee,
      tax,
      totalAmount,
      currency: 'INR',
      shippingAddress: {
        fullName: shipping.fullName,
        addressLine1: shipping.addressLine1,
        addressLine2: shipping.addressLine2 ?? '',
        city: shipping.city,
        state: shipping.state,
        zipCode: shipping.zipCode,
        country: shipping.country ?? 'India',
        phoneNumber: shipping.phoneNumber ?? '',
      },
      status: 'Pending',
      paymentStatus: 'Pending Payment',
      paymentId: null,
      idempotencyKey,
      razorpayOrderId: order.id,
      orderDate: now,
      updatedAt: now,
    });

    return NextResponse.json({
      id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
    });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.startsWith('Unknown product')) {
      return httpError(error.message, 400);
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      { error: 'Error creating order', details: message },
      { status: 500 },
    );
  }
}

// Read the server-persisted order for the signed-in buyer (confirmation page).
export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return httpError('Unauthorized', 401);
    }

    const url = new URL(req.url);
    const orderId = url.searchParams.get('order_id');
    if (!orderId) {
      return httpError('Missing order_id', 400);
    }
    if (!adminDb) {
      return httpError('Orders are temporarily unavailable', 503);
    }

    const snapshot = await adminDb.doc(`orders/${orderId}`).get();
    if (!snapshot.exists) {
      return httpError('Order not found', 404);
    }
    const data = snapshot.data();
    if (!data || data.buyerId !== userId) {
      return httpError('Forbidden', 403);
    }

    return NextResponse.json({ id: snapshot.id, ...data });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error reading order:', error);
    return NextResponse.json(
      { error: 'Error reading order', details: message },
      { status: 500 },
    );
  }
}

// Verify a payment signature returned to the client by Razorpay Checkout.
// Call this from your success handler before marking the order paid.
export async function PUT(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return httpError('Unauthorized', 401);
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = await req.json();

    if (
      typeof razorpay_order_id !== 'string' ||
      typeof razorpay_payment_id !== 'string' ||
      typeof razorpay_signature !== 'string'
    ) {
      return httpError('Invalid payload', 400);
    }

    const secret = requireEnv('RAZORPAY_KEY_SECRET');
    const expected = crypto
      .createHmac('sha256', secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expected !== razorpay_signature) {
      return httpError('Invalid signature', 400);
    }

    return NextResponse.json({ verified: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Razorpay verify error:', error);
    return NextResponse.json(
      { error: 'Verification failed', details: message },
      { status: 500 },
    );
  }
}