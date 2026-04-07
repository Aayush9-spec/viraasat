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
    <div className="relative min-h-screen bg-neutral-950 text-amber-50 overflow-x-hidden selection:bg-amber-500/30">

      {/* Background Texture/Watermark - "Filling the page" conceptually */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Giant rotating watermark */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vmax] h-[150vmax] opacity-[0.03] blur-sm animate-custom-spin-slow"
          style={{ backgroundImage: 'url(/viraasat-logo-full.png)', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}
        />
        {/* Noise overlay for texture */}
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>
      </div>

      <div className="relative z-10">
        {/* HERO SECTION */}
        <header className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden bg-[#fbf7f0]">
          {/* Subtle Texture for Cream Background */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%235e2c18\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />

          <div className="relative z-10 w-full max-w-5xl mx-auto space-y-6 animate-fade-in-up pt-10">

            {/* Logo Image - Centered and Large */}
            <div className="relative w-full max-w-[600px] mx-auto flex items-center justify-center transition-transform duration-1000 hover:scale-105">
              <div className="relative w-full max-w-[400px] aspect-square overflow-hidden rounded-full drop-shadow-2xl ring-4 ring-[#8b4513]/10">
                <Image
                  src="/viraasat-logo-full.png"
                  alt="Viraasat Heritage Logo"
                  fill
                  className="object-cover w-full h-full scale-[1.1]"
                  priority
                  quality={100}
                />
              </div>
            </div>

            <div className="space-y-6 max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-heading font-bold text-[#5e2c18] tracking-tight drop-shadow-sm">
                {t('home.hero.title')}
              </h1>
              <div className="h-px w-32 mx-auto bg-gradient-to-r from-transparent via-[#8b4513] to-transparent opacity-50" />
              <p className="text-lg md:text-2xl text-[#8b4513]/80 font-serif italic tracking-wide leading-relaxed">
                {t('home.hero.description')}
              </p>

              <div className="pt-8 mb-12">
                <Button
                  size="lg"
                  onClick={() => {
                    const el = document.getElementById('explore-collection');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-[#5e2c18] hover:bg-[#4a2315] text-[#fbf7f0] rounded-none px-12 py-7 text-lg uppercase tracking-widest transition-all duration-500 shadow-xl hover:shadow-2xl border border-[#8b4513]/20"
                >
                  Enter The Viraasat
                </Button>
              </div>
            </div>
          </div>

          {/* Transition to Dark Section */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-neutral-950 to-transparent pointer-events-none" />
        </header>

        {/* MISSION SECTION */}
        <section id="mission" className="py-32 relative bg-neutral-900 border-t border-white/5">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <span className="text-amber-500 text-sm tracking-[0.3em] uppercase mb-4 block">Our Philosophy</span>
            <h2 className="text-3xl md:text-5xl font-heading text-amber-100 mb-12">
              {t('home.mission.title')}
            </h2>
            <div className="relative">
              <span className="absolute -top-10 -left-4 text-8xl text-amber-500/10 font-serif leading-none">“</span>
              <p className="text-xl md:text-2xl text-amber-200/70 leading-relaxed font-serif relative z-10 px-8">
                {t('home.mission.description')}
              </p>
              <span className="absolute -bottom-10 -right-4 text-8xl text-amber-500/10 font-serif leading-none">”</span>
            </div>
          </div>
        </section>

        {/* COLLECTION CAROUSEL */}
        <section id="explore-collection" className="py-32 relative bg-neutral-950 overflow-hidden">
          {/* Decorative gradients */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-amber-900/50 to-transparent" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-20">
              <span className="text-amber-500 text-sm tracking-[0.3em] uppercase mb-4 block">The Collection</span>
              <h2 className="text-4xl md:text-6xl font-heading font-normal text-amber-100 mb-6">
                Masterpieces
              </h2>
              <p className="text-lg text-amber-400/50 max-w-2xl mx-auto font-light">
                Handcrafted treasures from the heart of India
              </p>
            </div>

            <div className="relative min-h-[500px]">
              <Carousel3DWrapper />
            </div>

            <div className="text-center mt-20">
              <Button
                size="lg"
                onClick={() => router.push('/shop')}
                className="bg-amber-700 hover:bg-amber-600 text-white rounded-none px-12 py-6 text-lg tracking-wider transition-all duration-300 shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:shadow-[0_0_50px_rgba(245,158,11,0.4)]"
              >
                View Gallery
              </Button>
            </div>
          </div>
        </section>

        {/* PRODUCT GRID */}
        <section id="product-grid" className="py-32 bg-neutral-900 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-3xl font-heading text-amber-100 mb-16 text-center border-b border-amber-900/30 pb-8 inline-block w-full">
              Curated Selections
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
              {products.slice(0, 8).map((product) => (
                <div key={product.id} className="group cursor-pointer">
                  {/* Custom Card Wrapper for Dark Theme */}
                  <div className="bg-neutral-800/50 p-4 border border-white/5 transition-all duration-300 group-hover:bg-neutral-800 group-hover:border-amber-900/50 group-hover:shadow-2xl group-hover:shadow-amber-900/10">
                    <div className="relative aspect-[3/4] overflow-hidden mb-4 bg-neutral-900">
                      {/* We can use the product image here. Assuming ProductCard handles it, 
                            but we'll just wrap the existing component for logic re-use */}
                      <div className="pointer-events-none">
                        <ProductCard
                          product={product}
                          variant="grid"
                        />
                      </div>
                    </div>
                    <div className="text-center space-y-2 mt-4">
                      <h4 className="text-amber-100 font-serif text-lg group-hover:text-amber-400 transition-colors">{product.name}</h4>
                      <p className="text-amber-600/80 text-sm uppercase tracking-widest">{product.category}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ARTISAN STORY */}
        <section className="py-32 relative overflow-hidden bg-neutral-950">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-900/50 to-transparent" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">

              <div className="relative group">
                <div className="absolute -inset-4 bg-amber-900/20 rotate-2 group-hover:rotate-1 transition-transform duration-700" />
                <div className="absolute -inset-4 bg-amber-900/20 -rotate-2 group-hover:-rotate-1 transition-transform duration-700" />
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src="https://images.unsplash.com/photo-1563837738662-c86ef2ba99f8?auto=format&fit=crop&q=80&w=800"
                    alt="Artisan workshop"
                    fill
                    className="object-cover grayscale hover:grayscale-0 transition-all duration-1000 ease-in-out scale-105 hover:scale-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-80" />
                  <div className="absolute bottom-6 left-6 right-6">
                    <p className="text-amber-400 font-serif italic text-lg">"Every thread tells a story of patience."</p>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <span className="text-amber-600 text-sm tracking-[0.3em] uppercase mb-2 block">Tradition</span>
                  <h3 className="font-heading text-4xl md:text-5xl text-amber-50 mb-6">Supporting The Hands That Create</h3>
                  <p className="text-amber-200/60 text-lg leading-relaxed font-light">
                    Viraasat is not just a marketplace; it is a movement. A movement to bring the spotlight back to the hands that weave magic, carve history, and paint culture. Your patronage directly empowers these guardians of our heritage.
                  </p>
                </div>

                <div className="bg-neutral-900/80 p-10 border border-white/5 backdrop-blur-sm">
                  <h4 className="font-heading text-2xl text-amber-100 mb-2">Join The Legacy</h4>
                  <p className="text-amber-400/60 mb-8 text-sm">Be the first to know about rare acquirements.</p>

                  <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
                    <Input
                      type="email"
                      placeholder="EMAIL ADDRESS"
                      className="bg-transparent border-b border-white/20 rounded-none px-0 py-2 text-amber-100 placeholder:text-neutral-600 focus:border-amber-500 focus:ring-0 transition-colors"
                    />
                    <div className="pt-4">
                      <Button type="submit" className="w-full bg-amber-800/80 hover:bg-amber-700 text-amber-100 uppercase tracking-widest py-6 text-sm">
                        Subscribe
                      </Button>
                    </div>
                  </form>
                </div>
              </div>

            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

