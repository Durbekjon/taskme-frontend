'use client';

import React, { useEffect, useState } from 'react';
import { BentoCard } from '@/components/ui/BentoCard';
import { Receipt } from 'iconsax-react';
import { financeApi } from '@/libs/endpoints';
import { money } from '@/libs/format';
import type { Expense } from '@/types/api';

/**
 * Replaces the old "All files" card, which listed four hard-coded filenames.
 * There is no files feature behind the UI - the `files` module was an empty
 * CLI scaffold - so this shows the studio's real recent spend instead.
 */
export function RecentExpensesCard() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    financeApi
      .studioExpenses()
      .then((data) => {
        if (!cancelled) setExpenses(data.slice(0, 5));
      })
      .catch(() => {
        /* the empty state below covers this */
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <BentoCard variant="light" className="p-5 h-full">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-800">Recent expenses</p>
        <Receipt color="currentColor" size={16} className="text-gray-400" />
      </div>

      {loading ? (
        <p className="text-xs text-gray-400 py-4 text-center">Loading…</p>
      ) : expenses.length === 0 ? (
        <p className="text-xs text-gray-400 py-4 text-center">No expenses yet</p>
      ) : (
        <div className="space-y-2.5">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                <Receipt color="currentColor" size={14} className="text-gray-500" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-gray-700 truncate">
                  {expense.description || expense.category || 'Expense'}
                </p>
                {expense.category && expense.description && (
                  <p className="text-[10px] text-gray-400 truncate">{expense.category}</p>
                )}
              </div>
              <p className="text-xs font-semibold text-gray-900 flex-shrink-0">
                {money(expense.amount)}
              </p>
            </div>
          ))}
        </div>
      )}
    </BentoCard>
  );
}
