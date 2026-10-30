'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { Star, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/core/hooks/use-toast';
import { supabase } from '@/services/supabase';
import { useProductReviews } from '@/features/marketplace/hooks/use-product-reviews';
import { BACKEND_URL } from '@/services/backend/client';
import type { Product } from '@/lib/types';

export function ReviewsSection({ product }: { product: Product }) {
  const { isSignedIn, user } = useUser();
  const { toast } = useToast();
  const { rating, loading } = useProductReviews(product.id);

  const [selectedRating, setSelectedRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submitReview = useCallback(async () => {
    if (!isSignedIn || !user) {
      toast({
        variant: 'destructive',
        title: 'Sign in required',
        description: 'Please sign in to review this piece.',
      });
      return;
    }
    if (selectedRating < 1) {
      toast({
        variant: 'destructive',
        title: 'Select a rating',
        description: 'Choose 1–5 stars before submitting.',
      });
      return;
    }
    setSubmitting(true);

    try {
      const response=await fetch('/api/reviews',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({productId:product.id,rating:selectedRating,comment:comment.trim()})});
      const result=await response.json();
      if(!response.ok)throw new Error(typeof result.error === 'string' ? result.error : 'Review could not be saved');
      window.dispatchEvent(new Event('viraasat-reviews-updated'));
      setSelectedRating(0);
      setComment('');
      toast({
        title: 'Review Published',
        description: 'Thank you for supporting traditional Indian craftsmanship.',
      });
    } catch (e) {
      console.error('Failed to submit review', e);
      toast({
        variant: 'destructive',
        title: 'Review failed',
        description: e instanceof Error ? e.message : 'Please try again.',
      });
    } finally {
      setSubmitting(false);
    }
  }, [isSignedIn, user, selectedRating, comment, product.id, toast]);

  const ratingStars = (value: number) =>
    [1, 2, 3, 4, 5].map((star) => (
      <Star
        key={star}
        className={`h-4 w-4 ${
          star <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-muted'
        }`}
      />
    ));

  return (
    <section className="mt-20 pt-16 border-t border-amber-900/10">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <span className="text-amber-500 text-[10px] tracking-[0.5em] uppercase mb-2 block font-bold">
            Collector Voices
          </span>
          <h2 className="text-3xl md:text-4xl font-heading text-primary">Reviews &amp; Ratings</h2>
        </div>
        {!loading && rating.count > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-primary">{rating.avg.toFixed(1)}</span>
            <div>
              <div className="flex gap-0.5">{ratingStars(rating.avg)}</div>
              <p className="text-xs text-muted-foreground mt-1">{rating.count} reviews</p>
            </div>
          </div>
        )}
      </div>

      {isSignedIn && (
        <div className="mb-12 p-6 border border-border bg-card rounded-none max-w-2xl">
          <h3 className="text-sm font-bold uppercase tracking-wider text-primary mb-3">Leave a Review</h3>
          <div className="flex items-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                aria-label={`Rate ${star} out of 5 stars`}
                aria-pressed={selectedRating === star}
                className="min-w-11 min-h-11 flex items-center justify-center focus-visible:ring-2 focus-visible:ring-primary"
                onClick={() => setSelectedRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
              >
                <Star
                  className={`h-6 w-6 cursor-pointer transition-colors ${
                    star <= (hoverRating || selectedRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-muted-foreground/30 hover:text-amber-400'
                  }`}
                />
              </button>
            ))}
            <span className="text-xs text-muted-foreground ml-2">
              {selectedRating > 0 ? `${selectedRating} of 5 stars` : 'Select rating'}
            </span>
          </div>
          <Textarea
            aria-label="Your review"
            placeholder="Tell others about the craftsmanship, quality, and heritage story behind this piece..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="bg-card border-border text-card-foreground mb-4"
          />
          <Button
            type="button"
            onClick={submitReview}
            disabled={submitting}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
          >
            {submitting ? 'Verifying with ML & Submitting...' : 'Submit Review'}
          </Button>
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-sm text-muted-foreground">Loading reviews...</div>
      ) : rating.reviews.length === 0 ? (
        <div className="text-center py-12 bg-secondary/20 border border-dashed border-primary/20">
          <Badge variant="outline" className="mb-3 border-primary/20 text-primary">Be the first</Badge>
          <p className="text-muted-foreground text-sm">
            No reviews yet. {isSignedIn ? 'Share your experience above.' : 'Sign in to leave the first review.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {rating.reviews.map((review) => (
            <div key={review.id} className="border border-border bg-card text-card-foreground p-6 rounded-none space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    {review.reviewerAvatar ? (
                      <AvatarImage src={review.reviewerAvatar} alt={review.reviewerName} />
                    ) : null}
                    <AvatarFallback className="bg-amber-50 text-amber-900 font-semibold">
                      {review.reviewerName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-primary">{review.reviewerName}</p>
                      {review.verifiedPurchase && <Badge variant="outline" className="border-emerald-600/30 text-emerald-800 bg-emerald-50/60 text-[9px] px-1.5 py-0 font-medium">
                        <ShieldCheck className="h-2.5 w-2.5 mr-1 inline" /> Verified purchase
                      </Badge>}
                    </div>
                    {review.createdAt !== undefined && (
                      <p className="text-[10px] text-muted-foreground">
                        {((): string => {
                          const value = review.createdAt as { toDate?: () => Date } & unknown;
                          const date =
                            value && typeof value === 'object' && value.toDate
                              ? value.toDate()
                              : new Date(review.createdAt as string);
                          return date.toLocaleDateString();
                        })()}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-0.5">{ratingStars(review.rating)}</div>
              </div>
              {review.comment && (
                <p className="text-sm text-foreground/80 leading-relaxed font-sans">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
