import { User, UserRole } from '@/types/user';

export async function getUser(clerkUserId: string): Promise<User | null> {
  if (!clerkUserId) return null;

  const response = await fetch(`/api/users/${encodeURIComponent(clerkUserId)}`, { cache: 'no-store' });
  if (!response.ok) return null;
  const data = await response.json();
  return { id: data.id, clerkUserId, uid: clerkUserId, name: data.name || '', email: data.email,
    role: data.role as UserRole, imageUrl: '', cart: [], createdAt: data.createdAt, updatedAt: data.updatedAt, lastLogin: data.updatedAt };

}

export async function userExists(clerkUserId: string): Promise<boolean> {
  return Boolean(await getUser(clerkUserId));
}

/**
 * Subscribe to a user's Supabase row. Used by the role-selection flow
 * to wait for the freshly-picked role before redirecting.
 */
export function watchUser(
  clerkUserId: string,
  onChange: (user: User | null) => void,
  onError?: (err: Error) => void,
): () => void {
  if (!clerkUserId) return () => {};

  // Initial fetch
  getUser(clerkUserId).then(onChange).catch((e) => onError?.(e instanceof Error ? e : new Error(String(e))));

  const refresh = () => { getUser(clerkUserId).then(onChange).catch(onError); };
  window.addEventListener('focus', refresh);
  return () => window.removeEventListener('focus', refresh);
}
