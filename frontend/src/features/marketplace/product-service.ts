import { products, categories as staticCategories, regions as staticRegions } from '@/lib/data';
import type { Product } from '@/lib/types';
import { db } from '@/services/firebase/firestore';
import { collection, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';

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

  /**
   * Fetch dynamic categories from Firestore with a static fallback.
   * The Firestore `categories` collection stores docs like:
   *   { name: "Jewelry", slug: "jewelry", region: "pan-india" }
   */
  static async getAllCategories(): Promise<string[]> {
    try {
      if (!db || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) return staticCategories;

      const timeoutPromise = new Promise<string[]>((_, reject) =>
        setTimeout(() => reject(new Error("Firestore timeout")), 1200),
      );

      const fetchPromise = (async () => {
        const snap = await getDocs(collection(db, 'categories'));
        const dbCats = snap.docs
          .map((d) => d.data())
          .filter((d) => typeof d.name === 'string')
          .map((d) => d.name as string)
          .sort();
        if (dbCats.length === 0) return staticCategories;
        return dbCats;
      })();

      return await Promise.race([fetchPromise, timeoutPromise]);
    } catch (e) {
      console.warn('Failed to fetch categories from Firestore, falling back to static:', e);
      return staticCategories;
    }
  }

  /**
   * Fetch dynamic regions from Firestore with a static fallback.
   * The Firestore `regions` collection stores docs like:
   *   { name: "Rajasthan", slug: "rajasthan" }
   */
  static async getAllRegions(): Promise<string[]> {
    try {
      if (!db || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) return staticRegions;

      const timeoutPromise = new Promise<string[]>((_, reject) =>
        setTimeout(() => reject(new Error("Firestore timeout")), 1200),
      );

      const fetchPromise = (async () => {
        const snap = await getDocs(collection(db, 'regions'));
        const dbRegions = snap.docs
          .map((d) => d.data())
          .filter((d) => typeof d.name === 'string')
          .map((d) => d.name as string)
          .sort();
        if (dbRegions.length === 0) return staticRegions;
        return dbRegions;
      })();

      return await Promise.race([fetchPromise, timeoutPromise]);
    } catch (e) {
      console.warn('Failed to fetch regions from Firestore, falling back to static:', e);
      return staticRegions;
    }
  }
}

/**
 * Real-time subscription to the `categories` collection.
 * Returns a cleanup function. `onChange` fires whenever the collection
 * changes or on the first snapshot.
 */
export function watchCategories(
  onChange: (categories: string[]) => void,
  onError?: (err: Error) => void,
): () => void {
  if (!db || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
    onChange(staticCategories);
    return () => {};
  }

  const unsub = onSnapshot(
    collection(db, 'categories'),
    (snap) => {
      const cats = snap.docs
        .map((d) => d.data())
        .filter((d) => typeof d.name === 'string')
        .map((d) => d.name as string)
        .sort();
      onChange(cats.length > 0 ? cats : staticCategories);
    },
    (err) => {
      console.warn('Categories listener error, falling back to static:', err);
      onChange(staticCategories);
      onError?.(err);
    },
  );

  return unsub;
}
