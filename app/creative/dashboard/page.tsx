'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail, CheckCircle2, Calendar, Wallet, Building2,
  MapPin, Copy, X, Check, ArrowRight, AlertTriangle, RefreshCw,
  Clock, Banknote, Layers
} from 'lucide-react';
import { BentoCard } from '@/components/ui/BentoCard';
import { StatWidget } from '@/components/ui/StatWidget';
import { GlassButton } from '@/components/ui/GlassButton';
import { Badge } from '@/components/ui/Badge';
import { useUser } from '@/libs/user-context';
import Loader from '@/components/ui/Loader';
import { useAssignments } from '@/hooks/api/useAssignments';
import { displayName } from '@/libs/user-context';
import {
  initials,
  isActiveAssignment,
  isPendingAssignment,
  localClock,
  localDateKey,
  money,
} from '@/libs/format';
import { AssignmentStatus } from '@/types/api';
import { financeApi } from '@/libs/endpoints';
import type { WorkerFinanceSummary } from '@/types/api';
import { useRouter } from 'next/navigation';

interface Studio {
  id: string;
  name: string;
  address?: string | null;
  logoUrl?: string | null;
}

interface AssignmentItem {
  id: string;
  title: string;
  category?: string | null;
  location?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  fee?: number | null;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED' | string;
  studioId?: string | null;
  studio?: Studio | null;
}

const DEFAULT_INVITATIONS: AssignmentItem[] = [
  {
    id: 'inv-1',
    title: 'Task.me Productions',
    category: 'Corporate Event',
    fee: 450,
    date: '2024-10-15',
    startTime: '09:00',
    endTime: '17:00',
    location: '1200 Tech Blvd, NY',
    status: 'PENDING',
    studio: { id: 's1', name: 'Task.me Productions', address: '1200 Tech Blvd, NY' },
  },
  {
    id: 'inv-2',
    title: 'Task.me Productions',
    category: 'Wedding',
    fee: 600,
    date: '2024-10-12',
    startTime: '08:00',
    endTime: '20:00',
    location: 'The Grand Plaza',
    status: 'PENDING',
    studio: { id: 's1', name: 'Task.me Productions', address: 'The Grand Plaza' },
  },
];

export default function CreativeDashboardPage() {
  const { user, loading: userLoading } = useUser();
  const [copied, setCopied] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [financeData, setFinanceData] = useState<WorkerFinanceSummary | null>(null);
  const router = useRouter();

  const { assignments, loading, fetchAssignments, respondToAssignment } = useAssignments();

  // These used to read `user.creativeId`, `user.studio`, `user.fullName` and
  // `user.roleTitle`, none of which the API returns.
  const creativeId = user?.workerPublicId || '...';
  const fullName = displayName(user);
  const studioName = assignments[0]?.studio?.name || 'Task.me';
  const roleTitle = assignments.find((a) => a.role)?.role || 'Creative';

  const getInitials = (name: string) => initials(name, 'TM');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopyId = () => {
    navigator.clipboard.writeText(creativeId);
    setCopied(true);
    showToast(`Creative ID ${creativeId} copied to clipboard!`);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    fetchAssignments();
    financeApi.myEarnings().then(setFinanceData).catch(() => {});
  }, [fetchAssignments]);

  // One enum, one comparison - see libs/format.ts.
  const pendingInvitations = assignments.filter(
    (a) => isPendingAssignment(a.status) && a.fee !== null && a.fee !== undefined
  );
  const acceptedJobs = assignments.filter((a) => isActiveAssignment(a.status));

  const upcomingJobs = acceptedJobs.filter((a) => {
    if (!a.startAt) return false;
    const start = new Date(a.startAt).getTime();
    const now = Date.now();
    return start >= now && start <= now + 7 * 24 * 60 * 60 * 1000;
  });

  // Conflict Detection: check if any pending invitation overlaps with an accepted booking
  let conflictInfo: { pendingTitle: string; acceptedTitle: string; date: string } | null = null;
  
  // Comparing instants rather than wall-clock strings, so an overnight or
  // cross-timezone job still lines up correctly.
  const span = (job: { startAt: string | null; endAt: string | null }) => {
    if (!job.startAt) return null;
    const start = new Date(job.startAt).getTime();
    if (Number.isNaN(start)) return null;
    const end = job.endAt ? new Date(job.endAt).getTime() : start + 60 * 60 * 1000;
    return { start, end: Number.isNaN(end) ? start + 60 * 60 * 1000 : end };
  };

  for (const pending of pendingInvitations) {
    const pendingSpan = span(pending);
    if (!pendingSpan) continue;

    const conflict = acceptedJobs.find((accepted) => {
      const acceptedSpan = span(accepted);
      return (
        acceptedSpan !== null &&
        pendingSpan.start < acceptedSpan.end &&
        acceptedSpan.start < pendingSpan.end
      );
    });

    if (conflict) {
      conflictInfo = {
        pendingTitle: pending.title ?? 'Booking',
        acceptedTitle: conflict.title ?? 'Booking',
        date: localDateKey(pending.startAt) ?? '',
      };
      break;
    }
  }

  // Handle Accept
  const handleAcceptJob = async (invitationId: string) => {
    try {
      await respondToAssignment(invitationId, AssignmentStatus.CONFIRMED);
      showToast('Job accepted! It has been added to your schedule.');
    } catch (err) {
      console.error('Failed to accept job on server:', err);
      showToast('Failed to accept job');
    }
  };

  // Handle Decline
  const handleDeclineJob = async (invitationId: string) => {
    try {
      await respondToAssignment(invitationId, AssignmentStatus.DECLINED);
      showToast('Job invitation declined.');
    } catch (err) {
      console.error('Failed to decline job on server:', err);
      showToast('Failed to decline job');
    }
  };

  // Format date helper: "2024-10-15" -> "Oct 15, 2024"
  const formatJobDate = (dateStr: string | null) => {
    if (!dateStr || dateStr.trim() === '') return 'TBD';
    try {
      const parts = dateStr.split('-');
      if (parts.length !== 3) return dateStr;
      const [y, m, d] = parts;
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIndex = parseInt(m, 10) - 1;
      if (isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) return dateStr;
      
      const monthName = months[monthIndex];
      return `${monthName} ${d}, ${y}`;
    } catch {
      return dateStr;
    }
  };

  if (userLoading || loading) {
    return <Loader fullPage />;
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto pb-10">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 right-8 z-50 bg-black text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2 border border-white/10"
          >
            <CheckCircle2 size={14} className="text-emerald-400" />
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-gray-800 to-black flex items-center justify-center text-white text-lg font-bold shadow-md">
            {getInitials(fullName)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{fullName}</h1>
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs font-semibold text-gray-900 uppercase tracking-widest">
                {roleTitle}
              </span>
              <span className="text-gray-300">•</span>
              {studioName && (
                <>
                  <span className="text-xs font-medium text-gray-600 flex items-center gap-1">
                    <Building2 size={12} className="text-gray-400" />
                    {studioName}
                  </span>
                  <span className="text-gray-300">•</span>
                </>
              )}
              <button
                onClick={handleCopyId}
                title="Click to copy your Creative ID"
                className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-md text-[10px] font-mono cursor-pointer hover:bg-gray-200 transition-colors border border-gray-200/60"
              >
                Your ID: {creativeId} {copied ? <Check size={10} className="text-emerald-600" /> : <Copy size={10} />}
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={fetchAssignments}
          disabled={loading}
          className="p-2 rounded-xl border border-gray-200 text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          title="Refresh Invitations"
        >
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <BentoCard>
          <StatWidget
            label="Pending Invitations"
            value={String(pendingInvitations.length)}
            icon={Mail}
            trend={{ value: pendingInvitations.length > 0 ? 'Needs reply' : 'All clear', positive: pendingInvitations.length === 0 }}
          />
        </BentoCard>
        <BentoCard>
          <StatWidget
            label="Accepted Jobs"
            value={String(acceptedJobs.length)}
            icon={CheckCircle2}
            subtext="Total active"
          />
        </BentoCard>
        <BentoCard>
          <StatWidget
            label="Upcoming Jobs"
            value={String(upcomingJobs.length)}
            icon={Calendar}
            subtext="Next 7 days"
          />
        </BentoCard>
        <BentoCard variant="dark">
          <StatWidget
            label="Total Earned"
            value={money(financeData?.totalEarned)}
            icon={Wallet}
            variant="dark"
            trend={{ value: financeData ? `${money(financeData.currentBalance)} pending` : '—', positive: true }}
          />
        </BentoCard>
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-12 gap-6 items-start">

        {/* Left: Job Invitations Feed (Col 8) */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-bold text-gray-900 text-base">Job Invitations</h2>
            <button onClick={() => router.push('/creative/tasks')} className="text-xs font-semibold text-gray-900 hover:underline">
              View All
            </button>
          </div>

          {/* Conflict Warning Banner */}
          {conflictInfo && (
            <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-4 flex items-start gap-3.5 shadow-2xs">
              <div className="w-8 h-8 rounded-full bg-[#FEF3C7] text-[#D97706] flex items-center justify-center shrink-0 mt-0.5">
                <Calendar size={16} />
              </div>
              <div>
                <p className="text-xs font-extrabold text-[#92400E] tracking-tight uppercase mb-0.5">
                  CONFLICT DETECTED: ALREADY BOOKED ON {formatJobDate(conflictInfo.date).toUpperCase()}
                </p>
                <p className="text-xs text-[#B45309] font-medium">
                  You have a pending invitation that conflicts with the &apos;{conflictInfo.acceptedTitle}&apos; booking.
                </p>
              </div>
            </div>
          )}

          {/* Invitations List */}
          {pendingInvitations.length === 0 ? (
            <BentoCard className="p-8 text-center text-gray-400">
              <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-2" />
              <p className="font-semibold text-gray-800 text-sm">No Pending Invitations</p>
              <p className="text-xs text-gray-400 mt-1">You are all caught up! New job offers from studios will appear here.</p>
            </BentoCard>
          ) : (
            pendingInvitations.map((inv) => {
              const displayStudio = inv.studio?.name || inv.title || studioName;
              // `studio.address` is not part of the assignment payload; the
              // venue comes from the booking's event parts as `location`.
              const displayAddress = inv.location || 'No location set';
              const displayCategory = inv.category || 'Event Production';
              const displayFee = inv.fee || 450;

              const parts = inv.assignedParts ?? [];
              const partLabel = parts.length > 0
                ? parts.map(p => p.eventPart.customName || p.eventPart.partType || 'Event').join(', ')
                : null;
              const partStart = parts.length > 0 ? parts[0].eventPart.startAt : null;
              const partEnd = parts.length > 0 ? parts[parts.length - 1].eventPart.endAt : null;
              const partTime = partStart
                ? localClock(partStart) + (partEnd ? ` – ${localClock(partEnd)}` : '')
                : null;

              return (
                <BentoCard key={inv.id} className="p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center shrink-0 border border-gray-200/50">
                        <Building2 size={20} className="text-gray-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 text-base leading-tight">
                          {displayStudio}
                        </p>
                        <Badge
                          status="pending"
                          label={displayCategory}
                          dot={false}
                          className="mt-1 px-2 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-700"
                        />
                      </div>
                    </div>
                    <p className="text-xl font-bold text-gray-900">
                      {money(displayFee)}
                    </p>
                  </div>

                  {/* Meta Bar */}
                  <div className="bg-gray-50/80 rounded-xl p-3 space-y-2.5 mb-4 border border-gray-100">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                        <Calendar size={14} className="text-gray-400 shrink-0" />
                        <span>{formatJobDate(localDateKey(inv.startAt))}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                        <MapPin size={14} className="text-gray-400 shrink-0" />
                        <span className="truncate">{displayAddress}</span>
                      </div>
                    </div>
                    {(partLabel || partTime) && (
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200">
                        {partLabel && (
                          <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                            <Layers size={14} className="text-gray-400 shrink-0" />
                            <span className="truncate">{partLabel}</span>
                          </div>
                        )}
                        {partTime && (
                          <div className="flex items-center gap-2 text-xs text-gray-600 font-medium">
                            <Clock size={14} className="text-gray-400 shrink-0" />
                            <span>{partTime}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Deposit badge */}
                  {inv.deposit != null && inv.deposit > 0 && (
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-1.5 mb-4 w-fit">
                      <Banknote size={13} className="text-emerald-500" />
                      Deposit: {money(inv.deposit)}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <GlassButton
                      variant="ghost"
                      onClick={() => handleDeclineJob(inv.id)}
                      className="flex-1 text-red-600 hover:bg-red-50 hover:border-red-200 border-gray-200"
                      icon={X}
                    >
                      Decline
                    </GlassButton>
                    <GlassButton
                      variant="primary"
                      onClick={() => handleAcceptJob(inv.id)}
                      className="flex-1 bg-black hover:bg-gray-900 text-white shadow-sm"
                      icon={CheckCircle2}
                    >
                      Accept Job
                    </GlassButton>
                  </div>
                </BentoCard>
              );
            })
          )}
        </div>

        {/* Right: Recent Financials Sidebar (Col 4) */}
        <div className="col-span-12 lg:col-span-4 space-y-4 lg:sticky lg:top-24">
          <BentoCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-bold text-gray-900 text-base">Recent Financials</h2>
              <Link href="/creative/earnings" className="text-xs font-semibold text-gray-900 hover:underline">
                Statements
              </Link>
            </div>

            {/* Pending Payout */}
            <div className="mb-6 pb-6 border-b border-gray-100">
              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-1">
                Pending Payout
              </p>
              <div className="flex items-baseline justify-between">
                <p className="text-3xl font-bold text-gray-900 tracking-tight">
                  {money(financeData?.currentBalance)}
                </p>
                {financeData && financeData.currentBalance > 0 && (
                  <span className="text-sm font-semibold text-amber-600">Awaiting payment</span>
                )}
                {financeData && financeData.currentBalance <= 0 && (
                  <span className="text-sm font-semibold text-emerald-600">All paid</span>
                )}
              </div>
            </div>

            {/* Recent accepted jobs */}
            <div className="space-y-4 mb-5">
              {acceptedJobs.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-2">No jobs yet</p>
              ) : (
                acceptedJobs.slice(0, 3).map((job) => (
                  <div key={job.id} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900 truncate max-w-[140px]">{job.title ?? 'Booking'}</p>
                      <p className="text-[11px] text-gray-400 font-medium">{localDateKey(job.startAt) ?? '—'}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-900">{money(job.fee)}</p>
                  </div>
                ))
              )}
            </div>

            {/* Link to Full Earnings */}
            <Link
              href="/creative/earnings"
              className="text-xs font-semibold text-gray-600 hover:text-black flex items-center justify-center gap-1.5 w-full text-center py-2 transition-colors group border-t border-gray-50 pt-4"
            >
              <span>View All Transactions</span>
              <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </BentoCard>
        </div>

      </div>
    </div>
  );
}
