'use client';
import { useState, useEffect } from 'react';
import ProductCard from '@/features/marketplace/components/product-card';
import { ProductService } from '@/features/marketplace/product-service';
import { categories } from '@/lib/data';
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
import { BACKEND_URL } from '@/services/backend/client';

const regions = [
  'Rajasthan',
  'Kutch',
  'Uttar Pradesh',
  'Varanasi',
  'Kashmir',
  'Andhra Pradesh',
];

export default function ShopPage() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');
  const [semanticScores, setSemanticScores] = useState<Record<string, number>>({});

  useEffect(() => {
    async function loadProducts() {
      const items = await ProductService.getAllProducts();
      const local = localStorage.getItem('viraasat_local_products');
      let finalItems = [...items];
      if (local) {
        try {
          const parsed = JSON.parse(local);
          parsed.forEach((localProd: Product) => {
            if (!finalItems.some(p => p.id === localProd.id)) {
              finalItems.unshift(localProd);
            }
          });
        } catch (e) {}
      }
      setAllProducts(finalItems);
      setFilteredProducts(finalItems);
    }
    loadProducts();
  }, []);

  useEffect(() => {
    if (!searchQuery) {
      setSemanticScores({});
      return;
    }
    
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/search/semantic?q=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          const scores: Record<string, number> = {};
          data.results.forEach((item: any) => {
            scores[item.id] = item.score;
          });
          setSemanticScores(scores);
        }
      } catch (e) {
        console.warn("Semantic search offline, falling back to local query terms matching.");
      }
    }, 300);
    
    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const filterAndSortProducts = () => {
    let tempProducts = [...allProducts];

    // Search (Semantic Vector Search)
    if (searchQuery) {
      if (Object.keys(semanticScores).length > 0) {
        tempProducts = tempProducts.filter(p => (semanticScores[p.id] || 0) > 0.1);
        tempProducts.sort((a, b) => (semanticScores[b.id] || 0) - (semanticScores[a.id] || 0));
      } else {
        tempProducts = tempProducts.filter(p => 
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
    }

    // Category Filter
    if (selectedCategories.length > 0) {
      tempProducts = tempProducts.filter(p => selectedCategories.includes(p.category));
    }

    // Regional Filter
    if (selectedRegions.length > 0) {
      tempProducts = tempProducts.filter(p => 
        selectedRegions.some(region => 
          p.description.toLowerCase().includes(region.toLowerCase()) || 
          p.tagline.toLowerCase().includes(region.toLowerCase())
        )
      );
    }

    // Sort
    switch (sortOrder) {
      case 'price-asc': tempProducts.sort((a, b) => a.price - b.price); break;
      case 'price-desc': tempProducts.sort((a, b) => b.price - a.price); break;
      case 'newest': tempProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
    }

    setFilteredProducts(tempProducts);
  };

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
          {categories.map((cat) => (
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
          {regions.map((region) => (
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
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <Badge variant="outline" className="mb-4 border-primary/20 text-primary px-4 py-1 uppercase tracking-widest text-[10px]">The Viraasat Gallery</Badge>
          <h1 className="text-5xl md:text-7xl font-heading font-normal text-[#5e2c18] mb-6">Masterpieces</h1>
          <p className="max-w-2xl mx-auto text-lg text-[#8b4513]/70 font-serif italic">
            "Discover the soul of India through its most exquisite handcrafted treasures, each piece a legacy of centuries."
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
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
              <div className="relative w-full md:max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search the collection..." 
                  className="pl-10 rounded-none border-none bg-secondary/50 focus-visible:ring-primary/20"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
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
                  <SelectTrigger className="w-full md:w-[200px] rounded-none bg-secondary/50 border-none">
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
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-12">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} variant="grid" />
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
