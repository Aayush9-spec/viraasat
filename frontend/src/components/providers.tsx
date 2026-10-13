'use client';

import React from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { shadcn } from '@clerk/ui/themes';
import { env } from '@/config/env';
import { ThemeProvider } from '@/components/theme-provider';
import { LanguageProvider } from '@/context/language-context';
import { CartProvider } from '@/context/cart-context';
import { WishlistProvider } from '@/context/wishlist-context';
import { Background3D } from '@/components/background-3d';
import { AuthSync } from '@/components/auth-sync';
import PWALifecycle from '@/components/common/pwa-lifecycle';
import InstallPrompt from '@/components/common/install-prompt';
import OnlineStatus from '@/components/common/online-status';
import { Toaster } from '@/components/ui/toaster';
import { ErrorBoundary } from '@/components/common/error-boundary';

export interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ErrorBoundary>
      <ClerkProvider
        publishableKey={env.clerk.publishableKey}
        allowedRedirectOrigins={[env.app.url]}
        appearance={{ theme: shadcn }}
      >
        <PWALifecycle />
        <AuthSync />
        <LanguageProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="clay"
            enableSystem
            disableTransitionOnChange
            themes={['light', 'dark', 'clay']}
          >
            <CartProvider>
              <WishlistProvider>
                <Background3D />
                {children}
                <InstallPrompt />
                <OnlineStatus />
                <Toaster />
              </WishlistProvider>
            </CartProvider>
          </ThemeProvider>
        </LanguageProvider>
      </ClerkProvider>
    </ErrorBoundary>
  );
}

export default AppProviders;
