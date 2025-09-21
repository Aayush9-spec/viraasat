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

      <footer className="bg-slate-800 text-gray-300 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-8">
            <div>
              <h3 className="font-heading text-2xl font-semibold text-white mb-4">{t('footer.about.title')}</h3>
              <p className="text-sm leading-relaxed">{t('footer.about.description')}</p>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">{t('footer.information.title')}</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-amber-300 hover:underline">{t('footer.information.shop')}</a></li>
                <li><a href="#" className="hover:text-amber-300 hover:underline">{t('footer.information.story')}</a></li>
                <li><a href="#" className="hover:text-amber-300 hover:underline">{t('footer.information.journal')}</a></li>
                <li><a href="#" className="hover:text-amber-300 hover:underline">{t('footer.information.contact')}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">{t('footer.support.title')}</h3>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-amber-300 hover:underline">{t('footer.support.faq')}</a></li>
                <li><a href="#" className="hover:text-amber-300 hover:underline">{t('footer.support.shipping')}</a></li>
                <li><a href="#" className="hover:text-amber-300 hover:underline">{t('footer.support.privacy')}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-4">{t('footer.connect.title')}</h3>
              <p className="text-sm mb-3">{t('footer.connect.description')}</p>
              <form className="flex flex-col space-y-2">
                <input type="email" placeholder={t('footer.connect.placeholder')} className="p-2 text-sm bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-white placeholder-gray-400" />
                <Button type="submit" className="bg-amber-600 text-white text-sm font-semibold py-2 rounded-md hover:bg-amber-700 transition-colors">{t('footer.connect.subscribe')}</Button>
              </form>
              <div className="flex space-x-4 mt-6 text-xl">
                <a href="#" className="hover:text-amber-300"><Instagram /></a>
                <a href="#" className="hover:text-amber-300"><Facebook /></a>
                <a href="#" className="hover:text-amber-300"><Twitter /></a>
              </div>
            </div>
          </div>
          <div className="text-center text-xs text-gray-400 border-t border-slate-700 pt-8 mt-8">
            <p>{t('footer.copyright')}</p>
          </div>
        </div>
      </footer>
      <Toaster />
    </>
  );
}
