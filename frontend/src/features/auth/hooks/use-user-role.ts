'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { UserRole } from '@/types/user';

const LS_ROLE_KEY = 'viraasat_session_role';
const LS_UID_KEY  = 'viraasat_session_uid';

export function useUserRole() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [role, setRole] = useState<UserRole | null>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(LS_ROLE_KEY) as UserRole | null;
      if (cached) return cached;
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const syncRole = async () => {
      const cachedRole = typeof window !== 'undefined' ? (localStorage.getItem(LS_ROLE_KEY) as UserRole | null) : null;
      const metaRole = user?.unsafeMetadata?.role as UserRole | undefined;
      const userEmail = user?.primaryEmailAddress?.emailAddress?.toLowerCase();

      // Priority 1: Explicit artisan role from local session or Clerk metadata
      let detectedRole: UserRole | null = null;
      if (cachedRole === 'artisan' || metaRole === 'artisan') {
        detectedRole = 'artisan';
      } else if (metaRole) {
        detectedRole = metaRole;
      } else if (cachedRole) {
        detectedRole = cachedRole;
      }

      // Priority 2: Check database/users.json via /api/users for verified artisan email
      if ((!detectedRole || detectedRole === 'buyer') && userEmail) {
        try {
          const res = await fetch('/api/users');
          if (res.ok) {
            const users = await res.json();
             
            const matched = users.find((u: any) => u.email?.toLowerCase() === userEmail);
            if (matched?.role === 'artisan') {
              detectedRole = 'artisan';
            }
          }
        } catch {
          // ignore network failure
        }
      }

      if (detectedRole) {
        setRole(detectedRole);
        if (typeof window !== 'undefined') {
          localStorage.setItem(LS_ROLE_KEY, detectedRole);
          if (user?.id) localStorage.setItem(LS_UID_KEY, user.id);
        }

        // Align Clerk's unsafeMetadata so server-side checks and future sessions match
        if (user && typeof user.update === 'function' && user.unsafeMetadata?.role !== detectedRole) {
          try {
            await user.update({
              unsafeMetadata: {
                ...user.unsafeMetadata,
                role: detectedRole,
              },
            });
          } catch {
            // non-fatal
          }
        }
        setLoading(false);
      } else {
        if (!isLoaded) {
          return;
        }
        setRole(null);
        setLoading(false);
      }
    };

    syncRole();

    window.addEventListener('storage', syncRole);
    window.addEventListener('viraasat_auth_change', syncRole);
    return () => {
      window.removeEventListener('storage', syncRole);
      window.removeEventListener('viraasat_auth_change', syncRole);
    };
  }, [isLoaded, isSignedIn, user]);

  const effectiveRole: UserRole = role || 'buyer';
  return {
    role: effectiveRole,
    loading,
    isBuyer: effectiveRole === 'buyer',
    isArtisan: effectiveRole === 'artisan',
  };
}
