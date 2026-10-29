import type { Order } from '@/lib/types';
export class OrderService {
  static async createOrder(_order: Omit<Order, 'id' | 'orderDate' | 'updatedAt'>): Promise<string | null> {
    throw new Error('Create orders through authenticated checkout');
  }
  static async getOrdersByBuyer(_buyerId: string): Promise<Order[]> {
    // The server derives the buyer from the authenticated session.
    const response = await fetch('/api/orders', { cache: 'no-store' });
    if (!response.ok) throw new Error('Could not load orders');
    return response.json();
  }
}
