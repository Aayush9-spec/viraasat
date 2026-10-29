import { NextResponse } from 'next/server';
import { createOrder, ownedOrder, presentOrder, verifyPayment } from '@/lib/server/commerce';
import { failure, HttpError } from '@/lib/server/security';
export const runtime = 'nodejs';
export async function POST(req: Request) {
  try { return NextResponse.json(await createOrder(await req.json())); } catch (e) { return failure(e); }
}
export async function PUT(req: Request) {
  try { return NextResponse.json(await verifyPayment(await req.json())); } catch (e) { return failure(e); }
}
export async function GET(req: Request) {
  try {
    const id = new URL(req.url).searchParams.get('order_id');
    if (!id || !/^order_[a-zA-Z0-9]+$/.test(id)) throw new HttpError(400, 'Invalid order ID');
    return NextResponse.json(presentOrder(await ownedOrder(id)));
  } catch (e) { return failure(e); }
}
