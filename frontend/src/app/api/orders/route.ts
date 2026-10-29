import { NextResponse } from 'next/server';
import { check, database, failure, identity, profile, HttpError } from '@/lib/server/security';
import { presentOrder } from '@/lib/server/commerce';
export async function GET(req: Request) {
  try {
    const user = await identity();
    const artisan = new URL(req.url).searchParams.get('scope') === 'artisan';
    if (artisan && !['artisan', 'admin'].includes(user.role)) throw new HttpError(403, 'Artisan access required');
    const owner = artisan ? await profile(user) : null;
    const data: any[] = [];
    for (let offset = 0; ; offset += 100) {
      let query = database().from('commerce_orders').select('*');
      query = artisan ? query.contains('payload', { items: [{ artisanId: owner.id }] }) : query.eq('buyer_id', user.id);
      const {data: page, error} = await query.order('created_at', {ascending:false}).order('id').range(offset, offset + 99);
      check(error);
      data.push(...(page || []));
      if (!page || page.length < 100) break;
    }
    return NextResponse.json((data || []).map(row => {
      const order = presentOrder(row);
      if (!artisan) return order;
      const items = order.items.filter((i: {artisanId: string}) => i.artisanId === owner.id);
      return { id: order.id, status: order.status, paymentStatus: order.paymentStatus,
        orderDate: order.orderDate, items, totalAmount: items.reduce((n: number, i: {unitPrice: number; quantity: number}) => n + i.unitPrice * i.quantity, 0) };
    }));
  } catch (e) { return failure(e); }
}
