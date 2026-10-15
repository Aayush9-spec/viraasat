import 'server-only';
import type { User } from '@/types/user';

/**
 * Privileged server user access stub.
 * Users are managed via Clerk and Supabase.
 */
export async function getServerUser(_clerkUserId: string): Promise<User | null> {
  return null;
}
