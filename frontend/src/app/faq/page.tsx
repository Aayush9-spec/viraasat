import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions — Viraasat',
  description: 'Answers about ordering, authenticity, shipping, and the artisans behind every Viraasat piece.',
};

const faqs = [
  {
    question: "How do I know a product is authentic?",
    answer:
      "Every Viraasat piece carries a digital product passport that chains together the artisan's verified identity, the Geographical Indication (GI) certification of the craft, materials sourcing, and ownership history. Scan the QR code on any product to inspect it yourself.",
  },
  {
    question: "Are the photos of the products real?",
    answer:
      "Yes. Artisans upload photos taken on their own phones. Our AI enhances lighting and background — it never fabricates product details. What you see is genuinely what the artisan made.",
  },
  {
    question: "How is the price decided?",
    answer:
      "Artisans set their own prices with guidance from our ML pricing tool, which benchmarks similar handcrafted items by craft, region, and level of finish. We do not artificially mark up or discount; our marketplace fee is transparent at checkout.",
  },
  {
    question: "Do you ship internationally?",
    answer:
      "Yes. We offer standard free shipping within India and flat-rate international shipping. Duties and taxes for international orders are calculated at checkout and shown before you pay, so there are no surprises.",
  },
  {
    question: "How long does delivery take?",
    answer:
      "Within India: 4-7 business days for standard shipping and 2-3 days for express. International orders typically arrive in 8-14 business days. Each item ships from the artisan's region, so origin locations vary.",
  },
  {
    question: "Can I return or exchange a handcrafted item?",
    answer:
      "Because each piece is one of a kind, we accept returns and exchanges within 7 days of delivery if the item arrives damaged or materially different from its description. Custom and commissioned pieces are final sale.",
  },
  {
    question: "How do artisans get paid?",
    answer:
      "Artisans are paid directly the moment your order is delivered, minus the transparent marketplace fee. Unlike traditional marketplaces, there is no delayed payout pool or hidden commission structure.",
  },
  {
    question: "Can I talk to the artisan directly?",
    answer:
      "Yes. Every product page lets you message the artisan, ask about sizing, materials, or commissioning a custom piece. Conversations stay within Viraasat for security and our provenance records.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major cards, UPI, net banking, and wallets through Razorpay, our PCI-compliant payment partner. Payments are processed on Razorpay's secure pages; Viraasat never stores your card details.",
  },
  {
    question: "What if my order arrives damaged?",
    answer:
      "Photograph the damage within 48 hours of delivery and contact us via the order page. We arrange a free replacement or full refund — including shipping — and reimburse the artisan so they are never out of pocket for a courier mishap.",
  },
];

export default function FaqPage() {
  return (
    <div className="bg-background min-h-screen">
      <header className="relative py-24 overflow-hidden bg-[#fbf7f0] border-b border-primary/5">
        <div className="absolute inset-0 opacity-[0.03] clay-texture pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <Badge variant="outline" className="mb-4 border-primary/20 text-primary px-4 py-1 uppercase tracking-widest text-[10px]">Help Center</Badge>
          <h1 className="text-4xl md:text-6xl font-heading font-normal text-[#5e2c18] mb-6">Frequently Asked Questions</h1>
          <p className="max-w-2xl mx-auto text-lg text-[#8b4513]/70 font-serif italic">
            Everything you need to know before welcoming a handcrafted treasure home.
          </p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <details
              key={index}
              className="group border border-primary/10 bg-white open:shadow-sm transition-shadow"
            >
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none px-6 py-5">
                <span className="font-heading text-[#5e2c18]">{faq.question}</span>
                <span className="text-primary transition-transform group-open:rotate-45 text-xl leading-none shrink-0">+</span>
              </summary>
              <p className="px-6 pb-6 text-sm text-foreground/70 leading-relaxed">{faq.answer}</p>
            </details>
          ))}
        </div>

        <div className="text-center mt-16">
          <p className="text-sm text-muted-foreground font-serif italic">
            Couldn&rsquo;t find your answer?
          </p>
          <Link href="/contact" className="inline-block mt-4 text-sm font-bold text-primary border-b border-primary/20 pb-1 hover:border-primary">
            Talk to a human →
          </Link>
        </div>
      </main>
    </div>
  );
}