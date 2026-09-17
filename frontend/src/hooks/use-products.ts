import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
  QuerySnapshot,
  DocumentData,
  enableNetwork,
  disableNetwork,
} from 'firebase/firestore';
import { db } from '@/services/firebase/firestore';
import type { Product } from '@/lib/types';
import { products } from '@/lib/data';

const FIRESTORE_TIMEOUT = 15000;

export interface ProductsResult {
  products: Product[];
  loading: boolean;
  error: Error | null;
  isOnline: boolean;
}

/**
 * Real-time subscription to the `products` Firestore collection.
 *
 * Falls back to the static seed list from `lib/data.ts` when:
 *  - Firebase is not configured (no projectId)
 *  - Firestore is unreachable (offline, timeout, or network error)
 *
 * The fallback is logged so ops can detect stale-data mode in prod.
 */
export function useProducts(
  opts: { max?: number } = {},
): ProductsResult {
  const [state, setState] = useState<ProductsResult>({
    products: [],
    loading: true,
    error: null,
    isOnline: true,
  });

  const { max = 100 } = opts;

  useEffect(() => {
    if (!db || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
      setState({
        products: products,
        loading: false,
        error: null,
        isOnline: false,
      });
      return;
    }

    let cancelled = false;
    let timeoutId: NodeJS.Timeout;

    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(max));

    let resolved = false;
    const failOpen = () => {
      if (resolved || cancelled) return;
      resolved = true;
      clearTimeout(timeoutId);
      console.warn('Firestore products unavailable — falling back to static seed.');
      setState({
        products: products,
        loading: false,
        error: null,
        isOnline: false,
      });
    };

    timeoutId = setTimeout(failOpen, FIRESTORE_TIMEOUT);

    const unsub = onSnapshot(
      q,
      (snap: QuerySnapshot<DocumentData, DocumentData>) => {
        if (cancelled) return;
        clearTimeout(timeoutId);
        resolved = true;

        const dbProducts = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Product[];

        setState({
          products: dbProducts,
          loading: false,
          error: null,
          isOnline: true,
        });
      },
      (err) => {
        console.warn('Firestore products listener error:', err);
        failOpen();
      },
    );

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      unsub();
    };
  }, [max]);

  return state;
}

/**
 * Force Firestore back online after a network reconnection.
 * Exported for manual retry from UI ("Retry" button).
 */
export const resumeFirestore = async (): Promise<void> => {
  if (!db) return;
  try {
    await enableNetwork(db);
  } catch (err) {
    console.warn('Could not resume Firestore network:', err);
  }
};
