import type { Product } from '@/lib/types';

export class CartService {
  static getCartItems(): Product[] {
    if (typeof window === 'undefined') return [];
    try {
      const items = localStorage.getItem('viraasat_cart');
      return items ? JSON.parse(items) : [];
    } catch (e) {
      return [];
    }
  }

  static saveCartItems(items: Product[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem('viraasat_cart', JSON.stringify(items));
    } catch (e) {
      console.error("Failed to persist cart items:", e);
    }
  }

  static getSubtotal(items: Product[]): number {
    return items.reduce((sum, item) => sum + item.price, 0);
  }
}
