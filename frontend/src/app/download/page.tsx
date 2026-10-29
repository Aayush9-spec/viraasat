'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Download,
  Smartphone,
  ShieldCheck,
  Zap,
  CheckCircle2,
  Sparkles,
  QrCode,
  ArrowRight,
  ExternalLink,
  Layers,
  Camera,
  Share2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/core/hooks/use-toast';

export default function DownloadPage() {
  const { toast } = useToast();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode (installed PWA / APK)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      toast({
        title: 'Viraasat Installed!',
        description: 'Viraasat is now installed on your device home screen.',
      });
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [toast]);

  const handleInstallPWA = async () => {
    if (!deferredPrompt) {
      toast({
        title: 'Direct Browser Installation',
        description: 'Tap your browser menu (⋮ or Share) and select "Add to Home Screen" or "Install App" to install Viraasat as a native WebAPK.',
      });
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      toast({
        title: 'Installation Initiated',
        description: 'Viraasat is installing to your device.',
      });
    }
    setDeferredPrompt(null);
  };

  const handleDownloadApk = () => {
    toast({
      title: 'Downloading Viraasat APK',
      description: 'The native Android APK bundle is downloading. Open the downloaded file to install on your Android device.',
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#221C18] py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-12">
        {/* Header Hero */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <Badge className="bg-[#FAF7F2] text-[#8C2B2B] border border-[#C59B4B]/40 text-xs font-bold gap-1 px-3 py-1">
            <Smartphone className="h-3.5 w-3.5 text-[#C59B4B]" /> Android Mobile App • Viraasat v2.4.0
          </Badge>
          <h1 className="font-serif text-3xl sm:text-5xl font-normal text-[#221C18] leading-tight">
            Carry India&apos;s Living Heritage in Your Pocket
          </h1>
          <p className="text-sm sm:text-base text-[#655B53] leading-relaxed">
            Download the official Viraasat Android application. Explore GI-certified artisan crafts, verify cryptographic provenance, and purchase directly from rural master craftsmen with zero middleman commissions.
          </p>

          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href="/download/viraasat.apk"
              download="Viraasat-v2.4.0.apk"
              onClick={handleDownloadApk}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-[#8C2B2B] hover:bg-[#702222] text-white rounded-xl text-xs uppercase tracking-widest font-semibold transition-all shadow-md hover:shadow-lg cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#E8CA82]" />
              Download Android APK (2.9 MB)
            </a>

            <Button
              type="button"
              variant="outline"
              onClick={handleInstallPWA}
              className="w-full sm:w-auto px-6 py-3.5 border-[#C59B4B]/60 text-[#221C18] hover:bg-[#F3EDE2] rounded-xl text-xs uppercase tracking-widest font-semibold h-auto"
            >
              <Zap className="w-4 h-4 mr-2 text-[#C59B4B]" />
              {isInstalled ? 'App Already Installed' : isInstallable ? 'Install Instant WebAPK' : 'Add to Home Screen'}
            </Button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-2xl border border-[#E8DCCB] bg-white shadow-sm p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-[#8C2B2B] flex items-center justify-center">
              <Camera className="w-5 h-5 text-[#C59B4B]" />
            </div>
            <h3 className="font-serif font-bold text-lg text-[#221C18]">AI Camera GI Scanner</h3>
            <p className="text-xs text-[#655B53] leading-relaxed">
              Scan physical GI certificates and artisan craft hallmarks using your smartphone camera to instantly verify cryptographic lineage and proof of origin.
            </p>
          </Card>

          <Card className="rounded-2xl border border-[#E8DCCB] bg-white shadow-sm p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-800 flex items-center justify-center">
              <Zap className="w-5 h-5 text-emerald-700" />
            </div>
            <h3 className="font-serif font-bold text-lg text-[#221C18]">Instant UPI Direct Settlements</h3>
            <p className="text-xs text-[#655B53] leading-relaxed">
              Integrated with PhonePe, Google Pay, and BHIM UPI for zero-friction direct payment payouts directly into rural cooperative artisan bank accounts.
            </p>
          </Card>

          <Card className="rounded-2xl border border-[#E8DCCB] bg-white shadow-sm p-6 space-y-3">
            <div className="w-10 h-10 rounded-xl bg-[#8C2B2B]/10 text-[#8C2B2B] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#8C2B2B]" />
            </div>
            <h3 className="font-serif font-bold text-lg text-[#221C18]">Offline Guild Caching</h3>
            <p className="text-xs text-[#655B53] leading-relaxed">
              Full offline access for remote artisan clusters. Queue orders, log craftsmanship steps, and browse products without cellular reception.
            </p>
          </Card>
        </div>

        {/* Android Installation Guide */}
        <Card className="rounded-2xl border border-[#E8DCCB] bg-white shadow-sm overflow-hidden">
          <CardHeader className="bg-[#FAF7F2] border-b border-[#E8DCCB] pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-serif text-xl text-[#221C18]">
                  How to Install the APK on Your Android Device
                </CardTitle>
                <CardDescription className="text-xs text-[#655B53] mt-1">
                  Follow these 3 quick steps to install and run Viraasat on any phone running Android 8.0+.
                </CardDescription>
              </div>
              <Badge variant="outline" className="border-emerald-600/30 text-emerald-800 bg-emerald-50 text-xs">
                Safe & Verified Package
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-[#8C2B2B] text-white flex items-center justify-center font-bold text-sm">
                  1
                </div>
                <h4 className="font-semibold text-sm text-[#221C18]">Download the APK</h4>
                <p className="text-xs text-[#655B53] leading-relaxed">
                  Click the &quot;Download Android APK&quot; button above. When your mobile browser prompts &quot;This type of file can harm your device&quot;, tap <span className="font-bold text-foreground">Download anyway</span>.
                </p>
              </div>

              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-[#8C2B2B] text-white flex items-center justify-center font-bold text-sm">
                  2
                </div>
                <h4 className="font-semibold text-sm text-[#221C18]">Allow Unknown Sources</h4>
                <p className="text-xs text-[#655B53] leading-relaxed">
                  Tap the downloaded file in your notification drawer. If prompted, go to Settings and enable <span className="font-bold text-foreground">Allow from this source</span> for your browser.
                </p>
              </div>

              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full bg-[#8C2B2B] text-white flex items-center justify-center font-bold text-sm">
                  3
                </div>
                <h4 className="font-semibold text-sm text-[#221C18]">Install & Launch</h4>
                <p className="text-xs text-[#655B53] leading-relaxed">
                  Tap <span className="font-bold text-foreground">Install</span>. Once finished, open Viraasat from your app drawer and sign in to explore authentic Indian artisanal heritage.
                </p>
              </div>
            </div>

            <div className="rounded-xl p-4 bg-[#FAF7F2] border border-[#E8DCCB] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-xs font-bold text-[#8C2B2B] uppercase tracking-wider block">
                  Package Specifications
                </span>
                <p className="text-xs text-[#655B53]">
                  Package ID: <code className="font-mono text-foreground font-semibold">org.viraasat.heritage.app</code> • Architecture: Universal (arm64-v8a, armeabi-v7a, x86_64) • Min Android: 8.0 (Oreo)
                </p>
              </div>
              <Button
                asChild
                variant="outline"
                size="sm"
                className="text-xs border-[#C59B4B] text-[#8C2B2B] hover:bg-[#FAF7F2]"
              >
                <Link href="/">
                  Return to Marketplace <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

