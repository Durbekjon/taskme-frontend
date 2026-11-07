'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { BentoCard } from '@/components/ui/BentoCard';
import { More } from 'iconsax-react';
import { useBookings } from '@/hooks/api/useBookings';
import { money } from '@/libs/format';
import { BookingStatus } from '@/types/api';

export function OngoingProjectsCard() {
   const { bookings, loading, fetchBookings } = useBookings();

   useEffect(() => {
      fetchBookings().catch(() => {
         /* the hook exposes the error; the empty state below covers the UI */
      });
   }, [fetchBookings]);

   // "Ongoing" means confirmed or running - a draft or a cancelled booking is
   // not active work. The card used to count every row the API returned.
   const ongoing = bookings.filter(
      (b) =>
         b.status === BookingStatus.CONFIRMED || b.status === BookingStatus.IN_PROGRESS,
   );

   const colors = ['#4F46E5', '#7C3AED', '#EC4899', '#10B981', '#F59E0B'];

   return (
      <BentoCard variant="light" className="h-full p-4 flex flex-col justify-between">
         <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Ongoing Bookings</p>
            <More color="currentColor"  size={14} className="text-gray-400" />
         </div>
         
         <div className="flex items-end justify-between mb-1">
            <div>
               <p className="text-2xl font-bold text-gray-900 leading-none">{ongoing.length}</p>
               <p className="text-[10px] text-gray-400 mt-1">Active Bookings</p>
            </div>
            {/* Sparkline chart beside text */}
            <div className="w-16 h-8">
               <svg viewBox="0 0 200 60" className="w-full h-full" preserveAspectRatio="none">
                  <path
                     d="M0,40 L40,30 L80,45 L130,20 L160,35 L200,10"
                     fill="none"
                     stroke="#94a3b8"
                     strokeWidth="2"
                     strokeLinecap="round"
                     strokeLinejoin="round"
                  />
                  <path
                     d="M0,50 L40,40 L80,55 L130,30 L160,45 L200,20"
                     fill="none"
                     stroke="#cbd5e1"
                     strokeWidth="2"
                     strokeLinecap="round"
                     strokeLinejoin="round"
                  />
               </svg>
            </div>
         </div>

         <div className="space-y-1.5 mt-2 pt-2 border-t border-gray-100 flex-1 overflow-y-auto">
            {loading ? (
               <div className="text-[10px] text-gray-400 text-center py-2">Loading...</div>
            ) : ongoing.length === 0 ? (
               <div className="text-[10px] text-gray-400 text-center py-2">No active bookings.</div>
            ) : (
               ongoing.slice(0, 5).map((p, i) => (
                  <Link href={`/admin/bookings/${p.id}`} key={p.id} className="flex items-center justify-between text-[10px] hover:bg-gray-50 p-1 rounded transition-colors">
                     <span className="flex items-center gap-1.5 text-gray-600">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: colors[i % colors.length] }} />
                        <span className="truncate max-w-[80px]" title={p.title ?? undefined}>{p.title || 'Booking'}</span>
                     </span>
                     <span className="font-semibold text-gray-800">{money(p.agreedPrice)}</span>
                  </Link>
               ))
            )}
         </div>
      </BentoCard>
   );
}
