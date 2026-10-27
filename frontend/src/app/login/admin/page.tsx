'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { LoginForm } from '@/features/auth/components/login-form';
import { Login3DBackground } from '@/components/shared/visuals/login-3d-background';

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading Admin Portal...</div>}>
      <AdminLoginContent />
    </Suspense>
  );
}

function AdminLoginContent() {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSignUp = searchParams.get('mode') === 'signup' || searchParams.get('mode') === 'register';

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const role = user?.unsafeMetadata?.role;
      if (role === 'admin') {
        router.push('/admin');
      } else if (role === 'artisan') {
        router.push('/artisan/dashboard');
      } else {
        router.push('/admin');
      }
    }
  }, [isLoaded, isSignedIn, user, router]);

  if (isLoaded && isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Redirecting to Admin Console...
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center py-6 px-3 sm:px-6 overflow-hidden">
      <Login3DBackground />
      <div className="relative z-10 w-full max-w-sm sm:max-w-md md:max-w-lg mx-auto">
        <LoginForm userType="Admin" initialIsSignUp={isSignUp} />
      </div>
    </div>
  );
}
