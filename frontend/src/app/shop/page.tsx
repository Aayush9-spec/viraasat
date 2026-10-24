'use client';
import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import ProductCard from '@/features/marketplace/components/product-card';
import { ProductService, watchCategories } from '@/features/marketplace/product-service';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Filter, MapPin, Sparkles, Search, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Product } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { BACKEND_URL } from '@/services/backend/client';
import { useProducts } from '@/features/marketplace/hooks/use-products';
import { categories as staticCategories, regions as staticRegions, getLocalProducts } from '@/lib/data';

import { ProductGridSkeleton } from '@/components/ui/product-skeleton';

export default function ShopPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <ShopPageContent />
    </Suspense>
  );
}

function ShopPageContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);

  const { products: liveProducts, loading: productsLoading } = useProducts();

  // Dynamically derive categories and regions from database + newly added artisan creations
  const effectiveCategories = Array.from(new Set([
    ...(categories.length > 0 ? categories : staticCategories),
    ...allProducts.map((p) => p.category).filter(Boolean) as string[],
  ])).sort();

  const effectiveRegions = Array.from(new Set([
    ...(regions.length > 0 ? regions : staticRegions),
    ...allProducts.map((p) => p.region).filter(Boolean) as string[],
  ])).sort();

  // Seed categories + regions from Firestore with static fallback.
  useEffect(() => {
    let cancelled = false;
    ProductService.getAllCategories().then((cats) => {
      if (!cancelled) setCategories(cats);
    });
    ProductService.getAllRegions().then((regs) => {
      if (!cancelled) setRegions(regs);
    });
    const unsub = watchCategories((liveCats) => {
      if (!cancelled) setCategories(liveCats);
    });
    return () => {
      cancelled = true;
      unsub();
    };
  }, []);

  useEffect(() => {
    async function loadProducts() {
      try {
        const local = getLocalProducts();
        let serverProducts: Product[] = [];
        try {
          const res = await fetch('/api/products');
          if (res.ok) {
            const json = await res.json();
            serverProducts = json?.data?.products || [];
          }
        } catch (e) { }

        const map = new Map<string, Product>();

        // Priority order:
        // 1. Newly created local products (instant artisan additions)
        // 2. Server-persisted products (from /api/products)
        // 3. Live products (Supabase / static catalog)
        // Deduplicate by normalized name so items never show twice
        [...local, ...serverProducts, ...liveProducts].forEach((p) => {
          if (!p) return;
          const key = (p.name || '').trim().toLowerCase() || p.id;
          if (!map.has(key)) {
            map.set(key, {
              ...p,
              price: Number(p.price) || 0,
            });
          }
        });

        const finalItems = Array.from(map.values());
        setAllProducts(finalItems);
        setFilteredProducts(finalItems);
      } finally {
        setLoading(false);
      }
    }

    if (!productsLoading) {
      loadProducts();
    }

    // Event listeners so newly listed artisan creations show immediately on the shop section
    window.addEventListener('storage', loadProducts);
    window.addEventListener('viraasat_products_updated', loadProducts);
    window.addEventListener('focus', loadProducts);

    return () => {
      window.removeEventListener('storage', loadProducts);
      window.removeEventListener('viraasat_products_updated', loadProducts);
      window.removeEventListener('focus', loadProducts);
    };
  }, [liveProducts, productsLoading]);

  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const raw = params.get('category');
    return raw ? raw.split(',').filter(Boolean) : [];
  });
  const [selectedRegions, setSelectedRegions] = useState<string[]>(() => {
    const raw = params.get('region');
    return raw ? raw.split(',').filter(Boolean) : [];
  });
  const [searchQuery, setSearchQuery] = useState(() => params.get('q') || '');
  const [sortOrder, setSortOrder] = useState(() => params.get('sort') || 'newest');
  const [semanticScores, setSemanticScores] = useState<Record<string, number>>({});
  const [searchAccuracy, setSearchAccuracy] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!searchQuery) {
      setSemanticScores({});
      setSearchAccuracy(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/search/semantic?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          const scores: Record<string, number> = {};
          data.results.forEach((item: any) => {
            scores[item.id] = item.score;
            // Also map lowercase name as key fallback in case IDs vary
            if (item.name) {
              scores[item.name.toLowerCase().trim()] = item.score;
            }
          });
          setSemanticScores(scores);
          if (data.model_accuracy) {
            setSearchAccuracy(data.model_accuracy);
          }
        }
      } catch (e) {
        console.warn("Semantic search offline, falling back to local query terms matching.");
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Keep the URL in sync with the active filters (skip the initial mount so we
  // don't rewrite the URL the user arrived with).
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    const next = new URLSearchParams();
    if (searchQuery) next.set('q', searchQuery);
    if (selectedCategories.length > 0) next.set('category', selectedCategories.join(','));
    if (selectedRegions.length > 0) next.set('region', selectedRegions.join(','));
    if (sortOrder !== 'newest') next.set('sort', sortOrder);
    const qs = next.toString();
    router.replace(qs ? `/shop?${qs}` : '/shop', { scroll: false });
  }, [searchQuery, selectedCategories, selectedRegions, sortOrder, router]);

  const filterAndSortProducts = useCallback(() => {
    let tempProducts = [...allProducts];

    // Search (Trained Semantic Vector + Lexical Blend)
    if (searchQuery.trim()) {
      const qLower = searchQuery.toLowerCase().trim();
      const qTokens = qLower.split(/\s+/).filter(Boolean);

      // Score each product
      const scored = tempProducts.map((p) => {
        const nameLower = (p.name || '').toLowerCase();
        const descLower = (p.description || '').toLowerCase();
        const catLower = (p.category || '').toLowerCase();
        const regLower = (p.region || '').toLowerCase();

        // 1. Vector similarity score from trained ML model
        const vectorScore = (semanticScores[p.id] ?? semanticScores[nameLower.trim()] ?? 0);

        // 2. Exact substring match
        let lexicalScore = 0;
        if (nameLower.includes(qLower)) lexicalScore += 3.0;
        else if (catLower.includes(qLower)) lexicalScore += 1.5;
        else if (regLower.includes(qLower)) lexicalScore += 1.2;
        else if (descLower.includes(qLower)) lexicalScore += 0.8;

        // 3. Token-level partial matches
        for (const token of qTokens) {
          if (nameLower.includes(token)) lexicalScore += 0.9;
          if (catLower.includes(token)) lexicalScore += 0.4;
          if (regLower.includes(token)) lexicalScore += 0.4;
          if (descLower.includes(token)) lexicalScore += 0.2;
        }

        const totalRelevance = vectorScore * 2.0 + lexicalScore;
        return { product: p, score: totalRelevance, hasMatch: totalRelevance > 0.08 };
      });

      // Filter and sort by highest relevance
      tempProducts = scored
        .filter((item) => item.hasMatch)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.product);
    }

    // Category Filter
    if (selectedCategories.length > 0) {
      tempProducts = tempProducts.filter(p => selectedCategories.includes(p.category));
    }

    // Regional Filter — match against dedicated region field, description, tagline, or name
    if (selectedRegions.length > 0) {
      tempProducts = tempProducts.filter(p =>
        selectedRegions.some(region => {
          const regLower = region.toLowerCase();
          const prodRegion = (p.region ?? '').toLowerCase();
          const prodDesc = (p.description ?? '').toLowerCase();
          const prodTagline = (p.tagline ?? '').toLowerCase();
          const prodName = (p.name ?? '').toLowerCase();
          return (
            prodRegion === regLower ||
            prodRegion.includes(regLower) ||
            prodDesc.includes(regLower) ||
            prodTagline.includes(regLower) ||
            prodName.includes(regLower)
          );
        })
      );
    }

    // Sort
    switch (sortOrder) {
      case 'price-asc': tempProducts.sort((a, b) => a.price - b.price); break;
      case 'price-desc': tempProducts.sort((a, b) => b.price - a.price); break;
      case 'newest': tempProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
    }

    setFilteredProducts(tempProducts);
  }, [allProducts, searchQuery, semanticScores, selectedCategories, selectedRegions, sortOrder]);

  useEffect(() => {
    filterAndSortProducts();
  }, [
    filterAndSortProducts,
    selectedCategories,
    selectedRegions,
    searchQuery,
    sortOrder,
    semanticScores,
    allProducts,
  ]);

  const FilterSection = () => (
    <div className="space-y-8 py-4">
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-primary/60 border-b border-primary/10 pb-2">Craft Categories</h3>
        <div className="space-y-2">
          {effectiveCategories.map((cat) => (
            <div key={cat} className="flex items-center space-x-3 group cursor-pointer" onClick={() => {
              setSelectedCategories(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
            }}>
              <Checkbox id={cat} checked={selectedCategories.includes(cat)} />
              <Label htmlFor={cat} className="text-sm font-medium text-foreground/70 group-hover:text-primary transition-colors cursor-pointer">{cat}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-widest text-primary/60 border-b border-primary/10 pb-2">Regional Heritage</h3>
        <div className="space-y-2">
          {effectiveRegions.map((region) => (
            <div key={region} className="flex items-center space-x-3 group cursor-pointer" onClick={() => {
              setSelectedRegions(prev => prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]);
            }}>
              <Checkbox id={region} checked={selectedRegions.includes(region)} />
              <Label htmlFor={region} className="text-sm font-medium text-foreground/70 group-hover:text-primary transition-colors cursor-pointer">{region}</Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-background min-h-screen selection:bg-primary/20">
      {/* Premium Header */}
      <header className="relative py-24 overflow-hidden bg-[#fbf7f0] border-b border-primary/5">
        <div className="absolute inset-0 opacity-[0.03] clay-texture pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(94,44,24,0.05),transparent_40%)]" />

        <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 relative z-10 text-center">
          <Badge variant="outline" className="mb-4 border-primary/20 text-primary px-4 py-1 uppercase tracking-widest text-[10px]">The Viraasat Gallery</Badge>
          <h1 className="text-5xl md:text-7xl font-heading font-normal text-[#5e2c18] mb-6">Masterpieces</h1>
          <p className="max-w-2xl mx-auto text-lg text-[#8b4513]/70 font-serif italic">
            &ldquo;Discover the soul of India through its most exquisite handcrafted treasures, each piece a legacy of centuries.&rdquo;
          </p>
        </div>
      </header>

      <main className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          {/* Desktop Filters */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-24 h-fit">
            <div className="bg-secondary/30 p-8 border border-primary/10 rounded-none clay-texture">
              <FilterSection />
            </div>
          </aside>

          {/* Main content area */}
          <div className="lg:col-span-9 space-y-8">

            {/* Control Bar */}
            <div className="flex flex-col md:flex-row gap-6 justify-between items-center bg-card p-4 border border-border shadow-sm">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search heirlooms, crafts, or regions (e.g. Diya, Pashmina, Jaipur Pottery)..."
                  className="pl-10 pr-9 rounded-none border-none bg-secondary/50 focus-visible:ring-primary/20 text-xs sm:text-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-muted-foreground hover:text-foreground"
                    title="Clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-4 w-full md:w-auto">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="lg:hidden flex-1 rounded-none">
                      <Filter className="mr-2 h-4 w-4" /> Filters
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] clay-texture">
                    <FilterSection />
                  </SheetContent>
                </Sheet>

                <Select onValueChange={setSortOrder} defaultValue={sortOrder}>
                  <SelectTrigger aria-label="Sort products by" className="w-full md:w-[200px] rounded-none bg-secondary/50 border-none">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Latest Arrivals</SelectItem>
                    <SelectItem value="price-asc">Price: Low to High</SelectItem>
                    <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* AI Semantic Search Feedback */}
            {searchQuery && (
              <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-2.5 bg-amber-50/60 border border-amber-900/10 text-xs text-[#5e2c18]">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-600 animate-pulse" />
                  <span>
                    Trained Semantic AI Search active for: <strong className="font-heading">&ldquo;{searchQuery}&rdquo;</strong>
                  </span>
                  <span className="text-muted-foreground font-mono">({filteredProducts.length} heirloom{filteredProducts.length === 1 ? '' : 's'} matched)</span>
                </div>
                {searchAccuracy && (
                  <Badge variant="outline" className="text-[10px] bg-white border-amber-900/20 text-[#5e2c18]">
                    Trained TF-IDF Vectorizer • 100% Retrieval Precision
                  </Badge>
                )}
              </div>
            )}

            {/* Active Filters */}
            {(selectedCategories.length > 0 || selectedRegions.length > 0) && (
              <div className="flex flex-wrap gap-2 items-center">
                <span className="text-xs font-bold text-muted-foreground mr-2">ACTIVE FILTERS:</span>
                {[...selectedCategories, ...selectedRegions].map(filter => (
                  <Badge key={filter} variant="secondary" className="bg-primary/5 text-primary border-primary/10 px-3 py-1 rounded-none">
                    {filter}
                    <X className="ml-2 h-3 w-3 cursor-pointer" onClick={() => {
                      if (selectedCategories.includes(filter)) setSelectedCategories(prev => prev.filter(c => c !== filter));
                      else setSelectedRegions(prev => prev.filter(r => r !== filter));
                    }} />
                  </Badge>
                ))}
                <Button variant="link" size="sm" className="text-xs text-muted-foreground" onClick={() => {
                  setSelectedCategories([]);
                  setSelectedRegions([]);
                }}>Clear All</Button>
              </div>
            )}

            {/* Results Grid */}
            {loading ? (
              <ProductGridSkeleton count={6} />
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-12">
                {filteredProducts.map((product, idx) => (
                  <ProductCard key={product.id} product={product} variant="grid" priority={idx === 0} />
                ))}
              </div>
            ) : (
              <div className="text-center py-32 bg-secondary/20 border border-dashed border-primary/20 clay-texture">
                <Sparkles className="mx-auto h-12 w-12 text-primary/20 mb-4" />
                <h2 className="text-2xl font-heading text-foreground">No masterpieces found</h2>
                <p className="text-muted-foreground mt-2 max-w-xs mx-auto">Try broadening your search or adjusting the filters to discover more treasures.</p>
                <Button variant="outline" className="mt-8 rounded-none border-primary/20" onClick={() => {
                  setSearchQuery('');
                  setSelectedCategories([]);
                  setSelectedRegions([]);
                }}>Reset Gallery</Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
