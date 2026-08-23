import { BACKEND_URL } from '@/services/backend/client';

export class DemandForecast {
  static async fetchForecast(region: str = 'Rajasthan', category: str = 'Home Decor'): Promise<any> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/forecast-demand?region=${region}&category=${category}`);
      if (res.ok) {
        return await res.json();
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}
type str = string;
