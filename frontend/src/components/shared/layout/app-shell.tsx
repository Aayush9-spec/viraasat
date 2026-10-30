'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { Header } from './header';
import { Footer } from './footer';
import CartSidebar from '@/features/cart/components/cart-sidebar';
import { MobileNav } from '@/components/shared/navigation/mobile-nav';
import { Toaster } from '@/components/ui/toaster';

const AIAssistant = dynamic(
  () => import('@/features/ai/components/ai-assistant').then((mod) => ({ default: mod.AIAssistant })),
  { ssr: false }
);

export interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const isStudio = pathname === '/artisan' || pathname.startsWith('/artisan/');

  if (isStudio) {
    return <><div className="relative min-h-screen">{children}</div><AIAssistant /><Toaster /></>;
  }

  return (
    <>
      <div suppressHydrationWarning className="relative min-h-screen">
        <Header />
        <main className="relative z-10">{children}</main>
      </div>
      <Footer />
      <CartSidebar />
      <AIAssistant />
      <Toaster />
      <MobileNav />
    </>
  );
}

export default AppShell;
