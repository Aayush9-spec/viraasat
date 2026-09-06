import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const metadata: Metadata = {
  title: 'About Viraasat — Preserving India\u2019s Heritage',
  description:
    'Viraasat is an AI-driven marketplace connecting Indian artisans with a global audience. Learn our story and mission.',
};

const pillars = [
  {
    title: 'Heritage First',
    body: 'Every craft carries centuries of stories. We preserve provenance, GI certifications, and the cultural context behind each piece.',
  },
  {
    title: 'Artisan Empowerment',
    body: 'AI tools remove the technical barriers — turning phone photos and voice memos into professional, SEO-ready product listings.',
  },
  {
    title: 'Sustainable Commerce',
    body: 'Fair pricing powered by ML, transparent provenance on a blockchain ledger, and demand forecasting that helps artisans plan.',
  },
  {
    title: 'Global Discovery',
    body: 'A knowledge graph of regional crafts and communities surfaces the right piece for the right collector anywhere in the world.',
  },
];

export default function AboutPage() {
  return (
    <div className="bg-background min-h-screen">
      <header className="relative py-24 overflow-hidden bg-[#fbf7f0] border-b border-primary/5">
        <div className="absolute inset-0 opacity-[0.03] clay-texture pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <Badge variant="outline" className="mb-4 border-primary/20 text-primary px-4 py-1 uppercase tracking-widest text-[10px]">Our Story</Badge>
          <h1 className="text-5xl md:text-6xl font-heading font-normal text-[#5e2c18] mb-6">Handcrafted Stories Deserve a Global Audience</h1>
          <p className="max-w-2xl mx-auto text-lg text-[#8b4513]/70 font-serif italic">
            Viraasat — the Hindi word for heritage — began with a simple question: why should a
            craftsman&rsquo;s talent be limited by the tools they can afford or the language they speak?
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="prose prose-lg max-w-none">
          <p className="text-foreground/80 leading-relaxed">
            India is home to lakhs of artisans — potters, weavers, carvers, and metalsmiths — whose
            work is world-class yet chronically undervalued. Poor photography, language barriers, and
            intimidating e-commerce onboarding keep these treasures hidden from premium buyers.
          </p>
          <p className="text-foreground/80 leading-relaxed mt-4">
            Viraasat uses Google AI to level the playing field. An artisan records their story in their
            own language and snaps a photo on their phone; our AI enhances the imagery, transcribes the
            voice memo, and drafts compelling, SEO-ready descriptions. ML-driven pricing and demand
            forecasting suggest fair wages, while a blockchain provenance ledger certifies authenticity.
          </p>
          <p className="text-foreground/80 leading-relaxed mt-4">
            For collectors, Viraasat is a window into the soul of Indian craft — with curated discovery,
            verified provenance, and the cultural context that turns a purchase into a legacy.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 mt-16">
          {pillars.map((pillar) => (
            <div key={pillar.title} className="border border-primary/10 bg-[#fbf7f0]/50 p-8">
              <span className="font-heading text-xl text-[#5e2c18]">{pillar.title}</span>
              <p className="text-sm text-foreground/70 leading-relaxed mt-3">{pillar.body}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-20">
          <h2 className="font-heading text-3xl text-[#5e2c18] mb-4">Become part of the story</h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Whether you are an artisan sharing your craft or a collector discovering it, the Viraasat
            family would love to welcome you.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Button asChild className="bg-primary text-primary-foreground">
              <Link href="/shop">Explore the Collection</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/apply">Join as an Artisan</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}