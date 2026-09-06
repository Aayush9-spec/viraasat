import type { Metadata } from 'next';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import ProductCard from '@/features/marketplace/components/product-card';
import { toCategorySlug, slugToCategory } from '@/lib/categories';
import { products } from '@/lib/data';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

const categories = Array.from(new Set(products.map((p) => p.category))).sort();

export const generateStaticParams = async () =>
  categories.map((category) => ({ slug: toCategorySlug(category) }));

export const generateMetadata = async ({ params }: PageProps): Promise<Metadata> => {
  const { slug } = await params;
  const category = slugToCategory(slug, categories);
  if (!category) return { title: 'Collection Not Found — Viraasat' };
  return {
    title: `${category} — Viraasat Collection`,
    description: `Handcrafted ${category.toLowerCase()} from India\u2019s master artisans, certified and shipped worldwide.`,
  };
};

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const category = slugToCategory(slug, categories);
  if (!category) notFound();

  const items = products.filter(
    (p) => p.isActive && p.status === 'active' && p.category === category,
  );

  return (
    <div className="bg-background min-h-screen">
      <header className="relative py-20 overflow-hidden bg-[#fbf7f0] border-b border-primary/5">
        <div className="absolute inset-0 opacity-[0.03] clay-texture pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <Badge variant="outline" className="mb-4 border-primary/20 text-primary px-4 py-1 uppercase tracking-widest text-[10px]">Collection</Badge>
          <h1 className="text-4xl md:text-5xl font-heading font-normal text-[#5e2c18]">{category}</h1>
          <p className="mt-4 max-w-2xl text-lg text-[#8b4513]/70 font-serif italic">
            {items.length} handcrafted piece{items.length === 1 ? '' : 's'}, each carrying the story of its maker.
          </p>

          <nav className="mt-8 flex flex-wrap gap-3">
            {categories.map((item) => {
              const active = item === category;
              return (
                <Link
                  key={item}
                  href={`/category/${toCategorySlug(item)}`}
                  className={
                    active
                      ? 'bg-[#5e2c18] text-amber-50 text-xs font-bold uppercase tracking-widest px-4 py-2'
                      : 'bg-white text-foreground/70 hover:text-primary text-xs font-bold uppercase tracking-widest px-4 py-2 border border-primary/10 transition-colors'
                  }
                >
                  {item}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-24">
            <p className="font-serif italic text-foreground/50">This collection is being lovingly replenished.</p>
            <Link href="/shop" className="inline-block mt-6 text-sm font-bold text-primary border-b border-primary/20 pb-1 hover:border-primary">
              Browse all treasures →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}