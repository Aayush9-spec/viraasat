'use client';

import ProductCard from '@/components/product-card';
import { products } from '@/lib/data';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import { Carousel3DWrapper } from '@/components/carousel-3d-wrapper';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function Marketplace() {
  const { t } = useTranslation();
  const router = useRouter();
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-amber-50">
      {/* Global Background Watermark */}
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.03] flex items-center justify-center overflow-hidden"
        style={{ transform: `translateY(${scrollY * 0.1}px)` }}
      >
        <Image
          src="/viraasat-logo-full.png"
          alt="Watermark"
          width={1200}
          height={1200}
          className="object-contain w-[150%] h-[150%] max-w-none animate-custom-spin-slow"
          priority
        />
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <header className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden">
          {/* Hero Background with Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-50/50 to-amber-100/80 z-0" />

          <div className="relative z-10 w-full max-w-4xl mx-auto space-y-8 animate-fade-in-up">
            <div className="relative w-full max-w-[500px] mx-auto aspect-video flex items-center justify-center transition-transform duration-700 hover:scale-105">
              <div className="absolute inset-0 bg-amber-400/20 blur-3xl rounded-full opacity-50 animate-pulse" />
              <Image
                src="/viraasat-logo-full.png"
                alt="Viraasat Heritage Logo"
                fill
                className="object-contain drop-shadow-2xl"
                priority
                quality={100}
                sizes="(max-width: 768px) 100vw, 500px"
              />
            </div>

            <div className="space-y-4 backdrop-blur-sm bg-white/30 p-8 rounded-3xl border border-white/40 shadow-xl">
              <h1 className="text-4xl md:text-6xl font-heading font-bold text-amber-950 tracking-tight">
                {t('home.hero.title') || 'Preserving Heritage, Empowering Artisans'}
              </h1>
              <p className="text-lg md:text-xl text-amber-900/80 max-w-2xl mx-auto font-medium leading-relaxed">
                {t('home.hero.description')}
              </p>

              <div className="pt-6">
                <Button
                  size="lg"
                  onClick={() => {
                    const el = document.getElementById('explore-collection');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-amber-900 hover:bg-amber-800 text-amber-50 rounded-full px-8 py-6 text-lg shadow-lg hover:shadow-amber-900/20 transition-all duration-300"
                >
                  Start Your Journey
                </Button>
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-amber-50 to-transparent pointer-events-none" />
        </header>

        {/* Mission Section */}
        <section id="mission" className="py-24 relative">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-amber-900 mb-8 decoration-amber-400/30 underline decoration-wavy underline-offset-8">
              {t('home.mission.title')}
            </h2>
            <p className="text-xl text-amber-900/70 leading-relaxed max-w-3xl mx-auto font-serif italic">
              &ldquo;{t('home.mission.description')}&rdquo;
            </p>
          </div>
        </section>

        {/* Carousel Section */}
        <section id="explore-collection" className="py-24 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <h2 className="text-5xl font-heading font-bold text-amber-900 mb-4 tracking-tight">
                Explore Our Collection
              </h2>
              <p className="text-lg text-amber-800/60 max-w-2xl mx-auto">
                Discover authentic handcrafted treasures from India's finest artisans
              </p>
            </div>

            <div className="relative min-h-[500px]">
              <Carousel3DWrapper />
            </div>

            <div className="text-center mt-16">
              <Button
                size="lg"
                onClick={() => router.push('/shop')}
                className="bg-gradient-to-r from-amber-700 to-orange-700 hover:from-amber-800 hover:to-orange-800 text-white rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 px-10 py-7 text-xl"
              >
                View Full Collection
              </Button>
            </div>
          </div>
        </section>

        {/* Featured Products */}
        <section id="product-grid" className="py-24 bg-white/40 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-3xl font-heading font-semibold text-amber-900 mb-12 text-center">
              Featured Masterpieces
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {products.slice(0, 8).map((product) => (
                <div key={product.id} className="transform hover:-translate-y-2 transition-transform duration-300">
                  <ProductCard
                    product={product}
                    variant="grid"
                  />
                </div>
              ))}
            </div>
            <div className="text-center mt-16">
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/shop')}
                className="border-amber-900 text-amber-900 hover:bg-amber-900 hover:text-white rounded-full px-8"
              >
                Browse Shop
              </Button>
            </div>
          </div>
        </section>

        {/* Artisan Story Section */}
        <section className="py-24 my-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-amber-900 text-white transform -skew-y-3 scale-110 z-0 origin-top-left" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-white">
            <div className="flex flex-col lg:flex-row items-center justify-center gap-12">
              <div className="hidden lg:block w-1/3 transform rotate-3 hover:rotate-0 transition-transform duration-500">
                <Image
                  src="https://images.unsplash.com/photo-1563837738662-c86ef2ba99f8?auto=format&fit=crop&q=80&w=800"
                  alt="Artisan workshop"
                  width={400}
                  height={500}
                  className="rounded-2xl shadow-2xl border-4 border-amber-100/20"
                  loading="lazy"
                />
              </div>

              <div className="text-center max-w-lg space-y-8">
                <div>
                  <h3 className="font-heading text-4xl font-bold text-amber-50">Supporting Local Artisans</h3>
                  <p className="mt-4 text-amber-100/80 text-lg">
                    Every purchase directly impacts the lives of skilled craftsmen across India. We believe in fair trade and preserving our cultural legacy.
                  </p>
                </div>

                <div className="bg-white/10 p-8 rounded-2xl backdrop-blur-sm border border-white/10">
                  <h4 className="font-semibold text-amber-50 text-xl mb-2">Join Our Community</h4>
                  <p className="text-sm text-amber-200 mb-6">Stay updated with our latest heritage collections.</p>
                  <form className="flex flex-col sm:flex-row gap-3 justify-center" onSubmit={(e) => e.preventDefault()}>
                    <Input
                      type="email"
                      placeholder="Your email address"
                      className="bg-white/90 border-0 focus:ring-2 focus:ring-amber-400 text-gray-900 placeholder:text-gray-500"
                    />
                    <Button type="submit" className="bg-amber-500 hover:bg-amber-400 text-amber-950 font-semibold">
                      Subscribe
                    </Button>
                  </form>
                </div>
              </div>

              <div className="hidden lg:block w-1/3 transform -rotate-3 hover:rotate-0 transition-transform duration-500">
                <Image
                  src="https://images.unsplash.com/photo-1521799022345-481a897e45ca?auto=format&fit=crop&q=80&w=800"
                  alt="Local artisans"
                  width={400}
                  height={500}
                  className="rounded-2xl shadow-2xl border-4 border-amber-100/20"
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

