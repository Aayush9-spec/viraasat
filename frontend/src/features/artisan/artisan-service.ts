import { artisans } from '@/lib/data';
import type { Artisan } from '@/lib/types';

export class ArtisanService {
  static getLocalArtisanById(id: string): Artisan | undefined {
    return artisans.find((a) => a.id === id);
  }

  static async getCloudArtisan(id: string): Promise<Artisan | null> {
    try {
      const response = await fetch(`/api/artisans?id=${encodeURIComponent(id)}`);
      if(!response.ok)throw new Error('Artisan unavailable');
      const data = (await response.json()).data?.artisans?.[0];
      if(!data)throw new Error('Artisan not found');

      return {
        id: data.id,
        name: data.name ?? '',
        shopName: data.name ?? '',
        bio: data.bio ?? '',
        profilePicture: data.avatarUrl ?? '',
        location: data.region ?? '',
        story: '',
        contactEmail: '',
        socialLinks: {},
        createdAt: data.created_at ?? new Date().toISOString(),
        updatedAt: data.created_at ?? new Date().toISOString(),
      } satisfies Artisan;
    } catch (e) {
      console.warn('Supabase offline or user not found: returning fallback local profile.');
      return this.getLocalArtisanById(id) || null;
    }
  }

  static async saveCloudArtisan(artisan: Artisan): Promise<void> {
    const response = await fetch(`/api/users/${encodeURIComponent(artisan.id)}`, {method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:artisan.name,bio:artisan.bio,region:artisan.location,...(artisan.profilePicture?.startsWith('https://') ? {avatarUrl:artisan.profilePicture} : {})})});
    if(!response.ok)throw new Error('Artisan profile was not saved');
  }
}
