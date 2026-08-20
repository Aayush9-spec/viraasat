'use server';

import { notFound } from 'next/navigation';
import { products } from '@/lib/data';
import { ProductDetailPageClient } from '@/components/product-detail-page';

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = products.find((p) => p.id === id);
  if (!product) {
    notFound();
  }

  return <ProductDetailPageClient product={product} />;
}
