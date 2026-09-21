import { artisans } from '@/lib/data';
import type { Artisan } from '@/lib/types';
import { supabase } from '@/services/supabase';

export class ArtisanService {
  static getLocalArtisanById(id: string): Artisan | undefined {
    return artisans.find((a) => a.id === id);
  }

  static async getCloudArtisan(id: string): Promise<Artisan | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;

      return {
        id: data.id,
        name: data.display_name ?? '',
        shopName: data.display_name ?? '',
        bio: data.bio ?? '',
        profilePicture: data.avatar_url ?? '',
        location: data.region ?? '',
        story: '',
        contactEmail: data.email,
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
    try {
      const { error } = await supabase
        .from('users')
        .upsert({
          id: artisan.id,
          display_name: artisan.name,
          avatar_url: artisan.profilePicture,
          bio: artisan.bio,
          region: artisan.location,
        });

      if (error) throw error;
    } catch (e) {
      console.error('Failed to save artisan to Supabase:', e);
    }
  }
}
