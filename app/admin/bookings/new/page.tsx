'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft2, ArrowRight2, Add, Trash } from 'iconsax-react';
import { useRouter } from 'next/navigation';
import { bookingsApi } from '@/libs/endpoints';
import { apiErrorMessage } from '@/libs/api';
import { localDateToIso } from '@/libs/booking-payload';
import toast from 'react-hot-toast';
import Loader from '@/components/ui/Loader';
import { NumberField } from '@/components/ui/NumberField';
import {
  startOfMonth, endOfMonth, eachDayOfInterval,
  format, isToday, addMonths, subMonths,
  startOfWeek, endOfWeek, isBefore, startOfDay,
} from 'date-fns';

// ─── constants ───────────────────────────────────────────────────────────────

const BOOKING_TYPES = ['Wedding', 'LoveStory', 'Birthday', 'Engagement', 'Corporate', 'Other'];
const PART_TYPES = ['Preparation', 'First Look', 'Photosession', 'Ceremony', 'Reception', 'Dinner', 'Dance', 'Party'];

const PEOPLE_PRESETS: Record<string, Array<{ personType: string; label: string }>> = {
  Wedding:    [{ personType: 'bride',          label: 'Bride' },           { personType: 'groom',    label: 'Groom' }],
  LoveStory:  [{ personType: 'partner1',       label: 'Partner 1' },       { personType: 'partner2', label: 'Partner 2' }],
  Birthday:   [{ personType: 'birthday_person',label: 'Birthday Person' }],
  Engagement: [{ personType: 'bride',          label: 'Bride' },           { personType: 'groom',    label: 'Groom' }],
  Corporate:  [{ personType: 'client',         label: 'Client / Contact' }],
  Other:      [],
};

const PEOPLE_STEP_TITLE: Record<string, string> = {
  Wedding: 'Bride & Groom', LoveStory: 'Partners', Birthday: 'Birthday Person',
  Engagement: 'Bride & Groom', Corporate: 'Contact Person', Other: 'People',
};

type StepKey = 'calendar' | 'basic' | 'people' | 'events' | 'price';
const FLOW: StepKey[] = ['calendar', 'basic', 'people', 'events', 'price'];

type Person = { personType: string; label: string; name: string };
type Part   = { title: string; startTime: string; endTime: string };

function defaultPeople(bookingType: string): Person[] {
  return (PEOPLE_PRESETS[bookingType] ?? []).map(p => ({ ...p, name: '' }));
}

// ─── Step header ─────────────────────────────────────────────────────────────

function StepHeader({ stepIndex, title, subtitle, onBack }: {
  stepIndex: number; title: string; subtitle?: string; onBack: () => void;
}) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-4">
        <button type="button" onClick={onBack}
          className="w-12 h-12 rounded-full hover:bg-black/5 flex items-center justify-center transition-colors">
          <ArrowLeft2 size={24} className="text-gray-900" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-2">
        {FLOW.map((_, i) => (
          <div key={i} className={`h-2 rounded-full transition-all duration-300 ${
            i === stepIndex ? 'w-8 bg-black' : i < stepIndex ? 'w-4 bg-black/20' : 'w-4 bg-black/10'
          }`} />
        ))}
      </div>
    </div>
  );
}

// ─── Slide wrapper ────────────────────────────────────────────────────────────

function Slide({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <motion.div key={id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
      {children}
    </motion.div>
  );
}

// ─── Main wizard ──────────────────────────────────────────────────────────────

export default function NewBookingWizard() {
  const router = useRouter();
  const [stepKey, setStepKey] = useState<StepKey>('calendar');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // form state
  const [date, setDate]               = useState('');
  const [bookingType, setBookingType] = useState('Wedding');
  const [location, setLocation]       = useState('');
  const [people, setPeople]           = useState<Person[]>(defaultPeople('Wedding'));
  const [parts, setParts]             = useState<Part[]>([{ title: '', startTime: '', endTime: '' }]);
  const [agreedPrice, setAgreedPrice] = useState(0);
  const [deposit, setDeposit]         = useState(0);
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  // calendar
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const daysInMonth = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth));
    const end   = endOfWeek(endOfMonth(currentMonth));
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const stepIndex = FLOW.indexOf(stepKey);
  const goNext = () => { const next = FLOW[stepIndex + 1]; if (next) setStepKey(next); };
  const goBack = () => {
    if (stepIndex === 0) { router.back(); return; }
    setStepKey(FLOW[stepIndex - 1]);
  };

  const handleSetBookingType = (t: string) => {
    setBookingType(t);
    setPeople(defaultPeople(t));
  };

  const handleDateSelect = (d: Date) => {
    setDate(format(d, 'yyyy-MM-dd'));
    goNext();
  };

  // people helpers
  const updatePersonName  = (i: number, val: string) => setPeople(people.map((p, idx) => idx === i ? { ...p, name: val } : p));
  const updatePersonLabel = (i: number, val: string) => setPeople(people.map((p, idx) => idx === i ? { ...p, label: val, personType: val.toLowerCase().replace(/\s+/g, '_') } : p));
  const addPerson    = () => setPeople([...people, { personType: 'person', label: '', name: '' }]);
  const removePerson = (i: number) => setPeople(people.filter((_, idx) => idx !== i));

  // parts helpers
  const updatePart  = (i: number, field: keyof Part, val: string) => setParts(parts.map((p, idx) => idx === i ? { ...p, [field]: val } : p));
  const addPart     = () => setParts([...parts, { title: '', startTime: '', endTime: '' }]);
  const removePart  = (i: number) => setParts(parts.filter((_, idx) => idx !== i));

  const handleSubmit = async () => {
    if (!date) { toast.error('Please select a date'); return; }
    try {
      setIsSubmitting(true);

      const finalParts = parts.filter(p => p.title.trim()).map((p, idx) => ({
        partType: p.title,
        venueName: location || undefined,
        startAt: p.startTime ? `${date}T${p.startTime}:00.000Z` : undefined,
        endAt:   p.endTime   ? `${date}T${p.endTime}:00.000Z`   : undefined,
        sortOrder: idx,
      }));

      const finalPeople: any[] = people.filter(p => p.name.trim()).map(p => {
        const [fn, ...rest] = p.name.trim().split(' ');
        return { personType: p.personType, firstName: fn, lastName: rest.join(' ') || undefined };
      });
      if (contactName.trim()) {
        const [fn, ...rest] = contactName.trim().split(' ');
        finalPeople.push({ personType: 'client', firstName: fn, lastName: rest.join(' ') || undefined, phone: contactPhone || undefined });
      }

      const buildTitle = () => {
        const first = people.find(p => p.name.trim());
        const second = people[1]?.name?.trim();
        if (first && second) return `${first.name.trim().split(' ')[0]} & ${second.split(' ')[0]}`;
        if (first) return `${first.name.trim().split(' ')[0]}'s ${bookingType}`;
        if (contactName.trim()) return `${contactName.trim().split(' ')[0]}'s ${bookingType}`;
        return `New ${bookingType}`;
      };

      const response = await bookingsApi.create({
        title: buildTitle(),
        eventType: bookingType,
        eventDate: localDateToIso(date),
        location: location || undefined,
        agreedPrice: agreedPrice || undefined,
        deposit: deposit || undefined,
        people: finalPeople.length ? finalPeople : undefined,
        parts:  finalParts.length  ? finalParts  : undefined,
      } as any);

      toast.success('Booking created');
      router.push(`/admin/bookings/${response.id}`);
    } catch (error) {
      toast.error(apiErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const restAmount = Math.max(0, agreedPrice - deposit);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-3xl mx-auto w-full pb-20">
      <AnimatePresence mode="wait">

        {/* ── STEP 1: Calendar ─────────────────────────────────────────── */}
        {stepKey === 'calendar' && (
          <Slide id="calendar">
            <StepHeader stepIndex={0} title="Select a Date" subtitle="Pick the event date to get started." onBack={goBack} />
            <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] shadow-sm border border-black/5 max-w-lg mx-auto">
              <div className="flex items-center justify-between mb-6">
                <button type="button" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                  className="w-10 h-10 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center">
                  <ArrowLeft2 size={20} className="text-gray-900" />
                </button>
                <h3 className="text-xl font-bold">{format(currentMonth, 'MMMM yyyy')}</h3>
                <button type="button" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                  className="w-10 h-10 hover:bg-gray-100 rounded-full transition-colors flex items-center justify-center">
                  <ArrowRight2 size={20} className="text-gray-900" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                  <div key={d} className="text-center text-xs font-semibold text-gray-400 py-2">{d}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {daysInMonth.map((d, i) => {
                  const isPast        = isBefore(startOfDay(d), startOfDay(new Date()));
                  const isSelected    = date === format(d, 'yyyy-MM-dd');
                  const isCurrentMonth = d.getMonth() === currentMonth.getMonth();
                  return (
                    <button type="button" key={i} disabled={isPast} onClick={() => handleDateSelect(d)}
                      className={[
                        'aspect-square flex items-center justify-center rounded-xl text-sm font-medium transition-all',
                        !isCurrentMonth ? 'text-gray-300' : isPast ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100',
                        isSelected ? 'bg-black text-white hover:bg-black scale-105 shadow-xl' : '',
                        isToday(d) && !isSelected ? 'border-2 border-black/10' : '',
                      ].join(' ')}>
                      {format(d, 'd')}
                    </button>
                  );
                })}
              </div>
            </div>
          </Slide>
        )}

        {/* ── STEP 2: Basic Details ────────────────────────────────────── */}
        {stepKey === 'basic' && (
          <Slide id="basic">
            <StepHeader stepIndex={1} title="Basic Details" subtitle={date ? format(new Date(date + 'T12:00:00'), 'MMMM d, yyyy') : ''} onBack={goBack} />
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-black/5">
                <p className="field-label mb-3">Booking Type</p>
                <div className="flex flex-wrap gap-2">
                  {BOOKING_TYPES.map(t => (
                    <button key={t} type="button" onClick={() => handleSetBookingType(t)}
                      className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                        bookingType === t ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-black/5">
                <label className="field-label">Main Location</label>
                <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                  placeholder="e.g. Grand Plaza Hotel" className="field-input mt-1" />
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={goNext}
                  className="px-8 py-4 rounded-2xl bg-black text-white font-semibold hover:bg-gray-900 transition-colors shadow-xl flex items-center gap-2">
                  Continue <ArrowRight2 size={18} />
                </button>
              </div>
            </div>
          </Slide>
        )}

        {/* ── STEP 3: People ───────────────────────────────────────────── */}
        {stepKey === 'people' && (
          <Slide id="people">
            <StepHeader stepIndex={2} title={PEOPLE_STEP_TITLE[bookingType] ?? 'People'} subtitle={date ? format(new Date(date + 'T12:00:00'), 'MMMM d, yyyy') : ''} onBack={goBack} />
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-black/5 space-y-4">
                {bookingType === 'Other' ? (
                  // Dynamic
                  <>
                    {people.map((p, i) => (
                      <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-black/5 space-y-3 relative">
                        <button type="button" onClick={() => removePerson(i)}
                          className="absolute top-3 right-3 w-7 h-7 bg-white text-red-400 hover:text-red-600 rounded-full shadow-sm flex items-center justify-center border border-black/5">
                          <Trash size={14} color="currentColor" />
                        </button>
                        <input type="text" value={p.label} onChange={e => updatePersonLabel(i, e.target.value)}
                          placeholder="Role (e.g. Host, Speaker, Birthday Boy…)" className="field-input bg-white" />
                        <input type="text" value={p.name} onChange={e => updatePersonName(i, e.target.value)}
                          placeholder="Full Name" className="field-input bg-white" />
                      </div>
                    ))}
                    <button type="button" onClick={addPerson}
                      className="w-full py-3 rounded-2xl border border-dashed border-gray-300 text-gray-500 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                      <Add size={16} color="currentColor" /> Add person
                    </button>
                  </>
                ) : (
                  // Fixed presets
                  people.map((p, i) => (
                    <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-black/5 space-y-2">
                      <p className="text-sm font-semibold text-gray-700">{p.label}</p>
                      <input type="text" value={p.name} onChange={e => updatePersonName(i, e.target.value)}
                        placeholder={`${p.label}'s full name`} className="field-input bg-white" />
                    </div>
                  ))
                )}
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={goNext}
                  className="px-8 py-4 rounded-2xl bg-black text-white font-semibold hover:bg-gray-900 transition-colors shadow-xl flex items-center gap-2">
                  Continue <ArrowRight2 size={18} />
                </button>
              </div>
            </div>
          </Slide>
        )}

        {/* ── STEP 4: Events ───────────────────────────────────────────── */}
        {stepKey === 'events' && (
          <Slide id="events">
            <StepHeader stepIndex={3} title="Booking Events" subtitle={date ? format(new Date(date + 'T12:00:00'), 'MMMM d, yyyy') : ''} onBack={goBack} />
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-black/5 space-y-4">
                {parts.map((part, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-2xl border border-black/5 space-y-3 relative group">
                    <button type="button" onClick={() => removePart(i)}
                      className="absolute -top-3 -right-3 w-8 h-8 bg-white text-gray-400 hover:text-red-500 rounded-full shadow-md flex items-center justify-center border border-black/5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                      <Trash size={16} color="currentColor" />
                    </button>

                    {/* Preset chips */}
                    <div className="flex flex-wrap gap-1.5">
                      {PART_TYPES.map(pt => (
                        <button key={pt} type="button" onClick={() => updatePart(i, 'title', pt)}
                          className={`px-3 py-1 rounded-lg text-xs font-semibold border transition-all ${
                            part.title === pt ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}>
                          {pt}
                        </button>
                      ))}
                    </div>

                    <input type="text" list={`part-types-${i}`} value={part.title}
                      onChange={e => updatePart(i, 'title', e.target.value)}
                      placeholder="Event name (e.g. Ceremony)" className="field-input bg-white" />
                    <datalist id={`part-types-${i}`}>{PART_TYPES.map(t => <option key={t} value={t} />)}</datalist>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="field-label text-xs">Start Time</label>
                        <input type="time" value={part.startTime} onChange={e => updatePart(i, 'startTime', e.target.value)} className="field-input bg-white" />
                      </div>
                      <div>
                        <label className="field-label text-xs">End Time</label>
                        <input type="time" value={part.endTime} onChange={e => updatePart(i, 'endTime', e.target.value)} className="field-input bg-white" />
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" onClick={addPart}
                  className="w-full py-3 rounded-2xl border border-dashed border-gray-300 text-gray-500 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                  <Add size={16} color="currentColor" /> Add another event
                </button>
              </div>
              <div className="flex justify-end">
                <button type="button" onClick={goNext}
                  className="px-8 py-4 rounded-2xl bg-black text-white font-semibold hover:bg-gray-900 transition-colors shadow-xl flex items-center gap-2">
                  Continue <ArrowRight2 size={18} />
                </button>
              </div>
            </div>
          </Slide>
        )}

        {/* ── STEP 5: Price & Contact ───────────────────────────────────── */}
        {stepKey === 'price' && (
          <Slide id="price">
            <StepHeader stepIndex={4} title="Price & Contact" subtitle={date ? format(new Date(date + 'T12:00:00'), 'MMMM d, yyyy') : ''} onBack={goBack} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Payment */}
              <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-black/5 space-y-5">
                <h3 className="text-xl font-bold text-gray-900">Payment</h3>
                <div>
                  <label className="field-label">Agreed Price ($)</label>
                  <NumberField required min={0} value={agreedPrice} onValueChange={setAgreedPrice} />
                </div>
                <div>
                  <label className="field-label">Deposit Received ($)</label>
                  <NumberField required min={0} max={agreedPrice} value={deposit} onValueChange={setDeposit} />
                </div>
                {agreedPrice > 0 && (
                  <div className="p-4 bg-purple-50 rounded-xl border border-purple-100 flex items-center justify-between">
                    <span className="text-sm font-medium text-purple-900">Remaining</span>
                    <span className="text-lg font-bold text-purple-900">${restAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>

              {/* Contact & Save */}
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-black/5 space-y-4">
                  <h3 className="text-xl font-bold text-gray-900">Contact</h3>
                  <div>
                    <label className="field-label">Contact Name</label>
                    <input type="text" value={contactName} onChange={e => setContactName(e.target.value)}
                      placeholder="Full name" className="field-input mt-1" />
                  </div>
                  <div>
                    <label className="field-label">Contact Number</label>
                    <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)}
                      placeholder="+1 234 567 8900" className="field-input mt-1" />
                  </div>
                </div>

                <button type="button" onClick={handleSubmit} disabled={isSubmitting}
                  className="w-full py-4 rounded-2xl bg-black text-white font-semibold hover:bg-gray-900 transition-colors shadow-xl flex items-center justify-center gap-2 disabled:opacity-60">
                  {isSubmitting ? <Loader size="sm" /> : null}
                  {isSubmitting ? 'Saving…' : 'Create Booking'}
                </button>
              </div>
            </div>
          </Slide>
        )}

      </AnimatePresence>
    </motion.div>
  );
}
