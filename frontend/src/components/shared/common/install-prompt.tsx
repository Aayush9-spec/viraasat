'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppInstall } from '@/features/pwa/install-store';

export default function InstallPrompt() {
  const { status, install } = useAppInstall();
  const pathname = usePathname();
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const hideOnRoute = pathname === '/download' || pathname.startsWith('/checkout') || pathname.startsWith('/artisan') || pathname.startsWith('/admin');
  useEffect(() => {
    if (status !== 'available' || hideOnRoute || dismissed) return;
    try {
      const lastDismissal = Number(localStorage.getItem('pwa-install-dismissed'));
      if (lastDismissal && Date.now() - lastDismissal < 7 * 86400000) return;
    } catch { /* Browser storage may be disabled. */ }
    const timer = setTimeout(() => setShow(true), 30000);
    return () => clearTimeout(timer);
  }, [status, hideOnRoute, dismissed]);
  function dismiss() {
    setShow(false); setDismissed(true);
    try { localStorage.setItem('pwa-install-dismissed', String(Date.now())); } catch { /* Optional preference. */ }
  }
  if (!show || dismissed || status !== 'available' || hideOnRoute) return null;
  return <aside aria-label="Install Viraasat" className="fixed bottom-20 left-4 right-4 z-40 rounded-2xl border bg-card p-5 pr-12 shadow-lg md:left-auto md:max-w-sm">
    <Button variant="ghost" size="icon" className="absolute right-1 top-1" onClick={dismiss} aria-label="Dismiss install suggestion"><X className="h-4 w-4" /></Button>
    <div className="mb-3 flex items-center gap-3"><Image src="/icons/viraasat-192.png" alt="" width={48} height={48} className="rounded-xl" /><h2 className="font-serif text-xl font-semibold">Viraasat on your home screen</h2></div>
    <p className="text-sm leading-relaxed text-muted-foreground">Open the marketplace in one tap. An internet connection is required.</p>
    <div className="mt-4 flex flex-wrap gap-2"><Button onClick={() => { void install(); setShow(false); }}>Install Viraasat</Button><Button asChild variant="outline"><Link href="/download" onClick={dismiss}>Installation help</Link></Button></div>
  </aside>;
}
