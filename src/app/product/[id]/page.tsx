'use server';

import { notFound } from 'next/navigation';
import { products } from '@/lib/data';
import { ProductDetailPageClient } from '@/components/product-detail-page';

export default function ProductDetailPage({ params }: { params: { id: string } }) {
  const product = products.find((p) => p.id === params.id);
  if (!product) {
    notFound();
  }

  return <ProductDetailPageClient product={product} />;
}
