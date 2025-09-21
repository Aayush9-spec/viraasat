import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ViraasatLogo } from '@/components/viraasat-logo';
import { Button } from '@/components/ui/button';
import { Search, ShoppingCart, Instagram, Facebook, Twitter } from 'lucide-react';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Viraasat AI',
  description: 'A marketplace for artisans, powered by AI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased text-gray-800">
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              <div className="flex items-center space-x-8">
                <ViraasatLogo />
                <div className="hidden md:flex items-center space-x-7">
                  <a href="#products" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">Shop</a>
                  <a href="#mission" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">Our Mission</a>
                  <a href="#" className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">Journal</a>
                </div>
              </div>
              <div className="flex items-center space-x-5">
                <a href="#" className="text-gray-600 hover:text-primary transition-colors">
                  <Search className="h-5 w-5" />
                </a>
                <a href="#" className="text-gray-600 hover:text-primary transition-colors">
                  <ShoppingCart className="h-5 w-5" />
                </a>
                <Button asChild className="hidden sm:inline-block bg-accent text-accent-foreground hover:bg-accent/90">
                  <Link href="/dashboard">Login</Link>
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {children}

        <footer className="bg-slate-800 text-gray-300 py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-8">
                    <div>
                        <h3 className="font-heading text-2xl font-semibold text-white mb-4">Viraasat</h3>
                        <p className="text-sm leading-relaxed">Celebrating and empowering India's rich heritage of artisan communities.</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-white mb-4">Information</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-amber-300 hover:underline">Shop All</a></li>
                            <li><a href="#" className="hover:text-amber-300 hover:underline">Our Story</a></li>
                            <li><a href="#" className="hover:text-amber-300 hover:underline">Journal</a></li>
                            <li><a href="#" className="hover:text-amber-300 hover:underline">Contact</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-white mb-4">Support</h3>
                        <ul className="space-y-2 text-sm">
                            <li><a href="#" className="hover:text-amber-300 hover:underline">FAQs</a></li>
                            <li><a href="#" className="hover:text-amber-300 hover:underline">Shipping & Returns</a></li>
                            <li><a href="#" className="hover:text-amber-300 hover:underline">Privacy Policy</a></li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold text-white mb-4">Stay Connected</h3>
                        <p className="text-sm mb-3">Receive updates on new arrivals and special offers.</p>
                        <form className="flex flex-col space-y-2">
                            <input type="email" placeholder="Enter your email" className="p-2 text-sm bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500 text-white placeholder-gray-400" />
                            <button type="submit" className="bg-amber-600 text-white text-sm font-semibold py-2 rounded-md hover:bg-amber-700 transition-colors">Subscribe</button>
                        </form>
                        <div className="flex space-x-4 mt-6 text-xl">
                            <a href="#" className="hover:text-amber-300"><Instagram /></a>
                            <a href="#" className="hover:text-amber-300"><Facebook /></a>
                            <a href="#" className="hover:text-amber-300"><Twitter /></a>
                        </div>
                    </div>
                </div>
                <div className="text-center text-xs text-gray-400 border-t border-slate-700 pt-8 mt-8">
                    <p>&copy; 2024 Viraasat. All rights reserved. A tribute to handmade elegance.</p>
                </div>
            </div>
        </footer>
        <Toaster />
      </body>
    </html>
  );
}
