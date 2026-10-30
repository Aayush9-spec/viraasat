import { NextResponse } from 'next/server';
import { check, database, failure, identity, profile, HttpError } from '@/lib/server/security';
import { z } from 'zod';
import { presentOrder } from '@/lib/server/commerce';
export async function GET(req: Request) {
  try {
    const user = await identity();
    const scope = new URL(req.url).searchParams.get('scope');
    const artisan = scope === 'artisan';
    const admin = scope === 'admin';
    if (admin && user.role !== 'admin') throw new HttpError(403, 'Administrator access required');
    if (artisan && !['artisan', 'admin'].includes(user.role)) throw new HttpError(403, 'Artisan access required');
    const owner = artisan ? await profile(user) : null;
    const data: any[] = [];
    for (let offset = 0; ; offset += 100) {
      let query = database().from('commerce_orders').select('*');
      query = artisan ? query.contains('payload', { items: [{ artisanId: owner.id }] }).in('payment_status',['Paid','Partially Refunded','Refunded']) : admin ? query : query.eq('buyer_id', user.id);
      const {data: page, error} = await query.order('created_at', {ascending:false}).order('id').range(offset, offset + 99);
      check(error);
      data.push(...(page || []));
      if (!page || page.length < 100) break;
    }
    return NextResponse.json((data || []).map(row => {
      const order = presentOrder(row);
      if (!artisan) return order;
      const items = order.items.filter((i: {artisanId: string}) => i.artisanId === owner.id);
      return { id: order.id, internalId: row.id, fulfillment: order.fulfillment[owner.id] || {status:'Processing'}, shippingAddress: order.shippingAddress,
        status: order.paymentStatus === 'Refunded' ? 'Cancelled' : order.fulfillment[owner.id]?.status || 'Processing', paymentStatus: order.paymentStatus,
        orderDate: order.orderDate, items, totalAmount: items.reduce((n: number, i: {unitPrice: number; quantity: number}) => n + i.unitPrice * i.quantity, 0) };
    }));
  } catch (e) { return failure(e); }
}


export async function PATCH(req: Request) {
  try {
    const user = await identity();
    const parsed = z.discriminatedUnion('action',[
      z.object({action:z.literal('fulfill'),id:z.string().uuid(),status:z.enum(['Processing','Ready to Ship','Shipped','Delivered']),trackingId:z.string().trim().max(200).default(''),notes:z.string().max(2000).default('')}),
      z.object({action:z.literal('request-refund'),id:z.string().uuid(),reason:z.string().trim().min(10).max(2000)}),
    ]).safeParse(await req.json());
    if(!parsed.success)throw new HttpError(400,'Invalid order update');
    const input=parsed.data;
    const db=database();
    const {data:row,error}=await db.from('commerce_orders').select('*').eq('id',input.id).maybeSingle();check(error);
    if(!row)throw new HttpError(404,'Order not found');
    if(!['Paid','Partially Refunded'].includes(row.payment_status))throw new HttpError(409,'This order cannot be updated in its payment state');
    let changes: Record<string,unknown>;
    if(input.action==='request-refund') {
      if(row.buyer_id!==user.id)throw new HttpError(403,'Not your order');
      if(row.refund_request)return NextResponse.json({success:true});
      changes={refund_request:{reason:input.reason,status:'Requested',requestedAt:new Date().toISOString()}};
    } else {
      if(!['artisan','admin'].includes(user.role))throw new HttpError(403,'Artisan access required');
      const owner=await profile(user);
      if(!row.payload.items.some((i: {artisanId:string})=>i.artisanId===owner.id))throw new HttpError(403,'Not your order');
      const fulfillment=row.fulfillment || {};
      const current=fulfillment[owner.id]?.status || 'Processing';
      const stages=['Processing','Ready to Ship','Shipped','Delivered'];
      const advance=stages.indexOf(input.status)-stages.indexOf(current);
      if(advance<0 || advance>1)throw new HttpError(409,'Advance one fulfillment step at a time');
      if(['Shipped','Delivered'].includes(input.status) && !input.trackingId)throw new HttpError(400,'Tracking ID required');
      changes={fulfillment:{...fulfillment,[owner.id]:{status:input.status,trackingId:input.trackingId,notes:input.notes}}};
    }
    const {data:updated,error:saveError}=await db.from('commerce_orders').update({...changes,updated_at:new Date().toISOString()}).eq('id',row.id).eq('updated_at',row.updated_at).select('id').maybeSingle();check(saveError);
    if(!updated)throw new HttpError(409,'Order changed. Reload before retrying');
    return NextResponse.json({success:true});
  } catch(e) {return failure(e);}
}
