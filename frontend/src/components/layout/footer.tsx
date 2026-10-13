'use client';

import Link from 'next/link';
import { Twitter, Facebook, Instagram } from 'lucide-react';
import { NewsletterForm } from '@/components/newsletter-form';

export function Footer() {
  return (
    <footer className="bg-secondary/50 border-t border-primary/20 pt-16 pb-8 relative overflow-hidden">
      {/* Decorative top gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-1 space-y-4">
            <Link href="/" className="inline-block">
              <span className="font-heading text-3xl font-bold text-foreground">Viraasat</span>
            </Link>
            <p className="text-foreground/60 text-sm leading-relaxed font-light">
              Celebrating the timeless art of Indian craftsmanship. Every piece tells a story of heritage, skill, and dedication.
            </p>
            <div className="flex space-x-4 pt-4">
              <a
                href="https://x.com/aayush03061102"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="p-2 bg-background rounded-full text-primary hover:text-primary/80 hover:bg-secondary transition-all duration-300"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Facebook"
                className="p-2 bg-background rounded-full text-primary hover:text-primary/80 hover:bg-secondary transition-all duration-300"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://www.instagram.com/aasr_233/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="p-2 bg-background rounded-full text-primary hover:text-primary/80 hover:bg-secondary transition-all duration-300"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Discover Links */}
          <div className="col-span-1">
            <h3 className="font-serif text-primary tracking-wider uppercase text-sm mb-6">Discover</h3>
            <ul className="space-y-3 text-sm text-foreground/60">
              <li>
                <Link href="/shop" className="hover:text-primary transition-colors">
                  Our Collection
                </Link>
              </li>
              <li>
                <Link href="/#mission" className="hover:text-primary transition-colors">
                  The Mission
                </Link>
              </li>
              <li>
                <Link href="/artisans" className="hover:text-primary transition-colors">
                  Meet the Artisans
                </Link>
              </li>
              <li>
                <Link href="/journal" className="hover:text-primary transition-colors">
                  Heritage Journal
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div className="col-span-1">
            <h3 className="font-serif text-primary tracking-wider uppercase text-sm mb-6">Support</h3>
            <ul className="space-y-3 text-sm text-foreground/60">
              <li>
                <Link href="/faq" className="hover:text-primary transition-colors">
                  Help & FAQs
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-primary transition-colors">
                  Shipping & Customs
                </Link>
              </li>
              <li>
                <Link href="/refund" className="hover:text-primary transition-colors">
                  Returns & Refunds
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-primary transition-colors">
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          {/* Newsletter Column */}
          <div className="col-span-1">
            <h3 className="font-serif text-primary tracking-wider uppercase text-sm mb-6">Stay Connected</h3>
            <p className="text-foreground/60 text-sm mb-4 leading-relaxed font-light">
              Subscribe to discover artisan tales, craft histories, and early access to curated collections.
            </p>
            <NewsletterForm />
          </div>
        </div>

        <div className="border-t border-border/40 pt-8 flex flex-col md:flex-row justify-between items-center text-xs text-foreground/50">
          <p>© {new Date().getFullYear()} Viraasat Platform. Rooted in tradition, built with pride.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
