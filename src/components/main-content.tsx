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

      <footer className="bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <div className="flex items-center justify-center h-10 w-10 bg-gray-900 text-white font-bold rounded-full text-lg">
            V
          </div>
          <div className="flex space-x-6 text-gray-500">
            <a href="https://x.com/aayush03061102" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900"><Twitter className="h-5 w-5" /></a>
            <a href="#" className="hover:text-gray-900"><Facebook className="h-5 w-5" /></a>
            <a href="https://www.instagram.com/aasr_233/" target="_blank" rel="noopener noreferrer" className="hover:text-gray-900"><Instagram className="h-5 w-5" /></a>
          </div>
        </div>
      </footer>
      <Toaster />
    </>
  );
}
