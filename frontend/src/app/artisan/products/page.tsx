'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlusCircle, MoreHorizontal } from 'lucide-react';
import { supabase } from '@/services/supabase';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { products, getLocalProducts } from '@/lib/data';
import { useUser } from '@clerk/nextjs';

export default function ArtisanProductsPage() {
  const { user } = useUser();
  const [dbProducts, setDbProducts] = useState<Product[]>([]);
  const [localProducts, setLocalProducts] = useState<Product[]>([]);

  const refreshLocal = useCallback(() => {
    const items = getLocalProducts();
    setLocalProducts(items);
  }, []);

  useEffect(() => {
    refreshLocal();

    window.addEventListener('focus', refreshLocal);
    window.addEventListener('storage', refreshLocal);
    window.addEventListener('viraasat_products_updated', refreshLocal);

    const artisanId = user?.id || 'artisan-1';
    supabase
      .from('products')
      .select('*')
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          setDbProducts(
            data.map((r) => ({
              id: r.id,
              artisanId: r.artisan_id || 'artisan-1',
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
            })) as Product[],
          );
        }
      });

    return () => {
      window.removeEventListener('focus', refreshLocal);
      window.removeEventListener('storage', refreshLocal);
      window.removeEventListener('viraasat_products_updated', refreshLocal);
    };
  }, [user, refreshLocal]);

  // Synchronously fallback to getLocalProducts() if state is not updated yet
  const activeLocalProducts = localProducts.length > 0 ? localProducts : (typeof window !== 'undefined' ? getLocalProducts() : []);

  const staticArtisanProducts = products.filter(
    (p) => p.artisanId === 'artisan-1' || (user?.id && p.artisanId === user.id) || true,
  );

  const productsMap = new Map<string, Product>();
  // activeLocalProducts listed first so newly added creations appear at top
  [...activeLocalProducts, ...dbProducts, ...products].forEach((p) => {
    if (p && p.id && !productsMap.has(p.id)) {
      productsMap.set(p.id, p);
    }
  });
  const artisanProducts = Array.from(productsMap.values());



  return (
    <Card className="border-amber-200/50 dark:border-amber-900/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-heading">Products Catalog</CardTitle>
            <CardDescription>
              Manage your handcrafted inventory and active listings.
            </CardDescription>
          </div>
          <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white gap-1.5" asChild>
            <Link href="/artisan/products/new">
              <PlusCircle className="h-4 w-4" />
              <span>Add Creation</span>
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
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
            {artisanProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No products added yet. Click &quot;Add Creation&quot; to list your first item.
                </TableCell>
              </TableRow>
            ) : (
              artisanProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="hidden sm:table-cell">
                    <Image
                      alt={product.name}
                      className="aspect-square rounded-lg object-cover border"
                      height="64"
                      src={product.images[0] || 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?q=80&w=300'}
                      width="64"
                    />
                  </TableCell>
                  <TableCell className="font-semibold">{product.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.category}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                      {product.status || 'Active'}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell font-medium">
                    ₹{product.price.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/artisan/products/edit/${product.id}`}>Edit Listing</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive cursor-pointer"
                          onClick={async () => {
                            try {
                              const localRaw = localStorage.getItem('viraasat_local_products');
                              if (localRaw) {
                                const parsed = JSON.parse(localRaw);
                                const filtered = parsed.filter((p: any) => p.id !== product.id);
                                localStorage.setItem('viraasat_local_products', JSON.stringify(filtered));
                                window.dispatchEvent(new Event('storage'));
                                window.dispatchEvent(new CustomEvent('viraasat_products_updated'));
                              }
                              await supabase.from('products').update({ status: 'Archived' }).eq('id', product.id);
                              refreshLocal();
                            } catch (e) {
                              console.warn('Archive error:', e);
                            }
                          }}
                        >
                          Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
