'use client';
import { useTranslation } from "@/hooks/use-translation";
import { ViraasatLogo } from "./viraasat-logo";
import LanguageSwitcher from "./language-switcher";
import { Button } from "./ui/button";
import Link from "next/link";
import { Facebook, Instagram, Search, ShoppingCart, Twitter } from "lucide-react";
import { Toaster } from "./ui/toaster";

export function MainContent({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();

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
                  <a href="#products" className="text-sm font-medium text-gray-600 hover:text-amber-800 transition-colors">{t('nav.shop')}</a>
                  <a href="#mission" className="text-sm font-medium text-gray-600 hover:text-amber-800 transition-colors">{t('nav.mission')}</a>
                  <a href="#" className="text-sm font-medium text-gray-600 hover:text-amber-800 transition-colors">{t('nav.journal')}</a>
                </div>
              </div>
              <div className="flex items-center space-x-5">
                <LanguageSwitcher />
                <a href="#" className="text-gray-600 hover:text-amber-800 transition-colors">
                  <Search className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-600 hover:text-amber-800 transition-colors">
                  <ShoppingCart className="h-5 w-5" />
                </a>
                <Button asChild className="hidden sm:inline-block text-white rounded-md transition-all ease-out duration-300 bg-gradient-to-r from-amber-400 to-orange-500 hover:shadow-lg hover:shadow-orange-500/30 hover:[background-position:15%]">
                  <Link href="/dashboard">{t('nav.login')}</Link>
                </Button>
              </div>
            </div>
          </div>
        </nav>

        <main className="relative z-10">
          {children}
        </main>
      </div>

      <footer className="bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <div className="flex items-center justify-center h-10 w-10 bg-gray-900 text-white font-bold rounded-full text-lg">
                V
            </div>
            <div className="flex space-x-6 text-gray-500">
                <a href="#" className="hover:text-gray-900"><Twitter className="h-5 w-5" /></a>
                <a href="#" className="hover:text-gray-900"><Facebook className="h-5 w-5" /></a>
                <a href="#" className="hover:text-gray-900"><Instagram className="h-5 w-5" /></a>
                <a href="#" className="hover:text-gray-900"><ShoppingCart className="h-5 w-5" /></a>
            </div>
        </div>
      </footer>
      <Toaster />
    </>
  );
}
