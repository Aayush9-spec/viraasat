'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { ShoppingCart, Menu, LogOut, User, LayoutDashboard, Package, Heart, Sparkles, ShoppingBag, Shield, Smartphone } from 'lucide-react';
import { useTranslation } from '@/core/hooks/use-translation';
import { useCart } from '@/context/cart-context';
import { useUserRole } from '@/features/auth/hooks/use-user-role';
import { useUser, UserButton, useClerk } from '@clerk/nextjs';
import { ViraasatLogo } from '@/components/shared/visuals/viraasat-logo';
import LanguageSwitcher from '@/components/shared/navigation/language-switcher';
import { ThemeSwitcher } from '@/components/shared/navigation/theme-switcher';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import VoiceSearch from '@/features/ai/components/voice-search';
import { NotificationBell } from '@/components/shared/navigation/notification-bell';

export function Header() {
  const { t } = useTranslation();
  const { cartItems, setCartOpen } = useCart();
  const itemCount = cartItems.length;
  const { isArtisan, isAdmin } = useUserRole();
  const { isSignedIn, user } = useUser();
  const clerk = useClerk();
  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [localUser, setLocalUser] = useState<{ id?: string; name?: string; email?: string; role?: string } | null>(null);
  const [isClientAuth, setIsClientAuth] = useState(false);

  useEffect(() => {
    setMounted(true);
    const syncAuth = () => {
      if (typeof window !== 'undefined') {
        const hasRole = localStorage.getItem('viraasat_session_role');
        const hasUid = localStorage.getItem('viraasat_session_uid');
        const demoStr = localStorage.getItem('viraasat_demo_user');
        let parsed = null;
        if (demoStr) {
          try {
            parsed = JSON.parse(demoStr);
          } catch {
            // ignore
          }
        } else if (hasRole || hasUid) {
          parsed = { id: hasUid || undefined, role: hasRole || undefined };
        }
        setLocalUser(parsed);
        setIsClientAuth(Boolean(isSignedIn || hasRole || hasUid || parsed));
      }
    };

    syncAuth();
    window.addEventListener('storage', syncAuth);
    window.addEventListener('viraasat_auth_change', syncAuth);
    return () => {
      window.removeEventListener('storage', syncAuth);
      window.removeEventListener('viraasat_auth_change', syncAuth);
    };
  }, [isSignedIn, pathname]);

  const handleLogout = async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('viraasat_session_role');
      localStorage.removeItem('viraasat_session_uid');
      localStorage.removeItem('viraasat_demo_user');
      window.dispatchEvent(new Event('storage'));
      window.dispatchEvent(new Event('viraasat_auth_change'));
    }
    setLocalUser(null);
    setIsClientAuth(false);
    try {
      if (clerk?.signOut) {
        await clerk.signOut({ redirectUrl: '/' });
      }
    } catch (e) {
      console.warn('Sign out notice:', e);
    }
    router.push('/');
    router.refresh();
  };

  const isArtisanRole = mounted ? Boolean(isArtisan) : false;
  const isAdminRole = mounted ? Boolean(isAdmin || localUser?.role === 'admin') : false;
  const displayName = localUser?.name || user?.fullName || (isAdminRole ? 'Administrator' : isArtisanRole ? 'Artisan Partner' : 'Valued Customer');
  const displayEmail = localUser?.email || user?.primaryEmailAddress?.emailAddress || 'Active Session';
  const initialLetter = displayName ? displayName.charAt(0).toUpperCase() : (isAdminRole ? 'A' : isArtisanRole ? 'A' : 'C');

  return (
    <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="flex min-w-0 items-center justify-between gap-3 py-3 sm:py-4">
          {/* Logo and Primary Nav */}
          <div className="flex min-w-0 items-center gap-8">
            <ViraasatLogo className="shrink-0" />
            <div className="hidden lg:flex items-center space-x-5 xl:space-x-8 text-sm font-medium tracking-wide">
              <Link href="/" className="text-foreground/80 hover:text-primary transition-colors">
                {t('nav.home')}
              </Link>
              <Link href="/#heritage-crafts" className="text-foreground/80 hover:text-primary transition-colors">
                {t('nav.heritageCrafts') || 'Heritage Crafts'}
              </Link>
              <Link href="/#artisan-lineage" className="text-foreground/80 hover:text-primary transition-colors">
                {t('nav.masterArtisans') || 'Master Artisans'}
              </Link>
              <Link href="/#curated-treasures" className="text-foreground/80 hover:text-primary transition-colors">
                {t('nav.curatedHeirlooms') || 'Curated Heirlooms'}
              </Link>
              <Link href="/about" className="text-foreground/80 hover:text-primary transition-colors">
                {t('nav.aboutUs') || 'About Us'}
              </Link>
              <Link href="/#why-viraasat" className="text-foreground/80 hover:text-primary transition-colors">
                {t('nav.philosophy') || 'Philosophy'}
              </Link>
              <Link href="/shop" className="text-foreground/80 hover:text-primary transition-colors font-semibold text-primary">
                {t('nav.shop')}
              </Link>
              <Link href="/psit" className="text-foreground/80 hover:text-primary transition-colors">
                PSIT Showcase
              </Link>
              <Link href="/download" className="text-foreground/80 hover:text-primary transition-colors font-semibold flex items-center gap-1">
                <Smartphone className="w-3.5 h-3.5 text-[#C59B4B]" />
                <span>{t('nav.app') || 'App'}</span>
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

            {/* Role Switcher CTA */}
            {mounted && isAdminRole ? (
              <Link
                href="/admin"
                className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider py-1.5 px-3 rounded-full border border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400 hover:bg-red-600 hover:text-white transition-all duration-300"
              >
                <Shield className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                <span>{t('nav.adminConsole') || 'Admin Console'}</span>
              </Link>
            ) : mounted && isSignedIn && isArtisan ? (
              <Link
                href="/switch-role?to=buyer"
                className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider py-1.5 px-3 rounded-full border border-amber-600/40 bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-600 hover:text-white transition-all duration-300"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>{t('nav.customerShop') || 'Customer Shop'}</span>
              </Link>
            ) : (
              <Link
                href={mounted && isSignedIn ? "/switch-role?to=artisan" : "/login/artisan"}
                className="hidden lg:inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider py-1.5 px-3 rounded-full border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-all duration-300"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#C59B4B]" />
                <span>{t('nav.artisanPortal') || 'Artisan Portal'}</span>
              </Link>
            )}

            {/* Wishlist Link */}
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="text-foreground/70 hover:text-primary relative"
              aria-label="Wishlist"
            >
              <Link href="/wishlist">
                <Heart className="h-5 w-5" />
              </Link>
            </Button>

            {/* In-App Notifications for Reviews and Order updates */}
            <NotificationBell />

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
            {mounted && isClientAuth ? (
              <div className="flex items-center">
                {isSignedIn ? (
                  <UserButton
                    appearance={{
                      elements: {
                        userButtonAvatarBox: "h-9 w-9 ring-2 ring-primary/20 hover:ring-primary/40 transition-all",
                        userButtonPopoverCard: "shadow-2xl border border-border/80 rounded-2xl p-1 bg-[#FAF7F2] dark:bg-[#1C1815] text-foreground z-[9999] backdrop-blur-none",
                        userButtonPopoverFooter: "hidden",
                        footerAction: "hidden",
                        footer: "hidden",
                      },
                    }}
                  >
                    <UserButton.MenuItems>
                      {isAdminRole && (
                        <UserButton.Link
                          label="Admin Console"
                          labelIcon={<Shield className="h-4 w-4 text-red-600" />}
                          href="/admin"
                        />
                      )}
                      <UserButton.Link
                        label={isArtisan ? "Artisan Dashboard" : "My Dashboard"}
                        labelIcon={<LayoutDashboard className="h-4 w-4 text-primary" />}
                        href={isArtisan ? "/artisan/dashboard" : "/dashboard"}
                      />
                      <UserButton.Link
                        label={isArtisan ? "Artisan Studio Profile" : "Profile & Address"}
                        labelIcon={<User className="h-4 w-4 text-emerald-600" />}
                        href={isArtisan ? "/artisan/profile" : "/dashboard/profile"}
                      />
                      <UserButton.Link
                        label={isArtisan ? "Artisan Products" : "My Orders"}
                        labelIcon={<Package className="h-4 w-4 text-amber-600" />}
                        href={isArtisan ? "/artisan/products" : "/orders"}
                      />
                      <UserButton.Link
                        label={isArtisan ? "Switch to Customer Mode" : "My Wishlist"}
                        labelIcon={isArtisan ? <ShoppingBag className="h-4 w-4 text-amber-600" /> : <Heart className="h-4 w-4 text-rose-500" />}
                        href={isArtisan ? "/switch-role?to=buyer" : "/wishlist"}
                      />
                      {!isArtisan && (
                        <UserButton.Link
                          label="Switch to Artisan Studio"
                          labelIcon={<Sparkles className="h-4 w-4 text-amber-500" />}
                          href="/switch-role?to=artisan"
                        />
                      )}
                      <UserButton.Action label="manageAccount" />
                    </UserButton.MenuItems>
                  </UserButton>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="relative h-9 w-9 rounded-full p-0 border border-primary/20 hover:bg-primary/10 transition-colors"
                      >
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-amber-700 via-primary to-amber-900 text-white font-bold text-xs uppercase shadow-sm">
                          {initialLetter}
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-semibold leading-none">{displayName}</p>
                          <p className="text-xs leading-none text-muted-foreground">{displayEmail}</p>
                          <div className="pt-1">
                            <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                              {isAdminRole ? 'Admin' : isArtisanRole ? 'Artisan' : 'Customer'}
                            </span>
                          </div>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {isAdminRole ? (
                        <>
                          <DropdownMenuItem asChild>
                            <Link href="/admin" className="cursor-pointer font-semibold text-red-600 flex items-center gap-1.5">
                              <Shield className="h-4 w-4" /> Admin Console
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/artisan/dashboard" className="cursor-pointer">Artisan Dashboard</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/shop" className="cursor-pointer">Browse Shop</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/switch-role?to=buyer" className="cursor-pointer text-amber-600 font-medium">Switch to Customer Mode</Link>
                          </DropdownMenuItem>
                        </>
                      ) : isArtisanRole ? (
                        <>
                          <DropdownMenuItem asChild>
                            <Link href="/artisan/dashboard" className="cursor-pointer">Artisan Dashboard</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/artisan/products" className="cursor-pointer">Manage Products</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/artisan/orders" className="cursor-pointer">Artisan Orders</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/switch-role?to=buyer" className="cursor-pointer text-amber-600 font-medium">Switch to Customer Mode</Link>
                          </DropdownMenuItem>
                        </>
                      ) : (
                        <>
                          <DropdownMenuItem asChild>
                            <Link href="/shop" className="cursor-pointer">Browse Shop</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/orders" className="cursor-pointer">My Orders</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/wishlist" className="cursor-pointer">My Wishlist</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href="/switch-role?to=artisan" className="cursor-pointer text-amber-600 font-medium">Switch to Artisan Studio</Link>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log Out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2 sm:gap-3">
                <Button variant="ghost" asChild className="text-foreground/70 hover:text-primary transition-colors text-sm font-medium">
                  <Link href="/login">{t('nav.login')}</Link>
                </Button>
                <Button asChild className="text-primary-foreground rounded-md transition-all ease-out duration-300 bg-primary hover:bg-primary/90 text-sm font-medium">
                  <Link href="/login?mode=signup">{t('nav.signUp')}</Link>
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
                  <div className="flex flex-col gap-6 mt-6">
                    <div className="flex items-center justify-between p-2 rounded-xl bg-muted/40 border border-border">
                      <span className="text-xs font-medium text-muted-foreground">{t('common.language') || 'Language'}:</span>
                      <LanguageSwitcher showLabel />
                    </div>
                    <nav className="flex flex-col space-y-4">
                      {isAdminRole && (
                        <Link href="/admin" className="text-lg font-semibold text-red-600 hover:text-red-700 transition-colors flex items-center gap-2">
                          <Shield className="h-5 w-5" /> {t('nav.adminConsole') || 'Admin Console'}
                        </Link>
                      )}
                      <Link href="/shop" className="text-lg font-medium hover:text-primary transition-colors">
                        {t('nav.shop')}
                      </Link>
                      <Link href="/psit" className="text-lg font-medium hover:text-primary transition-colors">
                        PSIT Showcase
                      </Link>
                      <Link href="/#heritage-crafts" className="text-lg font-medium hover:text-primary transition-colors">
                        {t('nav.heritageCrafts') || 'Heritage Crafts'}
                      </Link>
                      <Link href="/#artisan-lineage" className="text-lg font-medium hover:text-primary transition-colors">
                        {t('nav.masterArtisans') || 'Master Artisans'}
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
                      {isClientAuth ? (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3 px-2 py-1">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-amber-700 via-primary to-amber-900 text-white font-bold text-sm uppercase">
                              {initialLetter}
                            </div>
                            <div className="flex flex-col text-left">
                              <span className="text-sm font-semibold text-foreground">{displayName}</span>
                              <span className="text-xs text-muted-foreground">{displayEmail}</span>
                            </div>
                          </div>
                          <Button variant="outline" onClick={handleLogout} className="w-full text-destructive hover:text-destructive">
                            <LogOut className="mr-2 h-4 w-4" />
                            {t('nav.logout') || 'Log Out'}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-3">
                          <Button variant="outline" asChild className="w-full">
                            <Link href="/login">{t('nav.login') || 'Login'}</Link>
                          </Button>
                          <Button asChild className="w-full text-primary-foreground bg-primary hover:bg-primary/90">
                            <Link href="/login?mode=signup">{t('nav.signUp') || 'Sign Up'}</Link>
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
