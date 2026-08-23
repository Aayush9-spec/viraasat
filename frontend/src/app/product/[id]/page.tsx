'use server';

import { notFound } from 'next/navigation';
import { ProductService } from '@/features/marketplace/product-service';
import { ProductDetailPageClient } from '@/features/marketplace/components/product-detail-page';

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await ProductService.getProductById(id);
  if (!product) {
    notFound();
  }

  return <ProductDetailPageClient product={product} />;
}
