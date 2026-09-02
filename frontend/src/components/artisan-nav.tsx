'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  UserCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const artisanNavItems = [
  { href: '/artisan/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/artisan/products', label: 'Products', icon: Package },
  { href: '/artisan/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/artisan/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/artisan/ai-tools', label: 'AI Tools', icon: Sparkles },
  { href: '/artisan/business-advisor', label: 'Business Advisor', icon: TrendingUp },
  { href: '/artisan/provenance', label: 'Provenance', icon: ShieldCheck },
  { href: '/dashboard/profile', label: 'Profile', icon: UserCircle },
];

export function ArtisanNav() {
  const pathname = usePathname();

  return (
    <nav className="grid items-start gap-1.5 px-2 text-sm font-medium lg:px-4 py-2">
      {artisanNavItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || (href !== '/artisan/dashboard' && pathname.startsWith(href));
        return (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-muted-foreground transition-all hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30',
              isActive && 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 font-semibold shadow-sm'
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
