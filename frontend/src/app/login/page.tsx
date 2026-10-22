'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import { LoginForm } from '@/features/auth/components/login-form';
import { Login3DBackground } from '@/components/shared/visuals/login-3d-background';
import { ShoppingBag, Store } from 'lucide-react';

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading Viraasat portal...</div>}>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const { isSignedIn, isLoaded, user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();

  const modeParam = searchParams.get('mode');
  const roleParam = searchParams.get('role');
  const initialIsSignUp = modeParam === 'signup' || modeParam === 'register';
  
  const [activeRole, setActiveRole] = useState<'Customer' | 'Artisan'>(
    roleParam === 'artisan' ? 'Artisan' : 'Customer'
  );

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
        Redirecting to gallery...
      </div>
    );
  }

  return (
    <div className="relative w-full min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center py-6 px-3 sm:px-6 overflow-hidden">
      {/* 3D Background */}
      <Login3DBackground />

      <div className="relative z-10 w-full max-w-sm sm:max-w-md md:max-w-lg mx-auto flex flex-col items-center">
        {/* Role Toggle Selector */}
        <div className="w-full flex items-center p-1.5 mb-2 bg-card/90 backdrop-blur-md rounded-2xl border border-border shadow-md">
          <button
            type="button"
            onClick={() => setActiveRole('Customer')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeRole === 'Customer'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            Customer Portal
          </button>
          <button
            type="button"
            onClick={() => setActiveRole('Artisan')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeRole === 'Artisan'
                ? 'bg-amber-700 text-white shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Store className="w-4 h-4" />
            Artisan Studio
          </button>
        </div>

        {/* Auth Card */}
        <div className="w-full">
          <LoginForm 
            key={`${activeRole}-${initialIsSignUp}`}
            userType={activeRole} 
            initialIsSignUp={initialIsSignUp} 
          />
        </div>
      </div>
    </div>
  );
}
