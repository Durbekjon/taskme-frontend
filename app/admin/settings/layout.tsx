'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { Profile2User, Cards, Setting2, Building } from 'iconsax-react';
import { BentoCard } from '@/components/ui/BentoCard';
import { motion, AnimatePresence } from 'framer-motion';

const SETTINGS_NAV = [
  { label: 'Profile Settings', href: '/admin/settings/profile', icon: Profile2User },
  { label: 'Studio Profile', href: '/admin/settings/studio', icon: Building },
  { label: 'Team Management', href: '/admin/settings/team', icon: Profile2User },
  { label: 'Billing & Plans', href: '/admin/settings/billing', icon: Cards },
  { label: 'Integrations', href: '/admin/settings/integrations', icon: Setting2 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="max-w-[1200px] mx-auto h-full flex flex-col">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your team, billing, and integrations.</p>
      </motion.div>

      <div className="grid grid-cols-12 gap-6 flex-1 items-start">
        {/* Settings Sub-nav */}
        <div className="col-span-3 sticky top-24">
          <BentoCard className="p-2">
            <motion.nav variants={containerVariants} initial="hidden" animate="show" className="space-y-1">
              {SETTINGS_NAV.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                  >
                    <motion.div
                      variants={itemVariants}
                      whileHover={{ x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className={clsx(
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                        isActive
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <Icon size={16} variant={isActive ? "Bold" : "Linear"} color="currentColor" className={isActive ? 'text-gray-900' : 'text-gray-400'} />
                      {item.label}
                    </motion.div>
                  </Link>
                );
              })}
            </motion.nav>
          </BentoCard>
        </div>

        {/* Settings Content */}
        <motion.div
          key={pathname} // triggers animation on route change
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring' as const, stiffness: 300, damping: 30 }}
          className="col-span-9"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
