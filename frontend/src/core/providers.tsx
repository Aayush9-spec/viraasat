'use client';

import React from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { shadcn } from '@clerk/ui/themes';
import { env } from '@/core/config/env';
import { ThemeProvider } from '@/core/theme-provider';
import { LanguageProvider } from '@/context/language-context';
import { CartProvider } from '@/context/cart-context';
import { WishlistProvider } from '@/context/wishlist-context';
import { Background3D } from '@/components/shared/visuals/background-3d';
import { AuthSync } from '@/features/auth/components/auth-sync';
import PWALifecycle from '@/components/shared/common/pwa-lifecycle';
import InstallPrompt from '@/components/shared/common/install-prompt';
import OnlineStatus from '@/components/shared/common/online-status';
import { ErrorBoundary } from '@/components/shared/common/error-boundary';

export interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ErrorBoundary>
      <ClerkProvider
        publishableKey={env.clerk.publishableKey}
        signInUrl="/login"
        signUpUrl="/signup"
        signInFallbackRedirectUrl="/"
        signUpFallbackRedirectUrl="/select-role"
        allowedRedirectOrigins={[
          env.app.url,
          'https://virrasat.in',
          'https://www.virrasat.in',
          'https://viraasat-eta.vercel.app',
        ].filter(Boolean)}
        appearance={{ theme: shadcn }}
      >
        <PWALifecycle />
        <AuthSync />
        <LanguageProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="clay"
            enableSystem={false}
            storageKey="viraasat-theme"
            disableTransitionOnChange
            themes={["clay", "dark", "light"]}
          >
            <CartProvider>
              <WishlistProvider>
                <Background3D />
                {children}
                <InstallPrompt />
                <OnlineStatus />

              </WishlistProvider>
            </CartProvider>
          </ThemeProvider>
        </LanguageProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}

export default AppProviders;
