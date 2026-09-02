import { ProtectedRoute } from '@/components/auth/protected-route';
import { ArtisanNav } from '@/components/artisan-nav';
import { ViraasatLogo } from '@/components/viraasat-logo';
import { UserNav } from '@/components/user-nav';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function ArtisanLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
              <div className="px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs font-semibold">
                Artisan Business Studio
              </div>
            </div>
            <div className="flex-1 overflow-y-auto">
              <ArtisanNav />
            </div>
            <div className="mt-auto p-4 border-t">
              <Button asChild variant="outline" size="sm" className="w-full justify-center">
                <Link href="/shop">View Public Marketplace</Link>
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
              Artisan Management Hub
            </h1>
            <div className="flex items-center gap-4">
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
