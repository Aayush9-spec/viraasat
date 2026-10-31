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
    title: 'Artisan AI Empowerment',
    body: 'Multimodal AI removes intimidating tech barriers—turning vernacular voice notes and mobile photos into professional, SEO-optimized listings with zero technical debt.',
  },
  {
    icon: ShieldCheck,
    title: 'Fair-Wage Economics',
    body: 'Predictive pricing regressors calculated without target leakage ensure rural creators receive fair compensation benchmarked against Ministry of Textiles labor standards.',
  },
  {
    icon: Globe2,
    title: 'Global Knowledge Discovery',
    body: 'A cultural knowledge graph mapping regional craft clusters and artisan lineages surfaces the right masterpiece to connoisseurs and collectors worldwide.',
  },
];

export default function AboutPage() {
  return (
    <div className="bg-[#FAF7F2] min-h-screen text-[#221C18]">
      {/* ================= HERO HEADER ================= */}
      <header className="relative py-20 md:py-28 overflow-hidden bg-[#FBF7F0] border-b border-[#E8DCCB]">
        <div className="absolute inset-0 opacity-[0.03] clay-texture pointer-events-none" />
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <Badge
            variant="outline"
            className="mb-4 border-[#C59B4B] text-[#701D24] px-4 py-1.5 uppercase tracking-widest text-[11px] font-semibold bg-[#FAF7F2]"
          >
            The Viraasat Chronicle & Mission
          </Badge>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif font-normal text-[#221C18] mb-6 leading-tight">
            Handcrafted Stories Deserve a Global Stage
          </h1>
          <div className="w-24 h-0.5 bg-[#C59B4B] mx-auto mb-6" />
          <p className="max-w-3xl mx-auto text-lg sm:text-xl text-[#5E2C18]/85 font-serif italic leading-relaxed">
            &ldquo;Viraasat — the Hindi word for heritage — began with a foundational conviction: why should an Indian craftsman&rsquo;s generational genius be constrained by language barriers, unfair intermediaries, or lack of modern technology?&rdquo;
          </p>
        </div>
      </header>

      {/* ================= STORY & MANIFESTO ================= */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 border-b border-[#E8DCCB]">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-5 text-base sm:text-lg text-[#221C18]/85 leading-relaxed font-sans">
            <h2 className="font-serif text-2xl sm:text-3xl text-[#701D24] font-bold">
              Bridging Millennia of Craft with Ethical Machine Intelligence
            </h2>
            <p>
              India is home to millions of indigenous master artisans — potters, master weavers, lost-wax bronze casters, and stone sculptors. Yet for decades, predatory supply chains, lack of fair wage transparency, and intimidating digital onboarding kept these treasures invisible to discerning collectors.
            </p>
            <p>
              Viraasat deploys cutting-edge AI to restore dignity to rural workshops. An artisan records their story in their native vernacular dialect and captures a phone photo. Our AI pipeline enhances imagery, transcribes voice memos, drafts rich cultural narratives, suggests fair-wage pricing, and anchors the artifact on a tamper-proof SHA-256 blockchain ledger.
            </p>
          </div>

          <div className="lg:col-span-5 bg-[#F3EDE2] p-8 rounded-3xl border border-[#E8DCCB] shadow-inner space-y-4">
            <div className="flex items-center gap-3 text-[#701D24] font-serif font-bold text-xl">
              <BookOpen className="w-6 h-6 text-[#C59B4B]" />
              <span>Our Core Manifesto</span>
            </div>
            <ul className="space-y-3 text-sm text-[#5E2C18] leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-[#C59B4B] font-bold">✓</span>
                <span><strong>Direct-to-Artisan Capital:</strong> Eliminating exploitative middlemen so 85%+ value reaches creator families.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C59B4B] font-bold">✓</span>
                <span><strong>Cryptographic Provenance:</strong> Immutable lineage tracking verifying GI certifications and generational authenticity.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#C59B4B] font-bold">✓</span>
                <span><strong>Multilingual Dignity:</strong> Supporting 13 Indian languages so no artisan is silenced by linguistic barriers.</span>
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
                className="border border-[#E8DCCB] bg-white rounded-2xl p-6 shadow-sm hover:border-[#C59B4B] transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] border border-[#C59B4B]/40 flex items-center justify-center text-[#701D24] mb-4">
                    <Icon className="w-6 h-6 text-[#C59B4B]" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-[#221C18] mb-2">{pillar.title}</h3>
                  <p className="text-xs text-[#5E2C18]/80 leading-relaxed font-sans">{pillar.body}</p>
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
        <h2 className="font-serif text-3xl sm:text-4xl text-[#221C18] font-normal mb-4">
          Become Part of India&rsquo;s Living Legacy
        </h2>
        <p className="text-[#5E2C18]/80 mb-8 max-w-xl mx-auto text-base">
          Whether you are an authentic master craftsman sharing your ancestral art or a discerning collector acquiring a certified heirloom, the Viraasat family welcomes you.
        </p>
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <Button asChild className="bg-[#701D24] hover:bg-[#8C2B2B] text-[#FAF7F2] px-8 py-6 rounded-full font-semibold shadow-md cursor-pointer">
            <Link href="/shop">Explore the Collection</Link>
          </Button>
          <Button asChild variant="outline" className="border-[#C59B4B] text-[#5E2C18] hover:bg-[#FAF7F2] px-8 py-6 rounded-full font-semibold cursor-pointer">
            <Link href="/apply">Join as an Artisan Guild</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
