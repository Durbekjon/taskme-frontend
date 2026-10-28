'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Folder, Add, SearchNormal1, Calendar, More, FilterSearch, Grid5, RowVertical, CloseSquare, ArrowLeft2, ArrowRight2 } from 'iconsax-react';
import { useUser } from '@/libs/user-context';
import { bookingsApi } from '@/libs/endpoints';
import { apiErrorMessage } from '@/libs/api';
import { BookingStatus, type Booking } from '@/types/api';
import { GlassButton } from '@/components/ui/GlassButton';
import Loader from '@/components/ui/Loader';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { DataTable } from '@/components/ui/DataTable';

export default function BookingsPage() {
  const { user, loading: userLoading } = useUser();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const [viewMode, setViewMode] = useState<'card' | 'table'>('card');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [filters, setFilters] = useState({
    search: '',
    month: '',
    dateStart: '',
    dateEnd: '',
    status: 'ALL',
    crew: ''
  });
  const [searchInput, setSearchInput] = useState('');

  const [sortBy, setSortBy] = useState('date_desc');

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters(prev => ({ ...prev, search: searchInput }));
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await bookingsApi.list({
        page,
        limit: 20,
        ...filters,
        sortBy
      });
      setBookings(res.data);
      setTotalPages(res.meta.totalPages);
      setTotalItems(res.meta.total);
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Failed to load bookings'));
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (user?.studioId) {
      void fetchBookings();
    }
  }, [user, page, filters, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [filters, sortBy]);

  const getStatusColor = (status: BookingStatus) => {
    switch (status) {
      case BookingStatus.CONFIRMED: return 'bg-green-100 text-green-700';
      case BookingStatus.IN_PROGRESS: return 'bg-amber-100 text-amber-700';
      case BookingStatus.DRAFT: return 'bg-gray-100 text-gray-700';
      case BookingStatus.CANCELLED: return 'bg-red-100 text-red-700';
      case BookingStatus.COMPLETED: return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const STATUS_LABEL: Record<BookingStatus, string> = {
    DRAFT: 'Draft',
    CONFIRMED: 'Confirmed',
    IN_PROGRESS: 'In progress',
    COMPLETED: 'Completed',
    CANCELLED: 'Cancelled',
  };

  const formatEventName = (b: Booking) => {
    const bride = (b.people || []).find((p: any) => p.personType?.toLowerCase() === 'bride')?.firstName;
    const groom = (b.people || []).find((p: any) => p.personType?.toLowerCase() === 'groom' || p.personType?.toLowerCase() === 'husband')?.firstName;
    if (bride && groom) return `${bride} & ${groom}`;
    return b.title || 'Untitled booking';
  };

  const getClientName = (b: Booking) => {
    const client = (b.people || []).find((p: any) => 
      p.personType?.toLowerCase() === 'client' || 
      p.personType?.toLowerCase() === 'orderer'
    );
    if (client) return `${client.firstName} ${client.lastName || ''}`.trim();
    return '-';
  };

  if (userLoading) return <div className="py-12 flex justify-center"><Loader /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 h-full flex flex-col relative pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <Folder size={32} className="text-purple-500" variant="Bulk" />
            Bookings
          </h1>
          <p className="text-gray-500 mt-1">Manage every event and booking</p>
        </div>
        <GlassButton onClick={() => router.push('/admin/bookings/new')} icon={Add} variant="primary">
          New booking
        </GlassButton>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 flex flex-col space-y-4"
      >
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-black/5">
          <div className="relative w-full sm:w-80 flex items-center">
            <SearchNormal1 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search bookings..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:bg-white transition-all"
            />
          </div>
          
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button 
              onClick={() => setIsFilterModalOpen(true)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-xl transition-colors border border-transparent"
            >
              <FilterSearch size={18} color="currentColor" />
              Filters
              {Object.values(filters).filter(v => v !== '' && v !== 'ALL').length > 0 && (
                <span className="w-2 h-2 rounded-full bg-purple-500 ml-1"></span>
              )}
            </button>

            <div className="h-8 w-px bg-gray-200 hidden sm:block"></div>

            <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-xl">
              <button 
                onClick={() => setViewMode('card')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'card' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Grid5 size={18} variant={viewMode === 'card' ? "Bold" : "Linear"} color="currentColor" />
              </button>
              <button 
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm text-purple-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <RowVertical size={18} variant={viewMode === 'table' ? "Bold" : "Linear"} color="currentColor" />
              </button>
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 text-sm font-medium text-gray-700 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-purple-500/20 cursor-pointer"
            >
              <option value="date_desc">Newest First</option>
              <option value="date_asc">Oldest First</option>
              <option value="name_asc">Name (A-Z)</option>
              <option value="name_desc">Name (Z-A)</option>
            </select>
          </div>
        </div>
        
        {loading && bookings.length === 0 ? (
          <div className="flex justify-center items-center h-40"><Loader /></div>
        ) : bookings.length === 0 ? (
          <div className="py-20 text-center flex flex-col items-center justify-center bg-white rounded-3xl border border-black/5">
            <Folder size={48} className="text-gray-200 mb-4" variant="Bulk" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No bookings found</h3>
            <p className="text-sm text-gray-500">Nothing matches your criteria.</p>
          </div>
        ) : viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {bookings.map(booking => (
              <motion.div
                key={booking.id}
                whileHover={{ y: -4 }}
                onClick={() => router.push(`/admin/bookings/${booking.id}`)}
                className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md border border-black/5 transition-all cursor-pointer group flex flex-col"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(booking.status)}`}>
                    {STATUS_LABEL[booking.status] ?? booking.status}
                  </div>
                  <button className="text-gray-400 hover:text-gray-900 transition-colors p-1 rounded-lg hover:bg-gray-50">
                    <More size={18} />
                  </button>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
                  {formatEventName(booking)}
                </h3>
                <p className="text-sm text-gray-500 mb-4">{getClientName(booking)}</p>
                
                <div className="mt-auto pt-4 border-t border-black/5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600 font-medium">
                    <Calendar size={16} className="text-purple-500" />
                    {booking.eventDate ? format(new Date(booking.eventDate), 'MMM dd, yyyy') : 'No date set'}
                  </div>
                  <div className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">
                    {booking.eventType}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-sm border border-black/5 overflow-hidden">
            <DataTable 
              data={bookings} 
              keyExtractor={b => b.id}
              onRowClick={(b) => router.push(`/admin/bookings/${b.id}`)}
              columns={[
                {
                  key: 'title',
                  title: 'Event Name',
                  render: (b) => <span className="font-semibold text-gray-900">{formatEventName(b)}</span>
                },
                {
                  key: 'client',
                  title: 'Client',
                  render: (b) => <span className="text-gray-500">{getClientName(b)}</span>
                },
                {
                  key: 'eventDate',
                  title: 'Date',
                  render: (b) => b.eventDate ? format(new Date(b.eventDate), 'MMM dd, yyyy') : '-'
                },
                {
                  key: 'eventType',
                  title: 'Type',
                  render: (b) => <span className="text-gray-500">{b.eventType}</span>
                },
                {
                  key: 'status',
                  title: 'Status',
                  render: (b) => (
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(b.status)}`}>
                      {STATUS_LABEL[b.status] ?? b.status}
                    </span>
                  )
                }
              ]}
            />
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-black/5 shadow-sm mt-4">
            <div className="text-sm text-gray-500">
              Showing page <span className="font-semibold text-gray-900">{page}</span> of <span className="font-semibold text-gray-900">{totalPages}</span>
              <span className="ml-2">({totalItems} total items)</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft2 size={16} />
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowRight2 size={16} />
              </button>
            </div>
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {isFilterModalOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setIsFilterModalOpen(false)}
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-50 overflow-hidden border border-black/5"
            >
              <div className="flex justify-between items-center p-6 border-b border-black/5 bg-gray-50/50">
                <h3 className="text-xl font-bold text-gray-900">Filters</h3>
                <button 
                  onClick={() => setIsFilterModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <CloseSquare size={24} variant="Bulk" />
                </button>
              </div>

              <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select 
                    value={filters.status}
                    onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="DRAFT">Draft</option>
                    <option value="CONFIRMED">Confirmed</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
                  <input 
                    type="month" 
                    value={filters.month}
                    onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input 
                      type="date" 
                      value={filters.dateStart}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateStart: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                    <input 
                      type="date" 
                      value={filters.dateEnd}
                      onChange={(e) => setFilters(prev => ({ ...prev, dateEnd: e.target.value }))}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Crew Member</label>
                  <select 
                    value={filters.crew}
                    onChange={(e) => setFilters(prev => ({ ...prev, crew: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                  >
                    <option value="">Any</option>
                  </select>
                </div>
              </div>
              
              <div className="p-6 border-t border-black/5 bg-gray-50/50 flex gap-3">
                <button 
                  onClick={() => {
                    setFilters({ search: filters.search, month: '', dateStart: '', dateEnd: '', status: 'ALL', crew: '' });
                    setIsFilterModalOpen(false);
                  }}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Clear Fields
                </button>
                <button 
                  onClick={() => setIsFilterModalOpen(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gray-900 border border-transparent rounded-xl hover:bg-gray-800 transition-colors"
                >
                  Apply & Close
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
