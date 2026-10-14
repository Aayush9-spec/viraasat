import { apiClient } from '@/core/api/client';
import type { Product } from '@/types/product';

export interface ProductsResponse {
  success: boolean;
  products: Product[];
}

export const productsApi = {
  /**
   * Fetch all marketplace products with optional filtering.
   */
  async getAll(params?: { category?: string; query?: string; region?: string }): Promise<Product[]> {
    const res = await apiClient.get<ProductsResponse | Product[]>('products', { params });
    if (Array.isArray(res)) return res;
    return res.products || [];
  },

  /**
   * Fetch single product by id.
   */
  async getById(id: string): Promise<Product | null> {
    const res = await apiClient.get<{ success: boolean; product: Product } | Product>(`products/${id}`);
    if ('product' in res) return res.product;
    return res as Product;
  },

  /**
   * Fetch AI recommended products.
   */
  async getRecommendations(productId?: string): Promise<Product[]> {
    const res = await apiClient.get<{ success: boolean; products: Product[] }>('recommendations', {
      params: productId ? { productId } : undefined,
    });
    return res.products || [];
  },
};
