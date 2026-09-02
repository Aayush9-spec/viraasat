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

      try {
        const userDoc = await getUser(user.id);
        const role = userDoc?.role || (user.unsafeMetadata?.role as UserRole);

        if (!role) {
          router.push('/select-role');
          return;
        }

        const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        if (!rolesArray.includes(role)) {
          // Redirect unauthorized user to their own dashboard
          if (role === 'artisan') {
            router.push('/artisan/dashboard');
          } else {
            router.push('/dashboard');
          }
          return;
        }

        setIsAuthorized(true);
      } catch (err) {
        console.error('Error verifying route protection:', err);
      } finally {
        setCheckingAuth(false);
      }
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
