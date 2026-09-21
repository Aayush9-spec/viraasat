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
        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('product_id', productId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (!active) return;

        setReviews(
          (data ?? []).map((row) => ({
            id: row.id,
            reviewerId: row.reviewer_id,
            reviewerName: row.reviewer_name,
            reviewerAvatar: row.reviewer_avatar,
            rating: row.rating,
            comment: row.comment,
            createdAt: row.created_at,
          })),
        );
      } catch (e) {
        console.warn('Failed to load reviews', e);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, [productId]);

  const count = reviews.length;
  const avg = count === 0 ? 0 : reviews.reduce((sum, r) => sum + r.rating, 0) / count;

  return { rating: { avg, count, reviews }, loading };
}
