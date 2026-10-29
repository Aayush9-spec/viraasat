import { NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { z } from 'zod';
import { check, database, failure, HttpError, identity } from '@/lib/server/security';
async function admin() {
  const user = await identity();
  if (user.role !== 'admin') throw new HttpError(403, 'Administrator access required');
  return database();
}
export async function GET() {
  try {
    const db = await admin();
    const [products, applications] = await Promise.all([db.from('products').select('*').order('created_at', {ascending:false}).limit(500), db.from('artisan_applications').select('*').order('created_at',{ascending:false}).limit(500)]);
    check(products.error);check(applications.error);
    return NextResponse.json({products:products.data,applications:applications.data});
  } catch(e) {return failure(e);}
}
export async function PATCH(req: Request) {
  try {
    const db = await admin();
    const parsed = z.discriminatedUnion('type',[
      z.object({type:z.literal('product'),id:z.string().uuid(),verdict:z.enum(['approved','flagged'])}),
      z.object({type:z.literal('application'),id:z.string().uuid(),verdict:z.enum(['approved','rejected'])}),
    ]).safeParse(await req.json());
    if (!parsed.success) throw new HttpError(400,'Invalid review');
    const input=parsed.data;
    if(input.type==='product') {
      const {data,error}=await db.from('products').update({moderation:input.verdict,status:input.verdict==='approved'?'active':'archived',is_active:input.verdict==='approved'}).eq('id',input.id).select('id').maybeSingle();
      check(error);if(!data)throw new HttpError(404,'Product not found');
    } else {
      const {data:application,error}=await db.from('artisan_applications').select('*').eq('id',input.id).maybeSingle();
      check(error);if(!application)throw new HttpError(404,'Application not found');
      if(input.verdict==='approved') {
        const clerk=await clerkClient();
        const matches=await clerk.users.getUserList({emailAddress:[application.email]});
        const account=matches.data.find(u=>u.emailAddresses.some(e=>e.emailAddress.toLowerCase()===application.email.toLowerCase() && e.verification?.status==='verified'));
        if(!account)throw new HttpError(409,'Applicant needs a verified account before approval');
        await clerk.users.updateUserMetadata(account.id,{publicMetadata:{...account.publicMetadata,role:account.publicMetadata.role==='admin'?'admin':'artisan'}});
      }
      const {error:updateError}=await db.from('artisan_applications').update({status:input.verdict}).eq('id',input.id);
      check(updateError);
    }
    return NextResponse.json({success:true});
  } catch(e) {return failure(e);}
}
