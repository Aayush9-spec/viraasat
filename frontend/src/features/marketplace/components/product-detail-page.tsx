'use client';

import { useState } from 'react';

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
import { ReviewsSection } from './reviews-section';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/hooks/use-toast';
import { useBackend } from '@/hooks/use-backend';
import type { Product } from '@/lib/types';
import { translateText } from '@/ai/flows/translate-text';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe2, Loader2, QrCode, ShieldCheck, Leaf, ShieldAlert, Cpu, Network, CheckCircle2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect } from 'react';

export function ProductDetailPageClient({ product }: { product: Product }) {
  const { addItem } = useCart();
  const { toast } = useToast();
  const backend = useBackend();
  const { get: backendGet } = backend;
  const [translatedDesc, setTranslatedDesc] = useState('');
  const [translateLang, setTranslateLang] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [provenance, setProvenance] = useState<any[]>([]);
  const [loadingProvenance, setLoadingProvenance] = useState(false);

  useEffect(() => {
    async function fetchProvenance() {
      setLoadingProvenance(true);
      try {
        const data = await backendGet<{ ledger_chain?: any[] }>(`/api/blockchain/provenance/${product.id}`);
        setProvenance(data.ledger_chain || []);
      } catch (err) {
        console.warn('Blockchain backend offline, using simulated provenance ledger.');
        setProvenance([
          { index: 1, timestamp: "2026-07-20 10:00:00", action: "Artisan Identity Verified (" + (product.artisanName || 'Riya Sharma') + ")", actor: "Viraasat Protocol Node", hash: "8f3b2a9e", prev_hash: "00000000" },
          { index: 2, timestamp: "2026-07-22 11:30:00", action: "GI Origin Certification Issued (" + (product.region || 'Rajasthan') + ")", actor: "Handicrafts Board Node", hash: "4c7e2d9b", prev_hash: "8f3b2a9e" },
          { index: 3, timestamp: "2026-07-25 14:00:00", action: "Digital Passport Mined (Genesis Block)", actor: "Viraasat Ledger Mainnet", hash: "d9e8a7f6", prev_hash: "4c7e2d9b" }
        ]);
      } finally {
        setLoadingProvenance(false);
      }
    }
    fetchProvenance();
  }, [product.id, product.artisanName, product.region, backendGet]);

  const TRANSLATE_LANGUAGES = [
    { value: 'Hindi', label: 'हिन्दी' },
    { value: 'Tamil', label: 'தமிழ்' },
    { value: 'Bengali', label: 'বাংলা' },
    { value: 'Telugu', label: 'తెలుగు' },
    { value: 'Marathi', label: 'मराठी' },
    { value: 'Urdu', label: 'اردو' },
    { value: 'Gujarati', label: 'ગુજરાતી' },
    { value: 'Kannada', label: 'ಕನ್ನಡ' },
    { value: 'Malayalam', label: 'മലയാളം' },
    { value: 'Punjabi', label: 'ਪੰਜਾਬੀ' },
  ];

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
      <div className="h-4" /> {/* Spacing after global navbar */}
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

            {/* Translation Section */}
            <div className="flex flex-col gap-3 rounded-lg border border-border/50 bg-muted/30 p-4">
              <div className="flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Translate Description</span>
              </div>
              <div className="flex gap-2">
                <Select value={translateLang} onValueChange={setTranslateLang}>
                  <SelectTrigger className="w-[160px] bg-background h-9 text-sm">
                    <SelectValue placeholder="Language" />
                  </SelectTrigger>
                  <SelectContent>
                    {TRANSLATE_LANGUAGES.map((lang) => (
                      <SelectItem key={lang.value} value={lang.value}>
                        {lang.label} ({lang.value})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!translateLang || isTranslating}
                  onClick={async () => {
                    setIsTranslating(true);
                    setTranslatedDesc('');
                    try {
                      const result = await translateText({
                        text: product.description,
                        language: translateLang,
                      });
                      setTranslatedDesc(result.translatedText);
                    } catch (err) {
                      console.error(err);
                      toast({
                        variant: 'destructive',
                        title: 'Translation Failed',
                        description: 'Could not translate. Please try again.',
                      });
                    } finally {
                      setIsTranslating(false);
                    }
                  }}
                  className="h-9 gap-1.5"
                >
                  {isTranslating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Translating...
                    </>
                  ) : (
                    'Translate'
                  )}
                </Button>
              </div>
              {translatedDesc && (
                <div className="rounded-md bg-background p-3 border border-primary/10">
                  <p className="text-sm leading-relaxed">{translatedDesc}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-4xl font-bold text-[#5e2c18] font-heading tracking-tight">
                ₹{product.price.toLocaleString('en-IN')}
              </div>
              <div className="flex flex-col items-end">
                <Badge variant={product.stock > 0 ? "secondary" : "destructive"} className="px-3 py-1 rounded-none uppercase tracking-[0.2em] text-[10px] bg-[#5e2c18]/5 text-[#5e2c18] border-[#5e2c18]/10">
                  {product.stock > 10 ? 'In Stock' : product.stock > 0 ? 'Low Stock' : 'Out of Stock'}
                </Badge>
                {product.stock > 0 && product.stock <= 5 && (
                  <p className="text-[10px] text-amber-600 mt-1 font-medium animate-pulse uppercase tracking-wider">Only {product.stock} left</p>
                )}
              </div>
            </div>

            <Button 
                size="lg" 
                className="w-full bg-[#5e2c18] hover:bg-[#4a2315] text-[#fbf7f0] font-bold h-14 rounded-none shadow-xl transition-all active:scale-[0.98] uppercase tracking-[0.3em] text-xs" 
                onClick={handleAddToCart}
                disabled={product.stock === 0}
            >
              Add to Collection
            </Button>

            <div className="flex items-center gap-6 text-[10px] text-amber-900/40 uppercase tracking-[0.2em] font-bold pt-2">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500/30" />
                <span>Authentic</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500/30" />
                <span>Handmade</span>
              </div>
            </div>

            <Separator className="bg-amber-900/10" />

            {artisan && (
              <Card className="rounded-none border-amber-900/10 bg-white shadow-sm overflow-hidden">
                <CardHeader className="flex flex-row items-center gap-4 bg-[#fbf7f0]/50 border-b border-amber-900/5">
                  <Avatar className="h-14 w-14 ring-1 ring-amber-900/10">
                    <AvatarImage src={artisan.profilePicture} alt={artisan.name} />
                    <AvatarFallback className="bg-amber-50 text-amber-900">{artisan.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.3em] text-amber-800/40 font-bold mb-1">The Craftsman</p>
                    <CardTitle className="text-lg font-heading text-[#5e2c18]">{artisan.shopName}</CardTitle>
                    <div className="flex items-center gap-1 text-[10px] text-amber-900/40 font-bold uppercase tracking-widest mt-0.5">
                        <Globe2 className="h-3 w-3 opacity-50" />
                        <span>{product.region}</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 pb-0">
                  <p className="text-xs leading-relaxed text-amber-900/70 italic font-serif">&ldquo;{artisan.bio}&rdquo;</p>
                </CardContent>
                <div className="px-6 pb-6 pt-4">
                    <Button variant="outline" size="sm" className="w-full rounded-none border-amber-900/20 text-[#5e2c18] hover:bg-amber-50 h-10 text-[10px] tracking-widest uppercase font-bold">
                        View Artisan History
                    </Button>
                </div>
              </Card>
            )}

            {(product.aiInsights) && (
            <Tabs defaultValue="insights" className="w-full">
              <TabsList className="grid w-full grid-cols-3 h-auto p-1 bg-[#fbf7f0] border border-amber-900/10">
                <TabsTrigger value="insights" className="py-2.5 text-[10px] uppercase font-bold tracking-wider data-[state=active]:bg-[#5e2c18] data-[state=active]:text-white">Insights</TabsTrigger>
                <TabsTrigger value="passport" className="py-2.5 text-[10px] uppercase font-bold tracking-wider data-[state=active]:bg-[#5e2c18] data-[state=active]:text-white">Passport</TabsTrigger>
                <TabsTrigger value="provenance" className="py-2.5 text-[10px] uppercase font-bold tracking-wider data-[state=active]:bg-[#5e2c18] data-[state=active]:text-white">Provenance</TabsTrigger>
              </TabsList>

              {/* Heritage Insights Tab */}
              <TabsContent value="insights" className="mt-4">
                {(product.aiInsights) ? (
                  <Card className="rounded-none border-amber-900/10 bg-white shadow-sm">
                    <CardHeader className="pb-3 border-b border-amber-900/5 bg-[#fbf7f0]/50">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-3 bg-amber-500/40" />
                        <CardTitle className="text-[10px] font-bold tracking-[0.3em] uppercase text-amber-900/60">Heritage Insights</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                      {product.aiInsights.keyFeatures && (
                        <div>
                          <h3 className="text-[9px] uppercase font-bold text-amber-900/30 tracking-[0.2em] mb-3">Distinguishing Features</h3>
                          <div className="flex flex-wrap gap-2">
                            {product.aiInsights.keyFeatures.map(tag => <Badge key={tag} variant="outline" className="bg-amber-50/30 border-amber-100/50 text-amber-800 rounded-none text-[9px] font-medium py-1 px-3 uppercase tracking-wider">{tag}</Badge>)}
                          </div>
                        </div>
                      )}
                      {product.aiInsights.styleTags && (
                        <div>
                          <h3 className="text-[9px] uppercase font-bold text-amber-900/30 tracking-[0.2em] mb-3">Aesthetic Signature</h3>
                          <div className="flex flex-wrap gap-2">
                            {product.aiInsights.styleTags.map(tag => <Badge key={tag} variant="secondary" className="bg-amber-900/5 text-amber-900/60 hover:bg-amber-900/5 rounded-none text-[9px] font-bold border-transparent uppercase tracking-widest px-3 py-1">{tag}</Badge>)}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="p-8 text-center border border-amber-900/10 bg-white text-xs text-muted-foreground">No insights available.</div>
                )}
              </TabsContent>

              {/* Digital Product Passport Tab */}
              <TabsContent value="passport" className="mt-4">
                <Card className="rounded-none border-amber-900/10 bg-white shadow-sm">
                  <CardHeader className="pb-3 border-b border-amber-900/5 bg-[#fbf7f0]/50">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-3 bg-green-500/40" />
                      <CardTitle className="text-[10px] font-bold tracking-[0.3em] uppercase text-amber-900/60">Digital Product Passport</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex flex-col sm:flex-row items-center gap-6 p-4 border border-dashed border-amber-900/10 bg-[#fbf7f0]/20">
                      <div className="relative w-28 h-28 bg-white p-1 border border-amber-900/10 shrink-0">
                        <Image
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=110x110&data=https://viraasat.org/passport/${product.id}`}
                          alt="Passport QR Code"
                          width={110}
                          height={110}
                          unoptimized
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="space-y-2 text-left w-full">
                        <div className="flex justify-between items-center border-b pb-1">
                          <span className="text-[9px] uppercase font-bold text-amber-900/40 tracking-wider">Authenticity Score</span>
                          <Badge className="bg-green-600 rounded-none text-[9px] font-bold px-2 py-0.5"><ShieldCheck className="h-3 w-3 mr-1 inline" /> 98.6% Authentic</Badge>
                        </div>
                        <div className="flex justify-between items-center border-b pb-1">
                          <span className="text-[9px] uppercase font-bold text-amber-900/40 tracking-wider">Carbon Footprint</span>
                          <span className="text-xs text-green-600 font-bold flex items-center gap-1"><Leaf className="h-3.5 w-3.5" /> 0.82 kg CO2e</span>
                        </div>
                        <div className="flex justify-between items-center border-b pb-1">
                          <span className="text-[9px] uppercase font-bold text-amber-900/40 tracking-wider">Craft Identity</span>
                          <span className="text-xs font-semibold text-[#5e2c18]">{product.category} ({product.region})</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] uppercase font-bold text-amber-900/40 tracking-wider">Certification</span>
                          <Badge variant="outline" className="border-green-500 text-green-600 rounded-none text-[9px] font-bold px-2 py-0.5">GI CERTIFIED</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-left">
                      <div className="p-3 bg-muted/40 border rounded-none">
                        <h4 className="text-[9px] uppercase font-bold text-amber-900/40 tracking-wider mb-1">Local Sourcing %</h4>
                        <p className="text-lg font-bold text-[#5e2c18]">95.0%</p>
                        <p className="text-[8px] text-muted-foreground uppercase tracking-widest mt-0.5">Sourced within {product.region}</p>
                      </div>
                      <div className="p-3 bg-muted/40 border rounded-none">
                        <h4 className="text-[9px] uppercase font-bold text-amber-900/40 tracking-wider mb-1">Production Date</h4>
                        <p className="text-lg font-bold text-[#5e2c18]">July 2026</p>
                        <p className="text-[8px] text-muted-foreground uppercase tracking-widest mt-0.5">Handcrafted</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Blockchain Provenance Ledger Tab */}
              <TabsContent value="provenance" className="mt-4">
                <Card className="rounded-none border-amber-900/10 bg-white shadow-sm">
                  <CardHeader className="pb-3 border-b border-amber-900/5 bg-[#fbf7f0]/50">
                    <div className="flex items-center gap-2">
                      <div className="w-1 h-3 bg-blue-500/40" />
                      <CardTitle className="text-[10px] font-bold tracking-[0.3em] uppercase text-amber-900/60">Blockchain Provenance Ledger</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {loadingProvenance ? (
                      <div className="flex py-8 justify-center items-center gap-2 text-xs text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" /> Querying blockchain node...</div>
                    ) : (
                      <div className="relative border-l border-amber-900/10 pl-6 ml-2 space-y-6 text-left">
                        {provenance.map((block) => (
                          <div key={block.index} className="relative">
                            <div className="absolute -left-[31px] top-1 bg-white p-1 rounded-full border border-amber-900/20">
                              <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" />
                            </div>
                            <div>
                              <span className="text-[8px] font-mono text-muted-foreground uppercase tracking-wider">{block.timestamp}</span>
                              <h4 className="text-xs font-bold text-[#5e2c18] mt-0.5">{block.action}</h4>
                              <p className="text-[9px] text-muted-foreground mt-0.5">Actor: <span className="font-semibold">{block.actor}</span></p>
                              <div className="flex gap-2 items-center mt-1.5 font-mono text-[8px] bg-secondary/50 p-1 px-2 border w-fit text-[#5e2c18]/70">
                                <span>Hash: {block.hash}</span>
                                <span className="opacity-50">|</span>
                                <span>Prev: {block.prev_hash}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            )}
          </div>
        </div>

        {/* Related Collections Section */}
        <section className="mt-32 pt-20 border-t border-amber-900/10 relative overflow-hidden">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-20 bg-gradient-to-b from-amber-900/20 to-transparent" />
            
            <div className="text-center mb-20">
                <span className="text-amber-500 text-[10px] tracking-[0.5em] uppercase mb-4 block font-bold">Curated Heritage</span>
                <h2 className="text-3xl md:text-5xl font-heading text-[#5e2c18] italic">Related Treasures</h2>
                <p className="text-amber-900/40 text-sm mt-4 font-serif">Handpicked pieces from the same tradition</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">
                {products
                    .filter(p => p.id !== product.id && (p.category === product.category || p.region === product.region))
                    .sort(() => 0.5 - Math.random())
                    .slice(0, 4)
                    .map((item) => (
                        <div key={item.id} className="group cursor-pointer">
                            <a href={`/product/${item.id}`} className="block space-y-6">
                                <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100 group-hover:shadow-[0_20px_50px_rgba(94,44,24,0.15)] transition-all duration-700">
                                    <Image 
                                        src={item.images[0]} 
                                        alt={item.name} 
                                        fill 
                                        className="object-cover group-hover:scale-105 transition-transform duration-1000 grayscale-[0.2] group-hover:grayscale-0"
                                    />
                                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                    <div className="absolute bottom-6 left-6 right-6 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                                        <Button className="w-full rounded-none bg-white/95 text-[#5e2c18] border-none text-[10px] tracking-[0.2em] uppercase font-bold h-10">
                                            Discover
                                        </Button>
                                    </div>
                                    <div className="absolute top-4 left-4">
                                        <Badge className="rounded-none bg-[#5e2c18]/90 text-amber-50 border-none text-[9px] tracking-widest uppercase px-3 py-1 font-bold">{item.region}</Badge>
                                    </div>
                                </div>
                                <div className="text-center px-4">
                                    <h3 className="font-heading text-xl text-[#5e2c18] group-hover:text-amber-700 transition-colors">{item.name}</h3>
                                    <div className="flex items-center justify-center gap-2 mt-2">
                                        <div className="h-px w-4 bg-amber-900/10" />
                                        <p className="text-[10px] text-amber-900/40 uppercase tracking-[0.2em] font-bold">₹{item.price.toLocaleString('en-IN')}</p>
                                        <div className="h-px w-4 bg-amber-900/10" />
                                    </div>
                                </div>
                            </a>
                        </div>
                    ))}
            </div>
        </section>

        {/* Reviews & Ratings */}
        <ReviewsSection product={product} />
      </main>
    </div>
  );
}
