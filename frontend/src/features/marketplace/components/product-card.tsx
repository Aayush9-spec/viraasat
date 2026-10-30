'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Product } from '@/lib/types';
import { cn, getProductImage } from '@/core/utils/utils';
import { ShoppingBag, Heart, MapPin, Star, ShieldCheck, Award, Eye } from 'lucide-react';
import { artisans } from '@/lib/data';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';
import { useToast } from '@/core/hooks/use-toast';
import { useTranslation } from '@/core/hooks/use-translation';


interface ProductCardProps {
  product: Product;
  variant?: 'mission' | 'grid';
  priority?: boolean;
  onQuickInspect?: (product: Product) => void;
}

export default function ProductCard({
  product,
  variant = 'grid',
  priority = false,
  onQuickInspect,
}: ProductCardProps) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const { t } = useTranslation();
  const { isWishlisted, toggleWishlist } = useWishlist();

  const wishlisted = isWishlisted(product.id);
  const safePrice = Number(product?.price) || 0;
  const imageUrl = getProductImage(product?.images);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
    toast({
      title: "Acquired to Collection 🛍️",
      description: `${product.name} (₹${safePrice.toFixed(0)}) added to your cart.`,
    });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);

  };

  const craftDuration = product.category || 'Handcrafted item';

  return (
    <article className="group relative bg-white rounded-2xl overflow-hidden border border-[#E8DCCB] hover:border-[#C59B4B] shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col justify-between h-full">
      <div className="flex flex-col h-full justify-between">
        <div>
          {/* IMAGE & CRAFT BADGES CONTAINER */}
          <div className="relative w-full aspect-[4/3] overflow-hidden bg-[#FAF7F2]">
            <Image
              src={imageUrl}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority={priority}
              className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              data-ai-hint="product image"
            />

            {/* Top Left Provenance Badges */}
            <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5 z-10 pointer-events-none">
              <span className="bg-[#FAF7F2]/95 backdrop-blur-md text-[#221C18] text-[9.5px] font-bold px-2.5 py-1 rounded-md border border-[#C59B4B]/50 shadow-xs flex items-center gap-1 uppercase tracking-wider">
                <ShieldCheck className="w-3 h-3 text-[#C59B4B]" />
                <span>{product.region || 'Indian craft'}</span>
              </span>

            </div>

            {/* Top Right Wishlist Toggle */}
            <button
              type="button"
              onClick={handleToggleWishlist}
              className="absolute top-3 right-3 z-20 w-11 h-11 rounded-full bg-white/90 backdrop-blur-md text-[#221C18] hover:text-[#701D24] flex items-center justify-center transition-all shadow-sm hover:scale-105 active:scale-95 cursor-pointer"
              title={wishlisted ? "Remove from Wishlist" : "Save to Heirloom Wishlist"}
              aria-label="Wishlist"
            >
              <Heart
                className={cn(
                  "w-4 h-4 transition-transform",
                  wishlisted ? "fill-[#701D24] text-[#701D24]" : "text-[#221C18]"
                )}
              />
            </button>

            {/* Bottom Floating Quick Action: Quick Inspect */}
            {onQuickInspect && (
              <div className="absolute bottom-3 inset-x-3 z-20 flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 group-focus-within:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onQuickInspect(product);
                  }}
                  className="w-full py-2 bg-white/95 backdrop-blur-md text-[#221C18] hover:bg-[#701D24] hover:text-white rounded-xl text-[11px] font-semibold tracking-wider uppercase transition-all shadow-md flex items-center justify-center gap-1.5 border border-[#E8DCCB] cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{t('marketplace.inspectProvenance') || 'Inspect Provenance'}</span>
                </button>
              </div>
            )}
          </div>

          {/* CONTENT ARCHITECTURE (Underneath Image for maximum readability) */}
          <div className="p-5 flex-1 flex flex-col justify-between">
            <div>
              {/* Region & Craft Tag */}
              <div className="flex items-center justify-between text-[11px] mb-1.5">
                <span className="text-[#8F6826] font-bold uppercase tracking-wider flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#C59B4B]" />
                  {product.region || 'India'}
                </span>

              </div>

              {/* Product Title in Editorial Serif */}
              <h3 className="font-serif text-lg font-bold text-[#221C18] group-hover:text-[#701D24] transition-colors line-clamp-1 leading-snug">
                <Link href={`/product/${product.id}`}>{product.name}</Link>
              </h3>

              {/* Master Artisan Attribution Chip */}
              <div className="mt-2.5 flex items-center gap-2 py-1.5 px-2 rounded-lg bg-[#FAF7F2] border border-[#E8DCCB]/60">
                <div className="truncate">
                  <span className="text-[10px] text-[#221C18] font-bold block leading-tight truncate">
                    {product.artisanName || 'Independent artisan'}
                  </span>
                  <span className="text-[9px] text-[#655B53] block leading-tight truncate">
                    {product.region || 'India'}
                  </span>
                </div>
              </div>

              {/* Craft Attributes: Materials and Time */}
              <div className="mt-2.5 flex items-center gap-1.5 flex-wrap text-[10px] text-[#655B53]">
                <span className="px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E8DCCB] font-medium truncate max-w-[150px]">
                  {product.category || 'Handcrafted'}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#FAF7F2] border border-[#E8DCCB] font-medium">
                  {craftDuration}
                </span>
              </div>
            </div>

            {/* Price & Fair Impact Valuation Section */}
            <div className="mt-4 pt-3.5 border-t border-[#E8DCCB]/80">
              <div className="flex items-baseline justify-between">
                <div>
                  <span className="text-[9px] uppercase tracking-wider text-[#655B53] font-semibold block">
                    {t('marketplace.fairGuildPrice') || 'Fair Guild Price'}
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-serif text-xl font-bold text-[#701D24]">
                      ₹{safePrice.toFixed(0)}
                    </span>
                    {safePrice > 400 && (
                      <span className="text-xs text-[#655B53] line-through">
                        ₹{Math.round(safePrice * 1.2).toFixed(0)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className="inline-flex items-center gap-1 text-[9.5px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200"
                    title="Transparent revenue sharing"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                    84% {t('marketplace.toArtisan') || 'to Artisan'}
                  </span>
                </div>
              </div>

              {/* Main Button Action */}
              <div className="mt-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="w-full py-2.5 bg-[#FAF7F2] hover:bg-[#701D24] text-[#221C18] hover:text-white rounded-xl text-xs font-semibold tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 border border-[#E8DCCB] hover:border-transparent active:scale-[0.99] shadow-xs hover:shadow-md cursor-pointer"
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>{t('marketplace.acquireHeirloom') || 'Acquire Heirloom'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
