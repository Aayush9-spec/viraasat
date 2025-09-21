'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/context/cart-context';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2 } from 'lucide-react';
import { artisans, products } from '@/lib/data';
import ProductCard from './product-card';

const FREE_SHIPPING_THRESHOLD = 5000;

export default function CartSidebar() {
  const { isCartOpen, setCartOpen, cartItems, removeItem, getCartTotal } = useCart();
  const total = getCartTotal();
  const amountLeftForFreeShipping = FREE_SHIPPING_THRESHOLD - total;
  const progressPercentage = (total / FREE_SHIPPING_THRESHOLD) * 100;

  const recommendedProducts = products.filter(p => !cartItems.find(ci => ci.id === p.id)).slice(0, 3);

  return (
    <Sheet open={isCartOpen} onOpenChange={setCartOpen}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader>
          <SheetTitle>Your Cart</SheetTitle>
        </SheetHeader>
        {cartItems.length > 0 ? (
          <>
            <div className="pr-6">
              {amountLeftForFreeShipping > 0 ? (
                <div className="mt-4 text-center text-sm text-muted-foreground space-y-2">
                  <p>You're <span className="font-semibold text-primary">₹{amountLeftForFreeShipping.toFixed(2)}</span> away from free shipping!</p>
                  <Progress value={progressPercentage} className="h-2" />
                </div>
              ) : (
                <div className="mt-4 text-center text-sm font-semibold text-green-600">
                  <p>You've unlocked free shipping!</p>
                  <Progress value={100} className="h-2 [&>div]:bg-green-500" />
                </div>
              )}
            </div>
            <ScrollArea className="flex-grow pr-6">
              <div className="my-4 space-y-4">
                {cartItems.map((item) => {
                  const artisan = artisans.find(a => a.id === item.artisanId);
                  return (
                    <div key={item.id} className="flex items-start gap-4">
                      <Image
                        src={item.images[0]}
                        alt={item.name}
                        width={80}
                        height={80}
                        className="rounded-md object-cover"
                      />
                      <div className="flex-grow">
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          From the workshop of{' '}
                          <Link href="#" className="underline hover:text-primary">
                            {artisan?.shopName || 'an artisan'}
                          </Link>
                        </p>
                        <p className="text-sm font-semibold mt-1">₹{item.price.toFixed(2)}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            <div className="border-t mt-auto pt-4 pr-6 space-y-4">
               <div>
                  <h3 className="font-semibold text-lg mb-4">You might also like</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {recommendedProducts.map(p => (
                       <Link href={`/product/${p.id}`} key={p.id} onClick={() => setCartOpen(false)}>
                         <Image src={p.images[0]} alt={p.name} width={100} height={100} className="rounded-md object-cover aspect-square" />
                       </Link>
                    ))}
                  </div>
               </div>
              <div className="flex justify-between font-bold text-lg">
                <span>Subtotal</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
              <Button size="lg" className="w-full" asChild>
                <Link href="/checkout" onClick={() => setCartOpen(false)}>Proceed to Checkout</Link>
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <p className="text-lg font-semibold">Your cart is empty</p>
            <p className="text-muted-foreground mt-1">Find something special to add.</p>
            <Button asChild className="mt-4" onClick={() => setCartOpen(false)}>
              <Link href="/">Continue Shopping</Link>
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
