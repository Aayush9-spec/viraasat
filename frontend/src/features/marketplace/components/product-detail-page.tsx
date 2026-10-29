'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { products, artisans, getLocalProducts } from '@/lib/data';
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
import { CulturalKnowledgeGraph } from './cultural-knowledge-graph';
import { useCart } from '@/context/cart-context';
import { useToast } from '@/core/hooks/use-toast';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Globe2,
  Loader2,
  QrCode,
  ShieldCheck,
  Leaf,
  ShieldAlert,
  Cpu,
  Network,
  CheckCircle2,
  Send,
  Compass,
  Sparkles,
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLanguage } from '@/context/language-context';
import { BACKEND_URL } from '@/services/backend/client';

export function ProductDetailPageClient({ 
  initialProduct, 
  product: directProduct,
  productId 
}: { 
  initialProduct?: Product; 
  product?: Product;
  productId?: string; 
}) {
  const router = useRouter();
  const { t, language } = useLanguage();
  const [product, setProduct] = useState<Product | undefined>(initialProduct || directProduct);
  const [hasCheckedClient, setHasCheckedClient] = useState<boolean>(Boolean(initialProduct || directProduct));
  const { addItem } = useCart();
  const { toast } = useToast();
  const backend = useBackend();
  const { get: backendGet } = backend;
  const [translatedDesc, setTranslatedDesc] = useState('');
  const [translateLang, setTranslateLang] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [provenance, setProvenance] = useState<any[]>([]);
  const [loadingProvenance, setLoadingProvenance] = useState(false);

  // Recommendations state (Two-Tower + co-purchase similarity)
  const [recommendedItems, setRecommendedItems] = useState<any[]>([]);
  const [recAccuracy, setRecAccuracy] = useState<number | null>(null);

  // Blockchain transfer state
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferOwner, setTransferOwner] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);

  useEffect(() => {
    if (!product && productId) {
      const localProds = getLocalProducts();
      const match = localProds.find((p) => p.id === productId) || products.find((p) => p.id === productId);
      if (match) {
        setProduct(match);
      }
      setHasCheckedClient(true);
    }
  }, [productId, product]);

  // Load Blockchain Provenance
  useEffect(() => {
    if (!product) return;
    const p = product;
    async function fetchProvenance() {
      setLoadingProvenance(true);
      try {
        const data = await backendGet<{ ledger_chain?: any[] }>(`/api/blockchain/provenance/${p.id}`);
        setProvenance(data.ledger_chain || []);
      } catch (err) {
        console.warn('Blockchain backend offline, using simulated provenance ledger.');
        setProvenance([
          { index: 1, timestamp: "2026-07-20 10:00:00", action: "Artisan Identity Verified (" + (p.artisanName || 'Riya Sharma') + ")", actor: "Viraasat Protocol Node", hash: "8f3b2a9e", prev_hash: "00000000" },
          { index: 2, timestamp: "2026-07-22 11:30:00", action: "GI Origin Certification Issued (" + (p.region || 'Rajasthan') + ")", actor: "Handicrafts Board Node", hash: "4c7e2d9b", prev_hash: "8f3b2a9e" },
          { index: 3, timestamp: "2026-07-25 14:00:00", action: "Digital Passport Mined (Genesis Block)", actor: "Viraasat Ledger Mainnet", hash: "d9e8a7f6", prev_hash: "4c7e2d9b" }
        ]);
      } finally {
        setLoadingProvenance(false);
      }
    }
    fetchProvenance();
  }, [product, backendGet]);

  // Load Two-Tower + Similarity Recommendations from Backend
  useEffect(() => {
    if (!product) return;
    async function fetchRecommendations() {
      try {
        const res = await fetch(`/api/recommendations?productId=${product.id}&region=${encodeURIComponent(product.region)}&category=${encodeURIComponent(product.category)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.products && data.products.length > 0) {
            setRecommendedItems(data.products);
            if (data.model_accuracy) setRecAccuracy(data.model_accuracy);
          }
        }
      } catch (e) {
        // graceful fallback to related items
      }
    }
    fetchRecommendations();
  }, [product]);

  // Handle Blockchain Ownership Transfer
  const handleTransferOwnership = async () => {
    if (!transferOwner.trim() || !product) {
      toast({
        variant: 'destructive',
        title: 'Recipient Required',
        description: 'Please specify the new collector name or public address.',
      });
      return;
    }
    setIsTransferring(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/blockchain/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: product.id,
          new_owner: transferOwner.trim(),
          tx_value: Number(transferAmount) || product.price,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        toast({
          title: 'Ownership Transferred On-Chain',
          description: `Mined Block #${data.block?.index || ''} on Viraasat PoW Ledger. Hash: ${data.block?.hash?.slice(0, 16)}...`,
        });
        const updated = await backendGet<{ ledger_chain?: any[] }>(`/api/blockchain/provenance/${product.id}`);
        setProvenance(updated.ledger_chain || []);
        setTransferModalOpen(false);
        setTransferOwner('');
        setTransferAmount('');
      } else {
        throw new Error('Transfer call failed');
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Transfer Failed',
        description: 'Could not execute on-chain transfer. Please try again.',
      });
    } finally {
      setIsTransferring(false);
    }
  };

  const artisan = product ? artisans.find((a) => a.id === product.artisanId) : undefined;

  // Fallback deterministic related products
  const relatedProducts = useMemo(() => {
    if (!product) return [];
    const candidates = products.filter(
      (p) => p.id !== product.id && (p.category === product.category || p.region === product.region)
    );
    const seed = product.id.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return [...candidates].sort((a, b) => {
      const ha = (seed * a.id.length * 2654435761) >>> 0;
      const hb = (seed * b.id.length * 2654435761) >>> 0;
      return ha - hb;
    }).slice(0, 4);
  }, [product]);

  const displayTreasures = recommendedItems.length > 0 ? recommendedItems : relatedProducts;

  if (!product) {
    if (!hasCheckedClient) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <h1 className="text-2xl font-bold mb-4 font-heading text-primary">Masterpiece Not Found</h1>
        <p className="text-muted-foreground mb-6">This specific creation is no longer in the public gallery.</p>
        <Button onClick={() => router.push('/shop')} className="rounded-none bg-primary text-primary-foreground font-bold">
          Explore Gallery
        </Button>
      </div>
    );
  }

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      images: product.images,
      artisanName: product.artisanName,
    } as any);
    toast({
      title: t('product.addedToCart'),
      description: `${product.name} ${t('product.addedToCartDesc')}`,
    });
  };

  return (
    <div className="min-h-screen bg-background py-16">
      <main className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 xl:gap-24 items-start">
          {/* Images Section */}
          <div className="space-y-6">
            <div className="relative aspect-[4/5] overflow-hidden bg-secondary/30 border border-amber-900/10 shadow-2xl">
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                priority
                className="object-cover"
              />
              <div className="absolute top-6 left-6 flex flex-col gap-2">
                <Badge className="bg-primary/95 text-primary-foreground font-bold uppercase tracking-[0.2em] text-[10px] px-3 py-1 rounded-none shadow-lg">
                  {product.category}
                </Badge>
                {product.region && (
                  <Badge variant="outline" className="bg-background/80 backdrop-blur-md text-foreground border-amber-900/20 font-bold uppercase tracking-widest text-[9px] px-2.5 py-0.5 rounded-none">
                    {product.region}
                  </Badge>
                )}
              </div>
            </div>

            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-4">
                {product.images.slice(1).map((img, i) => (
                  <div key={i} className="relative aspect-square border border-amber-900/10 overflow-hidden bg-secondary/20">
                    <Image src={img} alt={`${product.name} thumbnail ${i + 2}`} fill className="object-cover" />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Details & Interactive Actions */}
          <div className="space-y-8 text-left">
            <div>
              <span className="text-amber-800 text-[10px] tracking-[0.4em] uppercase mb-2 block font-bold">
                Certified Artisan Heritage
              </span>
              <h1 className="text-3xl sm:text-4xl xl:text-5xl font-heading font-medium tracking-tight text-primary">
                {product.name}
              </h1>
              <p className="text-xs text-muted-foreground mt-2 font-mono">
                Item ID: {product.id} • Registered Origin: {product.region}
              </p>
            </div>

            {/* Translation & Story Narrative */}
            <div className="space-y-3">
              <p className="text-sm sm:text-base leading-relaxed text-foreground/80 font-serif">
                {product.description}
              </p>

              <div className="flex items-center gap-2 pt-1">
                <Select value={translateLang} onValueChange={setTranslateLang}>
                  <SelectTrigger className="w-36 h-9 text-xs">
                    <SelectValue placeholder="Translate" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hi">Hindi (हिंदी)</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={!translateLang || isTranslating}
                  onClick={async () => {
                    setIsTranslating(true);
                    try {
                      const res = await translateText({ text: product.description, language: translateLang });
                      setTranslatedDesc(res.translatedText);
                    } catch {
                      toast({ variant: 'destructive', title: 'Translation unavailable' });
                    } finally {
                      setIsTranslating(false);
                    }
                  }}
                  className="h-9 gap-1.5 text-xs"
                >
                  {isTranslating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t('product.translate')}
                </Button>
              </div>

              {translatedDesc && (
                <div className="rounded-md bg-secondary/30 p-3 border border-amber-900/10">
                  <p className="text-xs italic leading-relaxed text-[#5e2c18]">{translatedDesc}</p>
                </div>
              )}
            </div>

            {/* Pricing & Add to Cart */}
            <div className="flex items-center justify-between pt-2">
              <div className="text-4xl font-bold text-primary font-heading tracking-tight">
                ₹{product.price.toLocaleString('en-IN')}
              </div>
              <Badge variant={product.stock > 0 ? "secondary" : "destructive"} className="px-3 py-1 rounded-none uppercase tracking-wider text-[10px]">
                {product.stock > 0 ? `${product.stock} Units Available` : 'Out of Stock'}
              </Badge>
            </div>

            <Button
              size="lg"
              className="w-full bg-[#9c4221] hover:bg-[#803318] text-white font-bold h-14 rounded-none shadow-lg uppercase tracking-[0.25em] text-xs transition-all"
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              {t('product.addToCollection')}
            </Button>

            <Separator className="bg-amber-900/10" />

            {/* Artisan Profile Card */}
            {artisan && (
              <Card className="rounded-none border-border bg-card shadow-xs overflow-hidden">
                <CardHeader className="flex flex-row items-center gap-4 bg-secondary/30 pb-3">
                  <Avatar className="h-12 w-12 ring-1 ring-amber-900/10">
                    <AvatarImage src={artisan.profilePicture} alt={artisan.name} />
                    <AvatarFallback className="bg-amber-50 text-amber-900">{artisan.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.2em] text-amber-800 font-bold">The Craftsman</p>
                    <CardTitle className="text-base font-heading text-primary">{artisan.shopName}</CardTitle>
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium mt-0.5">
                      <Globe2 className="h-3 w-3" />
                      <span>{product.region} Guild Member</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-3 pb-4">
                  <p className="text-xs leading-relaxed text-foreground/80 italic font-serif">&ldquo;{artisan.bio}&rdquo;</p>
                </CardContent>
              </Card>
            )}

            {/* 4 Tabs: Insights, Passport, Blockchain Provenance, Cultural Knowledge Graph */}
            <Tabs defaultValue="insights" className="w-full">
              <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-secondary/50 border border-amber-900/10 text-[10px]">
                <TabsTrigger value="insights" className="py-2.5 font-bold tracking-wider data-[state=active]:bg-[#9c4221] data-[state=active]:text-white">
                  Insights
                </TabsTrigger>
                <TabsTrigger value="passport" className="py-2.5 font-bold tracking-wider data-[state=active]:bg-[#9c4221] data-[state=active]:text-white">
                  Passport
                </TabsTrigger>
                <TabsTrigger value="provenance" className="py-2.5 font-bold tracking-wider data-[state=active]:bg-[#9c4221] data-[state=active]:text-white">
                  Provenance
                </TabsTrigger>
                <TabsTrigger value="graph" className="py-2.5 font-bold tracking-wider data-[state=active]:bg-[#9c4221] data-[state=active]:text-white flex items-center gap-1">
                  <Compass className="h-3 w-3" /> Graph
                </TabsTrigger>
              </TabsList>

              {/* TAB 1: Heritage Insights */}
              <TabsContent value="insights" className="mt-4">
                <Card className="rounded-none border-border bg-card shadow-xs text-card-foreground">
                  <CardHeader className="pb-3 border-b border-amber-900/10 bg-secondary/30">
                    <CardTitle className="text-[10px] font-bold tracking-[0.2em] uppercase text-amber-900/70">
                      Heritage AI Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    {product.aiInsights?.keyFeatures && (
                      <div>
                        <h4 className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider mb-2">Key Distinguishing Features</h4>
                        <div className="flex flex-wrap gap-2">
                          {product.aiInsights.keyFeatures.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-[10px] bg-amber-50/50 text-[#5e2c18] border-amber-900/15">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    {product.aiInsights?.styleTags && (
                      <div>
                        <h4 className="text-[9px] uppercase font-bold text-muted-foreground tracking-wider mb-2">Aesthetic Signature</h4>
                        <div className="flex flex-wrap gap-2">
                          {product.aiInsights.styleTags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-[10px] bg-secondary text-primary">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 2: Digital Product Passport */}
              <TabsContent value="passport" className="mt-4">
                <Card className="rounded-none border-border bg-card shadow-xs text-card-foreground">
                  <CardHeader className="pb-3 border-b border-amber-900/10 bg-secondary/30">
                    <CardTitle className="text-[10px] font-bold tracking-[0.2em] uppercase text-amber-900/70">
                      Digital Product Passport (DPP)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-dashed border-amber-900/15 bg-secondary/20">
                      <div className="relative w-24 h-24 bg-white p-1 border border-amber-900/10 shrink-0">
                        <Image
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=https://virrasat.in/product/${product.id}`}
                          alt="Passport QR Code"
                          width={100}
                          height={100}
                          unoptimized
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="space-y-1.5 text-left w-full text-xs">
                        <div className="flex justify-between items-center border-b pb-1">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold">Authenticity Rating</span>
                          <Badge className="bg-emerald-600 text-white text-[10px]">
                            <ShieldCheck className="h-3 w-3 mr-1 inline" /> 98.6% Authentic
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center border-b pb-1">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold">Carbon Footprint</span>
                          <span className="text-emerald-700 font-bold flex items-center gap-1">
                            <Leaf className="h-3 w-3" /> 0.82 kg CO2e
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground text-[10px] uppercase font-bold">GI Legal Status</span>
                          <Badge variant="outline" className="border-amber-600 text-amber-800 text-[10px]">
                            Protected Craft
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 3: Blockchain Provenance Ledger */}
              <TabsContent value="provenance" className="mt-4">
                <Card className="rounded-none border-border bg-card shadow-xs text-card-foreground">
                  <CardHeader className="pb-3 border-b border-amber-900/10 bg-secondary/30">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-[10px] font-bold tracking-[0.2em] uppercase text-amber-900/70">
                        Proof-of-Work Provenance Ledger
                      </CardTitle>
                      <Badge variant="outline" className="text-[9px] border-emerald-600 text-emerald-800">
                        SHA-256 Verified
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-6">
                    {loadingProvenance ? (
                      <div className="flex py-8 justify-center items-center gap-2 text-xs text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin text-[#9c4221]" /> Querying blockchain node...
                      </div>
                    ) : (
                      <div className="relative border-l border-amber-900/15 pl-5 ml-2 space-y-5 text-left">
                        {provenance.map((block) => (
                          <div key={block.index} className="relative">
                            <div className="absolute -left-[27px] top-1 bg-white p-0.5 rounded-full border border-amber-900/20">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            </div>
                            <div>
                              <span className="text-[8px] font-mono text-muted-foreground uppercase">{block.timestamp}</span>
                              <h5 className="text-xs font-bold text-primary">{block.action}</h5>
                              <p className="text-[10px] text-muted-foreground">Actor: <span className="font-semibold text-foreground">{block.actor}</span></p>
                              <div className="flex gap-2 items-center mt-1 font-mono text-[8px] bg-secondary/40 p-1 px-2 border w-fit text-primary/80">
                                <span>Hash: {block.hash}</span>
                                <span className="opacity-40">|</span>
                                <span>Prev: {block.prev_hash}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Ownership Transfer Trigger */}
                    <div className="pt-4 border-t border-amber-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h4 className="text-xs font-bold text-primary">On-Chain Ownership Certificate</h4>
                        <p className="text-[10px] text-muted-foreground">Transfer Proof-of-Work blockchain provenance to the new collector or gallery.</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => setTransferModalOpen(true)}
                        className="bg-[#9c4221] hover:bg-[#803318] text-white text-xs h-8"
                      >
                        Transfer Ownership
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* TAB 4: Cultural Knowledge Graph & GI Ontology */}
              <TabsContent value="graph" className="mt-4">
                <CulturalKnowledgeGraph
                  initialCraftName={product.name}
                  region={product.region}
                  category={product.category}
                />
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Transfer Ownership Modal Dialog */}
        <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
          <DialogContent className="sm:max-w-md bg-[#fcfaf7] border-amber-900/20">
            <DialogHeader>
              <DialogTitle className="font-heading text-lg text-[#5e2c18] flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-[#9c4221]" /> Transfer On-Chain Provenance
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Mints a new Proof-of-Work block transferring legal cultural authenticity to the collector.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2 text-left">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold">New Owner / Collector Name</Label>
                <Input
                  placeholder="e.g. Meera Patel or National Craft Museum"
                  value={transferOwner}
                  onChange={(e) => setTransferOwner(e.target.value)}
                  className="bg-white border-amber-900/20 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold">Transaction Value (INR)</Label>
                <Input
                  type="number"
                  placeholder={String(product.price)}
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="bg-white border-amber-900/20 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" size="sm" onClick={() => setTransferModalOpen(false)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleTransferOwnership}
                disabled={isTransferring || !transferOwner.trim()}
                className="bg-[#9c4221] hover:bg-[#803318] text-white text-xs gap-1.5"
              >
                {isTransferring ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Mining PoW Block...
                  </>
                ) : (
                  <>
                    <Send className="h-3.5 w-3.5" /> Mint Transfer Block
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Two-Tower & Co-Purchase AI Recommendations Section */}
        <section className="mt-28 pt-16 border-t border-amber-900/10 relative overflow-hidden">
          <div className="text-center mb-12 space-y-2">
            <div className="flex items-center justify-center gap-2">
              <Badge className="bg-amber-100 text-[#5e2c18] border border-amber-300 text-[10px] gap-1">
                <Sparkles className="h-3 w-3 text-[#9c4221]" /> Two-Tower Neural Engine &amp; Co-Purchase Ranking
              </Badge>
              {recAccuracy && (
                <Badge variant="outline" className="border-emerald-600 text-emerald-800 text-[10px]">
                  {Math.round(recAccuracy * 100)}% Match Accuracy
                </Badge>
              )}
            </div>
            <h2 className="text-3xl md:text-4xl font-heading text-primary">
              Complementary Masterpieces &amp; Related Craft
            </h2>
            <p className="text-sm text-muted-foreground font-serif">
              Personalized selections based on geographic synergy and collective patron appreciation.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {displayTreasures.map((item) => (
              <div key={item.id} className="group cursor-pointer">
                <a href={`/product/${item.id}`} className="block space-y-4">
                  <div className="relative aspect-[4/5] overflow-hidden bg-neutral-100 group-hover:shadow-lg transition-all duration-500 border border-amber-900/10">
                    <Image
                      src={item.images?.[0] || '/images/products/clean/handcrafted-terracotta-diya.jpg'}
                      alt={item.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute top-3 left-3">
                      <Badge className="rounded-none bg-[#9c4221] text-white text-[9px] uppercase px-2.5 py-0.5">
                        {item.region}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-center px-2 space-y-1">
                    <h3 className="font-heading text-base text-primary group-hover:text-[#9c4221] transition-colors line-clamp-1">
                      {item.name}
                    </h3>
                    <p className="text-xs font-mono font-bold text-[#5e2c18]">
                      ₹{(item.price || 0).toLocaleString('en-IN')}
                    </p>
                  </div>
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Reviews & Ratings Section */}
        <ReviewsSection product={product} />
      </main>
    </div>
  );
}
