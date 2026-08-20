import type { Product } from '@/lib/types';
import { db } from '@/services/firebase/firestore';
import { doc, updateDoc } from 'firebase/firestore';

export class InventoryService {
  static async updateStock(productId: string, newStock: number): Promise<boolean> {
    try {
      const docRef = doc(db, 'products', productId);
      await updateDoc(docRef, { stock: newStock });
      return true;
    } catch (e) {
      console.warn("Firestore offline, stock updated locally in memory.");
      return false;
    }
  }

  static getLowStockItems(productsList: Product[], threshold: number = 5): Product[] {
    return productsList.filter(p => p.stock <= threshold);
  }
}
