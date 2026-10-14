import { apiClient } from '@/core/api/client';
import type { UserProfile, UserRole } from '@/types/user';

export const usersApi = {
  /**
   * Fetch user profile by ID.
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    return apiClient.get<UserProfile>(`users/${userId}`);
  },

  /**
   * Update or sync user role.
   */
  async syncRole(userId: string, role: UserRole): Promise<{ success: boolean; role: UserRole }> {
    return apiClient.post<{ success: boolean; role: UserRole }>('users', { userId, role });
  },
};
