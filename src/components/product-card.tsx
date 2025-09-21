import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ShoppingCart } from 'lucide-react';
import { artisans } from '@/lib/data';

interface ProductCardProps {
  product: Product;
  variant?: 'mission' | 'grid';
}

export default function ProductCard({ product, variant = 'mission' }: ProductCardProps) {
  const cardVariants = {
    mission: "bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl",
    grid: "bg-white/70 backdrop-blur-sm shadow-xl hover:shadow-2xl border border-gray-200/80"
  }
  
  const isGrid = variant === 'grid';
  const artisan = artisans.find(a => a.id === product.artisanId);

  return (
    <Link href={`/product/${product.id}`} className={cn("group block rounded-lg overflow-hidden transition-all duration-300 ease-in-out hover:-translate-y-2", cardVariants[variant])}>
      <div className="relative w-full aspect-square overflow-hidden">
        <Image
          src={product.images[0]}
          alt={product.name}
          width={400}
          height={400}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          data-ai-hint="product image"
        />
        <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
            <h3 className={cn("font-medium text-white transition-transform duration-300 ease-in-out group-hover:-translate-y-6", isGrid ? "text-base" : "text-lg")}>{product.name}</h3>
            <p className="text-sm opacity-0 transition-all duration-300 ease-in-out group-hover:opacity-100 group-hover:-translate-y-2">
              {product.tagline}
            </p>
        </div>
      </div>
      <div className={cn("p-4 text-center", isGrid && "p-4")}>
        <p className="text-sm text-gray-500">{artisan?.shopName || product.category}</p>
        <p className="mt-2 text-lg font-semibold text-amber-900">₹{product.price.toFixed(2)}</p>
      </div>
    </Link>
  );
}
