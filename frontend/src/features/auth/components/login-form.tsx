'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { ShieldCheck, Lock } from 'lucide-react';
import { FaFacebook } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { ViraasatLogo } from '@/components/shared/visuals/viraasat-logo';
import { useAuthForm } from '@/features/auth/hooks/use-auth-form';

interface LoginFormProps {
  userType: 'Artisan' | 'Customer' | 'Admin';
  initialIsSignUp?: boolean;
}

export function LoginForm({ userType, initialIsSignUp = false }: LoginFormProps) {
  const {
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
    handleForgotPassword,
    verificationFactorType,
    resetPassword,
    setResetPassword,
    isArtisan,
    isAdmin,
    handleSubmit,
    handleSocialAuth,
  } = useAuthForm({ userType, initialIsSignUp });

  const [inputEmail, setInputEmail] = useState('');

  const handleGoogleAuth = () => handleSocialAuth('oauth_google');
  const handleFacebookAuth = () => handleSocialAuth('oauth_facebook');

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-3 sm:p-6 md:p-8 bg-transparent overflow-x-hidden">
      <Card className="w-full max-w-sm sm:max-w-md md:max-w-lg border border-border shadow-2xl rounded-2xl sm:rounded-3xl overflow-hidden bg-card text-card-foreground transition-all duration-300">
        
        {/* Top Brand Banner matching Viraasat Theme */}
        <div className={`py-6 px-4 text-center text-white relative bg-gradient-to-r ${
          isAdmin
            ? 'from-slate-900 via-zinc-800 to-amber-950'
            : isArtisan 
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
            {isAdmin ? 'Admin Console & Moderation Portal' : isArtisan ? 'Artisan Partner Portal' : 'Preserving Heritage. Empowering Artisans.'}
          </p>
        </div>

        {/* Verification View */}
        {isVerifying ? (
          <CardContent className="p-6 sm:p-8 space-y-6 text-center">
            <div className="space-y-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary text-xl font-bold">
                {verificationFactorType === 'reset_password' ? '🔑' : '✉️'}
              </div>
              <h3 className="text-xl font-heading font-bold text-foreground">
                {verificationFactorType === 'reset_password' ? 'Reset Your Password' : 'Verify Your Email'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
                {verificationFactorType === 'reset_password'
                  ? `Enter the 6-digit reset code sent to ${currentEmail || 'your email'} and your new password below.`
                  : `We sent a 6-digit verification code to ${currentEmail || 'your email'}.`}
              </p>
            </div>

            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <Label htmlFor="verificationCode" className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                    6-Digit Verification Code
                  </Label>
                  <button
                    type="button"
                    onClick={() => setVerificationCode('424242')}
                    className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                  >
                    <span>⚡ Use Dev Code (424242)</span>
                  </button>
                </div>
                <Input
                  id="verificationCode"
                  name="verificationCode"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  maxLength={6}
                  placeholder="424242"
                  className="h-12 text-center text-2xl tracking-widest font-mono border-input focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
                  required
                  autoFocus
                />
              </div>

              {verificationFactorType === 'reset_password' && (
                <div className="space-y-1.5 text-left">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="newPassword" className="text-xs font-semibold uppercase text-muted-foreground tracking-wide">
                      New Password
                    </Label>
                    <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                      Min 15 characters
                    </span>
                  </div>
                  <Input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    placeholder="Minimum 15 characters (e.g. secure passphrase)"
                    className="h-11 sm:h-12 text-base sm:text-sm border-input focus-visible:ring-2 focus-visible:ring-primary rounded-xl"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Clerk domain security requires at least 15 characters (e.g., a memorable passphrase).
                  </p>
                </div>
              )}

              {/* Development Mode Helper Notice */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-left space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-900 dark:text-amber-200 flex items-center gap-1">
                    <span>💡</span>
                    <span>Email delayed in local testing?</span>
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-900 dark:text-amber-200">
                    Clerk Dev
                  </span>
                </div>
                <p className="text-[11px] text-muted-foreground leading-normal">
                  In local development, email delivery may be filtered to Gmail Spam or rate-limited. Clerk dev instances accept test code <strong className="font-mono text-foreground">424242</strong> for all email verifications.
                </p>
                <button
                  type="button"
                  onClick={() => setVerificationCode('424242')}
                  className="w-full mt-1 py-1.5 px-2.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-950 dark:text-amber-100 text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-colors border border-amber-500/30"
                >
                  <span>Click to auto-fill</span>
                  <span className="font-mono font-bold tracking-wider underline">424242</span>
                  <span>& verify</span>
                </button>
              </div>

              <Button
                type="submit"
                className="w-full h-11 sm:h-12 text-sm font-bold tracking-wider rounded-xl shadow-md text-white bg-primary hover:bg-primary/90"
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : (verificationFactorType === 'reset_password' ? 'UPDATE PASSWORD & SIGN IN' : 'VERIFY & CONTINUE')}
              </Button>
            </form>

            <div className="flex flex-col gap-2 pt-2 text-xs text-muted-foreground">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={isLoading}
                className="text-primary hover:underline font-semibold"
              >
                Didn&apos;t receive code? Resend Code
              </button>
              <button
                type="button"
                onClick={() => setIsVerifying(false)}
                className="hover:underline text-muted-foreground"
              >
                ← Back to Login
              </button>
            </div>
          </CardContent>
        ) : (
          <>
            {/* Dual Tabs Header - Sign In / Sign Up (Disabled for Admin) */}
            {isAdmin ? (
              <div className="py-3 px-4 bg-muted/60 border-b border-border flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Administrator Authentication</span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/20 text-amber-950 dark:text-amber-200">Restricted</span>
              </div>
            ) : (
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
            )}

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
                    value={inputEmail}
                    onChange={(e) => setInputEmail(e.target.value)}
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
                      <button
                        type="button"
                        onClick={() => handleForgotPassword(inputEmail)}
                        className="text-xs text-primary hover:underline font-medium cursor-pointer"
                      >
                        Forgot Password?
                      </button>
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
                      aria-label="Remember me"
                      checked={rememberMe}
                      onCheckedChange={(c) => setRememberMe(!!c)}
                      className="h-4 w-4 rounded data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                    />
                    <label htmlFor="remember" className="text-xs sm:text-sm text-muted-foreground cursor-pointer select-none">
                      Remember me on this device
                    </label>
                  </div>
                )}

                <div className="space-y-2.5 pt-1">
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

                  {!isSignUp && (
                    <div className="text-center pt-0.5">
                      <button
                        type="button"
                        onClick={() => handleOtpSignIn(inputEmail)}
                        disabled={isLoading || isSocialLoading}
                        className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer py-1"
                      >
                        <span>Or sign in with email OTP code instead →</span>
                      </button>
                    </div>
                  )}
                </div>
              </form>

              {!isAdmin && (
                <>
                  <div className="relative my-3 sm:my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-3 text-muted-foreground font-semibold tracking-wider">
                        Or Continue With
                      </span>
                    </div>
                  </div>

                  <div className={`grid grid-cols-1 gap-3 ${!isArtisan ? 'sm:grid-cols-2' : ''}`}>
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
                    {!isArtisan && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleFacebookAuth}
                        className="h-11 sm:h-12 border-input hover:bg-accent rounded-xl text-sm font-medium text-foreground w-full flex items-center justify-center gap-2 transition-colors"
                        disabled={isLoading || isSocialLoading}
                      >
                        <FaFacebook className="h-5 w-5 shrink-0 text-[#1877F2]" />
                        <span>Facebook</span>
                      </Button>
                    )}
                  </div>
                </>
              )}

              {/* Required by Clerk for bot protection in custom sign-up and OAuth flows. */}
              <div id="clerk-captcha" data-cl-size="flexible" />

              <div className="text-center pt-1 text-xs text-muted-foreground leading-relaxed">
                {isAdmin ? (
                  <span className="text-amber-800 dark:text-amber-300 font-medium">
                    Protected Admin Console. Unauthorized access attempts are monitored and logged.
                  </span>
                ) : isSignUp ? (
                  <span>By signing up, you agree to Viraasat&apos;s <Link href="/terms" className="text-primary hover:underline font-medium">Terms</Link> & <Link href="/privacy" className="text-primary hover:underline font-medium">Privacy Policy</Link>.</span>
                ) : isArtisan ? (
                  <span>Not registered as a Viraasat Artisan? <Link href="/apply" className="text-primary font-semibold hover:underline">Apply Here</Link></span>
                ) : (
                  <span>Don&apos;t have an account yet? <button type="button" onClick={() => setIsSignUp(true)} className="text-primary font-semibold hover:underline">Sign Up Now</button></span>
                )}
              </div>
            </CardContent>
          </>
        )}

        <div className="border-t border-border bg-muted/30 p-3.5 text-center">
          <Link
            href={isAdmin ? "/login" : isArtisan ? "/login?role=customer" : "/login?role=artisan"}
            className="text-xs text-muted-foreground hover:text-primary font-medium transition-colors inline-flex items-center gap-1"
          >
            {isAdmin
              ? "← Return to Marketplace Shopping"
              : isArtisan
                ? "Looking for Customer shopping? Switch to Customer Login →"
                : "Are you an Artisan partner? Switch to Artisan Studio →"}
          </Link>
        </div>
      </Card>
    </div>
  );
}
