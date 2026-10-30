'use client';

import { useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Download, ShoppingBag, Smartphone, UserRound, Hammer, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppInstall } from '@/features/pwa/install-store';
import releaseData from '@/config/android-release.json';

type AndroidRelease = { available: false } | { available: true; version: string; bytes: number; sha256: string; url: string; minAndroid: string };
const release = releaseData as AndroidRelease;
const features = [
  { title: 'Explore the marketplace', description: 'Browse the craft catalog, read product details, and save items to your wishlist.', icon: ShoppingBag, href: '/shop', action: 'Browse crafts' },
  { title: 'Keep your account handy', description: 'Sign in to view your saved items and track orders placed through Viraasat.', icon: UserRound, href: '/orders', action: 'View my orders' },
  { title: 'Open your artisan studio', description: 'Approved artisans can manage their products, paid orders, and studio tools.', icon: Hammer, href: '/artisan/dashboard', action: 'Go to studio' },
];
export default function DownloadPage() {
  const { status, install } = useAppInstall();
  const guide = useRef<HTMLElement>(null);
  const [showHelp, setShowHelp] = useState(false);
  async function handleInstall() {
    if (status === 'available') await install();
    else { setShowHelp(true); guide.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); guide.current?.focus({ preventScroll: true }); }
  }
  const installed = status === 'installed';
  return <div className="bg-background px-4 py-12 text-foreground sm:px-6 sm:py-16">
    <div className="mx-auto max-w-5xl space-y-10 sm:space-y-14">
      <section className="mx-auto max-w-3xl space-y-5 text-center">
        <Image src="/icons/viraasat-512.png" alt="Viraasat logo" width={112} height={112} priority className="mx-auto rounded-3xl border border-border/60" />
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Viraasat for your phone</p>
        <h1 className="font-serif text-4xl leading-tight sm:text-5xl">Your craft marketplace,<br className="hidden sm:block" /> one tap away.</h1>
        <p className="mx-auto max-w-xl text-base leading-relaxed text-muted-foreground">Add Viraasat to your home screen to open the marketplace, your account, and your artisan studio from the same place.</p>
        <div className="flex flex-col justify-center gap-3 pt-2 sm:flex-row">
          <Button onClick={handleInstall} disabled={installed || status === 'prompting' || status === 'accepted'} className="min-h-12 gap-2 rounded-xl px-6">
            {installed ? <Check className="h-4 w-4" /> : <Smartphone className="h-4 w-4" />}
            {installed ? 'Viraasat is installed' : status === 'prompting' ? 'Continue in your browser…' : status === 'accepted' ? 'Installation requested' : 'Add to home screen'}
          </Button>
          <Button asChild variant="outline" className="min-h-12 gap-2 rounded-xl px-6"><Link href="/shop">Open marketplace<ArrowRight className="h-4 w-4" /></Link></Button>
        </div>
        <p className="text-sm text-muted-foreground">Internet access is required for browsing, sign-in, orders, payments, and AI tools.</p>
        {status === 'accepted' && <p role="status" className="text-sm">Your browser is handling installation. Open Viraasat from your home screen when it finishes.</p>}
        {status === 'error' && <p role="alert" className="text-sm text-destructive">The install prompt could not open. Use the browser instructions below.</p>}
      </section>
      <div className="grid gap-5 md:grid-cols-3">{features.map(({ title, description, icon: Icon, href, action }) => <section key={title} className="flex flex-col rounded-2xl border bg-card p-6 shadow-sm"><span className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Icon className="h-5 w-5" aria-hidden="true" /></span><h2 className="font-serif text-xl font-semibold">{title}</h2><p className="mb-4 mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p><Link href={href} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline">{action}<ArrowRight className="h-4 w-4" /></Link></section>)}</div>
      <section ref={guide} tabIndex={-1} aria-labelledby="install-guide" className="scroll-mt-24 rounded-2xl border bg-card p-6 outline-none focus:ring-2 focus:ring-ring sm:p-8">
        <h2 id="install-guide" className="font-serif text-2xl font-semibold">Add Viraasat to your home screen</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Installation options depend on your browser and device. Use the steps that match yours.</p>
        {showHelp && <p role="status" className="mt-3 text-sm text-primary">Your browser has not offered an automatic install prompt. Follow the steps below.</p>}
        <div className="mt-7 grid gap-8 md:grid-cols-3">
          <div><h3 className="mb-3 font-semibold">Android · Chrome or Edge</h3><ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-muted-foreground"><li>Open Viraasat in your browser.</li><li>Open the browser menu and choose <strong className="text-foreground">Install app</strong> or <strong className="text-foreground">Add to Home screen</strong>, if available.</li><li>Confirm, then open the Viraasat icon from your home screen.</li></ol></div>
          <div><h3 className="mb-3 font-semibold">iPhone or iPad · Safari</h3><ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-muted-foreground"><li>Open Viraasat in Safari.</li><li>Tap <strong className="text-foreground">Share</strong>, then <strong className="text-foreground">Add to Home Screen</strong>.</li><li>Keep <strong className="text-foreground">Open as Web App</strong> enabled if shown, then tap <strong className="text-foreground">Add</strong>.</li></ol></div>
          <div><h3 className="mb-3 font-semibold">Computer</h3><ol className="list-decimal space-y-3 pl-5 text-sm leading-relaxed text-muted-foreground"><li>Open Viraasat in Chrome or Edge.</li><li>Look for the install icon in the address bar or the browser menu.</li><li>If installation is unavailable, continue using the website in your browser.</li></ol></div>
        </div>
      </section>
      <section className="rounded-2xl border bg-card p-6 sm:p-8" aria-labelledby="android-download">
        <h2 id="android-download" className="font-serif text-2xl font-semibold">Android APK</h2>
        {release.available ? <div className="mt-3 space-y-4"><p className="text-sm text-muted-foreground">This Android launcher opens virrasat.in in your browser. An internet connection and a compatible browser are required.</p><Button asChild className="gap-2"><a href={release.url} download><Download className="h-4 w-4" />Download Android APK · {(release.bytes / 1024 / 1024).toFixed(1)} MB</a></Button><p className="text-sm text-muted-foreground">Version {release.version} · Android {release.minAndroid} or later</p><details className="text-xs text-muted-foreground"><summary className="inline-flex min-h-11 cursor-pointer items-center">Download checksum (SHA-256)</summary><code className="block break-all">{release.sha256}</code></details></div> : <p className="mt-3 text-sm leading-relaxed text-muted-foreground">An Android APK release is not available yet. You can install the web app using the instructions above.</p>}
      </section>
    </div>
  </div>;
}
