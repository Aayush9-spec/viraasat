
'use client';
import { useState } from 'react';
import ProductCard from '@/components/product-card';
import { products, categories } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Filter } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Product } from '@/lib/types';

export default function ShopPage() {
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(products);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortOrder, setSortOrder] = useState('newest');

  const handleCategoryChange = (category: string) => {
    const newSelectedCategories = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];

    setSelectedCategories(newSelectedCategories);
    filterAndSortProducts(newSelectedCategories, sortOrder);
  };

  const handleSortChange = (value: string) => {
    setSortOrder(value);
    filterAndSortProducts(selectedCategories, value);
  };

  const filterAndSortProducts = (categories: string[], sort: string) => {
    let tempProducts = [...products];

    // Filter by category
    if (categories.length > 0) {
      tempProducts = tempProducts.filter((product) =>
        categories.includes(product.category)
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

  const Filters = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Category</h3>
        <div className="space-y-3">
          {categories.map((category) => (
            <div key={category} className="flex items-center space-x-2">
              <Checkbox
                id={category}
                checked={selectedCategories.includes(category)}
                onCheckedChange={() => handleCategoryChange(category)}
              />
              <Label htmlFor={category} className="cursor-pointer">
                {category}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-background min-h-screen">
      <header className="py-12 bg-gradient-to-r from-teal-50/50 to-orange-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-5xl font-heading font-bold text-amber-900">Shop</h1>
          <p className="mt-2 text-lg text-gray-600">
            Explore our curated collection of handcrafted treasures.
          </p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Desktop Filters */}
          <aside className="hidden lg:block p-6 bg-card rounded-lg shadow-sm h-fit sticky top-24">
            <Filters />
          </aside>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-muted-foreground">
                Showing {filteredProducts.length} of {products.length} products
              </p>
              
              {/* Mobile Filters */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="lg:hidden">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </SheetTrigger>
                <SheetContent>
                    <div className="p-4">
                        <Filters />
                    </div>
                </SheetContent>
              </Sheet>

              {/* Sort Dropdown */}
              <Select onValueChange={handleSortChange} defaultValue={sortOrder}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
                {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} variant="grid" />
                ))}
                </div>
            ) : (
                <div className="text-center py-16">
                    <h2 className="text-2xl font-semibold">No products found</h2>
                    <p className="text-muted-foreground mt-2">Try adjusting your filters.</p>
                </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
