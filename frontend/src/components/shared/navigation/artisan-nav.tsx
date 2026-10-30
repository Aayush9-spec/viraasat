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
  Star,
} from 'lucide-react';
import { cn } from '@/core/utils/utils';
import { useTranslation } from '@/core/hooks/use-translation';

export const artisanNavItems = [
  { href: '/artisan/dashboard', key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/artisan/products', key: 'products', label: 'Products', icon: Package },
  { href: '/artisan/orders', key: 'orders', label: 'Orders', icon: ShoppingCart },
  { href: '/artisan/reviews', key: 'reviews', label: 'Reviews & Feedback', icon: Star },
  { href: '/artisan/analytics', key: 'analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/artisan/ai-tools', key: 'aiTools', label: 'AI Tools', icon: Sparkles },
  { href: '/artisan/business-advisor', key: 'businessAdvisor', label: 'Business Advisor', icon: TrendingUp },
  { href: '/artisan/provenance', key: 'provenance', label: 'Provenance', icon: ShieldCheck },
  { href: '/artisan/profile', key: 'profile', label: 'Profile', icon: UserCircle },
];

export function ArtisanNav() {
  const pathname = usePathname();
  const { t } = useTranslation();

  return (
    <nav className="grid items-start gap-1.5 px-2 text-sm font-medium lg:px-4 py-2">
      {artisanNavItems.map(({ href, key, label, icon: Icon }) => {
        const isActive = pathname === href || (href !== '/artisan/dashboard' && pathname.startsWith(href));
        const translatedLabel = t(`artisan.${key}`) || label;
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
            <span>{translatedLabel}</span>
          </Link>
        );
      })}
    </nav>
  );
}
