import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ShoppingCart } from 'lucide-react';
import { artisans } from '@/lib/data';
import styles from './product-card.module.css';

interface ProductCardProps {
  product: Product;
  variant?: 'mission' | 'grid';
}

export default function ProductCard({ product, variant = 'mission' }: ProductCardProps) {
  const artisan = artisans.find(a => a.id === product.artisanId);

  return (
    <div className={cn(styles.parent, "group")}>
      <Link href={`/product/${product.id}`}>
        <div className={styles.card}>
          <div className={styles.logo}>
            <span className={cn(styles.circle, styles.circle1)}></span>
            <span className={cn(styles.circle, styles.circle2)}></span>
            <span className={cn(styles.circle, styles.circle3)}></span>
            <span className={cn(styles.circle, styles.circle4)}></span>
            <span className={cn(styles.circle, styles.circle5)}></span>
          </div>

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
          </div>

          <div className={styles.bottom}>
            <span className={styles.priceTag}>₹{product.price.toFixed(0)}</span>
            <button className={styles.viewMoreButton}>
              View Details
            </button>
          </div>
        </div>
      </Link>
    </div>
  );
}
