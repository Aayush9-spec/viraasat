'use client';

import ProductCard from '@/features/marketplace/components/product-card';
import { ProductService } from '@/features/marketplace/product-service';
import { useTranslation } from '@/hooks/use-translation';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { Input } from '@/components/ui/input';
import type { Product } from '@/types/product';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import LazyCarousel from '@/components/LazyCarousel';
import { ProductGridSkeleton } from '@/components/ui/product-skeleton';
import { Skeleton } from '@/components/ui/skeleton';

export default function Marketplace() {
  const { t } = useTranslation();
  const router = useRouter();
  
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Invalid email address');
      return;
    }
    setEmailError(null);
    console.log('Subscribed:', email);
  };

  useEffect(() => {
    async function loadProducts() {
      try {
        const items = await ProductService.getAllProducts();
        const local = localStorage.getItem('viraasat_local_products');
        let finalItems = [...items];
        if (local) {
          try {
            const parsed = JSON.parse(local);
            parsed.forEach((localProd: any) => {
              if (!finalItems.some(p => p.id === localProd.id)) {
                finalItems.unshift(localProd);
              }
            });
          } catch (e) {
            // ignore malformed local storage
          }
        }
        setAllProducts(finalItems);
      } catch (err) {
        setError('Failed to load products');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-16">
        <div className="space-y-4 text-center max-w-2xl mx-auto">
          <Skeleton className="h-4 w-32 mx-auto rounded-full bg-muted/60" />
          <Skeleton className="h-12 w-3/4 mx-auto bg-muted/60" />
          <Skeleton className="h-6 w-1/2 mx-auto bg-muted/40" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-3xl bg-muted/40" />
        <div className="space-y-8">
          <Skeleton className="h-8 w-48 mx-auto bg-muted/60" />
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    );
  }
if (error) {
  return <div className="flex h-screen items-center justify-center text-red-500">{error}</div>;
}
const validProducts = (allProducts || []).filter(p => p && p.region);
const regionInfo = Array.from(new Set(validProducts.map(p => p.region))).map(region => ({
  name: region,
  count: validProducts.filter(p => p.region === region).length,
}));
return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden selection:bg-primary/30">

      {/* Background Texture/Watermark - "Filling the page" conceptually */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Giant rotating watermark */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150vmax] h-[150vmax] max-w-full max-h-full overflow-hidden opacity-[0.03] blur-sm animate-custom-spin-slow"
          style={{ backgroundImage: 'url(/viraasat-logo-full.png)', backgroundSize: 'contain', backgroundRepeat: 'no-repeat', backgroundPosition: 'center' }}
        />
        {/* Noise overlay for texture */}
        <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noiseFilter\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.65\' numOctaves=\'3\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noiseFilter)\'/%3E%3C/svg%3E")' }}></div>
      </div>

      <div className="relative z-10">
        {/* HERO SECTION */}
        <header className="relative min-h-screen flex flex-col items-center justify-center text-center px-4 overflow-hidden bg-background">
          {/* Subtle Texture for Cream Background */}
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%235e2c18\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }} />
          
          {/* Subtle Vignette Overlay */}
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle,transparent_40%,rgba(94,44,24,0.08)_100%)]" />

          <div className="relative z-10 w-full max-w-5xl mx-auto space-y-6 animate-fade-in-up pt-10">

            {/* Logo Image - Centered and Large */}
            <div className="relative w-full max-w-[650px] mx-auto z-30 transition-transform duration-1000 hover:scale-105">
              <Image
                src="/viraasat-hero-cream.png"
                alt="Viraasat Heritage Logo"
                width={1024}
                height={558}
                priority
                className="w-full h-auto mix-blend-multiply"
                style={{
                  maskImage: 'radial-gradient(ellipse at center, black 50%, transparent 95%)',
                  WebkitMaskImage: 'radial-gradient(ellipse at center, black 50%, transparent 95%)',
                }}
              />
            </div>

            <div className="space-y-6 max-w-3xl mx-auto">
              <h1 className="text-4xl md:text-6xl font-heading font-bold text-primary tracking-tight drop-shadow-sm">
                {t('home.hero.title')}
              </h1>
              <div className="h-px w-32 mx-auto bg-gradient-to-r from-transparent via-[#8b4513] to-transparent opacity-50" />
              <p className="text-lg md:text-2xl text-primary/80 font-serif italic tracking-wide leading-relaxed">
                {t('home.hero.description')}
              </p>

              <div className="pt-8 mb-12">
                <Button
                  size="lg"
                  onClick={() => {
                    const el = document.getElementById('explore-collection');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-none px-12 py-7 text-lg uppercase tracking-widest transition-all duration-500 shadow-xl hover:shadow-2xl border border-primary/20"
                >
                  Enter The Viraasat
                </Button>
              </div>
            </div>
          </div>

          {/* Transition to Secondary Section */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-secondary to-transparent pointer-events-none" />
        </header>

        {/* MISSION SECTION */}
        <section id="mission" className="py-32 relative bg-secondary border-t border-border/50">
          <div className="max-w-5xl mx-auto px-4 text-center">
            <span className="text-primary text-sm tracking-[0.3em] uppercase mb-4 block">Our Philosophy</span>
            <h2 className="text-3xl md:text-5xl font-heading text-foreground mb-12">
              {t('home.mission.title')}
            </h2>
            <div className="relative">
              <span className="absolute -top-10 -left-4 text-8xl text-primary/10 font-serif leading-none">“</span>
              <p className="text-xl md:text-2xl text-foreground/70 leading-relaxed font-serif relative z-10 px-8">
                {t('home.mission.description')}
              </p>
              <span className="absolute -bottom-10 -right-4 text-8xl text-primary/10 font-serif leading-none">”</span>
            </div>
          </div>
        </section>

        {/* COLLECTION CAROUSEL */}
        <section id="explore-collection" className="py-32 relative bg-background overflow-hidden">
          {/* Decorative gradients */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-20">
              <span className="text-primary text-sm tracking-[0.3em] uppercase mb-4 block">The Collection</span>
              <h2 className="text-4xl md:text-6xl font-heading font-normal text-foreground mb-6">
                Masterpieces
              </h2>
              <p className="text-lg text-foreground/50 max-w-2xl mx-auto font-light">
                Handcrafted treasures from the heart of India
              </p>
            </div>

            <div className="relative min-h-[500px]">
              <LazyCarousel />
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
        <section id="product-grid" className="py-32 bg-secondary/30 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h3 className="text-3xl font-heading text-foreground mb-16 text-center border-b border-primary/20 pb-8 inline-block w-full">
              Curated Selections
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {allProducts.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} variant="grid" />
              ))}
            </div>
          </div>
        </section>

        {/* REGIONAL DISCOVERY */}
        <section className="py-32 relative bg-background overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] clay-texture pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center mb-16">
              <span className="text-primary text-sm tracking-[0.3em] uppercase mb-4 block">Regional Heritage</span>
              <h2 className="text-4xl md:text-6xl font-heading font-normal text-foreground">Explore by Origin</h2>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { name: 'Rajasthan', img: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&q=80&w=400' },
                { name: 'Kutch', img: 'https://images.unsplash.com/photo-1589308078059-be1415eab4c3?auto=format&fit=crop&q=80&w=400' },
                { name: 'Kashmir', img: 'https://images.unsplash.com/photo-1566833925222-72120b419615?auto=format&fit=crop&q=80&w=400' },
                { name: 'Varanasi', img: 'https://images.unsplash.com/photo-1561359313-0639aad49ca6?auto=format&fit=crop&q=80&w=400' },
              ].map((region) => (
                <Link 
                  key={region.name}
                  href={`/shop?region=${region.name}`}
                  aria-label={`Explore ${region.name}`}
                  className="group relative aspect-square overflow-hidden bg-secondary clay-shadow"
                >
                  <Image 
                    src={region.img} 
                    alt={region.name} 
                    fill 
                    className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-100" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6">
                    <span className="text-white font-heading text-xl md:text-2xl">{region.name}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ARTISAN STORY */}
        <section className="py-32 relative overflow-hidden bg-background">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent" />

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
                    <p className="text-amber-400 font-serif italic text-lg">&ldquo;Every thread tells a story of patience.&rdquo;</p>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <span className="text-primary text-sm tracking-[0.3em] uppercase mb-2 block">Tradition</span>
                  <h3 className="font-heading text-4xl md:text-5xl text-foreground mb-6">Supporting The Hands That Create</h3>
                  <p className="text-foreground/60 text-lg leading-relaxed font-light">
                    Viraasat is not just a marketplace; it is a movement. A movement to bring the spotlight back to the hands that weave magic, carve history, and paint culture. Your patronage directly empowers these guardians of our heritage.
                  </p>
                </div>

                <div className="bg-secondary/50 p-10 border border-border/50 backdrop-blur-sm">
                  <h4 className="font-heading text-2xl text-foreground mb-2">Join The Legacy</h4>
                  <p className="text-primary/60 mb-8 text-sm">Be the first to know about rare acquirements.</p>

                                      <form className="flex flex-col gap-4" onSubmit={handleSubscribe}>
                      <label htmlFor="subscribe-email" className="sr-only">Email address</label>
<Input
                          id="subscribe-email"
                          type="email"
                          placeholder="EMAIL ADDRESS"
                          value={email}
                          onChange={e=>setEmail(e.target.value)}
                          className="bg-transparent border-b rounded-none px-0 py-2 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-0 transition-colors"
                          style={{ borderColor: emailError ? 'red' : 'rgb(139 95 244 / 20)' }}
                          aria-describedby={emailError ? 'email-error' : undefined}
                        />
                      {emailError && (
                        <p id="email-error" className="text-red-500 text-sm" role="alert" aria-live="polite">{emailError}</p>
                      )}
                      <div className="pt-4">
                        <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground uppercase tracking-widest py-6 text-sm">
                          Subscribe
                        </Button>
                      </div>
                    </form>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Shop Heritage Section */}
        <section className="py-32 bg-secondary/50 relative overflow-hidden" id="shop-heritage">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-[#5e2c18]/20 to-transparent" />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-8 text-left">
              <div className="max-w-2xl">
                <span className="text-primary text-sm tracking-[0.4em] uppercase mb-4 block font-bold opacity-40">The Viraasat Collection</span>
                <h2 className="text-4xl md:text-6xl font-heading text-primary leading-tight">Bring India&apos;s Soul <br /><span className="italic font-normal">To Your Home</span></h2>
                <div className="h-px w-24 bg-primary/20 mt-8" />
              </div>
              <Button size="lg" className="rounded-none bg-primary hover:bg-primary/90 text-primary-foreground px-10 h-14 tracking-widest uppercase text-xs shadow-2xl" asChild>
                <a href="/shop">View Full Gallery</a>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
              {allProducts.slice(0, 4).map((product) => (
                <div key={product.id} className="group cursor-pointer">
                  <a href={`/product/${product.id}`} className="block">
                    <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100 mb-8 shadow-sm group-hover:shadow-[0_30px_60px_rgba(94,44,24,0.15)] transition-all duration-700">
                      <Image 
                        src={product.images[0]} 
                        alt={product.name} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-1000 grayscale-[0.1] group-hover:grayscale-0"
                      />
                      <div className="absolute top-6 left-6">
                        <Badge className="rounded-none bg-[#5e2c18]/90 text-amber-50 border-none text-[9px] tracking-widest uppercase px-4 py-1.5 font-bold backdrop-blur-sm">{product.region}</Badge>
                      </div>
                      <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div className="space-y-4 px-2">
                      <h3 className="font-heading text-2xl text-primary group-hover:text-primary/80 transition-colors leading-tight">{product.name}</h3>
                      <div className="flex items-center gap-3">
                        <div className="h-px w-8 bg-primary/10" />
                        <p className="text-[11px] text-primary/40 uppercase tracking-[0.3em] font-bold">₹{product.price.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </a>
                </div>
              ))}
            </div>

            {/* Region Based Browsing */}
            <div className="mt-32">
              <h4 className="text-[10px] text-center uppercase tracking-[0.5em] text-amber-900/30 mb-12 font-bold">Explore by Geographic Heritage</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {regionInfo.map((reg) => (
<a 
                  key={reg.name}
                  href={`/shop?region=${reg.name}`}
                  aria-label={`Explore ${reg.name}`}
                  className="px-4 py-10 bg-background border border-primary/5 text-center hover:bg-primary hover:text-primary-foreground transition-all duration-700 group flex flex-col items-center justify-center space-y-4 shadow-sm hover:shadow-2xl hover:-translate-y-1"
                  >
                    <span className="text-[9px] tracking-[0.1em] text-amber-600/40 font-bold group-hover:text-amber-400/50">{reg.count} Artifacts</span>
                    <span className="text-xs tracking-[0.3em] uppercase font-bold text-primary group-hover:text-primary-foreground">{reg.name}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

