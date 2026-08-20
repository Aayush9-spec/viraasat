import React from 'react';
import type { Product } from '@/lib/types';
import ProductCard from '@/features/marketplace/components/product-card';

interface RecommendationCardProps {
  products: Product[];
}

export function RecommendationCard({ products }: RecommendationCardProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-heading font-semibold text-[#5e2c18]">Recommended Heritage Art</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} variant="grid" />
        ))}
      </div>
    </div>
  );
}
