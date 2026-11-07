'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { BentoCard } from '@/components/ui/BentoCard';
import { ArrowLeft2, ArrowRight2, CloseSquare } from 'iconsax-react';
import { RefreshCw } from 'lucide-react';
import { useBookings } from '@/hooks/api/useBookings';
import { bookingsToCalendarEvents, type CalendarEvent } from '@/libs/format';

// Grid geometry. These were declared below the auto-scroll effect that reads
// HOUR_HEIGHT, so the effect referenced it before initialisation.
const START_HOUR = 0;
const HOURS_COUNT = 24; // Full 24-hour day (00:00 to 24:00)
const HOUR_HEIGHT = 50;

function parseTime(timeStr: string) {
   const [h, m] = timeStr.split(':').map(Number);
   return h + (m / 60);
}

// Color palette for events (cycles by index)
const EVENT_COLORS = [
   'bg-blue-500/15 text-blue-700 border-blue-500',
   'bg-indigo-500/15 text-indigo-700 border-indigo-500',
   'bg-pink-500/15 text-pink-700 border-pink-500',
   'bg-purple-500/15 text-purple-700 border-purple-500',
   'bg-rose-500/15 text-rose-700 border-rose-500',
   'bg-emerald-500/15 text-emerald-700 border-emerald-500',
   'bg-orange-500/15 text-orange-700 border-orange-500',
   'bg-cyan-500/15 text-cyan-700 border-cyan-500',
];

const EVENT_DOT_COLORS = [
   'bg-[#1a73e8]', // Google Blue
   'bg-[#0b8043]', // Google Green
   'bg-[#d93025]', // Google Red
   'bg-[#f6bf26]', // Google Yellow
   'bg-[#8e24aa]', // Purple
   'bg-[#039be5]', // Light blue
   'bg-[#e67c73]', // Flamingo
   'bg-[#3f51b5]', // Indigo
];

function formatMonthTime(timeStr?: string) {
   if (!timeStr) return '';
   const [hStr, mStr] = timeStr.split(':');
   const h = parseInt(hStr, 10);
   const m = parseInt(mStr, 10);
   if (isNaN(h)) return timeStr;
   const ampm = h >= 12 ? 'pm' : 'am';
   const displayH = h % 12 === 0 ? 12 : h % 12;
   return m === 0 ? `${displayH}${ampm}` : `${displayH}:${String(m).padStart(2, '0')}${ampm}`;
}

function getWeekDates(weekOffset = 0) {
   const today = new Date();
   today.setDate(today.getDate() + weekOffset * 7);
   const dayOfWeek = today.getDay(); // 0 = Sun
   const sunday = new Date(today);
   sunday.setDate(today.getDate() - dayOfWeek);

   return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      return {
         date: `${yyyy}-${mm}-${dd}`,
         day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][i],
         num: d.getDate(),
         isToday:
            d.toDateString() === new Date().toDateString(),
      };
   });
}

export function ScheduleCard() {
   const router = useRouter();
   const [view, setView] = useState('Week');
   const [weekOffset, setWeekOffset] = useState(0);
   const [monthOffset, setMonthOffset] = useState(0);
   const [dayOffset, setDayOffset] = useState(0);
   const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
   const [isSyncing, setIsSyncing] = useState(false);
   const timeGridScrollRef = useRef<HTMLDivElement>(null);

   const { bookings, loading, fetchBookings: fetchAssignments } = useBookings();

   // Bookings carry `eventDate` + `eventParts`; the grid below works in
   // date/startTime/endTime, so flatten once here.
   const assignments: CalendarEvent[] = React.useMemo(
      () => bookingsToCalendarEvents(bookings),
      [bookings],
   );

   const weekDates = getWeekDates(weekOffset);
   const todayStr = new Date().toLocaleDateString('en-CA');

   // Day view date
   const targetDayDate = new Date();
   targetDayDate.setDate(targetDayDate.getDate() + dayOffset);
   const targetDayStr = targetDayDate.toLocaleDateString('en-CA');
   const dayNameLabel = targetDayDate.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

   // Month view date & matrix (matching Google Calendar)
   const targetMonthDate = new Date();
   targetMonthDate.setDate(1);
   targetMonthDate.setMonth(targetMonthDate.getMonth() + monthOffset);
   const targetYear = targetMonthDate.getFullYear();
   const targetMonth = targetMonthDate.getMonth();
   const monthNameLabel = targetMonthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });

   const firstDayOfMonth = new Date(targetYear, targetMonth, 1);
   const startDayOfWeek = firstDayOfMonth.getDay(); // 0 = Sun
   const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0);
   const daysInMonth = lastDayOfMonth.getDate();

   const gridStartDate = new Date(targetYear, targetMonth, 1 - startDayOfWeek);
   const totalCells = (startDayOfWeek + daysInMonth) > 35 ? 42 : 35;

   const monthGridDays = Array.from({ length: totalCells }, (_, i) => {
      const d = new Date(gridStartDate);
      d.setDate(gridStartDate.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const isCurrentMonth = d.getMonth() === targetMonth;
      const isToday = dateStr === todayStr;
      const dayNum = d.getDate();
      const displayLabel = dayNum === 1
         ? `${d.toLocaleString('en-US', { month: 'short' })} 1`
         : String(dayNum);

      return {
         date: dateStr,
         dayNum,
         displayLabel,
         isCurrentMonth,
         isToday,
      };
   });

   const now = new Date();
   const currentTime = now.getHours() + now.getMinutes() / 60;

   // Refresh on focus, plus a slow poll. This used to re-fetch every 4
   // seconds, which is a request per booking list per user per 4s.
   useEffect(() => {
      const load = () => {
         fetchAssignments().catch(() => {
            /* surfaced by the hook's error state */
         });
      };
      load();

      const pollTimer = setInterval(load, 120_000);

      const onFocus = () => load();
      window.addEventListener('focus', onFocus);
      document.addEventListener('visibilitychange', onFocus);

      return () => {
         clearInterval(pollTimer);
         window.removeEventListener('focus', onFocus);
         document.removeEventListener('visibilitychange', onFocus);
      };
   }, [fetchAssignments]);

   // Google Calendar style auto-scroll to current hour (or earliest event today)
   useEffect(() => {
      if ((view === 'Week' || view === 'Day') && timeGridScrollRef.current && !loading) {
         const currentHour = now.getHours();
         let targetHour = Math.max(0, currentHour - 1.5);

         const todayEvents = assignments.filter(a => a.date === todayStr && a.startTime);
         if (todayEvents.length > 0) {
            const earliestStart = Math.min(...todayEvents.map(a => parseTime(a.startTime)));
            if (!isNaN(earliestStart) && earliestStart < targetHour) {
               targetHour = Math.max(0, earliestStart - 1);
            }
         }

         const targetScrollTop = Math.max(0, targetHour * HOUR_HEIGHT);
         timeGridScrollRef.current.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth',
         });
      }
   }, [loading, view, weekOffset, dayOffset]);

   // There is no calendar-sync endpoint (this used to POST to
   // `/calendar/sync`, which has never existed); refresh the bookings instead.
   const handleManualSync = async () => {
      setIsSyncing(true);
      try {
         await fetchAssignments();
      } finally {
         setIsSyncing(false);
      }
   };


   const HOURS = Array.from({ length: HOURS_COUNT }, (_, i) => {
      const val = START_HOUR + i;
      const label = val === 0 ? '12 AM' : val < 12 ? `${val} AM` : val === 12 ? '12 PM' : `${val - 12} PM`;
      return { label, val };
   });

   const handleSlotClick = (dateStr: string, hourVal: number) => {
      const timeStr = `${String(hourVal).padStart(2, '0')}:00`;
      const datetime = `${dateStr}T${timeStr}`;
      // `/admin/projects/new` does not exist - the route is /admin/bookings/new.
      router.push(`/admin/bookings/new?date=${dateStr}&time=${timeStr}`);
   };

   const processedEvents = assignments
      .filter(a => a.startTime && a.endTime && a.date)
      .map((a, idx) => {
         const start = parseTime(a.startTime);
         const end = parseTime(a.endTime);
         const top = (start - START_HOUR) * HOUR_HEIGHT;
         const height = Math.max((end - start) * HOUR_HEIGHT, 28);
         return {
            ...a,
            start,
            end,
            top,
            height,
            // Tailwind cannot generate classes from runtime strings, so the
            // old `bg-[${a.color}]` interpolation produced no styling at all.
            color: EVENT_COLORS[idx % EVENT_COLORS.length],
         };
      });

   // Header label
   let headerLabel = '';
   if (view === 'Month') {
      headerLabel = monthNameLabel;
   } else if (view === 'Day') {
      headerLabel = dayNameLabel;
   } else {
      const firstDay = weekDates[0];
      const lastDay = weekDates[6];
      headerLabel = `${firstDay.day} ${firstDay.num} – ${lastDay.day} ${lastDay.num}`;
   }

   const handlePrev = () => {
      if (view === 'Month') setMonthOffset(m => m - 1);
      else if (view === 'Day') setDayOffset(d => d - 1);
      else setWeekOffset(w => w - 1);
   };

   const handleNext = () => {
      if (view === 'Month') setMonthOffset(m => m + 1);
      else if (view === 'Day') setDayOffset(d => d + 1);
      else setWeekOffset(w => w + 1);
   };

   const handleToday = () => {
      setWeekOffset(0);
      setMonthOffset(0);
      setDayOffset(0);
   };

   const isNotCurrentPeriod = view === 'Month' ? monthOffset !== 0 : view === 'Day' ? dayOffset !== 0 : weekOffset !== 0;

   const renderDayColumn = (dateStr: string, isDayView: boolean) => {
      const dayEvents = processedEvents
         .filter(e => e.date === dateStr)
         .sort((a, b) => a.start - b.start);

      return (
         <div className="flex-1 border-r border-gray-100/50 relative h-full">
            {dayEvents.length === 0 && !loading && (
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-[9px] text-gray-200 select-none">—</span>
               </div>
            )}
            {dayEvents.map((ev, idx) => {
               const overlapOffset = idx > 0 && dayEvents[idx - 1].end > ev.start ? 20 : 0;
               return (
                  <div
                     key={ev.id}
                     onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEvent({ id: ev.id, bookingId: ev.bookingId, title: ev.title, date: ev.date, startTime: ev.startTime, endTime: ev.endTime, location: ev.location });
                     }}
                     className="absolute px-1 w-full pointer-events-auto"
                     style={{
                        top: ev.top + 2,
                        height: ev.height - 4,
                        left: `${overlapOffset}%`,
                        width: `calc(100% - ${overlapOffset}%)`,
                        zIndex: 10 + idx
                     }}
                  >
                     <div className={`w-full h-full rounded-md border-l-[3px] p-1.5 overflow-hidden shadow-xs transition-transform hover:scale-[1.01] cursor-pointer backdrop-blur-md ${ev.color}`}>
                        <p className="text-[11px] font-semibold leading-tight truncate">{ev.title || 'Untitled'}</p>
                        {(isDayView || ev.height > 26) && (
                           <p className="text-[9px] opacity-80 mt-0.5 font-medium truncate">
                              {formatMonthTime(ev.startTime)} – {formatMonthTime(ev.endTime)}
                           </p>
                        )}
                     </div>
                  </div>
               );
            })}
         </div>
      );
   };

   return (
      <BentoCard variant="light" className="p-5 flex flex-col relative">
         <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
               <button
                  onClick={handlePrev}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
               >
                  <ArrowLeft2 size={14} />
               </button>
               <p className="text-sm font-semibold text-gray-800 min-w-[150px] text-center">{headerLabel}</p>
               <button
                  onClick={handleNext}
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
               >
                  <ArrowRight2 size={14} />
               </button>
               <button
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  title="Sync with Google Calendar"
                  className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-50 ml-0.5"
               >
                  <RefreshCw size={13} className={isSyncing ? 'animate-spin text-gray-700' : ''} />
               </button>
               {isNotCurrentPeriod && (
                  <button
                     onClick={handleToday}
                     className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium transition-colors ml-1"
                  >
                     Today
                  </button>
               )}
            </div>
            <div className="flex gap-1 text-xs text-gray-500 bg-gray-100/50 p-1 rounded-xl">
               {['Day', 'Week', 'Month'].map((v) => (
                  <button
                     key={v}
                     onClick={() => setView(v)}
                     id={`schedule-view-${v.toLowerCase()}`}
                     className={`px-3 py-1 rounded-lg transition-colors ${v === view ? 'bg-white font-medium text-gray-800 shadow-sm' : 'hover:text-gray-800'}`}
                  >
                     {v}
                  </button>
               ))}
            </div>
         </div>

         {/* Calendar Canvas */}
         <div className="relative border border-gray-100/80 rounded-xl overflow-hidden bg-white">
            {loading && (
               <div className="absolute inset-0 flex items-center justify-center z-40 bg-white/60">
                  <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
               </div>
            )}
            {(view === 'Day' || view === 'Week') && (
               <div
                  ref={timeGridScrollRef}
                  className="h-[620px] overflow-y-auto relative scroll-smooth border-t border-gray-100/80 [scrollbar-width:thin] [scrollbar-color:#d1d5db_transparent]"
               >
                  {/* Sticky Day Header — stays pinned while scrolling hours */}
                  {view === 'Week' && (
                     <div className="sticky top-0 bg-white/95 backdrop-blur-md z-30 flex ml-14 border-b border-gray-200 py-2 shadow-2xs">
                        {weekDates.map((d) => (
                           <div key={d.date} className="flex-1 text-center py-0.5">
                              <p className={`text-[10px] font-semibold uppercase tracking-wider ${
                                 d.isToday ? 'text-[#1a73e8] font-bold' : 'text-gray-400'
                              }`}>
                                 {d.day}
                              </p>
                              <div className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center mx-auto text-xs font-semibold ${
                                 d.isToday
                                    ? 'bg-[#1a73e8] text-white shadow-xs font-bold'
                                    : 'text-gray-700 hover:bg-gray-100 transition-colors'
                              }`}>
                                 {d.num}
                              </div>
                           </div>
                        ))}
                     </div>
                  )}

                  {view === 'Day' && (
                     <div className="sticky top-0 bg-white/95 backdrop-blur-md z-30 flex ml-14 border-b border-gray-200 py-2.5 px-4 items-center justify-between shadow-2xs">
                        <div className="flex items-center gap-2">
                           <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              targetDayStr === todayStr ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-700'
                           }`}>
                              {dayNameLabel}
                           </span>
                           {targetDayStr === todayStr && (
                              <span className="text-[10px] font-semibold text-blue-500">• TODAY</span>
                           )}
                        </div>
                     </div>
                  )}

                  {/* Grid */}
                  <div className="relative" style={{ height: `${HOURS_COUNT * HOUR_HEIGHT}px` }}>
                     {HOURS.map((hour) => (
                        <div key={hour.val} className="absolute w-full flex" style={{ top: (hour.val - START_HOUR) * HOUR_HEIGHT, height: HOUR_HEIGHT }}>
                           <div className="w-14 text-right pr-3 -mt-2 shrink-0">
                              <span className="text-[10px] font-medium text-gray-400">{hour.label}</span>
                           </div>
                           <div className="flex-1 border-t border-gray-100 flex">
                              {view === 'Week' && weekDates.map(d => (
                                 <div
                                    key={d.date}
                                    onClick={() => handleSlotClick(d.date, hour.val)}
                                    title={`Book slot: ${d.day} ${d.num} at ${hour.label}`}
                                    className="flex-1 border-r border-gray-50/50 hover:bg-indigo-500/5 cursor-pointer transition-colors"
                                 />
                              ))}
                              {view === 'Day' && (
                                 <div
                                    onClick={() => handleSlotClick(targetDayStr, hour.val)}
                                    title={`Book slot at ${hour.label}`}
                                    className="flex-1 hover:bg-indigo-500/5 cursor-pointer transition-colors"
                                 />
                              )}
                           </div>
                        </div>
                     ))}

                     {/* Current Time Indicator */}
                     {((view === 'Week' && weekOffset === 0) || (view === 'Day' && dayOffset === 0)) && (
                        <div
                           className="absolute w-full flex items-center z-20 pointer-events-none"
                           style={{ top: (currentTime - START_HOUR) * HOUR_HEIGHT }}
                        >
                           <div className="w-14 text-right pr-2">
                              <span className="text-[10px] font-bold text-red-500">
                                 {String(now.getHours()).padStart(2, '0')}:{String(now.getMinutes()).padStart(2, '0')}
                              </span>
                           </div>
                           <div className="flex-1 relative">
                              <div className="absolute left-[-4px] top-[-4px] w-2 h-2 rounded-full bg-red-500" />
                              <div className="w-full border-t-2 border-red-500" />
                           </div>
                        </div>
                     )}

                     {/* Render Overlays */}
                     <div className="absolute top-0 bottom-0 right-0 left-14 flex pointer-events-none">
                        {view === 'Day'
                           ? renderDayColumn(targetDayStr, true)
                           : weekDates.map(d => (
                              <React.Fragment key={d.date}>
                                 {renderDayColumn(d.date, false)}
                              </React.Fragment>
                           ))
                        }
                     </div>
                  </div>
               </div>
            )}

            {view === 'Month' && (
               <div className="flex flex-col bg-white">
                  {/* Google Calendar Style Day Names Header */}
                  <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/60">
                     {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(d => (
                        <div key={d} className="text-[11px] font-semibold text-gray-500 text-center py-2.5 uppercase tracking-wider">
                           {d}
                        </div>
                     ))}
                  </div>

                  {/* Google Calendar Style Month Grid */}
                  <div className="grid grid-cols-7 border-t border-l border-gray-200">
                     {monthGridDays.map((day) => {
                        const dayEvents = assignments
                           .filter(a => a.date === day.date)
                           .sort((a, b) => (a.startTime || '').localeCompare(b.startTime || ''));

                        return (
                           <div
                              key={day.date}
                              onClick={() => handleSlotClick(day.date, 10)}
                              className={`border-r border-b border-gray-200 p-2 min-h-[125px] flex flex-col transition-colors cursor-pointer ${
                                 day.isCurrentMonth ? 'bg-white hover:bg-gray-50/60' : 'bg-gray-50/40 text-gray-400'
                              }`}
                           >
                              {/* Day Header with Date Number */}
                              <div className="flex items-center justify-center mb-1.5">
                                 {day.isToday ? (
                                    <span className="w-6 h-6 rounded-full bg-[#1a73e8] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                                       {day.dayNum}
                                    </span>
                                 ) : (
                                    <span className={`text-xs ${
                                       day.displayLabel.includes(' ')
                                          ? 'font-bold ' + (day.isCurrentMonth ? 'text-gray-800' : 'text-gray-400')
                                          : 'font-medium ' + (day.isCurrentMonth ? 'text-gray-700' : 'text-gray-400')
                                    }`}>
                                       {day.displayLabel}
                                    </span>
                                 )}
                              </div>

                              {/* Day Events Stack */}
                              <div className="space-y-1 flex-1">
                                 {dayEvents.slice(0, 3).map((ev, idx) => {
                                    const isAllDay = (!ev.startTime && !ev.endTime) || (ev.startTime === '00:00' && ev.endTime === '23:59') || (ev.title && (ev.title.toLowerCase().includes('holiday') || ev.title.toLowerCase().includes('day')));
                                    
                                    if (isAllDay) {
                                       return (
                                          <div
                                             key={ev.id}
                                             onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedEvent(ev);
                                             }}
                                             title={ev.title}
                                             className="w-full bg-[#34A853] text-white text-[11px] font-medium px-2 py-0.5 rounded truncate shadow-2xs cursor-pointer hover:opacity-90 transition-opacity"
                                          >
                                             {ev.title}
                                          </div>
                                       );
                                    }

                                    const dotColor = EVENT_DOT_COLORS[idx % EVENT_DOT_COLORS.length];

                                    return (
                                       <div
                                          key={ev.id}
                                          onClick={(e) => {
                                             e.stopPropagation();
                                             setSelectedEvent(ev);
                                          }}
                                          title={`${ev.startTime || ''} - ${ev.endTime || ''}: ${ev.title}`}
                                          className="w-full flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors cursor-pointer text-left group"
                                       >
                                          <span className={`w-2 h-2 rounded-full shrink-0 ${dotColor}`} />
                                          {ev.startTime && (
                                             <span className="text-[10px] font-semibold text-gray-600 shrink-0 group-hover:text-gray-900">
                                                {formatMonthTime(ev.startTime)}
                                             </span>
                                          )}
                                          <span className="text-[11px] font-medium text-gray-800 truncate group-hover:text-black">
                                             {ev.title || 'Untitled'}
                                          </span>
                                       </div>
                                    );
                                 })}

                                 {dayEvents.length > 3 && (
                                    <div
                                       onClick={(e) => {
                                          e.stopPropagation();
                                          handleSlotClick(day.date, 10);
                                       }}
                                       className="text-[10px] font-semibold text-gray-500 hover:text-gray-900 pl-1.5 py-0.5 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                                    >
                                       +{dayEvents.length - 3} more
                                    </div>
                                 )}
                              </div>
                           </div>
                        );
                     })}
                  </div>
               </div>
            )}
         </div>

         {/* Event detail popover */}
         {selectedEvent && (
            <div
               className="absolute inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center rounded-xl"
               onClick={() => setSelectedEvent(null)}
            >
               <div
                  className="bg-white rounded-2xl shadow-2xl p-5 w-72 mx-4"
                  onClick={(e) => e.stopPropagation()}
               >
                  <div className="flex items-start justify-between mb-3">
                     <h3 className="font-semibold text-gray-900 text-sm leading-tight flex-1 pr-2">
                        {selectedEvent.title || 'Untitled'}
                     </h3>
                     <button
                        onClick={() => setSelectedEvent(null)}
                        className="text-gray-400 hover:text-gray-700 transition-colors shrink-0"
                     >
                        <CloseSquare size={18} />
                     </button>
                  </div>
                  <div className="space-y-1.5 text-xs text-gray-600">
                     <p className="font-medium">{selectedEvent.date}</p>
                     {selectedEvent.startTime && (
                        <p>{formatMonthTime(selectedEvent.startTime)} – {formatMonthTime(selectedEvent.endTime)}</p>
                     )}
                     {selectedEvent.location && (
                        <p className="text-gray-500 truncate">{selectedEvent.location}</p>
                     )}
                  </div>
                  <button
                     onClick={() => {
                        setSelectedEvent(null);
                        router.push(`/admin/bookings/${selectedEvent.bookingId}`);
                     }}
                     className="mt-4 w-full py-2 bg-indigo-600 text-white text-xs font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                  >
                     View Booking →
                  </button>
               </div>
            </div>
         )}
      </BentoCard>
   );
}
