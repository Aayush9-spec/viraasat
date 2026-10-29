'use client';
import { useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
export function AuthSync() {
  const { user, isSignedIn, isLoaded } = useUser();
  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !user) {
      localStorage.removeItem('viraasat_session_role');
      localStorage.removeItem('viraasat_session_uid');
      localStorage.removeItem('viraasat_demo_user');
      return;
    }
    // Display caches are not authority. Server APIs use the signed session.
    localStorage.setItem('viraasat_session_role', String(user.publicMetadata?.role || 'buyer'));
    localStorage.setItem('viraasat_session_uid', user.id);
    void fetch('/api/users', { method: 'POST' }).catch(() => {});
  }, [user, isSignedIn, isLoaded]);
  return null;
}
