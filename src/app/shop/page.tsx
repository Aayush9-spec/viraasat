
'use client';
import { useState, useEffect } from 'react';
import ProductCard from '@/components/product-card';
import { products, categories } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Filter, Search as SearchIcon, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Product } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { regions } from '@/lib/data';

import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';

export default function ShopPage() {
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('newest');

  useEffect(() => {
    if (!db) return;

    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedProducts: Product[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Product));
      setDbProducts(fetchedProducts);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    filterAndSortProducts(selectedCategories, selectedRegions, searchQuery, sortOrder);
  }, [dbProducts, selectedCategories, selectedRegions, searchQuery, sortOrder]);


  const handleCategoryChange = (category: string) => {
    const newSelectedCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];

    setSelectedCategories(newSelectedCategories);
  };

  const handleRegionChange = (region: string) => {
    const newSelectedRegions = selectedRegions.includes(region)
      ? selectedRegions.filter((r) => r !== region)
      : [...selectedRegions, region];

    setSelectedRegions(newSelectedRegions);
  };

  const handleSortChange = (value: string) => {
    setSortOrder(value);
  };

  const filterAndSortProducts = (categoriesArr: string[], regionsArr: string[], queryStr: string, sort: string) => {
    let tempProducts = [...dbProducts, ...products];

    // Filter by search query
    if (queryStr) {
      const lowQuery = queryStr.toLowerCase();
      tempProducts = tempProducts.filter((product) => 
        product.name.toLowerCase().includes(lowQuery) || 
        product.description.toLowerCase().includes(lowQuery) ||
        product.category.toLowerCase().includes(lowQuery) ||
        product.region?.toLowerCase().includes(lowQuery)
      );
    }

    // Filter by category
    if (categoriesArr.length > 0) {
      tempProducts = tempProducts.filter((product) =>
        categoriesArr.includes(product.category)
      );
    }

    // Filter by region
    if (regionsArr.length > 0) {
      tempProducts = tempProducts.filter((product) =>
        product.region && regionsArr.includes(product.region)
      );
    }

    // Sort products
    switch (sort) {
      case 'price-asc':
        tempProducts.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        tempProducts.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        tempProducts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      default:
        break;
    }

    setFilteredProducts(tempProducts);
  };

  const FiltersList = () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-900/50 mb-4">Category</h3>
        <div className="space-y-3">
          {categories.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={`cat-${category}`}
                checked={selectedCategories.includes(category)}
                onCheckedChange={() => handleCategoryChange(category)}
                className="border-amber-900/20 data-[state=checked]:bg-amber-800 data-[state=checked]:border-amber-800"
              />
              <Label htmlFor={`cat-${category}`} className="text-sm font-medium leading-none cursor-pointer hover:text-amber-800 transition-colors">
                {category}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="pt-6 border-t border-amber-900/10">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-amber-900/50 mb-4">Region</h3>
        <div className="space-y-3">
          {regions.filter(r => r).map((region) => (
            <div key={region} className="flex items-center space-x-2">
              <Checkbox
                id={`reg-${region}`}
                checked={selectedRegions.includes(region)}
                onCheckedChange={() => handleRegionChange(region)}
                className="border-amber-900/20 data-[state=checked]:bg-amber-800 data-[state=checked]:border-amber-800"
              />
              <Label htmlFor={`reg-${region}`} className="text-sm font-medium leading-none cursor-pointer hover:text-amber-800 transition-colors">
                {region}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {(selectedCategories.length > 0 || selectedRegions.length > 0) && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => {
            setSelectedCategories([]);
            setSelectedRegions([]);
          }}
          className="text-muted-foreground hover:text-amber-800 p-0 h-auto"
        >
          Clear all filters
        </Button>
      )}
    </div>
  );

  return (
    <div className="bg-[#fbf7f0] min-h-screen">
      {/* Premium Heritage Header */}
      <header className="relative py-20 overflow-hidden bg-neutral-950 text-amber-50">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23ffffff\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-900/50 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-900/50 to-transparent" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <span className="text-amber-500 text-sm tracking-[0.3em] uppercase mb-4 block">The Marketplace</span>
          <h1 className="text-5xl md:text-7xl font-heading font-normal text-amber-100 mb-6 italic">Shop Heritage</h1>
          <p className="text-lg text-amber-200/50 max-w-2xl mx-auto font-light leading-relaxed">
            Support rural artisans by bringing home a piece of India's timeless legacy.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Search and Sort Bar */}
        <div className="flex flex-col md:flex-row gap-6 justify-between items-center mb-12">
          <div className="relative w-full max-w-md group">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-amber-900/30 group-focus-within:text-amber-800 transition-colors" />
            <Input 
              placeholder="Search products, regions, categories..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 bg-white border-amber-900/10 focus:border-amber-800 focus:ring-amber-800/10 rounded-none h-12"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-900/30 hover:text-amber-800"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <Select onValueChange={handleSortChange} defaultValue={sortOrder}>
              <SelectTrigger className="w-full md:w-[200px] bg-white border-amber-900/10 rounded-none h-12">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Featured First</SelectItem>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>

            {/* Mobile Filter Toggle */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden border-amber-900/10 rounded-none h-12 px-6">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-[#fbf7f0]">
                <div className="py-8">
                  <h2 className="font-heading text-2xl text-amber-900 mb-8">Refine Search</h2>
                  <FiltersList />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block space-y-8 sticky top-24 h-fit">
            <div className="bg-white p-8 border border-amber-900/5 shadow-sm">
              <FiltersList />
            </div>
            
            {/* Curated Box */}
            <div className="bg-amber-900/5 p-8 border border-amber-900/10">
              <h4 className="font-heading text-lg text-amber-900 mb-2">Artisan Direct</h4>
              <p className="text-xs text-amber-900/60 leading-relaxed">
                Every purchase goes directly to the artisan families, ensuring fair wages and preserving traditional crafts.
              </p>
            </div>
          </aside>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-8 pb-4 border-b border-amber-900/10">
              <p className="text-sm font-medium text-amber-900/40 uppercase tracking-widest">
                Showing {filteredProducts.length} unique treasures
              </p>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-12">
                {filteredProducts.filter(p => p.isActive !== false).map((product) => (
                  <ProductCard key={product.id} product={product} variant="grid" />
                ))}
              </div>
            ) : (
              <div className="text-center py-32 border-2 border-dashed border-amber-900/10 bg-amber-900/[0.02]">
                <div className="max-w-xs mx-auto">
                  <SearchIcon className="h-12 w-12 text-amber-900/10 mx-auto mb-4" />
                  <h2 className="text-xl font-heading text-amber-900 mb-2">No masterpieces found</h2>
                  <p className="text-amber-900/50 text-sm mb-8">We couldn't find any products matching your current filters.</p>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategories([]);
                      setSelectedRegions([]);
                    }}
                    className="border-amber-900/20 text-amber-900 rounded-none transform transition active:scale-95"
                  >
                    Reset All Filters
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
