'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Instagram, Facebook, Youtube, Linkedin, Shield } from 'lucide-react';
import { useToast } from '@/core/hooks/use-toast';
import { useTranslation } from '@/core/hooks/use-translation';

export function Footer() {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');

  const handleNewsletter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    toast({
      title: 'Namaste! Welcome to The Viraasat Circle 📜',
      description: 'Your ₹1,500 heirloom welcome credit has been sent to ' + email + '.',
    });
    setEmail('');
  };

  return (
    <footer id="about-viraasat" className="bg-[#221C18] text-[#FAF7F2] pt-16 pb-12 border-t-2 border-[#C59B4B] relative z-20">
      <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
        {/* Top Newsletter Row */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 mb-14 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <span className="text-xs uppercase tracking-widest text-[#C59B4B] font-bold">
              {t('footer.circleEyebrow') || "The Viraasat Circle"}
            </span>
            <h3 className="font-serif text-2xl font-normal text-white">
              {t('footer.circleTitle') || "Receive Private Previews of Masterpiece Drops"}
            </h3>
            <p className="text-xs text-[#655B53] text-stone-400">
              {t('footer.circleSubtitle') || "Join 34,000+ art lovers. Enjoy ₹1,500 off your inaugural heirloom acquisition."}
            </p>
          </div>
          <form onSubmit={handleNewsletter} className="flex w-full md:w-auto max-w-md gap-2">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('footer.emailPlaceholder') || "Enter your email address"}
              className="bg-white/10 border border-white/20 rounded-full px-4 py-2.5 text-xs text-white placeholder-white/50 focus:outline-none focus:border-[#C59B4B] w-full sm:w-64"
            />
            <button
              type="submit"
              className="bg-[#C59B4B] hover:bg-[#E8CA82] text-[#221C18] font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-full transition-colors whitespace-nowrap cursor-pointer shadow"
            >
              {t('footer.joinCircle') || "Join Circle"}
            </button>
          </form>
        </div>

        {/* Links Column Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-14 text-xs font-light">
          {/* Col 1: Brand */}
          <div className="col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-serif text-2xl font-bold tracking-wider text-[#E8CA82] uppercase">
                Viraasat
              </span>
            </div>
            <p className="text-stone-400 leading-relaxed max-w-sm">
              India&apos;s foremost collective for Geographical Indication (GI) tagged handicrafts, heritage weaves, and ancestral lost arts. Directly empowering indigenous guilds with dignity and fair trade.
            </p>
            <div className="flex items-center space-x-4 pt-2 text-[#E8CA82]">
              <a
                href="https://www.instagram.com/aasr_233/"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
                title="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a href="#" className="hover:text-white transition-colors" title="Facebook">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="#" className="hover:text-white transition-colors" title="Youtube">
                <Youtube className="w-4 h-4" />
              </a>
              <a href="#" className="hover:text-white transition-colors" title="LinkedIn">
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Col 2: Geographical Crafts */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-white">
              {t('footer.heritageGuilds') || "Heritage Guilds"}
            </h4>
            <ul className="space-y-2 text-stone-400">
              <li><Link href="/shop?category=pottery" className="hover:text-[#C59B4B] transition-colors">Jaipur Blue Pottery</Link></li>
              <li><Link href="/shop?category=shawls" className="hover:text-[#C59B4B] transition-colors">Kashmiri Kani Shawls</Link></li>
              <li><Link href="/shop?category=metal" className="hover:text-[#C59B4B] transition-colors">Bastar Dhokra Bronze</Link></li>
              <li><Link href="/shop?category=paintings" className="hover:text-[#C59B4B] transition-colors">Mithila Madhubani</Link></li>
              <li><Link href="/shop?category=textiles" className="hover:text-[#C59B4B] transition-colors">Banarasi Brocade Silks</Link></li>
              <li><Link href="/shop?category=metal" className="hover:text-[#C59B4B] transition-colors">Bidriware Silver Inlay</Link></li>
            </ul>
          </div>

          {/* Col 3: Artisan Ecosystem */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-white">
              {t('footer.quickLinks') || "Quick Links"}
            </h4>
            <ul className="space-y-2 text-stone-400">
              <li><Link href="/download" className="hover:text-[#C59B4B] transition-colors font-medium text-[#E8CA82] flex items-center gap-1.5">📱 Download Android APK & App</Link></li>
              <li><Link href="/psit" className="hover:text-[#C59B4B] transition-colors font-medium text-[#E8CA82]">PSIT Student Showcase</Link></li>
              <li><Link href="/login/artisan" className="hover:text-[#C59B4B] transition-colors font-medium text-[#E8CA82]">Artisan Portal Login</Link></li>
              <li><Link href="/apply" className="hover:text-[#C59B4B] transition-colors">Cooperative Grants</Link></li>
              <li><Link href="/artisan/provenance" className="hover:text-[#C59B4B] transition-colors">GI Verification Hub</Link></li>
              <li><Link href="/about" className="hover:text-[#C59B4B] transition-colors">Natural Dye Sourcing</Link></li>
              <li><Link href="/shipping" className="hover:text-[#C59B4B] transition-colors">Rural Packaging Hubs</Link></li>
            </ul>
          </div>

          {/* Col 4: Assurance & Policies */}
          <div className="space-y-3">
            <h4 className="font-serif text-sm font-bold uppercase tracking-wider text-white">
              {t('footer.policies') || "Policies"}
            </h4>
            <ul className="space-y-2 text-stone-400">
              <li><Link href="/about" className="hover:text-[#C59B4B] transition-colors">Authenticity Certificate</Link></li>
              <li><Link href="/shipping" className="hover:text-[#C59B4B] transition-colors">Global Fragile Transit</Link></li>
              <li><Link href="/faq" className="hover:text-[#C59B4B] transition-colors">Heirloom Care Guide</Link></li>
              <li><Link href="/contact" className="hover:text-[#C59B4B] transition-colors">Bespoke Architectural Orders</Link></li>
              <li><Link href="/refund" className="hover:text-[#C59B4B] transition-colors">Fair Trade Transparency</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-400 gap-4">
          <div>
            © {new Date().getFullYear()} Viraasat Marketplace Pvt. Ltd. {t('footer.allRightsReserved') || "All rights reserved. Empowering indigenous heritage guilds."}
          </div>
          <div className="flex items-center space-x-6">
            <Link href="/privacy" className="hover:text-white transition-colors">Privacy Charter</Link>
            <Link href="/terms" className="hover:text-white transition-colors">Terms of Heritage Trade</Link>
            <Link href="/about" className="hover:text-white transition-colors">GI Compliance</Link>
            <span className="text-[#C59B4B] flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" /> Government Handloom Board Certified
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
