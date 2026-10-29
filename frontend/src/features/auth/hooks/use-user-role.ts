'use client';
import { useUser } from '@clerk/nextjs';
import type { UserRole } from '@/types/user';
export function useUserRole() {
  const { isLoaded, isSignedIn, user } = useUser();
  const trusted = isSignedIn ? user?.publicMetadata?.role : undefined;
  const role: UserRole = trusted === 'admin' || trusted === 'artisan' ? trusted : 'buyer';
  return { role, loading: !isLoaded, isBuyer: role === 'buyer', isArtisan: role === 'artisan', isAdmin: role === 'admin' };
}
