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

      const cachedRole = typeof window !== 'undefined' ? (localStorage.getItem('viraasat_session_role') as UserRole | null) : null;
      const activeLocalRole = cachedRole;

      if (!isSignedIn || !user) {
        // If a verified local/demo session exists matching the required role, authorize immediately
        if (activeLocalRole && rolesArray.includes(activeLocalRole)) {
          setIsAuthorized(true);
          setCheckingAuth(false);
          return;
        }

        // User is not signed in and has no active local session — redirect to login
        const loginRedirect = pathname.startsWith('/artisan') ? '/login/artisan' : `/login?redirectUrl=${encodeURIComponent(pathname)}`;
        router.push(loginRedirect);
        setCheckingAuth(false);
        return;
      }

      // Fast path: check Clerk metadata, local session, or database/users.json
      const metaRole = user.unsafeMetadata?.role as UserRole | undefined;
      const userEmail = user.primaryEmailAddress?.emailAddress?.toLowerCase();

      // Priority 1: active session role in localStorage, or Clerk metadata
      let finalRole: UserRole | null = cachedRole || metaRole || 'buyer';

      // Priority 2: check verified artisan status by email
      if ((!finalRole || finalRole === 'buyer') && userEmail) {
        try {
          const res = await fetch('/api/users');
          if (res.ok) {
            const users = await res.json();
             
            const matched = users.find((u: any) => u.email?.toLowerCase() === userEmail);
            if (matched?.role === 'artisan') {
              finalRole = 'artisan';
            }
          }
        } catch {
          // non-fatal
        }
      }

      if (!finalRole) {
        // No role anywhere — send to role selection
        router.push('/select-role');
        setCheckingAuth(false);
        return;
      }

      if (!rolesArray.includes(finalRole)) {
        // Redirect the user to their matching dashboard
        router.push(finalRole === 'artisan' ? '/artisan/dashboard' : '/dashboard');
        setCheckingAuth(false);
        return;
      }

      // Cache verified role and synchronize Clerk unsafeMetadata
      if (typeof window !== 'undefined') {
        localStorage.setItem('viraasat_session_role', finalRole);
        localStorage.setItem('viraasat_session_uid', user.id);
      }

      if (user && typeof user.update === 'function' && user.unsafeMetadata?.role !== finalRole) {
        try {
          await user.update({
            unsafeMetadata: {
              ...user.unsafeMetadata,
              role: finalRole,
            },
          });
        } catch {
          // non-fatal
        }
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

