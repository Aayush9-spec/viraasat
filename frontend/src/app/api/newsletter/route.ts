import { z } from 'zod';
import { apiSuccess } from '@/core/api/api-response';
import { database, identity, check, failure, HttpError } from '@/lib/server/security';
export async function POST(req: Request) {
  try {
    const parsed=z.object({email:z.string().trim().email().max(254)}).safeParse(await req.json());
    if(!parsed.success)throw new HttpError(400,'A valid email address is required');
    const {error}=await database().from('newsletter_subscribers').upsert({email:parsed.data.email.toLowerCase()},{onConflict:'email',ignoreDuplicates:true});check(error);
    return apiSuccess({success:true,message:'You are subscribed to Viraasat updates.'});
  }catch(e){return failure(e);}
}
export async function GET() {
  try {
    if((await identity()).role!=='admin')throw new HttpError(403,'Administrator access required');
    const {data,error}=await database().from('newsletter_subscribers').select('email,created_at').order('created_at',{ascending:false}).limit(100);check(error);
    return apiSuccess({subscribers:data});
  }catch(e){return failure(e);}
}
