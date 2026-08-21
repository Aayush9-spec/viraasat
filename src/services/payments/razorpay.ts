import { BACKEND_URL } from '@/services/backend/client';

export class RazorpayService {
  static async createOrderOnServer(amount: number): Promise<any> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/razorpay/order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, currency: 'INR' }),
      });
      return await response.json();
    } catch (e) {
      console.warn("FastAPI offline: generating simulated order parameters.");
      return {
        id: "order_mock_" + Math.random().toString(36).substring(4),
        amount: amount * 100,
        currency: 'INR'
      };
    }
  }
}
