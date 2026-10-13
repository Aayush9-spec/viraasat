'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Menu } from 'lucide-react';
import { useTranslation } from '@/hooks/use-translation';
import { useCart } from '@/context/cart-context';
import { useUserRole } from '@/hooks/use-user-role';
import { useUser, UserButton } from '@clerk/nextjs';
import { ViraasatLogo } from '@/components/viraasat-logo';
import LanguageSwitcher from '@/components/language-switcher';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import VoiceSearch from '@/features/ai/components/voice-search';

export function Header() {
  const { t } = useTranslation();
  const { cartItems, setCartOpen } = useCart();
  const itemCount = cartItems.length;
  const { isArtisan } = useUserRole();
  const { isSignedIn } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isArtisanRole = mounted ? isArtisan : false;

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center justify-between gap-3 py-3 sm:py-4">
          {/* Logo and Primary Nav */}
          <div className="flex min-w-0 items-center gap-8">
            <ViraasatLogo className="shrink-0" />
            <div className="hidden xl:flex items-center space-x-7">
              <Link href="/" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors">
                {t('nav.home')}
              </Link>
              <Link href="/shop" className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors">
                {t('nav.shop')}
              </Link>
              {isArtisanRole && (
                <Link
                  href="/artisan/dashboard"
                  className="text-sm font-semibold text-primary hover:text-primary/80 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 dark:bg-amber-950/40 dark:border-amber-800/30 dark:text-amber-300 transition-colors"
                >
                  {t('nav.artisan')}
                </Link>
              )}
              <Link
                href={isArtisanRole ? '/artisan/products' : '/shop'}
                className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
              >
                {t('nav.products')}
              </Link>
              <Link
                href={isArtisanRole ? '/artisan/orders' : '/orders'}
                className="text-sm font-medium text-foreground/70 hover:text-primary transition-colors"
              >
                {t('nav.orders')}
              </Link>
            </div>
          </div>

          {/* Action Toolbar */}
          <div className="flex shrink-0 items-center space-x-1 sm:space-x-3 xl:space-x-5">
            <div className="hidden sm:block">
              <VoiceSearch />
            </div>
            <div className="hidden sm:block">
              <LanguageSwitcher />
            </div>
            <div className="hidden sm:block">
              <ThemeSwitcher />
            </div>

            {/* Cart Button */}
            <Button
              variant="ghost"
              size="icon"
              className="relative text-foreground/70 hover:text-primary"
              onClick={() => setCartOpen(true)}
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                  {itemCount}
                </span>
              )}
            </Button>

            {/* User Profile / Auth Links */}
            {isSignedIn ? (
              <div className="flex items-center">
                <UserButton />
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 sm:gap-3">
                <Button variant="ghost" asChild className="text-foreground/70 hover:text-primary transition-colors text-sm font-medium">
                  <Link href="/login">{t('nav.login')}</Link>
                </Button>
                <Button asChild className="text-primary-foreground rounded-md transition-all ease-out duration-300 bg-primary hover:bg-primary/90 text-sm font-medium">
                  <Link href="/login">{t('nav.signUp')}</Link>
                </Button>
              </div>
            )}

            {/* Mobile Drawer Trigger */}
            <div className="xl:hidden">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="-mr-2">
                    <Menu className="h-6 w-6" />
                    <span className="sr-only">Toggle menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[80vw] sm:w-[350px]">
                  <SheetHeader>
                    <SheetTitle className="text-left font-heading text-2xl">Menu</SheetTitle>
                  </SheetHeader>
                  <div className="flex flex-col gap-6 mt-8">
                    <nav className="flex flex-col space-y-4">
                      <Link href="/shop" className="text-lg font-medium hover:text-primary transition-colors">
                        {t('nav.shop')}
                      </Link>
                      <Link href="/#mission" className="text-lg font-medium hover:text-primary transition-colors">
                        {t('nav.mission')}
                      </Link>
                      <Link href="/orders" className="text-lg font-medium hover:text-primary transition-colors">
                        {t('nav.orders')}
                      </Link>
                      <Link href="/journal" className="text-lg font-medium hover:text-primary transition-colors">
                        {t('nav.journal')}
                      </Link>
                    </nav>
                    <div className="border-t pt-6">
                      {isSignedIn ? (
                        <div className="flex justify-center py-2">
                          <UserButton />
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <Button variant="outline" asChild className="w-full">
                            <Link href="/login">{t('nav.login') || 'Login'}</Link>
                          </Button>
                          <Button asChild className="w-full text-primary-foreground bg-primary hover:bg-primary/90">
                            <Link href="/login">Sign Up</Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Header;
