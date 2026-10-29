export class RazorpayService {
  static async createOrderOnServer(checkout: { items: { productId: string; quantity: number }[]; shipping: Record<string, string>; shippingOption: string; idempotencyKey: string }) {
    const response = await fetch('/api/create-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(checkout) });
    if (!response.ok) throw new Error('Checkout could not be created');
    return response.json();
  }
}
