'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ShoppingCart, Heart } from 'lucide-react';
import { artisans } from '@/lib/data';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';
import { useToast } from '@/hooks/use-toast';
import { useProductReviews } from '@/hooks/use-product-reviews';
import { Star } from 'lucide-react';
import styles from './product-card.module.css';

interface ProductCardProps {
  product: Product;
  variant?: 'mission' | 'grid';
}

export default function ProductCard({ product, variant = 'mission' }: ProductCardProps) {
  const artisan = artisans.find(a => a.id === product.artisanId);
  const { addItem } = useCart();
  const { toast } = useToast();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { rating, loading: ratingLoading } = useProductReviews(product.id);
  const wishlisted = isWishlisted(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    toast({
      title: "Added to Cart 🛍️",
      description: `${product.name} (₹${product.price.toLocaleString('en-IN')}) is now in your cart.`,
    });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
    toast({
      title: !wishlisted ? "Saved to Wishlist ❤️" : "Removed from Wishlist",
      description: !wishlisted
        ? `${product.name} saved to your heritage wishlist.`
        : `${product.name} removed from your wishlist.`,
    });
  };

  return (
    <div className={cn(styles.parent, "group relative")}>
      <Link href={`/product/${product.id}`}>
        <div className={styles.card}>
          <div className={styles.logo}>
            <span className={cn(styles.circle, styles.circle1)}></span>
            <span className={cn(styles.circle, styles.circle2)}></span>
            <span className={cn(styles.circle, styles.circle3)}></span>
            <span className={cn(styles.circle, styles.circle4)}></span>
            <span className={cn(styles.circle, styles.circle5)}></span>
          </div>

          <button
            onClick={handleToggleWishlist}
            className="absolute top-3 left-3 z-30 p-2 rounded-full bg-background/70 backdrop-blur-md text-foreground hover:text-red-500 transition-colors shadow-md"
            title="Add to Wishlist"
          >
            <Heart className={cn("h-4 w-4 transition-transform active:scale-125", wishlisted && "fill-red-500 text-red-500")} />
          </button>

          <div className={styles.glass}>
            <Image
              src={product.images[0]}
              alt={product.name}
              width={400}
              height={400}
              className={styles.productImage}
              data-ai-hint="product image"
            />
          </div>

          <div className={styles.content}>
            <span className={styles.title}>{product.name}</span>
            <span className={styles.text}>{artisan?.shopName || 'Artisan'}</span>
            {!ratingLoading && rating.count > 0 && (
              <span className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                {rating.avg.toFixed(1)}
                <span className="font-normal text-muted-foreground">({rating.count})</span>
              </span>
            )}
          </div>

          <div className={styles.bottom}>
            <span className={styles.priceTag}>₹{product.price.toFixed(0)}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddToCart}
                className="p-2 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-transform active:scale-90 shadow-md"
                title="Add to Cart"
              >
                <ShoppingCart className="h-4 w-4" />
              </button>
              <button className={styles.viewMoreButton}>
                Details
              </button>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
