import { supabase } from '@/services/supabase';
import type { InAppNotification, NotificationType, RecipientRole } from '@/types/notification';

// In-memory fallback notification store for resilience
const MEMORY_NOTIFICATIONS: InAppNotification[] = [];

export interface CreateNotificationParams {
  userId: string;
  recipientRole: RecipientRole;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}

export class NotificationService {
  /**
   * Dispatches an in-app notification to a customer or artisan.
   */
  static async createNotification(params: CreateNotificationParams): Promise<InAppNotification> {
    const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `notif-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const now = new Date().toISOString();

    const notif: InAppNotification = {
      id,
      userId: params.userId,
      recipientRole: params.recipientRole,
      type: params.type,
      title: params.title,
      message: params.message,
      link: params.link,
      read: false,
      metadata: params.metadata || {},
      createdAt: now,
      updatedAt: now,
    };

    // Store in memory cache
    MEMORY_NOTIFICATIONS.unshift(notif);
    if (MEMORY_NOTIFICATIONS.length > 200) {
      MEMORY_NOTIFICATIONS.pop();
    }

    // Persist to Supabase `notifications` table if available
    try {
      const { error } = await supabase.from('notifications').insert({
        id,
        user_id: params.userId,
        recipient_role: params.recipientRole,
        type: params.type,
        title: params.title,
        message: params.message,
        link: params.link,
        read: false,
        metadata: params.metadata || {},
        created_at: now,
      });

      if (error) {
        // Table may not exist yet if migration has not been run
        console.warn('Notice: Supabase notifications insert fallback:', error.message);
      }
    } catch (e) {
      console.warn('Notice: Supabase notifications write unavailable:', e);
    }

    // Broadcast in client runtime if window is available
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('viraasat_notification_created', { detail: notif }));
    }

    return notif;
  }

  /**
   * Retrieves all notifications for a given user.
   */
  static async getNotificationsForUser(
    userId: string,
    role?: RecipientRole
  ): Promise<{ notifications: InAppNotification[]; unreadCount: number }> {
    let dbNotifications: InAppNotification[] = [];

    if (userId) {
      try {
        let query = supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false });

        if (userId) {
          query = query.or(`user_id.eq.${userId},user_id.eq.artisan-1,user_id.eq.default,user_id.eq.all`);
        }

        const { data, error } = await query.limit(50);
        if (!error && data) {
          dbNotifications = data.map((r) => ({
            id: r.id,
            userId: r.user_id,
            recipientRole: r.recipient_role as RecipientRole,
            type: r.type as NotificationType,
            title: r.title,
            message: r.message,
            link: r.link,
            read: Boolean(r.read),
            metadata: r.metadata || {},
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          }));
        }
      } catch (e) {
        console.warn('Could not query Supabase notifications:', e);
      }
    }

    // Merge memory notifications with DB results, deduplicating by ID
    const mergedMap = new Map<string, InAppNotification>();
    
    // Add memory notifications that match user
    MEMORY_NOTIFICATIONS.filter((n) => {
      if (!userId) return true;
      return n.userId === userId || n.userId === 'all' || n.userId === 'artisan-1';
    }).forEach((n) => mergedMap.set(n.id, n));

    // Add DB notifications
    dbNotifications.forEach((n) => mergedMap.set(n.id, n));

    const notifications = Array.from(mergedMap.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const unreadCount = notifications.filter((n) => !n.read).length;

    return { notifications, unreadCount };
  }

  /**
   * Marks a notification as read.
   */
  static async markAsRead(id: string): Promise<boolean> {
    const mem = MEMORY_NOTIFICATIONS.find((n) => n.id === id);
    if (mem) mem.read = true;

    try {
      await supabase.from('notifications').update({ read: true, updated_at: new Date().toISOString() }).eq('id', id);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Marks all notifications for a user as read.
   */
  static async markAllAsRead(userId: string): Promise<boolean> {
    MEMORY_NOTIFICATIONS.forEach((n) => {
      if (n.userId === userId || n.userId === 'all') n.read = true;
    });

    try {
      await supabase.from('notifications').update({ read: true, updated_at: new Date().toISOString() }).eq('user_id', userId);
      return true;
    } catch {
      return false;
    }
  }
}
