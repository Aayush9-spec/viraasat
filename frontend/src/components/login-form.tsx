'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { FaFacebook } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useClerk, useSignIn, useSignUp } from '@clerk/nextjs';
import { ViraasatLogo } from './viraasat-logo';

interface LoginFormProps {
  userType: 'Artisan' | 'Customer';
  initialIsSignUp?: boolean;
}

export function LoginForm({ userType, initialIsSignUp = false }: LoginFormProps) {
  const [isSignUp, setIsSignUp] = useState(initialIsSignUp);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);

  const clerk = useClerk();
  const signInHook = useSignIn() as any;
  const signUpHook = useSignUp() as any;

  const signIn = signInHook?.signIn || signInHook;
  const setSignInActive = signInHook?.setActive || (clerk as any)?.setActive;

  const signUp = signUpHook?.signUp || signUpHook;
  const setSignUpActive = signUpHook?.setActive || (clerk as any)?.setActive;

  const isArtisan = userType === 'Artisan';

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const identifier = (formData.get('email') as string) || '';
    const password = (formData.get('password') as string) || '';
    const fullname = (formData.get('fullname') as string) || '';

    if (isSignUp && confirmPassword && password !== confirmPassword) {
      toast({
        title: "Passwords Do Not Match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    const role = isArtisan ? 'artisan' : 'buyer';

    try {
      if (isSignUp) {
        if (!signUp || typeof signUp.create !== 'function' || !setSignUpActive) {
          throw new Error('Sign-up is temporarily unavailable. Please try again.');
        }

        const nameParts = fullname.trim().split(' ');
        const firstName = nameParts[0] || fullname;
        const lastName = nameParts.slice(1).join(' ') || undefined;
        const res = await signUp.create({
          emailAddress: identifier,
          password,
          firstName,
          lastName,
          unsafeMetadata: { role },
        });

        if (res.status !== 'complete' || !res.createdSessionId) {
          throw new Error('Please complete the required verification before signing in.');
        }

        await setSignUpActive({ session: res.createdSessionId });
        localStorage.setItem('viraasat_session_role', role);

        toast({
          title: "Account Created Successfully!",
          description: `Welcome to Viraasat, ${fullname || (isArtisan ? 'Artisan' : 'Customer')}!`,
        });
        router.push(isArtisan ? '/artisan/dashboard' : '/shop');
      } else {
        if (!signIn || typeof signIn.create !== 'function' || !setSignInActive) {
          throw new Error('Sign-in is temporarily unavailable. Please try again.');
        }

        const res = await signIn.create({ identifier, password });
        if (res.status !== 'complete' || !res.createdSessionId) {
          throw new Error('Additional verification is required before signing in.');
        }

        await setSignInActive({ session: res.createdSessionId });
        localStorage.setItem('viraasat_session_role', role);

        toast({
          title: "Authentication Successful",
          description: `Welcome back to Viraasat!`,
        });
        router.push(isArtisan ? '/artisan/dashboard' : '/shop');
      }
    } catch (err: any) {
      console.error('Auth handler error:', err);
      toast({
        title: 'Authentication Failed',
        description:
          err?.errors?.[0]?.longMessage ||
          err?.errors?.[0]?.message ||
          err?.message ||
          'Please check your details and try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsSocialLoading(true);
    const role = isArtisan ? 'artisan' : 'buyer';

    try {
      const clerkAny = clerk as any;
      if (!clerkAny || typeof clerkAny.authenticateWithRedirect !== 'function') {
        throw new Error('Google sign-in is temporarily unavailable. Please try again.');
      }
      localStorage.setItem('viraasat_session_role', role);
      await clerkAny.authenticateWithRedirect({
        strategy: 'oauth_google',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: isArtisan ? '/artisan/dashboard' : '/shop',
      });
    } catch (err: any) {
      toast({
        title: 'Authentication Failed',
        description: err?.message || 'Google sign-in could not be started. Please try again.',
        variant: 'destructive',
      });
      setIsSocialLoading(false);
    }
  };

  const handleFacebookAuth = async () => {
    setIsSocialLoading(true);
    const role = isArtisan ? 'artisan' : 'buyer';

    try {
      const clerkAny = clerk as any;
      if (!clerkAny || typeof clerkAny.authenticateWithRedirect !== 'function') {
        throw new Error('Facebook sign-in is temporarily unavailable. Please try again.');
      }
      localStorage.setItem('viraasat_session_role', role);
      await clerkAny.authenticateWithRedirect({
        strategy: 'oauth_facebook',
        redirectUrl: '/sso-callback',
        redirectUrlComplete: isArtisan ? '/artisan/dashboard' : '/shop',
      });
    } catch (err: any) {
      toast({
        title: 'Authentication Failed',
        description: err?.message || 'Facebook sign-in could not be started. Please try again.',
        variant: 'destructive',
      });
      setIsSocialLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-3 sm:p-6 md:p-8 bg-background dark:bg-background overflow-x-hidden">
      <Card className="w-full max-w-sm sm:max-w-md md:max-w-lg border border-border shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden bg-card text-card-foreground transition-all duration-300">
        
        {/* Top Brand Banner matching Viraasat Theme */}
        <div className={`py-6 px-4 text-center text-white relative bg-gradient-to-r ${
          isArtisan 
            ? 'from-amber-700 via-orange-600 to-amber-800' 
            : 'from-amber-800 via-primary to-amber-900'
        } shadow-inner`}>
          <div className="flex justify-center mb-2">
            <div className="bg-white/15 p-2.5 rounded-full backdrop-blur-md border border-white/20 shadow-sm">
              <ViraasatLogo />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-white drop-shadow-sm">
            VIRAASAT
          </h2>
          <p className="text-xs sm:text-sm text-white/90 font-medium max-w-xs mx-auto mt-0.5">
            {isArtisan ? 'Artisan Partner Portal' : 'Preserving Heritage. Empowering Artisans.'}
          </p>
        </div>

        {/* GFG-Style Dual Tabs Header - Fully Responsive & Theme Aware */}
        <div className="flex border-b border-border bg-muted/40">
          <button
            type="button"
            onClick={() => setIsSignUp(false)}
            className={`flex-1 py-3.5 sm:py-4 text-center text-xs sm:text-sm font-bold tracking-wider uppercase transition-all duration-200 ${
              !isSignUp
                ? 'text-primary border-b-2 border-primary bg-card shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            SIGN IN
          </button>
          <button
            type="button"
            onClick={() => setIsSignUp(true)}
            className={`flex-1 py-3.5 sm:py-4 text-center text-xs sm:text-sm font-bold tracking-wider uppercase transition-all duration-200 ${
              isSignUp
                ? 'text-primary border-b-2 border-primary bg-card shadow-xs'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
            }`}
          >
            SIGN UP
          </button>
        </div>

        <CardContent className="p-4 sm:p-6 md:p-8 space-y-5 sm:space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-1.5">
                <Label htmlFor="fullname" className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                  Full Name
                </Label>
                <Input
                  id="fullname"
                  name="fullname"
                  placeholder={isArtisan ? 'e.g. Riya Sharma' : 'e.g. Priya Patel'}
                  className="h-11 sm:h-12 text-base sm:text-sm border-input focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
                  required
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                {isArtisan ? 'Email or Artisan ID' : 'Email Address'}
              </Label>
              <Input
                id="email"
                name="email"
                type={isArtisan ? "text" : "email"}
                placeholder={isArtisan ? "e.g. ART-2024-1234 or email@example.com" : "you@example.com"}
                className="h-11 sm:h-12 text-base sm:text-sm border-input focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
                required
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Label htmlFor="password" className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                  Password
                </Label>
                {!isSignUp && (
                  <Link href="/sign-in" className="text-xs text-primary hover:underline font-medium">
                    Forgot Password?
                  </Link>
                )}
              </div>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                className="h-11 sm:h-12 text-base sm:text-sm border-input focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
                required
              />
            </div>

            {isSignUp && (
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                  Confirm Password
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-11 sm:h-12 text-base sm:text-sm border-input focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
                  required
                />
              </div>
            )}

            {!isSignUp && (
              <div className="flex items-center space-x-2.5 pt-1">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(c) => setRememberMe(!!c)}
                  className="h-4 w-4 rounded data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                />
                <label htmlFor="remember" className="text-xs sm:text-sm text-muted-foreground cursor-pointer select-none">
                  Remember me on this device
                </label>
              </div>
            )}

            <Button
              type="submit"
              className={`w-full h-11 sm:h-12 text-sm font-bold tracking-wider rounded-xl shadow-md transition-all duration-200 text-white bg-gradient-to-r ${
                isArtisan
                  ? 'from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700'
                  : 'from-amber-700 via-primary to-amber-800 hover:from-amber-800 hover:to-amber-900'
              } active:scale-[0.99]`}
              disabled={isLoading || isSocialLoading}
            >
              {isLoading
                ? (isSignUp ? "Creating Account..." : "Signing in...")
                : (isSignUp ? 'REGISTER ACCOUNT' : 'SIGN IN')}
            </Button>
          </form>

          {!isArtisan && (
            <>
              <div className="relative my-3 sm:my-4">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-3 text-muted-foreground font-semibold tracking-wider">
                    Or Sign In With
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleAuth}
                  className="h-11 sm:h-12 border-input hover:bg-accent hover:text-accent-foreground rounded-xl text-sm font-medium w-full flex items-center justify-center gap-2 transition-colors"
                  disabled={isLoading || isSocialLoading}
                >
                  <FcGoogle className="h-5 w-5 shrink-0" />
                  <span>{isSocialLoading ? 'Connecting...' : 'Google'}</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleFacebookAuth}
                  className="h-11 sm:h-12 border-input hover:bg-accent rounded-xl text-sm font-medium text-[#1877F2] w-full flex items-center justify-center gap-2 transition-colors"
                  disabled={isLoading || isSocialLoading}
                >
                  <FaFacebook className="h-5 w-5 shrink-0 text-[#1877F2]" />
                  <span>Facebook</span>
                </Button>
              </div>
            </>
          )}

          <div className="text-center pt-1 text-xs text-muted-foreground leading-relaxed">
            {isSignUp ? (
              <span>By signing up, you agree to Viraasat&apos;s <Link href="/terms" className="text-primary hover:underline font-medium">Terms</Link> & <Link href="/privacy" className="text-primary hover:underline font-medium">Privacy Policy</Link>.</span>
            ) : (
              isArtisan ? (
                <span>Not registered as a Viraasat Artisan? <Link href="/apply" className="text-primary font-semibold hover:underline">Apply Here</Link></span>
              ) : (
                <span>Don&apos;t have an account yet? <button type="button" onClick={() => setIsSignUp(true)} className="text-primary font-semibold hover:underline">Sign Up Now</button></span>
              )
            )}
          </div>
        </CardContent>

        <div className="border-t border-border bg-muted/30 p-3.5 text-center">
          <Link href="/login" className="text-xs text-muted-foreground hover:text-primary font-medium transition-colors inline-flex items-center gap-1">
            ← Back to Login Portal Options
          </Link>
        </div>
      </Card>
    </div>
  );
}
