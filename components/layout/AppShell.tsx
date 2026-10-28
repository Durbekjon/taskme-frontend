'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useUser } from '@/libs/hooks/useUser';

interface AppShellProps {
  children: React.ReactNode;
  role?: 'admin' | 'creative';
  searchPlaceholder?: string;
}

export function AppShell({ children, role = 'admin', searchPlaceholder }: AppShellProps) {
  const { user, loading } = useUser();
  const pathname = usePathname();

  // On a phone the sidebar is a drawer rather than a column, so its open
  // state lives here - the toggle is in the topbar, the panel is the sidebar.
  const [navOpen, setNavOpen] = useState(false);
  const closeNav = useCallback(() => setNavOpen(false), []);

  // Navigating away should not leave the drawer covering the new page.
  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!navOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNavOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [navOpen]);

  return (
    <div className="min-h-screen p-0 sm:p-8 md:p-12">
      <div className="page-with-sidebar glass sm:rounded-[2.5rem] overflow-hidden relative border border-white/40 shadow-2xl mx-auto max-w-[1600px] min-h-screen sm:min-h-[calc(100vh-6rem)]">
        <Sidebar
          role={role}
          user={user}
          loading={loading}
          isOpen={navOpen}
          onClose={closeNav}
        />

        {/* Tapping outside the drawer closes it. */}
        {navOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            onClick={closeNav}
            className="lg:hidden fixed inset-0 z-20 bg-black/30 backdrop-blur-sm"
          />
        )}

        <Topbar
          searchPlaceholder={searchPlaceholder}
          role={role}
          user={user}
          loading={loading}
          onOpenNav={() => setNavOpen(true)}
        />

        <main className="main-content overflow-x-hidden">
          <div className="p-4 sm:p-8 md:p-10 h-full">{children}</div>
        </main>
      </div>
    </div>
  );
}
