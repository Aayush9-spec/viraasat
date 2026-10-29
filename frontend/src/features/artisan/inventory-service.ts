import type { Product } from '@/lib/types';

export class InventoryService {
  static async updateStock(productId: string, newStock: number): Promise<boolean> {
    try {
      const response = await fetch('/api/products', {method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:productId,stock:newStock})});
      if(!response.ok)throw new Error('Stock update failed');
      return true;
    } catch (e) {
      console.warn('Supabase offline, stock update failed.', e);
      return false;
    }
  }

  static getLowStockItems(productsList: Product[], threshold: number = 5): Product[] {
    return productsList.filter((p) => p.stock <= threshold);
  }
}
