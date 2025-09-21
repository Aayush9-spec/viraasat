'use client';
import ProductCard from '@/components/product-card';
import { products } from '@/lib/data';

export default function Marketplace() {
  return (
    <div className="bg-background">
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 via-amber-50 to-rose-50 opacity-80"></div>
        <div className="relative py-24 md:py-32 text-center">
            <div className="max-w-4xl mx-auto px-4">
                <p className="text-lg text-primary mb-2">Explore Our Collection</p>
                <h1 className="font-heading text-6xl md:text-8xl font-semibold text-primary">Viraasat</h1>
                <p className="text-lg text-gray-600 mt-4 max-w-2xl mx-auto">Discover authentic Indian handicrafts, each one a unique piece of art, telling a story of tradition and skill.</p>
            </div>
        </div>
      </header>

      <main>
        <section id="mission" className="py-20 bg-white">
            <div className="max-w-4xl mx-auto px-4 text-center">
                <h2 className="text-4xl font-heading font-semibold text-primary mb-4">Our Mission</h2>
                <p className="text-lg text-gray-600 leading-relaxed">
                    Viraasat is a tribute to the soul of India's artisan communities. We provide a platform for talented craftspeople to share their ancestral skills and handmade treasures with the world. By purchasing from our artisans, you're helping preserve a legacy and empower a community.
                </p>
            </div>
        </section>

        <section id="products" className="py-16 bg-gradient-to-b from-orange-50/50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="sr-only">Products</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
          </div>
        </section>
      </main>
    </div>
  );
}
