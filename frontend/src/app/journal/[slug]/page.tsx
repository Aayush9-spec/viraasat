import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { findArticle } from '@/features/journal/articles';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
  const { slug } = await params;
  const article = findArticle(slug);
  if (!article) return { title: 'Article Not Found — Viraasat' };
  return { title: `${article.title} — Heritage Journal`, description: article.excerpt };
};

export default async function JournalArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = findArticle(slug);
  if (!article) notFound();

  return (
    <div className="bg-background min-h-screen">
      <div className="relative py-24 overflow-hidden bg-[#fbf7f0] border-b border-primary/5">
        <div className="absolute inset-0 opacity-[0.03] clay-texture pointer-events-none" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex items-center gap-3 text-[10px] uppercase tracking-widest text-amber-700/60 font-bold mb-4">
            <Badge variant="outline" className="rounded-none border-primary/20 text-primary text-[9px] tracking-widest uppercase px-3 py-1 font-bold">
              {article.category}
            </Badge>
            <span>{article.region}</span>
            <span className="w-1 h-1 rounded-full bg-amber-500/40" />
            <span>{article.readTime} read</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-normal text-[#5e2c18] leading-tight">
            {article.title}
          </h1>
          <p className="mt-6 text-lg text-[#8b4513]/70 font-serif italic leading-relaxed">{article.excerpt}</p>
        </div>
      </div>

      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="relative aspect-[16/9] overflow-hidden bg-neutral-100 mb-12">
          <Image
            src={`https://picsum.photos/seed/${article.slug}/1200/675`}
            alt={article.title}
            fill
            className="object-cover"
          />
        </div>
        <div className="space-y-6">
          {article.body.split('\n').map((paragraph, index) => (
            <p key={index} className="text-foreground/80 leading-[1.9] text-[17px] font-light">
              {paragraph}
            </p>
          ))}
        </div>

        <div className="border-t border-primary/10 mt-16 pt-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
          <p className="text-sm text-muted-foreground font-serif italic">
            Stories like this are only possible when craft is valued — by you.
          </p>
          <Button asChild className="bg-primary text-primary-foreground shrink-0">
            <Link href="/shop">Shop the Craft</Link>
          </Button>
        </div>
      </article>
    </div>
  );
}