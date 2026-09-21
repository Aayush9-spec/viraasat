import { supabase } from '@/services/supabase';
import { User, UserRole } from '@/types/user';

export async function getUser(clerkUserId: string): Promise<User | null> {
  if (!clerkUserId) return null;

  // maybeSingle() returns null data (not an error) when no row is found,
  // and never throws on "not found" — safe with both RLS and missing rows.
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', clerkUserId)
    .maybeSingle();

  if (error) {
    // Log but don't crash — role falls back to Clerk metadata
    console.warn(`[getUser] Supabase error for ${clerkUserId}:`, error.message ?? error);
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    clerkUserId: data.id,
    uid: data.id,
    name: data.display_name ?? '',
    email: data.email,
    imageUrl: data.avatar_url ?? '',
    role: data.role as UserRole,
    cart: [],
    createdAt: data.created_at,
    updatedAt: data.created_at,
    lastLogin: data.created_at,
  };
}

export async function userExists(clerkUserId: string): Promise<boolean> {
  if (!clerkUserId) return false;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('id', clerkUserId)
      .single();

    if (error) return false;
    return !!data;
  } catch {
    return false;
  }
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

  // Realtime subscription
  const channel = supabase
    .channel(`user-${clerkUserId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'users', filter: `id=eq.${clerkUserId}` },
      async () => {
        const user = await getUser(clerkUserId);
        onChange(user);
      },
    )
    .subscribe((status, err) => {
      if (err) onError?.(err);
    });

  return () => { void supabase.removeChannel(channel); };
}
