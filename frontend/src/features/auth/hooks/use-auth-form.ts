'use client';

import { useState, useEffect, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useClerk, useSignIn, useSignUp } from '@clerk/nextjs';
import { useToast } from '@/core/hooks/use-toast';
import { STORAGE_KEYS, USER_ROLES } from '@/core/config/constants';
import type { UserRole } from '@/types/user';

export interface UseAuthFormOptions {
  userType: 'Artisan' | 'Customer';
  initialIsSignUp?: boolean;
}

export function useAuthForm({ userType, initialIsSignUp = false }: UseAuthFormOptions) {
  const [isSignUp, setIsSignUp] = useState(initialIsSignUp);

  useEffect(() => {
    setIsSignUp(initialIsSignUp);
  }, [initialIsSignUp]);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [currentEmail, setCurrentEmail] = useState('');
  const [currentName, setCurrentName] = useState('');
  const [verificationFactorType, setVerificationFactorType] = useState<'first_factor' | 'second_factor' | 'sign_up'>('first_factor');
   
  const [activeFactor, setActiveFactor] = useState<any>(null);

  const router = useRouter();
  const { toast } = useToast();

  // Safely retrieve searchParams without failing in mocked test environments
  let searchParams: URLSearchParams | null = null;
  try {
     
    const nav = require('next/navigation');
    if (typeof nav.useSearchParams === 'function') {
      searchParams = nav.useSearchParams();
    }
  } catch {
    // Ignore in non-browser or incomplete mock contexts
  }

  const clerk = useClerk();
   
  const signInHook = useSignIn() as any;
   
  const signUpHook = useSignUp() as any;

  // Resolve active Clerk resources safely
  const signIn = signInHook?.signIn || (clerk as any)?.client?.signIn;
   
  const setSignInActive = signInHook?.setActive || (clerk as any)?.setActive;

  const signUp = signUpHook?.signUp || (clerk as any)?.client?.signUp;
   
  const setSignUpActive = signUpHook?.setActive || (clerk as any)?.setActive;

  const isArtisan = userType === 'Artisan';
  const role: UserRole = isArtisan ? USER_ROLES.ARTISAN : USER_ROLES.BUYER;
  const rawRedirect =
    searchParams && typeof searchParams.get === 'function' ? searchParams.get('redirectUrl') : null;
  const targetRedirect = isArtisan
    ? (rawRedirect && rawRedirect.startsWith('/artisan') ? rawRedirect : '/artisan/dashboard')
    : (rawRedirect || '/shop');

  // Dedicated helper to trigger Clerk Email OTP (First Factor)
  const handleOtpSignIn = async (emailToUse?: string) => {
    const email = (emailToUse || currentEmail).trim();
    if (!email) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address to receive a verification code.',
        variant: 'destructive',
      });
      return;
    }

    setCurrentEmail(email);
    setIsLoading(true);

    try {
      const activeSignIn = signIn || (clerk as any)?.client?.signIn;
      if (!activeSignIn || typeof activeSignIn.create !== 'function') {
        throw new Error('Sign-in service is initializing. Please try again in a moment.');
      }

      let res: any = null;
      try {
        res = await activeSignIn.create({ identifier: email });
      } catch (signInErr: any) {
        const errCode = signInErr?.errors?.[0]?.code;
        // If account does not exist yet, seamlessly create it via OTP sign-up
        if (errCode === 'form_identifier_not_found') {
          const activeSignUp = signUp || (clerk as any)?.client?.signUp;
          if (activeSignUp && typeof activeSignUp.create === 'function') {
            await activeSignUp.create({
              emailAddress: email,
              unsafeMetadata: { role },
            });
            if (typeof activeSignUp.prepareEmailAddressVerification === 'function') {
              await activeSignUp.prepareEmailAddressVerification({ strategy: 'email_code' });
            }
            setVerificationFactorType('sign_up');
            setIsVerifying(true);
            toast({
              title: 'Verification Code Sent',
              description: `Creating your account! A 6-digit verification code was sent to ${email}.`,
            });
            return;
          }
        }
        throw signInErr;
      }

      if (res.status === 'needs_first_factor') {
        setVerificationFactorType('first_factor');
        const emailFactor = res.supportedFirstFactors?.find(
           
          (f: any) => f.strategy === 'email_code' || f.strategy === 'reset_password_email_code'
        ) as any;

        const emailId = emailFactor?.emailAddressId || emailFactor?.email_address_id;
        if (typeof activeSignIn.prepareFirstFactor === 'function') {
          await activeSignIn.prepareFirstFactor({
            strategy: 'email_code',
            ...(emailId ? { emailAddressId: emailId } : {}),
          });
        }

        setActiveFactor(emailFactor || { strategy: 'email_code' });
        setIsVerifying(true);
        toast({
          title: 'Verification Code Sent',
          description: `A 6-digit verification code was sent to ${email}. Please check your Gmail.`,
        });
      } else if (res.status === 'complete' && res.createdSessionId) {
        const setActiveFn = setSignInActive || (clerk as any)?.setActive;
        if (setActiveFn) {
          await setActiveFn({ session: res.createdSessionId });
        }
        toast({
          title: 'Authentication Successful',
          description: 'Welcome back to Viraasat!',
        });
        router.push(targetRedirect);
      } else {
        throw new Error(`Sign-in status: ${res.status}. Please check your credentials.`);
      }
    } catch (err: unknown) {
      console.error('OTP Sign-in Error:', err);
       
      const errObj = (err as any)?.errors?.[0];
      const message =
        errObj?.longMessage ||
        errObj?.message ||
        (err as Error)?.message ||
        'Could not send verification code. Please check your email.';
      toast({
        title: 'Sign In Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const identifier = (formData.get('email') as string || '').trim();
    const password = (formData.get('password') as string) || '';
    const fullname = (formData.get('fullname') as string || '').trim();

    if (!identifier) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address.',
        variant: 'destructive',
      });
      return;
    }

    if (isSignUp && confirmPassword && password !== confirmPassword) {
      toast({
        title: 'Passwords Do Not Match',
        description: 'Please make sure your passwords match.',
        variant: 'destructive',
      });
      return;
    }

    setCurrentEmail(identifier);
    setCurrentName(fullname);

    // If on sign-in and no password was entered, immediately use OTP login
    if (!isSignUp && !password) {
      await handleOtpSignIn(identifier);
      return;
    }

    setIsLoading(true);

    try {
      if (isSignUp) {
        setVerificationFactorType('sign_up');
        const activeSignUp = signUp || (clerk as any)?.client?.signUp;
        if (!activeSignUp || typeof activeSignUp.create !== 'function') {
          throw new Error('Sign-up service is loading. Please try again in a moment.');
        }

        const nameParts = fullname.split(' ');
        const firstName = nameParts[0] || fullname;
        const lastName = nameParts.slice(1).join(' ') || undefined;

        let res: any = null;
        try {
          res = await activeSignUp.create({
            emailAddress: identifier,
            password,
            firstName,
            lastName,
            unsafeMetadata: { role },
          });
        } catch (signUpErr: any) {
          const errCode = signUpErr?.errors?.[0]?.code;
          // If user already exists in Clerk, seamlessly fall back to OTP sign-in
          if (errCode === 'form_identifier_exists') {
            toast({
              title: 'Account Found',
              description: 'An account already exists for this email. Sending a verification code to log you in...',
            });
            await handleOtpSignIn(identifier);
            return;
          }
          throw signUpErr;
        }

        const sessionId = res?.createdSessionId || activeSignUp?.createdSessionId;
        if (res?.status === 'complete' && sessionId) {
          const setActiveFn = setSignUpActive || (clerk as any)?.setActive;
          if (setActiveFn) {
            await setActiveFn({ session: sessionId });
          }

          if (typeof window !== 'undefined') {
            const uid = res.createdUserId || `user-${Date.now()}`;
            localStorage.setItem(STORAGE_KEYS.SESSION_ROLE, role);
            localStorage.setItem('viraasat_session_uid', uid);
            localStorage.setItem(
              'viraasat_demo_user',
              JSON.stringify({
                id: uid,
                name: fullname || identifier.split('@')[0],
                email: identifier,
                role: role,
              })
            );
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('viraasat_auth_change'));
          }

          try {
            await fetch('/api/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: res.createdUserId || `user-${Date.now()}`,
                name: fullname || identifier.split('@')[0],
                email: identifier,
                role: role,
                profile: { registeredAt: new Date().toISOString() },
              }),
            });
          } catch (syncErr) {
            console.warn('[useAuthForm] Could not sync user to database/users.json:', syncErr);
          }

          toast({
            title: 'Account Created Successfully!',
            description: `Welcome to Viraasat, ${fullname || (isArtisan ? 'Artisan' : 'Customer')}!`,
          });
          router.push(targetRedirect);
        } else {
          // Prepare email code verification for sign-up
          if (typeof activeSignUp.prepareEmailAddressVerification === 'function') {
            await activeSignUp.prepareEmailAddressVerification({ strategy: 'email_code' });
          }
          setVerificationFactorType('sign_up');
          setIsVerifying(true);
          toast({
            title: 'Verification Code Sent',
            description: `We've sent a 6-digit verification code to ${identifier}. Please check your email.`,
          });
        }
      } else {
        const activeSignIn = signIn || (clerk as any)?.client?.signIn;
        if (!activeSignIn || typeof activeSignIn.create !== 'function') {
          throw new Error('Sign-in service is loading. Please try again in a moment.');
        }

        let res: any = null;
        try {
          // Step 1: Initialize sign-in attempt with identifier
          res = await activeSignIn.create({ identifier });
        } catch (signInErr: any) {
          const errCode = signInErr?.errors?.[0]?.code;
          if (errCode === 'form_identifier_not_found') {
            toast({
              title: 'Account Not Found',
              description: 'No existing account found. Switched to Sign Up so you can register now!',
            });
            setIsSignUp(true);
            return;
          }
          if (errCode === 'strategy_for_user_invalid') {
            toast({
              title: 'Email Code Verification',
              description: 'This account signs in via email code. Sending a 6-digit OTP to your Gmail...',
            });
            await handleOtpSignIn(identifier);
            return;
          }
          throw signInErr;
        }

        // Step 2: If user provided a password, attempt password factor verification
        if (password && (res.status === 'needs_first_factor' || !res.status)) {
          const hasPasswordStrategy = res.supportedFirstFactors?.some(
            (f: any) => f.strategy === 'password'
          );

          if (hasPasswordStrategy || typeof activeSignIn.attemptFirstFactor === 'function') {
            try {
              res = await activeSignIn.attemptFirstFactor({
                strategy: 'password',
                password,
              });
            } catch (pwdErr: any) {
              const pCode = pwdErr?.errors?.[0]?.code;
              if (pCode === 'form_password_incorrect') {
                toast({
                  title: 'Incorrect Password',
                  description: 'The password entered does not match our records. Please try again or use "Sign in with Gmail OTP" below.',
                  variant: 'destructive',
                });
                return;
              }
              throw pwdErr;
            }
          } else {
            toast({
              title: 'Email Code Verification',
              description: 'This account does not use passwords. Sending an instant 6-digit OTP to your Gmail...',
            });
            await handleOtpSignIn(identifier);
            return;
          }
        }

        const sessionId = res?.createdSessionId || activeSignIn?.createdSessionId;

        if (res.status === 'complete' && sessionId) {
          const setActiveFn = setSignInActive || (clerk as any)?.setActive;
          if (setActiveFn) {
            await setActiveFn({ session: sessionId });
          }

          if (typeof window !== 'undefined') {
            const uid = res.createdUserId || activeSignIn?.createdUserId || `user-${Date.now()}`;
            localStorage.setItem(STORAGE_KEYS.SESSION_ROLE, role);
            localStorage.setItem('viraasat_session_uid', uid);
            localStorage.setItem(
              'viraasat_demo_user',
              JSON.stringify({
                id: uid,
                name: identifier.split('@')[0],
                email: identifier,
                role: role,
              })
            );
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('viraasat_auth_change'));
          }

          if (clerk.user && typeof clerk.user.update === 'function') {
            clerk.user.update({
              unsafeMetadata: {
                ...clerk.user.unsafeMetadata,
                role,
              },
            }).catch(() => {});
          }

          try {
            await fetch('/api/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: identifier.split('@')[0],
                email: identifier,
                role,
                profile: { lastLoginAt: new Date().toISOString() },
              }),
            });
          } catch (syncErr) {
            console.warn('[useAuthForm] Could not sync user to database/users.json:', syncErr);
          }

          toast({
            title: 'Authentication Successful',
            description: `Welcome back to Viraasat${isArtisan ? ' Artisan Studio' : ''}!`,
          });
          router.push(targetRedirect);
        } else if (res.status === 'needs_second_factor') {
          setVerificationFactorType('second_factor');
          const emailFactor = res.supportedSecondFactors?.find(
             
            (f: any) => f.strategy === 'email_code'
          ) as any;
          const phoneFactor = res.supportedSecondFactors?.find(
             
            (f: any) => f.strategy === 'phone_code'
          ) as any;
          const targetFactor = emailFactor || phoneFactor || res.supportedSecondFactors?.[0] || { strategy: 'email_code' };
          setActiveFactor(targetFactor);

          const emailId = targetFactor.emailAddressId || targetFactor.email_address_id;
          const phoneId = targetFactor.phoneNumberId || targetFactor.phone_number_id;

          if (typeof activeSignIn.prepareSecondFactor === 'function') {
            await activeSignIn.prepareSecondFactor({
              strategy: targetFactor.strategy,
              ...(emailId ? { emailAddressId: emailId } : {}),
              ...(phoneId ? { phoneNumberId: phoneId } : {}),
            });
          }

          setIsVerifying(true);
          toast({
            title: 'Verification Code Sent',
            description: `A 6-digit verification code was sent to ${identifier}. Please enter it to complete sign in.`,
          });
        } else if (res.status === 'needs_first_factor') {
          setVerificationFactorType('first_factor');
          const emailFactor = res.supportedFirstFactors?.find(
             
            (f: any) => f.strategy === 'email_code' || f.strategy === 'reset_password_email_code'
          ) as any;
          const phoneFactor = res.supportedFirstFactors?.find(
             
            (f: any) => f.strategy === 'phone_code'
          ) as any;
          const targetFactor = emailFactor || phoneFactor || res.supportedFirstFactors?.[0] || { strategy: 'email_code' };
          setActiveFactor(targetFactor);

          const emailId = targetFactor.emailAddressId || targetFactor.email_address_id;
          const phoneId = targetFactor.phoneNumberId || targetFactor.phone_number_id;

          if (typeof activeSignIn.prepareFirstFactor === 'function') {
            await activeSignIn.prepareFirstFactor({
              strategy: targetFactor.strategy,
              ...(emailId ? { emailAddressId: emailId } : {}),
              ...(phoneId ? { phoneNumberId: phoneId } : {}),
            });
          }

          setIsVerifying(true);
          toast({
            title: 'Verification Code Sent',
            description: `A 6-digit verification code was sent to ${identifier}. Please check your email.`,
          });
        } else if (res.status === 'needs_new_password') {
          toast({
            title: 'Password Update Required',
            description: 'Your account requires a new password. Please use Forgot Password or contact support.',
            variant: 'destructive',
          });
        } else {
          if (sessionId) {
            const setActiveFn = setSignInActive || (clerk as any)?.setActive;
            if (setActiveFn) {
              await setActiveFn({ session: sessionId });
            }
            if (typeof window !== 'undefined') {
              localStorage.setItem(STORAGE_KEYS.SESSION_ROLE, role);
            }
            toast({
              title: 'Authentication Successful',
              description: 'Welcome back to Viraasat!',
            });
            router.push(targetRedirect);
            return;
          }
          const vErr = res?.firstFactorVerification?.error;
          const failureMsg =
            vErr?.longMessage ||
            vErr?.message ||
            (res?.status
              ? `Sign-in status: ${res.status}. Please check your credentials.`
              : 'Sign-in could not be completed. Please check your password or use "Sign in with Gmail OTP" below.');
          toast({
            title: 'Sign In Failed',
            description: failureMsg,
            variant: 'destructive',
          });
          return;
        }
      }
    } catch (err: unknown) {
      console.error('Auth handler error:', err);
       
      const errObj = (err as any)?.errors?.[0];

      if (errObj?.code === 'session_exists' || String((err as any)?.message).toLowerCase().includes('already signed in')) {
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_KEYS.SESSION_ROLE, role);
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new Event('viraasat_auth_change'));
        }
        toast({
          title: 'Already Signed In',
          description: `You are already authenticated as ${isArtisan ? 'an Artisan' : 'a Customer'}. Taking you to your dashboard!`,
        });
        router.push(targetRedirect);
        return;
      }

      let message =
        errObj?.longMessage ||
        errObj?.message ||
        (err as Error)?.message ||
        'Please check your details and try again.';

      if (errObj?.code === 'form_identifier_not_found') {
        message = 'No account found with this email. Click "SIGN UP" above to register.';
      } else if (errObj?.code === 'form_password_incorrect') {
        message = 'Incorrect password. Please try again or use "Sign In with Email OTP".';
      } else if (errObj?.code === 'form_identifier_exists') {
        message = 'An account with this email already exists. Click "SIGN IN" above to log in.';
      }

      toast({
        title: isSignUp ? 'Sign Up Failed' : 'Sign In Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    const code = verificationCode.trim();
    if (!code) {
      toast({
        title: 'Code Required',
        description: 'Please enter the 6-digit verification code.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      if (verificationFactorType === 'sign_up') {
        const activeSignUp = signUp || (clerk as any)?.client?.signUp;
        if (!activeSignUp || typeof activeSignUp.attemptEmailAddressVerification !== 'function') {
          throw new Error('Sign-up verification service is not ready. Please try again.');
        }

        const completeSignUp = await activeSignUp.attemptEmailAddressVerification({
          code,
        });

        const sessionId = completeSignUp?.createdSessionId || activeSignUp?.createdSessionId;
        if (completeSignUp?.status === 'complete' && sessionId) {
          const setActiveFn = setSignUpActive || (clerk as any)?.setActive;
          if (setActiveFn) {
            await setActiveFn({ session: sessionId });
          }

          const userId = completeSignUp?.createdUserId || `user-${Date.now()}`;
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.SESSION_ROLE, role);
            localStorage.setItem('viraasat_session_uid', userId);
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('viraasat_auth_change'));
          }

          try {
            await fetch('/api/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: userId,
                name: currentName || currentEmail.split('@')[0],
                email: currentEmail,
                role: role,
                profile: { registeredAt: new Date().toISOString() },
              }),
            });
          } catch (syncErr) {
            console.warn('[useAuthForm] Could not sync user to database/users.json:', syncErr);
          }

          toast({
            title: 'Email Verified!',
            description: `Welcome to Viraasat, ${currentName || (isArtisan ? 'Artisan Partner' : 'Customer')}! Account successfully activated.`,
          });
          router.push(targetRedirect);
        } else {
          throw new Error('Sign-up verification was not completed. Please check your code.');
        }
      } else {
        const activeSignIn = signIn || (clerk as any)?.client?.signIn;
        if (!activeSignIn) {
          throw new Error('Sign-in service is not ready. Please try again.');
        }

        const factor = activeFactor || activeSignIn.supportedFirstFactors?.find((f: any) => f.strategy === 'email_code') || { strategy: 'email_code' };
        const strategy = factor?.strategy || 'email_code';
        let completeSignIn: any = null;

        if (verificationFactorType === 'second_factor' && typeof activeSignIn.attemptSecondFactor === 'function') {
          completeSignIn = await activeSignIn.attemptSecondFactor({
            strategy,
            code,
          });
        } else if (typeof activeSignIn.attemptFirstFactor === 'function') {
          completeSignIn = await activeSignIn.attemptFirstFactor({
            strategy,
            code,
          });
        }

        const sessionId = completeSignIn?.createdSessionId || activeSignIn?.createdSessionId;
        if (completeSignIn?.status === 'complete' && sessionId) {
          const setActiveFn = setSignInActive || (clerk as any)?.setActive;
          if (setActiveFn) {
            await setActiveFn({ session: sessionId });
          }

          const userId = completeSignIn?.createdUserId || activeSignIn?.createdUserId || `user-${Date.now()}`;
          if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEYS.SESSION_ROLE, role);
            localStorage.setItem('viraasat_session_uid', userId);
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('viraasat_auth_change'));
          }

          if (clerk.user && typeof clerk.user.update === 'function') {
            clerk.user.update({
              unsafeMetadata: {
                ...clerk.user.unsafeMetadata,
                role,
              },
            }).catch(() => {});
          }

          try {
            await fetch('/api/users', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: currentName || currentEmail.split('@')[0],
                email: currentEmail,
                role,
                profile: { lastLoginAt: new Date().toISOString() },
              }),
            });
          } catch (syncErr) {
            console.warn('[useAuthForm] Could not sync user to database/users.json:', syncErr);
          }

          toast({
            title: 'Authentication Successful',
            description: `Welcome back to Viraasat${isArtisan ? ' Artisan Studio' : ''}!`,
          });
          router.push(targetRedirect);
        } else if (completeSignIn?.status === 'needs_second_factor') {
          setVerificationFactorType('second_factor');
          const secondFactor = completeSignIn.supportedSecondFactors?.find(
             
            (f: any) => f.strategy === 'email_code'
          ) || completeSignIn.supportedSecondFactors?.[0];
          const emailId = secondFactor?.emailAddressId || secondFactor?.email_address_id;
          if (secondFactor && typeof activeSignIn.prepareSecondFactor === 'function') {
            await activeSignIn.prepareSecondFactor({
              strategy: secondFactor.strategy,
              ...(emailId ? { emailAddressId: emailId } : {}),
            });
          }
          setActiveFactor(secondFactor || { strategy: 'email_code' });
          setVerificationCode('');
          toast({
            title: 'Second Verification Required',
            description: 'Please enter the second verification code sent to your device.',
          });
        } else {
          throw new Error('Sign in could not be completed. Please check your verification code.');
        }
      }
    } catch (err: unknown) {
      console.error('Verification error:', err);
       
      const message =
        (err as any)?.errors?.[0]?.longMessage ||
        (err as any)?.errors?.[0]?.message ||
        (err as Error)?.message ||
        'Invalid verification code. Please check your code and try again.';
      toast({
        title: 'Verification Failed',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      if (verificationFactorType === 'sign_up') {
        const activeSignUp = signUp || (clerk as any)?.client?.signUp;
        if (activeSignUp && typeof activeSignUp.prepareEmailAddressVerification === 'function') {
          await activeSignUp.prepareEmailAddressVerification({ strategy: 'email_code' });
          toast({
            title: 'Code Resent',
            description: `A new 6-digit code was sent to ${currentEmail || 'your email'}.`,
          });
        }
      } else {
        const activeSignIn = signIn || (clerk as any)?.client?.signIn;
        if (!activeSignIn) {
          throw new Error('Sign-in service is not ready.');
        }
        const factor = activeFactor || activeSignIn.supportedFirstFactors?.find((f: any) => f.strategy === 'email_code') || { strategy: 'email_code' };
        const strategy = factor?.strategy || 'email_code';
        const emailId = factor?.emailAddressId || factor?.email_address_id;
        const phoneId = factor?.phoneNumberId || factor?.phone_number_id;

        if (verificationFactorType === 'second_factor' && typeof activeSignIn.prepareSecondFactor === 'function') {
          await activeSignIn.prepareSecondFactor({
            strategy,
            ...(emailId ? { emailAddressId: emailId } : {}),
            ...(phoneId ? { phoneNumberId: phoneId } : {}),
          });
        } else if (typeof activeSignIn.prepareFirstFactor === 'function') {
          await activeSignIn.prepareFirstFactor({
            strategy,
            ...(emailId ? { emailAddressId: emailId } : {}),
            ...(phoneId ? { phoneNumberId: phoneId } : {}),
          });
        }
        toast({
          title: 'Code Resent',
          description: `A new 6-digit code was sent to ${currentEmail || 'your email'}.`,
        });
      }
    } catch (err: unknown) {
      console.error('Resend error:', err);
       
      const message =
        (err as any)?.errors?.[0]?.longMessage ||
        (err as any)?.errors?.[0]?.message ||
        (err as Error)?.message ||
        'Please wait a moment before requesting another code.';
      toast({
        title: 'Could Not Resend Code',
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
        targetRedirect,
        window.location.origin
      ).toString();
      const redirectCallbackUrl = new URL('/sso-callback', window.location.origin).toString();
      const authResource = isSignUp ? signUp : signIn;

      if (authResource && typeof authResource.authenticateWithRedirect === 'function') {
        await authResource.authenticateWithRedirect({
          strategy,
          redirectUrl: redirectCallbackUrl,
          redirectUrlComplete: redirectUrl,
          continueSignUp: true,
          continueSignIn: true,
        });
      } else if (authResource && typeof authResource.sso === 'function') {
        const { error } = await authResource.sso({
          strategy,
          redirectUrl,
          redirectCallbackUrl,
        });

        if (error) {
          throw error;
        }
      } else {
        throw new Error('Social sign-in is temporarily unavailable. Please try again in a few seconds.');
      }
    } catch (err: unknown) {
      console.error('Social Auth Error:', err);
       
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
    isVerifying,
    setIsVerifying,
    verificationCode,
    setVerificationCode,
    currentEmail,
    handleVerifyEmail,
    handleResendCode,
    handleOtpSignIn,
    isArtisan,
    role,
    handleSubmit,
    handleSocialAuth,
  };
}
