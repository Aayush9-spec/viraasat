'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import {
  Star,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Filter,
  Send,
  Sparkles,
  TrendingUp,
  Package,
  Clock,
  Edit2,
  ExternalLink,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/core/hooks/use-toast';
import { ReviewService } from '@/features/reviews/review-service';
import { ProductService } from '@/features/marketplace/product-service';
import type { ProductReview } from '@/types/review';
import type { Product } from '@/lib/types';

export default function ArtisanReviewsDashboardPage() {
  const { user } = useUser();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stats, setStats] = useState({
    totalReviews: 0,
    averageRating: 5.0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } as Record<number, number>,
    pendingRepliesCount: 0,
    responseRate: 100,
  });

  // Filter & Search States
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [responseFilter, setResponseFilter] = useState<'all' | 'pending' | 'replied'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'highest' | 'lowest'>('recent');

  // Active Reply States
  const [replyTextMap, setReplyTextMap] = useState<Record<string, string>>({});
  const [submittingReplyId, setSubmittingReplyId] = useState<string | null>(null);
  const [editingReplyId, setEditingReplyId] = useState<string | null>(null);

  const artisanId = user?.id || 'artisan-1';

  // Load Reviews & Products
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [artisanRevRes, allProds] = await Promise.all([
        ReviewService.getArtisanReviews(artisanId, {
          productId: selectedProductId === 'all' ? undefined : selectedProductId,
          filterRating: filterRating || undefined,
          needsResponseOnly: responseFilter === 'pending',
          sortBy,
        }),
        ProductService.getAllProducts(),
      ]);

      setReviews(artisanRevRes.reviews);
      setStats({
        totalReviews: artisanRevRes.totalReviews,
        averageRating: artisanRevRes.averageRating,
        distribution: artisanRevRes.distribution,
        pendingRepliesCount: artisanRevRes.pendingRepliesCount,
        responseRate: artisanRevRes.responseRate,
      });

      // Filter products belonging to this artisan or relevant crafts
      const owned = allProds.filter(
        (p) => p && (p.artisanId === artisanId || artisanId === 'artisan-1' || artisanId.startsWith('user_'))
      );
      setProducts(owned);
    } catch (err) {
      console.error('Failed to load artisan reviews:', err);
    } finally {
      setLoading(false);
    }
  }, [artisanId, selectedProductId, filterRating, responseFilter, sortBy]);

  useEffect(() => {
    void loadData();

    // Listen for real-time review updates
    const handleUpdate = () => void loadData();
    window.addEventListener('viraasat_review_created', handleUpdate);
    window.addEventListener('viraasat_review_updated', handleUpdate);

    return () => {
      window.removeEventListener('viraasat_review_created', handleUpdate);
      window.removeEventListener('viraasat_review_updated', handleUpdate);
    };
  }, [loadData]);

  // Submit Artisan Reply
  const handleReplySubmit = async (reviewId: string) => {
    const text = (replyTextMap[reviewId] || '').trim();
    if (!text || text.length < 3) {
      toast({
        variant: 'destructive',
        title: 'Reply too short',
        description: 'Please write at least 3 characters in your official response.',
      });
      return;
    }

    setSubmittingReplyId(reviewId);

    try {
      const res = await ReviewService.submitArtisanResponse(
        { reviewId, response: text },
        {
          id: user?.id || 'artisan-1',
          name: user?.fullName || user?.username || 'Master Artisan Guild',
          role: 'artisan',
        }
      );

      if (res.success) {
        toast({
          title: '💬 Artisan Reply Published!',
          description: 'Your response is now displayed on the product page and the customer has been notified.',
        });

        setEditingReplyId(null);
        setReplyTextMap((prev) => ({ ...prev, [reviewId]: '' }));
        await loadData();
      } else {
        toast({
          variant: 'destructive',
          title: 'Reply Failed',
          description: res.error || 'Could not submit response.',
        });
      }
    } catch (e: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: e.message || 'Failed to submit response.',
      });
    } finally {
      setSubmittingReplyId(null);
    }
  };

  const renderStars = (rating: number) =>
    [1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`w-3.5 h-3.5 ${
          star <= Math.round(rating) ? 'fill-amber-500 text-amber-500' : 'fill-stone-200 text-stone-200'
        }`}
      />
    ));

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#701D24]/10 text-[#701D24] text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-[#C59B4B]" />
            <span>Direct Artisan Feedback System</span>
          </div>
          <h1 className="font-serif text-3xl font-bold text-[#221C18]">
            Reviews &amp; Collector Feedback
          </h1>
          <p className="text-sm text-[#655B53] mt-1">
            Review feedback from verified connoisseurs, monitor product ratings, and submit official artisan replies.
          </p>
        </div>

        <Button asChild variant="outline" className="border-[#E8DCCB] text-xs font-semibold rounded-xl">
          <Link href="/shop" target="_blank" className="flex items-center gap-2">
            <span>View Public Marketplace</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </Button>
      </div>

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Reviews */}
        <Card className="border-[#E8DCCB] shadow-xs bg-white rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-[#655B53]">
                Total Reviews
              </p>
              <h3 className="font-serif text-3xl font-bold text-[#221C18] mt-1">
                {stats.totalReviews}
              </h3>
              <p className="text-[11px] text-emerald-800 font-medium mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Across all artisan crafts</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] border border-[#E8DCCB] flex items-center justify-center text-[#701D24]">
              <MessageSquare className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Average Rating */}
        <Card className="border-[#E8DCCB] shadow-xs bg-white rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-[#655B53]">
                Artisan Quality Score
              </p>
              <div className="flex items-baseline gap-1.5 mt-1">
                <h3 className="font-serif text-3xl font-bold text-[#701D24]">
                  {stats.averageRating.toFixed(1)}
                </h3>
                <span className="text-xs text-[#655B53]">/ 5.0</span>
              </div>
              <div className="flex items-center gap-0.5 mt-1">
                {renderStars(stats.averageRating)}
              </div>
            </div>
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <Star className="w-6 h-6 fill-amber-500 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Response Rate */}
        <Card className="border-[#E8DCCB] shadow-xs bg-white rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-[#655B53]">
                Artisan Response Rate
              </p>
              <h3 className="font-serif text-3xl font-bold text-[#221C18] mt-1">
                {stats.responseRate}%
              </h3>
              <p className="text-[11px] text-[#655B53] mt-1">
                Builds direct collector trust
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <TrendingUp className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Pending Replies */}
        <Card className="border-[#E8DCCB] shadow-xs bg-white rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-[#655B53]">
                Awaiting Artisan Reply
              </p>
              <h3 className="font-serif text-3xl font-bold text-[#701D24] mt-1">
                {stats.pendingRepliesCount}
              </h3>
              <p className="text-[11px] text-[#655B53] mt-1">
                {stats.pendingRepliesCount === 0 ? 'All caught up!' : 'Requires artisan attention'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-[#FAF7F2] border border-[#E8DCCB] flex items-center justify-center text-[#701D24]">
              <Clock className="w-6 h-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="p-5 bg-white rounded-2xl border border-[#E8DCCB] shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Product Filter */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-xs font-bold uppercase tracking-wider text-[#221C18] flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-[#C59B4B]" /> Filter By:
            </span>

            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="bg-[#FAF7F2] border border-[#E8DCCB] text-xs font-medium text-[#221C18] rounded-xl px-3 py-2 focus:outline-none focus:border-[#C59B4B] cursor-pointer"
            >
              <option value="all">All Artisan Products ({products.length})</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>

            {/* Response Status Filter */}
            <div className="flex items-center gap-1 bg-[#FAF7F2] p-1 rounded-xl border border-[#E8DCCB]">
              <button
                type="button"
                onClick={() => setResponseFilter('all')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  responseFilter === 'all' ? 'bg-[#701D24] text-white shadow-xs' : 'text-[#655B53] hover:text-[#221C18]'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setResponseFilter('pending')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  responseFilter === 'pending'
                    ? 'bg-[#701D24] text-white shadow-xs'
                    : 'text-[#655B53] hover:text-[#221C18]'
                }`}
              >
                Needs Reply ({stats.pendingRepliesCount})
              </button>
              <button
                type="button"
                onClick={() => setResponseFilter('replied')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  responseFilter === 'replied'
                    ? 'bg-[#701D24] text-white shadow-xs'
                    : 'text-[#655B53] hover:text-[#221C18]'
                }`}
              >
                Replied
              </button>
            </div>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-2 text-xs font-medium text-[#655B53]">
            <span>Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#FAF7F2] border border-[#E8DCCB] text-xs font-medium text-[#221C18] rounded-xl px-3 py-1.5 focus:outline-none focus:border-[#C59B4B] cursor-pointer"
            >
              <option value="recent">Most Recent</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
            </select>
          </div>
        </div>

        {/* Rating Pills */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-[#E8DCCB]/60 text-xs">
          <span className="text-[11px] text-[#655B53] font-semibold uppercase">Stars:</span>
          <button
            type="button"
            onClick={() => setFilterRating(null)}
            className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
              filterRating === null ? 'bg-[#701D24] text-white' : 'bg-[#FAF7F2] text-[#221C18] hover:bg-stone-200'
            }`}
          >
            All Stars
          </button>
          {[5, 4, 3, 2, 1].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setFilterRating(filterRating === star ? null : star)}
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors ${
                filterRating === star ? 'bg-[#701D24] text-white' : 'bg-[#FAF7F2] text-[#221C18] hover:bg-stone-200'
              }`}
            >
              {star}★ ({stats.distribution[star] || 0})
            </button>
          ))}
        </div>
      </div>

      {/* REVIEWS LIST */}
      {loading ? (
        <div className="text-center py-20 text-sm text-[#655B53]">
          Loading artisan feedback...
        </div>
      ) : reviews.length === 0 ? (
        <Card className="border-2 border-dashed border-[#E8DCCB] bg-[#FAF7F2] rounded-2xl">
          <CardContent className="py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-[#701D24]/10 text-[#701D24] flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-6 h-6 text-[#C59B4B]" />
            </div>
            <h3 className="font-serif text-xl font-bold text-[#221C18]">
              No Reviews Match Current Filter
            </h3>
            <p className="text-sm text-[#655B53] mt-2 max-w-md mx-auto">
              As customers acquire your handcrafted heirlooms and leave reviews, they will appear here along with instant notifications.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {reviews.map((rev) => {
            const dateStr = new Date(rev.createdAt).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            });
            const hasReply = Boolean(rev.artisanResponse);
            const isEditing = editingReplyId === rev.id;

            return (
              <article
                key={rev.id}
                className="p-6 bg-white rounded-2xl border border-[#E8DCCB] shadow-xs space-y-4 hover:border-[#C59B4B]/50 transition-colors"
              >
                {/* Product Badge Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E8DCCB]/70">
                  <div className="flex items-center gap-3">
                    {rev.productImage && (
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-[#E8DCCB] shrink-0">
                        <Image src={rev.productImage} alt={rev.productName || 'Product'} fill className="object-cover" />
                      </div>
                    )}
                    <div>
                      <Link
                        href={`/product/${rev.productId}`}
                        target="_blank"
                        className="font-serif font-bold text-sm text-[#221C18] hover:text-[#701D24] flex items-center gap-1"
                      >
                        <span>{rev.productName || 'Handcrafted Artifact'}</span>
                        <ExternalLink className="w-3 h-3 text-[#C59B4B]" />
                      </Link>
                      <span className="text-[10px] text-[#655B53] font-mono">
                        Product ID: {rev.productId.slice(0, 16)}...
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {hasReply ? (
                      <Badge className="bg-emerald-50 text-emerald-800 border-emerald-300 text-[10px] font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Artisan Replied</span>
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-50 text-amber-900 border-amber-300 text-[10px] font-semibold flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        <span>Needs Reply</span>
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Reviewer Details & Rating */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-[#C59B4B]/30">
                      {rev.reviewerAvatar ? (
                        <AvatarImage src={rev.reviewerAvatar} alt={rev.reviewerName} />
                      ) : null}
                      <AvatarFallback className="bg-[#FAF7F2] text-[#701D24] font-bold text-xs">
                        {rev.reviewerName ? rev.reviewerName.charAt(0).toUpperCase() : 'C'}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-xs text-[#221C18]">{rev.reviewerName}</h4>
                        {rev.isVerifiedPurchase && (
                          <span className="inline-flex items-center gap-1 text-[9.5px] font-bold px-2 py-0.2 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <ShieldCheck className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Verified Buyer</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#655B53] block">{dateStr}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">{renderStars(rev.rating)}</div>
                </div>

                {/* Review Headline & Body */}
                {rev.title && (
                  <h5 className="font-serif text-sm font-bold text-[#221C18]">
                    {rev.title}
                  </h5>
                )}

                <p className="text-xs text-[#4A3F35] leading-relaxed font-sans bg-[#FAF7F2] p-3.5 rounded-xl border border-[#E8DCCB]/60">
                  {rev.comment}
                </p>

                {/* Review Images */}
                {rev.images && rev.images.length > 0 && rev.images[0] && (
                  <div className="flex gap-2">
                    {rev.images.map((img, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-lg overflow-hidden border border-[#E8DCCB]">
                        <Image src={img} alt="Customer photo" fill className="object-cover" />
                      </div>
                    ))}
                  </div>
                )}

                {/* EXISTING ARTISAN REPLY */}
                {hasReply && !isEditing && (
                  <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[#701D24] uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#C59B4B]" />
                        <span>Your Official Guild Response</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingReplyId(rev.id);
                          setReplyTextMap((prev) => ({ ...prev, [rev.id]: rev.artisanResponse || '' }));
                        }}
                        className="text-[10px] text-[#701D24] font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" /> Edit Response
                      </button>
                    </div>
                    <p className="text-xs text-[#4A3F35] italic leading-relaxed font-serif">
                      &ldquo;{rev.artisanResponse}&rdquo;
                    </p>
                    {rev.artisanRespondedAt && (
                      <span className="text-[10px] text-[#655B53] block pt-1">
                        Replied on {new Date(rev.artisanRespondedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    )}
                  </div>
                )}

                {/* INLINE REPLY FORM */}
                {(!hasReply || isEditing) && (
                  <div className="pt-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#701D24] mb-2 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-[#C59B4B]" />
                      <span>{isEditing ? 'Update Official Response' : 'Reply to Collector Directly'}</span>
                    </label>

                    <div className="flex gap-2">
                      <Textarea
                        value={replyTextMap[rev.id] ?? (isEditing ? rev.artisanResponse || '' : '')}
                        onChange={(e) => setReplyTextMap((prev) => ({ ...prev, [rev.id]: e.target.value }))}
                        placeholder="Thank the connoisseur, explain generational techniques used, or answer questions about the craft..."
                        rows={2}
                        className="bg-[#FAF7F2] border-[#E8DCCB] text-xs focus:border-[#C59B4B]"
                      />
                    </div>

                    <div className="flex items-center gap-2 mt-2.5">
                      <Button
                        type="button"
                        size="sm"
                        disabled={submittingReplyId === rev.id}
                        onClick={() => handleReplySubmit(rev.id)}
                        className="bg-[#701D24] hover:bg-[#8C2B2B] text-white text-xs rounded-xl shadow-xs flex items-center gap-1.5"
                      >
                        <Send className="w-3 h-3" />
                        <span>{submittingReplyId === rev.id ? 'Sending...' : 'Publish Official Reply'}</span>
                      </Button>

                      {isEditing && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingReplyId(null)}
                          className="text-xs text-[#655B53]"
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

