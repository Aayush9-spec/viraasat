import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  variant?: 'mission' | 'grid';
}

export default function ProductCard({ product, variant = 'mission' }: ProductCardProps) {
  const cardVariants = {
    mission: "bg-white/70 backdrop-blur-sm shadow-lg hover:shadow-xl",
    grid: "bg-white/70 backdrop-blur-sm shadow-xl hover:shadow-2xl"
  }
  
  const isGrid = variant === 'grid';

  return (
    <Link href={`/product/${product.id}`} className={cn("group block rounded-lg overflow-hidden transition-all duration-300 ease-in-out hover:-translate-y-1", cardVariants[variant])}>
      <div className="relative w-full aspect-square overflow-hidden">
        <Image
          src={product.images[0]}
          alt={product.name}
          width={400}
          height={400}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          data-ai-hint="product image"
        />
         <div className="absolute top-2 right-2 bg-white/50 backdrop-blur-sm rounded-full p-1.5 text-foreground/70">
            <ShoppingCart className="w-4 h-4" />
        </div>
      </div>
      <div className={cn("p-3 text-center", isGrid && "p-4")}>
        <h3 className={cn("font-medium text-primary", isGrid ? "text-lg" : "text-sm")}>{product.name}</h3>
        {!isGrid && <p className="mt-1 text-xs text-foreground/80">{product.category}</p>}
      </div>
    </Link>
  );
}