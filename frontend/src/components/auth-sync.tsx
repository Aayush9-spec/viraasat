'use client';

import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { db } from '@/lib/firebase/client';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export function AuthSync() {
  const { user, isSignedIn, isLoaded } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    async function syncUser() {
      if (!isLoaded || !isSignedIn || !user || !db) return;

      try {
        const userRef = doc(db, 'users', user.id);
        const userSnap = await getDoc(userRef);

        const now = new Date().toISOString();
        const name = user.fullName || user.username || user.primaryEmailAddress?.emailAddress || 'User';
        const email = user.primaryEmailAddress?.emailAddress || '';
        const imageUrl = user.imageUrl || '';

        if (userSnap.exists()) {
          const existingData = userSnap.data();
          const existingRole = existingData.role;

          if (existingRole) {
            // Keep existing role! NEVER overwrite role if already present.
            await setDoc(
              userRef,
              {
                clerkUserId: user.id,
                uid: user.id,
                name: name || existingData.name,
                email: email || existingData.email,
                imageUrl: imageUrl || existingData.imageUrl,
                role: existingRole,
                updatedAt: now,
                lastLogin: now,
              },
              { merge: true }
            );
          } else {
            // Document exists but role is not set
            const metaRole = user.unsafeMetadata?.role as string | undefined;
            if (metaRole === 'artisan' || metaRole === 'buyer') {
              await setDoc(
                userRef,
                {
                  clerkUserId: user.id,
                  uid: user.id,
                  name,
                  email,
                  imageUrl,
                  role: metaRole,
                  updatedAt: now,
                  lastLogin: now,
                },
                { merge: true }
              );
            } else {
              // Missing role - redirect to role selection screen if not already there
              if (pathname !== '/select-role' && !pathname.startsWith('/login') && !pathname.startsWith('/signup')) {
                router.push('/select-role');
              }
            }
          }
        } else {
          // Document does not exist in Firestore yet
          const metaRole = user.unsafeMetadata?.role as string | undefined;
          if (metaRole === 'artisan' || metaRole === 'buyer') {
            await setDoc(userRef, {
              clerkUserId: user.id,
              uid: user.id,
              name,
              email,
              imageUrl,
              role: metaRole,
              createdAt: now,
              updatedAt: now,
              lastLogin: now,
            });
          } else {
            // Role missing for new user - redirect to role selection
            if (pathname !== '/select-role' && !pathname.startsWith('/login') && !pathname.startsWith('/signup')) {
              router.push('/select-role');
            }
          }
        }
      } catch (error) {
        console.error('Error syncing user with Firestore:', error);
      }
    }

    syncUser();
  }, [user, isSignedIn, isLoaded, pathname, router]);

  return null;
}
