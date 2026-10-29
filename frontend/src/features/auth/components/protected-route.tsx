'use client';
import { useUser } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { UserRole } from '@/types/user';
export function ProtectedRoute({ allowedRoles, children }: { allowedRoles: UserRole | UserRole[]; children: React.ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const role = (user?.publicMetadata?.role || 'buyer') as UserRole;
  const authorized = Boolean(isSignedIn && (Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]).includes(role));
  useEffect(() => {
    if (isLoaded && !isSignedIn) router.replace(`/login?redirectUrl=${encodeURIComponent(pathname)}`);
  }, [isLoaded, isSignedIn, pathname, router]);
  if (!isLoaded) return <p role="status">Checking your session…</p>;
  if (!authorized) return <p role="alert">You do not have access to this page.</p>;
  return <>{children}</>;
}
