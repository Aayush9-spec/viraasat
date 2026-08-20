import type { Product } from '@/lib/types';

export class RecommendationEngine {
  static async getGraphRecommendations(productId: string): Promise<string[]> {
    try {
      const res = await fetch(`http://localhost:8000/api/search/semantic?q=${productId}`);
      if (res.ok) {
        const data = await res.json();
        return data.results.map((r: any) => r.id);
      }
      return [];
    } catch (e) {
      return [];
    }
  }
}
