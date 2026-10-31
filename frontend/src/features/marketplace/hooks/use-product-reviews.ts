'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/services/supabase';
import { ReviewService } from '@/features/reviews/review-service';
import type { ProductReview, ReviewStats } from '@/types/review';

export interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number;
  title?: string;
  comment: string;
  images?: string[];
  isVerifiedPurchase?: boolean;
  artisanResponse?: string;
  artisanRespondedAt?: string;
  createdAt: unknown;
}

export interface ProductRating {
  avg: number;
  count: number;
  reviews: Review[];
  stats?: ReviewStats;
}

export function useProductReviews(productId: string): {
  rating: ProductRating;
  stats: ReviewStats;
  loading: boolean;
  refresh: () => Promise<void>;
} {
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [stats, setStats] = useState<ReviewStats>({
    averageRating: 5.0,
    totalReviews: 0,
    distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    verifiedPurchasesCount: 0,
    recommendedPercentage: 100,
  });
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    if (!productId) {
      setLoading(false);
      return;
    }

    try {
      const res = await ReviewService.getProductReviews(productId);
      setReviews(res.reviews);
      setStats(res.stats);
    } catch (e) {
      console.warn('Failed to load reviews for product', productId, e);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    let active = true;
    void fetchReviews();

    // Listen for custom window event when review is submitted or replied to
    const handleReviewChange = (e: any) => {
      if (active) {
        void fetchReviews();
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('viraasat_review_created', handleReviewChange);
      window.addEventListener('viraasat_review_updated', handleReviewChange);
    }

    // Supabase realtime channel for live database updates
    const channelName = `product-reviews-${productId.replace(/[^a-zA-Z0-9_-]/g, '')}-${Math.random().toString(36).slice(2, 6)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reviews' },
        () => {
          if (active) void fetchReviews();
        }
      )
      .subscribe();

    return () => {
      active = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener('viraasat_review_created', handleReviewChange);
        window.removeEventListener('viraasat_review_updated', handleReviewChange);
      }
      void supabase.removeChannel(channel);
    };
  }, [productId, fetchReviews]);

  const count = stats.totalReviews || reviews.length;
  const avg = stats.averageRating || (count > 0 ? Number((reviews.reduce((acc, r) => acc + r.rating, 0) / count).toFixed(1)) : 5.0);

  const legacyReviews: Review[] = reviews.map((r) => ({
    id: r.id,
    reviewerId: r.reviewerId,
    reviewerName: r.reviewerName,
    reviewerAvatar: r.reviewerAvatar,
    rating: r.rating,
    title: r.title,
    comment: r.comment,
    images: r.images,
    isVerifiedPurchase: r.isVerifiedPurchase,
    artisanResponse: r.artisanResponse,
    artisanRespondedAt: r.artisanRespondedAt,
    createdAt: r.createdAt,
  }));

  return {
    rating: {
      avg,
      count,
      reviews: legacyReviews,
      stats,
    },
    stats,
    loading,
    refresh: fetchReviews,
  };
}
