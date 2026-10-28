'use client';

import { useState, useEffect } from 'react';
import { BentoCard } from '@/components/ui/BentoCard';
import { StatWidget } from '@/components/ui/StatWidget';
import { TrendingUp, ArrowDownRight, Wallet, Receipt, Users, Plus } from 'lucide-react';
import { useUser } from '@/libs/user-context';
import { financeApi } from '@/libs/endpoints';
import { apiErrorMessage } from '@/libs/api';
import { money } from '@/libs/format';
import type { StudioFinanceSummary, Expense } from '@/types/api';
import Loader from '@/components/ui/Loader';
import toast from 'react-hot-toast';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { GlassButton } from '@/components/ui/GlassButton';
import { NumberField } from '@/components/ui/NumberField';

export default function FinancePage() {
  const { user, loading: userLoading } = useUser();
  const [summary, setSummary] = useState<StudioFinanceSummary | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Expense modal
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    amount: 0,
    category: 'Gears',
    description: ''
  });

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const [sum, exps] = await Promise.all([
        financeApi.studioSummary(),
        financeApi.studioExpenses()
      ]);
      setSummary(sum);
      setExpenses(exps);
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Failed to load financial data'));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (user?.studioId) {
      fetchSummary();
    }
  }, [user]);

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      // Route is `/finance/expenses` (plural); `studioId` comes from the JWT
      // and `expenseDate` defaults server-side.
      await financeApi.createExpense({
        amount: expenseForm.amount,
        category: expenseForm.category,
        description: expenseForm.description,
      });
      toast.success('Expense added');
      setIsExpenseModalOpen(false);
      setExpenseForm({ amount: 0, category: 'Gears', description: '' });
      await fetchSummary(); // Refresh data
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await financeApi.deleteExpense(id);
      toast.success('Expense deleted');
      await fetchSummary();
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Failed to delete expense'));
    }
  };

  if (userLoading || loading) return <div className="py-12 flex justify-center"><Loader /></div>;

  const expenseColumns: Column<Expense>[] = [
    { key: 'category', title: 'Category', render: (e) => <span className="font-medium text-gray-900">{e.category}</span> },
    { key: 'description', title: 'Description', render: (e) => <span className="text-gray-600">{e.description}</span> },
    { key: 'expenseDate', title: 'Date', render: (e) => <span className="text-gray-500">{new Date(e.expenseDate || '').toLocaleDateString()}</span> },
    { key: 'amount', title: 'Amount', align: 'right', render: (e) => <span className="font-bold text-gray-900">{money(e.amount)}</span> },
    { key: 'id', title: '', align: 'right', render: (e) => (
      <button onClick={() => handleDeleteExpense(e.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Delete</button>
    ) }
  ];

  const profitMargin = summary && summary.revenue > 0
    ? Math.round((summary.studioProfit / summary.revenue) * 100)
    : 0;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Financials</h1>
          <p className="text-sm text-gray-500 mt-1">Track revenue, expenses and studio profit.</p>
        </div>
        <GlassButton
          onClick={() => setIsExpenseModalOpen(true)}
          icon={Plus}
        >
          Add expense
        </GlassButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <BentoCard>
          <StatWidget
            label="Total revenue"
            value={money(summary?.revenue)}
            icon={TrendingUp}
            trend={{ value: 'Contracted revenue', positive: true }}
          />
        </BentoCard>
        
        <BentoCard>
          <StatWidget
            label="Payments received"
            value={money(summary?.clientPaymentsReceived)}
            icon={Receipt}
            subtext={`Outstanding from clients: ${money(summary?.clientBalance)}`}
          />
        </BentoCard>

        <BentoCard>
          <StatWidget
            label="Crew costs"
            value={money(summary?.workerCosts)}
            icon={Users}
            subtext={`Still owed: ${money(summary?.workerBalance)}`}
          />
        </BentoCard>

        <BentoCard variant="dark">
          <StatWidget
            label="Net profit"
            value={money(summary?.studioProfit)}
            icon={Wallet}
            variant="dark"
            subtext="After all expenses"
          />
        </BentoCard>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
           <BentoCard className="p-6 h-full border border-gray-200 bg-white">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 text-green-600 rounded-lg"><TrendingUp size={20} /></div>
                  <div>
                    <p className="font-bold text-gray-900">Expected revenue</p>
                    <p className="text-xs text-gray-500">Total value of all bookings</p>
                  </div>
                </div>
                <p className="font-bold text-lg">{money(summary?.revenue)}</p>
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><Users size={20} /></div>
                  <div>
                    <p className="font-bold text-gray-900">Crew pay</p>
                    <p className="text-xs text-gray-500">Total owed to crew members</p>
                  </div>
                </div>
                <p className="font-bold text-lg text-orange-600">-{money(summary?.workerCosts)}</p>
              </div>

              <div className="flex justify-between items-center p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 text-red-600 rounded-lg"><ArrowDownRight size={20} /></div>
                  <div>
                    <p className="font-bold text-gray-900">Other expenses</p>
                    <p className="text-xs text-gray-500">Additional operating costs</p>
                  </div>
                </div>
                <p className="font-bold text-lg text-red-600">-{money(summary?.otherExpenses)}</p>
              </div>
            </div>
           </BentoCard>
        </div>

        <div className="md:col-span-1">
          <BentoCard className="p-6 h-full flex flex-col justify-between bg-gradient-to-br from-gray-950 to-gray-900 text-white border-0 shadow-lg">
            <div>
              <h2 className="text-lg font-bold text-white mb-2">Profit margin</h2>
              <p className="text-xs text-gray-400 mb-8 leading-relaxed">
                The share of total revenue the studio keeps as profit.
              </p>

              <div className="space-y-6">
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-gray-400">Target</span>
                    <span className="font-semibold text-white">50%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-600 rounded-full" style={{ width: '50%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-2">
                    <span className="text-gray-400">Current</span>
                    <span className="font-semibold text-emerald-400">{profitMargin}%</span>
                  </div>
                  <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, Math.max(0, profitMargin))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-8 pt-4 border-t border-gray-800/80 text-xs text-gray-400 flex justify-between items-center">
              <span>Status</span>
              <span className={profitMargin >= 40 ? "text-emerald-400 font-semibold" : "text-yellow-400 font-semibold"}>
                {profitMargin >= 40 ? 'Healthy' : 'At risk'}
              </span>
            </div>
          </BentoCard>
        </div>
      </div>

      <div className="mt-8">
        <BentoCard className="p-6 bg-white border border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Recent Expenses</h2>
          </div>
          <DataTable 
            data={expenses}
            columns={expenseColumns}
            keyExtractor={(e) => e.id}
            emptyState={
              <div className="text-center text-gray-500 py-8">
                No expenses recorded yet.
              </div>
            }
          />
        </BentoCard>
      </div>

      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title="New expense"
      >
        <form onSubmit={handleAddExpense} className="space-y-4">
          <div>
            <label className="field-label">Category</label>
            <select
              required
              value={expenseForm.category}
              onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}
              className="field-input"
            >
              <option value="Gears">Gear</option>
              <option value="Office">Office</option>
              <option value="Marketing">Marketing</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div>
            <label className="field-label">Amount ($)</label>
            <NumberField
              required
              min={0}
              value={expenseForm.amount}
              onValueChange={amount => setExpenseForm({ ...expenseForm, amount })}
            />
          </div>
          <div>
            <label className="field-label">Description</label>
            <input
              type="text"
              required
              value={expenseForm.description}
              onChange={e => setExpenseForm({...expenseForm, description: e.target.value})}
              className="field-input"
            />
          </div>
          
          <div className="pt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsExpenseModalOpen(false)}
              className="px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-white bg-black hover:bg-gray-800 rounded-lg flex items-center gap-2"
            >
              {isSubmitting && <Loader size="sm" />}
              Add
            </button>
          </div>
        </form>
      </Modal>

    </div>
  );
}
