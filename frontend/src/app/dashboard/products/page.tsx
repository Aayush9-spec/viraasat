'use client';

import { useState, useEffect } from 'react';
import Link from "next/link"
import Image from "next/image"
import { PlusCircle, MoreHorizontal } from "lucide-react"
import { supabase } from '@/services/supabase';
import type { Product } from "@/lib/types";

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { products } from "@/lib/data"
import { useUser } from '@clerk/nextjs';

export default function ProductsPage() {
  const { user } = useUser();
  const [dbProducts, setDbProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (!user) return;

    const isValidUuid = (val?: string | null): boolean =>
      typeof val === 'string' &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);

    const loadProducts = async () => {
      try {
        let query = supabase.from('products').select('*');
        if (isValidUuid(user.id)) {
          query = query.eq('artisan_id', user.id);
        }
        const { data, error } = await query.order('created_at', { ascending: false });
        if (!error && data) {
          setDbProducts(
            data.map((r) => ({
              ...r,
              artisanId: r.artisan_id,
              createdAt: r.created_at,
              aiInsights: r.ai_insights,
            })) as Product[]
          );
        }
      } catch {}
    };
    void loadProducts();

    const channelFilter = isValidUuid(user.id) ? `artisan_id=eq.${user.id}` : undefined;
    const channelConfig = channelFilter
      ? { event: '*', schema: 'public', table: 'products', filter: channelFilter }
      : { event: '*', schema: 'public', table: 'products' };

    const channel = supabase
      .channel(`dashboard-prods-${user.id}-${Math.random().toString(36).slice(2, 8)}`)
      .on('postgres_changes', channelConfig as any, async () => {
        let refresh = supabase.from('products').select('*');
        if (isValidUuid(user.id)) {
          refresh = refresh.eq('artisan_id', user.id);
        }
        const { data, error } = await refresh;
        if (!error && data) {
          setDbProducts(
            data.map((r) => ({
              ...r,
              artisanId: r.artisan_id,
              createdAt: r.created_at,
              aiInsights: r.ai_insights,
            })) as Product[]
          );
        }
      })
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [user]);

  // Combine static and db products
  const staticArtisanProducts = products.filter(p => p.artisanId === (user?.id || 'artisan-1'));
  const artisanProducts = [...dbProducts, ...staticArtisanProducts];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Products</CardTitle>
            <CardDescription>
              Manage your products and view their sales performance.
            </CardDescription>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button size="sm" className="h-8 gap-1" asChild>
              <Link href="/dashboard/products/new">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  Add Product
                </span>
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden w-[100px] sm:table-cell">
                <span className="sr-only">Image</span>
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Price</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {artisanProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell className="hidden sm:table-cell">
                  <Image
                    alt={product.name}
                    className="aspect-square rounded-md object-cover"
                    height="64"
                    src={product.images[0]}
                    width="64"
                    data-ai-hint="product image"
                  />
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell>
                  <Badge variant={product.status === 'active' ? 'outline' : 'secondary'}>
                    {product.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  ₹{product.price.toFixed(2)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem asChild><Link href={`/dashboard/products/edit/${product.id}`}>Edit</Link></DropdownMenuItem>
                      <DropdownMenuItem>Delete</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
