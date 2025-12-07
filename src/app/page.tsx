'use client';

import ProductCard from '@/components/product-card';
import { products } from '@/lib/data';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Carousel3D } from '@/components/carousel-3d';

import { useRouter } from 'next/navigation';

export default function Marketplace() {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <div className="parallax-viewport">
      <header className="hero-parallax-group relative overflow-hidden text-center hero-section">
        <div className="hero-parallax-layer hero-bg-layer" />
        <div className="hero-parallax-layer hero-overlay-layer" />

        <div className="hero-parallax-layer hero-content-layer max-w-4xl mx-auto px-4">
          <div className="my-4">
            <div className="relative w-full max-w-[600px] mx-auto aspect-square md:aspect-[4/3] flex items-center justify-center">
              <Image
                src="/logo-replacement.png"
                alt="Viraasat Heritage Logo"
                fill
                className="object-contain drop-shadow-2xl filter hover:brightness-110 transition-all duration-500"
                priority
              />
            </div>
          </div>
          <p className="text-base text-amber-50 mt-4 max-w-xl mx-auto">
            {t('home.hero.description')}
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-20">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M1440 120H0V26.2205C159.549 34.9398 325.753 38.6479 495.733 36.837C778.361 33.722 1056.49 14.8687 1440 0V120Z" fill="hsl(var(--background))" />
          </svg>
        </div>
      </header>

      <div className="content-container bg-background">
        <section id="mission" className="py-16 relative">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl font-heading font-semibold text-amber-900 mb-4">{t('home.mission.title')}</h2>
            <p className="text-lg text-gray-600 leading-relaxed max-w-3xl mx-auto">
              {t('home.mission.description')}
            </p>
          </div>
        </section>

        <section id="explore-collection" className="py-20 bg-gradient-to-b from-amber-50/30 via-orange-50/20 to-background relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(251,191,36,0.1),transparent_50%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(249,115,22,0.1),transparent_50%)] pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-12">
              <h2 className="text-5xl font-heading font-bold text-amber-900 mb-4 tracking-tight">
                Explore Our Collection
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Discover authentic handcrafted treasures from India's finest artisans
              </p>
            </div>

            <div className="relative">
              <Carousel3D />
            </div>

            <div className="text-center mt-12">
              <Button
                size="lg"
                onClick={() => router.push('/shop')}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-lg"
              >
                View All Products
              </Button>
            </div>
          </div>
        </section>

        <section id="product-grid" className="py-16 bg-gradient-to-b from-background to-orange-50/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {products.slice(0, 8).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant="grid"
                />
              ))}
            </div>
            <div className="text-center mt-12">
              <Button size="lg" onClick={() => router.push('/shop')}>
                Shop All Products
              </Button>
            </div>
          </div>
        </section>

        <section className="py-20 bg-gradient-to-t from-teal-50/50 to-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center justify-center gap-8">
              <div className="hidden lg:block">
                <Image
                  src="https://images.unsplash.com/photo-1563837738662-c86ef2ba99f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw5fHxhcnRpc2FufGVufDB8fHx8MTc1ODQ0NjA4OHww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Artisan workshop"
                  width={400}
                  height={300}
                  className="rounded-lg shadow-lg"
                  data-ai-hint="artisan workshop"
                />
              </div>
              <div className="text-center max-w-lg">
                <h3 className="font-heading text-3xl font-semibold text-gray-800">Hand-picked for Indian Artisans</h3>
                <p className="mt-2 text-gray-600">Quality goods from passionate creators.</p>
                <div className="mt-8">
                  <h4 className="font-semibold text-gray-700">Subscription</h4>
                  <p className="mt-1 text-sm text-gray-500">Stay updated with our latest collections.</p>
                  <form className="mt-4 flex flex-col sm:flex-row gap-2 justify-center">
                    <Input type="email" placeholder="Your email..." className="max-w-xs" />
                    <Button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white">Subscribe</Button>
                  </form>
                </div>
              </div>
              <div className="hidden lg:block">
                <Image
                  src="https://images.unsplash.com/photo-1521799022345-481a897e45ca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw7fHxhcnRpc2FufGVufDB8fHx8MTc1ODQ0NjA4OHww&ixlib=rb-4.1.0&q=80&w=1080"
                  alt="Local artisans at work"
                  width={400}
                  height={300}
                  className="rounded-lg shadow-lg"
                  data-ai-hint="local artisans"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
