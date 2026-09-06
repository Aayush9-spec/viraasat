import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { artisans } from '@/lib/data';

export const metadata: Metadata = {
  title: 'Meet the Artisans — Viraasat',
  description: 'Discover the master craftspeople behind every Viraasat piece.',
};

export default function ArtisansPage() {
  return (
    <div className="bg-background min-h-screen">
      <header className="relative py-24 overflow-hidden bg-[#fbf7f0] border-b border-primary/5">
        <div className="absolute inset-0 opacity-[0.03] clay-texture pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <Badge variant="outline" className="mb-4 border-primary/20 text-primary px-4 py-1 uppercase tracking-widest text-[10px]">Craft Mastery</Badge>
          <h1 className="text-5xl md:text-6xl font-heading font-normal text-[#5e2c18] mb-6">Meet the Artisans</h1>
          <p className="max-w-2xl mx-auto text-lg text-[#8b4513]/70 font-serif italic">
            Behind every masterpiece is a pair of hands, a family tradition, and a lifetime of perfecting a single craft.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {artisans.map((artisan) => (
            <article key={artisan.id} className="border border-primary/10 bg-white shadow-sm group">
              <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100">
                <Image
                  src={artisan.profilePicture}
                  alt={artisan.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <Badge className="rounded-none bg-[#5e2c18]/90 text-amber-50 border-none text-[9px] tracking-widest uppercase px-3 py-1 font-bold">
                    {artisan.location}
                  </Badge>
                </div>
              </div>
              <div className="p-6">
                <h2 className="font-heading text-xl text-[#5e2c18]">{artisan.name}</h2>
                <p className="text-xs uppercase tracking-widest text-primary/70 font-bold mt-1">{artisan.shopName}</p>
                <p className="text-sm text-foreground/70 leading-relaxed mt-4">{artisan.bio}</p>
                {artisan.story && (
                  <p className="text-sm text-foreground/60 leading-relaxed mt-3 italic font-serif line-clamp-3">{artisan.story}</p>
                )}
              </div>
            </article>
          ))}
        </div>

        <div className="text-center mt-20">
          <h2 className="font-heading text-3xl text-[#5e2c18] mb-4">Are you an artisan?</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Join Viraasat and let AI handle the storytelling while you focus on the craft.
          </p>
          <Button asChild className="bg-primary text-primary-foreground">
            <Link href="/apply">Apply to Sell</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}