import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser as clerkCurrentUser } from '@clerk/nextjs/server';
import { NotificationService } from '@/features/notifications/notification-service';
import { apiSuccess, handleApiError, apiError } from '@/core/api/api-response';

export async function GET(req: NextRequest) {
  try {
    let authUserId: string | null = null;
    let authRole: string | undefined = undefined;

    try {
      const authSession = await auth();
      authUserId = authSession.userId;
      authRole = (authSession.sessionClaims?.metadata as any)?.role || (authSession.sessionClaims as any)?.role;
    } catch {}

    const { searchParams } = new URL(req.url);
    const queryUserId = searchParams.get('userId');
    const roleParam = (searchParams.get('role') || authRole || 'customer') as any;

    const targetUserId = authUserId || queryUserId || 'artisan-1';

    const result = await NotificationService.getNotificationsForUser(targetUserId, roleParam);

    return apiSuccess({
      notifications: result.notifications,
      unreadCount: result.unreadCount,
    });
  } catch (err) {
    return handleApiError(err, 'Failed to fetch notifications');
  }
}

export async function PATCH(req: NextRequest) {
  try {
    let authUserId: string | null = null;
    try {
      const authSession = await auth();
      authUserId = authSession.userId;
    } catch {}

    const body = await req.json().catch(() => ({}));
    const { notificationId, markAll } = body;

    if (markAll) {
      const userId = body.userId || authUserId;
      if (!userId) {
        return apiError('User ID is required to mark all notifications as read', 400);
      }
      await NotificationService.markAllAsRead(userId);
      return apiSuccess({ success: true, message: 'All notifications marked as read' });
    }

    if (!notificationId) {
      return apiError('Notification ID is required', 400);
    }

    await NotificationService.markAsRead(notificationId);
    return apiSuccess({ success: true, message: 'Notification marked as read' });
  } catch (err) {
    return handleApiError(err, 'Failed to update notification');
  }
}
