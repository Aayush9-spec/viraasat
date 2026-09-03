'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ShoppingBag, ShoppingCart, Heart, User, Sparkles } from 'lucide-react';
import { useCart } from '@/context/cart-context';
import { useUserRole } from '@/hooks/use-user-role';
import { cn } from '@/lib/utils';

export function MobileNav() {
  const pathname = usePathname();
  const { cartItems, setCartOpen } = useCart();
  const itemCount = cartItems.length;
  const { isArtisan } = useUserRole();

  const accountHref = isArtisan ? '/artisan/dashboard' : '/dashboard';

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Shop', href: '/shop', icon: ShoppingBag },
    {
      label: 'Cart',
      onClick: () => setCartOpen(true),
      icon: ShoppingCart,
      badge: itemCount > 0 ? itemCount : null,
    },
    { label: 'Wishlist', href: '/wishlist', icon: Heart },
    { label: isArtisan ? 'Portal' : 'Account', href: accountHref, icon: isArtisan ? Sparkles : User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/90 backdrop-blur-lg border-t border-border/60 py-2 px-4 md:hidden shadow-lg transition-all duration-300">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.href ? pathname === item.href : false;

          if (item.onClick) {
            return (
              <button
                key={item.label}
                onClick={item.onClick}
                className={cn(
                  "relative flex flex-col items-center justify-center space-y-1 py-1 px-3 rounded-xl transition-all duration-200 text-foreground/70 hover:text-primary active:scale-95"
                )}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {item.badge !== null && (
                    <span className="absolute -top-1.5 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
              </button>
            );
          }

          return (
            <Link
              key={item.label}
              href={item.href!}
              className={cn(
                "relative flex flex-col items-center justify-center space-y-1 py-1 px-3 rounded-xl transition-all duration-200 active:scale-95",
                isActive
                  ? "text-primary font-bold"
                  : "text-foreground/70 hover:text-primary"
              )}
            >
              <Icon className={cn("h-5 w-5", isActive && "text-primary scale-110 transition-transform")} />
              <span className="text-[10px] font-medium tracking-tight">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-0 w-1 h-1 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
