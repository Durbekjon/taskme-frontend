'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { bookingsApi, financeApi } from '@/libs/endpoints';
import { format } from 'date-fns';
import { SearchNormal1, Sort, ArrowDown2, ArrowUp2, Add, Check, CloseCircle } from 'iconsax-react';
import { NumberField } from '@/components/ui/NumberField';
import toast from 'react-hot-toast';
import { Booking, CrewAssignment } from '@/types/api';
import Loader from '@/components/ui/Loader';

export default function CrewPayoutsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null);
  
  // State for adding payment
  const [addingPaymentFor, setAddingPaymentFor] = useState<string | null>(null); // crew assignment ID
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBookings = async () => {
    try {
      const data = await bookingsApi.list();
      setBookings(data.data || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleAddPayment = async (assignmentId: string) => {
    if (paymentAmount <= 0) return;
    setIsSubmitting(true);
    try {
      await financeApi.createWorkerPayment({
        assignmentId,
        amount: paymentAmount,
        paymentDate: new Date().toISOString(),
      });
      toast.success('Payment added. Waiting for crew confirmation.');
      setAddingPaymentFor(null);
      setPaymentAmount(0);
      await fetchBookings();
    } catch (error) {
      console.error(error);
      toast.error('Failed to add payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const money = (num: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
  };

  const filteredBookings = useMemo(() => {
    let filtered = bookings.filter((b) => {
      const search = searchTerm.toLowerCase();
      const matchBooking = b.title?.toLowerCase().includes(search) || false;
      const matchCrew = b.assignments?.some(a => {
        const fullName = `${a.worker?.user?.firstName || ''} ${a.worker?.user?.lastName || ''}`.trim();
        return fullName.toLowerCase().includes(search) || 
               a.role?.toLowerCase().includes(search);
      });
      return matchBooking || matchCrew;
    });

    if (sortConfig) {
      filtered.sort((a, b) => {
        if (sortConfig.key === 'date') {
          const dateA = a.eventDate ? new Date(a.eventDate).getTime() : 0;
          const dateB = b.eventDate ? new Date(b.eventDate).getTime() : 0;
          return sortConfig.direction === 'asc' ? dateA - dateB : dateB - dateA;
        }
        return 0;
      });
    }

    return filtered;
  }, [bookings, searchTerm, sortConfig]);

  if (loading) return <div className="p-8 flex justify-center"><Loader /></div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Crew Payouts</h1>
        <div className="flex items-center gap-4">
          <div className="relative">
            <SearchNormal1 size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search booking or crew..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
            />
          </div>
          <button 
            onClick={() => handleSort('date')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <Sort size={20} />
            Sort by Date
            {sortConfig?.key === 'date' && (
              sortConfig.direction === 'asc' ? <ArrowUp2 size={16} /> : <ArrowDown2 size={16} />
            )}
          </button>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b border-gray-100">
                <th className="py-4 px-6 text-sm font-medium text-gray-500">Booking</th>
                <th className="py-4 px-6 text-sm font-medium text-gray-500">Crew Member</th>
                <th className="py-4 px-6 text-sm font-medium text-gray-500">Agreed Price</th>
                <th className="py-4 px-6 text-sm font-medium text-gray-500">Deposit</th>
                <th className="py-4 px-6 text-sm font-medium text-gray-500">Pending</th>
                <th className="py-4 px-6 text-sm font-medium text-gray-500">Left</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-gray-500">
                    No bookings found
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking, index) => {
                  const assignments = booking.assignments || [];
                  if (assignments.length === 0) return null;

                  return (
                    <React.Fragment key={booking.id}>
                      {assignments.map((assignment, aIdx) => {
                        const payments = assignment.payments || [];
                        const confirmedDeposit = payments.filter(p => p.status === 'CONFIRMED').reduce((acc, p) => acc + Number(p.amount), 0);
                        const pendingDeposit = payments.filter(p => p.status === 'PENDING').reduce((acc, p) => acc + Number(p.amount), 0);
                        const agreedPrice = Number(assignment.agreedFee) || 0;
                        const left = agreedPrice - confirmedDeposit - pendingDeposit;
                        
                        return (
                          <tr key={assignment.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                            {aIdx === 0 && (
                              <td className="py-4 px-6 align-top" rowSpan={assignments.length}>
                                <div className="flex flex-col">
                                  <span className="font-semibold text-gray-900">{booking.title || 'Untitled booking'}</span>
                                  <span className="text-sm text-gray-500 mt-1">
                                    {booking.eventDate ? format(new Date(booking.eventDate), 'MM.dd.yyyy') : 'No Date'}
                                  </span>
                                </div>
                              </td>
                            )}
                            <td className="py-4 px-6">
                              <div className="flex flex-col">
                                <span className="font-medium text-gray-900">
                                  {assignment.worker?.fullName || 'Unknown'}
                                </span>
                                <span className="text-xs text-gray-500">{assignment.role || 'Creative'}</span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <span className="text-gray-600 font-medium">{money(agreedPrice)}</span>
                            </td>
                            <td className="py-4 px-6 relative group">
                              {addingPaymentFor === assignment.id ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-bold text-gray-900">{money(confirmedDeposit)}</span>
                                  <span className="text-gray-400 mx-1"><Add size={14} color="currentColor" variant="Linear" /></span>
                                  <div className="w-24 border-2 border-gray-100 rounded-xl overflow-hidden focus-within:border-black transition-colors">
                                    <NumberField min={0} value={paymentAmount} onValueChange={setPaymentAmount} disabled={isSubmitting} />
                                  </div>
                                  <button 
                                    onClick={() => handleAddPayment(assignment.id)}
                                    disabled={isSubmitting}
                                    className="w-8 h-8 flex items-center justify-center bg-black text-white rounded-[10px] hover:bg-gray-800 disabled:opacity-50"
                                  >
                                    <Check size={16} color="currentColor" variant="Linear" />
                                  </button>
                                  <button 
                                    onClick={() => setAddingPaymentFor(null)}
                                    disabled={isSubmitting}
                                    className="w-8 h-8 flex items-center justify-center bg-gray-50 text-gray-400 border border-black/5 rounded-[10px] hover:bg-gray-100 transition-colors"
                                  >
                                    <CloseCircle size={16} color="currentColor" variant="Linear" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-bold text-gray-900">{money(confirmedDeposit)}</span>
                                  <button 
                                    onClick={() => {
                                      setAddingPaymentFor(assignment.id);
                                      setPaymentAmount(0);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-1 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-opacity"
                                  >
                                    <Add size={16} color="currentColor" variant="Linear" />
                                  </button>
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              {pendingDeposit > 0 ? (
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  {money(pendingDeposit)} Pending
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="py-4 px-6">
                              <span className={`font-semibold ${left > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                {money(left)}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </React.Fragment>
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
