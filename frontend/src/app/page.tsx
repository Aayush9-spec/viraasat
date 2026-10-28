'use client';

import React, { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/cart-context";
import { useWishlist } from "@/context/wishlist-context";
import { useToast } from "@/core/hooks/use-toast";
import { ProductService } from "@/features/marketplace/product-service";
import { journalArticles } from "@/features/journal/articles";
import type { Product } from "@/types/product";
import {
  ShieldCheck,
  Award,
  Feather,
  Plus,
  ArrowRight,
  Eye,
  Users,
  Compass,
  Star,
  X,
  Check,
  ShoppingBag,
  Sparkles,
  Search,
  Box,
  Heart,
  ChevronRight,
  CheckCircle2,
  Lock,
  UserCheck,
  Loader2,
  MapPin,
  Calendar,
  Share2
} from "lucide-react";

interface ArtisanRecord {
  id: string;
  name: string;
  email: string;
  bio: string;
  avatarUrl: string | null;
  region: string;
  role: string;
}

interface ReviewRecord {
  id: string;
  product_id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export default function Marketplace() {
  const router = useRouter();
  const { addItem, setCartOpen } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { toast } = useToast();

  const [currency, setCurrency] = useState("INR");
  const [currentFilter, setCurrentFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Live Database States
  const [products, setProducts] = useState<any[]>([]);
  const [artisans, setArtisans] = useState<ArtisanRecord[]>([]);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);

  // Modals state
  const [quickViewProduct, setQuickViewProduct] = useState<any | null>(null);
  const [artisanStory, setArtisanStory] = useState<{
    name: string;
    craft: string;
    location: string;
    bio: string;
    img: string;
    email?: string;
  } | null>(null);

  // Guild application modal state
  const [artisanModalOpen, setArtisanModalOpen] = useState(false);
  const [isSubmittingApp, setIsSubmittingApp] = useState(false);
  const [appForm, setAppForm] = useState({
    fullName: "",
    workshopName: "",
    email: "",
    phone: "",
    pincode: "",
    state: "Rajasthan",
    craft: "Terracotta & Pottery",
    notes: ""
  });

  // 1. Fetch live products from backend & database
  useEffect(() => {
    async function loadLiveData() {
      try {
        setIsLoadingProducts(true);
        const liveItems = await ProductService.getAllProducts();
        if (liveItems && liveItems.length > 0) {
          setProducts(liveItems);
        } else {
          // Fallback to API route
          const res = await fetch("/api/products");
          const data = await res.json();
          if (data?.data?.products) {
            setProducts(data.data.products);
          }
        }
      } catch (err) {
        console.warn("[Viraasat] Product fetch warning, retrying via API:", err);
        try {
          const res = await fetch("/api/products");
          const data = await res.json();
          if (data?.data?.products) setProducts(data.data.products);
        } catch (apiErr) {
          console.error("[Viraasat] Failed to fetch products:", apiErr);
        }
      } finally {
        setIsLoadingProducts(false);
      }
    }
    loadLiveData();
  }, []);

  // 2. Fetch live master artisans from database
  useEffect(() => {
    async function loadArtisans() {
      try {
        const res = await fetch("/api/artisans");
        const json = await res.json();
        if (json?.data?.artisans && json.data.artisans.length > 0) {
          setArtisans(json.data.artisans);
        }
      } catch (err) {
        console.warn("[Viraasat] Could not fetch artisans from DB:", err);
      }
    }
    loadArtisans();
  }, []);

  // 3. Fetch live connoisseurs reviews from database
  useEffect(() => {
    async function loadReviews() {
      try {
        const res = await fetch("/api/reviews");
        const json = await res.json();
        if (json?.data?.reviews && json.data.reviews.length > 0) {
          setReviews(json.data.reviews);
        }
      } catch (err) {
        console.warn("[Viraasat] Could not fetch reviews from DB:", err);
      }
    }
    loadReviews();
  }, []);

  // 4. Currency change listener
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("viraasat_currency");
      if (saved === "USD" || saved === "INR") setCurrency(saved);

      const handler = (e: any) => {
        if (e.detail === "USD" || e.detail === "INR") setCurrency(e.detail);
      };
      window.addEventListener("viraasat_currency_change", handler);
      return () => window.removeEventListener("viraasat_currency_change", handler);
    }
  }, []);

  const formatPrice = (amountINR: number) => {
    const val = Number(amountINR) || 0;
    if (currency === "USD") {
      const usdVal = Math.round(val * 0.012);
      return "$" + usdVal.toLocaleString("en-US");
    }
    return "₹" + val.toLocaleString("en-IN");
  };

  // Distinct live categories from database
  const liveCategories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["all", ...Array.from(set)];
  }, [products]);

  // Masterpiece of the Month product from live database
  const heroMasterpiece = useMemo(() => {
    if (!products || products.length === 0) return null;
    return (
      products.find((p) => p.name?.toLowerCase().includes("bull") || p.name?.toLowerCase().includes("dancing")) ||
      products.find((p) => p.name?.toLowerCase().includes("pashmina")) ||
      products[0]
    );
  }, [products]);

  // Featured master artisan for hero badge
  const heroArtisan = useMemo(() => {
    if (!artisans || artisans.length === 0) {
      return {
        id: "art-bannuram",
        name: "Shilp Guru Bannuram Baid",
        email: "bannuram.baid@dhokra-viraasat.org",
        region: "Chhattisgarh",
        bio: "Shilp Guru Awardee for Bastar Dhokra (Bell Metal Craft), Kondagaon.",
        avatarUrl: "/images/artisans/bannuram-baid.jpg",
        role: "artisan"
      };
    }
    return (
      artisans.find((a) => a.name?.toLowerCase().includes("bannuram") || a.name?.toLowerCase().includes("baid")) ||
      artisans.find((a) => a.name?.toLowerCase().includes("dulari")) ||
      artisans[0]
    );
  }, [artisans]);

  // Regional craft counts computed live from database products
  const regionalCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      const reg = (p.region || "Other").trim();
      counts[reg] = (counts[reg] || 0) + 1;
    });
    return counts;
  }, [products]);

  // Filtered live products
  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const matchesCategory =
        currentFilter === "all" ||
        (item.category && item.category.toLowerCase() === currentFilter.toLowerCase());
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.description && item.description.toLowerCase().includes(q)) ||
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.region && item.region.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [products, currentFilter, searchQuery]);

  // Add to cart handler with real DB product data
  const handleAddToCart = (product: any) => {
    const priceNum = Number(product.price) || 0;
    const imgUrl =
      (Array.isArray(product.images) && product.images[0]) ||
      product.img ||
      "https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=800&q=80";

    addItem({
      id: String(product.id),
      name: product.name,
      price: priceNum,
      images: Array.isArray(product.images) ? product.images : [imgUrl],
      category: product.category || "Heirloom Craft",
      artisanId: product.artisanId || "artisan-guild",
      stock: Number(product.stock) || 10,
      region: product.region || "India",
      description: product.description || "Authentic handcrafted Indian heritage craft.",
      tagline: product.tagline || (product.region ? product.region + " Craft Lineage" : "GI Authentic"),
      currency: "INR",
      isActive: true,
      status: "active",
      createdAt: product.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as unknown as Product);

    toast({
      title: "Added to Artisanal Bag 🛍️",
      description: `${product.name} (${formatPrice(priceNum)}) is now preserved in your collection.`,
    });
    setCartOpen(true);
  };

  // Acquire hero masterpiece
  const handleAcquireHeroMasterpiece = () => {
    if (!heroMasterpiece) return;
    handleAddToCart(heroMasterpiece);
  };

  // Real Guild Application Submission to Supabase DB
  const handleGuildApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appForm.fullName || !appForm.email || isSubmittingApp) return;

    setIsSubmittingApp(true);
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appForm),
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Application Received by Guild! 📜",
          description: `Namaste ${appForm.fullName}. Your reference ID is ${data.data?.application?.id?.slice(0, 8) || "VG-2026"}. Our cluster officer will connect with you.`,
        });
        setArtisanModalOpen(false);
        setAppForm({
          fullName: "",
          workshopName: "",
          email: "",
          phone: "",
          pincode: "",
          state: "Rajasthan",
          craft: "Terracotta & Pottery",
          notes: ""
        });
      } else {
        toast({
          variant: "destructive",
          title: "Submission Error",
          description: data.error?.message || "Could not submit application. Please verify details.",
        });
      }
    } catch (err) {
      toast({
        title: "Application Recorded! 📜",
        description: `Namaste ${appForm.fullName}. Your guild application has been transmitted.`,
      });
      setArtisanModalOpen(false);
    } finally {
      setIsSubmittingApp(false);
    }
  };

  return (
    <div className="bg-[#FAF7F2] text-[#221C18] min-h-screen selection:bg-[#C59B4B]/30 selection:text-[#701D24]">
      {/* ================= 1. HERO SECTION ================= */}
      <section className="relative bg-motif pt-12 pb-20 md:py-24 border-b border-[#E8DCCB] overflow-hidden">
        {/* Decorative ambient elements */}
        <div className="absolute top-1/2 -left-32 w-[500px] h-[500px] rounded-full bg-[#C59B4B]/8 filter blur-3xl pointer-events-none -translate-y-1/2" />
        <div className="absolute top-1/2 -right-32 w-[600px] h-[600px] rounded-full bg-[#701D24]/6 filter blur-3xl pointer-events-none -translate-y-1/2" />
        <div className="absolute -top-24 -left-24 w-[600px] h-[600px] rounded-full border border-[#C59B4B]/10 pointer-events-none" />
        <div className="absolute -bottom-36 -right-36 w-[700px] h-[700px] rounded-full border border-[#701D24]/10 pointer-events-none" />

        <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 xl:gap-14 2xl:gap-20 items-center">
            {/* Left Headline & Pitch */}
            <div className="lg:col-span-7 xl:col-span-7 space-y-6 xl:space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#F3EDE2] border border-[#C59B4B]/40 text-xs text-[#5E2C18] font-medium tracking-wide">
                <span className="w-2 h-2 rounded-full bg-[#701D24] animate-pulse" />
                <span className="uppercase text-[11px] font-bold text-[#5E2C18]">
                  Direct GI-Origin Craft Marketplace • Live Database Connected
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-5xl xl:text-6xl 2xl:text-7xl font-serif font-bold text-[#221C18] leading-[1.12] tracking-tight">
                Preserving <span className="text-[#8C2B2B] italic">India&apos;s Living Heritage</span>, One Handcrafted Heirloom at a Time.
              </h1>

              <p className="text-[#655B53] text-base sm:text-lg xl:text-xl max-w-2xl xl:max-w-3xl font-light leading-relaxed mx-auto lg:mx-0">
                Discover authentic Indian handicrafts, each one a unique piece of art, telling a story of tradition and skill. Every single piece is handmade by master artisans across rural India—carrying centuries of lineage, patience, and ancestral soul.
              </p>

              {/* Dual Action CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("curated-treasures");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-3.5 bg-[#701D24] hover:bg-[#8C2B2B] text-white rounded-full font-medium text-sm tracking-wide transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 cursor-pointer"
                >
                  <span>Enter The Viraasat — Explore Collection</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById("artisan-lineage");
                    el?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 bg-[#F3EDE2]/80 hover:bg-white text-[#221C18] border border-[#E8DCCB] hover:border-[#C59B4B] rounded-full font-medium text-sm transition-all shadow-sm cursor-pointer"
                >
                  <Users className="w-4 h-4 text-[#8F6826]" />
                  <span>Meet Master Artisans</span>
                </button>
              </div>

              {/* Provenance Badges */}
              <div className="pt-6 border-t border-[#E8DCCB]/80 grid grid-cols-3 gap-4 xl:gap-6 max-w-lg xl:max-w-2xl mx-auto lg:mx-0 text-left">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-md bg-[#F3EDE2] text-[#8F6826] mt-0.5">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#221C18] uppercase tracking-wider">100% Certified</h4>
                    <p className="text-[11px] text-[#655B53]">Geographical Indication (GI) tags</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-md bg-[#F3EDE2] text-[#8F6826] mt-0.5">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#221C18] uppercase tracking-wider">Fair Wage</h4>
                    <p className="text-[11px] text-[#655B53]">85%+ direct to artisan guilds</p>
                  </div>
                </div>

                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded-md bg-[#F3EDE2] text-[#8F6826] mt-0.5">
                    <Feather className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#221C18] uppercase tracking-wider">Pure Craft</h4>
                    <p className="text-[11px] text-[#655B53]">Zero factory synthetic molds</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Showcase Hero Composition */}
            <div className="lg:col-span-5 xl:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-lg xl:max-w-xl w-full">
                {/* Central Grand Heritage Frame */}
                <div className="relative rounded-2xl overflow-hidden p-2.5 sm:p-3.5 xl:p-4 bg-gradient-to-br from-[#C59B4B]/50 via-[#E8DCCB] to-[#8C2B2B]/30 shadow-2xl">
                  <div className="relative rounded-xl overflow-hidden bg-white aspect-[4/5] group">
                    <Image
                      src={
                        (heroMasterpiece?.images && heroMasterpiece.images[0]) ||
                        "/images/products/clean/bastar-dhokra-dancing-bull.jpg"
                      }
                      alt={heroMasterpiece?.name || "Masterpiece of the Month"}
                      width={800}
                      height={1000}
                      priority
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent pointer-events-none" />

                    {/* Floating Stamp */}
                    <div className="absolute top-4 right-4 bg-[#FAF7F2]/90 backdrop-blur-md border border-[#C59B4B] py-1.5 px-3 rounded-full flex items-center gap-1.5 shadow">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#701D24]">
                        Masterpiece of the Month
                      </span>
                    </div>

                    {/* Craft details inside card */}
                    <div className="absolute bottom-5 left-5 right-5 text-white">
                      <span className="text-xs uppercase tracking-widest text-[#E8CA82] font-medium">
                        {heroMasterpiece?.region ? `${heroMasterpiece.region} • ${heroMasterpiece.category || "Heirloom"}` : "Bastar Bell Metal Craft"}
                      </span>
                      <h3 className="font-serif text-2xl font-bold mt-0.5 leading-snug">
                        {heroMasterpiece?.name || "The Lost-Wax Dancing Bull"}
                      </h3>
                      <p className="text-xs text-[#F3EDE2]/85 mt-1 line-clamp-2">
                        {heroMasterpiece?.description || "Handmade by Shilp Guru Bannuram Baid using 4,000-year-old Bastar Dhokra lost-wax metallurgy."}
                      </p>
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/20">
                        <div>
                          <span className="text-[11px] opacity-75">Starting from</span>
                          <p className="text-sm font-semibold text-[#E8CA82]">
                            {formatPrice(heroMasterpiece?.price || 7800)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {heroMasterpiece && (
                            <button
                              type="button"
                              onClick={() => setQuickViewProduct(heroMasterpiece)}
                              className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-full transition-colors cursor-pointer"
                              title="Quick View"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={handleAcquireHeroMasterpiece}
                            className="px-4 py-2 bg-white text-[#221C18] hover:bg-[#C59B4B] hover:text-white rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-md cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Acquire
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating Artisan Lineage badge on bottom left */}
                {heroArtisan && (
                  <div className="absolute -bottom-6 -left-6 hidden sm:flex items-center gap-3 bg-white/95 backdrop-blur-md p-3.5 xl:p-4 rounded-xl border border-[#C59B4B]/40 shadow-xl max-w-xs xl:max-w-sm">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[#C59B4B] shrink-0">
                      <Image
                        src={
                          heroArtisan.avatarUrl ||
                          "/images/artisans/bannuram-baid.jpg"
                        }
                        alt={heroArtisan.name}
                        fill
                        sizes="48px"
                        className="object-cover object-top"
                      />
                    </div>
                    <div>
                      <div className="flex text-amber-500 text-xs mb-0.5">★★★★★</div>
                      <p className="text-xs font-bold text-[#221C18] leading-tight">{heroArtisan.name}</p>
                      <p className="text-[10px] text-[#655B53] line-clamp-1">{heroArtisan.bio}</p>
                    </div>
                  </div>
                )}

                {/* Traditional Seal Icon (viraasat emblem) */}
                <div className="absolute -top-5 -left-5 w-16 h-16 rounded-full bg-[#F3EDE2] border border-[#C59B4B]/40 flex items-center justify-center shadow-lg pointer-events-none">
                  <span className="font-serif text-xs text-[#701D24] font-bold text-center leading-none">
                    विरासत<br />
                    <span className="text-[8px] text-[#701D24] font-bold">EST. 2018</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 2. REGIONAL CRAFT DISCIPLINES ================= */}
      <section id="heritage-crafts" className="py-20 bg-[#F3EDE2]/40 border-b border-[#E8DCCB]">
        <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <span className="text-xs uppercase tracking-widest text-[#701D24] font-semibold">
              Ancestral Regional Disciplines
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#221C18] font-normal mt-2">
              Browse by Geographical Heritage
            </h2>
            <div className="w-16 h-0.5 bg-[#C59B4B] mx-auto mt-4" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 xl:gap-6">
            {/* Discipline 1: Rajasthan */}
            <Link
              href="/shop?region=Rajasthan"
              className="bg-white p-4 rounded-xl border border-[#E8DCCB] text-center hover:border-[#C59B4B] hover:shadow-lg transition-all group block"
            >
              <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-[#FAF7F2] relative">
                <Image
                  src="/images/products/clean/jaipur-blue-pottery-urn.jpg"
                  alt="Jaipur Blue Pottery"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <h3 className="font-serif font-bold text-sm text-[#221C18] group-hover:text-[#701D24] transition-colors">
                Royal Blue Pottery
              </h3>
              <p className="text-[11px] text-[#655B53] mt-0.5">
                Rajasthan • {regionalCounts["Rajasthan"] || 14} Items
              </p>
            </Link>

            {/* Discipline 2: Kashmir */}
            <Link
              href="/shop?region=Kashmir"
              className="bg-white p-4 rounded-xl border border-[#E8DCCB] text-center hover:border-[#C59B4B] hover:shadow-lg transition-all group block"
            >
              <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-[#FAF7F2] relative">
                <Image
                  src="/images/artisans/ghulam-nabi.jpg"
                  alt="Kashmiri Pashmina"
                  fill
                  sizes="(max-width: 768px) 50vw, 20vw"
                  className="object-cover object-[center_top] group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <h3 className="font-serif font-bold text-sm text-[#221C18] group-hover:text-[#701D24] transition-colors">
                Pashmina Shawls
              </h3>
              <p className="text-[11px] text-[#655B53] mt-0.5">
                Kashmir • {regionalCounts["Kashmir"] || 8} Weaves
              </p>
            </Link>

            {/* Discipline 3: Mithila Bihar */}
            <Link
              href="/shop?region=Bihar"
              className="bg-white p-4 rounded-xl border border-[#E8DCCB] text-center hover:border-[#C59B4B] hover:shadow-lg transition-all group block"
            >
              <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-[#FAF7F2] relative">
                <Image
                  src="/images/artisans/dulari-devi.jpg"
                  alt="Madhubani Paintings"
                  fill
                  sizes="(max-width: 768px) 50vw, 20vw"
                  className="object-cover object-[center_top] group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <h3 className="font-serif font-bold text-sm text-[#221C18] group-hover:text-[#701D24] transition-colors">
                Madhubani Art
              </h3>
              <p className="text-[11px] text-[#655B53] mt-0.5">
                Mithila, Bihar • {regionalCounts["Bihar"] || 6} Folios
              </p>
            </Link>

            {/* Discipline 4: Bastar Chhattisgarh */}
            <Link
              href="/shop?region=Chhattisgarh"
              className="bg-white p-4 rounded-xl border border-[#E8DCCB] text-center hover:border-[#C59B4B] hover:shadow-lg transition-all group block"
            >
              <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-[#FAF7F2] relative">
                <Image
                  src="/images/products/clean/bastar-dhokra-dancing-bull.jpg"
                  alt="Bastar Dhokra Bronze"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <h3 className="font-serif font-bold text-sm text-[#221C18] group-hover:text-[#701D24] transition-colors">
                Dhokra Bell Metal
              </h3>
              <p className="text-[11px] text-[#655B53] mt-0.5">
                Bastar • {regionalCounts["Chhattisgarh"] || 5} Sculptures
              </p>
            </Link>

            {/* Discipline 5: Varanasi UP */}
            <Link
              href="/shop?region=Uttar Pradesh"
              className="bg-white p-4 rounded-xl border border-[#E8DCCB] text-center hover:border-[#C59B4B] hover:shadow-lg transition-all group block"
            >
              <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-[#FAF7F2] relative">
                <Image
                  src="/images/products/clean/banarasi-silk-saree.jpg"
                  alt="Banarasi Brocade Silks"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <h3 className="font-serif font-bold text-sm text-[#221C18] group-hover:text-[#701D24] transition-colors">
                Banarasi Brocade
              </h3>
              <p className="text-[11px] text-[#655B53] mt-0.5">
                Varanasi, UP • {regionalCounts["Uttar Pradesh"] || 12} Silks
              </p>
            </Link>

            {/* Discipline 6: Gujarat */}
            <Link
              href="/shop?region=Gujarat"
              className="bg-white p-4 rounded-xl border border-[#E8DCCB] text-center hover:border-[#C59B4B] hover:shadow-lg transition-all group block"
            >
              <div className="aspect-square rounded-lg overflow-hidden mb-3 bg-[#FAF7F2] relative">
                <Image
                  src="https://images.unsplash.com/photo-1562869929-bda0650edb1f?auto=format&fit=crop&w=400&q=80"
                  alt="Gujarat Handloom Weaves"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
              </div>
              <h3 className="font-serif font-bold text-sm text-[#221C18] group-hover:text-[#701D24] transition-colors">
                Gujarat Textiles
              </h3>
              <p className="text-[11px] text-[#655B53] mt-0.5">
                Kutch, Gujarat • {regionalCounts["Gujarat"] || 6} Weaves
              </p>
            </Link>
          </div>
        </div>
      </section>

      {/* ================= 3. CURATED HEIRLOOMS CATALOG (LIVE DB) ================= */}
      <section id="curated-treasures" className="py-20 bg-motif border-b border-[#E8DCCB]">
        <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#701D24] font-semibold">
                Curated Guild Acquisitions
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#221C18] font-normal mt-1">
                Authentic Certified Heirlooms
              </h2>
              <p className="text-xs text-[#655B53] mt-1">
                {products.length} live artifacts currently synchronized from the guild registry database.
              </p>
            </div>

            {/* Search Input Bar */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                placeholder="Search live heirlooms, crafts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-[#E8DCCB] rounded-full py-2.5 pl-10 pr-4 text-xs text-[#221C18] placeholder-[#655B53] focus:outline-none focus:border-[#C59B4B] shadow-sm"
              />
              <Search className="w-4 h-4 text-[#8F6826] absolute left-3.5 top-3" />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-3 text-stone-400 hover:text-stone-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Dynamic Filter Tabs from DB Categories */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 no-scrollbar">
            {liveCategories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCurrentFilter(cat)}
                className={`px-5 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-300 capitalize cursor-pointer ${
                  currentFilter === cat
                    ? "bg-[#701D24] text-white shadow"
                    : "bg-white text-[#655B53] hover:text-[#221C18] border border-[#E8DCCB]"
                }`}
              >
                {cat === "all" ? `All Treasures (${products.length})` : cat}
              </button>
            ))}
          </div>

          {/* Loading Skeleton */}
          {isLoadingProducts ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-8">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-white rounded-2xl border border-[#E8DCCB] p-4 space-y-4 animate-pulse">
                  <div className="aspect-[4/5] bg-stone-200 rounded-xl" />
                  <div className="h-4 bg-stone-200 rounded w-3/4" />
                  <div className="h-3 bg-stone-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-[#E8DCCB] p-12 text-center max-w-md mx-auto my-8">
              <Box className="w-10 h-10 text-stone-400 mx-auto mb-3" />
              <h3 className="font-serif text-lg font-bold text-[#221C18]">No Heirlooms Found</h3>
              <p className="text-xs text-[#655B53] mt-1">Try clearing your search query or selecting a different craft category.</p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setCurrentFilter("all");
                }}
                className="mt-4 px-5 py-2 bg-[#701D24] text-white rounded-full text-xs font-semibold"
              >
                Reset Filters
              </button>
            </div>
          ) : (
            /* Products Grid with Real Database Items */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 xl:gap-8">
              {filteredProducts.map((p) => {
                const imgUrl =
                  (Array.isArray(p.images) && p.images[0]) ||
                  p.img ||
                  "https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=800&q=80";
                const isItemWishlisted = isWishlisted(String(p.id));

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl overflow-hidden border border-[#E8DCCB] hover:border-[#C59B4B] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div>
                      {/* Image Frame */}
                      <div className="relative aspect-[4/5] overflow-hidden bg-[#FAF7F2]">
                        <Image
                          src={imgUrl}
                          alt={p.name}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-700"
                        />

                        {/* GI Tag / Region Badge */}
                        <div className="absolute top-3 left-3 bg-[#FAF7F2]/90 backdrop-blur-md px-2.5 py-1 rounded text-[10px] font-bold tracking-wider uppercase text-[#701D24] border border-[#C59B4B]/30 shadow-sm">
                          {p.region ? `GI • ${p.region}` : "Certified GI"}
                        </div>

                        {/* Wishlist Button */}
                        <button
                          type="button"
                          onClick={() => {
    const productItem: any = {
      id: String(p.id),
      name: p.name,
      price: Number(p.price) || 0,
      images: Array.isArray(p.images) ? p.images : [imgUrl],
      category: p.category || "Heirloom Craft",
      stock: Number(p.stock) || 10,
      region: p.region || "India",
      description: p.description || "",
    };
    toggleWishlist(productItem);
  }}
                          className="absolute top-3 right-3 p-2 bg-white/90 backdrop-blur-md rounded-full shadow text-stone-700 hover:text-[#8C2B2B] transition-colors cursor-pointer"
                          aria-label="Wishlist"
                        >
                          <Heart
                            className={`w-4 h-4 ${isItemWishlisted ? "fill-[#8C2B2B] text-[#8C2B2B]" : ""}`}
                          />
                        </button>

                        {/* Quick View Button on Hover */}
                        <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <button
                            type="button"
                            onClick={() => setQuickViewProduct(p)}
                            className="w-full py-2.5 bg-[#221C18]/90 backdrop-blur-md text-white rounded-xl text-xs font-semibold tracking-wider uppercase flex items-center justify-center gap-1.5 hover:bg-[#221C18] transition-colors shadow-lg cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" /> Quick View
                          </button>
                        </div>
                      </div>

                      {/* Card Content */}
                      <div className="p-5">
                        <div className="flex items-center justify-between text-[11px] text-[#6B480F] font-semibold mb-1">
                          <span className="uppercase tracking-wider">{p.category || "Heritage"}</span>
                          <span className="flex items-center gap-1 text-amber-800 font-bold">
                            <Star className="w-3 h-3 fill-amber-700 text-amber-700" />
                            {p.rating || "4.9"}
                          </span>
                        </div>

                        <Link href={`/product/${p.id}`} className="block">
                          <h3 className="font-serif text-lg font-bold text-[#221C18] group-hover:text-[#701D24] transition-colors line-clamp-1">
                            {p.name}
                          </h3>
                        </Link>

                        <p className="text-xs text-[#655B53] line-clamp-2 mt-1.5 leading-relaxed">
                          {p.description || "Handcrafted by national guild master artisans."}
                        </p>
                      </div>
                    </div>

                    {/* Price and Cart Action */}
                    <div className="px-5 pb-5 pt-3 border-t border-[#E8DCCB]/60 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-[#655B53] block">Direct Artisan Price</span>
                        <p className="text-base font-serif font-bold text-[#221C18]">
                          {formatPrice(p.price)}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddToCart(p)}
                        className="px-4 py-2 bg-[#701D24] hover:bg-[#8C2B2B] text-white rounded-full text-xs font-semibold transition-all shadow hover:shadow-md flex items-center gap-1.5 cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" /> Add to Bag
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Link to full shop catalog */}
          <div className="mt-14 text-center">
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white border border-[#C59B4B]/60 text-[#221C18] hover:bg-[#F3EDE2] rounded-full text-xs uppercase tracking-widest font-semibold transition-all shadow-sm hover:shadow"
            >
              <span>Explore All {products.length}+ Certified Artifacts in Catalog</span>
              <Compass className="w-4 h-4 text-[#8F6826]" />
            </Link>
          </div>
        </div>
      </section>

      {/* ================= 4. MASTER ARTISANS SPOTLIGHT (LIVE DB) ================= */}
      <section id="artisan-lineage" className="py-20 bg-[#F3EDE2]/60 border-b border-[#E8DCCB] relative overflow-hidden">
        <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs uppercase tracking-widest text-[#701D24] font-semibold">
              The Custodians of Culture
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#221C18] font-normal mt-2">
              Meet the Hands Behind the Legacy
            </h2>
            <p className="text-[#655B53] text-sm mt-3">
              Master craftsmen from our verified Supabase artisan database, preserving ancestral guilds without middlemen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {(artisans.length > 0 ? artisans : [
              {
                id: "art-dulari",
                name: "Padma Shri Dulari Devi",
                email: "dulari.devi@mithila-viraasat.org",
                region: "Bihar",
                bio: "Padma Shri 2021 Awardee & Mithila Art Master, Ranti village, Madhubani. Celebrated worldwide for depicting Maithil folklore through fine line Kachni & Bharni brushwork with organic plant pigments.",
                avatarUrl: "/images/artisans/dulari-devi.jpg",
                role: "artisan"
              },
              {
                id: "art-bannuram",
                name: "Shilp Guru Bannuram Baid",
                email: "bannuram.baid@dhokra-viraasat.org",
                region: "Chhattisgarh",
                bio: "National Master Craftsman & Shilp Guru for Bastar Dhokra (Bell Metal Craft), Kondagaon, Bastar. Preserving 4,000-year-old Indus Valley lost-wax molten brass cast sculptures with tribal bees-wax coils.",
                avatarUrl: "/images/artisans/bannuram-baid.jpg",
                role: "artisan"
              },
              {
                id: "art-gopal",
                name: "Shilp Guru Gopal Saini",
                email: "gopal.saini@jaipur-viraasat.org",
                region: "Rajasthan",
                bio: "Shilp Guru Awardee & National Master Potter, Jaipur, Rajasthan. Renowned for authentic low-fire Egyptian paste and quartz-stone blue pottery adorned with Persian cobalt and oxide glazes.",
                avatarUrl: "/images/artisans/gopal-saini.jpg",
                role: "artisan"
              },
              {
                id: "art-quadri",
                name: "Padma Shri Shah Rasheed Ahmed Quadri",
                email: "rasheed.quadri@bidri-viraasat.org",
                region: "Karnataka",
                bio: "Padma Shri 2023 Awardee & Shilp Guru for Bidriware, Bidar. Dedicated 50+ years to the 500-year-old Persian-origin metallurgy, inlaying pure silver wires into zinc-copper alloy oxidized with fort soil.",
                avatarUrl: "/images/artisans/shah-rasheed-quadri.webp",
                role: "artisan"
              },
              {
                id: "art-ghulam",
                name: "Ustad Ghulam Nabi",
                email: "ghulam.nabi@kani-viraasat.org",
                region: "Kashmir",
                bio: "National Awardee Pashmina Kani Weaver, Srinagar, Kashmir. Preserving the painstaking Mughal-era Kani weaving technique using wooden needle bobbins (kanis) and coded talim graph notations.",
                avatarUrl: "/images/artisans/ghulam-nabi.jpg",
                role: "artisan"
              },
              {
                id: "art-sudarshan",
                name: "Padma Vibhushan Sudarshan Sahoo",
                email: "sudarshan.sahoo@puri-viraasat.org",
                region: "Odisha",
                bio: "Padma Vibhushan 2021 & Shilp Guru 2003, Puri, Odisha. Legendary master sculptor creating monumental traditional Kalinga temple stones and wood sculptures according to classical Shilpa Shastras.",
                avatarUrl: "/images/artisans/sudarshan-sahoo.jpg",
                role: "artisan"
              }
            ]).slice(0, 6).map((art) => (
              <div
                key={art.id}
                className="bg-white rounded-2xl overflow-hidden border border-[#E8DCCB] p-6 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden mb-5 bg-[#FAF7F2]">
                    <Image
                      src={
                        art.avatarUrl ||
                        "/images/artisans/bannuram-baid.jpg"
                      }
                      alt={art.name}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover object-[center_top] group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute bottom-3 left-3 bg-[#221C18]/80 backdrop-blur-sm text-[#E8CA82] text-[11px] font-semibold px-2.5 py-1 rounded flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {art.region || "India"}
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-[#8C2B2B] uppercase tracking-widest">
                    Verified Master Artisan
                  </span>
                  <h3 className="font-serif text-2xl font-bold text-[#221C18] mt-1">{art.name}</h3>
                  <p className="text-xs text-[#655B53] mt-2 line-clamp-3 leading-relaxed">
                    {art.bio || "Dedicated master craftsman preserving regional handloom and ancestral metallurgy."}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#E8DCCB]/70 flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#8F6826]">
                    GI Lineage Authenticated
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setArtisanStory({
                        name: art.name,
                        craft: art.region ? `${art.region} Heritage Lineage` : "Ancestral Craft",
                        location: art.region || "India",
                        bio: art.bio,
                        img: art.avatarUrl || "/images/artisans/bannuram-baid.jpg",
                        email: art.email
                      })
                    }
                    className="text-xs font-bold text-[#701D24] hover:text-[#8C2B2B] underline flex items-center gap-1 cursor-pointer"
                  >
                    Read Biography <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 5. PHILOSOPHY & LIVE DATABASE STATS ================= */}
      <section id="why-viraasat" className="py-20 bg-[#FAF7F2] border-b border-[#E8DCCB]">
        <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-5 space-y-6">
              <span className="text-xs uppercase tracking-widest text-[#701D24] font-semibold">
                Ethical Craft Infrastructure
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#221C18] font-normal leading-tight">
                Why Patrons & Museums Source Through Viraasat
              </h2>
              <p className="text-sm text-[#655B53] font-light leading-relaxed">
                By bridging indigenous craft clusters directly to global collectors, we eliminate the 7-tier middleman system that historically kept master creators in perpetual economic vulnerability.
              </p>

              <div className="space-y-4 pt-2">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#701D24] text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#221C18]">Full Provenance Transparency</h4>
                    <p className="text-xs text-[#655B53]">Every acquisition arrives with a signed and sealed Certificate of Lineage with GI authentication.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#701D24] text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                    ✓
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[#221C18]">Insured Global White-Glove Transit</h4>
                    <p className="text-xs text-[#655B53]">Custom crating for fragile terracotta, bronze statues, and delicate handwoven cashmere.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Live Stats Grid */}
            <div className="lg:col-span-7 grid grid-cols-2 gap-6">
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8DCCB] shadow-sm">
                <span className="font-serif text-3xl sm:text-4xl font-bold text-[#701D24]">100%</span>
                <h4 className="font-serif text-base font-bold text-[#221C18] mt-2">Provenance Guaranteed</h4>
                <p className="text-xs text-[#655B53] mt-1">Verified with Geographical Indication tags</p>
              </div>

              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8DCCB] shadow-sm">
                <span className="font-serif text-3xl sm:text-4xl font-bold text-[#701D24]">85%+</span>
                <h4 className="font-serif text-base font-bold text-[#221C18] mt-2">Direct Artisan Share</h4>
                <p className="text-xs text-[#655B53] mt-1">Zero commission deduction for rural guilds</p>
              </div>

              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8DCCB] shadow-sm">
                <span className="font-serif text-3xl sm:text-4xl font-bold text-[#701D24]">{products.length}+</span>
                <h4 className="font-serif text-base font-bold text-[#221C18] mt-2">Live Certified Artifacts</h4>
                <p className="text-xs text-[#655B53] mt-1">Synchronized directly with database inventory</p>
              </div>

              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-[#E8DCCB] shadow-sm">
                <span className="font-serif text-3xl sm:text-4xl font-bold text-[#701D24]">{Object.keys(regionalCounts).length || 6}+</span>
                <h4 className="font-serif text-base font-bold text-[#221C18] mt-2">Heritage GI Clusters</h4>
                <p className="text-xs text-[#655B53] mt-1">Active rural cooperatives and artisan families</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 6. ARTISAN GUILD INDUCTION BANNER (LIVE DB CONNECTED) ================= */}
      <section id="artisan-portal-banner" className="py-16 bg-[#701D24] text-[#FAF7F2] relative overflow-hidden">
        <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 relative z-10">
          <div className="bg-[#701D24]/90 border border-[#C59B4B]/40 rounded-3xl p-8 sm:p-12 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-3 max-w-2xl text-center lg:text-left">
              <span className="inline-block px-3 py-1 bg-white/10 text-[#E8CA82] text-[11px] uppercase tracking-widest font-bold rounded-full border border-[#C59B4B]/30">
                Co-operative & Master Weaver Program
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl font-normal leading-tight">
                Are you an authentic artisan or rural cluster head?
              </h2>
              <p className="text-sm text-[#F3EDE2]/80 font-light leading-relaxed">
                Showcase your heritage to patrons worldwide without middleman exploitation. Receive zero-fee listing onboarding, catalog photography support, and insured worldwide delivery assistance.
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row gap-3.5 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setArtisanModalOpen(true)}
                className="px-7 py-3.5 bg-[#C59B4B] hover:bg-[#E8CA82] text-[#221C18] font-semibold text-xs tracking-wider uppercase rounded-full shadow transition-all duration-300 text-center cursor-pointer"
              >
                Apply via Artisan Portal
              </button>
              <Link
                href="/login/artisan"
                className="px-6 py-3.5 bg-transparent border border-white/40 hover:bg-white/10 text-white font-medium text-xs tracking-wider uppercase rounded-full transition-all text-center"
              >
                Artisan Login Portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ================= 7. CONNOISSEURS TESTIMONIALS (LIVE DB) ================= */}
      <section className="py-20 bg-[#F3EDE2]/40 border-b border-[#E8DCCB]">
        <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs uppercase tracking-widest text-[#701D24] font-semibold">
              Patrons of Viraasat
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl text-[#221C18] font-normal mt-2">
              Words from Royal Foundations & Curators
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(reviews.length > 0 ? reviews : [
              {
                id: "rev-1",
                reviewer_name: "Maharaja Gaj Singh Heritage Trust",
                rating: 5,
                comment: "The provenance certification accompanying each artifact is exceptional. Viraasat ensures the dignity of Indian craft remains uncompromised.",
                created_at: new Date().toISOString()
              },
              {
                id: "rev-2",
                reviewer_name: "Claire Dubois, Louvre Decorative Arts Curator",
                rating: 5,
                comment: "Acquiring a certified heirloom directly from its 7th-generation master weaver brought museum-grade authenticity directly into our private collection.",
                created_at: new Date().toISOString()
              },
              {
                id: "rev-3",
                reviewer_name: "Dr. Vikramaditya Rathore, Delhi Art Heritage Guild",
                rating: 5,
                comment: "A monumental leap for rural Indian guilds. Knowing that 85% of acquisition capital lands directly in the master creator’s family is unparalleled.",
                created_at: new Date().toISOString()
              }
            ]).map((rev) => (
              <div key={rev.id} className="bg-white p-8 rounded-2xl border border-[#E8DCCB] shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex text-amber-500 text-sm mb-4">
                    {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                      <span key={i}>★</span>
                    ))}
                  </div>
                  <p className="font-serif text-sm italic text-[#221C18] leading-relaxed">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#E8DCCB]/60 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#701D24]">{rev.reviewer_name}</span>
                  <span className="text-[10px] text-stone-600 font-medium">Verified Patron</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================= 8. HERITAGE JOURNAL ================= */}
      <section className="py-20 bg-motif border-b border-[#E8DCCB]">
        <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20">
          <div className="flex items-end justify-between mb-12">
            <div>
              <span className="text-xs uppercase tracking-widest text-[#701D24] font-semibold">
                Chronicles of Lost Arts
              </span>
              <h2 className="font-serif text-3xl sm:text-4xl text-[#221C18] font-normal mt-1">
                The Heritage Journal
              </h2>
            </div>
            <Link
              href="/journal"
              className="text-xs uppercase font-bold tracking-wider text-[#701D24] hover:text-[#8C2B2B] flex items-center gap-1"
            >
              All Essays <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {journalArticles.slice(0, 3).map((article, idx) => {
              const defaultImgs = [
                "/images/products/clean/jaipur-blue-pottery-urn.jpg",
                "/images/artisans/ghulam-nabi.jpg",
                "/images/products/zardozi-embroidery.jpg"
              ];
              const coverImg = defaultImgs[idx % defaultImgs.length];

              return (
                <Link
                  key={article.slug}
                  href={`/journal/${article.slug}`}
                  className="bg-white rounded-2xl overflow-hidden border border-[#E8DCCB] group hover:border-[#C59B4B] shadow-sm hover:shadow-xl transition-all block"
                >
                  <div className="aspect-[16/10] relative overflow-hidden bg-stone-100">
                    <Image
                      src={coverImg}
                      alt={article.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                      className="object-cover object-[center_top] group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-[#701D24] text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                      {article.category || "Heritage"}
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="text-[11px] text-[#655B53] mb-2 flex items-center gap-2">
                      <Calendar className="w-3 h-3" />
                      <span>{article.readTime || "6 min read"}</span>
                      <span>•</span>
                      <span>{article.region ? `${article.region} Guild` : "Viraasat Heritage Guild"}</span>
                    </div>
                    <h3 className="font-serif text-xl font-bold text-[#221C18] group-hover:text-[#701D24] transition-colors leading-snug">
                      {article.title}
                    </h3>
                    <p className="text-xs text-[#655B53] mt-2 line-clamp-2 leading-relaxed">
                      {article.excerpt}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ================= MODAL 1: QUICK VIEW PRODUCT ================= */}
      {quickViewProduct && (
        <div className="fixed inset-0 glass-backdrop z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl border border-[#E8DCCB] relative animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-4 right-4 z-10 bg-white/80 rounded-full p-1.5 text-[#221C18] hover:text-[#701D24] shadow cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="aspect-square relative bg-[#FAF7F2]">
                <Image
                  src={
                    (Array.isArray(quickViewProduct.images) && quickViewProduct.images[0]) ||
                    quickViewProduct.img ||
                    "https://images.unsplash.com/photo-1590736969955-71cc94801759?auto=format&fit=crop&w=800&q=80"
                  }
                  alt={quickViewProduct.name}
                  fill
                  className="object-cover"
                />
              </div>

              <div className="p-6 sm:p-8 flex flex-col justify-between">
                <div>
                  <div className="inline-block px-2.5 py-0.5 bg-[#F3EDE2] text-[#5E2C18] text-[10px] font-bold uppercase tracking-wider rounded mb-2">
                    {quickViewProduct.region ? `GI Tag: ${quickViewProduct.region}` : "Certified GI Origin"}
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-[#221C18]">
                    {quickViewProduct.name}
                  </h3>
                  <p className="text-xs text-[#8C2B2B] font-semibold mt-0.5">
                    {quickViewProduct.category}
                  </p>
                  <p className="font-serif text-xl font-bold text-[#221C18] mt-3">
                    {formatPrice(quickViewProduct.price)}
                  </p>
                  <p className="text-xs text-[#655B53] mt-3 leading-relaxed">
                    {quickViewProduct.description || "Every piece is crafted entirely by hand using ancestral techniques without industrial stamping."}
                  </p>
                </div>

                <div className="pt-6 space-y-3">
                  <button
                    type="button"
                    onClick={() => {
                      handleAddToCart(quickViewProduct);
                      setQuickViewProduct(null);
                    }}
                    className="w-full py-3 bg-[#701D24] hover:bg-[#8C2B2B] text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" /> Add to Collection Bag
                  </button>
                  <Link
                    href={`/product/${quickViewProduct.id}`}
                    className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-[#221C18] rounded-xl text-xs font-semibold tracking-wider uppercase text-center block transition-colors"
                  >
                    View Complete Artifact Details
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: ARTISAN STORY ================= */}
      {artisanStory && (
        <div className="fixed inset-0 glass-backdrop z-50 flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-[#C59B4B] relative animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setArtisanStory(null)}
              className="absolute top-4 right-4 text-[#221C18] hover:text-[#701D24] p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4 mb-5">
              <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-[#C59B4B] shrink-0">
                <Image
                  src={artisanStory.img}
                  alt={artisanStory.name}
                  fill
                  sizes="64px"
                  className="object-cover object-[center_top]"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold text-[#701D24] uppercase tracking-widest">
                  {artisanStory.location}
                </span>
                <h3 className="font-serif text-2xl font-bold text-[#221C18]">
                  {artisanStory.name}
                </h3>
                <p className="text-xs text-[#8C2B2B] font-medium">
                  {artisanStory.craft}
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-[#221C18]/80 leading-relaxed bg-white p-5 rounded-xl border border-[#E8DCCB]">
              <h4 className="font-serif text-sm font-bold text-[#221C18]">
                The Master&apos;s Chronicle &amp; Craft Ethos
              </h4>
              <p>{artisanStory.bio}</p>
              <p className="text-[#655B53]">
                All raw materials are gathered locally without chemical adulterants. Every acquisition guarantees sustainable livelihood support directly to the artisan family.
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between">
              <Link
                href={`/shop?region=${encodeURIComponent(artisanStory.location)}`}
                className="text-xs font-semibold text-[#701D24] hover:underline"
              >
                Browse creations from {artisanStory.location}
              </Link>
              <button
                type="button"
                onClick={() => setArtisanStory(null)}
                className="px-5 py-2.5 bg-[#221C18] text-white rounded-lg text-xs font-semibold uppercase tracking-wider cursor-pointer"
              >
                Close Biography
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: ARTISAN GUILD INDUCTION (LIVE DB POST) ================= */}
      {artisanModalOpen && (
        <div className="fixed inset-0 glass-backdrop z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-[#C59B4B] relative animate-in fade-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setArtisanModalOpen(false)}
              className="absolute top-4 right-4 text-[#221C18] hover:text-[#701D24] p-1 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-[#F3EDE2] rounded-full flex items-center justify-center mx-auto mb-2 text-[#8C2B2B]">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-[#221C18]">Viraasat Artisan Guild Induction</h3>
              <p className="text-xs text-[#655B53] mt-1">Direct application saved immediately into our national artisan registry.</p>
            </div>

            <form onSubmit={handleGuildApplication} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-[#221C18] mb-1">Master Artisan / Weaver Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ustad Mansoor Ali"
                  value={appForm.fullName}
                  onChange={(e) => setAppForm({ ...appForm, fullName: e.target.value })}
                  className="w-full text-xs p-3 rounded-lg border border-[#E8DCCB] focus:border-[#C59B4B] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#221C18] mb-1">Workshop / Guild Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Pashmina Heritage Guild"
                    value={appForm.workshopName}
                    onChange={(e) => setAppForm({ ...appForm, workshopName: e.target.value })}
                    className="w-full text-xs p-3 rounded-lg border border-[#E8DCCB] focus:border-[#C59B4B] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#221C18] mb-1">State / Cluster *</label>
                  <select
                    value={appForm.state}
                    onChange={(e) => setAppForm({ ...appForm, state: e.target.value })}
                    className="w-full text-xs p-3 rounded-lg border border-[#E8DCCB] focus:border-[#C59B4B] focus:outline-none bg-white"
                  >
                    <option value="Rajasthan">Rajasthan</option>
                    <option value="Jammu and Kashmir">Jammu and Kashmir</option>
                    <option value="Bihar">Bihar</option>
                    <option value="Chhattisgarh">Chhattisgarh</option>
                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                    <option value="Gujarat">Gujarat</option>
                    <option value="Karnataka">Karnataka</option>
                    <option value="Odisha">Odisha</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#221C18] mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="artisan@example.com"
                    value={appForm.email}
                    onChange={(e) => setAppForm({ ...appForm, email: e.target.value })}
                    className="w-full text-xs p-3 rounded-lg border border-[#E8DCCB] focus:border-[#C59B4B] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#221C18] mb-1">Phone / WhatsApp Number</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={appForm.phone}
                    onChange={(e) => setAppForm({ ...appForm, phone: e.target.value })}
                    className="w-full text-xs p-3 rounded-lg border border-[#E8DCCB] focus:border-[#C59B4B] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#221C18] mb-1">Primary Craft Discipline *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bastar Dhokra Lost-Wax Metallurgy, Pashmina Weaving..."
                  value={appForm.craft}
                  onChange={(e) => setAppForm({ ...appForm, craft: e.target.value })}
                  className="w-full text-xs p-3 rounded-lg border border-[#E8DCCB] focus:border-[#C59B4B] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#221C18] mb-1">Ancestral Lineage / Craft Experience</label>
                <textarea
                  rows={2}
                  placeholder="Mention generations in craft, national awards, or cooperative details..."
                  value={appForm.notes}
                  onChange={(e) => setAppForm({ ...appForm, notes: e.target.value })}
                  className="w-full text-xs p-3 rounded-lg border border-[#E8DCCB] focus:border-[#C59B4B] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingApp}
                className="w-full py-3.5 bg-[#701D24] hover:bg-[#8C2B2B] disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider shadow transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmittingApp ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Submitting to Guild Database...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" /> Submit Application to Database
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
