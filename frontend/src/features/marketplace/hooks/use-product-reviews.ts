'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';

export interface Review {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  rating: number;
  comment: string;
  createdAt: unknown;
  verifiedPurchase?: boolean;
}

export interface ProductRating {
  avg: number;
  count: number;
  reviews: Review[];
}

export function useProductReviews(productId: string): {
  rating: ProductRating;
  loading: boolean;
} {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(productId);
        if (!isUuid) {
          if (active) {
            setReviews([]);
            setLoading(false);
          }
          return;
        }

        const response=await fetch(`/api/reviews?productId=${encodeURIComponent(productId)}`);
        if(!response.ok)throw new Error('Reviews unavailable');
        const data=(await response.json()).data?.reviews || [];
        if (!active) return;

        if (data && data.length > 0) {
          setReviews(
            data.map((row: any) => ({
              id: row.id,
              verifiedPurchase: row.verified_purchase === true,
              reviewerId: row.reviewer_id,
              reviewerName: row.reviewer_name,
              reviewerAvatar: row.reviewer_avatar,
              rating: row.rating,
              comment: row.comment,
              createdAt: row.created_at,
            })),
          );
        } else {
          setReviews([]);
        }
      } catch (e) {
        console.warn('Failed to load reviews', e);
        if (active) {
          setReviews([]);
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    window.addEventListener('viraasat-reviews-updated',load);
    return () => { active = false;window.removeEventListener('viraasat-reviews-updated',load); };
  }, [productId]);

  const count = reviews.length;
  const avg = count === 0 ? 0 : reviews.reduce((sum, r) => sum + r.rating, 0) / count;

  return { rating: { avg, count, reviews }, loading };
}
