'use client';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
export default function OfflinePage() {
  return <div className="flex min-h-[65vh] items-center justify-center px-6 py-16"><section className="max-w-md space-y-5 text-center"><Image src="/icons/viraasat-192.png" width={112} height={112} alt="Viraasat logo" className="mx-auto rounded-3xl" /><h1 className="font-serif text-4xl font-semibold">Reconnect to Viraasat</h1><p className="leading-relaxed text-muted-foreground">Connect to the internet to browse products, sign in, or manage orders. Orders and payments cannot be submitted offline.</p><Button onClick={() => window.location.reload()}>Try again</Button></section></div>;
}
