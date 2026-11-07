'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, UserAdd, Trash, CloseSquare } from 'iconsax-react';
import { useUser } from '@/libs/user-context';
import { apiErrorMessage } from '@/libs/api';
import { bookingsApi, crewApi, teamApi } from '@/libs/endpoints';
import { BookingStatus, type Booking, type CrewAssignment, type TeamMember } from '@/types/api';
import {
  ASSIGNMENT_STATUS_CLASS,
  ASSIGNMENT_STATUS_LABEL,
  eventPartLabel,
  eventPartVenue,
  memberName,
  money,
} from '@/libs/format';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Loader from '@/components/ui/Loader';
import { NumberField } from '@/components/ui/NumberField';
import { GlassButton } from '@/components/ui/GlassButton';

export default function CrewPage() {
  const { user, loading: userLoading } = useUser();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Selected state
  const [selectedBookingId, setSelectedBookingId] = useState<string>('');
  const [assignments, setAssignments] = useState<CrewAssignment[]>([]);
  const [selectedBookingDetails, setSelectedBookingDetails] = useState<Booking | null>(null);

  // Assign form state
  const [isAssigning, setIsAssigning] = useState(false);
  const [workerId, setWorkerId] = useState('');
  const [deposit, setDeposit] = useState<number>(0);
  const [lookupId, setLookupId] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [lookupError, setLookupError] = useState('');
  const [role, setRole] = useState('Photographer');
  const [agreedFee, setAgreedFee] = useState<number>(0);
  const [callTime, setCallTime] = useState('');
  const [selectedParts, setSelectedParts] = useState<string[]>([]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [allBookingsRes, team] = await Promise.all([bookingsApi.list({ limit: 100 }), teamApi.get()]);
      // Was compared against 'cancelled'; the API has always written the
      // capitalised form, so nothing was ever filtered out.
      setBookings(allBookingsRes.data.filter((b) => b.status !== BookingStatus.CANCELLED));
      setTeam(team.active);
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Failed to load data'));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (user?.studioId) {
      fetchInitialData();
    }
  }, [user]);

  const handleBookingSelect = async (bookingId: string) => {
    setSelectedBookingId(bookingId);
    if (!bookingId) {
      setAssignments([]);
      setSelectedBookingDetails(null);
      return;
    }

    try {
      setLoading(true);
      const [assignmentData, bookingDetail] = await Promise.all([
        crewApi.listByBooking(bookingId),
        bookingsApi.get(bookingId),
      ]);
      setAssignments(assignmentData);
      setSelectedBookingDetails(bookingDetail);
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Failed to load data'));
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = async () => {
    const id = lookupId.trim();
    if (!id || !selectedBookingId) return;
    setIsLookingUp(true);
    setLookupError('');
    setLookupResult(null);
    try {
      const result = await crewApi.checkAvailability(selectedBookingId, id);
      setLookupResult(result);
      setWorkerId(result.worker.id);
      if (result.worker.primaryRole) setRole(result.worker.primaryRole);
    } catch (error) {
      setLookupError(apiErrorMessage(error, 'Could not find that creative'));
      setWorkerId('');
    } finally {
      setIsLookingUp(false);
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
  }, [lookupId, selectedBookingId]);

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingId || !workerId) return;

    try {
      setIsAssigning(true);
      await crewApi.create({
        bookingId: selectedBookingId,
        workerId,
        role,
        agreedFee: Number(agreedFee),
        deposit: Number(deposit) || 0,
        callTime: callTime ? new Date(callTime).toISOString() : undefined,
        eventPartIds: selectedParts,
      });
      toast.success('Crew member assigned');
      setAssignments(await crewApi.listByBooking(selectedBookingId));
      
      // Reset form
      setWorkerId('');
      setAgreedFee(0);
      setDeposit(0);
      setCallTime('');
      setSelectedParts([]);
      setLookupId('');
      setLookupResult(null);
      setLookupError('');
    } catch (error) {
      toast.error(apiErrorMessage(error, 'Failed to assign the crew member'));
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveAssignment = async (id: string) => {
    if (!confirm('Remove this crew member from the booking?')) return;
    try {
      await crewApi.remove(id);
      toast.success('Crew member removed');
      setAssignments(assignments.filter(a => a.id !== id));
    } catch (error) {
      toast.error(apiErrorMessage(error));
    }
  };

  // Studio owners and admins are on the team but have no creative profile,
  // so the API cannot book them; offering them here only produced a 404.
  const assignableTeam = team.filter(member => member.workerProfileId);

  const togglePartSelection = (partId: string) => {
    if (selectedParts.includes(partId)) {
      setSelectedParts(selectedParts.filter(id => id !== partId));
    } else {
      setSelectedParts([...selectedParts, partId]);
    }
  };

  if (userLoading) return <div className="py-12 flex justify-center"><Loader /></div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 flex items-center gap-3">
            <Calendar size={32} className="text-orange-500" variant="Bulk" />
            Crew assignments
          </h1>
          <p className="text-gray-500 mt-1">Assign crew to bookings and set their roles</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Select Booking & Current Assignments */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-black/5">
            <label className="field-label">Select a booking</label>
            <select
              value={selectedBookingId}
              onChange={(e) => handleBookingSelect(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-black/5 rounded-xl focus:ring-2 focus:ring-orange-500/20 focus:bg-white text-gray-900 font-medium"
            >
              <option value="">Select a booking</option>
              {bookings.map(b => (
                <option key={b.id} value={b.id}>{b.title || 'Untitled booking'} ({b.eventType}) - {b.eventDate ? new Date(b.eventDate).toLocaleDateString() : 'No date set'}</option>
              ))}
            </select>
          </div>

          {selectedBookingId && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-3xl shadow-sm border border-black/5">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Assigned crew</h2>
              
              {loading ? (
                <div className="py-8 flex justify-center"><Loader /></div>
              ) : assignments.length === 0 ? (
                <div className="py-8 text-center bg-gray-50 rounded-2xl border border-black/5">
                  <p className="text-gray-500 text-sm font-medium">No crew assigned yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {assignments.map(assignment => (
                    <div key={assignment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-black/5">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-gray-900">{assignment.worker.fullName}</p>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ASSIGNMENT_STATUS_CLASS[assignment.status]}`}>
                            {ASSIGNMENT_STATUS_LABEL[assignment.status]}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{assignment.role} • {money(assignment.agreedFee)}</p>
                        {(assignment.assignedParts?.length ?? 0) > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {assignment.assignedParts.map((ap) => (
                              <span key={ap.id} className="text-[10px] bg-white border border-black/5 px-2 py-0.5 rounded-md text-gray-600">
                                {eventPartLabel(ap.eventPart)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button onClick={() => handleRemoveAssignment(assignment.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash size={18} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Right Column: Assign New Form */}
        <div className="lg:col-span-1">
          {selectedBookingId ? (
            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-sm border border-black/5 lg:sticky lg:top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <UserAdd size={20} className="text-orange-500" />
                New assignment
              </h2>
              
              {assignableTeam.length === 0 && (
                <p className="text-sm text-gray-500 bg-amber-50 border border-amber-100 rounded-xl p-3 mb-4">
                  No one on your team can be booked yet. Invite a creative from
                  <Link href="/admin/settings/team" className="font-semibold text-gray-900 underline ml-1">
                    Settings &rarr; Team
                  </Link>
                  {' '}using their TM- ID.
                </p>
              )}

              <form onSubmit={handleAssignSubmit} className="space-y-4">
                <div>
                  <label className="field-label">Crew member *</label>
                  <div>
                    <input 
                      type="text"
                      placeholder="TM-ID or Select..."
                      value={lookupId}
                      onChange={e => setLookupId(e.target.value)}
                      list="crew-team-list"
                      className="field-input"
                    />
                    <datalist id="crew-team-list">
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
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="field-label">Role</label>
                    <select value={role} onChange={e => setRole(e.target.value)} className="field-input">
                      <option value="Photographer">Photographer</option>
                      <option value="Videographer">Videographer</option>
                      <option value="Editor">Editor</option>
                      <option value="Assistant">Assistant</option>
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Fee ($)</label>
                    <NumberField min={0} required value={agreedFee} onValueChange={setAgreedFee} />
                  </div>
                  <div>
                    <label className="field-label">Deposit ($)</label>
                    <NumberField min={0} value={deposit} onValueChange={setDeposit} />
                  </div>
                </div>

                <div>
                  <label className="field-label">Call time</label>
                  <input
                    type="datetime-local"
                    value={callTime}
                    onChange={(e) => setCallTime(e.target.value)}
                    className="field-input"
                  />
                </div>

                {(selectedBookingDetails?.eventParts?.length ?? 0) > 0 && (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Event parts</label>
                    <div className="space-y-2">
                      {selectedBookingDetails?.eventParts?.map((part) => (
                        <label key={part.id} className="flex items-center gap-3 p-2 bg-gray-50 border border-black/5 rounded-xl cursor-pointer hover:bg-gray-100 transition-colors">
                          <input 
                            type="checkbox" 
                            checked={selectedParts.includes(part.id)}
                            onChange={() => togglePartSelection(part.id)}
                            className="w-4 h-4 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">{eventPartLabel(part)}</p>
                            {eventPartVenue(part) && (
                              <p className="text-[10px] text-gray-500 truncate">{eventPartVenue(part)}</p>
                            )}
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-2">
                  <button type="submit" disabled={isAssigning || !workerId} className="w-full py-3 rounded-xl bg-black text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-800 disabled:opacity-50 transition-colors">
                    {isAssigning && <Loader size="sm" />}
                    Assign
                  </button>
                </div>
              </form>
            </motion.div>
          ) : (
            <div className="bg-gray-50 border border-black/5 rounded-2xl sm:rounded-3xl p-6 sm:p-8 text-center flex flex-col items-center justify-center h-64">
              <Calendar size={48} className="text-gray-300 mb-4" variant="Bulk" />
              <p className="text-gray-500 font-medium">Pick a booking on the left to get started.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
