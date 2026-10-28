'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useClerk } from '@clerk/nextjs';
import Link from 'next/link';
import { ShieldCheck, Lock, ShieldAlert, KeyRound, Loader2, LogOut } from 'lucide-react';
import { LoginForm } from '@/features/auth/components/login-form';
import { Login3DBackground } from '@/components/shared/visuals/login-3d-background';
import { ViraasatLogo } from '@/components/shared/visuals/viraasat-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { STORAGE_KEYS } from '@/core/config/constants';

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-muted-foreground">Loading Admin Portal...</div>}>
      <AdminLoginContent />
    </Suspense>
  );
}

function AdminLoginContent() {
  const { isSignedIn, isLoaded, user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const verified = localStorage.getItem(STORAGE_KEYS.ADMIN_VERIFIED) === 'true';
      setIsVerified(verified);
    }
  }, []);

  useEffect(() => {
    if (isLoaded && isSignedIn && isVerified) {
      const role = user?.unsafeMetadata?.role;
      if (role === 'admin') {
        router.push('/admin');
      }
    }
  }, [isLoaded, isSignedIn, isVerified, user, router]);

  const handleVerifyCurrentSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const expectedPin = process.env.NEXT_PUBLIC_ADMIN_PIN || 'Viraasat@Admin2026';
    if (!pin.trim() || pin.trim() !== expectedPin) {
      setError('Invalid Administrator Security Passcode. Access denied.');
      return;
    }

    setBusy(true);
    try {
      if (user && typeof user.update === 'function') {
        await user.update({
          unsafeMetadata: {
            ...user.unsafeMetadata,
            role: 'admin',
          },
        });
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.ADMIN_VERIFIED, 'true');
        localStorage.setItem(STORAGE_KEYS.SESSION_ROLE, 'admin');
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('viraasat_auth_change'));
      }
      setIsVerified(true);
      router.push('/admin');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update administrative permissions.';
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const handleSignOut = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEYS.ADMIN_VERIFIED);
    }
    await signOut();
    router.push('/login/admin');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground gap-2">
        <Loader2 className="h-5 w-5 animate-spin" /> Verifying security credentials...
      </div>
    );
  }

  // Case 1: Already authenticated in Clerk, but needs Admin Security PIN to elevate session
  if (isSignedIn && !isVerified) {
    const userEmail = user.primaryEmailAddress?.emailAddress || user.fullName || 'Signed In User';

    return (
      <div className="relative w-full min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center py-6 px-3 sm:px-6 overflow-hidden">
        <Login3DBackground />
        <div className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto">
          <Card className="border border-border shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden bg-card text-card-foreground">
            {/* Banner */}
            <div className="py-6 px-4 text-center text-white relative bg-gradient-to-r from-slate-900 via-zinc-800 to-amber-950 shadow-inner">
              <div className="flex justify-center mb-2">
                <div className="bg-white/15 p-2.5 rounded-full backdrop-blur-md border border-white/20 shadow-sm">
                  <ViraasatLogo />
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-white drop-shadow-sm">
                VIRAASAT
              </h2>
              <p className="text-xs sm:text-sm text-amber-200/90 font-medium max-w-xs mx-auto mt-0.5">
                Restricted Administrator Access
              </p>
            </div>

            <CardContent className="p-6 sm:p-8 space-y-5">
              <div className="text-center space-y-1.5">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 mb-1">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-heading font-bold text-foreground">
                  Security Passcode Required
                </h3>
                <p className="text-xs text-muted-foreground">
                  Authenticated as <span className="font-semibold text-foreground">{userEmail}</span>. Enter the administrator security key to unlock access.
                </p>
              </div>

              {error && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs text-center font-medium flex items-center justify-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleVerifyCurrentSession} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pin" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                    Admin Passcode
                  </Label>
                  <Input
                    id="pin"
                    type="password"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="Enter secret administrator PIN"
                    className="h-11 text-base sm:text-sm border-amber-500/40 focus-visible:ring-2 focus-visible:ring-amber-600 rounded-xl"
                    required
                    autoFocus
                  />
                </div>

                <Button
                  type="submit"
                  disabled={busy}
                  className="w-full h-11 text-sm font-bold tracking-wider rounded-xl shadow-md text-white bg-amber-800 hover:bg-amber-900"
                >
                  {busy ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" /> Verifying...
                    </span>
                  ) : (
                    'UNLOCK ADMIN CONSOLE'
                  )}
                </Button>
              </form>

              <div className="flex items-center justify-between pt-2 border-t border-border text-xs text-muted-foreground">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-xs hover:text-foreground font-medium inline-flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Switch Account</span>
                </button>
                <Link href="/" className="hover:text-primary font-medium">
                  ← Back to Marketplace
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Case 2: Not signed in at all -> show full Admin LoginForm with Email + Password + Admin Security PIN
  return (
    <div className="relative w-full min-h-[calc(100vh-4rem)] flex flex-col items-center justify-center py-6 px-3 sm:px-6 overflow-hidden">
      <Login3DBackground />
      <div className="relative z-10 w-full max-w-sm sm:max-w-md md:max-w-lg mx-auto">
        <LoginForm userType="Admin" initialIsSignUp={false} />
      </div>
    </div>
  );
}

