'use client';

import { useState, useEffect, useMemo } from 'react';
import { bookingsApi, financeApi } from '@/libs/endpoints';
import { BookingStatus, type Booking } from '@/types/api';
import { money } from '@/libs/format';
import { SearchNormal1, Filter, Add, Check, CloseCircle } from 'iconsax-react';
import { NumberField } from '@/components/ui/NumberField';
import { useUser } from '@/libs/user-context';
import Loader from '@/components/ui/Loader';
import toast from 'react-hot-toast';

export default function ClientPaymentsPage() {
  const { user } = useUser();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [addingPaymentFor, setAddingPaymentFor] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentType, setPaymentType] = useState<'DEPOSIT' | 'PAYMENT' | 'FINAL_PAYMENT' | 'REFUND'>('PAYMENT');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!user?.studioId) return;

    const loadData = async () => {
      try {
        setLoading(true);
        // Load all bookings (up to a large limit or use pagination if needed)
        const res = await bookingsApi.list({ limit: 1000 });
        // Filter out cancelled bookings
        setBookings(res.data.filter(b => b.status !== BookingStatus.CANCELLED));
      } catch (error) {
        toast.error('Failed to load client payments');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const filteredAndSorted = useMemo(() => {
    let result = bookings;
    
    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(b => {
        const title = b.title?.toLowerCase() || '';
        return title.includes(q);
      });
    }

    // Sort by event date
    result.sort((a, b) => {
      const timeA = a.eventDate ? new Date(a.eventDate).getTime() : 0;
      const timeB = b.eventDate ? new Date(b.eventDate).getTime() : 0;
      return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
    });

    return result;
  }, [bookings, search, sortOrder]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'No date set';
    const d = new Date(dateStr);
    const mm = (d.getMonth() + 1).toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}.${dd}.${yyyy}`;
  };

  const handleAddPayment = async (bookingId: string) => {
    if (!paymentAmount || paymentAmount <= 0) return;
    try {
      setIsSubmitting(true);
      const newPayment = await financeApi.createClientPayment({
        bookingId,
        amount: paymentAmount,
        paymentType,
        paymentDate: new Date().toISOString(),
        paymentMethod: 'CASH',
      });
      
      // Update local state
      setBookings(prev => prev.map(b => {
        if (b.id === bookingId) {
          return {
            ...b,
            clientPayments: [...(b.clientPayments || []), newPayment]
          };
        }
        return b;
      }));
      setAddingPaymentFor(null);
      setPaymentAmount(0);
      setPaymentType('PAYMENT');
      toast.success('Payment added');
    } catch (error) {
      toast.error('Failed to add payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDeposit = (b: Booking) => {
    if (!b.clientPayments) return 0;
    return b.clientPayments.reduce((sum, p) => sum + Number(p.amount), 0);
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Client payments
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Track incoming payments from your clients.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
        <div className="relative flex-1 w-full">
          <SearchNormal1 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search bookings..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-black/5 rounded-xl focus:ring-2 focus:ring-black focus:bg-white transition-all text-sm font-medium"
          />
        </div>
        
        <button
          onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
          className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-black/5 rounded-xl text-sm font-medium transition-colors w-full sm:w-auto justify-center"
        >
          <Filter size={18} />
          Sort Date: {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-black/5">
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">#</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Agreed Price</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Deposit</th>
                <th className="py-4 px-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Left</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12">
                    <div className="flex justify-center"><Loader /></div>
                  </td>
                </tr>
              ) : filteredAndSorted.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500 font-medium">
                    No client payments found.
                  </td>
                </tr>
              ) : (
                filteredAndSorted.map((booking, index) => {
                  const agreedPrice = Number(booking.agreedPrice) || 0;
                  const deposit = getDeposit(booking);
                  const left = agreedPrice - deposit;

                  return (
                    <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 text-sm font-medium text-gray-400">
                        {index + 1}
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-[11px] text-gray-500 font-medium tracking-wide mb-0.5">
                          {formatDate(booking.eventDate)}
                        </div>
                        <div className="text-sm font-bold text-gray-900">
                          {booking.title || 'Untitled booking'}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-sm font-bold text-gray-900">
                        {money(agreedPrice)}
                      </td>
                      <td className="py-4 px-6 relative group">
                        {addingPaymentFor === booking.id ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-gray-900">{money(deposit)}</span>
                            <span className="text-gray-400 mx-1"><Add size={14} color="currentColor" variant="Linear" /></span>
                            <select
                              value={paymentType}
                              onChange={(e) => setPaymentType(e.target.value as typeof paymentType)}
                              disabled={isSubmitting}
                              className="px-2 py-1 text-xs border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:border-gray-400"
                            >
                              <option value="DEPOSIT">Deposit</option>
                              <option value="PAYMENT">Payment</option>
                              <option value="FINAL_PAYMENT">Final</option>
                              <option value="REFUND">Refund</option>
                            </select>
                            <div className="w-24 border-2 border-gray-100 rounded-xl overflow-hidden focus-within:border-black transition-colors">
                              <NumberField min={0} value={paymentAmount} onValueChange={setPaymentAmount} disabled={isSubmitting} />
                            </div>
                            <button
                              onClick={() => handleAddPayment(booking.id)}
                              disabled={isSubmitting}
                              className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-[10px] hover:bg-gray-800 disabled:opacity-50"
                            >
                              <Check size={16} color="currentColor" variant="Linear" />
                            </button>
                            <button
                              onClick={() => { setAddingPaymentFor(null); setPaymentType('PAYMENT'); }}
                              disabled={isSubmitting}
                              className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-400 border border-black/5 rounded-[10px] hover:bg-gray-100 transition-colors"
                            >
                              <CloseCircle size={16} color="currentColor" variant="Linear" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-gray-900">{money(deposit)}</span>
                            <button 
                              onClick={() => {
                                setAddingPaymentFor(booking.id);
                                setPaymentAmount(0);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-opacity"
                              title="Add payment"
                            >
                              <Add size={16} color="currentColor" variant="Linear" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                          left <= 0 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {money(Math.max(0, left))}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
