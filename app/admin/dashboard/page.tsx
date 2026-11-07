'use client';

import type { Metadata } from 'next';
import { motion, type Variants } from 'framer-motion';
import {
   Moneys, VideoPlay, Profile2User, Clock, Add,
   More, Export, DocumentText, Eye,
   TrendUp, TickCircle, InfoCircle, Flash, ArrowLeft2, ArrowRight2
} from 'iconsax-react';
import { BentoCard } from '@/components/ui/BentoCard';
import { StatWidget } from '@/components/ui/StatWidget';
import { GlassButton } from '@/components/ui/GlassButton';
import { Badge } from '@/components/ui/Badge';
import { MiniBarChart } from '@/components/ui/MiniBarChart';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { financeApi, teamApi } from '@/libs/endpoints';
import { apiErrorMessage } from '@/libs/api';
import { money } from '@/libs/format';
import { useBookings } from '@/hooks/api/useBookings';
import { BookingStatus, type StudioFinanceSummary } from '@/types/api';
import {
   OngoingProjectsCard,
   ScheduleCard,
   RecentExpensesCard,
   TeamOverviewCard,
} from '@/components/admin/dashboard';

const containerVariants: Variants = {
   hidden: { opacity: 0 },
   visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants: Variants = {
   hidden: { opacity: 0, y: 16 },
   visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};

export default function AdminDashboardPage() {
   const router = useRouter();

   // These three widgets used to display hard-coded figures ($124,500 / 14 /
   // 42) while /finance/summary and /users/team already served the real ones.
   const [summary, setSummary] = useState<StudioFinanceSummary | null>(null);
   const [teamSize, setTeamSize] = useState<number | null>(null);
   const { bookings, fetchBookings } = useBookings();

   useEffect(() => {
      let cancelled = false;
      (async () => {
         try {
            const [financeSummary, team] = await Promise.all([
               financeApi.studioSummary(),
               teamApi.get(),
               fetchBookings(),
            ]);
            if (cancelled) return;
            setSummary(financeSummary);
            setTeamSize(team.active.length);
         } catch (error) {
            if (!cancelled) {
               toast.error(apiErrorMessage(error, 'Failed to load dashboard data'));
            }
         }
      })();
      return () => {
         cancelled = true;
      };
   }, [fetchBookings]);

   const activeBookings = bookings.filter(
      (b) =>
         b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.IN_PROGRESS,
   );
   const draftBookings = bookings.filter((b) => b.status === BookingStatus.DRAFT);
   const today = new Date().toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
   });

   return (
      <motion.div
         variants={containerVariants}
         initial="hidden"
         animate="visible"
         className="space-y-4"
      >
         {/* ── Page Header ─────────────────────────────────────────── */}
         <motion.div variants={itemVariants} className="flex items-center justify-between">
            <div>
               <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Management</h1>
               <p className="text-sm text-gray-500 mt-0.5">{today} · Studio Overview</p>
            </div>
            <GlassButton
               variant="primary"
               size="md"
               icon={Add}
               id="dashboard-new-booking-btn"
               onClick={() => router.push('/admin/bookings/new')}
            >
               New Booking
            </GlassButton>
         </motion.div>

         {/* ── Bento Grid ──────────────────────────────────────────── */}
         <div className="grid grid-cols-12 gap-4 auto-rows-auto">

            {/* Row 1: Stat Cards × 4 */}
            <motion.div variants={itemVariants} className="col-span-12 sm:col-span-6 xl:col-span-3">
               <BentoCard variant="light" className="h-full">
                  <StatWidget
                     label="Total revenue"
                     value={money(summary?.revenue)}
                     icon={Moneys}
                     subtext={`Net profit: ${money(summary?.studioProfit)}`}
                  />
               </BentoCard>
            </motion.div>

            <motion.div variants={itemVariants} className="col-span-12 sm:col-span-6 xl:col-span-3">
               <BentoCard variant="light" className="h-full">
                  <StatWidget
                     label="Active bookings"
                     value={String(activeBookings.length)}
                     icon={VideoPlay}
                     subtext={`${draftBookings.length} draft${draftBookings.length === 1 ? '' : 's'}`}
                  />
               </BentoCard>
            </motion.div>

            <motion.div variants={itemVariants} className="col-span-12 sm:col-span-6 xl:col-span-3">
               <BentoCard variant="light" className="h-full">
                  <StatWidget
                     label="Team members"
                     value={teamSize === null ? '—' : String(teamSize)}
                     icon={Profile2User}
                     subtext={`Owed to crew: ${money(summary?.workerBalance)}`}
                  />
               </BentoCard>
            </motion.div>

            <motion.div variants={itemVariants} className="col-span-12 sm:col-span-6 xl:col-span-3">
               <OngoingProjectsCard />
            </motion.div>

            {/* Row 2: Schedule (wide) + Dark File Preview */}
            <motion.div variants={itemVariants} className="col-span-12">
               <ScheduleCard />
            </motion.div>

            {/* Row 3: Recent spend | Team */}
            <motion.div variants={itemVariants} className="col-span-12 md:col-span-4">
               <RecentExpensesCard />
            </motion.div>

            <motion.div variants={itemVariants} className="col-span-12 md:col-span-8">
               <TeamOverviewCard />
            </motion.div>
         </div>
      </motion.div>
   );
}


