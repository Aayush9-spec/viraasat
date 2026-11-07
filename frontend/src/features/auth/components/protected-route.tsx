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
  const [clerkLoaded, setClerkLoaded] = useState(false);

  // Fallback timer: If Clerk's useUser().isLoaded takes >1.5s (e.g. script error or missing env vars on Vercel),
  // force clerkLoaded to true so we never freeze the UI permanently.
  useEffect(() => {
    if (isLoaded) {
      setClerkLoaded(true);
      return;
    }
    const timer = setTimeout(() => {
      setClerkLoaded(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, [isLoaded]);

  useEffect(() => {
    async function checkUserAuthorization() {
      if (!clerkLoaded && !isLoaded) return;

      const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

      // Enforce server-validated Clerk authentication. An unauthenticated visitor
      // can never access protected artisan or customer dashboard routes.
      if (!isSignedIn || !user) {
        const loginRedirect = pathname.startsWith('/artisan')
          ? '/login/artisan'
          : `/login?redirectUrl=${encodeURIComponent(pathname)}`;
        router.push(loginRedirect);
        setCheckingAuth(false);
        return;
      }

      // Read role from verified Clerk metadata or server user record
      const metaRole = (user.publicMetadata?.role || user.unsafeMetadata?.role) as UserRole | undefined;
      const userEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase();

      let finalRole: UserRole | null = metaRole || 'buyer';

      // Verify artisan status against database
      if ((!finalRole || finalRole === 'buyer') && userEmail) {
        try {
          const res = await fetch('/api/users');
          if (res.ok) {
            const users = await res.json();
            const matched = Array.isArray(users)
              ? users.find((u: any) => u.email?.toLowerCase() === userEmail)
              : null;
            if (matched?.role === 'artisan') {
              finalRole = 'artisan';
            } else if (matched?.role === 'admin') {
              finalRole = 'admin';
            }
          }
        } catch {
          // non-fatal
        }
      }

      if (!finalRole) {
        router.push('/select-role');
        setCheckingAuth(false);
        return;
      }

      // Check if user's verified role satisfies the required roles
      if (!rolesArray.includes(finalRole)) {
        // Prevent privilege escalation: redirect user to their appropriate dashboard
        router.push(finalRole === 'artisan' ? '/artisan/dashboard' : '/dashboard');
        setCheckingAuth(false);
        return;
      }

      // Cache verified session role for client UI display
      if (typeof window !== 'undefined') {
        localStorage.setItem('viraasat_session_role', finalRole);
        localStorage.setItem('viraasat_session_uid', user.id);
      }

      setIsAuthorized(true);
      setCheckingAuth(false);
    }

    checkUserAuthorization();
  }, [isLoaded, clerkLoaded, isSignedIn, user, allowedRoles, router, pathname]);

  if ((!isLoaded && !clerkLoaded) || checkingAuth) {
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

