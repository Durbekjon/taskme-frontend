'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Calendar, DollarCircle, Profile2User, Receipt2, DocumentText } from 'iconsax-react';
import { apiErrorMessage } from '@/libs/api';
import { bookingsApi, crewApi, financeApi, teamApi } from '@/libs/endpoints';
import { localDateToIso } from '@/libs/booking-payload';
import { AvailabilityStatus, BookingStatus, AssignmentStatus, ClientPaymentType } from '@/types/api';
import type {
  Booking,
  CreativeLookup,
  ClientPayment,
  CrewAssignment,
  Expense,
  TeamMember,
  WorkerPayment,
} from '@/types/api';
import {
  ASSIGNMENT_STATUS_LABEL,
  AVAILABILITY_CLASS,
  AVAILABILITY_HINT,
  AVAILABILITY_LABEL,
  BOOKING_STATUS_CLASS,
  BOOKING_STATUS_LABEL,
  eventPartLabel,
  eventPartVenue,
  partTime,
  clientName,
  nextBookingStatuses,
  conflictLabel,
  initials,
  localDateKey,
  memberName,
  money,
} from '@/libs/format';
import Loader from '@/components/ui/Loader';
import { NumberField } from '@/components/ui/NumberField';
import { GlassButton } from '@/components/ui/GlassButton';
import toast from 'react-hot-toast';
import { UserAdd, Trash, CloseSquare, Edit2 } from 'iconsax-react';
import { useUser } from '@/libs/user-context';

/** Payment and expense dates are nullable in the API. */
function formatDate(value: string | null): string {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
}

export default function BookingDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  const { user } = useUser();
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [assignments, setAssignments] = useState<CrewAssignment[]>([]);

  // Crew Form
  const [isAssigning, setIsAssigning] = useState(false);
  const [workerId, setWorkerId] = useState('');
  const [role, setRole] = useState('Photographer');
  const [agreedFee, setAgreedFee] = useState<number>(0);
  const [deposit, setDeposit] = useState<number>(0);
  const [callTime, setCallTime] = useState('');
  const [selectedParts, setSelectedParts] = useState<string[]>([]);
  const [showCrewForm, setShowCrewForm] = useState(false);

  // Invite an outside creative by their public ID. Creatives are not tied to
  // a single studio, so this works for anyone whose ID the studio has.
  // A booking could be created but never corrected: no way to fix a typo,
  // move a date, reprice, cancel, or advance it past DRAFT.
  const [isEditing, setIsEditing] = useState(false);
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isChangingStatus, setIsChangingStatus] = useState(false);
  const [editForm, setEditForm] = useState({
    title: '',
    eventType: '',
    eventDate: '',
    location: '',
    agreedPrice: 0,
    notes: '',
  });

  const [lookupId, setLookupId] = useState('');
  const [lookupResult, setLookupResult] = useState<CreativeLookup | null>(null);
  const [lookupError, setLookupError] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);

  // Crew row inline editing
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState('');
  const [editingFee, setEditingFee] = useState<number>(0);
  const [editingDeposit, setEditingDeposit] = useState<number>(0);

  // Finance State
  const [clientPayments, setClientPayments] = useState<ClientPayment[]>([]);
  const [workerPayments, setWorkerPayments] = useState<WorkerPayment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  // Client Payment Form
  const [showClientPaymentForm, setShowClientPaymentForm] = useState(false);
  const [clientPaymentAmount, setClientPaymentAmount] = useState<number>(0);
  const [clientPaymentType, setClientPaymentType] = useState<ClientPaymentType>(ClientPaymentType.DEPOSIT);

  // Worker Payment Form
  const [showWorkerPaymentForm, setShowWorkerPaymentForm] = useState(false);
  const [workerPaymentAssignmentId, setWorkerPaymentAssignmentId] = useState('');
  const [workerPaymentAmount, setWorkerPaymentAmount] = useState<number>(0);

  // Expense Form
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('Equipment Rental');
  const [expenseAmount, setExpenseAmount] = useState<number>(0);
  const [expenseNotes, setExpenseNotes] = useState('');
  const [isSubmittingFinance, setIsSubmittingFinance] = useState(false);
  const bookingId = String(params?.id ?? '');

  const fetchBooking = async () => {
    if (!bookingId) return;
    try {
      setLoading(true);
      const [bookingData, assignmentData, payments, payouts, costs] = await Promise.all([
        bookingsApi.get(bookingId),
        crewApi.listByBooking(bookingId),
        financeApi.clientPayments(bookingId),
        financeApi.workerPayments(bookingId),
        financeApi.expenses(bookingId),
      ]);
      setBooking(bookingData);
      setAssignments(assignmentData);
      setClientPayments(payments);
      setWorkerPayments(payouts);
      setExpenses(costs);
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Failed to load the booking'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (params?.id) {
      fetchBooking();
    }
  }, [params?.id]);

  useEffect(() => {
    if (!user?.studioId) return;
    teamApi
      .get()
      .then((team) => setTeam(team.active))
      .catch((err) => toast.error(apiErrorMessage(err, 'Failed to load the team')));
  }, [user]);

  // Only members with a creative profile can be booked as crew.
  const assignableTeam = team.filter(member => member.workerProfileId);

  const startEditing = () => {
    if (!booking) return;
    setEditForm({
      title: booking.title ?? '',
      eventType: booking.eventType ?? 'Wedding',
      // <input type="date"> wants the local calendar day, not the instant.
      eventDate: localDateKey(booking.eventDate) ?? '',
      location: booking.location ?? '',
      agreedPrice: Number(booking.agreedPrice ?? 0),
      notes: booking.notes ?? '',
    });
    setIsEditing(true);
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm.title.trim()) {
      toast.error('Give the booking a name');
      return;
    }
    try {
      setIsSavingDetails(true);
      const updated = await bookingsApi.update(bookingId, {
        title: editForm.title.trim(),
        eventType: editForm.eventType,
        eventDate: editForm.eventDate ? localDateToIso(editForm.eventDate) : undefined,
        location: editForm.location.trim() || undefined,
        agreedPrice: Number(editForm.agreedPrice) || 0,
        notes: editForm.notes.trim() || undefined,
      });
      setBooking((current) => (current ? { ...current, ...updated } : updated));
      setIsEditing(false);
      toast.success('Booking updated');
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setIsSavingDetails(false);
    }
  };

  const handleStatusChange = async (status: BookingStatus) => {
    if (!booking || booking.status === status) return;
    if (
      status === BookingStatus.CANCELLED &&
      !confirm('Cancel this booking? Crew and payments stay on record.')
    ) {
      return;
    }
    const previous = booking.status;
    // Optimistic: the badge is the thing being clicked, so it should move now.
    setBooking((current) => (current ? { ...current, status } : current));
    setIsChangingStatus(true);
    try {
      await bookingsApi.update(bookingId, { status });
      toast.success(`Marked as ${BOOKING_STATUS_LABEL[status].toLowerCase()}`);
    } catch (error) {
      setBooking((current) => (current ? { ...current, status: previous } : current));
      toast.error(apiErrorMessage(error));
    } finally {
      setIsChangingStatus(false);
    }
  };

  const handleDeleteBooking = async () => {
    if (!confirm('Delete this booking for good? This cannot be undone.')) return;
    try {
      await bookingsApi.remove(bookingId);
      toast.success('Booking deleted');
      router.push('/admin/bookings');
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  useEffect(() => {
    const id = lookupId.trim();
    if (!id) {
      setLookupResult(null);
      setLookupError('');
      setWorkerId('');
      return;
    }
    const timer = setTimeout(() => {
      void handleLookup();
    }, 500);
    return () => clearTimeout(timer);
  }, [lookupId]);

  const handleLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const id = lookupId.trim();
    if (!id) return;
    setIsLookingUp(true);
    setLookupError('');
    setLookupResult(null);
    try {
      const result = await crewApi.checkAvailability(bookingId, id);
      setLookupResult(result);
      // Selecting through the lookup and through the dropdown both end up
      // setting the same workerId, so the rest of the form is unchanged.
      setWorkerId(result.worker.id);
      if (result.worker.primaryRole) setRole(result.worker.primaryRole);
    } catch (error) {
      setLookupError(apiErrorMessage(error, 'Could not find that creative'));
      setWorkerId('');
    } finally {
      setIsLookingUp(false);
    }
  };

  const clearLookup = () => {
    setLookupId('');
    setLookupResult(null);
    setLookupError('');
    setWorkerId('');
  };

  const handleAssignSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!workerId) return;
    try {
      setIsAssigning(true);
      await crewApi.create({
        bookingId,
        workerId,
        role,
        agreedFee: Number(agreedFee) || 0,
        deposit: Number(deposit) || 0,
        callTime: callTime ? new Date(callTime).toISOString() : undefined,
        eventPartIds: selectedParts,
      });
      toast.success(
        lookupResult && !lookupResult.worker.onYourTeam
          ? `Invitation sent to ${lookupResult.worker.fullName}`
          : 'Crew member assigned',
      );
      setAssignments(await crewApi.listByBooking(bookingId));
      setShowCrewForm(false);
      clearLookup();
      setWorkerId('');
      setAgreedFee(0);
      setDeposit(0);
      setCallTime('');
      setSelectedParts([]);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveAssignment = async (id: string) => {
    if (!confirm('Remove this crew member?')) return;
    try {
      await crewApi.remove(id);
      toast.success('Removed');
      setAssignments(assignments.filter(a => a.id !== id));
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  const startEditingAssignment = (a: CrewAssignment) => {
    setEditingAssignmentId(a.id);
    setEditingRole(a.role || '');
    setEditingFee(a.agreedFee ?? 0);
    setEditingDeposit(a.deposit ?? 0);
  };

  const cancelEditingAssignment = () => {
    setEditingAssignmentId(null);
  };

  const saveEditingAssignment = async (id: string) => {
    try {
      const updated = await crewApi.update(id, { role: editingRole, agreedFee: editingFee, deposit: editingDeposit });
      setAssignments(assignments.map(a => a.id === id ? { ...a, ...updated } : a));
      setEditingAssignmentId(null);
      toast.success('Updated');
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  const handleClientPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingFinance(true);
      // paymentDate is optional now and defaults server-side; it used to be
      // required, so this form always returned 400.
      await financeApi.createClientPayment({
        bookingId,
        amount: Number(clientPaymentAmount),
        paymentType: clientPaymentType,
      });
      toast.success('Payment recorded');
      setClientPayments(await financeApi.clientPayments(bookingId));
      setShowClientPaymentForm(false);
      setClientPaymentAmount(0);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setIsSubmittingFinance(false);
    }
  };

  const handleWorkerPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workerPaymentAssignmentId) return;
    const assignment = assignments.find(a => a.id === workerPaymentAssignmentId);
    if (!assignment) return;

    try {
      setIsSubmittingFinance(true);
      // workerId is derived from the assignment on the server, so a payout can
      // never be filed against the wrong person.
      await financeApi.createWorkerPayment({
        assignmentId: workerPaymentAssignmentId,
        amount: Number(workerPaymentAmount),
      });
      toast.success('Payout recorded');
      setWorkerPayments(await financeApi.workerPayments(bookingId));
      setShowWorkerPaymentForm(false);
      setWorkerPaymentAmount(0);
      setWorkerPaymentAssignmentId('');
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setIsSubmittingFinance(false);
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmittingFinance(true);
      // The API field is `description`, not `name` - the typed name was
      // stripped by the server and the required `description` was missing.
      await financeApi.createExpense({
        bookingId,
        description: expenseDescription,
        category: expenseCategory,
        amount: Number(expenseAmount),
        notes: expenseNotes || undefined,
      });
      toast.success('Expense added');
      setExpenses(await financeApi.expenses(bookingId));
      setShowExpenseForm(false);
      setExpenseDescription('');
      setExpenseAmount(0);
      setExpenseNotes('');
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setIsSubmittingFinance(false);
    }
  };

  if (loading) return <div className="py-12 flex justify-center"><Loader /></div>;
  if (!booking) return <div className="py-12 text-center text-gray-500">Booking not found</div>;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: DocumentText },
    { id: 'crew', label: 'Crew', icon: Profile2User },
    { id: 'events', label: 'Schedule', icon: Calendar },
    { id: 'contact', label: 'Contact', icon: Profile2User },
    { id: 'payments', label: 'Payments', icon: DollarCircle },
    { id: 'expenses', label: 'Expenses', icon: Receipt2 },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowLeft size={24} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              {booking.title || 'Untitled booking'} | {booking.eventType || 'Event'}
            </h1>
            <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${BOOKING_STATUS_CLASS[booking.status]}`}>
              {BOOKING_STATUS_LABEL[booking.status]}
            </span>
          </div>
          <p className="text-gray-500 mt-1 font-medium">
            {booking.eventDate ? new Date(booking.eventDate).toLocaleDateString() : 'Date TBD'} | {booking.location || 'Location TBD'}
          </p>
        </div>
      </div>

      {/* Moving a booking along its lifecycle used to require editing the
          database: the status was set once at creation and never again. */}
      <div className="flex flex-wrap items-center gap-2">
        {nextBookingStatuses(booking.status).map((status) => (
          <button
            key={status}
            type="button"
            disabled={isChangingStatus}
            onClick={() => handleStatusChange(status)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 ${status === BookingStatus.CANCELLED
                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                : 'bg-gray-900 text-white hover:bg-gray-800'
              }`}
          >
            {status === BookingStatus.CANCELLED
              ? 'Cancel booking'
              : `Mark ${BOOKING_STATUS_LABEL[status].toLowerCase()}`}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          {!isEditing && (
            <button
              type="button"
              onClick={startEditing}
              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              Edit details
            </button>
          )}
          <button
            type="button"
            onClick={handleDeleteBooking}
            className="px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="flex gap-2 border-b border-gray-200 pb-4 overflow-x-auto hide-scrollbar">
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all whitespace-nowrap ${isActive ? 'bg-black text-white' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                }`}
            >
              <Icon size={18} variant={isActive ? 'Bold' : 'Linear'} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8 shadow-sm border border-black/5 min-h-[400px]"
      >
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Overview</h2>

            {isEditing ? (
              <form onSubmit={handleSaveDetails} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="field-label">Event name</label>
                    <input
                      type="text"
                      value={editForm.title}
                      onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                      required
                      className="field-input"
                    />
                  </div>
                  <div>
                    <label className="field-label">Event type</label>
                    <select
                      value={editForm.eventType}
                      onChange={(e) => setEditForm({ ...editForm, eventType: e.target.value })}
                      className="field-input"
                    >
                      <option value="Wedding">Wedding</option>
                      <option value="LoveStory">Love Story</option>
                      <option value="Birthday">Birthday</option>
                      <option value="Commercial">Commercial</option>
                      <option value="Corporate">Corporate</option>
                      <option value="Engagement">Engagement</option>
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Location</label>
                    <input
                      type="text"
                      value={editForm.location}
                      onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
                      className="field-input"
                    />
                  </div>
                  <div>
                    <label className="field-label">Date</label>
                    <input
                      type="date"
                      value={editForm.eventDate}
                      onChange={(e) => setEditForm({ ...editForm, eventDate: e.target.value })}
                      className="field-input"
                    />
                  </div>
                  <div>
                    <label className="field-label">Agreed price ($)</label>
                    <NumberField
                      min={0}
                      value={editForm.agreedPrice}
                      onValueChange={(agreedPrice) => setEditForm({ ...editForm, agreedPrice })}
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="field-label">Notes</label>
                    <textarea
                      rows={3}
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      className="field-input"
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" onClick={() => setIsEditing(false)} className="btn-ghost">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSavingDetails} className="btn-primary">
                    {isSavingDetails ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <p className="font-medium">{BOOKING_STATUS_LABEL[booking.status]}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Agreed price</p>
                  <p className="font-medium">{money(booking.agreedPrice)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">{booking.eventDate ? new Date(booking.eventDate).toLocaleDateString() : 'Not set'}</p>
                </div>
              </div>
            )}
            {booking.notes && (
              <div>
                <p className="text-sm text-gray-500">Notes</p>
                <p className="mt-1 text-gray-900 bg-gray-50 p-4 rounded-xl">{booking.notes}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">Schedule</h2>
            {booking.eventParts?.map((part, i) => (
              <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-black/5">
                <h3 className="font-bold text-gray-900">{part.partType}</h3>
                <p className="text-sm text-gray-500">{part.venueName || 'No venue set'}</p>
                <div className="flex gap-4 mt-2 text-sm font-medium">
                  <span className="text-green-600">Start: {part.startAt ? new Date(part.startAt).toLocaleString() : '-'}</span>
                  <span className="text-red-600">End: {part.endAt ? new Date(part.endAt).toLocaleString() : '-'}</span>
                </div>
              </div>
            ))}
            {(!booking.eventParts || booking.eventParts.length === 0) && (
              <p className="text-gray-500">No schedule parts yet.</p>
            )}
          </div>
        )}

        {activeTab === 'crew' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Crew Assignments</h2>
            </div>

            <div className="overflow-x-auto border border-black/5 rounded-2xl bg-white shadow-sm">
              <table className="min-w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-black/5 text-sm text-gray-500">
                    <th className="p-4 font-medium whitespace-nowrap">Worker Type</th>
                    <th className="p-4 font-medium min-w-[200px]">Creative ID / Name</th>
                    <th className="p-4 font-medium whitespace-nowrap">Event</th>
                    <th className="p-4 font-medium whitespace-nowrap">Agreed Price ($)</th>
                    <th className="p-4 font-medium whitespace-nowrap">Deposit ($)</th>
                    <th className="p-4 font-medium whitespace-nowrap">Status</th>
                    <th className="p-4 font-medium min-w-[80px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {assignments.map((a) => (
                    <tr key={a.id} className="text-sm">
                      <td className="p-4 font-medium">
                        {editingAssignmentId === a.id ? (
                          <input
                            value={editingRole}
                            onChange={e => setEditingRole(e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded-lg outline-none focus:border-black text-sm"
                          />
                        ) : a.role}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center text-[10px] font-bold">
                            {initials(a.worker.fullName)}
                          </div>
                          <span className="font-medium text-gray-900">{a.worker.fullName}</span>
                        </div>
                      </td>
                      <td className="p-4 text-gray-600">
                        {a.assignedParts && a.assignedParts.length > 0
                          ? a.assignedParts.map(p => p.eventPart?.customName || p.eventPart?.partType || 'Unnamed Event').filter(Boolean).join(', ')
                          : '—'}
                      </td>
                      <td className="p-4 font-bold">
                        {editingAssignmentId === a.id ? (
                          <NumberField
                            value={editingFee}
                            onValueChange={setEditingFee}
                            className="w-24 px-2 py-1 border border-gray-300 rounded-lg outline-none focus:border-black text-sm font-normal"
                          />
                        ) : (a.agreedFee ? money(a.agreedFee) : '—')}
                      </td>
                      <td className="p-4 text-gray-500">
                        {editingAssignmentId === a.id ? (
                          <NumberField
                            value={editingDeposit}
                            onValueChange={setEditingDeposit}
                            className="w-24 px-2 py-1 border border-gray-300 rounded-lg outline-none focus:border-black text-sm font-normal"
                          />
                        ) : (a.deposit ? money(a.deposit) : '—')}
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${a.status === AssignmentStatus.CONFIRMED ? 'bg-green-50 text-green-700' :
                            a.status === AssignmentStatus.ASSIGNED ? 'bg-yellow-50 text-yellow-700' :
                              a.status === AssignmentStatus.DECLINED ? 'bg-red-50 text-red-700' :
                                'bg-gray-100 text-gray-700'
                          }`}>
                          {ASSIGNMENT_STATUS_LABEL[a.status] || a.status}
                        </span>
                      </td>
                      <td className="p-4 whitespace-nowrap">
                        {editingAssignmentId === a.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => saveEditingAssignment(a.id)}
                              className="px-2 py-1 text-xs font-medium bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelEditingAssignment}
                              className="px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEditingAssignment(a)}
                              className="p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                              <Edit2 size={16} color="currentColor" />
                            </button>
                            <button
                              onClick={() => handleRemoveAssignment(a.id)}
                              className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash size={16} color="currentColor" />
                            </button>
                          </div>
                        )}
                      </td>

                    </tr>
                  ))}

                  {showCrewForm && (
                    <tr className="bg-blue-50/30 text-sm">
                      <td className="p-3">
                        <input
                          type="text"
                          placeholder="Role..."
                          value={role}
                          onChange={e => setRole(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-black"
                        />
                      </td>
                      <td className="p-3">
                        <div>
                          <input
                            type="text"
                            placeholder="TM-ID or Select..."
                            value={lookupId}
                            onChange={e => setLookupId(e.target.value)}
                            list="team-list"
                            className="w-full min-w-[150px] px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none font-mono focus:border-black"
                          />
                          <datalist id="team-list">
                            {assignableTeam.map(member => (
                              <option key={member.id} value={member.workerPublicId || ''}>
                                {member.fullName} ({member.roleTitle || 'Creative'})
                              </option>
                            ))}
                          </datalist>
                          {isLookingUp && <div className="text-xs text-gray-500 mt-1">Searching...</div>}
                        </div>
                        {lookupResult && (
                          <div className="mt-2 text-xs font-medium text-green-700 bg-green-50 px-2 py-1 rounded-md inline-block">
                            Found: {lookupResult.worker.fullName}
                          </div>
                        )}
                        {lookupError && <div className="mt-2 text-xs text-red-600">{lookupError}</div>}
                      </td>
                      <td className="p-3 min-w-[160px]">
                        <select
                          value={selectedParts.length > 0 ? selectedParts[0] : ''}
                          onChange={(e) => setSelectedParts(e.target.value ? [e.target.value] : [])}
                          className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-black"
                        >
                          <option value="">Select Event...</option>
                          {booking.eventParts?.map((part) => (
                            <option key={part.id} value={part.id}>{part.customName || part.partType || 'Unnamed Event'}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3">
                        <NumberField value={agreedFee} onValueChange={setAgreedFee} className="w-10 px-1 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-black text-sm" />
                      </td>
                      <td className="p-3">
                        <NumberField value={deposit} onValueChange={setDeposit} className="w-10 px-1 py-2 bg-white border border-gray-200 rounded-lg outline-none focus:border-black text-sm" />
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => handleAssignSubmit()}
                          disabled={isAssigning || !workerId}
                          className="w-full px-3 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 disabled:opacity-50 whitespace-nowrap"
                        >
                          {isAssigning ? 'Wait...' : 'Invite / Save'}
                        </button>
                      </td>
                      <td className="p-3 text-center">
                        <button onClick={() => setShowCrewForm(false)} className="text-gray-400 hover:text-gray-900">
                          <CloseSquare size={20} />
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              {!showCrewForm && (
                <div className="p-4 border-t border-black/5 bg-gray-50/50">
                  <button
                    onClick={() => setShowCrewForm(true)}
                    className="flex items-center gap-2 text-sm font-bold text-gray-900 hover:text-gray-600 transition-colors"
                  >
                    + Add crew row
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'contact' && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold">Contact Information</h2>
            <div className="bg-gray-50 border border-black/5 rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-4 text-gray-900">{clientName(booking.client)}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Phone</p>
                  <p className="font-medium text-gray-900">{booking.client?.phone || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Email</p>
                  <p className="font-medium text-gray-900">{booking.client?.email || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">Instagram</p>
                  <p className="font-medium text-gray-900">{booking.client?.instagramHandle || '—'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'payments' && (
          <div className="space-y-8">
            {/* Client Payments */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Client payments</h2>
                <button onClick={() => setShowClientPaymentForm(!showClientPaymentForm)} className="px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800">
                  + Record payment
                </button>
              </div>

              {showClientPaymentForm && (
                <form onSubmit={handleClientPaymentSubmit} className="form-panel mb-4 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="field-label">Amount ($)</label>
                      <NumberField min={0} required value={clientPaymentAmount} onValueChange={setClientPaymentAmount} />
                    </div>
                    <div>
                      <label className="field-label">Payment type</label>
                      <select
                        value={clientPaymentType}
                        onChange={e => setClientPaymentType(e.target.value as ClientPaymentType)}
                        className="field-input"
                        required
                      >
                        <option value={ClientPaymentType.DEPOSIT}>Deposit</option>
                        <option value={ClientPaymentType.PAYMENT}>Payment</option>
                        <option value={ClientPaymentType.FINAL_PAYMENT}>Final payment</option>
                        <option value={ClientPaymentType.REFUND}>Refund</option>
                      </select>
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="button" onClick={() => setShowClientPaymentForm(false)} className="btn-ghost">
                      Cancel
                    </button>
                    <button type="submit" disabled={isSubmittingFinance} className="btn-primary">
                      {isSubmittingFinance ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {clientPayments.length === 0 ? <p className="text-gray-500 py-4 bg-gray-50 rounded-xl text-center">No payments yet</p> : clientPayments.map((p) => (
                  <div key={p.id} className="flex justify-between p-4 bg-white border rounded-xl">
                    <div>
                      <p className="font-bold">{money(p.amount)}</p>
                      <p className="text-xs text-gray-500">{formatDate(p.paymentDate)} • <span className="capitalize">{p.paymentType.replace('_', ' ').toLowerCase()}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <hr />

            {/* Worker Payments */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">Crew payouts</h2>
                <button onClick={() => setShowWorkerPaymentForm(!showWorkerPaymentForm)} className="px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800">
                  + Record payout
                </button>
              </div>

              {showWorkerPaymentForm && (
                <form onSubmit={handleWorkerPaymentSubmit} className="form-panel mb-4 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="field-label">Crew member</label>
                      <select value={workerPaymentAssignmentId} onChange={e => setWorkerPaymentAssignmentId(e.target.value)} className="field-input" required>
                        <option value="">Select...</option>
                        {assignments.map(a => (
                          <option key={a.id} value={a.id}>{a.worker.firstName} {a.worker.lastName} ({a.role})</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="field-label">Amount ($)</label>
                      <NumberField min={0} required value={workerPaymentAmount} onValueChange={setWorkerPaymentAmount} />
                    </div>
                  </div>
                  <div className="form-actions">
                    <button type="button" onClick={() => setShowWorkerPaymentForm(false)} className="btn-ghost">
                      Cancel
                    </button>
                    <button type="submit" disabled={isSubmittingFinance} className="btn-primary">
                      {isSubmittingFinance ? 'Saving…' : 'Save'}
                    </button>
                  </div>
                </form>
              )}

              <div className="space-y-3">
                {workerPayments.length === 0 ? <p className="text-gray-500 py-4 bg-gray-50 rounded-xl text-center">No payments yet</p> : workerPayments.map((p) => (
                  <div key={p.id} className="flex justify-between p-4 bg-white border rounded-xl">
                    <div>
                      <p className="font-bold">{money(p.amount)}</p>
                      <p className="text-xs text-gray-500">{formatDate(p.paymentDate)} • {p.worker.fullName}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Expenses</h2>
              <button onClick={() => setShowExpenseForm(!showExpenseForm)} className="px-4 py-2 bg-black text-white rounded-xl text-sm font-medium hover:bg-gray-800">
                + Add expense
              </button>
            </div>

            {showExpenseForm && (
              <form onSubmit={handleExpenseSubmit} className="form-panel space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="field-label">Description</label>
                    <input type="text" value={expenseDescription} onChange={e => setExpenseDescription(e.target.value)} className="field-input" required />
                  </div>
                  <div>
                    <label className="field-label">Category</label>
                    <select value={expenseCategory} onChange={e => setExpenseCategory(e.target.value)} className="field-input" required>
                      <option value="Equipment Rental">Equipment rental</option>
                      <option value="Transportation">Transportation</option>
                      <option value="Meals">Meals</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Amount ($)</label>
                    <NumberField min={0} required value={expenseAmount} onValueChange={setExpenseAmount} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="field-label">Notes</label>
                    <textarea value={expenseNotes} onChange={e => setExpenseNotes(e.target.value)} className="field-input" rows={2}></textarea>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" onClick={() => setShowExpenseForm(false)} className="btn-ghost">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmittingFinance} className="btn-primary">
                    {isSubmittingFinance ? 'Saving…' : 'Save'}
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {expenses.length === 0 ? <p className="text-gray-500 py-4 bg-gray-50 rounded-xl text-center">No expenses yet</p> : expenses.map((e) => (
                <div key={e.id} className="flex justify-between p-4 bg-white border rounded-xl">
                  <div>
                    <p className="font-bold">{e.description || e.category}</p>
                    <p className="text-xs text-gray-500">{formatDate(e.expenseDate)} • {e.category} {e.notes && `- ${e.notes}`}</p>
                  </div>
                  <div className="text-right font-bold text-red-600">
                    -{money(e.amount)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
