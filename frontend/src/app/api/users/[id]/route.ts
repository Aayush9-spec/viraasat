import { NextResponse } from 'next/server';
import { z } from 'zod';
import { check, database, failure, HttpError, identity, profile } from '@/lib/server/security';
type Context = { params: Promise<{ id: string }> };
async function authorized(context: Context) {
  const user = await identity();
  const own = await profile(user);
  const { id } = await context.params;
  const target = id === user.id ? own.id : id;
  if (target !== own.id && user.role !== 'admin') throw new HttpError(403, 'Not your profile');
  if (!z.string().uuid().safeParse(target).success) throw new HttpError(400, 'Invalid profile ID');
  return target;
}
export async function GET(_req: Request, context: Context) {
  try {
    const id = await authorized(context);
    const { data, error } = await database().from('users').select('id,email,name:display_name,role,bio,avatar_url,region').eq('id', id).maybeSingle();
    check(error);
    if (!data) throw new HttpError(404, 'User not found');
    return NextResponse.json(data);
  } catch (e) { return failure(e); }
}
export async function PATCH(req: Request, context: Context) {
  try {
    const id = await authorized(context);
    const parsed = z.object({ name: z.string().trim().min(1).max(200).optional(), bio: z.string().max(5000).optional(), avatarUrl: z.string().url().startsWith('https://').optional(), region: z.string().max(200).optional() }).strict().refine(v => Object.keys(v).length > 0).safeParse(await req.json());
    if (!parsed.success) throw new HttpError(400, 'Only public profile fields can be updated here');
    const { data, error } = await database().from('users').update(Object.fromEntries(Object.entries({ display_name: parsed.data.name, bio: parsed.data.bio, avatar_url: parsed.data.avatarUrl, region: parsed.data.region }).filter(([,value]) => value !== undefined))).eq('id', id).select('id,email,name:display_name,role,bio,avatar_url,region').single();
    check(error);
    return NextResponse.json(data);
  } catch (e) { return failure(e); }
}
export async function DELETE(_req: Request, context: Context) {
  try {
    const id = await authorized(context);
    const { data, error } = await database().from('users').delete().eq('id', id).select('id').maybeSingle();
    check(error);
    if (!data) throw new HttpError(404, 'User not found');
    return NextResponse.json({ success: true });
  } catch (e) { return failure(e); }
}
