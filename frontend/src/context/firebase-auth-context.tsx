'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useUser } from '@clerk/nextjs';
import { signOut, signInWithCustomToken } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth as firebaseAuth } from '@/services/firebase/auth';
import { db } from '@/services/firebase/firestore';

interface FirebaseAuthState {
  /** True once the exchange attempt finished (success, skipped, or failed). */
  ready: boolean;
  /** True when a Firebase user bound to the current Clerk session exists. */
  signedIn: boolean;
}

const FirebaseAuthContext = createContext<FirebaseAuthState>({
  ready: false,
  signedIn: false,
});

async function exchangeToken(): Promise<void> {
  const res = await fetch('/api/auth/firebase-token', { method: 'POST' });
  if (!res.ok) {
    throw new Error(`Identity bridge failed with status ${res.status}`);
  }
  const data = await res.json();
  if (typeof data?.token !== 'string' || data.token.length === 0) {
    throw new Error('Identity bridge returned no token');
  }
  if (!firebaseAuth) {
    throw new Error('Firebase Auth is not configured');
  }
  await signInWithCustomToken(firebaseAuth, data.token);
}

export function FirebaseAuthProvider({ children }: { children: ReactNode }) {
  const { user, isSignedIn, isLoaded } = useUser();
  const [state, setState] = useState<FirebaseAuthState>({
    ready: false,
    signedIn: false,
  });
  const exchanging = useRef(false);

  const mint = useCallback(async () => {
    if (exchanging.current) return;
    exchanging.current = true;
    try {
      await exchangeToken();
      setState({ ready: true, signedIn: true });
    } catch (error) {
      console.warn(
        'Firebase identity bridge failed; Firestore writes will be denied until fixed.',
        error,
      );
      setState({ ready: true, signedIn: false });
    } finally {
      exchanging.current = false;
    }
  }, []);

  // Core exchange: bind the Clerk session to a Firebase custom token.
  useEffect(() => {
    if (!isLoaded) return;
    let cancelled = false;

    async function run() {
      if (!isSignedIn || !user) {
        if (firebaseAuth?.currentUser) {
          await signOut(firebaseAuth);
        }
        if (!cancelled) {
          setState({ ready: true, signedIn: false });
        }
        return;
      }
      await mint();
    }

    void run();
    return () => {
      cancelled = true;
    };
  }, [isLoaded, isSignedIn, user, mint]);

  // Re-mint when the Firestore role changes so `request.auth.token.role` in
  // the security rules is never stale (e.g. right after selecting a role).
  useEffect(() => {
    if (!state.ready || !state.signedIn || !user) return;
    let cancelled = false;
    const roleRef = doc(db, 'users', user.id);

    const unsubscribe = onSnapshot(
      roleRef,
      (snap) => {
        if (cancelled) return;
        const role = snap.data()?.role;
        if (!role || !firebaseAuth?.currentUser) return;
        firebaseAuth.currentUser
          .getIdTokenResult()
          .then((result) => {
            if (result.claims.role !== role) {
              void mint();
            }
          })
          .catch(() => {});
      },
      () => {
        // Ignore read failures; the fallback exchange in `mint` and Clerk
        // metadata role already cover the common cases.
      },
    );

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [state.ready, state.signedIn, user, mint]);

  return (
    <FirebaseAuthContext.Provider value={state}>
      {children}
    </FirebaseAuthContext.Provider>
  );
}

export function useFirebaseAuth(): FirebaseAuthState {
  return useContext(FirebaseAuthContext);
}