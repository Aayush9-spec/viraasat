'use client';
import { useTranslation } from "@/hooks/use-translation";
import { ViraasatLogo } from "./viraasat-logo";
import LanguageSwitcher from "./language-switcher";
import { ThemeSwitcher } from "./theme-switcher";
import { Button } from "./ui/button";
import Link from "next/link";
import { Facebook, Instagram, Search, ShoppingCart, Twitter, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Toaster } from "./ui/toaster";
import VoiceSearch from "./voice-search";
import { useCart } from "@/context/cart-context";
import CartSidebar from "./cart-sidebar";

export function MainContent({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { cartItems, setCartOpen } = useCart();
  const itemCount = cartItems.length;

  return (
    <>
      <div className="relative min-h-screen">
        <div className="parallax-background"></div>
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-8">
                <ViraasatLogo />
                <div className="hidden md:flex items-center space-x-7">
                  <Link href="/shop" className="text-sm font-medium text-gray-600 hover:text-amber-800 transition-colors">{t('nav.shop')}</Link>
                  <a href="/#mission" className="text-sm font-medium text-gray-600 hover:text-amber-800 transition-colors">{t('nav.mission')}</a>
                  <Link href="/orders" className="text-sm font-medium text-gray-600 hover:text-amber-800 transition-colors">{t('nav.orders')}</Link>
                  <a href="#" className="text-sm font-medium text-gray-600 hover:text-amber-800 transition-colors">{t('nav.journal')}</a>
                </div>
              </div>
              <div className="flex items-center space-x-2 md:space-x-5">
                <VoiceSearch />
                <LanguageSwitcher />
                <ThemeSwitcher />
                <Button variant="ghost" size="icon" className="relative text-gray-600 hover:text-amber-800" onClick={() => setCartOpen(true)}>
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      {itemCount}
                    </span>
                  )}
                </Button>
                <Button asChild className="hidden sm:inline-block text-white rounded-md transition-all ease-out duration-300 bg-gradient-to-r from-amber-400 to-orange-500 hover:shadow-lg hover:shadow-orange-500/30 hover:[background-position:15%]">
                  <Link href="/login">{t('nav.login')}</Link>
                </Button>

                {/* Mobile Menu */}
                <div className="md:hidden">
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
                          <Link href="/shop" className="text-lg font-medium hover:text-amber-600 transition-colors">
                            {t('nav.shop')}
                          </Link>
                          <a href="/#mission" className="text-lg font-medium hover:text-amber-600 transition-colors">
                            {t('nav.mission')}
                          </a>
                          <Link href="/orders" className="text-lg font-medium hover:text-amber-600 transition-colors">
                            {t('nav.orders')}
                          </Link>
                          <a href="#" className="text-lg font-medium hover:text-amber-600 transition-colors">
                            {t('nav.journal')}
                          </a>
                        </nav>
                        <div className="border-t pt-6">
                          <Button asChild className="w-full text-white bg-gradient-to-r from-amber-400 to-orange-500 hover:shadow-lg">
                            <Link href="/login">{t('nav.login')}</Link>
                          </Button>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main className="relative z-10">
          {children}
        </main>
      </div>

      <CartSidebar />

      <footer className="bg-neutral-950 border-t border-amber-900/20 pt-16 pb-8 relative overflow-hidden">
        {/* Decorative top gradient */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-900/50 to-transparent" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">

            {/* Brand Column */}
            <div className="col-span-1 md:col-span-1 space-y-4">
              <Link href="/" className="inline-block">
                <span className="font-heading text-3xl font-bold text-amber-100">Viraasat</span>
              </Link>
              <p className="text-amber-200/60 text-sm leading-relaxed font-light">
                Celebrating the timeless art of Indian craftsmanship. Every piece tells a story of heritage, skill, and dedication.
              </p>
              <div className="flex space-x-4 pt-4">
                <a href="https://x.com/aayush03061102" target="_blank" rel="noopener noreferrer" className="p-2 bg-neutral-900 rounded-full text-amber-400 hover:text-white hover:bg-amber-700 transition-all duration-300">
                  <Twitter className="h-4 w-4" />
                </a>
                <a href="#" className="p-2 bg-neutral-900 rounded-full text-amber-400 hover:text-white hover:bg-amber-700 transition-all duration-300">
                  <Facebook className="h-4 w-4" />
                </a>
                <a href="https://www.instagram.com/aasr_233/" target="_blank" rel="noopener noreferrer" className="p-2 bg-neutral-900 rounded-full text-amber-400 hover:text-white hover:bg-amber-700 transition-all duration-300">
                  <Instagram className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Links Column 1 */}
            <div className="col-span-1">
              <h3 className="font-serif text-amber-500 tracking-wider uppercase text-sm mb-6">Discover</h3>
              <ul className="space-y-3 text-sm text-neutral-400">
                <li><Link href="/shop" className="hover:text-amber-200 transition-colors">Our Collection</Link></li>
                <li><Link href="/#mission" className="hover:text-amber-200 transition-colors">The Mission</Link></li>
                <li><Link href="/artisans" className="hover:text-amber-200 transition-colors">Meet the Artisans</Link></li>
                <li><Link href="/journal" className="hover:text-amber-200 transition-colors">Heritage Journal</Link></li>
              </ul>
            </div>

            {/* Links Column 2 */}
            <div className="col-span-1">
              <h3 className="font-serif text-amber-500 tracking-wider uppercase text-sm mb-6">Support</h3>
              <ul className="space-y-3 text-sm text-neutral-400">
                <li><Link href="/faq" className="hover:text-amber-200 transition-colors">FAQ</Link></li>
                <li><Link href="/shipping" className="hover:text-amber-200 transition-colors">Shipping & Returns</Link></li>
                <li><Link href="/contact" className="hover:text-amber-200 transition-colors">Contact Us</Link></li>
                <li><Link href="/privacy" className="hover:text-amber-200 transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>

            {/* Newsletter Column */}
            <div className="col-span-1 md:col-span-1">
              <h3 className="font-serif text-amber-500 tracking-wider uppercase text-sm mb-6">Newsletter</h3>
              <p className="text-neutral-500 text-sm mb-4">Subscribe to receive updates on new arrivals and special offers.</p>
              <div className="flex bg-neutral-900 rounded-md border border-neutral-800 focus-within:border-amber-700 transition-colors p-1">
                <input
                  type="email"
                  placeholder="Your email"
                  className="bg-transparent border-none text-sm text-amber-100 placeholder:text-neutral-600 focus:ring-0 flex-1 px-3"
                />
                <Button size="sm" className="bg-amber-800 hover:bg-amber-700 text-amber-100 h-8">
                  Join
                </Button>
              </div>
            </div>
          </div>

          <div className="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-neutral-600 text-xs">
              &copy; {new Date().getFullYear()} Viraasat. All rights reserved.
            </p>
            <p className="text-neutral-700 text-xs font-serif italic">
              Made with &hearts; for Indian Heritage
            </p>
          </div>
        </div>
      </footer>
      <Toaster />
    </>
  );
}
