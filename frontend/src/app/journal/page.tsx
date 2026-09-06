import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { journalArticles } from '@/features/journal/articles';

export const metadata: Metadata = {
  title: 'The Heritage Journal — Viraasat',
  description: 'Stories of craft, culture, and the communities behind Indian heritage.',
};

export default function JournalPage() {
  return (
    <div className="bg-background min-h-screen">
      <header className="relative py-24 overflow-hidden bg-[#fbf7f0] border-b border-primary/5">
        <div className="absolute inset-0 opacity-[0.03] clay-texture pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <Badge variant="outline" className="mb-4 border-primary/20 text-primary px-4 py-1 uppercase tracking-widest text-[10px]">Editorial</Badge>
          <h1 className="text-5xl md:text-6xl font-heading font-normal text-[#5e2c18] mb-6">The Heritage Journal</h1>
          <p className="max-w-2xl mx-auto text-lg text-[#8b4513]/70 font-serif italic">
            Notes from the frontlines of Indian craft — culture, techniques, and the people who keep them alive.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {journalArticles.map((article) => (
            <article key={article.slug} className="group cursor-pointer">
              <Link href={`/journal/${article.slug}`} className="block">
                <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                  <Image
                    src={`https://picsum.photos/seed/${article.slug}/600/450`}
                    alt={article.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-700"
                  />
                  <div className="absolute top-4 left-4">
                    <Badge className="rounded-none bg-[#5e2c18]/90 text-amber-50 border-none text-[9px] tracking-widest uppercase px-3 py-1 font-bold">
                      {article.category}
                    </Badge>
                  </div>
                </div>
                <div className="pt-5">
                  <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-amber-700/60 font-bold mb-2">
                    <span>{article.region}</span>
                    <span className="w-1 h-1 rounded-full bg-amber-500/40" />
                    <span>{article.readTime} read</span>
                  </div>
                  <h2 className="font-heading text-xl text-[#5e2c18] group-hover:text-amber-700 transition-colors leading-snug">
                    {article.title}
                  </h2>
                  <p className="text-sm text-foreground/60 leading-relaxed mt-3">{article.excerpt}</p>
                  <span className="inline-block mt-4 text-[11px] uppercase tracking-widest font-bold text-primary border-b border-primary/20 pb-1 group-hover:border-primary">
                    Read Story
                  </span>
                </div>
              </Link>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}