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
import { cn } from '@/core/utils/utils';

export const artisanNavItems = [
  { href: '/artisan/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/artisan/products', label: 'Products', icon: Package },
  { href: '/artisan/orders', label: 'Orders', icon: ShoppingCart },
  { href: '/artisan/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/artisan/ai-tools', label: 'AI Tools', icon: Sparkles },
  { href: '/artisan/business-advisor', label: 'Business Advisor', icon: TrendingUp },
  { href: '/artisan/provenance', label: 'Provenance', icon: ShieldCheck },
  { href: '/artisan/profile', label: 'Profile', icon: UserCircle },
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
              'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-muted-foreground transition-all duration-200 hover:text-foreground hover:bg-amber-900/10 dark:hover:bg-amber-950/40',
              isActive && 'bg-[#5e2c18] text-amber-50 font-semibold shadow-md dark:bg-amber-950/90 dark:text-amber-100 dark:border dark:border-amber-800/40'
            )}
          >
            <Icon className={cn('h-4 w-4 transition-colors', isActive ? 'text-amber-300 dark:text-amber-400' : 'text-muted-foreground/70')} />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
