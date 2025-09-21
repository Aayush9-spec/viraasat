'use client';

import Image from 'next/image';
import { products, artisans } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';
import { Separator } from '@/components/ui/separator';
import { ViraasatLogo } from '@/components/viraasat-logo';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import type { Product } from '@/lib/types';

export function ProductDetailPageClient({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { toast } = useToast();

  const artisan = artisans.find((a) => a.id === product.artisanId);

  const handleAddToCart = () => {
    addItem(product);
    toast({
      title: 'Added to Cart',
      description: `${product.name} is now in your cart.`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 w-full border-b bg-card">
        <div className="container mx-auto flex h-16 items-center space-x-4 px-4 sm:justify-between sm:space-x-0">
          <div className="flex gap-6 md:gap-10">
            <ViraasatLogo />
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            <nav className="flex items-center space-x-1">
              <Button variant="ghost" asChild>
                <a href="/dashboard">Artisan Dashboard</a>
              </Button>
              <Button variant="link" asChild>
                <a href="/">Back to Marketplace</a>
              </Button>
            </nav>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          <div>
            <Carousel className="w-full">
              <CarouselContent>
                {product.images.map((img, index) => (
                  <CarouselItem key={index}>
                    <div className="aspect-square w-full relative overflow-hidden rounded-lg">
                      <Image
                        src={img}
                        alt={`${product.name} image ${index + 1}`}
                        fill
                        className="object-cover"
                        data-ai-hint="product image"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-4" />
              <CarouselNext className="right-4" />
            </Carousel>
          </div>

          <div className="flex flex-col space-y-6">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold tracking-tight">{product.name}</h1>
              <p className="text-xl text-muted-foreground mt-1">
                by <span className="text-primary hover:underline">{artisan?.shopName}</span>
              </p>
            </div>

            <p className="text-lg">{product.description}</p>

            <div className="text-4xl font-bold text-primary">₹{product.price.toFixed(2)}</div>

            <Button size="lg" className="bg-accent hover:bg-accent/90" onClick={handleAddToCart}>
              Add to Cart
            </Button>

            <Separator />

            {artisan && (
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={artisan.profilePicture} alt={artisan.name} data-ai-hint="person portrait" />
                    <AvatarFallback>{artisan.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle>{artisan.shopName}</CardTitle>
                    <p className="text-sm text-muted-foreground">{artisan.name}</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm">{artisan.bio}</p>
                </CardContent>
              </Card>
            )}

            {(product.aiInsights) && (
              <Card>
                <CardHeader>
                  <CardTitle>AI Generated Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {product.aiInsights.keyFeatures && (
                    <div>
                      <h3 className="font-semibold mb-2">Features</h3>
                      <div className="flex flex-wrap gap-2">
                        {product.aiInsights.keyFeatures.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                      </div>
                    </div>
                  )}
                  {product.aiInsights.styleTags && (
                    <div>
                      <h3 className="font-semibold mb-2">Style Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {product.aiInsights.styleTags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                      </div>
                    </div>
                  )}
                  {product.aiInsights.useCases && (
                    <div>
                      <h3 className="font-semibold mb-2">Use Cases</h3>
                      <div className="flex flex-wrap gap-2">
                        {product.aiInsights.useCases.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
