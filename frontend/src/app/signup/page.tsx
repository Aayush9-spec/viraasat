'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { LoginForm } from '@/features/auth/components/login-form';
import { Login3DBackground } from '@/components/shared/visuals/login-3d-background';

export default function SignUpPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading Viraasat registration...</div>}>
      <SignUpContent />
    </Suspense>
  );
}

function SignUpContent() {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role');
  const userType = roleParam === 'artisan' ? 'Artisan' : 'Customer';

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      const role = user?.unsafeMetadata?.role;
      if (role === 'artisan') {
        router.push('/artisan/dashboard');
      } else {
        router.push('/shop');
      }
    }
  }, [isLoaded, isSignedIn, user, router]);

  if (isLoaded && isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Redirecting...
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center py-6 px-3 sm:px-6 overflow-hidden">
      <Login3DBackground />
      <div className="relative z-10 w-full max-w-sm sm:max-w-md md:max-w-lg mx-auto">
        <LoginForm userType={userType} initialIsSignUp={true} />
      </div>
    </div>
  );
}
