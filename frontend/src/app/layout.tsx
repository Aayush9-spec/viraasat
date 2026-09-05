import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ViraasatLogo } from '@/components/viraasat-logo';
import { Button } from '@/components/ui/button';
import { Search, ShoppingCart, Instagram, Facebook, Twitter, Globe } from 'lucide-react';
import Link from 'next/link';
import { LanguageProvider } from '@/context/language-context';
import LanguageSwitcher from '@/components/language-switcher';
import { MainContent } from '@/components/main-content';
import { CartProvider } from '@/context/cart-context';
import { Background3D } from '@/components/background-3d';
import { ThemeProvider } from '@/components/theme-provider';
import InstallPrompt from '@/components/common/install-prompt';
import PWALifecycle from '@/components/common/pwa-lifecycle';
import OnlineStatus from '@/components/common/online-status';
import { ClerkProvider } from '@clerk/nextjs';
import { AuthSync } from '@/components/auth-sync';

const inter = {
  variable: 'font-sans',
};

const cormorant = {
  variable: 'font-serif',
};

export const metadata: Metadata = {
  title: 'Viraasat - Artisan Marketplace',
  description: 'A premium marketplace for authentic artisan crafts and heritage products, powered by AI.',
  applicationName: 'Viraasat',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Viraasat',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'Viraasat',
    title: 'Viraasat - Artisan Marketplace',
    description: 'A premium marketplace for authentic artisan crafts and heritage products',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Viraasat - Artisan Marketplace',
    description: 'A premium marketplace for authentic artisan crafts and heritage products',
  },
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#8b5cf6' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const clerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'pk_test_d29ya2FibGUtaGFnZmlzaC04ODQ4LmNsZXJrLmFjY291bnRzLmRldiQ';
  return (
    <ClerkProvider publishableKey={clerkKey}>
      <html lang="en" suppressHydrationWarning className={`${inter.variable} ${cormorant.variable}`}>
        <head>
          <meta property="og:image" content="/viraasat-hero-cream.png" />
          <link rel="icon" href="/viraasat-logo-full.png" />
          <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        </head>
        <body className="font-sans antialiased text-foreground" suppressHydrationWarning>
          <script
            dangerouslySetInnerHTML={{
              __html: `window.__SW_BUILD_ID__=${JSON.stringify(
                process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ||
                  process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ||
                  'dev',
              )};`,
            }}
          />
          <PWALifecycle />
          <AuthSync />
          <LanguageProvider>
            <ThemeProvider
              attribute="class"
              defaultTheme="clay"
              enableSystem
              disableTransitionOnChange
              themes={['light', 'dark', 'sapphire', 'emerald', 'sunset', 'clay']}
            >
              <CartProvider>
                <Background3D />
                <MainContent>
                  {children}
                </MainContent>
                <InstallPrompt />
                <OnlineStatus />
              </CartProvider>
            </ThemeProvider>
          </LanguageProvider>
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}
