import type { Order } from '@/lib/types';
import { db } from '@/services/firebase/firestore';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';

export class OrderService {
  static async createOrder(order: Omit<Order, 'id' | 'orderDate' | 'updatedAt'>): Promise<string | null> {
    try {
      const docRef = await addDoc(collection(db, 'orders'), {
        ...order,
        orderDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      return docRef.id;
    } catch (e) {
      console.error("Failed to create order document:", e);
      return null;
    }
  }

  static async getOrdersByBuyer(buyerId: string): Promise<Order[]> {
    try {
      const q = query(collection(db, 'orders'), where('buyerId', '==', buyerId));
      const querySnapshot = await getDocs(q);
      const ordersList: Order[] = [];
      querySnapshot.forEach((doc) => {
        ordersList.push({ id: doc.id, ...doc.data() } as Order);
      });
      return ordersList;
    } catch (e) {
      console.warn("Failed to fetch cloud orders: returning empty list.");
      return [];
    }
  }
}
