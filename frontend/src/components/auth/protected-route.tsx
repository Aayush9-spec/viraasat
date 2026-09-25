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

      if (!isSignedIn || !user) {
        // Check local cached role fallback before redirecting
        const cachedRole = typeof window !== 'undefined' ? (localStorage.getItem('viraasat_session_role') as UserRole | null) : null;

        if (cachedRole && rolesArray.includes(cachedRole)) {
          setIsAuthorized(true);
          setCheckingAuth(false);
          return;
        }

        const loginRedirect = pathname.startsWith('/artisan') ? '/login/artisan' : `/login?redirectUrl=${encodeURIComponent(pathname)}`;
        router.push(loginRedirect);
        setCheckingAuth(false);
        return;
      }

      // Fast path: check Clerk metadata or localStorage synchronously
      const metaRole = user.unsafeMetadata?.role as UserRole | undefined;
      const cachedRole = typeof window !== 'undefined' ? (localStorage.getItem('viraasat_session_role') as UserRole | null) : null;
      const cachedUid = typeof window !== 'undefined' ? localStorage.getItem('viraasat_session_uid') : null;
      const fastRole = metaRole || (cachedUid === user.id ? cachedRole : null) || null;

      if (fastRole && rolesArray.includes(fastRole)) {
        setIsAuthorized(true);
        setCheckingAuth(false);
      }

      // Slow path: try fetching from DB with a 1.5-second timeout to avoid infinite hangs
      let dbRole: UserRole | null = null;
      try {
        const userDocPromise = getUser(user.id);
        const timeoutPromise = new Promise<null>((res) => setTimeout(() => res(null), 1500));
        const userDoc = await Promise.race([userDocPromise, timeoutPromise]);
        dbRole = userDoc?.role ?? null;
      } catch (err) {
        console.warn('ProtectedRoute: DB query failed/timed out, falling back to fastRole', err);
      }

      const finalRole = dbRole || fastRole;

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

      // Cache verified role for future fast-path loads
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

