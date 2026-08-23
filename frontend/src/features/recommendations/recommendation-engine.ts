import { BACKEND_URL } from '@/services/backend/client';

export class RecommendationEngine {
  static async getGraphRecommendations(productId: string): Promise<string[]> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/search/semantic?q=${productId}`);
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
