import { DashboardNav } from '@/components/dashboard-nav';
import { DashboardHeader } from '@/components/dashboard-header';
import { ViraasatLogo } from '@/components/viraasat-logo';
import { UserNav } from '@/components/user-nav';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = (children as any)?.props?.childProp?.segment || '';
  const pageTitles: { [key: string]: string } = {
    'products': 'Products',
    'orders': 'Orders',
    'profile': 'Profile',
    'new': 'New Product',
    'edit': 'Edit Product'
  }
  const title = pageTitles[pathname] || 'Dashboard'

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <div className="hidden border-r bg-card md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <ViraasatLogo />
          </div>
          <div className="flex-1">
            <DashboardNav />
          </div>
          <div className="mt-auto p-4">
             <Button asChild size="sm" className="w-full">
                <Link href="/">View Marketplace</Link>
            </Button>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <DashboardHeader title={title} />
        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
