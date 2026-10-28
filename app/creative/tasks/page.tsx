'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Clock, Building2, ChevronDown, ChevronUp, Check, X } from 'lucide-react';
import toast from 'react-hot-toast';
import Link from 'next/link';
import Loader from '@/components/ui/Loader';
import { useAssignments } from '@/hooks/api/useAssignments';
import { apiErrorMessage } from '@/libs/api';
import { localClock, localDateKey, money } from '@/libs/format';
import { AssignmentStatus, type WorkerAssignment } from '@/types/api';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function relativeLabel(isoInstant: string | null): string | null {
  if (!isoInstant) return null;
  const diff = new Date(isoInstant).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  const days = Math.round(diff / 86_400_000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days === -1) return 'Yesterday';
  if (days > 0) return `In ${days} day${days === 1 ? '' : 's'}`;
  return `${Math.abs(days)} days ago`;
}

function shortDate(isoInstant: string | null): string {
  const key = localDateKey(isoInstant);
  if (!key) return 'No date';
  const d = new Date(`${key}T00:00:00`);
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

// ---------------------------------------------------------------------------
// Job card
// ---------------------------------------------------------------------------

function JobCard({
  job,
  onAccept,
  onDecline,
  busy,
  highlight,
}: {
  job: WorkerAssignment;
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  busy: boolean;
  highlight?: 'today' | 'urgent' | 'pending';
}) {
  const startClock = localClock(job.startAt);
  const endClock = localClock(job.endAt);
  const callClock = localClock(job.callTime);
  const rel = relativeLabel(job.startAt);
  const isPending = job.status === AssignmentStatus.ASSIGNED;

  const borderColor =
    highlight === 'today'
      ? 'border-l-4 border-l-black'
      : highlight === 'urgent'
      ? 'border-l-4 border-l-amber-400'
      : highlight === 'pending'
      ? 'border-l-4 border-l-amber-500'
      : '';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className={`bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden ${borderColor}`}
    >
      <div className="p-4 space-y-3">
        {/* Title row */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="font-bold text-gray-900 leading-tight truncate">
              {job.title || 'Booking'}
            </p>
            <div className="flex items-center gap-1.5 mt-0.5">
              {job.studio && (
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Building2 size={11} className="text-gray-400" />
                  {job.studio.name}
                </span>
              )}
              {job.role && (
                <>
                  <span className="text-gray-300 text-xs">·</span>
                  <span className="text-xs text-gray-500">{job.role}</span>
                </>
              )}
            </div>
          </div>
          {job.fee !== null && (
            <span className="text-sm font-bold text-gray-900 shrink-0">{money(job.fee)}</span>
          )}
        </div>

        {/* Date + time */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="text-gray-400">📅</span>
            <span className="font-medium">{shortDate(job.startAt)}</span>
            {rel && (
              <span
                className={`font-semibold ${
                  rel === 'Today'
                    ? 'text-black'
                    : rel === 'Tomorrow'
                    ? 'text-amber-600'
                    : rel.startsWith('In')
                    ? 'text-gray-500'
                    : 'text-gray-400'
                }`}
              >
                · {rel}
              </span>
            )}
          </span>
          {startClock && (
            <span className="flex items-center gap-1">
              <Clock size={11} className="text-gray-400" />
              {startClock}{endClock ? ` – ${endClock}` : ''}
            </span>
          )}
        </div>

        {/* Call time */}
        {callClock && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg w-fit">
            <Clock size={11} />
            Call time: {callClock}
          </div>
        )}

        {/* Location */}
        {job.location && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin size={11} className="text-gray-400 shrink-0" />
            <span className="truncate">{job.location}</span>
          </div>
        )}

        {/* Notes */}
        {job.notes && (
          <p className="text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2 leading-relaxed">
            {job.notes}
          </p>
        )}

        {/* Accept / Decline */}
        {isPending && onAccept && onDecline && (
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              disabled={busy}
              onClick={() => onAccept(job.id)}
              className="flex-1 py-2.5 rounded-xl bg-black text-white text-xs font-semibold hover:bg-gray-900 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <Check size={13} /> Accept
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => onDecline(job.id)}
              className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <X size={13} /> Decline
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ---------------------------------------------------------------------------
// Section wrapper with collapsible past jobs
// ---------------------------------------------------------------------------

function Section({
  title,
  count,
  accent,
  children,
  defaultOpen = true,
  emptyText,
}: {
  title: string;
  count: number;
  accent: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  emptyText?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 w-full group"
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${accent}`} />
        <span className="font-bold text-gray-900 text-sm">{title}</span>
        <span className="text-[11px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
          {count}
        </span>
        <span className="ml-auto text-gray-400 group-hover:text-gray-600 transition-colors">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {count === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center bg-gray-50/50 rounded-2xl">
                {emptyText ?? 'Nothing here yet'}
              </p>
            ) : (
              <div className="space-y-3">{children}</div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CreativeTasksPage() {
  const { assignments, loading, fetchAssignments, accept, decline } = useAssignments();
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetchAssignments().catch(() => {});
  }, [fetchAssignments]);

  const respond = async (id: string, action: typeof accept, msg: string) => {
    setBusyId(id);
    try {
      await action(id);
      toast.success(msg);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setBusyId(null);
    }
  };

  const now = Date.now();
  const todayStart = new Date().setHours(0, 0, 0, 0);
  const todayEnd = new Date().setHours(23, 59, 59, 999);
  const weekEnd = todayStart + 7 * 86_400_000;

  const { pending, today, thisWeek, later, done } = useMemo(() => {
    const pending: WorkerAssignment[] = [];
    const today: WorkerAssignment[] = [];
    const thisWeek: WorkerAssignment[] = [];
    const later: WorkerAssignment[] = [];
    const done: WorkerAssignment[] = [];

    for (const a of assignments) {
      if (a.status === AssignmentStatus.ASSIGNED) {
        pending.push(a);
        continue;
      }
      if (a.status === AssignmentStatus.COMPLETED) {
        done.push(a);
        continue;
      }
      // CONFIRMED — bucket by date
      const ts = a.startAt ? new Date(a.startAt).getTime() : null;
      if (ts === null) {
        later.push(a);
      } else if (ts >= todayStart && ts <= todayEnd) {
        today.push(a);
      } else if (ts > todayEnd && ts <= weekEnd) {
        thisWeek.push(a);
      } else if (ts > weekEnd) {
        later.push(a);
      } else {
        // startAt is in the past but status is still CONFIRMED — treat as upcoming
        today.push(a);
      }
    }

    const byDate = (a: WorkerAssignment, b: WorkerAssignment) =>
      (a.startAt ?? '').localeCompare(b.startAt ?? '');

    return {
      pending: pending.sort(byDate),
      today: today.sort(byDate),
      thisWeek: thisWeek.sort(byDate),
      later: later.sort(byDate),
      done: done.sort((a, b) => (b.startAt ?? '').localeCompare(a.startAt ?? '')),
    };
  }, [assignments, now]);

  const totalActive = pending.length + today.length + thisWeek.length + later.length;

  if (loading && assignments.length === 0) {
    return (
      <div className="py-12 flex justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-2xl mx-auto pb-10">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Jobs</h1>
          <p className="text-sm text-gray-500 mt-1">
            {totalActive === 0
              ? 'No active jobs right now.'
              : `${totalActive} active job${totalActive === 1 ? '' : 's'}`}
          </p>
        </div>
        <button
          type="button"
          onClick={() => fetchAssignments().catch(() => {})}
          disabled={loading}
          className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-50 mt-1"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {/* Pending invitations — top priority */}
      {pending.length > 0 && (
        <Section
          title="Needs your reply"
          count={pending.length}
          accent="bg-amber-400"
          emptyText="No pending invitations"
        >
          {pending.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              highlight="pending"
              busy={busyId === job.id}
              onAccept={(id) => respond(id, accept, 'Job accepted')}
              onDecline={(id) => respond(id, decline, 'Invitation declined')}
            />
          ))}
        </Section>
      )}

      {/* Today */}
      <Section
        title="Today"
        count={today.length}
        accent="bg-black"
        emptyText="Nothing scheduled for today"
      >
        {today.map((job) => (
          <JobCard key={job.id} job={job} highlight="today" busy={busyId === job.id} />
        ))}
      </Section>

      {/* This week */}
      <Section
        title="This week"
        count={thisWeek.length}
        accent="bg-indigo-400"
        emptyText="Nothing in the next 7 days"
      >
        {thisWeek.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            highlight={
              job.startAt && new Date(job.startAt).getTime() - now < 2 * 86_400_000
                ? 'urgent'
                : undefined
            }
            busy={busyId === job.id}
          />
        ))}
      </Section>

      {/* Later */}
      {later.length > 0 && (
        <Section title="Later" count={later.length} accent="bg-gray-300">
          {later.map((job) => (
            <JobCard key={job.id} job={job} busy={busyId === job.id} />
          ))}
        </Section>
      )}

      {/* Empty state when nothing at all */}
      {totalActive === 0 && !loading && (
        <div className="text-center py-16 space-y-3">
          <p className="text-4xl">📭</p>
          <p className="font-bold text-gray-900">No active jobs</p>
          <p className="text-sm text-gray-500">
            Studio invitations will appear here. Check back later.
          </p>
        </div>
      )}

      {/* Completed — collapsed by default */}
      {done.length > 0 && (
        <Section
          title="Completed"
          count={done.length}
          accent="bg-emerald-400"
          defaultOpen={false}
          emptyText="No completed jobs yet"
        >
          {done.map((job) => (
            <JobCard key={job.id} job={job} busy={busyId === job.id} />
          ))}
        </Section>
      )}
    </div>
  );
}
