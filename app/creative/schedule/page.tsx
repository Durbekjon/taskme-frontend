'use client';

import { motion, type Variants } from 'framer-motion';
import { BentoCard } from '@/components/ui/BentoCard';
import React, { useState } from 'react';
import { useUser } from '@/libs/user-context';
import { ArrowLeft2, ArrowRight2, CloseSquare } from 'iconsax-react';

const containerVariants: Variants = {
   hidden: { opacity: 0 },
   visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants: Variants = {
   hidden: { opacity: 0, y: 16 },
   visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
};
import { crewApi } from '@/libs/endpoints';
import { isActiveAssignment, localSchedule } from '@/libs/format';

/** "2026-09-13", "2026-09-19" -> "Sep 13 - 19, 2026" (US reading order). */
function formatWeekRange(startKey: string, endKey: string): string {
   const start = new Date(`${startKey}T00:00:00`);
   const end = new Date(`${endKey}T00:00:00`);
   if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return `${startKey} to ${endKey}`;
   }
   const month = (d: Date) => d.toLocaleDateString('en-US', { month: 'short' });
   const sameMonth = start.getMonth() === end.getMonth();
   const head = sameMonth
      ? `${month(start)} ${start.getDate()} - ${end.getDate()}`
      : `${month(start)} ${start.getDate()} - ${month(end)} ${end.getDate()}`;
   return `${head}, ${end.getFullYear()}`;
}

export default function CreativeSchedulePage() {
   return (
      <motion.div
         variants={containerVariants}
         initial="hidden"
         animate="visible"
         className="space-y-4 h-[calc(100vh-80px)] flex flex-col"
      >
         {/* ── Page Header ─────────────────────────────────────────── */}
         <motion.div variants={itemVariants} className="flex items-center justify-between shrink-0">
            <div>
               <h1 className="text-2xl font-bold text-gray-900 tracking-tight">My Schedule</h1>
               <p className="text-sm text-gray-500 mt-0.5">Manage your upcoming bookings and shoots.</p>
            </div>
         </motion.div>

         {/* ── Calendar ──────────────────────────────────────────── */}
         <motion.div variants={itemVariants} className="flex-1 w-full h-full pb-4">
            <ScheduleCard />
         </motion.div>
      </motion.div>
   );
}

/* ── Sub-components ──────────────────────────────────────────────── */

function parseTime(timeStr: string) {
   const [h, m] = timeStr.split(':').map(Number);
   return h + (m / 60);
}

function ScheduleCard() {
   const [view, setView] = useState('Week');
   const [weekOffset, setWeekOffset] = useState(0);
   const [monthOffset, setMonthOffset] = useState(0);
   const [dayOffset, setDayOffset] = useState(0);

   interface ScheduleEvent {
      id: string;
      title: string;
      date: string;
      startTime: string;
      endTime: string;
      color: string;
   }

   const [events, setEvents] = useState<ScheduleEvent[]>([]);
   const [selectedEvent, setSelectedEvent] = useState<ScheduleEvent | null>(null);
   const { user } = useUser();

   const formatDateKey = (d: Date) => {
      const pad = (n: number) => n.toString().padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
   };

   /** Returns 7 WeekDay objects for the week that is `offset` weeks from today. */
   const getWeekDates = (offset: number) => {
      const today = new Date();
      today.setDate(today.getDate() + offset * 7);
      const sunday = new Date(today);
      sunday.setDate(today.getDate() - today.getDay());
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return Array.from({ length: 7 }, (_, i) => {
         const d = new Date(sunday);
         d.setDate(sunday.getDate() + i);
         return { date: formatDateKey(d), day: dayNames[i], num: d.getDate(), isToday: d.toDateString() === new Date().toDateString() };
      });
   };

   React.useEffect(() => {
      const fetchSchedule = async () => {
         if (!user?.id) return;
         try {
            const assignments = await crewApi.listMine();
            const colors = [
               'bg-blue-500/15 text-blue-700 border-blue-500',
               'bg-indigo-500/15 text-indigo-700 border-indigo-500',
               'bg-pink-500/15 text-pink-700 border-pink-500',
               'bg-emerald-500/15 text-emerald-700 border-emerald-500',
               'bg-orange-500/15 text-orange-700 border-orange-500',
            ];
            setEvents(
               assignments
                  .filter((a) => isActiveAssignment(a.status) && a.startAt)
                  .map((a, i) => {
                     const local = localSchedule(a);
                     return {
                        id: a.id,
                        title: a.title || 'Booking',
                        date: local.date as string,
                        startTime: local.startTime || '09:00',
                        endTime: local.endTime || '17:00',
                        color: colors[i % colors.length],
                     };
                  }),
            );
         } catch (e) {
            console.error('Failed to fetch schedule', e);
         }
      };
      void fetchSchedule();
   }, [user?.id]);

   const weekDates = getWeekDates(weekOffset);
   const todayStr = formatDateKey(new Date());

   // Day view
   const targetDayDate = new Date();
   targetDayDate.setDate(targetDayDate.getDate() + dayOffset);
   const targetDayStr = formatDateKey(targetDayDate);

   // Month view
   const targetMonthDate = new Date();
   targetMonthDate.setDate(1);
   targetMonthDate.setMonth(targetMonthDate.getMonth() + monthOffset);
   const targetYear = targetMonthDate.getFullYear();
   const targetMonth = targetMonthDate.getMonth();
   const monthNameLabel = targetMonthDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
   const firstDayOfMonth = new Date(targetYear, targetMonth, 1);
   const startDayOfWeek = firstDayOfMonth.getDay();
   const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
   const totalCells = (startDayOfWeek + daysInMonth) > 35 ? 42 : 35;
   const gridStartDate = new Date(targetYear, targetMonth, 1 - startDayOfWeek);
   const monthGridDays = Array.from({ length: totalCells }, (_, i) => {
      const d = new Date(gridStartDate);
      d.setDate(gridStartDate.getDate() + i);
      const dateStr = formatDateKey(d);
      return { date: dateStr, dayNum: d.getDate(), isCurrentMonth: d.getMonth() === targetMonth, isToday: dateStr === todayStr };
   });

   const START_HOUR = 8;
   const HOURS = [
      { label: '8 AM', val: 8 }, { label: '9 AM', val: 9 }, { label: '10 AM', val: 10 },
      { label: '11 AM', val: 11 }, { label: '12 PM', val: 12 }, { label: '1 PM', val: 13 },
      { label: '2 PM', val: 14 }, { label: '3 PM', val: 15 }, { label: '4 PM', val: 16 },
      { label: '5 PM', val: 17 }, { label: '6 PM', val: 18 }, { label: '7 PM', val: 19 },
      { label: '8 PM', val: 20 },
   ];
   const HOUR_HEIGHT = 64;

   const processedEvents = events.map(ev => {
      const start = parseTime(ev.startTime);
      const end = parseTime(ev.endTime);
      return { ...ev, start, end, top: (start - START_HOUR) * HOUR_HEIGHT, height: (end - start) * HOUR_HEIGHT };
   });

   const now = new Date();
   const currentTime = now.getHours() + (now.getMinutes() / 60);

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
   const handleToday = () => { setWeekOffset(0); setMonthOffset(0); setDayOffset(0); };
   const isNotCurrentPeriod = view === 'Month' ? monthOffset !== 0 : view === 'Day' ? dayOffset !== 0 : weekOffset !== 0;

   let headerLabel = '';
   if (view === 'Month') headerLabel = monthNameLabel;
   else if (view === 'Day') headerLabel = targetDayDate.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
   else headerLabel = weekDates.length > 0 ? formatWeekRange(weekDates[0].date, weekDates[6].date) : '';

   const renderDayColumn = (dateStr: string, isDayView: boolean) => {
      const dayEvents = processedEvents.filter(e => e.date === dateStr);
      return (
         <div className="flex-1 border-r border-gray-100/50 relative">
            {dayEvents.map((ev, idx) => {
               const overlapOffset = idx > 0 && dayEvents[idx - 1].end > ev.start ? 20 : 0;
               return (
                  <div
                     key={ev.id}
                     onClick={() => setSelectedEvent(ev)}
                     className="absolute px-1 w-full cursor-pointer"
                     style={{
                        top: ev.top + 2,
                        height: ev.height - 4,
                        left: `${overlapOffset}%`,
                        width: `calc(100% - ${overlapOffset}%)`,
                        zIndex: 10 + idx
                     }}
                  >
                     <div className={`w-full h-full rounded-md border-l-[3px] p-1.5 overflow-hidden shadow-sm transition-transform hover:scale-[1.01] backdrop-blur-md ${ev.color}`}>
                        <p className="text-[11px] font-semibold leading-tight">{ev.title}</p>
                        {isDayView && <p className="text-[9px] opacity-80 mt-0.5">{ev.startTime} - {ev.endTime}</p>}
                     </div>
                  </div>
               );
            })}
         </div>
      );
   };

   return (
      <BentoCard variant="light" className="p-5 h-full flex flex-col relative">
         {/* Header: navigation + view switcher */}
         <div className="flex items-center justify-between mb-4 shrink-0">
            <div className="flex items-center gap-2">
               <button onClick={handlePrev} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                  <ArrowLeft2 size={14} />
               </button>
               <p className="text-sm font-semibold text-gray-800 min-w-[180px] text-center">{headerLabel}</p>
               <button onClick={handleNext} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                  <ArrowRight2 size={14} />
               </button>
               {isNotCurrentPeriod && (
                  <button onClick={handleToday} className="text-[10px] text-indigo-500 hover:text-indigo-700 font-medium transition-colors ml-1">
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
         <div className="flex-1 overflow-y-auto pr-2 -mr-2 relative" style={{ minHeight: '320px' }}>
            {(view === 'Day' || view === 'Week') && (
               <div className="h-full flex flex-col">
                  {view === 'Week' && (
                     <div className="flex ml-14 mb-2">
                        {weekDates.map((d) => (
                           <div key={d.date} className="flex-1 text-center">
                              <p className={`text-[10px] font-semibold uppercase tracking-wider ${d.isToday ? 'text-indigo-600' : 'text-gray-400'}`}>{d.day}</p>
                              <div className={`text-xs font-medium mt-0.5 w-6 h-6 rounded-full flex items-center justify-center mx-auto ${d.isToday ? 'bg-indigo-600 text-white font-bold' : 'text-gray-600'}`}>
                                 {d.num}
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
                  {view === 'Day' && (
                     <div className="flex ml-14 mb-2 items-center gap-2">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${targetDayStr === todayStr ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-100 text-gray-700'}`}>
                           {headerLabel}
                        </span>
                     </div>
                  )}

                  <div className="flex-1 relative">
                     {HOURS.map((hour, i) => (
                        <div key={hour.val} className="absolute w-full flex" style={{ top: i * HOUR_HEIGHT }}>
                           <div className="w-14 text-right pr-3 -mt-2">
                              <span className="text-[10px] font-medium text-gray-400">{hour.label}</span>
                           </div>
                           <div className="flex-1 border-t border-gray-100 flex">
                              {view === 'Week' && weekDates.map(d => (
                                 <div key={d.date} className="flex-1 border-r border-gray-50/50" />
                              ))}
                           </div>
                        </div>
                     ))}

                     {/* Current time indicator */}
                     {((view === 'Week' && weekOffset === 0) || (view === 'Day' && dayOffset === 0)) && (
                        <div className="absolute w-full flex items-center z-20 pointer-events-none" style={{ top: (currentTime - START_HOUR) * HOUR_HEIGHT }}>
                           <div className="w-14 text-right pr-2">
                              <span className="text-[10px] font-bold text-red-500">
                                 {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                           </div>
                           <div className="flex-1 relative">
                              <div className="absolute left-[-4px] top-[-4px] w-2 h-2 rounded-full bg-red-500" />
                              <div className="w-full border-t-2 border-red-500" />
                           </div>
                        </div>
                     )}

                     <div className="absolute top-0 bottom-0 right-0 left-14 flex">
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
               <div className="h-full flex flex-col">
                  <div className="grid grid-cols-7 mb-2">
                     {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                        <div key={d} className="text-[10px] font-semibold text-gray-400 text-center uppercase tracking-wider">{d}</div>
                     ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1 flex-1">
                     {monthGridDays.map((day) => {
                        const dayEvents = events.filter(e => e.date === day.date);
                        return (
                           <div key={day.date} className={`rounded-lg border border-gray-100 p-1 flex flex-col min-h-[80px] ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50/50'}`}>
                              <span className={`text-[10px] font-medium w-5 h-5 flex items-center justify-center rounded-full ${day.isToday ? 'bg-indigo-600 text-white font-bold' : day.isCurrentMonth ? 'text-gray-700' : 'text-gray-300'}`}>
                                 {day.dayNum}
                              </span>
                              <div className="mt-1 space-y-0.5">
                                 {dayEvents.slice(0, 2).map((ev) => (
                                    <button
                                       key={ev.id}
                                       onClick={() => setSelectedEvent(ev)}
                                       className={`w-full text-left px-1 py-0.5 rounded text-[9px] font-semibold truncate border-l-2 ${ev.color}`}
                                    >
                                       {ev.title}
                                    </button>
                                 ))}
                                 {dayEvents.length > 2 && (
                                    <p className="text-[9px] text-gray-400 pl-1">+{dayEvents.length - 2} more</p>
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
                        {selectedEvent.title}
                     </h3>
                     <button onClick={() => setSelectedEvent(null)} className="text-gray-400 hover:text-gray-700 transition-colors shrink-0">
                        <CloseSquare size={18} />
                     </button>
                  </div>
                  <div className="space-y-1.5 text-xs text-gray-600">
                     <p className="font-medium">{selectedEvent.date}</p>
                     <p>{selectedEvent.startTime} – {selectedEvent.endTime}</p>
                  </div>
               </div>
            </div>
         )}
      </BentoCard>
   );
}
