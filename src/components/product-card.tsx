import Image from 'next/image';
import Link from 'next/link';

import type { Product } from '@/lib/types';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {

  return (
    <div className="group relative overflow-hidden rounded-lg">
      <Link href={`/product/${product.id}`}>
        <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden bg-gray-200">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-105"
            data-ai-hint="product image"
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-black/50 p-4 text-center">
            <h3 className="text-lg font-semibold text-white">{product.name}</h3>
        </div>
      </Link>
    </div>
  );
}
