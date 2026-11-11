import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AboutTeamSection } from '@/features/about/components/about-team-section';
import { ShieldCheck, Cpu, Globe2, Sparkles, BookOpen } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Viraasat — Guardians of Indian Heritage & Artisanal Intelligence',
  description:
    'Learn about Viraasat, our founding vision, and the multidisciplinary engineering collective uniting traditional Indian craft lineages with predictive machine learning and cryptographic provenance.',
};

const pillars = [
  {
    icon: Sparkles,
    title: 'Heritage First & GI Provenance',
    body: 'Every craft carries centuries of oral traditions and generational memory. We preserve authentic provenance, GI certifications, and ancestral techniques behind each artifact.',
  },
  {
    icon: Cpu,
    title: 'Direct Artisan Voice',
    body: 'Vernacular voice tools empower rural artisans to narrate their craft story in their native dialect, translating generational wisdom directly into global collector showcases.',
  },
  {
    icon: ShieldCheck,
    title: 'Fair-Wage Economics',
    body: 'Transparent pricing frameworks aligned with Ministry of Textiles craft standards ensure master artisans receive dignified, direct compensation without intermediary markups.',
  },
  {
    icon: Globe2,
    title: 'Curated Cultural Discovery',
    body: 'A living craft directory mapping regional craft clusters and artisan lineages connects discerning connoisseurs with authenticated masterworks.',
  },
];

export default function AboutPage() {
  return (
    <div className="bg-background min-h-screen text-foreground">
      {/* ================= HERO HEADER ================= */}
      <header className="relative py-20 md:py-28 overflow-hidden bg-secondary/50 border-b border-border">
        <div className="absolute inset-0 opacity-[0.03] clay-texture pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <Badge
            variant="outline"
            className="mb-4 border-accent text-primary px-4 py-1.5 uppercase tracking-widest text-[11px] font-semibold bg-background"
          >
            The Viraasat Chronicle & Mission
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-normal text-foreground mb-6 leading-tight">
            Handcrafted Stories Deserve a Global Stage
          </h1>
          <div className="w-24 h-0.5 bg-accent mx-auto mb-6" />
          <p className="max-w-3xl mx-auto text-lg sm:text-xl text-muted-foreground font-serif italic leading-relaxed">
            &ldquo;Viraasat — the Hindi word for heritage — began with a foundational conviction: why should an Indian craftsman&rsquo;s generational genius be constrained by language barriers, unfair intermediaries, or lack of modern technology?&rdquo;
          </p>
        </div>
      </header>

      {/* ================= STORY & MANIFESTO ================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 border-b border-border">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-5 text-base sm:text-lg text-foreground/85 leading-relaxed font-sans">
            <h2 className="font-serif text-2xl sm:text-3xl text-primary font-bold">
              Preserving Millennia of Craft Through Direct Artisan Sovereignty
            </h2>
            <p>
              India is home to millions of indigenous master artisans — potters, master weavers, lost-wax bronze casters, and stone sculptors. Yet for decades, predatory supply chains, unfair commercial markups, and intimidating digital barriers kept these cultural treasures inaccessible to discerning collectors.
            </p>
            <p>
              Viraasat restores dignity directly to rural workshops. Master craftspeople document their heritage in their own vernacular dialect from their village workshops. We preserve authentic narratives, verify Geographical Indication (GI) certifications, ensure fair-wage compensation, and connect generational talent directly to conscious collectors worldwide.
            </p>
          </div>

          <div className="lg:col-span-5 bg-card p-8 rounded-3xl border border-border shadow-inner space-y-4">
            <div className="flex items-center gap-3 text-primary font-serif font-bold text-xl">
              <BookOpen className="w-6 h-6 text-accent" />
              <span>Our Core Manifesto</span>
            </div>
            <ul className="space-y-3 text-sm text-card-foreground leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">✓</span>
                <span><strong>Direct-to-Artisan Capital:</strong> Eliminating exploitative middlemen so 85%+ value reaches creator families.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">✓</span>
                <span><strong>Authenticated Provenance:</strong> Verifiable lineage tracking protecting GI certifications and generational authenticity.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-accent font-bold">✓</span>
                <span><strong>Multilingual Dignity:</strong> Supporting 13 Indian languages so no master craftsperson is silenced by linguistic barriers.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* 4 Pillars Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.title}
                className="border border-border bg-card rounded-2xl p-6 shadow-sm hover:border-accent transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-secondary border border-border flex items-center justify-center text-primary mb-4">
                    <Icon className="w-6 h-6 text-accent" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-card-foreground mb-2">{pillar.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed font-sans">{pillar.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================= CORE COLLECTIVE / FOUNDING TEAM SECTION ================= */}
      <AboutTeamSection id="team" />

      {/* ================= CALL TO ACTION ================= */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h2 className="font-serif text-3xl sm:text-4xl text-foreground font-normal mb-4">
          Become Part of India&rsquo;s Living Legacy
        </h2>
        <p className="text-muted-foreground mb-8 max-w-xl mx-auto text-base">
          Whether you are an authentic master craftsman sharing your ancestral art or a discerning collector acquiring a certified heirloom, the Viraasat family welcomes you.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Button asChild className="bg-primary hover:opacity-90 text-white px-8 py-6 rounded-full font-semibold shadow-md cursor-pointer">
            <Link href="/shop">Explore the Collection</Link>
          </Button>
          <Button asChild variant="outline" className="border-accent text-foreground hover:bg-secondary px-8 py-6 rounded-full font-semibold cursor-pointer">
            <Link href="/apply">Join as an Artisan Guild</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
