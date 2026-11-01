'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlusCircle, MoreHorizontal, Package, Sparkles } from 'lucide-react';
import { supabase } from '@/services/supabase';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { products as staticSeeds, getLocalProducts } from '@/lib/data';
import { useUser } from '@clerk/nextjs';

function stringToUuid(str: string): string {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
    return str;
  }
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const hex = (h1 >>> 0).toString(16).padStart(8, '0') + (h2 >>> 0).toString(16).padStart(8, '0') +
              (h1 ^ h2 >>> 0).toString(16).padStart(8, '0') + (h2 ^ 0x12345678 >>> 0).toString(16).padStart(8, '0');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

export default function ArtisanProductsPage() {
  const { user, isLoaded } = useUser();
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentUserId = user?.id || '';
  const currentUserEmail = user?.primaryEmailAddress?.emailAddress || '';
  const isDemoUser = !currentUserId || currentUserId === 'artisan-1';
  const deterministicUuid = currentUserId ? stringToUuid(currentUserId) : '';

  const refreshLocal = useCallback(() => {
    const items = getLocalProducts();
    setLocalProducts(items);
  }, []);

  useEffect(() => {
    refreshLocal();

    window.addEventListener('focus', refreshLocal);
    window.addEventListener('storage', refreshLocal);
    window.addEventListener('viraasat_products_updated', refreshLocal);

    // Fetch user-scoped products from Supabase and Server API
    const loadUserProducts = async () => {
      setIsLoading(true);
      try {
        let fetched: Product[] = [];

        // 1. Query Supabase filtered by artisan
        if (deterministicUuid) {
          const { data, error } = await supabase
            .from('products')
            .select('*')
            .or(`artisan_id.eq.${deterministicUuid},artisan_id.eq.${currentUserId}`);

          if (!error && data && data.length > 0) {
            fetched = data.map((r) => ({
              id: r.id,
              artisanId: r.artisan_id || currentUserId,
              name: r.name,
              category: r.category,
              description: r.description,
              price: Number(r.price) || 0,
              stock: r.stock ?? 10,
              images: r.images ?? [],
              region: r.region,
              aiInsights: r.ai_insights,
              createdAt: r.created_at,
              status: r.status || 'Active',
            })) as Product[];
          }
        }

        // 2. Query Next.js API with user-scoping
        if (currentUserId) {
          try {
            const res = await fetch(`/api/products?artisanId=${encodeURIComponent(currentUserId)}`);
            if (res.ok) {
              const resData = await res.json();
              if (resData?.data?.products && Array.isArray(resData.data.products)) {
                const apiItems = resData.data.products as Product[];
                fetched = [...fetched, ...apiItems];
              }
            }
          } catch {}
        }

        setDbProducts(fetched);
      } catch (e) {
        console.warn('Error loading artisan products:', e);
      } finally {
        setIsLoading(false);
      }
    };

    if (isLoaded) {
      loadUserProducts();
    }

    return () => {
      window.removeEventListener('focus', refreshLocal);
      window.removeEventListener('storage', refreshLocal);
      window.removeEventListener('viraasat_products_updated', refreshLocal);
    };
  }, [user, isLoaded, currentUserId, deterministicUuid, refreshLocal]);

  // Synchronously fallback to getLocalProducts() if state is not updated yet
  const activeLocalProducts = localProducts.length > 0 ? localProducts : (typeof window !== 'undefined' ? getLocalProducts() : []);

  // Filter local creations to ONLY those belonging to the logged-in artisan
  const myLocalProducts = useMemo(() => {
    return activeLocalProducts.filter((p) => {
      const aid = String(p.artisanId || (p as any).artisan_id || '').trim().toLowerCase();
      if (!aid) return isDemoUser;
      if (currentUserId && aid === currentUserId.toLowerCase()) return true;
      if (currentUserEmail && aid === currentUserEmail.toLowerCase()) return true;
      if (deterministicUuid && aid === deterministicUuid.toLowerCase()) return true;
      if (isDemoUser && aid === 'artisan-1') return true;
      return false;
    });
  }, [activeLocalProducts, currentUserId, currentUserEmail, deterministicUuid, isDemoUser]);

  // For demo/unauthenticated test mode only: show artisan-1 sample seeds
  const seedItems = useMemo(() => {
    if (isDemoUser) {
      return staticSeeds.filter((p) => p.artisanId === 'artisan-1').slice(0, 3);
    }
    return [];
  }, [isDemoUser]);

  // Merge strictly this artisan's items without leaking other artisans' products
  const artisanProducts = useMemo(() => {
    const productsMap = new Map<string, Product>();

    // 1. Local products created by this artisan
    myLocalProducts.forEach((p) => {
      if (!p) return;
      const key = (p.name || '').trim().toLowerCase() || p.id;
      if (!productsMap.has(key)) {
        productsMap.set(key, { ...p, price: Number(p.price) || 0 });
      }
    });

    // 2. Database products belonging to this artisan
    dbProducts.forEach((p) => {
      if (!p) return;
      const key = (p.name || '').trim().toLowerCase() || p.id;
      if (!productsMap.has(key)) {
        productsMap.set(key, { ...p, price: Number(p.price) || 0 });
      }
    });

    // 3. Demo seeds (only if demo user)
    seedItems.forEach((p) => {
      if (!p) return;
      const key = (p.name || '').trim().toLowerCase() || p.id;
      if (!productsMap.has(key)) {
        productsMap.set(key, { ...p, price: Number(p.price) || 0 });
      }
    });

    return Array.from(productsMap.values());
  }, [myLocalProducts, dbProducts, seedItems]);

  return (
    <Card className="border-amber-200/50 dark:border-amber-900/30">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-heading flex items-center gap-2">
              <span>Your Workshop Catalog</span>
              <Badge variant="outline" className="text-xs font-mono border-amber-600/40 text-amber-800 dark:text-amber-300">
                {artisanProducts.length} {artisanProducts.length === 1 ? 'Creation' : 'Creations'}
              </Badge>
            </CardTitle>
            <CardDescription>
              {user?.fullName || user?.firstName
                ? `Manage exclusive handcrafted inventory listed by ${user.fullName || user.firstName}.`
                : 'Manage your personal handcrafted inventory and active listings.'}
            </CardDescription>
          </div>
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5 shrink-0" asChild>
            <Link href="/artisan/products/new">
              <PlusCircle className="h-4 w-4" />
              <span>Add Creation</span>
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-12 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
            <span>Loading your workshop creations...</span>
          </div>
        ) : artisanProducts.length === 0 ? (
          <div className="text-center py-16 px-4 bg-[#FAF7F2] dark:bg-card/50 rounded-2xl border-2 border-dashed border-[#E8DCCB] dark:border-amber-900/30">
            <Package className="w-12 h-12 text-[#C59B4B] mx-auto mb-3 opacity-80" />
            <h3 className="font-serif text-lg font-bold text-[#221C18] dark:text-amber-100">
              No Listed Creations Yet
            </h3>
            <p className="text-xs sm:text-sm text-[#5E2C18]/80 dark:text-amber-200/70 max-w-md mx-auto mt-1 mb-6">
              You haven&rsquo;t added any handcrafted artifacts to your workshop catalog yet.
              Add your first creation with AI image enhancement and fair-wage pricing.
            </p>
            <Button asChild className="bg-[#701D24] hover:bg-[#8C2B2B] text-white text-xs uppercase tracking-wider px-6 py-2.5 rounded-full shadow">
              <Link href="/artisan/products/new">
                <PlusCircle className="w-4 h-4 mr-1.5" />
                Add Your First Creation
              </Link>
            </Button>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="hidden w-[100px] sm:table-cell">Image</TableHead>
                <TableHead>Creation Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Price</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {artisanProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="hidden sm:table-cell">
                    <div className="relative h-12 w-12 rounded-lg overflow-hidden bg-muted">
                      <Image
                        src={
                          Array.isArray(product.images) && product.images[0]
                            ? product.images[0]
                            : '/images/products/clean/handcrafted-terracotta-diya.jpg'
                        }
                        alt={product.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold text-foreground">{product.name}</div>
                      <div className="text-[11px] text-muted-foreground line-clamp-1">{product.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {product.category}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 text-xs">
                      {product.status || 'Active'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-mono font-semibold">
                    ₹{product.price.toLocaleString('en-IN')}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Actions</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/product/${product.id}`} target="_blank">
                            View on Marketplace
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/artisan/products/edit/${product.id}`}>
                            Edit Listing
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
