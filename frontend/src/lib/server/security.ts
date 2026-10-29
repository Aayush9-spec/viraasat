import 'server-only';
import { currentUser } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function identity() {
  const user = await currentUser();
  if (!user) throw new HttpError(401, 'Sign in required');
  const email = user.primaryEmailAddress;
  if (!email || email.verification?.status !== 'verified') throw new HttpError(403, 'Verify your email first');
  return { id: user.id, email: email.emailAddress.toLowerCase(), name: user.fullName || user.username || 'Customer', role: String(user.publicMetadata?.role || 'buyer') };
}
export function database() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new HttpError(503, 'Storage is temporarily unavailable');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
export function failure(error: unknown) {
  if (error instanceof HttpError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error('Server operation failed');
  return NextResponse.json({ error: 'Operation failed. Please retry later.' }, { status: 503 });
}
export function check(error: unknown) { if (error) throw new HttpError(503, 'Storage operation failed'); }
export async function profile(user: Awaited<ReturnType<typeof identity>>) {
  const db = database();
  const { data: existing, error: lookup } = await db.from('users').select('id,email,display_name,role').eq('clerk_user_id', user.id).maybeSingle();
  check(lookup);
  if (existing) {
    if (existing.role !== user.role) {
      const { error } = await db.from('users').update({ role: user.role }).eq('id', existing.id);
      check(error);
    }
    return { ...existing, role: user.role };
  }
  const { data, error } = await db.from('users').upsert({ clerk_user_id: user.id, email: user.email, display_name: user.name, role: user.role }, { onConflict: 'clerk_user_id', ignoreDuplicates: true }).select('id,email,display_name,role').maybeSingle();
  check(error);
  if (!data) throw new HttpError(409, 'Profile initialization is in progress; retry');
  return data;
}
