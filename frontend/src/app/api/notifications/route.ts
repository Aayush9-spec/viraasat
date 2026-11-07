import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { NotificationService } from '@/features/notifications/notification-service';
import { apiSuccess, handleApiError, apiError } from '@/core/api/api-response';
import { logSecurityEvent } from '@/lib/security-logger';
import { getClientIp } from '@/lib/rate-limiter';

export async function GET(req: NextRequest) {
  const ip = getClientIp(req);

  try {
    const authSession = await auth();
    const authUserId = authSession.userId;
    const authRole = (authSession.sessionClaims?.metadata as any)?.role || (authSession.sessionClaims as any)?.role;

    if (!authUserId) {
      logSecurityEvent({
        type: 'AUTH_UNAUTHORIZED_ACCESS',
        ip,
        path: '/api/notifications',
        details: { action: 'unauthenticated read notifications' },
      });
      return NextResponse.json({ error: 'Unauthorized: Authentication required to view notifications' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const queryUserId = searchParams.get('userId');

    // Prevent IDOR: users can only fetch their own notifications unless admin
    if (queryUserId && queryUserId !== authUserId && authRole !== 'admin') {
      logSecurityEvent({
        type: 'RBAC_PRIVILEGE_VIOLATION',
        userId: authUserId,
        ip,
        path: '/api/notifications',
        details: { attemptedUserId: queryUserId, action: 'BOLA read notifications' },
      });
      return NextResponse.json({ error: 'Forbidden: Cannot access another user notifications' }, { status: 403 });
    }

    const targetUserId = authUserId;
    const roleParam = (searchParams.get('role') || authRole || 'customer') as any;

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
  const ip = getClientIp(req);

  try {
    const authSession = await auth();
    const authUserId = authSession.userId;
    const authRole = (authSession.sessionClaims?.metadata as any)?.role || (authSession.sessionClaims as any)?.role;

    if (!authUserId) {
      logSecurityEvent({
        type: 'AUTH_UNAUTHORIZED_ACCESS',
        ip,
        path: '/api/notifications',
        details: { action: 'unauthenticated patch notifications' },
      });
      return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { notificationId, markAll } = body;

    if (markAll) {
      // Enforce updating only own notifications
      await NotificationService.markAllAsRead(authUserId);
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
