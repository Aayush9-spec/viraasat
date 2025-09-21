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
      <body className="font-sans antialiased text-foreground">
        <div className="relative min-h-screen">
          <div className="wavy-background"></div>
          <nav className="sticky top-0 z-50 bg-transparent">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <div className="flex items-center space-x-8">
                  <ViraasatLogo />
                </div>
                <div className="hidden md:flex items-center space-x-7">
                  <a href="#" className="text-sm font-medium text-foreground hover:text-primary transition-colors">Home</a>
                  <a href="#mission" className="text-sm font-medium text-foreground hover:text-primary transition-colors">Our Mission</a>
                  <a href="#product-grid" className="text-sm font-medium text-foreground hover:text-primary transition-colors">Products</a>
                  <a href="#" className="text-sm font-medium text-foreground hover:text-primary transition-colors">Journal</a>
                   <a href="#" className="text-sm font-medium text-foreground hover:text-primary transition-colors">About Us</a>
                  <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-full px-5">
                    <Link href="/dashboard">For Artisans</Link>
                  </Button>
                </div>
              </div>
            </div>
          </nav>

          <main className="relative z-10">
            {children}
          </main>
        </div>

        <footer className="bg-transparent text-foreground py-16">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-8 items-center">
                    <div>
                        <h3 className="font-heading text-xl font-semibold text-primary mb-2">Empowering Indian Artisans</h3>
                        <p className="text-sm leading-relaxed">A platform to cherish and preserve traditional crafts.</p>
                    </div>
                    <div>
                        <h3 className="font-semibold text-primary mb-2">Subscription</h3>
                        <p className="text-sm mb-3">Join our mailing list for updates.</p>
                        <form className="flex items-center space-x-2">
                            <input type="email" placeholder="Enter your email" className="p-2 text-sm bg-white/50 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-accent text-foreground placeholder-muted-foreground w-full" />
                            <Button type="submit" className="bg-accent text-accent-foreground text-sm font-semibold py-2 rounded-md hover:bg-accent/90 px-4">Subscribe</Button>
                        </form>
                    </div>
                    <div className="flex items-center justify-center md:justify-end space-x-4 text-xl">
                      <div className="flex items-center space-x-2">
                        <a href="#" className="hover:text-accent"><Instagram /></a>
                        <a href="#" className="hover:text-accent"><Facebook /></a>
                        <a href="#" className="hover:text-accent"><Twitter /></a>
                      </div>
                      <div className="flex items-center space-x-2">
                        <a href="#" className="hover:text-accent"><Search /></a>
                        <a href="#" className="hover:text-accent"><ShoppingCart /></a>
                      </div>
                    </div>
                </div>
            </div>
        </footer>
        <Toaster />
      </body>
    </html>
  );
}
