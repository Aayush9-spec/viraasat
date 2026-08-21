'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { db } from '@/services/firebase/firestore';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export function AuthSync() {
  const { user, isSignedIn } = useUser();

  useEffect(() => {
    async function syncUser() {
      if (!isSignedIn || !user || !db) return;

      try {
        const userRef = doc(db, 'users', user.id);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          const role = user.unsafeMetadata?.role || 'buyer';
          await setDoc(userRef, {
            uid: user.id,
            name: user.fullName || user.username || 'Anonymous',
            email: user.primaryEmailAddress?.emailAddress || '',
            role: role,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
          console.log(`Synced new user ${user.id} with role: ${role}`);
        }
      } catch (error) {
        console.error('Error syncing user with Firestore:', error);
      }
    }

    syncUser();
  }, [user, isSignedIn]);

  return null;
}
