'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Home, Calendar, Profile2User, EmptyWallet, ChartSquare,
  Setting2, Logout, VideoPlay, ArrowRight2, Folder
} from 'iconsax-react';
import { ChevronRight } from 'lucide-react';
import { displayName, useUser } from '@/libs/user-context';
import { initials } from '@/libs/format';
import type { AuthUser as User } from '@/types/api';
import Loader from '@/components/ui/Loader';
import { clsx } from 'clsx';
import React from 'react';

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  subItems?: { label: string; href: string }[];
}

const ADMIN_NAV: NavItem[] = [
  { label: 'Dashboard',  href: '/admin/dashboard',  icon: Home },

  { label: 'Bookings',   href: '/admin/bookings',   icon: Folder },
  { label: 'Crew',       href: '/admin/crew',       icon: Calendar },
  { label: 'Finance',    href: '/admin/finance',    icon: EmptyWallet },
  { 
    label: 'Payments', 
    icon: EmptyWallet, 
    subItems: [
      { label: 'Client payments', href: '/admin/payments/clients' },
      { label: 'Crew payouts', href: '/admin/payments/crew' }
    ]
  },
  { label: 'Settings',   href: '/admin/settings/team', icon: Setting2 },
];

const CREATIVE_NAV: NavItem[] = [
  { label: 'Dashboard',  href: '/creative/dashboard', icon: Home },
  { label: 'My Tasks',   href: '/creative/tasks',     icon: Folder },
  { label: 'Schedule',   href: '/creative/schedule',  icon: Calendar },
  { label: 'Earnings',   href: '/creative/earnings',  icon: EmptyWallet },
  { label: 'Settings',   href: '/creative/settings/profile', icon: Setting2 },
];

interface SidebarProps {
  role?: 'admin' | 'creative';
  user?: User | null;
  loading?: boolean;
  /** Below lg the sidebar is an off-canvas drawer; above it, always visible. */
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({
  role = 'admin',
  user,
  loading,
  isOpen = false,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const navItems = role === 'admin' ? ADMIN_NAV : CREATIVE_NAV;

  const [expandedItems, setExpandedItems] = React.useState<Record<string, boolean>>({});
  
  // Logout goes through the shared session helper so the cookie the proxy
  // reads is cleared too - removing only localStorage left the route guard
  // thinking the user was still signed in.
  const { logout } = useUser();
  const handleLogout = () => logout();

  const fullName = displayName(user ?? null);
  const roleTitle = role === 'admin' ? 'Studio' : 'Creative';

  return (
    <aside
      className={clsx(
        'bg-white/80 lg:bg-transparent backdrop-blur-xl lg:backdrop-blur-none',
        'flex flex-col z-30 select-none border-r border-black/5',
        'fixed inset-y-0 left-0 w-[260px] transition-transform duration-200 ease-out',
        'lg:absolute lg:top-0 lg:bottom-0 lg:inset-y-auto lg:w-[var(--sidebar-width)] lg:translate-x-0',
        isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full',
      )}
      aria-hidden={!isOpen ? undefined : undefined}
    >
      <div className="sticky top-0 flex flex-col">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-6 py-6 border-b border-black/5">
          {role === 'admin' && user?.studio?.logoUrl ? (
            <div className="w-8 h-8 rounded-full flex items-center justify-center shadow-sm overflow-hidden border border-black/5 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={user.studio.logoUrl} alt="Studio Logo" className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-black flex items-center justify-center shadow-sm flex-shrink-0">
              <VideoPlay color="#FFF" size={14} variant="Bold" />
            </div>
          )}
          <div className="min-w-0">
            <p className="font-bold text-sm text-gray-900 leading-tight truncate">
              {role === 'admin' && user?.studio?.name ? user.studio.name : 'Task.me'}
            </p>
            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide truncate">
              {role === 'admin' ? 'Production Studio' : 'Creative Portal'}
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-3 py-4 space-y-0.5">
          {navItems.map((item) => {
            const hasSubItems = !!item.subItems?.length;
            const isActive = item.href 
              ? (pathname === item.href || pathname.startsWith(item.href + '/')) 
              : item.subItems?.some(s => pathname === s.href || pathname.startsWith(s.href + '/'));
            const isExpanded = expandedItems[item.label] || isActive;
            
            const Icon = item.icon;
            
            const content = (
                <motion.div
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                     if (hasSubItems) {
                        setExpandedItems(prev => ({ ...prev, [item.label]: !prev[item.label] }));
                     }
                  }}
                  className={clsx(
                    'flex items-center gap-3 px-4 py-2.5 rounded-full cursor-pointer transition-colors group',
                    isActive && !hasSubItems
                      ? 'bg-black text-white shadow-md'
                      : 'text-gray-500 hover:bg-black/5 hover:text-gray-900',
                    isActive && hasSubItems ? 'text-black font-bold bg-black/5' : ''
                  )}
                >
                  <Icon
                    color="currentColor"
                    size={16}
                    className={clsx(
                      isActive && !hasSubItems ? 'text-white' : 'text-gray-400 group-hover:text-gray-600', 
                      isActive && hasSubItems ? 'text-black' : ''
                    )}
                    variant={isActive ? "Bold" : "Linear"}
                  />
                  <span className={clsx('text-sm font-medium', isActive && !hasSubItems ? 'text-white' : '')}>
                    {item.label}
                  </span>
                  {hasSubItems ? (
                     <ChevronRight size={14} className={clsx("ml-auto transition-transform text-gray-400", isExpanded ? "rotate-90" : "")} />
                  ) : isActive && (
                    <ArrowRight2 color="currentColor" size={14} className="ml-auto text-white/50" variant="Linear" />
                  )}
                </motion.div>
            );

            return (
              <div key={item.label} className="flex flex-col">
                 {item.href && !hasSubItems ? <Link href={item.href}>{content}</Link> : content}
                 
                 {hasSubItems && isExpanded && (
                    <div className="ml-8 mt-1 mb-1 space-y-1 border-l-2 border-black/5 pl-2">
                       {item.subItems!.map(sub => {
                          const isSubActive = pathname === sub.href || pathname.startsWith(sub.href + '/');
                          return (
                             <Link key={sub.href} href={sub.href}>
                               <div className={clsx(
                                 "px-3 py-1.5 text-xs rounded-lg transition-colors cursor-pointer",
                                 isSubActive ? "bg-black text-white font-bold" : "text-gray-500 hover:text-gray-900 hover:bg-black/5"
                               )}>
                                 {sub.label}
                               </div>
                             </Link>
                          )
                       })}
                    </div>
                 )}
              </div>
            );
          })}
        </nav>

        {/* Profile & Logout — Positioned higher up, right under navigation */}
        <div className="px-3 pt-1 pb-4">
          <div className="pt-2 border-t border-black/5">
            <div
              onClick={handleLogout}
              id="sidebar-logout-btn"
              title="Sign out"
              className="flex items-center gap-3 px-3 py-2 rounded-2xl hover:bg-red-50/70 hover:border-red-100 border border-transparent cursor-pointer transition-all group"
            >
              {loading ? (
                <div className="flex-1 flex justify-center py-2"><Loader size="sm" /></div>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-gray-900 flex items-center justify-center text-white text-xs font-bold shadow-sm group-hover:bg-red-600 transition-colors overflow-hidden flex-shrink-0">
                    {user?.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={user.avatarUrl} alt={fullName} className="w-full h-full object-cover" />
                    ) : (
                      initials(fullName, role === 'admin' ? 'ST' : 'CR')
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-gray-800 group-hover:text-red-900 transition-colors truncate">
                      {fullName || '—'}
                    </p>
                    <p className="text-[10px] text-gray-400 group-hover:text-red-600/70 transition-colors truncate">
                      {user?.studio?.name || roleTitle}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleLogout();
                    }}
                    title="Sign out"
                    className="p-1.5 rounded-lg text-gray-400 group-hover:text-red-600 hover:bg-red-100/80 transition-colors flex-shrink-0"
                  >
                    <Logout color="currentColor" size={16} variant="Linear" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
