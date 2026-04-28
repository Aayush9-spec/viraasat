import type { Metadata, Viewport } from 'next';
import { Inter, Cormorant_Garamond } from 'next/font/google';
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
import InstallPrompt from '@/components/install-prompt';
import PWALifecycle from '@/components/pwa-lifecycle';
import OnlineStatus from '@/components/online-status';

// Optimize font loading
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
});

const cormorant = Cormorant_Garamond({
  weight: ['600', '700'],
  subsets: ['latin'],
  variable: '--font-heading',
  display: 'swap',
  preload: true,
});

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
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${cormorant.variable}`}>
      <head>
        <link rel="icon" href="/viraasat-logo-full.png" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="font-sans antialiased text-foreground" suppressHydrationWarning>
        <PWALifecycle />
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
  );
}
