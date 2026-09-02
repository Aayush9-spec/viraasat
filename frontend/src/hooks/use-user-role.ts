'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { getUser } from '@/lib/firebase/users';
import { UserRole } from '@/types/user';

export function useUserRole() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRole() {
      if (!isLoaded) return;

      if (!isSignedIn || !user) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const userDoc = await getUser(user.id);
        const fetchedRole = userDoc?.role || (user.unsafeMetadata?.role as UserRole) || null;
        setRole(fetchedRole);
      } catch (err) {
        console.error('Error in useUserRole:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRole();
  }, [isLoaded, isSignedIn, user]);

  return { role, loading, isBuyer: role === 'buyer', isArtisan: role === 'artisan' };
}
