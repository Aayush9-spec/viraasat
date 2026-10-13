'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useClerk, useSignIn, useSignUp } from '@clerk/nextjs';
import { useToast } from '@/hooks/use-toast';
import { STORAGE_KEYS, USER_ROLES } from '@/config/constants';
import type { UserRole } from '@/types/user';

export interface UseAuthFormOptions {
  userType: 'Artisan' | 'Customer';
  initialIsSignUp?: boolean;
}

export function useAuthForm({ userType, initialIsSignUp = false }: UseAuthFormOptions) {
  const [isSignUp, setIsSignUp] = useState(initialIsSignUp);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const clerk = useClerk();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const signInHook = useSignIn() as any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const signUpHook = useSignUp() as any;

  const signIn = signInHook?.signIn || signInHook;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setSignInActive = signInHook?.setActive || (clerk as any)?.setActive;

  const signUp = signUpHook?.signUp || signUpHook;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const setSignUpActive = signUpHook?.setActive || (clerk as any)?.setActive;

  const isArtisan = userType === 'Artisan';
  const role: UserRole = isArtisan ? USER_ROLES.ARTISAN : USER_ROLES.BUYER;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const identifier = (formData.get('email') as string) || '';
    const password = (formData.get('password') as string) || '';
    const fullname = (formData.get('fullname') as string) || '';

    if (isSignUp && confirmPassword && password !== confirmPassword) {
      toast({
        title: 'Passwords Do Not Match',
        description: 'Please make sure your passwords match.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

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

        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.SESSION_ROLE, role);
        }

        toast({
          title: 'Account Created Successfully!',
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

        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.SESSION_ROLE, role);
        }

        toast({
          title: 'Authentication Successful',
          description: 'Welcome back to Viraasat!',
        });

        router.push(isArtisan ? '/artisan/dashboard' : '/shop');
      }
    } catch (err: unknown) {
      console.error('Auth handler error:', err);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = (err as any)?.errors?.[0]?.longMessage || (err as any)?.errors?.[0]?.message || (err as Error)?.message || 'Please check your details and try again.';
      toast({
        title: 'Authentication Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuth = async (strategy: 'oauth_google' | 'oauth_facebook') => {
    setIsSocialLoading(true);

    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEYS.SESSION_ROLE, role);
      }

      const redirectUrl = new URL(
        isArtisan ? '/artisan/dashboard' : '/shop',
        window.location.origin
      ).toString();
      const redirectCallbackUrl = new URL('/sso-callback', window.location.origin).toString();
      const authResource = isSignUp ? signUp : signIn;

      if (!authResource || typeof authResource.sso !== 'function') {
        throw new Error('Social sign-in is temporarily unavailable. Please try again in a few seconds.');
      }

      const { error } = await authResource.sso({
        strategy,
        redirectUrl,
        redirectCallbackUrl,
      });

      if (error) {
        throw error;
      }
    } catch (err: unknown) {
      console.error('Social Auth Error:', err);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const message = (err as any)?.errors?.[0]?.message || (err as Error)?.message || 'Social authentication failed';
      toast({
        title: 'Authentication Failed',
        description: message,
        variant: 'destructive',
      });
      setIsSocialLoading(false);
    }
  };

  return {
    isSignUp,
    setIsSignUp,
    confirmPassword,
    setConfirmPassword,
    rememberMe,
    setRememberMe,
    isLoading,
    isSocialLoading,
    isArtisan,
    role,
    handleSubmit,
    handleSocialAuth,
  };
}
