import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase';
import type { Product } from '@/lib/types';
import { products as staticProducts } from '@/lib/data';

export interface ProductsResult {
  products: Product[];
  loading: boolean;
  error: Error | null;
  isOnline: boolean;
}

function mapRow(r: Record<string, unknown>): Product {
  return {
    ...(r as Product),
    artisanId: r.artisan_id as string,
    createdAt: r.created_at as string,
    aiInsights: r.ai_insights as Product['aiInsights'],
  };
}

/**
 * Real-time subscription to the `products` Supabase table.
 * Falls back to the static seed list from `lib/data.ts` on error.
 */
export function useProducts(opts: { max?: number } = {}): ProductsResult {
  const [state, setState] = useState<ProductsResult>({
    products: [],
    loading: true,
    error: null,
    isOnline: true,
  });

  const { max = 100 } = opts;

  useEffect(() => {
    // Initial fetch
    supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(max)
      .then(({ data, error }) => {
        if (error) {
          console.warn('Supabase products unavailable — falling back to static seed.', error);
          setState({ products: staticProducts, loading: false, error, isOnline: false });
          return;
        }
        setState({ products: (data ?? []).map(mapRow), loading: false, error: null, isOnline: true });
      });

    // Realtime subscription
    const channel = supabase
      .channel('products-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(max);
        if (!error && data) {
          setState({ products: data.map(mapRow), loading: false, error: null, isOnline: true });
        }
      })
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [max]);

  return state;
}

/** No-op kept for API compatibility — Supabase handles reconnections automatically. */
export const resumeFirestore = async (): Promise<void> => {};
