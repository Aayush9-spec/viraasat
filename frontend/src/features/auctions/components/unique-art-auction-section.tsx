'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Gavel,
  Clock,
  ShieldCheck,
  TrendingUp,
  Sparkles,
  Plus,
  ArrowRight,
  Flame,
  Award,
  CheckCircle2,
  Calendar,
  Layers,
  X,
  History,
  Info,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/core/hooks/use-toast';
import { useTranslation } from '@/core/hooks/use-translation';
import { UniqueArtAuction, Bid } from '@/types/auction';
import { cn } from '@/core/utils/utils';

// Authentic Heirloom Seed Auctions
const SEED_AUCTIONS: UniqueArtAuction[] = [
  {
    id: 'auction-zardozi-royal',
    title: 'Imperial 24K Gold Zardozi Wall Hanging (c. 1978 Royal Pattern)',
    artisanName: 'Ustad Abdul Qadir & Sons',
    artisanRegion: 'Varanasi, Uttar Pradesh',
    craftCategory: 'Zardozi & Gold Metallic Embroidery',
    giTagCertified: true,
    provenanceHash: '0x8f4c91a0b3e2...7b2a',
    description: 'An irreplaceable museum-grade tapestry hand-stitched over 14 months using real 24-karat gold dipped silver wires (kalabattu) over pure velvet silk. Features ancestral Mughal floral arabesques and Persian medallions.',
    imageUrl: '/images/products/zardozi-embroidery.jpg',
    minPrice: 85000,
    currentBid: 114000,
    bidCount: 16,
    minIncrement: 2500,
    startTime: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
    durationHours: 120,
    status: 'active',
    sellerEmail: 'abdul.qadir@viraasat.in',
    createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
    bids: [
      { id: 'b1', auctionId: 'auction-zardozi-royal', bidderName: 'Maharaja Heritage Trust', bidderRole: 'institution', amount: 85000, timestamp: '2 days ago' },
      { id: 'b2', auctionId: 'auction-zardozi-royal', bidderName: 'Claire D., Louvre Arts Curator', bidderRole: 'collector', amount: 95000, timestamp: '1 day ago' },
      { id: 'b3', auctionId: 'auction-zardozi-royal', bidderName: 'Vikramaditya R.', bidderRole: 'patron', amount: 105000, timestamp: '14 hours ago' },
      { id: 'b4', auctionId: 'auction-zardozi-royal', bidderName: 'National Textile Guild Patron', bidderRole: 'collector', amount: 114000, timestamp: '2 hours ago' },
    ]
  },
  {
    id: 'auction-dhokra-shaman',
    title: 'Tribal Bastar Dhokra Dancing Shaman (Solid Bronze Lost-Wax Cast)',
    artisanName: 'Sukhdev Baghel Guild',
    artisanRegion: 'Bastar, Chhattisgarh',
    craftCategory: 'Dhokra Non-Ferrous Lost-Wax Metal Casting',
    giTagCertified: true,
    provenanceHash: '0x3c7e44f810aa...e911',
    description: 'Cast using an unbroken 4,000-year-old metallurgical technique traced back to Mohenjo-daro. Each beeswax mold is destroyed during casting, making this exact tribal sculpture entirely unique and unrepeatable.',
    imageUrl: '/images/products/metal-sculpting.jpg',
    minPrice: 42000,
    currentBid: 58500,
    bidCount: 11,
    minIncrement: 1500,
    startTime: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() + 32 * 3600 * 1000).toISOString(),
    durationHours: 56,
    status: 'active',
    sellerEmail: 'sukhdev.baghel@viraasat.in',
    createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
    bids: [
      { id: 'b5', auctionId: 'auction-dhokra-shaman', bidderName: 'Devika Singhania Arts', bidderRole: 'collector', amount: 42000, timestamp: '1 day ago' },
      { id: 'b6', auctionId: 'auction-dhokra-shaman', bidderName: 'Rohan Mehra Private Gallery', bidderRole: 'patron', amount: 50000, timestamp: '18 hours ago' },
      { id: 'b7', auctionId: 'auction-dhokra-shaman', bidderName: 'Tribal Arts Foundation Zurich', bidderRole: 'institution', amount: 58500, timestamp: '4 hours ago' },
    ]
  },
  {
    id: 'auction-kani-shawl',
    title: 'Hand-Spun Pashmina Kani Jamawar Heirloom Shawl (3-Year Weave)',
    artisanName: 'Ghulam Nabi Dar (Master Weaver)',
    artisanRegion: 'Srinagar, Jammu & Kashmir',
    craftCategory: 'Kashmiri Kani Handloom Pashmina',
    giTagCertified: true,
    provenanceHash: '0xda21095bf8c1...33a7',
    description: 'Woven with wooden needle-spools (kanis) incorporating over 1,200 interlocking color changes per square foot. Made from pure Changthangi mountain goat fleece with an intricate all-over floral jaal pattern.',
    imageUrl: '/images/products/clean/kashmiri-kani-pashmina-shawl.jpg',
    minPrice: 195000,
    currentBid: 245000,
    bidCount: 24,
    minIncrement: 5000,
    startTime: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() + 96 * 3600 * 1000).toISOString(),
    durationHours: 168,
    status: 'active',
    sellerEmail: 'ghulam.nabi@viraasat.in',
    createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
    bids: [
      { id: 'b8', auctionId: 'auction-kani-shawl', bidderName: 'Royal Textile Antiquities', bidderRole: 'institution', amount: 195000, timestamp: '3 days ago' },
      { id: 'b9', auctionId: 'auction-kani-shawl', bidderName: 'Karanvir Oberoi Collection', bidderRole: 'collector', amount: 220000, timestamp: '1 day ago' },
      { id: 'b10', auctionId: 'auction-kani-shawl', bidderName: 'Geneva Decorative Guild', bidderRole: 'collector', amount: 245000, timestamp: '1 hour ago' },
    ]
  },
  {
    id: 'auction-blue-pottery-urn',
    title: 'Masterpiece 36-Inch Turquoise Quartz Blue Pottery Palace Urn',
    artisanName: 'Gopal Saini (Shilp Guru)',
    artisanRegion: 'Jaipur, Rajasthan',
    craftCategory: 'Jaipur GI Blue Pottery',
    giTagCertified: true,
    provenanceHash: '0x992b10cae741...11fb',
    description: 'Formed completely without clay using ground Egyptian quartz stone, Fuller’s earth, and natural copper oxide pigments. Fired at low temperature to achieve its signature luminous turquoise glaze.',
    imageUrl: '/images/products/clean/jaipur-blue-pottery-urn.jpg',
    minPrice: 65000,
    currentBid: 78000,
    bidCount: 8,
    minIncrement: 2000,
    startTime: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    endTime: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
    durationHours: 60,
    status: 'active',
    sellerEmail: 'gopal.saini@viraasat.in',
    createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString(),
    bids: [
      { id: 'b11', auctionId: 'auction-blue-pottery-urn', bidderName: 'Rajputana Heritage Trust', bidderRole: 'institution', amount: 65000, timestamp: '10 hours ago' },
      { id: 'b12', auctionId: 'auction-blue-pottery-urn', bidderName: 'Aanya Kapoor Gallery', bidderRole: 'patron', amount: 78000, timestamp: '3 hours ago' },
    ]
  }
];

export function UniqueArtAuctionSection({ id = 'unique-art-auctions' }: { id?: string }) {
  const { toast } = useToast();
  const { t } = useTranslation();

  // State
  const [auctions, setAuctions] = useState<UniqueArtAuction[]>(SEED_AUCTIONS);
  const [activeFilter, setActiveFilter] = useState<'all' | 'reserve-met' | 'ending-soon'>('all');
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Modal States
  const [createAuctionOpen, setCreateAuctionOpen] = useState(false);
  const [selectedAuction, setSelectedAuction] = useState<UniqueArtAuction | null>(null);
  const [bidModalOpen, setBidModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);

  // Bidding form state
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [bidderName, setBidderName] = useState<string>('');

  // Seller Creation Form State
  const [sellerForm, setSellerForm] = useState({
    title: '',
    artisanName: '',
    artisanRegion: 'Varanasi, Uttar Pradesh',
    craftCategory: 'Banarasi Brocade & Silk Weaving',
    minPrice: 50000,
    durationHours: 72, // Default 3 days
    minIncrement: 1000,
    description: '',
    imageUrl: '/images/products/banarasi-silk.jpg',
    giTagCertified: true,
  });

  // Ticker for live auction timers
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync with LocalStorage if present
  useEffect(() => {
    try {
      const saved = localStorage.getItem('viraasat_unique_art_auctions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setAuctions(parsed);
        }
      }
    } catch (e) {
      console.warn('Could not read saved auctions', e);
    }
  }, []);

  const saveAuctions = (updated: UniqueArtAuction[]) => {
    setAuctions(updated);
    try {
      localStorage.setItem('viraasat_unique_art_auctions', JSON.stringify(updated));
    } catch (e) {
      console.warn('Could not save auctions to localStorage', e);
    }
  };

  // Time remaining calculator
  const formatTimeRemaining = (endTimeStr: string) => {
    const diff = new Date(endTimeStr).getTime() - currentTime;
    if (diff <= 0) return { expired: true, text: 'Auction Concluded' };

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    const pad = (n: number) => n.toString().padStart(2, '0');
    return {
      expired: false,
      text: `${days > 0 ? `${days}d ` : ''}${pad(hours)}h : ${pad(minutes)}m : ${pad(seconds)}s`,
      isUrgent: diff < 24 * 3600 * 1000, // Less than 24 hours
    };
  };

  // Filtered auctions
  const displayedAuctions = useMemo(() => {
    return auctions.filter((auc) => {
      if (activeFilter === 'reserve-met') {
        return auc.currentBid >= auc.minPrice;
      }
      if (activeFilter === 'ending-soon') {
        const diff = new Date(auc.endTime).getTime() - currentTime;
        return diff > 0 && diff < 36 * 3600 * 1000;
      }
      return true;
    });
  }, [auctions, activeFilter, currentTime]);

  // Handle Seller Auction Creation
  const handleCreateAuction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellerForm.title.trim()) {
      toast({ title: 'Validation Error', description: 'Please enter a title for your unique artifact.' });
      return;
    }
    if (sellerForm.minPrice <= 0) {
      toast({ title: 'Invalid Minimum Price', description: 'Minimum reserve price must be at least ₹1,000.' });
      return;
    }
    if (sellerForm.durationHours <= 0) {
      toast({ title: 'Invalid Auction Period', description: 'Auction period must be at least 1 hour.' });
      return;
    }

    const now = new Date();
    const endTime = new Date(now.getTime() + sellerForm.durationHours * 3600 * 1000);

    const newAuction: UniqueArtAuction = {
      id: `auction-${Date.now()}`,
      title: sellerForm.title.trim(),
      artisanName: sellerForm.artisanName.trim() || 'Master Artisan Guild',
      artisanRegion: sellerForm.artisanRegion,
      craftCategory: sellerForm.craftCategory,
      giTagCertified: sellerForm.giTagCertified,
      provenanceHash: `0x${Math.random().toString(16).substring(2, 10)}${Math.random().toString(16).substring(2, 6)}...sha256`,
      description: sellerForm.description.trim() || 'One-of-a-kind handcrafted heritage masterpiece certified under the Viraasat provenance registry.',
      imageUrl: sellerForm.imageUrl,
      minPrice: Number(sellerForm.minPrice),
      currentBid: Number(sellerForm.minPrice),
      bidCount: 1,
      minIncrement: Number(sellerForm.minIncrement) || 1000,
      startTime: now.toISOString(),
      endTime: endTime.toISOString(),
      durationHours: Number(sellerForm.durationHours),
      status: 'active',
      createdAt: now.toISOString(),
      bids: [
        {
          id: `bid-initial-${Date.now()}`,
          auctionId: `auction-${Date.now()}`,
          bidderName: 'Initial Opening Reserve',
          bidderRole: 'patron',
          amount: Number(sellerForm.minPrice),
          timestamp: 'Just now',
        }
      ]
    };

    const updated = [newAuction, ...auctions];
    saveAuctions(updated);
    setCreateAuctionOpen(false);

    toast({
      title: '🏛️ Unique Art Auction Published!',
      description: `"${newAuction.title}" is now live with reserve ₹${newAuction.minPrice.toLocaleString('en-IN')} for ${newAuction.durationHours} hours.`,
    });

    // Reset form
    setSellerForm({
      title: '',
      artisanName: '',
      artisanRegion: 'Varanasi, Uttar Pradesh',
      craftCategory: 'Banarasi Brocade & Silk Weaving',
      minPrice: 50000,
      durationHours: 72,
      minIncrement: 1000,
      description: '',
      imageUrl: '/images/products/banarasi-silk.jpg',
      giTagCertified: true,
    });
  };

  // Open Bid Modal
  const openBidModal = (auction: UniqueArtAuction) => {
    setSelectedAuction(auction);
    setBidAmount(auction.currentBid + auction.minIncrement);
    setBidModalOpen(true);
  };

  // Submit Bid
  const handlePlaceBid = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAuction) return;

    const minimumAllowed = selectedAuction.currentBid + selectedAuction.minIncrement;
    if (bidAmount < minimumAllowed) {
      toast({
        title: 'Bid Below Minimum Increment',
        description: `Your bid must be at least ₹${minimumAllowed.toLocaleString('en-IN')}.`,
      });
      return;
    }

    const newBid: Bid = {
      id: `bid-${Date.now()}`,
      auctionId: selectedAuction.id,
      bidderName: bidderName.trim() || 'Verified Connoisseur Patron',
      bidderRole: 'collector',
      amount: bidAmount,
      timestamp: 'Just now',
    };

    const updatedAuctions = auctions.map((auc) => {
      if (auc.id === selectedAuction.id) {
        return {
          ...auc,
          currentBid: bidAmount,
          bidCount: auc.bidCount + 1,
          bids: [newBid, ...auc.bids],
        };
      }
      return auc;
    });

    saveAuctions(updatedAuctions);
    setBidModalOpen(false);

    toast({
      title: '🔨 Bid Placed Successfully!',
      description: `You are now the leading bidder at ₹${bidAmount.toLocaleString('en-IN')} on "${selectedAuction.title}".`,
    });
  };

  return (
    <section
      id={id}
      aria-label="Unique Art Auctions"
      className="py-20 md:py-28 bg-[#F3EDE2]/40 border-b border-[#E8DCCB] relative overflow-hidden"
    >
      {/* Decorative Heritage Motif Background */}
      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#C59B4B] to-transparent opacity-80" />
      <div className="absolute inset-0 opacity-[0.02] clay-texture pointer-events-none" />

      <div className="max-w-[1680px] w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-12 xl:px-16 2xl:px-20 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#701D24]/10 border border-[#701D24]/20 text-[#701D24] text-xs font-semibold uppercase tracking-widest mb-3">
              <Gavel className="w-3.5 h-3.5 text-[#C59B4B]" />
              <span>Live Royal Auctions</span>
              <span className="w-2 h-2 rounded-full bg-red-600 animate-ping inline-block" />
            </div>
            <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#221C18] tracking-tight">
              Unique Art & Heirloom Auctions
            </h2>
            <p className="text-sm sm:text-base text-[#5E2C18]/80 mt-2 max-w-2xl font-sans">
              Acquire one-of-a-kind national treasures direct from master creators. Artisans set their minimum reserve price
              and auction period; connoisseurs compete with transparent on-chain provenance.
            </p>
          </div>

          {/* Action CTAs: List Artwork & Filter Chips */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Seller "Auction Your Product" Button */}
            <Button
              type="button"
              onClick={() => setCreateAuctionOpen(true)}
              className="bg-[#701D24] hover:bg-[#8C2B2B] text-[#FAF7F2] font-semibold text-xs uppercase tracking-wider px-6 py-6 rounded-full shadow-lg transition-all duration-300 flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4 text-[#C59B4B]" />
              <span>Auction Your Unique Art</span>
            </Button>

            {/* Filter Toggle Buttons */}
            <div className="inline-flex rounded-full p-1 bg-[#FAF7F2] border border-[#E8DCCB] text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveFilter('all')}
                className={cn(
                  'px-3.5 py-1.5 rounded-full transition-all cursor-pointer',
                  activeFilter === 'all'
                    ? 'bg-[#5E2C18] text-[#FAF7F2] shadow-sm font-semibold'
                    : 'text-[#5E2C18] hover:text-[#221C18]'
                )}
              >
                All ({auctions.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('reserve-met')}
                className={cn(
                  'px-3.5 py-1.5 rounded-full transition-all cursor-pointer',
                  activeFilter === 'reserve-met'
                    ? 'bg-[#5E2C18] text-[#FAF7F2] shadow-sm font-semibold'
                    : 'text-[#5E2C18] hover:text-[#221C18]'
                )}
              >
                Reserve Met
              </button>
              <button
                type="button"
                onClick={() => setActiveFilter('ending-soon')}
                className={cn(
                  'px-3.5 py-1.5 rounded-full transition-all cursor-pointer flex items-center gap-1',
                  activeFilter === 'ending-soon'
                    ? 'bg-[#5E2C18] text-[#FAF7F2] shadow-sm font-semibold'
                    : 'text-[#5E2C18] hover:text-[#221C18]'
                )}
              >
                <Flame className="w-3 h-3 text-[#C59B4B]" /> Ending Soon
              </button>
            </div>
          </div>
        </div>

        {/* Auctions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {displayedAuctions.map((auction) => {
            const timeInfo = formatTimeRemaining(auction.endTime);
            const isReserveMet = auction.currentBid >= auction.minPrice;

            return (
              <div
                key={auction.id}
                className="bg-white rounded-2xl overflow-hidden border border-[#E8DCCB] shadow-sm hover:border-[#C59B4B] hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group relative"
              >
                <div>
                  {/* Image Container with Badges */}
                  <div className="aspect-[4/3] relative bg-[#FAF7F2] overflow-hidden">
                    <Image
                      src={auction.imageUrl}
                      alt={auction.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 25vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />

                    {/* Live Ticker Floating Pill */}
                    <div className="absolute top-3 left-3 bg-[#221C18]/90 backdrop-blur-md text-[#FAF7F2] px-3 py-1 rounded-full text-xs font-mono flex items-center gap-1.5 border border-white/20 shadow">
                      <Clock className={cn('w-3.5 h-3.5', timeInfo.isUrgent ? 'text-red-400 animate-pulse' : 'text-[#C59B4B]')} />
                      <span className={cn(timeInfo.isUrgent ? 'text-red-300 font-bold' : 'text-stone-200')}>
                        {timeInfo.text}
                      </span>
                    </div>

                    {/* GI Tag Certified Pill */}
                    {auction.giTagCertified && (
                      <div className="absolute top-3 right-3 bg-[#701D24]/90 backdrop-blur-md text-[#FAF7F2] px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 shadow">
                        <ShieldCheck className="w-3 h-3 text-[#C59B4B]" />
                        <span>GI Tag</span>
                      </div>
                    )}

                    {/* Reserve Status Indicator Bottom Bar */}
                    <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 pt-6 flex items-center justify-between text-[11px] text-[#FAF7F2]">
                      <span className="font-mono text-stone-300">
                        {auction.bidCount} bids placed
                      </span>
                      {isReserveMet ? (
                        <span className="bg-emerald-800/90 text-emerald-100 px-2 py-0.5 rounded text-[10px] font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Reserve Met
                        </span>
                      ) : (
                        <span className="bg-amber-800/90 text-amber-100 px-2 py-0.5 rounded text-[10px] font-semibold">
                          Reserve ₹{auction.minPrice.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 sm:p-6 space-y-3">
                    <div className="text-[11px] uppercase tracking-wider text-[#701D24] font-semibold flex items-center justify-between">
                      <span>{auction.craftCategory}</span>
                      <span className="text-stone-500 font-normal">{auction.durationHours}h Period</span>
                    </div>

                    <h3 className="font-serif text-lg font-bold text-[#221C18] line-clamp-2 group-hover:text-[#701D24] transition-colors leading-snug">
                      {auction.title}
                    </h3>

                    <div className="text-xs text-[#5E2C18] font-medium">
                      By {auction.artisanName} • <span className="text-stone-500">{auction.artisanRegion}</span>
                    </div>

                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed">
                      {auction.description}
                    </p>
                  </div>
                </div>

                {/* Footer Pricing & Bid Action */}
                <div className="p-5 sm:p-6 pt-0 mt-auto">
                  <div className="bg-[#FAF7F2] p-4 rounded-xl border border-[#E8DCCB] mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] uppercase tracking-wider text-stone-500 font-bold">
                        Current Highest Bid
                      </div>
                      <div className="font-serif text-xl sm:text-2xl font-bold text-[#701D24]">
                        ₹{auction.currentBid.toLocaleString('en-IN')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] uppercase tracking-wider text-stone-500">
                        Min. Reserve Price
                      </div>
                      <div className="text-xs font-mono text-stone-700 font-semibold">
                        ₹{auction.minPrice.toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      onClick={() => openBidModal(auction)}
                      className="flex-1 bg-[#C59B4B] hover:bg-[#E8CA82] text-[#221C18] font-bold text-xs uppercase tracking-wider py-5 rounded-xl transition-all shadow cursor-pointer"
                    >
                      <Gavel className="w-3.5 h-3.5 mr-1.5" /> Place Bid
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        setSelectedAuction(auction);
                        setHistoryModalOpen(true);
                      }}
                      className="h-11 w-11 rounded-xl border-[#E8DCCB] text-stone-700 hover:text-[#701D24] hover:bg-[#FAF7F2]"
                      title="View Bid Ledger"
                      aria-label="View Bid Ledger"
                    >
                      <History className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= MODAL 1: SELLER CREATE AUCTION ================= */}
      <Dialog open={createAuctionOpen} onOpenChange={setCreateAuctionOpen}>
        <DialogContent className="max-w-2xl bg-[#FAF7F2] border-2 border-[#C59B4B] rounded-3xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
          <DialogHeader className="text-left space-y-1 mb-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#701D24]/10 text-[#701D24] text-xs font-semibold uppercase tracking-wider w-fit">
              <Gavel className="w-3.5 h-3.5 text-[#C59B4B]" />
              <span>Artisan Portal • Launch Auction</span>
            </div>
            <DialogTitle className="font-serif text-2xl sm:text-3xl text-[#221C18]">
              Auction Your Unique Indian Heirloom
            </DialogTitle>
            <DialogDescription className="text-xs sm:text-sm text-[#5E2C18]/80 font-sans">
              Set your minimum reserve price and auction period. Your piece will be featured on the national
              Viraasat Heritage Live Bidding Floor with full cryptographic provenance.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateAuction} className="space-y-4">
            <div>
              <label htmlFor="auction-title" className="text-xs font-bold uppercase tracking-wider text-[#5E2C18] block mb-1">
                Unique Artwork / Artifact Title *
              </label>
              <Input
                id="auction-title"
                required
                value={sellerForm.title}
                onChange={(e) => setSellerForm({ ...sellerForm, title: e.target.value })}
                placeholder="e.g. Master Banarasi Pure Zari Saree (c. 1982 Vintage)"
                className="bg-white border-[#E8DCCB] focus:border-[#C59B4B] rounded-xl text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="artisan-name" className="text-xs font-bold uppercase tracking-wider text-[#5E2C18] block mb-1">
                  Master Artisan / Workshop Name
                </label>
                <Input
                  id="artisan-name"
                  value={sellerForm.artisanName}
                  onChange={(e) => setSellerForm({ ...sellerForm, artisanName: e.target.value })}
                  placeholder="e.g. Ustad Ghulam Rasool"
                  className="bg-white border-[#E8DCCB] focus:border-[#C59B4B] rounded-xl text-sm"
                />
              </div>

              <div>
                <label htmlFor="artisan-region" className="text-xs font-bold uppercase tracking-wider text-[#5E2C18] block mb-1">
                  Craft Region / State
                </label>
                <Input
                  id="artisan-region"
                  value={sellerForm.artisanRegion}
                  onChange={(e) => setSellerForm({ ...sellerForm, artisanRegion: e.target.value })}
                  placeholder="e.g. Varanasi, Uttar Pradesh"
                  className="bg-white border-[#E8DCCB] focus:border-[#C59B4B] rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* MINIMUM RESERVE PRICE (EXPLICIT USER REQUIREMENT) */}
              <div className="bg-white p-4 rounded-2xl border-2 border-[#C59B4B]/60 shadow-sm">
                <label htmlFor="min-price" className="text-xs font-bold uppercase tracking-wider text-[#701D24] flex items-center justify-between mb-1">
                  <span>Minimum Reserve Price (₹) *</span>
                  <Award className="w-4 h-4 text-[#C59B4B]" />
                </label>
                <div className="relative mt-1">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-serif font-bold text-base">₹</span>
                  <Input
                    id="min-price"
                    type="number"
                    min="1000"
                    step="500"
                    required
                    value={sellerForm.minPrice}
                    onChange={(e) => setSellerForm({ ...sellerForm, minPrice: Number(e.target.value) })}
                    className="pl-8 bg-[#FAF7F2] border-[#E8DCCB] focus:border-[#701D24] rounded-xl text-base font-bold text-[#701D24]"
                  />
                </div>
                <p className="text-[10px] text-stone-500 mt-1">
                  The floor price below which the artifact will not be sold.
                </p>
              </div>

              {/* AUCTION PERIOD / DURATION (EXPLICIT USER REQUIREMENT) */}
              <div className="bg-white p-4 rounded-2xl border-2 border-[#C59B4B]/60 shadow-sm">
                <label htmlFor="duration-select" className="text-xs font-bold uppercase tracking-wider text-[#701D24] flex items-center justify-between mb-1">
                  <span>Auction Period / Duration *</span>
                  <Clock className="w-4 h-4 text-[#C59B4B]" />
                </label>
                <select
                  id="duration-select"
                  value={sellerForm.durationHours}
                  onChange={(e) => setSellerForm({ ...sellerForm, durationHours: Number(e.target.value) })}
                  className="w-full mt-1 bg-[#FAF7F2] border border-[#E8DCCB] focus:border-[#701D24] rounded-xl p-2.5 text-sm font-semibold text-[#5E2C18] focus:outline-none"
                >
                  <option value={24}>24 Hours (Flash Guild Auction)</option>
                  <option value={48}>48 Hours (2 Days)</option>
                  <option value={72}>72 Hours (3 Days Standard)</option>
                  <option value={120}>120 Hours (5 Days)</option>
                  <option value={168}>168 Hours (7 Days - Curator&rsquo;s Week)</option>
                  <option value={336}>336 Hours (14 Days - Royal Exhibition)</option>
                </select>
                <p className="text-[10px] text-stone-500 mt-1">
                  Live bidding automatically ends at the close of this period.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="craft-category" className="text-xs font-bold uppercase tracking-wider text-[#5E2C18] block mb-1">
                  Craft Genre
                </label>
                <select
                  id="craft-category"
                  value={sellerForm.craftCategory}
                  onChange={(e) => setSellerForm({ ...sellerForm, craftCategory: e.target.value })}
                  className="w-full bg-white border border-[#E8DCCB] focus:border-[#C59B4B] rounded-xl p-2.5 text-xs font-medium text-stone-700"
                >
                  <option value="Banarasi Brocade & Silk Weaving">Banarasi Brocade & Silk Weaving</option>
                  <option value="Zardozi & Gold Metallic Embroidery">Zardozi & Gold Metallic Embroidery</option>
                  <option value="Dhokra Non-Ferrous Lost-Wax Metal Casting">Dhokra Lost-Wax Bronze</option>
                  <option value="Kashmiri Kani Handloom Pashmina">Kashmiri Kani Pashmina</option>
                  <option value="Jaipur GI Blue Pottery">Jaipur GI Blue Pottery</option>
                  <option value="Mithila Madhubani Hand Painting">Mithila Madhubani Painting</option>
                  <option value="Bidriware Silver Inlay Metalwork">Bidriware Silver Inlay</option>
                  <option value="Tanjore 22K Gold Foil Painting">Tanjore 22K Gold Foil</option>
                  <option value="Agra Pietra Dura Marble Inlay">Agra Pietra Dura Marble Inlay</option>
                </select>
              </div>

              <div>
                <label htmlFor="min-increment" className="text-xs font-bold uppercase tracking-wider text-[#5E2C18] block mb-1">
                  Minimum Bid Step Up (₹)
                </label>
                <select
                  id="min-increment"
                  value={sellerForm.minIncrement}
                  onChange={(e) => setSellerForm({ ...sellerForm, minIncrement: Number(e.target.value) })}
                  className="w-full bg-white border border-[#E8DCCB] focus:border-[#C59B4B] rounded-xl p-2.5 text-xs font-medium text-stone-700"
                >
                  <option value={500}>+₹500 per bid</option>
                  <option value={1000}>+₹1,000 per bid</option>
                  <option value={2500}>+₹2,500 per bid</option>
                  <option value={5000}>+₹5,000 per bid</option>
                  <option value={10000}>+₹10,000 per bid</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="artifact-description" className="text-xs font-bold uppercase tracking-wider text-[#5E2C18] block mb-1">
                Heritage Story & Technique Description
              </label>
              <Textarea
                id="artifact-description"
                rows={3}
                value={sellerForm.description}
                onChange={(e) => setSellerForm({ ...sellerForm, description: e.target.value })}
                placeholder="Describe the hours invested, natural dyes, heirloom motifs, and ancestral significance..."
                className="bg-white border-[#E8DCCB] focus:border-[#C59B4B] rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-[#E8DCCB]">
              <input
                type="checkbox"
                id="giCertified"
                checked={sellerForm.giTagCertified}
                onChange={(e) => setSellerForm({ ...sellerForm, giTagCertified: e.target.checked })}
                className="rounded border-[#C59B4B] text-[#701D24] focus:ring-[#701D24] h-4 w-4"
              />
              <label htmlFor="giCertified" className="text-xs text-[#5E2C18] font-medium cursor-pointer">
                <strong>Certified GI Craft Heritage:</strong> Link to Government of India Geographical Indication registry and anchor on Viraasat SHA-256 Provenance Ledger.
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#E8DCCB]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateAuctionOpen(false)}
                className="rounded-full text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#701D24] hover:bg-[#8C2B2B] text-[#FAF7F2] font-semibold text-xs uppercase tracking-wider px-6 py-2.5 rounded-full shadow cursor-pointer"
              >
                Publish Live Auction
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ================= MODAL 2: PLACE A BID ================= */}
      <Dialog open={bidModalOpen} onOpenChange={setBidModalOpen}>
        <DialogContent className="max-w-md bg-[#FAF7F2] border-2 border-[#C59B4B] rounded-3xl p-6">
          {selectedAuction && (
            <div>
              <DialogHeader className="text-left space-y-1 mb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#701D24]/10 text-[#701D24] text-[11px] font-bold uppercase tracking-wider w-fit">
                  <Gavel className="w-3.5 h-3.5 text-[#C59B4B]" />
                  <span>Place Competing Bid</span>
                </div>
                <DialogTitle className="font-serif text-xl sm:text-2xl text-[#221C18]">
                  {selectedAuction.title}
                </DialogTitle>
                <div className="text-xs text-stone-600">
                  By {selectedAuction.artisanName} • {selectedAuction.artisanRegion}
                </div>
              </DialogHeader>

              <div className="bg-white p-4 rounded-2xl border border-[#E8DCCB] mb-5 space-y-2">
                <div className="flex items-center justify-between text-xs text-stone-500">
                  <span>Current Highest Bid</span>
                  <span className="font-mono">{selectedAuction.bidCount} bids</span>
                </div>
                <div className="font-serif text-2xl font-bold text-[#701D24]">
                  ₹{selectedAuction.currentBid.toLocaleString('en-IN')}
                </div>
                <div className="text-[11px] text-stone-600 flex items-center justify-between pt-2 border-t border-stone-100">
                  <span>Minimum Required Next Bid:</span>
                  <span className="font-bold text-[#5E2C18]">
                    ₹{(selectedAuction.currentBid + selectedAuction.minIncrement).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              <form onSubmit={handlePlaceBid} className="space-y-4">
                <div>
                  <label htmlFor="bidder-name" className="text-xs font-bold uppercase tracking-wider text-[#5E2C18] block mb-1">
                    Your Name / Collector Handle
                  </label>
                  <Input
                    id="bidder-name"
                    value={bidderName}
                    onChange={(e) => setBidderName(e.target.value)}
                    placeholder="e.g. Royal Heritage Collector"
                    className="bg-white border-[#E8DCCB] rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="bid-amount" className="text-xs font-bold uppercase tracking-wider text-[#5E2C18] block mb-1">
                    Your Bid Amount (₹)
                  </label>
                  <Input
                    id="bid-amount"
                    type="number"
                    min={selectedAuction.currentBid + selectedAuction.minIncrement}
                    step={selectedAuction.minIncrement}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(Number(e.target.value))}
                    className="bg-white border-[#E8DCCB] font-bold text-lg text-[#701D24] rounded-xl"
                  />
                </div>

                {/* Quick Increment Buttons */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-stone-500 block mb-1.5">
                    Quick Step Up:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[selectedAuction.minIncrement, selectedAuction.minIncrement * 2, selectedAuction.minIncrement * 5].map((inc) => (
                      <button
                        key={inc}
                        type="button"
                        onClick={() => setBidAmount(selectedAuction.currentBid + inc)}
                        className="px-3 py-1.5 text-xs bg-white border border-[#E8DCCB] hover:border-[#C59B4B] rounded-lg font-medium text-[#5E2C18] cursor-pointer"
                      >
                        +₹{inc.toLocaleString('en-IN')}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setBidModalOpen(false)}
                    className="rounded-full text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#C59B4B] hover:bg-[#E8CA82] text-[#221C18] font-bold text-xs uppercase tracking-wider px-6 py-2.5 rounded-full shadow cursor-pointer"
                  >
                    Confirm & Place Bid
                  </Button>
                </div>
              </form>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ================= MODAL 3: BID HISTORY LEDGER ================= */}
      <Dialog open={historyModalOpen} onOpenChange={setHistoryModalOpen}>
        <DialogContent className="max-w-md bg-[#FAF7F2] border-2 border-[#C59B4B] rounded-3xl p-6">
          {selectedAuction && (
            <div>
              <DialogHeader className="text-left space-y-1 mb-4">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#701D24]/10 text-[#701D24] text-[11px] font-bold uppercase tracking-wider w-fit">
                  <History className="w-3.5 h-3.5 text-[#C59B4B]" />
                  <span>Transparent Provenance Ledger</span>
                </div>
                <DialogTitle className="font-serif text-xl sm:text-2xl text-[#221C18]">
                  Bid History Ledger
                </DialogTitle>
                <div className="text-xs text-stone-600 line-clamp-1">
                  {selectedAuction.title}
                </div>
              </DialogHeader>

              <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1">
                {selectedAuction.bids.map((b, idx) => (
                  <div
                    key={b.id || idx}
                    className={cn(
                      'p-3 rounded-xl border flex items-center justify-between',
                      idx === 0
                        ? 'bg-white border-[#C59B4B] shadow-sm'
                        : 'bg-white/60 border-stone-200 text-stone-600'
                    )}
                  >
                    <div>
                      <div className="text-xs font-bold text-[#221C18] flex items-center gap-1.5">
                        {b.bidderName}
                        {idx === 0 && (
                          <span className="text-[9px] bg-[#701D24] text-white px-1.5 py-0.2 rounded uppercase font-bold">
                            Leader
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-stone-400 font-mono mt-0.5">
                        {b.timestamp}
                      </div>
                    </div>
                    <div className="font-serif text-base font-bold text-[#701D24]">
                      ₹{b.amount.toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 pt-3 border-t border-[#E8DCCB] flex items-center justify-between text-xs text-stone-500 font-mono">
                <span>SHA-256 Ledger: {selectedAuction.provenanceHash}</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setHistoryModalOpen(false)}
                  className="rounded-full text-xs"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

export default UniqueArtAuctionSection;
