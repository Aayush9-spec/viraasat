'use client';
import { Button } from '@/components/ui/button';
import { ViraasatLogo } from '@/components/viraasat-logo';
import ProductCard from '@/components/product-card';
import { products } from '@/lib/data';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel';

export default function Marketplace() {
  return (
    <div className="min-h-screen bg-background font-serif">
      <header className="sticky top-0 z-40 w-full bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-20 items-center justify-between px-4">
          <ViraasatLogo />
          <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <a href="#" className="text-foreground/80 hover:text-primary">Home</a>
            <a href="#" className="text-foreground/80 hover:text-primary">Learn</a>
            <a href="#" className="text-foreground/80 hover:text-primary">About</a>
            <a href="#" className="text-foreground/80 hover:text-primary">Creators</a>
            <a href="#" className="text-foreground/80 hover:text-primary">Contact</a>
          </nav>
          <div className="flex items-center space-x-4">
             <Button variant="ghost" asChild className="hidden md:inline-flex">
                <a href="/dashboard">Artisan Dashboard</a>
              </Button>
            <Button className="bg-accent hover:bg-accent/90 text-accent-foreground rounded-md">
              Login
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-20">
        <section className="text-center mb-16 md:mb-24">
          <p className="text-lg text-foreground/80 tracking-widest uppercase">Explore Our Collection</p>
          <h1 className="font-serif text-6xl md:text-8xl font-bold text-primary my-4">
            Heritage
          </h1>
          <p className="max-w-2xl mx-auto text-base text-foreground/70">
            Discover the essence of traditional art in our artisan marketplace. Find pieces you'll
            cherish for seasons to come, direct from the creators.
          </p>
        </section>

        <section>
          <h2 className="text-center text-4xl font-serif font-bold mb-10">Our Mission</h2>
          <Carousel
            opts={{
              align: 'start',
              loop: true,
            }}
            className="w-full"
          >
            <CarouselContent>
              {products.map((product) => (
                <CarouselItem key={product.id} className="md:basis-1/2 lg:basis-1/4">
                  <div className="p-1">
                    <ProductCard product={product} />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="absolute left-[-50px] top-1/2 -translate-y-1/2 hidden md:flex" />
            <CarouselNext className="absolute right-[-50px] top-1/2 -translate-y-1/2 hidden md:flex" />
          </Carousel>
        </section>
      </main>
    </div>
  );
}
