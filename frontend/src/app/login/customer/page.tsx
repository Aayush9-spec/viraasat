'use client';

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { LoginForm } from '@/features/auth/components/login-form';

export default function CustomerLoginPage() {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();

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

  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading...</div>;
  }

  if (isSignedIn) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Redirecting to gallery...</div>;
  }

  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading customer portal...</div>}>
      <LoginForm userType="Customer" initialIsSignUp={false} />
    </Suspense>
  );
}
