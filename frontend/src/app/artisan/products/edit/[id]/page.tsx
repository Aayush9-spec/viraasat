'use client';

import { useEffect, useState, use } from 'react';
import { ProductForm } from '@/features/artisan/components/product-form';
import { ProductService } from '@/features/marketplace/product-service';
import { getLocalProducts, products as staticProducts } from '@/lib/data';
import type { Product } from '@/lib/types';
import { Loader2 } from 'lucide-react';

export default function ArtisanEditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      // 1. Check local products first
      const local = getLocalProducts();
      const localMatch = local.find((p) => p.id === id);
      if (localMatch) {
        setProduct(localMatch);
        setLoading(false);
        return;
      }

      // 2. Fetch from ProductService / Supabase
      const fetched = await ProductService.getProductById(id);
      if (fetched) {
        setProduct(fetched);
      } else {
        const staticMatch = staticProducts.find((p) => p.id === id);
        setProduct(staticMatch);
      }
      setLoading(false);
    }
    loadProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Product Not Found</h2>
        <p className="text-muted-foreground mt-2">Could not find the product to edit.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading font-bold">Edit Heritage Product</h1>
        <p className="text-muted-foreground text-sm">
          Update pricing, details, and inventory for {product.name}.
        </p>
      </div>
      <ProductForm product={product} />
    </div>
  );
}
