'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { PlusCircle, MoreHorizontal } from 'lucide-react';
import { db } from '@/lib/firebase/client';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { products } from '@/lib/data';
import { useUser } from '@clerk/nextjs';

export default function ArtisanProductsPage() {
  const { user } = useUser();
  const [dbProducts, setDbProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!db || !user) return;
    const q = query(collection(db, 'products'), where('artisanId', '==', user.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: Product[] = snapshot.docs.map(
        (doc) => ({ id: doc.id, ...doc.data() } as Product)
      );
      setDbProducts(fetched);
    });
    return () => unsubscribe();
  }, [user]);

  const staticArtisanProducts = products.filter(
    (p) => p.artisanId === (user?.id || 'artisan-1')
  );
  const artisanProducts = [...dbProducts, ...staticArtisanProducts];

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
                          <Link href={`/artisan/products/new`}>Edit Listing</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">Archive</DropdownMenuItem>
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
