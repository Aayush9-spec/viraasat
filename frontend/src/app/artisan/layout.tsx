'use client';

import { ProtectedRoute } from '@/features/auth/components/protected-route';
import { ArtisanNav } from '@/components/shared/navigation/artisan-nav';
import { ViraasatLogo } from '@/components/shared/visuals/viraasat-logo';
import { UserNav } from '@/components/shared/navigation/user-nav';
import LanguageSwitcher from '@/components/shared/navigation/language-switcher';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useTranslation } from '@/core/hooks/use-translation';

export default function ArtisanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { t } = useTranslation();

  return (
    <ProtectedRoute allowedRoles={['artisan']}>
      <div className="grid min-h-screen w-full md:grid-cols-[240px_1fr] lg:grid-cols-[280px_1fr]">
        {/* Sidebar */}
        <div className="hidden border-r bg-card md:block">
          <div className="flex h-full max-h-screen flex-col gap-2">
            <div className="flex h-16 items-center border-b px-6 justify-between">
              <ViraasatLogo />
            </div>
            <div className="px-4 py-2">
              <div className="px-3 py-1.5 rounded-xl bg-[#5e2c18]/10 border border-[#5e2c18]/20 text-[#5e2c18] dark:bg-amber-950/40 dark:border-amber-800/30 dark:text-amber-300 text-xs font-bold tracking-wider uppercase">
                {t('artisan.studioTitle') || 'Artisan Business Studio'}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ArtisanNav />
            </div>
            <div className="mt-auto p-4 border-t">
              <Button asChild variant="outline" size="sm" className="w-full justify-center">
                <Link href="/shop">{t('artisan.viewMarketplace') || 'View Public Marketplace'}</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex flex-col">
          <header className="flex h-16 items-center gap-4 border-b bg-card px-6 justify-between">
            <div className="md:hidden flex items-center gap-3">
              <ViraasatLogo />
            </div>
            <h1 className="text-lg font-heading font-semibold text-foreground hidden sm:block">
              {t('artisan.managementHub') || 'Artisan Management Hub'}
            </h1>
            <div className="flex items-center gap-3">
              <LanguageSwitcher showLabel />
              <UserNav />
            </div>
          </header>
          <main className="flex flex-1 flex-col gap-6 p-4 md:p-6 bg-background">
            {children}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
