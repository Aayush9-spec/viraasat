import { NextResponse } from 'next/server';
import { z } from 'zod';
import { database, identity, profile, check, failure, HttpError } from '@/lib/server/security';
export async function GET() {
  try {
    const owner = await profile(await identity());
    const {data,error} = await database().from('wishlists').select('product_id,products(*)').eq('user_id',owner.id).limit(1000);
    check(error);
    return NextResponse.json((data || []).map((r: any) => r.products).filter(p => p?.is_active).map(p => ({...p,artisanId:p.artisan_id,price:Number(p.price)})));
  } catch(e) {return failure(e);}
}
export async function PUT(req: Request) {
  try {
    const owner = await profile(await identity());
    const parsed = z.object({productId:z.string().uuid(),saved:z.boolean()}).strict().safeParse(await req.json());
    if(!parsed.success)throw new HttpError(400,'Invalid wishlist item');
    const {productId,saved} = parsed.data;
    const db = database();
    if(saved) {
      const {data,error} = await db.from('products').select('id').eq('id',productId).eq('is_active',true).maybeSingle();
      check(error);if(!data)throw new HttpError(404,'Product unavailable');
      const result = await db.from('wishlists').upsert({user_id:owner.id,product_id:productId},{onConflict:'user_id,product_id'});
      check(result.error);
    } else {
      const {error} = await db.from('wishlists').delete().eq('user_id',owner.id).eq('product_id',productId);check(error);
    }
    return NextResponse.json({success:true});
  } catch(e) {return failure(e);}
}
