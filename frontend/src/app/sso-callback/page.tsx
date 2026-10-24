"use client";

import { useEffect, useState } from "react";
import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { STORAGE_KEYS } from "@/core/config/constants";

export default function SSOCallbackPage() {
  const [isArtisan, setIsArtisan] = useState(() => {
    if (typeof window !== "undefined") {
      const savedRole = localStorage.getItem(STORAGE_KEYS.SESSION_ROLE);
      return savedRole === "artisan";
    }
    return false;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedRole = localStorage.getItem(STORAGE_KEYS.SESSION_ROLE);
      setIsArtisan(savedRole === "artisan");
    }
  }, []);

  const targetUrl = isArtisan ? "/artisan/dashboard" : "/shop";
  const continueUrl = isArtisan ? "/signup/artisan" : "/select-role";
  const loginUrl = isArtisan ? "/login/artisan" : "/login/customer";
  const signupUrl = isArtisan ? "/signup/artisan" : "/signup/customer";

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-background">
      <div className="text-center space-y-4">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground font-medium">
          {isArtisan ? "Completing Artisan Authentication..." : "Completing Google Sign In..."}
        </p>
        <AuthenticateWithRedirectCallback
          signInForceRedirectUrl={targetUrl}
          signUpForceRedirectUrl={targetUrl}
          signInFallbackRedirectUrl={targetUrl}
          signUpFallbackRedirectUrl={targetUrl}
          continueSignUpUrl={continueUrl}
          signInUrl={loginUrl}
          signUpUrl={signupUrl}
        />
      </div>
    </div>
  );
}
