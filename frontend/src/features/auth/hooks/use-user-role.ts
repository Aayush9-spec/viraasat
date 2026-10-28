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
      if (typeof window === 'undefined') return;

      const cachedRole = localStorage.getItem(LS_ROLE_KEY) as UserRole | null;
      const metaRole = user?.unsafeMetadata?.role as UserRole | undefined;

      // Priority 1: User's explicitly chosen session role in localStorage takes precedence
      // Priority 2: Clerk metadata role
      // Priority 3: Default to 'buyer' (customer)
      let detectedRole: UserRole = cachedRole || metaRole || 'buyer';

      // Admin Guard: Ensure user has verified with the secret Admin Security Passcode
      if (detectedRole === 'admin') {
        const isAdminVerified = localStorage.getItem('viraasat_admin_verified') === 'true';
        if (!isAdminVerified) {
          detectedRole = 'buyer';
          localStorage.setItem(LS_ROLE_KEY, 'buyer');
        }
      }

      setRole(detectedRole);
      localStorage.setItem(LS_ROLE_KEY, detectedRole);
      if (user?.id) {
        localStorage.setItem(LS_UID_KEY, user.id);
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
    isAdmin: effectiveRole === 'admin',
  };
}
