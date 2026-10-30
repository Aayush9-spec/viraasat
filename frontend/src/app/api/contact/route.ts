import { NextResponse } from 'next/server';
import { z } from 'zod';
import { database, identity, check, failure, HttpError } from '@/lib/server/security';
export async function POST(req: Request) {
  try {
    const user = await identity();
    const parsed = z.object({name:z.string().trim().min(1).max(200),topic:z.string().trim().min(1).max(200),message:z.string().trim().min(10).max(10000)}).safeParse(await req.json());
    if(!parsed.success)throw new HttpError(400,'Please provide a name, topic and message of at least 10 characters');
    const {error} = await database().from('contact_messages').insert({...parsed.data,user_id:user.id,email:user.email});check(error);
    return NextResponse.json({success:true});
  } catch(e) {return failure(e);}
}
