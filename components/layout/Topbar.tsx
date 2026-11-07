'use client';

import { SearchNormal1, Notification, Setting2, InfoCircle, HambergerMenu } from 'iconsax-react';
import { motion } from 'framer-motion';
import { displayName } from '@/libs/user-context';
import { initials } from '@/libs/format';
import type { AuthUser as User, Notification as AppNotification } from '@/types/api';
import Loader from '@/components/ui/Loader';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { apiErrorMessage } from '@/libs/api';
import { notificationsApi, teamApi } from '@/libs/endpoints';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import { useSocket } from '@/libs/hooks/useSocket';

import Link from 'next/link';

interface TopbarProps {
  searchPlaceholder?: string;
  role?: 'admin' | 'creative';
  user?: User | null;
  loading?: boolean;
  /** Opens the navigation drawer on small screens. */
  onOpenNav?: () => void;
}

export function Topbar({
  searchPlaceholder = 'Search...',
  role = 'admin',
  user,
  loading,
  onOpenNav,
}: TopbarProps) {
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { on } = useSocket();

  // The route reads the user from the JWT; it used to take the id from the
  // path, on a controller that required no authentication at all.
  const fetchNotifications = async () => {
    try {
      const data = await notificationsApi.list();
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.read).length);
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id]);

  // Real-time: prepend new notifications as they arrive via WebSocket.
  useEffect(() => {
    return on('notification', (event) => {
      const newNotif: AppNotification = {
        id: event.id ?? `ws-${Date.now()}`,
        userId: user?.id ?? '',
        title: event.title,
        message: event.message,
        type: event.type,
        referenceId: event.referenceId ?? null,
        read: false,
        createdAt: event.createdAt ?? new Date().toISOString(),
      };
      setNotifications((prev) => [newNotif, ...prev]);
      setUnreadCount((n) => n + 1);
      toast(event.title, { icon: '🔔', duration: 4000 });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on, user?.id]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsApi.markRead(id);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  // One request instead of one per notification.
  const handleMarkAllAsRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(notifications.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Failed to mark notifications as read'));
    }
  };

  const handleRespond = async (
    e: React.MouseEvent,
    n: AppNotification,
    action: 'accept' | 'reject',
  ) => {
    e.stopPropagation(); // prevent markAsRead trigger
    try {
      if (!n.referenceId) return;
      await teamApi.respond(n.referenceId, action);
      setNotifications(notifications.map(notif => notif.id === n.id ? { ...notif, read: true } : notif));
      setUnreadCount(prev => Math.max(0, prev - 1));
      toast.success(action === 'accept' ? 'Invite accepted!' : 'Invite declined.');
      
      // Reload the page to refresh user data (like their new studio)
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      toast.error('Failed to respond to invite.');
    }
  };

  const fullName = displayName(user ?? null);
  // There is no /admin/settings/profile page; team is the admin landing.
  const profileHref =
    role === 'admin' ? '/admin/settings/team' : '/creative/settings/profile';
  const getInitials = (name?: string) =>
    initials(name || fullName, role === 'admin' ? 'ST' : 'CR');

  return (
    <header
      style={{ height: 'var(--topbar-height)', left: 'var(--sidebar-width)' }}
      className="absolute top-0 right-0 z-20 bg-white/70 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none border-b border-black/5 flex items-center px-4 sm:px-8 gap-2 sm:gap-4"
    >
      <button
        type="button"
        onClick={onOpenNav}
        aria-label="Open navigation"
        className="lg:hidden p-2 -ml-1 rounded-xl text-gray-600 hover:bg-black/5 transition-colors shrink-0"
      >
        <HambergerMenu color="currentColor" size={22} />
      </button>

      {/* Search */}
      <div className="flex-1 min-w-0 max-w-md">
        <div className="relative group">
          <SearchNormal1 color="currentColor" 
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-800 transition-colors"
            variant="Linear"
          />
          <input
            id="topbar-search"
            type="text"
            placeholder={searchPlaceholder}
            className="w-full pl-10 pr-14 py-2 bg-white border border-gray-300 rounded-2xl text-sm text-gray-900 placeholder:text-gray-500 focus:outline-none focus:border-gray-400 focus:ring-4 focus:ring-black/5 shadow-sm hover:border-gray-400 transition-all"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
            <kbd className="hidden sm:inline-flex items-center justify-center min-w-[20px] h-5 text-[10px] font-medium text-gray-400 bg-black/5 border border-black/5 rounded-md">⌘</kbd>
            <kbd className="hidden sm:inline-flex items-center justify-center min-w-[20px] h-5 text-[10px] font-medium text-gray-400 bg-black/5 border border-black/5 rounded-md">K</kbd>
          </div>
        </div>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Studio name. This used to link to `/studio/<slug>`, a route that
          does not exist in the app. */}
      {user?.studio?.name && (
        <span
          className="text-sm font-semibold text-gray-700 hidden md:block"
        >
          {user.studio.name}
        </span>
      )}

      {/* Actions */}
      <div className="flex items-center gap-1">
        <div className="hidden sm:block">
          <TopbarIconButton icon={InfoCircle} label="Help" />
        </div>
        <div className="relative">
          <TopbarIconButton icon={Notification} label="Notifications" badge={unreadCount} onClick={() => setShowNotifications(!showNotifications)} />
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
              <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                <h3 className="font-semibold text-sm text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-medium">{unreadCount} New</span>
                )}
              </div>
              <div className="max-h-[350px] overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-sm text-gray-500">No notifications yet</div>
                ) : (
                  notifications.map(n => (
                    <div 
                      key={n.id} 
                      onClick={() => !n.read && handleMarkAsRead(n.id)}
                      className={`p-3 border-b border-gray-50 transition-colors cursor-pointer ${n.read ? 'bg-white opacity-60' : 'hover:bg-gray-50'}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`text-sm ${n.read ? 'font-medium text-gray-700' : 'font-bold text-gray-900'}`}>{n.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                          
                          {n.type === 'TEAM_INVITE' && !n.read && (
                            <div className="flex gap-2 mt-3">
                              <button 
                                onClick={(e) => handleRespond(e, n, 'accept')}
                                className="px-3 py-1.5 bg-black text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors"
                              >
                                Accept
                              </button>
                              <button 
                                onClick={(e) => handleRespond(e, n, 'reject')}
                                className="px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                              >
                                Decline
                              </button>
                            </div>
                          )}
                        </div>
                        {!n.read && <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1" />}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                      </p>
                    </div>
                  ))
                )}
              </div>
              {unreadCount > 0 && (
                <div className="p-2 border-t border-gray-50 text-center">
                  <button onClick={handleMarkAllAsRead} className="text-xs text-blue-600 hover:text-blue-800 font-medium">Mark all as read</button>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="hidden sm:block">
          <TopbarIconButton
            icon={Setting2}
            label="Settings"
            onClick={() => router.push(profileHref)}
          />
        </div>

        {/* Profile Quick Action */}
        <div className="flex items-center sm:pl-2 sm:border-l border-white/20">
          {loading ? (
            <div className="w-9 h-9 flex items-center justify-center"><Loader size="sm" /></div>
          ) : (
            <div 
              className="w-9 h-9 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white font-medium cursor-pointer hover:bg-white/20 transition-colors shadow-sm overflow-hidden"
              onClick={() => router.push(profileHref)}
              title="View Profile"
            >
              {user?.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={fullName} className="w-full h-full object-cover" />
              ) : (
                getInitials(fullName)
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function TopbarIconButton({
  icon: Icon,
  label,
  badge,
  onClick,
}: {
  icon: React.ElementType;
  label: string;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className="relative w-9 h-9 flex items-center justify-center rounded-full bg-black text-white shadow-md hover:bg-gray-900 transition-colors cursor-pointer"
      aria-label={label}
      id={`topbar-${label.toLowerCase().replace(' ', '-')}`}
    >
      <Icon color="currentColor" size={16} variant="Linear" />
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-white rounded-full text-[9px] text-black font-bold flex items-center justify-center shadow-sm">
          {badge}
        </span>
      )}
    </motion.button>
  );
}
