import type { Metadata } from 'next';
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

export const metadata: Metadata = {
  title: 'Viraasat AI',
  description: 'A marketplace for artisans, powered by AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased text-foreground">
        <LanguageProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            themes={['light', 'dark', 'sapphire', 'emerald', 'sunset']}
          >
            <CartProvider>
              <Background3D />
              <MainContent>
                {children}
              </MainContent>
            </CartProvider>
          </ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
