import type { Product } from '@/lib/types';
import { supabase } from '@/services/supabase';

export class InventoryService {
  static async updateStock(productId: string, newStock: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('products')
        .update({ stock: newStock })
        .eq('id', productId);

      if (error) throw error;
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
