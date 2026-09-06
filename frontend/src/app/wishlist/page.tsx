'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/protected-route';
import { useCart } from '@/context/cart-context';
import { useWishlist } from '@/context/wishlist-context';

export default function WishlistPage() {
  const { addItem } = useCart();
  const { wishlist, removeFromWishlist } = useWishlist();

  return (
    <ProtectedRoute allowedRoles={['buyer']}>
      <div className="max-w-6xl mx-auto space-y-6 p-4 sm:p-6 lg:p-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground flex items-center gap-2">
            <Heart className="h-7 w-7 text-rose-500 fill-rose-500" /> My Saved Wishlist
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Handcrafted treasures you have saved for later.
          </p>
        </div>

        {wishlist.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="space-y-4">
              <Heart className="h-12 w-12 text-muted-foreground mx-auto opacity-40" />
              <p className="text-lg font-medium text-muted-foreground">Your wishlist is empty</p>
              <Button asChild className="bg-primary">
                <Link href="/shop">Explore Shop</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((product) => (
              <Card key={product.id} className="group overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <Image
                      src={product.images[0]}
                      alt={product.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="line-clamp-1 font-heading">{product.name}</CardTitle>
                    <CardDescription className="font-semibold text-primary">
                      ₹{product.price.toLocaleString('en-IN')}
                    </CardDescription>
                  </CardHeader>
                </div>
                <CardFooter className="flex gap-2 pt-2">
                  <Button
                    onClick={() => addItem(product)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  >
                    <ShoppingBag className="h-4 w-4" /> Move to Cart
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => removeFromWishlist(product.id)}
                    aria-label={`Remove ${product.name} from wishlist`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}