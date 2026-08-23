import { artisans } from '@/lib/data';
import type { Artisan } from '@/lib/types';
import { db } from '@/services/firebase/firestore';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';

export class ArtisanService {
  static getLocalArtisanById(id: string): Artisan | undefined {
    return artisans.find(a => a.id === id);
  }

  static async getCloudArtisan(id: string): Promise<Artisan | null> {
    try {
      const docRef = doc(db, 'artisans', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as Artisan;
      }
      return null;
    } catch (e) {
      console.warn("Firestore not initialized or offline: returning fallback local profile.");
      return this.getLocalArtisanById(id) || null;
    }
  }

  static async saveCloudArtisan(artisan: Artisan): Promise<void> {
    try {
      const docRef = doc(db, 'artisans', artisan.id);
      await setDoc(docRef, artisan);
    } catch (e) {
      console.error("Failed to save artisan to firestore:", e);
    }
  }
}
