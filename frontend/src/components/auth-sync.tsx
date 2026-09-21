'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '@/services/supabase';

const LS_ROLE_KEY = 'viraasat_session_role';
const LS_UID_KEY  = 'viraasat_session_uid';

export function AuthSync() {
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function syncUser() {
      if (!isLoaded || !isSignedIn || !user) return;

      const now = new Date().toISOString();
      const name =
        user.fullName || user.username || user.primaryEmailAddress?.emailAddress || 'User';
      const email = user.primaryEmailAddress?.emailAddress || '';
      const imageUrl = user.imageUrl || '';
      const metaRole = user.unsafeMetadata?.role as string | undefined;

      try {
        // Check if user row already exists (PGRST116 = not found, that's fine)
        const { data: existing } = await supabase
          .from('users')
          .select('id, role')
          .eq('id', user.id)
          .maybeSingle();

        // Resolve role — never downgrade an existing role
        const supabaseRole = existing?.role as string | undefined;
        const role = supabaseRole || metaRole || localStorage.getItem(LS_ROLE_KEY) || null;

        if (role) {
          localStorage.setItem(LS_ROLE_KEY, role);
          localStorage.setItem(LS_UID_KEY, user.id);

          await supabase.from('users').upsert({
            id: user.id,
            email,
            display_name: name,
            avatar_url: imageUrl,
            role,
          });
        } else {
          // No role anywhere — redirect to role selection
          if (
            pathname !== '/select-role' &&
            !pathname.startsWith('/login') &&
            !pathname.startsWith('/signup')
          ) {
            router.push('/select-role');
          }
        }
      } catch (error) {
        console.error('[AuthSync] Supabase sync error:', error);

        // Fallback: use Clerk metadata + localStorage so the session still works
        const cachedRole = localStorage.getItem(LS_ROLE_KEY);
        const cachedUid  = localStorage.getItem(LS_UID_KEY);

        if (metaRole === 'artisan' || metaRole === 'buyer') {
          if (cachedUid !== user.id) {
            localStorage.setItem(LS_ROLE_KEY, metaRole);
            localStorage.setItem(LS_UID_KEY, user.id);
          }
          return;
        }

        if (cachedRole && cachedUid === user.id) return;

        if (
          pathname !== '/select-role' &&
          !pathname.startsWith('/login') &&
          !pathname.startsWith('/signup')
        ) {
          router.push('/select-role');
        }
      }
    }

    syncUser();
  }, [user, isSignedIn, isLoaded, pathname, router]);

  return null;
}
