'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Store } from 'lucide-react';
import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { ArtisanNav } from '@/components/shared/navigation/artisan-nav';
import { ViraasatLogo } from '@/components/shared/visuals/viraasat-logo';
import { UserNav } from '@/components/shared/navigation/user-nav';
import LanguageSwitcher from '@/components/shared/navigation/language-switcher';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useTranslation } from '@/core/hooks/use-translation';

export default function ArtisanLayout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { setMenuOpen(false); }, [pathname]);

  return (
    <ProtectedRoute allowedRoles={['artisan', 'admin']}>
      <div className="grid min-h-screen w-full md:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="sticky top-0 hidden h-dvh flex-col border-r bg-card md:flex">
          <div className="flex h-16 shrink-0 items-center border-b px-6"><ViraasatLogo /></div>
          <p className="mx-4 mb-3 mt-5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-primary">
            {t('artisan.studioTitle') || 'Artisan Business Studio'}
          </p>
          <div className="min-h-0 flex-1 overflow-y-auto"><ArtisanNav /></div>
          <p className="border-t px-6 py-4 text-xs leading-relaxed text-muted-foreground">Your craft. Your business.</p>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between gap-2 border-b bg-card px-3 md:px-6">
            <div className="flex min-w-0 items-center gap-2">
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="shrink-0 md:hidden" aria-label="Open studio menu"><Menu className="h-5 w-5" /></Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[min(320px,90vw)] overflow-y-auto p-0">
                  <SheetHeader className="border-b p-6 text-left">
                    <SheetTitle className="font-serif text-2xl text-primary">Viraasat</SheetTitle>
                    <SheetDescription>Artisan Business Studio</SheetDescription>
                  </SheetHeader>
                  <div className="py-4"><ArtisanNav onNavigate={() => setMenuOpen(false)} /></div>
                </SheetContent>
              </Sheet>
              <span className="font-serif text-xl font-bold text-primary md:hidden">Viraasat</span>
              <p className="hidden font-heading text-lg font-semibold md:block">{t('artisan.managementHub') || 'Artisan Management Hub'}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1 sm:gap-3">
              <Button asChild variant="outline" size="sm" className="gap-2 border-primary/20 text-primary">
                <Link href="/shop"><Store aria-hidden="true" className="h-4 w-4" /><span className="hidden sm:inline">Customer shop</span><span className="sm:hidden">Shop</span></Link>
              </Button>
              <LanguageSwitcher />
              <UserNav />
            </div>
          </header>
          <main id="studio-content" className="flex min-w-0 flex-1 flex-col gap-6 bg-background p-4 md:p-6 xl:p-8">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
