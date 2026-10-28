'use client';

import { useEffect, useMemo, useState } from 'react';
import { BentoCard } from '@/components/ui/BentoCard';
import { StatWidget } from '@/components/ui/StatWidget';
import { MiniBarChart } from '@/components/ui/MiniBarChart';
import { DataTable, Column } from '@/components/ui/DataTable';
import { Badge } from '@/components/ui/Badge';
import Loader from '@/components/ui/Loader';
import { Wallet, ArrowUpRight, Clock, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { crewApi, financeApi } from '@/libs/endpoints';
import { apiErrorMessage } from '@/libs/api';
import { isActiveAssignment, localDateKey, money } from '@/libs/format';
import { AssignmentStatus, type WorkerAssignment, type WorkerFinanceSummary } from '@/types/api';

/**
 * Real earnings, from `/finance/worker/me` and the creative's own assignments.
 * This page used to render a hard-coded EARNINGS array and hard-coded KPI
 * values, while the endpoint that serves exactly this data went unused.
 */

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface EarningRow {
  id: string;
  date: string;
  studio: string;
  job: string;
  amount: number;
  status: 'paid' | 'pending';
}

export default function CreativeEarningsPage() {
  const [summary, setSummary] = useState<WorkerFinanceSummary | null>(null);
  const [assignments, setAssignments] = useState<WorkerAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [earnings, jobs] = await Promise.all([
          financeApi.myEarnings(),
          crewApi.listMine(),
        ]);
        if (cancelled) return;
        setSummary(earnings);
        setAssignments(jobs);
      } catch (error) {
        if (!cancelled) toast.error(apiErrorMessage(error, 'Failed to load earnings'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const billable = useMemo(
    () => assignments.filter((a) => isActiveAssignment(a.status)),
    [assignments],
  );

  const rows: EarningRow[] = useMemo(
    () =>
      billable
        .slice()
        .sort((a, b) => (b.startAt ?? '').localeCompare(a.startAt ?? ''))
        .map((a) => ({
          id: a.id,
          date: localDateKey(a.startAt) ?? '—',
          studio: a.studio?.name ?? 'Studio',
          job: a.title ?? 'Booking',
          amount: a.fee ?? 0,
          status: a.status === AssignmentStatus.COMPLETED ? 'paid' : 'pending',
        })),
    [billable, summary],
  );

  const chartData = useMemo(() => {
    const byMonth = new Map<number, number>();
    for (const job of billable) {
      // Bucket by the creative's own calendar month, not UTC's.
      const day = localDateKey(job.startAt);
      if (!day) continue;
      const month = Number(day.slice(5, 7)) - 1;
      if (Number.isNaN(month)) continue;
      byMonth.set(month, (byMonth.get(month) ?? 0) + (job.fee ?? 0));
    }
    return MONTHS.map((label, index) => ({ label, value: byMonth.get(index) ?? 0 }));
  }, [billable]);

  const byStudio = useMemo(() => {
    const totals = new Map<string, { name: string; jobs: number; amount: number }>();
    for (const job of billable) {
      const name = job.studio?.name ?? 'Studio';
      const entry = totals.get(name) ?? { name, jobs: 0, amount: 0 };
      entry.jobs += 1;
      entry.amount += job.fee ?? 0;
      totals.set(name, entry);
    }
    const all = [...totals.values()].sort((a, b) => b.amount - a.amount);
    const grandTotal = all.reduce((sum, s) => sum + s.amount, 0);
    return all.map((s) => ({
      ...s,
      share: grandTotal > 0 ? Math.round((s.amount / grandTotal) * 100) : 0,
    }));
  }, [billable]);

  const pendingCount = assignments.filter(
    (a) => a.status === AssignmentStatus.CONFIRMED,
  ).length;

  const columns: Column<EarningRow>[] = [
    { key: 'date', title: 'Date', render: (e) => <span className="text-gray-500 text-xs">{e.date}</span> },
    { key: 'studio', title: 'Studio / Client', render: (e) => (
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-gray-50 rounded text-gray-500"><Building2 size={12} /></div>
        <span className="font-medium text-gray-900 text-sm">{e.studio}</span>
      </div>
    ) },
    { key: 'job', title: 'Job Description', render: (e) => <span className="text-gray-600 text-sm">{e.job}</span> },
    { key: 'amount', title: 'Amount', align: 'right', render: (e) => (
      <span className="font-bold text-gray-900">{money(e.amount)}</span>
    ) },
    { key: 'status', title: 'Status', align: 'right', render: (e) => <Badge status={e.status} /> },
  ];

  if (loading) {
    return (
      <div className="py-12 flex justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1200px] mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Earnings</h1>
          <p className="text-sm text-gray-500 mt-1">
            Track your income, upcoming payouts, and job history.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BentoCard>
          <StatWidget
            label="Total Earned"
            value={money(summary?.totalEarned)}
            icon={Wallet}
            subtext={`${billable.length} job${billable.length === 1 ? '' : 's'}`}
          />
        </BentoCard>
        <BentoCard>
          <StatWidget
            label="Pending Payouts"
            value={money(summary?.currentBalance)}
            icon={Clock}
            subtext={`${pendingCount} job${pendingCount === 1 ? '' : 's'} awaiting payment`}
          />
        </BentoCard>
        <BentoCard variant="dark">
          <StatWidget
            label="Already Paid"
            value={money(summary?.totalPaid)}
            icon={ArrowUpRight}
            variant="dark"
            subtext="Paid out by studios"
          />
        </BentoCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <BentoCard className="p-6 h-full">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Income Overview</h2>
            <MiniBarChart variant="dark" height={200} data={chartData} />
          </BentoCard>
        </div>

        <div className="lg:col-span-4">
          <BentoCard className="p-6 h-full">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Top Studios</h2>
            {byStudio.length === 0 ? (
              <p className="text-sm text-gray-400">No jobs yet.</p>
            ) : (
              <div className="space-y-4">
                {byStudio.map((studio) => (
                  <div key={studio.name}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-gray-900">{studio.name}</span>
                      <span className="font-bold text-gray-900">{money(studio.amount)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mb-2">
                      <span>{studio.jobs} job{studio.jobs === 1 ? '' : 's'}</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gray-900 rounded-full"
                        style={{ width: `${studio.share}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </BentoCard>
        </div>
      </div>

      <BentoCard className="p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 bg-white">
          <h2 className="font-semibold text-gray-900">Recent Job Payouts</h2>
        </div>
        {rows.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-400 bg-white">
            Jobs you accept will show up here.
          </p>
        ) : (
          <DataTable data={rows} columns={columns} keyExtractor={(e) => e.id} className="bg-white" />
        )}
      </BentoCard>
    </div>
  );
}
