import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/product/${product.id}`} className="group block bg-white rounded-lg overflow-hidden border border-gray-200 transition-transform duration-300 ease-in-out hover:-translate-y-2 hover:shadow-2xl">
      <div className="w-full aspect-w-1 aspect-h-1 overflow-hidden">
        <Image
          src={product.images[0]}
          alt={product.name}
          width={400}
          height={400}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          data-ai-hint="product image"
        />
      </div>
      <div className="p-4 text-center">
        <h3 className="text-base font-medium text-gray-900">{product.name}</h3>
        <p className="mt-1 text-sm text-gray-500">{product.category}</p>
        <p className="mt-2 text-lg font-semibold text-primary">${product.price.toFixed(2)}</p>
      </div>
    </Link>
  );
}
