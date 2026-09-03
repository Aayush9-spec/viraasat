import { products } from '@/lib/data';
import type { Product } from '@/lib/types';
import { db } from '@/services/firebase/firestore';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

export class ProductService {
  static async getAllProducts(): Promise<Product[]> {
    try {
      if (!db || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) return products;
      
      const timeoutPromise = new Promise<Product[]>((_, reject) =>
        setTimeout(() => reject(new Error("Firestore timeout")), 1200)
      );

      const fetchPromise = (async () => {
        const querySnapshot = await getDocs(collection(db, "products"));
        const dbProducts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Product[];

        const merged = [...dbProducts];
        products.forEach(staticProd => {
          if (!merged.some(p => p.id === staticProd.id)) {
            merged.push(staticProd);
          }
        });
        return merged;
      })();

      return await Promise.race([fetchPromise, timeoutPromise]);
    } catch (e) {
      console.warn("Failed to fetch products from Firestore, falling back to static:", e);
      return products;
    }
  }

  static async getProductById(id: string): Promise<Product | undefined> {
    try {
      if (db && process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() } as Product;
        }
      }
    } catch (e) {
      console.warn(`Failed to fetch product ${id} from Firestore:`, e);
    }
    return products.find(p => p.id === id);
  }

  static async getProductsByCategory(category: string): Promise<Product[]> {
    const all = await this.getAllProducts();
    return all.filter(p => p.category.toLowerCase() === category.toLowerCase());
  }

  static async searchProducts(query: string): Promise<Product[]> {
    const q = query.toLowerCase();
    const all = await this.getAllProducts();
    return all.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.description.toLowerCase().includes(q) || 
      p.region.toLowerCase().includes(q)
    );
  }
}
