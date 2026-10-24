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

      const name =
        user.fullName || user.username || user.primaryEmailAddress?.emailAddress?.split('@')[0] || 'Customer';
      const email = user.primaryEmailAddress?.emailAddress || '';
      const imageUrl = user.imageUrl || '';
      const metaRole = user.unsafeMetadata?.role as string | undefined;

      try {
        const cachedRole = typeof window !== 'undefined' ? localStorage.getItem(LS_ROLE_KEY) : null;
        
        // Active chosen session role in localStorage takes precedence, followed by Clerk metadata, then 'buyer'
        const role = (cachedRole || metaRole || 'buyer') as string;

        localStorage.setItem(LS_ROLE_KEY, role);
        localStorage.setItem(LS_UID_KEY, user.id);
        localStorage.setItem(
          'viraasat_demo_user',
          JSON.stringify({
            id: user.id,
            name,
            email,
            role,
          })
        );
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('viraasat_auth_change'));

        if (user && typeof user.update === 'function' && user.unsafeMetadata?.role !== role) {
          user.update({
            unsafeMetadata: {
              ...user.unsafeMetadata,
              role,
            },
          }).catch(() => {});
        }

        // Attempt Supabase sync non-fatally with email conflict resolution
        if (email) {
          await supabase.from('users').upsert(
            {
              email: email.toLowerCase(),
              display_name: name,
              avatar_url: imageUrl,
              role,
            },
            { onConflict: 'email' }
          );
        }
      } catch (error) {
        // Fallback when Supabase is unconfigured or network is unavailable
        const cachedRole = (typeof window !== 'undefined' ? localStorage.getItem(LS_ROLE_KEY) : null) || metaRole || 'buyer';
        localStorage.setItem(LS_ROLE_KEY, cachedRole);
        localStorage.setItem(LS_UID_KEY, user.id);
        localStorage.setItem(
          'viraasat_demo_user',
          JSON.stringify({
            id: user.id,
            name,
            email,
            role: cachedRole,
          })
        );
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('viraasat_auth_change'));
      }
    }

    syncUser();
  }, [user, isSignedIn, isLoaded, pathname, router]);

  return null;
}
