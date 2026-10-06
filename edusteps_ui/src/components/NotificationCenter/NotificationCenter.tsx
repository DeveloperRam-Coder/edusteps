import { useState, useEffect, useCallback, type FC } from 'react';
import { Bell, X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

type NotificationCenterProps = {
  /** Extra classes for the bell trigger (e.g. min touch target on mobile) */
  triggerClassName?: string
  /** Feed in an external unread count (e.g. from recent activity) to show on the badge */
  externalUnreadCount?: number
}

export const NotificationCenter: FC<NotificationCenterProps> = ({ triggerClassName, externalUnreadCount }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = (notifications.filter(n => !n.read).length) + (externalUnreadCount ?? 0);

  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error': return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'info': return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      const t = e.target as HTMLElement
      if (t.closest('[data-notification-root]')) return
      setIsOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen])

  // Simulate real-time notifications - disabled to prevent reload issues
  // useEffect(() => {
  //   const interval = setInterval(() => {
  //     const randomEvents = [
  //       { type: 'info' as const, title: 'System Update', message: 'New features available' },
  //       { type: 'success' as const, title: 'Backup Complete', message: 'Data backup completed successfully' },
  //       { type: 'warning' as const, title: 'Storage Warning', message: 'Storage is 80% full' }
  //     ];
      
  //     if (Math.random() > 0.7) { // 30% chance every 30 seconds
  //       const event = randomEvents[Math.floor(Math.random() * randomEvents.length)];
  //       addNotification(event);
  //     }
  //   }, 30000);

  //   return () => clearInterval(interval);
  // }, [addNotification]);

  return (
    <div className="relative" data-notification-root>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl p-2 text-muted-foreground touch-manipulation transition-all hover:bg-accent hover:text-foreground',
          triggerClassName
        )}
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white"
            aria-label={`${unreadCount} unread notifications`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed left-3 right-3 top-[calc(env(safe-area-inset-top)+3.5rem+0.25rem)] z-[100] max-h-[min(24rem,calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom)-8rem))] overflow-hidden rounded-2xl border border-border bg-card/95 shadow-lg backdrop-blur-md sm:left-auto sm:right-4 sm:w-80 sm:max-w-none lg:top-[calc(env(safe-area-inset-top)+4rem+0.25rem)]">
          <div className="border-b border-border p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-foreground">Notifications</h3>
              <div className="flex items-center gap-2">
                {notifications.length > 0 && (
                  <>
                    <button
                      onClick={markAllAsRead}
                      className="text-sm text-primary hover:underline"
                    >
                      Mark all read
                    </button>
                    <button
                      onClick={clearAll}
                      className="text-sm text-destructive hover:underline"
                    >
                      Clear all
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground touch-manipulation"
                  aria-label="Close notifications"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto overscroll-y-contain">
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-base text-muted-foreground">
                No notifications
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`border-b border-border/60 p-4 hover:bg-accent/60 ${
                    !notification.read ? 'bg-primary/10' : ''
                  }`}
                  onClick={() => markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    {getIcon(notification.type)}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {notification.title}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      <p className="mt-2 text-xs text-muted-foreground/90">
                        {notification.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeNotification(notification.id);
                      }}
                      className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground touch-manipulation"
                      aria-label="Dismiss"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationCenter;