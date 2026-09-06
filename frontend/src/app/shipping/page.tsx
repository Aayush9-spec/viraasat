import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Shipping & Returns — Viraasat',
  description: 'Shipping timelines, rates, tracking, and the Viraasat returns and exchanges policy.',
};

const options = [
  {
    name: 'Standard — India',
    time: '4–7 business days',
    cost: 'Free',
    note: 'All items ship within 48 hours from the artisan\u2019s region.',
  },
  {
    name: 'Express — India',
    time: '2–3 business days',
    cost: '₹149 flat',
    note: 'Priority handling from dispatch to doorstep.',
  },
  {
    name: 'International',
    time: '8–14 business days',
    cost: 'Calculated at checkout',
    note: 'Duties and taxes shown upfront; no hidden fees at delivery.',
  },
];

export default function ShippingPage() {
  return (
    <div className="bg-background min-h-screen">
      <header className="relative py-24 overflow-hidden bg-[#fbf7f0] border-b border-primary/5">
        <div className="absolute inset-0 opacity-[0.03] clay-texture pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <Badge variant="outline" className="mb-4 border-primary/20 text-primary px-4 py-1 uppercase tracking-widest text-[10px]">Delivery</Badge>
          <h1 className="text-4xl md:text-6xl font-heading font-normal text-[#5e2c18] mb-6">Shipping &amp; Returns</h1>
          <p className="max-w-2xl mx-auto text-lg text-[#8b4513]/70 font-serif italic">
            Handmade takes time, but it should arrive beautifully and on time.
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="font-heading text-2xl text-[#5e2c18] mb-6">Delivery Options</h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {options.map((option) => (
            <div key={option.name} className="border border-primary/10 bg-white p-6">
              <p className="font-heading text-lg text-[#5e2c18]">{option.name}</p>
              <p className="text-sm font-semibold text-primary mt-2">{option.time}</p>
              <p className="text-sm font-bold text-amber-700 mt-1">{option.cost}</p>
              <p className="text-xs text-foreground/60 leading-relaxed mt-3">{option.note}</p>
            </div>
          ))}
        </div>

        <h2 className="font-heading text-2xl text-[#5e2c18] mt-16 mb-6">How It Works</h2>
        <ol className="list-decimal list-inside space-y-3 text-sm text-foreground/75 leading-relaxed">
          <li><span className="font-semibold text-foreground">Dispatch in 48 hours</span> — every item ships directly from the artisan&rsquo;s region in durable, recycled packaging.</li>
          <li><span className="font-semibold text-foreground">Live tracking</span> — you receive a tracking link the moment your order ships, visible on your order page too.</li>
          <li><span className="font-semibold text-foreground">Doorstep verification</span> — international orders arrive with duties already settled; what you see at checkout is what you pay.</li>
          <li><span className="font-semibold text-foreground">Care instructions</span> — each piece ships with care details so your heirloom outlives trends.</li>
        </ol>

        <h2 className="font-heading text-2xl text-[#5e2c18] mt-16 mb-6">Returns &amp; Exchanges</h2>
        <div className="space-y-4 text-sm text-foreground/75 leading-relaxed">
          <p>
            Because each piece is one of a kind, we keep the window short but generous. You may return or
            exchange any item within <span className="font-semibold">7 days of delivery</span> if it arrives
            damaged or materially different from its description.
          </p>
          <p>
            To start a return, photograph the item and its packaging within 48 hours of delivery, then use
            the Return option on your order page. We cover return shipping for damaged or misdescribed items
            and issue a refund to your original payment method within 5 business days of the item reaching us.
          </p>
          <p>
            Custom and commissioned pieces are final sale. This policy intentionally protects artisans —
            when a one-off creation is returned, the artisan is paid for the labour regardless.
          </p>
        </div>

        <div className="mt-16 p-8 bg-[#fbf7f0] border border-primary/10 text-center">
          <p className="font-heading text-xl text-[#5e2c18]">Damaged in transit?</p>
          <p className="text-sm text-foreground/70 mt-2 mb-6 max-w-lg mx-auto">
            We reimburse the artisan immediately so they&rsquo;re never out of pocket for a courier mishap —
            and we dispatch your replacement or refund without friction.
          </p>
          <Link href="/contact" className="inline-block text-sm font-bold text-primary border-b border-primary/20 pb-1 hover:border-primary">
            Contact Support →
          </Link>
        </div>
      </main>
    </div>
  );
}