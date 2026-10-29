import { database, check, failure } from '@/lib/server/security';
import { apiSuccess } from '@/core/api/api-response';
export async function GET(req: Request) {
  try {
    let query = database().from('users').select('id,display_name,bio,avatar_url,region').eq('role','artisan');
    const id = new URL(req.url).searchParams.get('id');
    if(id)query=query.eq('id',id);
    const {data,error}=await query.limit(100);check(error);
    const artisans=(data||[]).map(u=>({id:u.id,name:u.display_name,bio:u.bio,avatarUrl:u.avatar_url,region:u.region||'India'}));
    return apiSuccess({artisans,count:artisans.length});
  }catch(e){return failure(e);}
}
