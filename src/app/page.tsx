'use client';
import ProductCard from '@/components/product-card';
import { products } from '@/lib/data';

export default function Marketplace() {
  const missionProducts = products.slice(0, 8);
  const gridProducts = products.slice(8, 12);

  return (
    <div>
      <header className="relative overflow-hidden text-center py-20 md:py-28">
        <div className="max-w-4xl mx-auto px-4">
          <p className="text-lg text-primary mb-2">Explore Our Collection</p>
          <h1 className="font-heading text-7xl md:text-9xl font-semibold text-primary">
            Viraasat
          </h1>
          <p className="text-base text-foreground mt-4 max-w-xl mx-auto">
            Our marketplace is a celebration of craftsmanship, a bridge between tradition and today. Discover unique, handcrafted goods and the stories of the artisans who make them.
          </p>
        </div>
      </header>

      <section id="mission" className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-heading font-semibold text-primary mb-8">
            Our Mission
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                variant="mission"
              />
            ))}
          </div>
        </div>
      </section>

      <section id="product-grid" className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-heading font-semibold text-primary mb-8">
            Product Grid
          </h2>
           <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
             <div className="md:col-span-1">
                {products[0] && <ProductCard key={products[0].id} product={products[0]} variant="grid" />}
             </div>
             <div className="md:col-span-2 flex items-center justify-center">
                 {/* This space is intentionally left for the text and subscription form, which is now in the footer */}
             </div>
             <div className="md:col-span-1">
                 {products[7] && <ProductCard key={products[7].id} product={products[7]} variant="grid" />}
             </div>
           </div>
        </div>
      </section>
    </div>
  );
}
