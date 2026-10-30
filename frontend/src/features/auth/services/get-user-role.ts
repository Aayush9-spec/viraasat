import 'server-only';
import {currentUser} from '@clerk/nextjs/server';
import type {UserRole} from '@/types/user';
export async function getUserRole():Promise<UserRole|null> {
  const user=await currentUser();
  if(!user)return null;
  const role=user.publicMetadata?.role;
  return role==='admin'||role==='artisan'?role:'buyer';
}
