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
    const metaRole = user?.unsafeMetadata?.role as UserRole | undefined;
    const isArtisanPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/artisan');
    const resolvedFastRole = metaRole || cachedRole || (isArtisanPath ? 'artisan' : null);

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
      if (cachedRole) {
        setRole(cachedRole);
      } else if (isArtisanPath) {
        setRole('artisan');
      } else {
        setRole(null);
      }
      setLoading(false);
      return;
    }

    async function fetchRole() {
      try {
        const userDocPromise = getUser(user!.id);
        const timeoutPromise = new Promise<null>((res) => setTimeout(() => res(null), 1500));
        const userDoc = await Promise.race([userDocPromise, timeoutPromise]);
        const firestoreRole = userDoc?.role ?? null;

        const resolvedRole = firestoreRole || metaRole || cachedRole || (isArtisanPath ? 'artisan' : null);
        if (resolvedRole && typeof window !== 'undefined') {
          localStorage.setItem(LS_ROLE_KEY, resolvedRole);
          localStorage.setItem(LS_UID_KEY, user!.id);
          setRole(resolvedRole);
        }
      } catch {
        // Fallback role already set above
      } finally {
        setLoading(false);
      }
    }

    fetchRole();
  }, [isLoaded, isSignedIn, user]);

  return { role: role || 'artisan', loading, isBuyer: role === 'buyer', isArtisan: role !== 'buyer' };
}

