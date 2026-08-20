import React from 'react';
import type { Product } from '@/lib/types';
import ProductCard from './product-card';

interface ProductListProps {
  products: Product[];
}

export function ProductList({ products }: ProductListProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} variant="grid" />
      ))}
    </div>
  );
}
