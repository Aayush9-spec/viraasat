import { products, getLocalProducts, categories as staticCategories, regions as staticRegions } from '@/lib/data';
import type { Product } from '@/lib/types';
import { supabase } from '@/services/supabase';

export class ProductService {
  static async getAllProducts(): Promise<Product[]> {
    const localProds = getLocalProducts();
    let dbProducts: Product[] = [];

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        dbProducts = data.map((row) => ({
          id: row.id,
          artisanId: row.artisan_id,
          name: row.name,
          category: row.category,
          description: row.description,
          price: row.price,
          stock: row.stock,
          images: row.images ?? [],
          region: row.region,
          aiInsights: row.ai_insights,
          createdAt: row.created_at,
        })) as Product[];
      }
    } catch (e) {
      console.warn('Failed to fetch products from Supabase, falling back:', e);
    }

    const map = new Map<string, Product>();
    [...localProds, ...dbProducts, ...products].forEach((p) => {
      if (p.id) map.set(p.id, p);
    });
    return Array.from(map.values());
  }

  static async getProductById(id: string): Promise<Product | undefined> {
    const localProds = getLocalProducts();
    const localMatch = localProds.find((p) => p.id === id);
    if (localMatch) return localMatch;

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (!error && data) {
        return {
          id: data.id,
          artisanId: data.artisan_id,
          name: data.name,
          category: data.category,
          description: data.description,
          price: data.price,
          stock: data.stock,
          images: data.images ?? [],
          region: data.region,
          aiInsights: data.ai_insights,
          createdAt: data.created_at,
        } as Product;
      }
    } catch (e) {
      console.warn(`Failed to fetch product ${id} from Supabase:`, e);
    }
    return products.find((p) => p.id === id);
  }


  static async getProductsByCategory(category: string): Promise<Product[]> {
    const all = await this.getAllProducts();
    return all.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }

  static async searchProducts(query: string): Promise<Product[]> {
    const q = query.toLowerCase();
    const all = await this.getAllProducts();
    return all.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.region.toLowerCase().includes(q),
    );
  }

  static async getAllCategories(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('category');

      if (error) throw error;

      const cats = [...new Set((data ?? []).map((r) => r.category).filter(Boolean))].sort();
      return cats.length > 0 ? cats : staticCategories;
    } catch (e) {
      console.warn('Failed to fetch categories from Supabase, falling back to static:', e);
      return staticCategories;
    }
  }

  static async getAllRegions(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('region');

      if (error) throw error;

      const regions = [...new Set((data ?? []).map((r) => r.region).filter(Boolean))].sort();
      return regions.length > 0 ? regions : staticRegions;
    } catch (e) {
      console.warn('Failed to fetch regions from Supabase, falling back to static:', e);
      return staticRegions;
    }
  }
}

/**
 * Real-time subscription to the products table (category changes).
 * Returns a cleanup function.
 */
export function watchCategories(
  onChange: (categories: string[]) => void,
  onError?: (err: Error) => void,
): () => void {
  // Initial fetch
  ProductService.getAllCategories().then(onChange).catch((e) => onError?.(e instanceof Error ? e : new Error(String(e))));

  // Realtime subscription
  const channel = supabase
    .channel('products-categories')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, async () => {
      try {
        const cats = await ProductService.getAllCategories();
        onChange(cats);
      } catch (e) {
        onError?.(e instanceof Error ? e : new Error(String(e)));
      }
    })
    .subscribe();

  return () => { void supabase.removeChannel(channel); };
}
