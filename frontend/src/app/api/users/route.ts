import { NextResponse } from 'next/server';
import { check, database, failure, HttpError, identity, profile } from '@/lib/server/security';
export async function GET() {
  try {
    const user = await identity();
    if (user.role !== 'admin') throw new HttpError(403, 'Administrator access required');
    const { data, error } = await database().from('users').select('id,email,name:display_name,role').limit(100);
    check(error);
    return NextResponse.json(data);
  } catch (e) { return failure(e); }
}
export async function POST() {
  try {
    // Identity, email and role come only from the authenticated provider.
    const data = await profile(await identity());
    return NextResponse.json({ id: data.id, name: data.display_name, email: data.email, role: data.role });
  } catch (e) { return failure(e); }
}
