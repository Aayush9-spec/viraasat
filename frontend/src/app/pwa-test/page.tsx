'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAppInstall } from '@/features/pwa/install-store';

export default function PWATestPage() {
  const { status } = useAppInstall();
  const [worker, setWorker] = useState('Checking…');
  const [manifest, setManifest] = useState('Checking…');
  const [fallback, setFallback] = useState('Checking…');
  useEffect(() => {
    let active = true;
    async function inspect() {
      try {
        const registration = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration('/') : undefined;
        if (active) setWorker(registration?.active ? 'Active' : 'Not active');
        const response = await fetch('/manifest.json');
        const data = response.ok ? await response.json() : null;
        if (active) setManifest(data?.name === 'Viraasat' && data?.icons?.length ? 'Available' : 'Unavailable');
        const cached = 'caches' in window ? await caches.match('/offline.html') : undefined;
        if (active) setFallback(cached ? 'Connection-help screen saved' : 'Connection-help screen not saved');
      } catch { if (active) { setWorker('Could not check'); setManifest('Could not check'); setFallback('Could not check'); } }
    }
    void inspect();
    return () => { active = false; };
  }, []);
  return <div className="mx-auto max-w-3xl space-y-6 px-6 py-14"><h1 className="font-serif text-4xl">App installation status</h1><p className="text-muted-foreground">These checks describe this browser. Catalog, accounts, orders and payments require an internet connection.</p><dl className="divide-y rounded-xl border bg-card px-5">{[['Service worker', worker], ['App manifest', manifest], ['Offline fallback', fallback], ['Install prompt', status === 'unavailable' ? 'Not offered by this browser; manual installation may be available' : status]].map(([label, value]) => <div key={label} className="grid gap-2 py-4 sm:grid-cols-2"><dt className="font-semibold">{label}</dt><dd className="text-sm text-muted-foreground">{value}</dd></div>)}</dl><Link href="/download" className="inline-flex min-h-11 items-center text-primary underline">Installation instructions</Link></div>;
}
