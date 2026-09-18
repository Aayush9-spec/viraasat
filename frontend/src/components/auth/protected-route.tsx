'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter, usePathname } from 'next/navigation';
import { getUser } from '@/lib/firebase/users';
import { UserRole } from '@/types/user';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  allowedRoles: UserRole | UserRole[];
  children: React.ReactNode;
}

export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    async function checkUserAuthorization() {
      if (!isLoaded) return;

      if (!isSignedIn || !user) {
        router.push(`/login?redirectUrl=${encodeURIComponent(pathname)}`);
        return;
      }

      // Resolve role: Firestore is the source of truth; fall back to Clerk
      // unsafeMetadata so dashboards never blank-out when Firestore is offline.
      let role: UserRole | null = null;

      try {
        const userDoc = await getUser(user.id);
        role = userDoc?.role ?? (user.unsafeMetadata?.role as UserRole) ?? null;
      } catch (err) {
        // Firestore unavailable — degrade gracefully using the role stored
        // in Clerk's unsafeMetadata (set at sign-up / role-selection time).
        console.warn('ProtectedRoute: Firestore unavailable, falling back to unsafeMetadata.role', err);
        role = (user.unsafeMetadata?.role as UserRole) ?? null;
      }

      if (!role) {
        // No role anywhere — send to role selection
        router.push('/select-role');
        setCheckingAuth(false);
        return;
      }

      const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

      if (!rolesArray.includes(role)) {
        // Redirect the user to their own dashboard
        router.push(role === 'artisan' ? '/artisan/dashboard' : '/dashboard');
        setCheckingAuth(false);
        return;
      }

      setIsAuthorized(true);
      setCheckingAuth(false);
    }

    checkUserAuthorization();
  }, [isLoaded, isSignedIn, user, allowedRoles, router, pathname]);

  if (!isLoaded || checkingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Verifying security permissions...</p>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
