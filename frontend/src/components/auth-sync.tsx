'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useFirebaseAuth } from '@/context/firebase-auth-context';

const LS_ROLE_KEY = 'viraasat_session_role';
const LS_UID_KEY  = 'viraasat_session_uid';

/**
 * Reads the role from three sources in priority order:
 *   1. Firestore users/{uid}.role  (authoritative — written by backend webhook)
 *   2. Clerk unsafeMetadata.role   (set at sign-up / role-selection)
 *   3. localStorage viraasat_session_role (session cache for offline resilience)
 */
function resolveRole(
  firestoreRole: string | undefined,
  metaRole: string | undefined,
  uid: string,
): string | null {
  const role = firestoreRole || metaRole || localStorage.getItem(LS_ROLE_KEY) || null;
  if (role && localStorage.getItem(LS_UID_KEY) !== uid) {
    // Different user — clear stale cache
    localStorage.removeItem(LS_ROLE_KEY);
    return firestoreRole || metaRole || null;
  }
  return role;
}

export function AuthSync() {
  const { user, isSignedIn, isLoaded } = useUser();
  const firebaseAuth = useFirebaseAuth();
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

      // ─── PATH A: Firebase identity bridge ready — use Firestore ────────────
      if (db && firebaseAuth.ready && firebaseAuth.signedIn) {
        try {
          const userRef = doc(db, 'users', user.id);
          const userSnap = await getDoc(userRef);

          if (userSnap.exists()) {
            const existing = userSnap.data();
            const firestoreRole = existing.role as string | undefined;

            // Resolve final role (never downgrade a role that's already set)
            const role = firestoreRole || metaRole;

            if (role) {
              // Cache role in localStorage for offline resilience
              localStorage.setItem(LS_ROLE_KEY, role);
              localStorage.setItem(LS_UID_KEY, user.id);

              await setDoc(
                userRef,
                {
                  clerkUserId: user.id,
                  uid: user.id,
                  name: name || existing.name,
                  email: email || existing.email,
                  imageUrl: imageUrl || existing.imageUrl,
                  role,
                  updatedAt: now,
                  lastLogin: now,
                },
                { merge: true },
              );
            } else {
              // Document exists but role is missing everywhere → role selection
              if (
                pathname !== '/select-role' &&
                !pathname.startsWith('/login') &&
                !pathname.startsWith('/signup')
              ) {
                router.push('/select-role');
              }
            }
          } else {
            // No Firestore doc yet (webhook hasn't fired)
            const role = metaRole;
            if (role === 'artisan' || role === 'buyer') {
              localStorage.setItem(LS_ROLE_KEY, role);
              localStorage.setItem(LS_UID_KEY, user.id);
              await setDoc(userRef, {
                clerkUserId: user.id,
                uid: user.id,
                name,
                email,
                imageUrl,
                role,
                createdAt: now,
                updatedAt: now,
                lastLogin: now,
              });
            } else if (
              pathname !== '/select-role' &&
              !pathname.startsWith('/login') &&
              !pathname.startsWith('/signup')
            ) {
              router.push('/select-role');
            }
          }
        } catch (error) {
          console.error('[AuthSync] Firestore write error:', error);
        }
        return;
      }

      // ─── PATH B: Firebase not configured / identity bridge failed ──────────
      // Fall back to Clerk unsafeMetadata + localStorage so the session still
      // works without a Firebase service account.
      if (firebaseAuth.ready && !firebaseAuth.signedIn) {
        const cachedRole = localStorage.getItem(LS_ROLE_KEY);
        const cachedUid  = localStorage.getItem(LS_UID_KEY);

        // If metaRole is set, cache it for this session
        if (metaRole === 'artisan' || metaRole === 'buyer') {
          if (cachedUid !== user.id) {
            // New user — refresh cache
            localStorage.setItem(LS_ROLE_KEY, metaRole);
            localStorage.setItem(LS_UID_KEY, user.id);
          }
          // Role is available — no redirect needed; protected pages use
          // unsafeMetadata fallback in ProtectedRoute.
          return;
        }

        // No role in metadata — check localStorage cache
        if (cachedRole && cachedUid === user.id) {
          return; // Role is cached from a previous session
        }

        // Truly no role — redirect to role selection
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
  }, [user, isSignedIn, isLoaded, pathname, router, firebaseAuth.ready, firebaseAuth.signedIn]);

  return null;
}
