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

const FALLBACK_REVIEWS: Record<string, Review[]> = {
  'prod-1': [
    {
      id: 'rev-1',
      reviewerId: 'user-2',
      reviewerName: 'Rahul Singh',
      reviewerAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100',
      rating: 5,
      comment: 'The cobalt glaze is so deep in person! It arrived triple-bubble wrapped with a little handwritten note from Riya in Jaipur. Beautiful craftsmanship.',
      createdAt: '2024-03-12T14:22:00Z',
    },
    {
      id: 'rev-2',
      reviewerId: 'user-11',
      reviewerName: 'Ananya Sen',
      reviewerAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=100',
      rating: 5,
      comment: 'You can tell this is genuine Blue Pottery without clay because of the texture and ring. It looks stunning on my wooden dining table.',
      createdAt: '2024-03-20T09:15:00Z',
    },
  ],
  'prod-5': [
    {
      id: 'rev-4',
      reviewerId: 'user-6',
      reviewerName: 'Vikramaditya Roy',
      reviewerAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=100',
      rating: 5,
      comment: 'The pashmina is featherlight yet incredibly warm. The Sozni needle stitches are microscopic. Heirloom craftsmanship.',
      createdAt: '2024-02-18T16:05:00Z',
    },
  ],
  'prod-6': [
    {
      id: 'rev-5',
      reviewerId: 'user-7',
      reviewerName: 'Deepika Nambiar',
      reviewerAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=100',
      rating: 5,
      comment: 'I bought this for my daughter. The natural vegetable turmeric lac is completely odorless and the lathe finish is smooth as glass. Love Channapatna toys!',
      createdAt: '2024-03-28T18:30:00Z',
    },
  ],
  'prod-7': [
    {
      id: 'rev-6',
      reviewerId: 'user-8',
      reviewerName: 'Kunal Deshmukh',
      reviewerAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=100',
      rating: 5,
      comment: 'Bastar Dhokra is real living history. The tribal elephant has weight and character that machine molded brass could never match.',
      createdAt: '2024-01-29T13:10:00Z',
    },
  ],
  'prod-12': [
    {
      id: 'rev-3',
      reviewerId: 'user-12',
      reviewerName: 'Meera Swaminathan',
      reviewerAvatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=100',
      rating: 5,
      comment: 'Ordered 2 sets of the lotus diyas for our family puja. At ₹210 this is genuinely fair pricing for real terracotta work. Not a single chip during transit.',
      createdAt: '2024-04-02T11:40:00Z',
    },
  ],
};

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
            setReviews(FALLBACK_REVIEWS[productId] || []);
            setLoading(false);
          }
          return;
        }

        const { data, error } = await supabase
          .from('reviews')
          .select('*')
          .eq('product_id', productId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        if (!active) return;

        if (data && data.length > 0) {
          setReviews(
            data.map((row) => ({
              id: row.id,
              reviewerId: row.reviewer_id,
              reviewerName: row.reviewer_name,
              reviewerAvatar: row.reviewer_avatar,
              rating: row.rating,
              comment: row.comment,
              createdAt: row.created_at,
            })),
          );
        } else {
          setReviews(FALLBACK_REVIEWS[productId] || []);
        }
      } catch (e) {
        console.warn('Failed to load reviews', e);
        if (active) {
          setReviews(FALLBACK_REVIEWS[productId] || []);
        }
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
