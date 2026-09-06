'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Star } from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/services/firebase/firestore';
import { useProductReviews } from '@/hooks/use-product-reviews';
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
    if (!db) {
      toast({
        variant: 'destructive',
        title: 'Reviews unavailable',
        description: 'The review service is not available right now.',
      });
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'products', product.id, 'reviews'), {
        reviewerId: user.id,
        reviewerName:
          user.fullName ||
          user.username ||
          user.primaryEmailAddress?.emailAddress ||
          'Anonymous',
        reviewerAvatar: user.imageUrl || '',
        rating: selectedRating,
        comment: comment.trim(),
        createdAt: serverTimestamp(),
      });
      setSelectedRating(0);
      setComment('');
      toast({
        title: 'Review published',
        description: 'Thank you for sharing your experience.',
      });
    } catch (e) {
      console.error('Failed to submit review', e);
      toast({
        variant: 'destructive',
        title: 'Review failed',
        description: 'We could not save your review. Please try again.',
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
          <h2 className="text-3xl md:text-4xl font-heading text-[#5e2c18]">Reviews &amp; Ratings</h2>
        </div>
        {!loading && rating.count > 0 && (
          <div className="flex items-center gap-3">
            <span className="text-3xl font-bold text-[#5e2c18]">{rating.avg.toFixed(1)}</span>
            <div>
              <div className="flex gap-0.5">{ratingStars(rating.avg)}</div>
              <p className="text-xs text-muted-foreground mt-1">{rating.count} verified reviews</p>
            </div>
          </div>
        )}
      </div>

      {isSignedIn && (
        <div className="bg-[#fbf7f0] border border-amber-900/10 p-6 mb-10">
          <h3 className="font-heading text-lg text-[#5e2c18] mb-3">Share your experience</h3>
          <div className="flex items-center gap-1 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                onClick={() => setSelectedRating(star)}
                aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                className="p-0.5"
              >
                <Star
                  className={`h-7 w-7 transition-colors ${
                    star <= (hoverRating || selectedRating)
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-amber-900/20'
                  }`}
                />
              </button>
            ))}
          </div>
          <Textarea
            placeholder="Tell others about the craftsmanship, quality, and story behind this piece..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="bg-white border-amber-900/10 mb-4"
          />
          <Button
            type="button"
            onClick={submitReview}
            disabled={submitting}
            className="bg-[#5e2c18] hover:bg-[#4a2315] text-[#fbf7f0]"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
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
            <div key={review.id} className="border border-amber-900/10 bg-white p-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    {review.reviewerAvatar ? (
                      <AvatarImage src={review.reviewerAvatar} alt={review.reviewerName} />
                    ) : null}
                    <AvatarFallback className="bg-amber-50 text-amber-900">
                      {review.reviewerName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold text-[#5e2c18]">{review.reviewerName}</p>
                    {review.createdAt !== undefined && (
                    <p className="text-[10px] text-muted-foreground">
                      {((): string => {
                        const value = review.createdAt as { toDate?: () => Date } & unknown;
                        const date = value && typeof value === 'object' && value.toDate ? value.toDate() : new Date(review.createdAt as string);
                        return date.toLocaleDateString();
                      })()}
                    </p>
                  )}
                  </div>
                </div>
                <div className="flex gap-0.5">{ratingStars(review.rating)}</div>
              </div>
              {review.comment && (
                <p className="text-sm text-amber-900/70 leading-relaxed">{review.comment}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}