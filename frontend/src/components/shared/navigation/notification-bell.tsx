'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Bell,
  CheckCheck,
  Star,
  MessageSquare,
  Package,
  AlertCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useUserRole } from '@/features/auth/hooks/use-user-role';
import type { InAppNotification } from '@/types/notification';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

function formatRelativeTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return 'Recently';
    const diffMs = Date.now() - date.getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  } catch {
    return 'Recently';
  }
}

export function NotificationBell({ className = '' }: { className?: string }) {
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const { isArtisan } = useUserRole();
  const [notifications, setNotifications] = useState<InAppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const currentUserId = user?.id || (isArtisan ? 'artisan-1' : 'default');
  const role = isArtisan ? 'artisan' : 'customer';

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/notifications?userId=${encodeURIComponent(currentUserId)}&role=${role}`);
      if (res.ok) {
        const json = await res.json();
        if (json?.data?.notifications) {
          setNotifications(json.data.notifications);
          setUnreadCount(json.data.unreadCount ?? 0);
        }
      }
    } catch (e) {
      console.warn('Could not load notifications:', e);
    } finally {
      setLoading(false);
    }
  }, [currentUserId, role]);

  useEffect(() => {
    fetchNotifications();

    // Listen to real-time notification events in browser
    const handleNewNotif = (e: Event) => {
      const customEvent = e as CustomEvent<InAppNotification>;
      if (customEvent.detail) {
        const newNotif = customEvent.detail;
        setNotifications((prev) => [newNotif, ...prev.filter((n) => n.id !== newNotif.id)]);
        setUnreadCount((prev) => prev + 1);
      }
    };

    window.addEventListener('viraasat_notification_created', handleNewNotif);
    const interval = setInterval(fetchNotifications, 45000); // 45s heartbeat

    return () => {
      window.removeEventListener('viraasat_notification_created', handleNewNotif);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  const markAsRead = async (id: string, link?: string) => {
    // Optimistic UI update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
    } catch (e) {
      console.warn('Could not mark notification read:', e);
    }

    if (link) {
      setIsOpen(false);
      router.push(link);
    }
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);

    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAll: true, userId: currentUserId }),
      });
    } catch (e) {
      console.warn('Could not mark all read:', e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'new_review':
        return <Star className="h-4 w-4 text-amber-500 fill-amber-500 shrink-0 mt-0.5" />;
      case 'artisan_response':
        return <MessageSquare className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />;
      case 'order_update':
        return <Package className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />;
      default:
        return <Bell className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />;
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={`relative text-foreground/75 hover:text-amber-800 dark:hover:text-amber-300 transition-colors ${className}`}
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-amber-600 dark:bg-amber-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-background animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 sm:w-96 p-0 shadow-2xl rounded-2xl border-amber-900/10 dark:border-amber-500/20 bg-background/95 backdrop-blur-md z-[9999]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-muted/30">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground font-heading">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-[10px] h-5 px-1.5 bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-none">
                {unreadCount} new
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-xs text-amber-800 dark:text-amber-400 hover:underline flex items-center gap-1 font-medium"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>

        {/* List of notifications */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-border/40">
          {notifications.length === 0 ? (
            <div className="py-10 px-4 text-center">
              <div className="h-10 w-10 rounded-full bg-amber-100/60 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="h-5 w-5" />
              </div>
              <p className="text-sm font-medium text-foreground">All caught up!</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-[220px] mx-auto">
                No new reviews or feedback alerts at the moment.
              </p>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id, notif.link)}
                className={`p-3.5 flex items-start gap-3 hover:bg-muted/50 cursor-pointer transition-colors ${
                  !notif.read ? 'bg-amber-50/50 dark:bg-amber-950/20' : ''
                }`}
              >
                {getIcon(notif.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <p className={`text-xs font-medium truncate ${!notif.read ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                      {notif.title}
                    </p>
                    <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-foreground/80 mt-1 line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>
                  {notif.link && (
                    <div className="mt-1.5 flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-400 font-medium">
                      <span>View details</span>
                      <ExternalLink className="h-3 w-3" />
                    </div>
                  )}
                </div>
                {!notif.read && (
                  <span className="h-2 w-2 rounded-full bg-amber-600 dark:bg-amber-400 shrink-0 mt-1.5" />
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-border/60 bg-muted/20 text-center">
          {isArtisan ? (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="w-full text-xs text-amber-800 dark:text-amber-400 hover:text-amber-900"
              onClick={() => setIsOpen(false)}
            >
              <Link href="/artisan/reviews">
                Manage All Product Reviews & Feedback →
              </Link>
            </Button>
          ) : (
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="w-full text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setIsOpen(false)}
            >
              <Link href="/orders">
                View Past Orders & Leave Reviews →
              </Link>
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

