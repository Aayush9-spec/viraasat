'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { getUser } from '@/lib/firebase/users';
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
    const cachedRole = typeof window !== 'undefined' ? (localStorage.getItem(LS_ROLE_KEY) as UserRole | null) : null;
    const cachedUid  = typeof window !== 'undefined' ? localStorage.getItem(LS_UID_KEY) : null;
    const metaRole = user?.unsafeMetadata?.role as UserRole | undefined;

    // Fast path: only use cache if signed in AND cache belongs to this user
    const ownCachedRole = (isSignedIn && user && cachedUid === user.id) ? cachedRole : null;
    const resolvedFastRole = metaRole || ownCachedRole;

    if (resolvedFastRole) {
      setRole(resolvedFastRole);
      setLoading(false);
    }

    if (!isLoaded) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, 800);
      return () => clearTimeout(timer);
    }

    if (!isSignedIn || !user) {
      // Not signed in — no role, clear stale cache
      if (typeof window !== 'undefined') {
        localStorage.removeItem(LS_ROLE_KEY);
        localStorage.removeItem(LS_UID_KEY);
      }
      setRole(null);
      setLoading(false);
      return;
    }

    async function fetchRole() {
      try {
        const userDocPromise = getUser(user!.id);
        const timeoutPromise = new Promise<null>((res) => setTimeout(() => res(null), 1500));
        const userDoc = await Promise.race([userDocPromise, timeoutPromise]);
        const firestoreRole = userDoc?.role ?? null;

        const resolvedRole = firestoreRole || metaRole || ownCachedRole;
        if (resolvedRole && typeof window !== 'undefined') {
          localStorage.setItem(LS_ROLE_KEY, resolvedRole);
          localStorage.setItem(LS_UID_KEY, user!.id);
          setRole(resolvedRole);
        }
      } catch {
        // Keep fast-path role if already set
      } finally {
        setLoading(false);
      }
    }

    fetchRole();
  }, [isLoaded, isSignedIn, user]);

  // Role for the current signed-in user only — never inferred from URL path
  const effectiveRole: UserRole = role || 'buyer';
  return { role: effectiveRole, loading, isBuyer: effectiveRole === 'buyer', isArtisan: effectiveRole === 'artisan' };
}

