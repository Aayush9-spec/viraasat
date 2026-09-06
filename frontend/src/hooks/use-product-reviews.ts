'use client';

import { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/services/firebase/firestore';

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
      if (!db) {
        setLoading(false);
        return;
      }
      try {
        const reviewsRef = collection(db, 'products', productId, 'reviews');
        const q = query(reviewsRef, orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        if (!active) return;
        setReviews(
          snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Review),
        );
      } catch (e) {
        console.warn('Failed to load reviews', e);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [productId]);

  const count = reviews.length;
  const avg =
    count === 0 ? 0 : reviews.reduce((sum, r) => sum + r.rating, 0) / count;

  return { rating: { avg, count, reviews }, loading };
}