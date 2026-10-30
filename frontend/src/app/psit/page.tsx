import type { Metadata } from 'next';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { PsitBuyButton } from '@/features/psit/psit-buy-button';
import { psitShowcaseItems } from '@/features/psit/psit-products';

export const metadata: Metadata = {
  title: 'PSIT Student Showcase — Viraasat',
  description: 'A showcase of creative work by PSIT students, presented by Viraasat.',
};

export default function PsitPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="relative overflow-hidden border-b border-primary/10 bg-[#fbf7f0] py-20 sm:py-24">
        <div className="clay-texture pointer-events-none absolute inset-0 opacity-[0.03]" />
        <div className="relative z-10 mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <Badge
            variant="outline"
            className="mb-4 border-primary/20 px-4 py-1 text-[10px] uppercase tracking-[0.18em] text-primary"
          >
            PSIT Student Showcase
          </Badge>
          <h1 className="font-heading text-5xl font-normal leading-[0.95] text-[#5e2c18] sm:text-6xl">
            Made with imagination,
            <span className="block italic text-[#8c2b2b]">shared with pride.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl font-serif text-lg italic leading-relaxed text-[#8b4513]/70">
            A collection celebrating the creative expression of PSIT students and the distinct point of view behind each piece.
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1680px] px-4 py-16 sm:px-6 md:px-8 lg:px-12 lg:py-20 xl:px-16 2xl:px-20">
        <div className="mb-10 flex flex-col justify-between gap-4 border-b border-primary/10 pb-6 sm:flex-row sm:items-end">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#8f6826]">The collection</p>
            <h2 className="mt-2 font-heading text-3xl text-[#5e2c18] sm:text-4xl">Meet the student creators</h2>
          </div>
          <p className="text-sm text-foreground/60">{psitShowcaseItems.length} featured students · PSIT</p>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {psitShowcaseItems.map((item, index) => (
            <article key={item.product.id} className="group">
              <div className="relative aspect-[4/5] overflow-hidden border border-[#e8dccb] bg-[#f3ede2] shadow-[0_10px_30px_rgba(94,44,24,0.08)] transition-shadow duration-500 group-hover:shadow-[0_16px_36px_rgba(94,44,24,0.16)]">
                <Image
                  src={item.product.images[0]}
                  alt={`Creative work by ${item.studentName}`}
                  fill
                  sizes="(min-width: 1536px) 20vw, (min-width: 1280px) 24vw, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#221c18]/45 to-transparent" />
                <span className="absolute left-4 top-4 flex h-9 min-w-9 items-center justify-center border border-[#e8ca82]/70 bg-[#5e2c18]/90 px-2 font-mono text-[10px] tracking-wider text-[#faf7f2]">
                  {String(index + 1).padStart(2, '0')}
                </span>
              </div>
              <div className="border-x border-b border-[#e8dccb] bg-card px-5 py-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#8f6826]">PSIT · {item.year}</p>
                <h3 className="mt-2 font-heading text-2xl leading-none text-[#5e2c18]">{item.studentName}</h3>
                <p className="mt-3 text-sm leading-relaxed text-foreground/65">{item.product.description}</p>
                <div className="mt-5 flex items-baseline justify-between border-t border-[#e8dccb] pt-4">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-foreground/50">Price</span>
                  <span className="font-heading text-2xl font-semibold text-[#701d24]">₹{item.product.price.toLocaleString('en-IN')}</span>
                </div>
                <div className="mt-4">
                  <PsitBuyButton product={item.product} />
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
