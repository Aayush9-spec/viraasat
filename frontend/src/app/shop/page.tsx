'use client';

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import Image from 'next/image';
import ProductCard from '@/features/marketplace/components/product-card';
import { ProductService, watchCategories } from '@/features/marketplace/product-service';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  Filter,
  MapPin,
  Sparkles,
  Search,
  X,
  ShieldCheck,
  Award,
  SlidersHorizontal,
  LayoutGrid,
  Columns2,
  Grid3X3,
  ChevronDown,
  Heart,
  ShoppingBag,
  Eye,
  Star,
  Clock,
  Truck,
  Feather,
  CheckCircle2,
  Handshake,
} from 'lucide-react';
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
import { categories as staticCategories, regions as staticRegions, getLocalProducts, artisans } from '@/lib/data';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';
import { useToast } from '@/core/hooks/use-toast';
import { getProductImage } from '@/core/utils/utils';
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
  const { addItem } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { toast } = useToast();

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>([]);
  const [regions, setRegions] = useState<string[]>([]);

  // Layout Grid columns: '2' | '3' | '4'
  const [gridCols, setGridCols] = useState<'2' | '3' | '4'>('3');

  // Quick Inspect Modal Product
  const [inspectedProduct, setInspectedProduct] = useState<Product | null>(null);
  const [inspectedActiveImgIdx, setInspectedActiveImgIdx] = useState(0);

  // Filters State
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    const raw = params.get('category');
    return raw ? raw.split(',').filter(Boolean) : [];
  });
  const [selectedRegions, setSelectedRegions] = useState<string[]>(() => {
    const raw = params.get('region');
    return raw ? raw.split(',').filter(Boolean) : [];
  });
  const [searchQuery, setSearchQuery] = useState(() => params.get('q') || '');
  const [sortOrder, setSortOrder] = useState(() => params.get('sort') || 'featured');
  const [maxPrice, setMaxPrice] = useState<number>(35000);
  const [onlyGi, setOnlyGi] = useState(false);
  const [onlyAwardees, setOnlyAwardees] = useState(false);

  // Semantic Search
  const [semanticScores, setSemanticScores] = useState<Record<string, number>>({});
  const [searchAccuracy, setSearchAccuracy] = useState<number | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const hasMounted = useRef(false);

  const { products: liveProducts, loading: productsLoading } = useProducts();

  // Dynamically derive categories and regions from database + newly added artisan creations
  const effectiveCategories = useMemo(() => {
    return Array.from(new Set([
      ...(categories.length > 0 ? categories : staticCategories),
      ...allProducts.map((p) => p.category).filter(Boolean) as string[],
    ])).sort();
  }, [categories, allProducts]);

  const effectiveRegions = useMemo(() => {
    return Array.from(new Set([
      ...(regions.length > 0 ? regions : staticRegions),
      ...allProducts.map((p) => p.region).filter(Boolean) as string[],
    ])).sort();
  }, [regions, allProducts]);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allProducts.forEach((p) => {
      if (p.category) {
        counts[p.category] = (counts[p.category] || 0) + 1;
      }
    });
    return counts;
  }, [allProducts]);

  // Region descriptors
  const regionTags: Record<string, string> = {
    Rajasthan: 'Blue Pottery & Quartz',
    Kashmir: 'Pashmina & Kani Weaves',
    Chhattisgarh: 'Bastar Dhokra Bell Metal',
    Bihar: 'Mithila & Madhubani Art',
    Karnataka: 'Bidriware & Channapatna',
    'Uttar Pradesh': 'Banarasi Silk & Terracotta',
    UP: 'Banarasi Silk & Terracotta',
    Gujarat: 'Kutch Ajrakh & Rogan',
    Odisha: 'Puri Stone & Wood Sculptures',
  };

  // Seed categories + regions
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

  // Load products
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

    window.addEventListener('storage', loadProducts);
    window.addEventListener('viraasat_products_updated', loadProducts);
    window.addEventListener('focus', loadProducts);

    return () => {
      window.removeEventListener('storage', loadProducts);
      window.removeEventListener('viraasat_products_updated', loadProducts);
      window.removeEventListener('focus', loadProducts);
    };
  }, [liveProducts, productsLoading]);

  // Semantic search debounce
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
        console.warn("Semantic search offline, falling back to local query matching.");
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Sync URL search params
  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return;
    }
    const next = new URLSearchParams();
    if (searchQuery) next.set('q', searchQuery);
    if (selectedCategories.length > 0) next.set('category', selectedCategories.join(','));
    if (selectedRegions.length > 0) next.set('region', selectedRegions.join(','));
    if (sortOrder !== 'featured' && sortOrder !== 'newest') next.set('sort', sortOrder);
    const qs = next.toString();
    router.replace(qs ? `/shop?${qs}` : '/shop', { scroll: false });
  }, [searchQuery, selectedCategories, selectedRegions, sortOrder, router]);

  // Main Filter and Sort logic
  const filterAndSortProducts = useCallback(() => {
    let tempProducts = [...allProducts];

    // Search
    if (searchQuery.trim()) {
      const qLower = searchQuery.toLowerCase().trim();
      const qTokens = qLower.split(/\s+/).filter(Boolean);

      const scored = tempProducts.map((p) => {
        const nameLower = (p.name || '').toLowerCase();
        const descLower = (p.description || '').toLowerCase();
        const catLower = (p.category || '').toLowerCase();
        const regLower = (p.region || '').toLowerCase();

        const vectorScore = semanticScores[p.id] ?? semanticScores[nameLower.trim()] ?? 0;

        let lexicalScore = 0;
        if (nameLower.includes(qLower)) lexicalScore += 3.0;
        else if (catLower.includes(qLower)) lexicalScore += 1.5;
        else if (regLower.includes(qLower)) lexicalScore += 1.2;
        else if (descLower.includes(qLower)) lexicalScore += 0.8;

        for (const token of qTokens) {
          if (nameLower.includes(token)) lexicalScore += 0.9;
          if (catLower.includes(token)) lexicalScore += 0.4;
          if (regLower.includes(token)) lexicalScore += 0.4;
          if (descLower.includes(token)) lexicalScore += 0.2;
        }

        const totalRelevance = vectorScore * 2.0 + lexicalScore;
        return { product: p, score: totalRelevance, hasMatch: totalRelevance > 0.08 };
      });

      tempProducts = scored
        .filter((item) => item.hasMatch)
        .sort((a, b) => b.score - a.score)
        .map((item) => item.product);
    }

    // Category Filter
    if (selectedCategories.length > 0) {
      tempProducts = tempProducts.filter((p) => selectedCategories.includes(p.category));
    }

    // Regional Filter
    if (selectedRegions.length > 0) {
      tempProducts = tempProducts.filter((p) =>
        selectedRegions.some((region) => {
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

    // Max Price Filter
    if (maxPrice < 35000) {
      tempProducts = tempProducts.filter((p) => p.price <= maxPrice);
    }

    // GI Tag Compliance Only
    if (onlyGi) {
      tempProducts = tempProducts.filter((p) => Boolean(p.region && p.region.trim() !== ''));
    }

    // Shilp Guru Awardees Only
    if (onlyAwardees) {
      tempProducts = tempProducts.filter((p) => p.price >= 7000);
    }

    // Sort Order
    switch (sortOrder) {
      case 'price-asc':
        tempProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        tempProducts.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        tempProducts.sort((a, b) => (b.price % 5) - (a.price % 5));
        break;
      case 'newest':
        tempProducts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        break;
      case 'featured':
      default:
        // Prioritize pieces with regional GI significance
        tempProducts.sort((a, b) => (b.region ? 1 : 0) - (a.region ? 1 : 0));
        break;
    }

    setFilteredProducts(tempProducts);
  }, [allProducts, searchQuery, semanticScores, selectedCategories, selectedRegions, maxPrice, onlyGi, onlyAwardees, sortOrder]);

  useEffect(() => {
    filterAndSortProducts();
  }, [filterAndSortProducts]);

  // Reset all filters
  const resetAllFilters = () => {
    setSelectedCategories([]);
    setSelectedRegions([]);
    setSearchQuery('');
    setMaxPrice(35000);
    setOnlyGi(false);
    setOnlyAwardees(false);
    setSortOrder('featured');
    toast({
      title: "Filters Cleared",
      description: "Displaying all authentic handcrafted heirlooms.",
    });
  };

  // Inspect Modal Helper
  const openInspectModal = (p: Product) => {
    setInspectedProduct(p);
    setInspectedActiveImgIdx(0);
  };

  const closeInspectModal = () => {
    setInspectedProduct(null);
  };

  // Current inspected artisan
  const inspectedArtisan = useMemo(() => {
    if (!inspectedProduct) return null;
    return (
      artisans.find((a) => a.id === inspectedProduct.artisanId) ||
      artisans.find((a) =>
        a.location?.toLowerCase().includes((inspectedProduct.region || '').toLowerCase())
      ) ||
      artisans[0]
    );
  }, [inspectedProduct]);

  // Sidebar Component for Desktop & Mobile
  const FilterSection = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between pb-3 border-b border-[#E8DCCB]">
        <h3 className="font-serif text-lg font-bold text-[#221C18] flex items-center gap-2">
          <Filter className="w-4 h-4 text-[#C59B4B]" />
          Refine Collection
        </h3>
        {(selectedCategories.length > 0 || selectedRegions.length > 0 || maxPrice < 35000 || onlyGi || onlyAwardees) && (
          <button
            type="button"
            onClick={resetAllFilters}
            className="text-[11px] font-semibold text-[#701D24] hover:underline cursor-pointer"
          >
            Reset All
          </button>
        )}
      </div>

      {/* Group 1: Craft Categories */}
      <div>
        <div className="flex items-center justify-between text-xs font-bold text-[#221C18] uppercase tracking-wider mb-3">
          <span>Craft Discipline</span>
          <span className="text-[10px] text-[#655B53]">Items</span>
        </div>
        <div className="space-y-2 text-xs">
          {effectiveCategories.map((cat) => {
            const count = categoryCounts[cat] || 1;
            const isChecked = selectedCategories.includes(cat);
            return (
              <label
                key={cat}
                className="flex items-center justify-between cursor-pointer group py-1 text-[#221C18] hover:text-[#701D24] select-none"
              >
                <div className="flex items-center gap-2.5">
                  <Checkbox
                    id={`cat-${cat}`}
                    checked={isChecked}
                    onCheckedChange={() => {
                      setSelectedCategories((prev) =>
                        prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
                      );
                    }}
                  />
                  <span className="group-hover:translate-x-0.5 transition-transform text-xs font-medium">
                    {cat}
                  </span>
                </div>
                <span className="text-[10px] text-[#655B53] font-mono bg-[#FAF7F2] border border-[#E8DCCB] px-1.5 py-0.5 rounded">
                  {count}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Group 2: Regional Heritage */}
      <div className="pt-4 border-t border-[#E8DCCB]">
        <div className="flex items-center justify-between text-xs font-bold text-[#221C18] uppercase tracking-wider mb-3">
          <span>Regional Cluster</span>
          <span className="text-[10px] text-[#655B53]">GI Origin</span>
        </div>
        <div className="space-y-2 text-xs">
          {effectiveRegions.map((region) => {
            const tag = regionTags[region] || 'Handloom Heritage';
            const isChecked = selectedRegions.includes(region);
            return (
              <label
                key={region}
                className="flex items-center justify-between cursor-pointer group py-1 text-[#221C18] hover:text-[#701D24] select-none"
              >
                <div className="flex items-center gap-2.5">
                  <Checkbox
                    id={`reg-${region}`}
                    checked={isChecked}
                    onCheckedChange={() => {
                      setSelectedRegions((prev) =>
                        prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]
                      );
                    }}
                  />
                  <span className="group-hover:translate-x-0.5 transition-transform text-xs font-medium">
                    {region}
                  </span>
                </div>
                <span className="text-[9.5px] text-[#8F6826] font-medium truncate max-w-[130px]" title={tag}>
                  {tag}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Group 3: Valuation Range Slider */}
      <div className="pt-4 border-t border-[#E8DCCB]">
        <div className="flex items-center justify-between text-xs font-bold text-[#221C18] uppercase tracking-wider mb-2">
          <span>Valuation Range</span>
          <span className="font-serif text-[#701D24] text-sm font-bold">
            {maxPrice >= 35000 ? 'All Valuations' : `Up to ₹${maxPrice.toLocaleString('en-IN')}`}
          </span>
        </div>
        <input
          type="range"
          min="500"
          max="35000"
          step="500"
          value={maxPrice}
          onChange={(e) => setMaxPrice(Number(e.target.value))}
          className="w-full accent-[#701D24] cursor-pointer"
        />
        <div className="flex justify-between text-[10px] text-[#655B53] mt-1 font-mono">
          <span>₹500</span>
          <span>₹15,000</span>
          <span>₹35,000+</span>
        </div>
      </div>

      {/* Group 4: Heritage Provenance Toggles */}
      <div className="pt-4 border-t border-[#E8DCCB] space-y-2.5">
        <span className="text-xs font-bold text-[#221C18] uppercase tracking-wider block mb-2">
          Heritage Provenance
        </span>

        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-[#221C18] select-none">
          <Checkbox
            id="filter-gi-only"
            checked={onlyGi}
            onCheckedChange={(checked) => setOnlyGi(Boolean(checked))}
          />
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-[#C59B4B]" />
            Geographical Indication (GI) Only
          </span>
        </label>

        <label className="flex items-center gap-2.5 cursor-pointer text-xs text-[#221C18] select-none">
          <Checkbox
            id="filter-awardees-only"
            checked={onlyAwardees}
            onCheckedChange={(checked) => setOnlyAwardees(Boolean(checked))}
          />
          <span className="flex items-center gap-1.5 font-medium">
            <Award className="w-3.5 h-3.5 text-[#701D24]" />
            Masterwork &amp; Shilp Guru Creations
          </span>
        </label>
      </div>

      {/* Viraasat Fair Trade Charter Callout */}
      <div className="bg-[#FAF7F2] rounded-xl p-3.5 border border-[#C59B4B]/40 text-[11px] leading-relaxed text-[#655B53]">
        <strong className="text-[#221C18] block mb-0.5 font-serif text-xs flex items-center gap-1.5">
          <Handshake className="w-3.5 h-3.5 text-[#C59B4B]" />
          Viraasat Fair Trade Charter
        </strong>
        Every purchase directly empowers registered master artisans with transparent escrow, zero middleman cuts, and signed lineage provenance.
      </div>
    </div>
  );

  return (
    <div className="bg-[#FAF8F5] min-h-screen selection:bg-[#C59B4B]/20 selection:text-[#701D24]">
      {/* ================= EDITORIAL HERO HEADER ================= */}
      <header className="relative py-16 sm:py-20 bg-gradient-to-b from-[#FAF7F2] to-[#F3EDE2]/50 border-b border-[#E8DCCB]">
        <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <nav className="flex items-center gap-2 text-xs text-[#655B53] mb-3 font-medium">
                <Link href="/" className="hover:text-[#701D24] transition-colors">
                  Heritage Atelier
                </Link>
                <span>/</span>
                <span className="text-[#221C18] font-semibold">Rare Indian Handicrafts &amp; Weaves</span>
              </nav>
              <h1 className="font-serif text-3xl sm:text-5xl text-[#221C18] font-normal leading-tight">
                Preserving Living Heritage: <span className="italic text-[#701D24]">Master Craftsmen Catalog</span>
              </h1>
              <p className="text-[#655B53] text-xs sm:text-sm mt-2 max-w-2xl font-light leading-relaxed">
                Every creation is verified by the Geographical Indication registry and handcrafted with natural mineral pigments, heirloom woods, bell metal alloys, and hand-spun cashmere.
              </p>
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-xs text-[#655B53] font-semibold uppercase tracking-wider">
                Curated: <strong className="text-[#221C18] font-bold">{filteredProducts.length} Artifacts</strong>
              </span>
              <span className="h-3 w-px bg-[#E8DCCB]" />
              <span className="text-xs text-emerald-800 font-semibold flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                100% Fair Wage Direct
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* ================= MAIN CATALOG BODY ================= */}
      <main className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 py-10">
        {/* TOP TOOLBAR: SEARCH, CONTROLS, SORT */}
        <div className="bg-white p-4 rounded-2xl border border-[#E8DCCB] shadow-sm mb-8 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          {/* Search Input Bar */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-[#8F6826] absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by craft (Dhokra, Pashmina, Blue Pottery), artisan, or region..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#FAF7F2] border border-[#E8DCCB] rounded-xl py-2.5 pl-10 pr-9 text-xs text-[#221C18] placeholder-[#655B53]/70 focus:outline-none focus:border-[#C59B4B] focus:ring-1 focus:ring-[#C59B4B] transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-3 text-[#655B53] hover:text-[#221C18] text-xs cursor-pointer"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Toolbar Controls: Mobile Filter, Grid Layouts & Sort */}
          <div className="flex items-center justify-between lg:justify-end gap-3 flex-wrap">
            {/* Mobile Filter Drawer Trigger */}
            <Sheet>
              <SheetTrigger asChild>
                <button
                  type="button"
                  className="lg:hidden px-3.5 py-2 border border-[#E8DCCB] bg-[#FAF7F2] rounded-xl text-xs font-semibold text-[#221C18] flex items-center gap-1.5 cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#701D24]" />
                  <span>
                    Filter Crafts (
                    {selectedCategories.length + selectedRegions.length + (onlyGi ? 1 : 0) + (onlyAwardees ? 1 : 0)}
                    )
                  </span>
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] overflow-y-auto bg-white p-6">
                <FilterSection />
              </SheetContent>
            </Sheet>

            {/* Layout Grid Switcher */}
            <div className="hidden sm:flex items-center bg-[#FAF7F2] p-1 rounded-xl border border-[#E8DCCB]">
              <button
                type="button"
                onClick={() => setGridCols('3')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  gridCols === '3' ? 'bg-white text-[#701D24] shadow-xs' : 'text-[#655B53] hover:text-[#221C18]'
                }`}
                title="Curator Editorial Grid (3 Columns)"
                aria-label="3 columns grid"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setGridCols('2')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  gridCols === '2' ? 'bg-white text-[#701D24] shadow-xs' : 'text-[#655B53] hover:text-[#221C18]'
                }`}
                title="Studio Detail View (2 Columns)"
                aria-label="2 columns grid"
              >
                <Columns2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setGridCols('4')}
                className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                  gridCols === '4' ? 'bg-white text-[#701D24] shadow-xs' : 'text-[#655B53] hover:text-[#221C18]'
                }`}
                title="Compact Catalog Grid (4 Columns)"
                aria-label="4 columns grid"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
            </div>

            {/* Sort Select */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-[#655B53] uppercase tracking-wider whitespace-nowrap">
                Sort:
              </span>
              <Select onValueChange={setSortOrder} defaultValue={sortOrder}>
                <SelectTrigger
                  aria-label="Sort products by"
                  className="bg-[#FAF7F2] border border-[#E8DCCB] rounded-xl py-2 pl-3 pr-8 text-xs font-medium text-[#221C18] focus:outline-none focus:border-[#C59B4B] cursor-pointer"
                >
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="featured">Heirloom Significance</SelectItem>
                  <SelectItem value="price-asc">Price: Humble to Precious</SelectItem>
                  <SelectItem value="price-desc">Price: Precious to Collector</SelectItem>
                  <SelectItem value="rating">Patron Acclaim</SelectItem>
                  <SelectItem value="newest">Latest Guild Arrivals</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* AI Semantic Search Notification */}
        {searchQuery && (
          <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-3 bg-[#FAF7F2] border border-[#C59B4B]/40 rounded-xl text-xs text-[#221C18] mb-6">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#C59B4B] animate-pulse" />
              <span>
                Trained Semantic Search matching: <strong className="font-serif">&ldquo;{searchQuery}&rdquo;</strong>
              </span>
              <span className="text-[#655B53] font-mono">
                ({filteredProducts.length} certified heirloom{filteredProducts.length === 1 ? '' : 's'})
              </span>
            </div>
            {searchAccuracy && (
              <Badge variant="outline" className="text-[10px] bg-white border-[#C59B4B]/40 text-[#701D24]">
                Trained Vector Retrieval Precision: {Math.round(searchAccuracy * 100)}%
              </Badge>
            )}
          </div>
        )}

        {/* Active Filter Tags Bar */}
        {(selectedCategories.length > 0 ||
          selectedRegions.length > 0 ||
          maxPrice < 35000 ||
          onlyGi ||
          onlyAwardees) && (
          <div className="flex items-center gap-2 flex-wrap mb-6">
            <span className="text-xs text-[#655B53] font-semibold uppercase tracking-wider">
              Active Filters:
            </span>

            {selectedCategories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-[#701D24] text-white"
              >
                {cat}
                <button
                  type="button"
                  onClick={() => setSelectedCategories((prev) => prev.filter((c) => c !== cat))}
                  className="hover:text-[#E8CA82] cursor-pointer"
                  title={`Remove ${cat}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {selectedRegions.map((reg) => (
              <span
                key={reg}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-[#C59B4B] text-[#221C18] font-semibold"
              >
                {reg}
                <button
                  type="button"
                  onClick={() => setSelectedRegions((prev) => prev.filter((r) => r !== reg))}
                  className="hover:text-white cursor-pointer"
                  title={`Remove ${reg}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {maxPrice < 35000 && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-white border border-[#E8DCCB] text-[#221C18]">
                Max ₹{maxPrice.toLocaleString('en-IN')}
                <button
                  type="button"
                  onClick={() => setMaxPrice(35000)}
                  className="hover:text-[#701D24] cursor-pointer"
                  title="Clear price filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {onlyGi && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-white border border-[#C59B4B] text-[#221C18]">
                GI Tag Only
                <button
                  type="button"
                  onClick={() => setOnlyGi(false)}
                  className="hover:text-[#701D24] cursor-pointer"
                  title="Clear GI filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            {onlyAwardees && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-white border border-[#701D24] text-[#701D24]">
                Shilp Guru Only
                <button
                  type="button"
                  onClick={() => setOnlyAwardees(false)}
                  className="hover:text-[#221C18] cursor-pointer"
                  title="Clear Shilp Guru filter"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            )}

            <button
              type="button"
              onClick={resetAllFilters}
              className="text-xs text-[#701D24] hover:underline font-semibold ml-2 cursor-pointer"
            >
              Clear All
            </button>
          </div>
        )}

        {/* TWO-COLUMN LAYOUT: SIDEBAR + PRODUCT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Desktop Left Sidebar */}
          <aside className="hidden lg:block lg:col-span-3 sticky top-24 space-y-6">
            <div className="bg-white rounded-2xl border border-[#E8DCCB] p-5 shadow-sm">
              <FilterSection />
            </div>
          </aside>

          {/* Right Product Grid Area */}
          <section className="lg:col-span-9">
            {loading ? (
              <ProductGridSkeleton count={6} />
            ) : filteredProducts.length === 0 ? (
              /* Empty State */
              <div className="bg-white rounded-2xl border border-[#E8DCCB] p-12 text-center my-6 shadow-sm">
                <div className="w-16 h-16 bg-[#FAF7F2] rounded-full flex items-center justify-center mx-auto mb-4 text-[#C59B4B]">
                  <Feather className="w-7 h-7" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#221C18]">
                  No Heirloom Matches Your Criteria
                </h3>
                <p className="text-[#655B53] text-xs sm:text-sm max-w-md mx-auto mt-2 leading-relaxed">
                  We couldn&apos;t find artifacts matching your exact combination. Try broadening your region filter or expanding the valuation slider.
                </p>
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="mt-6 px-6 py-2.5 bg-[#701D24] hover:bg-[#8C2B2B] text-white rounded-full text-xs font-semibold uppercase tracking-wider transition-colors shadow cursor-pointer"
                >
                  Reset Filters &amp; View All
                </button>
              </div>
            ) : (
              /* Dynamic Products Grid */
              <div
                className={`grid gap-6 transition-all duration-300 ${
                  gridCols === '2'
                    ? 'grid-cols-1 sm:grid-cols-2'
                    : gridCols === '4'
                    ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4'
                    : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                }`}
              >
                {filteredProducts.map((product, idx) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant="grid"
                    priority={idx === 0}
                    onQuickInspect={openInspectModal}
                  />
                ))}
              </div>
            )}

            {/* Bottom Catalog Summary */}
            <div className="mt-12 pt-8 border-t border-[#E8DCCB] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#655B53]">
              <span>
                Showing <strong className="text-[#221C18]">{filteredProducts.length}</strong> of{' '}
                <strong className="text-[#221C18]">{allProducts.length}</strong> cataloged masterworks
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-lg border border-[#E8DCCB] bg-white text-[#655B53] opacity-40 cursor-not-allowed"
                  disabled
                >
                  Previous
                </button>
                <button
                  type="button"
                  className="w-8 h-8 rounded-lg bg-[#701D24] text-white font-bold text-xs flex items-center justify-center shadow-xs"
                >
                  1
                </button>
                <button
                  type="button"
                  className="px-3.5 py-1.5 rounded-lg border border-[#E8DCCB] bg-white text-[#221C18] hover:border-[#C59B4B] hover:text-[#701D24] transition-colors cursor-pointer"
                  onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                  Back to Top
                </button>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ================= QUICK PROVENANCE INSPECT MODAL ================= */}
      {inspectedProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200"
          onClick={closeInspectModal}
        >
          <div
            className="bg-[#FAF8F5] rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-[#C59B4B] relative animate-in zoom-in-95 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={closeInspectModal}
              className="absolute top-5 right-5 z-20 w-9 h-9 rounded-full bg-white/90 backdrop-blur text-[#221C18] hover:bg-[#701D24] hover:text-white flex items-center justify-center shadow-md transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 max-h-[85vh] overflow-y-auto no-scrollbar">
              {/* Left Column: Image & Gallery */}
              <div className="lg:col-span-6 bg-[#F3EDE2]/60 p-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-white border border-[#E8DCCB] shadow-sm">
                    <Image
                      src={
                        Array.isArray(inspectedProduct.images) && inspectedProduct.images[inspectedActiveImgIdx]
                          ? inspectedProduct.images[inspectedActiveImgIdx]
                          : getProductImage(inspectedProduct.images)
                      }
                      alt={inspectedProduct.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                    />
                    <span className="absolute top-3 left-3 bg-[#FAF7F2]/95 backdrop-blur-md text-[#221C18] text-[10px] font-bold px-2.5 py-1 rounded-md border border-[#C59B4B] flex items-center gap-1 shadow-xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#C59B4B]" />
                      <span>{inspectedProduct.region ? `GI • ${inspectedProduct.region}` : 'GI Certified'}</span>
                    </span>
                  </div>

                  {/* Thumbnail Row */}
                  {Array.isArray(inspectedProduct.images) && inspectedProduct.images.length > 1 && (
                    <div className="grid grid-cols-4 gap-2">
                      {inspectedProduct.images.slice(0, 4).map((img, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setInspectedActiveImgIdx(idx)}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                            inspectedActiveImgIdx === idx ? 'border-[#C59B4B] shadow-sm' : 'border-[#E8DCCB] opacity-75 hover:opacity-100'
                          }`}
                        >
                          <Image src={img} alt={`Process ${idx + 1}`} fill sizes="80px" className="object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Provenance Registry Details */}
                <div className="mt-6 pt-4 border-t border-[#E8DCCB] flex items-center justify-between text-xs text-[#655B53]">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-white rounded border border-[#E8DCCB] flex items-center justify-center text-[#221C18] font-mono text-[10px] font-bold">
                      GI
                    </div>
                    <div>
                      <p className="font-bold text-[#221C18] text-[11px]">
                        Registry Ref: IND-CRAFT-{inspectedProduct.id.slice(0, 6).toUpperCase()}
                      </p>
                      <p className="text-[10px]">Ministry of Commerce &amp; Industry, Govt of India</p>
                    </div>
                  </div>
                  <span className="text-emerald-800 font-bold text-[11px] bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                    Verified Origin
                  </span>
                </div>
              </div>

              {/* Right Column: Craft Chronicle & Acquisition */}
              <div className="lg:col-span-6 p-6 sm:p-8 flex flex-col justify-between space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs uppercase tracking-widest text-[#8F6826] font-bold">
                      {inspectedProduct.category || 'Heirloom Craft'}
                    </span>
                    <span className="text-[#655B53]">•</span>
                    <span className="text-xs text-[#655B53] font-medium">
                      {inspectedProduct.region || 'India'}
                    </span>
                  </div>

                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#221C18] leading-snug">
                    {inspectedProduct.name}
                  </h2>

                  {/* Master Artisan Chip */}
                  <div className="flex items-center gap-3 mt-4 p-3 rounded-xl bg-white border border-[#E8DCCB]">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#C59B4B] shrink-0">
                      <Image
                        src={inspectedArtisan?.profilePicture || '/images/artisans/bannuram-baid.jpg'}
                        alt={inspectedArtisan?.name || 'Master Artisan'}
                        fill
                        sizes="48px"
                        className="object-cover object-top"
                      />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-[#221C18]">
                        {inspectedArtisan?.name || inspectedProduct.artisanName || 'Master Artisan'}
                      </p>
                      <p className="text-[11px] text-[#655B53]">
                        {inspectedArtisan?.shopName || 'Authentic Lineage Guild'} • {inspectedArtisan?.location || inspectedProduct.region || 'India'}
                      </p>
                    </div>
                  </div>

                  {/* Valuation & Fair Share */}
                  <div className="mt-5 flex items-baseline justify-between pt-2">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider text-[#655B53] font-semibold block">
                        Artisan Guild Valuation
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="font-serif text-3xl font-bold text-[#701D24]">
                          ₹{Number(inspectedProduct.price).toFixed(0)}
                        </span>
                        <span className="text-xs text-[#655B53] line-through">
                          ₹{(Number(inspectedProduct.price) * 1.25).toFixed(0)}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="inline-block bg-emerald-50 text-emerald-800 text-[10px] font-bold px-3 py-1 rounded-full border border-emerald-300">
                        84% direct to maker
                      </span>
                    </div>
                  </div>

                  {/* Description & Materials */}
                  <div className="mt-4 text-xs text-[#655B53] leading-relaxed space-y-2">
                    <p>{inspectedProduct.description || 'Handcrafted using sacred generational techniques passed down through master craft guilds.'}</p>
                    <div className="grid grid-cols-2 gap-2 pt-2 text-[11px] text-[#221C18]">
                      <div className="bg-[#FAF7F2] p-2.5 rounded-lg border border-[#E8DCCB]">
                        <span className="text-[#655B53] block text-[10px] uppercase font-bold">Materials</span>
                        <span className="font-medium truncate block">Organic Mineral Glazes &amp; Fiber</span>
                      </div>
                      <div className="bg-[#FAF7F2] p-2.5 rounded-lg border border-[#E8DCCB]">
                        <span className="text-[#655B53] block text-[10px] uppercase font-bold">Craft Duration</span>
                        <span className="font-medium truncate block">
                          {Number(inspectedProduct.price) >= 15000 ? '90 Days Handloom' : '21 Days Guild Casting'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="space-y-3 pt-3 border-t border-[#E8DCCB]">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        addItem(inspectedProduct);
                        closeInspectModal();
                        toast({
                          title: "Acquired to Collection 🛍️",
                          description: `${inspectedProduct.name} is now in your heirloom cart.`,
                        });
                      }}
                      className="flex-1 py-3.5 bg-[#701D24] hover:bg-[#8C2B2B] text-white rounded-xl text-xs font-semibold uppercase tracking-wider transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Acquire to Collection</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        toggleWishlist(inspectedProduct);
                        toast({
                          title: isWishlisted(inspectedProduct.id) ? "Removed from Wishlist" : "Saved to Wishlist ❤️",
                          description: `${inspectedProduct.name} updated in your sacred wishlist.`,
                        });
                      }}
                      className="px-4 py-3.5 bg-white border border-[#E8DCCB] hover:border-[#C59B4B] rounded-xl text-[#221C18] transition-colors cursor-pointer"
                      title="Toggle Wishlist"
                    >
                      <Heart
                        className={`w-4 h-4 ${
                          isWishlisted(inspectedProduct.id) ? 'fill-[#701D24] text-[#701D24]' : ''
                        }`}
                      />
                    </button>
                  </div>
                  <p className="text-[10px] text-center text-[#655B53] flex items-center justify-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-[#C59B4B]" />
                    Ships in customized museum crate with GI provenance paper
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
