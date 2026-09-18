'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { getUser } from '@/lib/firebase/users';
import { UserRole } from '@/types/user';

const LS_ROLE_KEY = 'viraasat_session_role';
const LS_UID_KEY  = 'viraasat_session_uid';

/**
 * Resolves the current user's role from (in priority order):
 *  1. Firestore users/{uid}.role   — set by backend webhook; authoritative
 *  2. Clerk unsafeMetadata.role    — set at sign-up / role-selection; instant
 *  3. localStorage cache           — survives Firestore being offline
 *
 * Never blocks the UI: loading is false as soon as any source resolves.
 */
export function useUserRole() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !user) {
      setRole(null);
      setLoading(false);
      return;
    }

    async function fetchRole() {
      // Fast path: Clerk metadata is available synchronously
      const metaRole = user!.unsafeMetadata?.role as UserRole | undefined;
      const cachedRole = localStorage.getItem(LS_ROLE_KEY) as UserRole | null;
      const cachedUid  = localStorage.getItem(LS_UID_KEY);

      // Seed the state immediately so the UI doesn't flash a spinner
      const fastRole =
        metaRole ||
        (cachedUid === user!.id ? cachedRole : null) ||
        null;

      if (fastRole) {
        setRole(fastRole);
        setLoading(false);
      }

      // Slow path: confirm with Firestore (may override fast path)
      try {
        const userDoc = await getUser(user!.id);
        const firestoreRole = userDoc?.role ?? null;

        const resolvedRole = firestoreRole || metaRole || (cachedUid === user!.id ? cachedRole : null) || null;
        if (resolvedRole) {
          // Keep localStorage in sync
          localStorage.setItem(LS_ROLE_KEY, resolvedRole);
          localStorage.setItem(LS_UID_KEY, user!.id);
          setRole(resolvedRole);
        }
      } catch {
        // Firestore offline — fast path result is already set above
      } finally {
        setLoading(false);
      }
    }

    fetchRole();
  }, [isLoaded, isSignedIn, user]);

  return { role, loading, isBuyer: role === 'buyer', isArtisan: role === 'artisan' };
}
