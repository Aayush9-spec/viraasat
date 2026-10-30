import { z } from 'zod';
import { apiSuccess } from '@/core/api/api-response';
import { database, identity, check, failure, HttpError } from '@/lib/server/security';
export async function GET(req: Request) {
  try {
    const id=new URL(req.url).searchParams.get('productId');
    if(id && !z.string().uuid().safeParse(id).success)return apiSuccess({reviews:[],count:0});
    let query=database().from('reviews').select('id,product_id,reviewer_id,reviewer_name,reviewer_avatar,rating,comment,created_at,verified_purchase');
    if(id)query=query.eq('product_id',id);
    const {data,error}=await query.order('created_at',{ascending:false}).limit(100);check(error);
    return apiSuccess({reviews:data || [],count:data?.length || 0});
  }catch(e){return failure(e);}
}
export async function POST(req: Request) {
  try {
    const user=await identity();
    const parsed=z.object({productId:z.string().uuid(),rating:z.number().int().min(1).max(5),comment:z.string().trim().min(10).max(5000)}).strict().safeParse(await req.json());
    if(!parsed.success)throw new HttpError(400,'Select a rating and write a review of 10–5000 characters');
    const {productId,rating,comment}=parsed.data;
    const db=database();
    const product=await db.from('products').select('artisan_id').eq('id',productId).eq('is_active',true).maybeSingle();check(product.error);
    if(!product.data)throw new HttpError(404,'Product unavailable');
    // The browser cannot skip moderation or submit a forged reviewer identity.
    const endpoint=process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
    if(!endpoint)throw new HttpError(503,'Review moderation is temporarily unavailable');
    const response=await fetch(`${endpoint}/api/fraud/detect`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({seller_id:product.data.artisan_id,reviewer_id:user.id,rating,review_text:comment}),signal:AbortSignal.timeout(10000)});
    if(!response.ok)throw new HttpError(503,'Review moderation is temporarily unavailable');
    const verdict=await response.json();
    if(typeof verdict.is_fraudulent!=='boolean')throw new HttpError(503,'Review moderation returned an invalid result');
    if(verdict.is_fraudulent)throw new HttpError(422,'This review was flagged for suspicious content. Please revise it.');
    const purchase=await db.from('commerce_orders').select('id').eq('buyer_id',user.id).in('payment_status',['Paid','Partially Refunded']).contains('payload',{items:[{productId}]}).limit(1);check(purchase.error);
    const {error}=await db.from('reviews').insert({product_id:productId,reviewer_id:user.id,reviewer_name:user.name,reviewer_avatar:'',rating,comment,verified_purchase:Boolean(purchase.data?.length)});check(error);
    return apiSuccess({success:true});
  }catch(e){return failure(e);}
}
