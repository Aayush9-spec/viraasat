'use client';
import ProductCard from '@/components/product-card';
import { products } from '@/lib/data';
import { useTranslation } from '@/hooks/use-translation';
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Input } from '@/components/ui/input';

export default function Marketplace() {
  const { t } = useTranslation();
  const missionProducts = products.slice(0, 8);
  const gridProducts = products.slice(0, 12);
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: 'center',
    containScroll: 'trimSnaps',
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <div className="parallax-viewport">
      <header className="hero-parallax-group relative overflow-hidden text-center hero-section">
        <div className="hero-parallax-layer hero-bg-layer" />
        <div className="hero-parallax-layer hero-overlay-layer" />

        <div className="hero-parallax-layer hero-content-layer max-w-4xl mx-auto px-4">
          <p className="text-lg text-amber-100 mb-2">{t('home.hero.subtitle')}</p>
          <h1 className="font-heading text-7xl md:text-9xl font-semibold text-white">
            Viraasat
          </h1>
          <p className="text-base text-amber-50 mt-4 max-w-xl mx-auto">
            {t('home.hero.description')}
          </p>
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M1440 120H0V26.2205C159.549 34.9398 325.753 38.6479 495.733 36.837C778.361 33.722 1056.49 14.8687 1440 0V120Z" fill="hsl(var(--background))"/>
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
          <div className="relative mt-12">
              <div className="overflow-hidden" ref={emblaRef} style={{ perspective: '1000px' }}>
                  <div className="flex">
                      {missionProducts.map((product) => (
                      <div key={product.id} className="embla__slide relative flex-[0_0_80%] sm:flex-[0_0_60%] md:flex-[0_0_45%] lg:flex-[0_0_33.33%] min-w-0 pl-4">
                        <div className="embla-slide-inner">
                          <ProductCard product={product} variant="mission" />
                        </div>
                      </div>
                      ))}
                  </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                className="absolute top-1/2 left-4 -translate-y-1/2 rounded-full h-10 w-10 z-10 hidden md:flex"
                onClick={scrollPrev}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="absolute top-1/2 right-4 -translate-y-1/2 rounded-full h-10 w-10 z-10 hidden md:flex"
                onClick={scrollNext}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
          </div>
        </section>

        <section id="product-grid" className="py-16 bg-gradient-to-b from-orange-50/50 to-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant="grid"
                />
              ))}
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
                  src="https://images.unsplash.com/photo-1672302255324-28009cc288b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3NDE5ODJ8MHwxfHNlYXJjaHw3fHxsb2NhbCUyMGFydGlzYW5zfGVufDB8fHx8MTc1ODQ0NTg1NXww&ixlib=rb-4.1.0&q=80&w=1080"
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
