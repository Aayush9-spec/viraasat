'use client';

import { useState, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Star,
  ShieldCheck,
  CheckCircle2,
  ThumbsUp,
  MessageSquare,
  Sparkles,
  Camera,
  Filter,
  Trash2,
  Edit3,
  Flag,
  ArrowUpDown,
  Lock,
  ChevronDown,
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/core/hooks/use-toast';
import { useProductReviews } from '@/features/marketplace/hooks/use-product-reviews';
import { ReviewService } from '@/features/reviews/review-service';
import type { Product } from '@/lib/types';
import type { ProductReview } from '@/types/review';

interface ReviewsSectionProps {
  product: Product;
}

const RATING_LABELS: Record<number, string> = {
  1: '1 Star — Needs Improvement',
  2: '2 Stars — Fair Craftsmanship',
  3: '3 Stars — Good Quality',
  4: '4 Stars — Highly Recommended',
  5: '5 Stars — Exceptional Masterpiece',
};

export function ReviewsSection({ product }: { product: Product }) {
  const { isSignedIn, user } = useUser();
  const { toast } = useToast();
  const { rating: ratingData, stats, loading, refresh } = useProductReviews(product.id);

  // Form States
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [comment, setComment] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  // Filter & Pagination States
  const [selectedStarFilter, setSelectedStarFilter] = useState<number | null>(null);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'highest' | 'lowest' | 'verified'>('recent');
  const [visibleCount, setVisibleCount] = useState(6);

  // Check if current authenticated user already reviewed this product
  const myReview = useMemo(() => {
    if (!isSignedIn || !user) return null;
    return ratingData.reviews.find((r) => r.reviewerId === user.id) || null;
  }, [isSignedIn, user, ratingData.reviews]);

  // Handle Editing My Review
  const handleStartEdit = (rev: any) => {
    setEditingReviewId(rev.id);
    setSelectedRating(rev.rating);
    setReviewTitle(rev.title || '');
    setComment(rev.comment || '');
    setImageUrl(rev.images?.[0] || '');
    setShowForm(true);
    // Smooth scroll to form
    const formElement = document.getElementById('review-form-anchor');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCancelEdit = () => {
    setEditingReviewId(null);
    setSelectedRating(0);
    setReviewTitle('');
    setComment('');
    setImageUrl('');
    setShowForm(false);
  };

  // Delete My Review
  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to delete your review for this craft?')) {
      return;
    }

    try {
      const res = await ReviewService.deleteReview(reviewId, { id: user?.id || '' });
      if (res.success) {
        toast({
          title: 'Review Removed',
          description: 'Your review has been successfully deleted.',
        });
        await refresh();
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('viraasat_review_updated'));
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Delete Failed',
          description: res.error || 'Could not delete review.',
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Delete Error',
        description: 'Failed to delete review.',
      });
    }
  };

  // Submit Review
  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isSignedIn || !user) {
      toast({
        variant: 'destructive',
        title: 'Sign In Required',
        description: 'Please sign in to rate and review this traditional craft.',
      });
      return;
    }

    if (selectedRating < 1 || selectedRating > 5) {
      toast({
        variant: 'destructive',
        title: 'Rating Required',
        description: 'Please select a star rating from 1 to 5.',
      });
      return;
    }

    if (comment.trim().length < 5) {
      toast({
        variant: 'destructive',
        title: 'Review Too Short',
        description: 'Please write at least 5 characters about the item.',
      });
      return;
    }

    setSubmitting(true);

    try {
      const res = await ReviewService.createReview(
        {
          productId: product.id,
          rating: selectedRating,
          title: reviewTitle.trim() || undefined,
          comment: comment.trim(),
          images: imageUrl.trim() ? [imageUrl.trim()] : [],
        },
        {
          id: user.id,
          name: user.fullName || user.username || user.primaryEmailAddress?.emailAddress?.split('@')[0] || 'Collector',
          email: user.primaryEmailAddress?.emailAddress,
          avatarUrl: user.imageUrl,
        }
      );

      if (res.success) {
        toast({
          title: '✨ Review Published to Artisan!',
          description: 'Thank you for supporting authentic Indian craft guilds. Your review has reached the artisan.',
        });

        setSelectedRating(0);
        setReviewTitle('');
        setComment('');
        setImageUrl('');
        setShowForm(false);
        setEditingReviewId(null);

        await refresh();

        // Broadcast to trigger instant update on other cards
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('viraasat_review_created'));
        }
      } else {
        toast({
          variant: 'destructive',
          title: 'Submission Notice',
          description: res.error || 'Could not save review. Please try again.',
        });
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Submission Error',
        description: err.message || 'An unexpected error occurred.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Filtered & Sorted Reviews
  const filteredReviews = useMemo(() => {
    let list = [...ratingData.reviews];

    if (selectedStarFilter !== null) {
      list = list.filter((r) => Math.round(r.rating) === selectedStarFilter);
    }

    if (verifiedOnly) {
      list = list.filter((r) => r.isVerifiedPurchase);
    }

    list.sort((a, b) => {
      if (sortBy === 'highest') return b.rating - a.rating;
      if (sortBy === 'lowest') return a.rating - b.rating;
      if (sortBy === 'verified') {
        if (a.isVerifiedPurchase === b.isVerifiedPurchase) {
          return new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime();
        }
        return a.isVerifiedPurchase ? -1 : 1;
      }
      return new Date(b.createdAt as string).getTime() - new Date(a.createdAt as string).getTime();
    });

    return list;
  }, [ratingData.reviews, selectedStarFilter, verifiedOnly, sortBy]);

  const visibleReviews = filteredReviews.slice(0, visibleCount);

  // Helper to render gold stars
  const renderStars = (value: number, size = 'w-4 h-4') =>
    [1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`${size} ${
          star <= Math.round(value) ? 'fill-amber-500 text-amber-500' : 'fill-stone-200 text-stone-200'
        }`}
      />
    ));

  return (
    <section id="reviews" className="mt-20 pt-16 border-t border-[#E8DCCB] scroll-mt-24">
      {/* SECTION HEADER */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#701D24]/10 text-[#701D24] text-xs font-bold uppercase tracking-widest mb-3">
            <Sparkles className="w-3.5 h-3.5 text-[#C59B4B]" />
            <span>Living Lineage Verification</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-4xl font-bold text-[#221C18]">
            Customer Reviews &amp; Artisan Ratings
          </h2>
          <p className="text-sm text-[#655B53] mt-2 max-w-xl">
            Real feedback from connoisseurs and certified collectors honoring the generational legacy of{' '}
            <span className="font-semibold text-[#701D24]">{product.name}</span>.
          </p>
        </div>

        {/* Action Button: Write or Edit Review */}
        <div>
          {isSignedIn ? (
            myReview ? (
              <Button
                type="button"
                onClick={() => handleStartEdit(myReview)}
                className="bg-[#701D24] hover:bg-[#8C2B2B] text-white rounded-xl shadow-md text-xs font-semibold px-5 py-2.5 flex items-center gap-2 cursor-pointer"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Your Review</span>
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() => setShowForm((prev) => !prev)}
                className="bg-[#701D24] hover:bg-[#8C2B2B] text-white rounded-xl shadow-md text-xs font-semibold px-5 py-2.5 flex items-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4" />
                <span>{showForm ? 'Close Review Form' : 'Write a Product Review'}</span>
              </Button>
            )
          ) : (
            <Button
              asChild
              className="bg-[#701D24] hover:bg-[#8C2B2B] text-white rounded-xl shadow-md text-xs font-semibold px-5 py-2.5"
            >
              <Link href={`/login?redirect=/product/${product.id}`} className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5" />
                <span>Sign in to Review</span>
              </Link>
            </Button>
          )}
        </div>
      </div>

      {/* RATING SUMMARY & DISTRIBUTION BARS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 p-6 sm:p-8 bg-[#FAF7F2] rounded-2xl border border-[#E8DCCB] mb-12 shadow-xs">
        {/* Left Column: Overall Rating Score */}
        <div className="lg:col-span-4 flex flex-col justify-center items-center text-center p-4 border-b lg:border-b-0 lg:border-r border-[#E8DCCB]">
          <span className="text-[11px] uppercase tracking-widest text-[#8F6826] font-bold">
            Guild Quality Rating
          </span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="font-serif text-5xl sm:text-6xl font-bold text-[#701D24]">
              {stats.averageRating.toFixed(1)}
            </span>
            <span className="text-xl font-serif text-[#655B53]">/ 5</span>
          </div>

          <div className="flex items-center gap-1 mt-2.5">
            {renderStars(stats.averageRating, 'w-5 h-5')}
          </div>

          <p className="text-xs text-[#655B53] mt-2 font-medium">
            Based on <span className="font-bold text-[#221C18]">{stats.totalReviews}</span> verified customer reviews
          </p>

          <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{stats.recommendedPercentage}% would recommend this craft</span>
          </div>
        </div>

        {/* Right Column: Rating Distribution Bars */}
        <div className="lg:col-span-8 flex flex-col justify-center space-y-3 px-2 sm:px-6">
          <span className="text-xs uppercase tracking-wider text-[#221C18] font-bold mb-1">
            Rating Breakdown
          </span>

          {[5, 4, 3, 2, 1].map((starNum) => {
            const count = stats.distribution[starNum as 1 | 2 | 3 | 4 | 5] || 0;
            const pct = stats.totalReviews > 0 ? Math.round((count / stats.totalReviews) * 100) : 0;
            const isSelected = selectedStarFilter === starNum;

            return (
              <button
                key={starNum}
                type="button"
                onClick={() => setSelectedStarFilter(isSelected ? null : starNum)}
                className={`flex items-center gap-3 w-full text-left group p-1.5 -mx-1.5 rounded-lg transition-colors cursor-pointer ${
                  isSelected ? 'bg-amber-100/70' : 'hover:bg-white/60'
                }`}
                title={`Filter by ${starNum} stars`}
              >
                <div className="flex items-center gap-1 w-16 text-xs font-medium text-[#221C18]">
                  <span>{starNum}</span>
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                </div>

                <div className="flex-1 h-2.5 bg-stone-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#C59B4B] to-[#701D24] rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>

                <div className="w-16 text-right text-xs font-mono text-[#655B53]">
                  <span>{count}</span>
                  <span className="text-[10px] text-stone-600 ml-1">({pct}%)</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* REVIEW SUBMISSION FORM (ANCHOR) */}
      <div id="review-form-anchor" />
      {showForm && isSignedIn && (
        <div className="mb-12 p-6 sm:p-8 bg-white rounded-2xl border-2 border-[#C59B4B]/40 shadow-lg animate-in fade-in duration-300">
          <div className="flex items-center justify-between pb-4 border-b border-[#E8DCCB] mb-6">
            <div>
              <h3 className="font-serif text-xl font-bold text-[#221C18]">
                {editingReviewId ? 'Edit Your Craft Review' : 'Share Your Experience with Master Artisan'}
              </h3>
              <p className="text-xs text-[#655B53] mt-0.5">
                Your feedback directly notifies the artisan guild and guides future heirloom collectors.
              </p>
            </div>
            <button
              type="button"
              onClick={handleCancelEdit}
              className="text-xs text-[#701D24] font-semibold hover:underline"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleSubmitReview} className="space-y-6">
            {/* Interactive Star Rating */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#221C18] mb-2">
                Overall Rating <span className="text-red-500">*</span>
              </label>
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSelectedRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 -m-1 focus:outline-none transition-transform hover:scale-110 cursor-pointer"
                    aria-label={`Rate ${star} star`}
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        star <= (hoverRating || selectedRating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-stone-100 text-stone-300 hover:text-amber-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-semibold text-[#8F6826] ml-3">
                  {RATING_LABELS[hoverRating || selectedRating] || 'Click to select rating'}
                </span>
              </div>
            </div>

            {/* Review Headline / Title */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#221C18] mb-2">
                Review Headline <span className="text-[11px] text-[#655B53] font-normal">(Optional)</span>
              </label>
              <Input
                type="text"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="e.g. Magnificent terracotta finish, authentic village artistry"
                maxLength={100}
                className="bg-[#FAF7F2] border-[#E8DCCB] text-sm focus:border-[#C59B4B]"
              />
            </div>

            {/* Written Review */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#221C18]">
                  Written Review <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-[#655B53] font-mono">
                  {comment.length} / 2000 characters
                </span>
              </div>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Describe the craftsmanship, tactile texture, packing quality, and the heritage significance of this piece..."
                rows={4}
                required
                minLength={5}
                maxLength={2000}
                className="bg-[#FAF7F2] border-[#E8DCCB] text-sm focus:border-[#C59B4B] leading-relaxed"
              />
            </div>

            {/* Customer Photo Upload (URL or Base64) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#221C18] mb-2 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#C59B4B]" />
                <span>Customer Photo <span className="text-[11px] text-[#655B53] font-normal">(Optional image link)</span></span>
              </label>
              <Input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/my-heirloom-photo.jpg"
                className="bg-[#FAF7F2] border-[#E8DCCB] text-sm focus:border-[#C59B4B]"
              />
            </div>

            {/* Submit & Cancel Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="submit"
                disabled={submitting}
                className="bg-[#701D24] hover:bg-[#8C2B2B] text-white rounded-xl text-xs font-semibold px-6 py-3 cursor-pointer shadow"
              >
                {submitting ? 'Verifying with ML & Submitting...' : editingReviewId ? 'Save Changes' : 'Submit Review'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleCancelEdit}
                className="rounded-xl text-xs font-semibold"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* FILTER & SORT TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-5 bg-white rounded-xl border border-[#E8DCCB] mb-8">
        {/* Filter Pills */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="font-bold text-[#221C18] uppercase tracking-wider flex items-center gap-1 text-[11px]">
            <Filter className="w-3 h-3 text-[#C59B4B]" /> Filters:
          </span>

          <button
            type="button"
            onClick={() => {
              setSelectedStarFilter(null);
              setVerifiedOnly(false);
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
              selectedStarFilter === null && !verifiedOnly
                ? 'bg-[#701D24] text-white'
                : 'bg-[#FAF7F2] text-[#221C18] hover:bg-stone-200'
            }`}
          >
            All ({ratingData.reviews.length})
          </button>

          <button
            type="button"
            onClick={() => setVerifiedOnly((prev) => !prev)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 cursor-pointer ${
              verifiedOnly
                ? 'bg-emerald-700 text-white'
                : 'bg-[#FAF7F2] text-[#221C18] hover:bg-emerald-50'
            }`}
          >
            <ShieldCheck className="w-3 h-3 text-emerald-500" />
            <span>Verified Purchases ({stats.verifiedPurchasesCount})</span>
          </button>

          {[5, 4, 3].map((star) => {
            const count = stats.distribution[star as 1 | 2 | 3 | 4 | 5] || 0;
            const isSelected = selectedStarFilter === star;
            return (
              <button
                key={star}
                type="button"
                onClick={() => setSelectedStarFilter(isSelected ? null : star)}
                className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#701D24] text-white'
                    : 'bg-[#FAF7F2] text-[#221C18] hover:bg-stone-200'
                }`}
              >
                {star}★ ({count})
              </button>
            );
          })}
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#655B53] flex items-center gap-1">
            <ArrowUpDown className="w-3 h-3" /> Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-[#FAF7F2] border border-[#E8DCCB] text-xs font-medium text-[#221C18] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#C59B4B] cursor-pointer"
          >
            <option value="recent">Most Recent</option>
            <option value="highest">Highest Rated</option>
            <option value="lowest">Lowest Rated</option>
            <option value="verified">Verified First</option>
          </select>
        </div>
      </div>

      {/* REVIEWS GRID / LIST */}
      {loading ? (
        <div className="text-center py-16 text-sm text-[#655B53]">
          Loading authenticated artisan reviews...
        </div>
      ) : filteredReviews.length === 0 ? (
        /* EMPTY STATE */
        <div className="text-center py-16 px-6 bg-[#FAF7F2] rounded-2xl border-2 border-dashed border-[#E8DCCB]">
          <div className="w-12 h-12 rounded-full bg-[#701D24]/10 text-[#701D24] flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-6 h-6 text-[#C59B4B]" />
          </div>
          <h3 className="font-serif text-xl font-bold text-[#221C18]">
            {selectedStarFilter !== null || verifiedOnly
              ? 'No reviews match your selected filters'
              : 'Be the First Connoisseur to Review'}
          </h3>
          <p className="text-sm text-[#655B53] mt-2 max-w-md mx-auto">
            {selectedStarFilter !== null || verifiedOnly
              ? 'Try resetting your filter options to view all reviews for this heirloom craft.'
              : 'Every piece is crafted entirely by hand by certified Indian master artisans. Share your perspective to support our living heritage.'}
          </p>

          <div className="mt-6 flex items-center justify-center gap-3">
            {selectedStarFilter !== null || verifiedOnly ? (
              <Button
                type="button"
                onClick={() => {
                  setSelectedStarFilter(null);
                  setVerifiedOnly(false);
                }}
                variant="outline"
                className="rounded-xl text-xs font-semibold"
              >
                Reset Filters
              </Button>
            ) : isSignedIn ? (
              <Button
                type="button"
                onClick={() => setShowForm(true)}
                className="bg-[#701D24] hover:bg-[#8C2B2B] text-white rounded-xl text-xs font-semibold px-6 py-2.5"
              >
                Write the First Review
              </Button>
            ) : (
              <Button
                asChild
                className="bg-[#701D24] hover:bg-[#8C2B2B] text-white rounded-xl text-xs font-semibold px-6 py-2.5"
              >
                <Link href={`/login?redirect=/product/${product.id}`}>
                  Sign in to Leave a Review
                </Link>
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {visibleReviews.map((rev) => {
            const isMyReview = isSignedIn && user?.id === rev.reviewerId;
            const dateStr = new Date(rev.createdAt as string).toLocaleDateString('en-IN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            });

            return (
              <article
                key={rev.id}
                className="p-6 sm:p-7 bg-white rounded-2xl border border-[#E8DCCB] hover:border-[#C59B4B]/50 transition-colors shadow-xs"
              >
                {/* Header: Reviewer, Rating & Badges */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-[#C59B4B]/30">
                      {rev.reviewerAvatar ? (
                        <AvatarImage src={rev.reviewerAvatar} alt={rev.reviewerName} />
                      ) : null}
                      <AvatarFallback className="bg-[#FAF7F2] text-[#701D24] font-bold text-sm">
                        {rev.reviewerName ? rev.reviewerName.charAt(0).toUpperCase() : 'C'}
                      </AvatarFallback>
                    </Avatar>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-sm text-[#221C18]">{rev.reviewerName}</h4>

                        {rev.isVerifiedPurchase && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            <span>Verified Purchase</span>
                          </span>
                        )}

                        <span className="inline-flex items-center gap-1 text-[9.5px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200/60">
                          <CheckCircle2 className="w-2.5 h-2.5 text-amber-600" />
                          <span>ML Authenticated</span>
                        </span>
                      </div>

                      <span className="text-[11px] text-[#655B53] block mt-0.5">{dateStr}</span>
                    </div>
                  </div>

                  {/* Rating Stars */}
                  <div className="flex items-center gap-1">
                    {renderStars(rev.rating, 'w-4 h-4')}
                  </div>
                </div>

                {/* Review Title */}
                {rev.title && (
                  <h5 className="font-serif text-base font-bold text-[#221C18] mt-3.5">
                    {rev.title}
                  </h5>
                )}

                {/* Review Text */}
                <p className="text-sm text-[#4A3F35] leading-relaxed mt-2 font-sans">
                  {rev.comment}
                </p>

                {/* Optional Customer Image */}
                {rev.images && rev.images.length > 0 && rev.images[0] && (
                  <div className="mt-4 flex gap-3">
                    {rev.images.map((img, idx) => (
                      <div
                        key={idx}
                        className="relative w-24 h-24 rounded-xl overflow-hidden border border-[#E8DCCB] shadow-xs"
                      >
                        <Image
                          src={img}
                          alt="Customer photograph of craft"
                          fill
                          className="object-cover hover:scale-105 transition-transform"
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* MASTER ARTISAN RESPONSE BOX */}
                {rev.artisanResponse && (
                  <div className="mt-5 p-4 sm:p-5 rounded-xl bg-[#FAF7F2] border border-[#C59B4B]/30 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#701D24] flex items-center gap-1 uppercase tracking-wider text-[11px]">
                          <Sparkles className="w-3.5 h-3.5 text-[#C59B4B]" />
                          <span>Master Artisan Response</span>
                        </span>
                        <span className="text-[10px] text-muted-foreground">• Guild Certified</span>
                      </div>
                      {rev.artisanRespondedAt && (
                        <span className="text-[10px] text-[#655B53]">
                          {new Date(rev.artisanRespondedAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-[#4A3F35] italic leading-relaxed font-serif">
                      &ldquo;{rev.artisanResponse}&rdquo;
                    </p>
                  </div>
                )}

                {/* Actions: Edit / Delete for Owner */}
                {isMyReview && (
                  <div className="mt-4 pt-3 border-t border-[#E8DCCB]/60 flex items-center gap-4 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(rev)}
                      className="text-[#701D24] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" /> Edit Review
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteReview(rev.id)}
                      className="text-stone-500 hover:text-red-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete Review
                    </button>
                  </div>
                )}
              </article>
            );
          })}

          {/* Load More Button */}
          {visibleCount < filteredReviews.length && (
            <div className="text-center pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => setVisibleCount((prev) => prev + 6)}
                className="rounded-xl border-[#E8DCCB] text-xs font-semibold px-6 py-2.5 hover:bg-[#FAF7F2]"
              >
                Load More Verified Reviews ({filteredReviews.length - visibleCount} remaining)
              </Button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
