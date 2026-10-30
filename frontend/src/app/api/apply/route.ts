import crypto from 'node:crypto';
import { z } from 'zod';
import { apiSuccess } from '@/core/api/api-response';
import { database, identity, check, failure, HttpError } from '@/lib/server/security';
const form=z.object({fullName:z.string().trim().min(1).max(200),workshopName:z.string().trim().max(200).optional(),phone:z.string().trim().max(30).default(''),pincode:z.string().regex(/^\d{6}$/),state:z.string().trim().min(1).max(100),craft:z.string().trim().min(1).max(200),portfolioImages:z.array(z.string().max(1400000).regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/)).max(3).default([])});
export async function POST(req: Request) {
  try {
    const user=await identity();
    const parsed=form.safeParse(await req.json());
    if(!parsed.success)throw new HttpError(400,'Complete the application and use up to three PNG, JPEG or WebP images, at most 1 MB each');
    const input=parsed.data;
    const db=database();const images:string[]=[];
    for(const image of input.portfolioImages) {
      const [header,data]=image.split(',');const bytes=Buffer.from(data,'base64');
      if(bytes.length>1024*1024)throw new HttpError(400,'Portfolio images must be at most 1 MB');
      const mime=header.slice(5,header.indexOf(';'));const key=`applications/${user.id}/${crypto.randomUUID()}.${mime.split('/')[1]}`;
      const upload=await db.storage.from('product-images').upload(key,bytes,{contentType:mime,upsert:false});check(upload.error);
      images.push(db.storage.from('product-images').getPublicUrl(key).data.publicUrl);
    }
    const {data,error}=await db.from('artisan_applications').insert({applicant_id:user.id,full_name:input.fullName,workshop_name:input.workshopName || input.fullName,email:user.email,phone:input.phone,pincode:input.pincode,state:input.state,craft:input.craft,portfolio_images:images,status:'pending'}).select('id').single();check(error);
    return apiSuccess({success:true,application:data});
  }catch(e){return failure(e);}
}
export async function GET() {
  try {
    if((await identity()).role!=='admin')throw new HttpError(403,'Administrator access required');
    const {data,error}=await database().from('artisan_applications').select('*').order('created_at',{ascending:false}).limit(100);check(error);
    return apiSuccess({applications:data || []});
  }catch(e){return failure(e);}
}
