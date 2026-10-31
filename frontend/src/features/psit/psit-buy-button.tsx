'use client';

import { useRouter } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/core/hooks/use-toast';
import type { Product } from '@/lib/types';

export function PsitBuyButton({ product }: { product: Product }) {
  const router = useRouter();
  const { addItem, setCartOpen } = useCart();
  const { toast } = useToast();

  const handleBuyNow = () => {
    addItem(product);
    setCartOpen(false);
    toast({
      title: 'Added to your collection',
      description: `${product.name} is ready for checkout.`,
    });
    router.push('/checkout');
  };

  return (
    <Button
      type="button"
      onClick={handleBuyNow}
      className="h-11 w-full rounded-none bg-[#701d24] text-xs font-bold uppercase tracking-[0.16em] text-[#faf7f2] hover:bg-[#5e2c18]"
    >
      <ShoppingBag className="h-4 w-4" />
      Buy now
    </Button>
  );
}
