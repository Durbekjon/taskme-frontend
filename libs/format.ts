import type { Client, TeamMember } from '@/types/api';

/**
 * The API returns `firstName`/`lastName`; several screens rendered a
 * `fullName` field that never existed, printing "undefined" to the user.
 */
export function personName(
  person: { firstName?: string | null; lastName?: string | null } | null | undefined,
  fallback = '—',
): string {
  if (!person) return fallback;
  const full = `${person.firstName ?? ''} ${person.lastName ?? ''}`.trim();
  return full || fallback;
}

export function clientName(client: Client | null | undefined): string {
  return personName(client, 'Unnamed client');
}

export function memberName(member: TeamMember): string {
  return member.fullName || personName(member, member.email);
}

export function initials(name: string, fallback = 'U'): string {
  const letters = name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('');
  return letters.slice(0, 2).toUpperCase() || fallback;
}

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export function money(amount: number | string | null | undefined): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  if (value === null || value === undefined || Number.isNaN(value)) return '$0';
  return currencyFormatter.format(value);
}

// ---------------------------------------------------------------------------
// Assignment status presentation
//
// Three different vocabularies used to be compared against this field
// ("confirmed", "ACCEPTED", "PENDING"). There is one enum now, and one place
// that decides how it looks.
// ---------------------------------------------------------------------------

import { AssignmentStatus } from '@/types/api';

export const ASSIGNMENT_STATUS_LABEL: Record<AssignmentStatus, string> = {
  ASSIGNED: 'Pending',
  CONFIRMED: 'Accepted',
  DECLINED: 'Declined',
  COMPLETED: 'Completed',
};

export const ASSIGNMENT_STATUS_CLASS: Record<AssignmentStatus, string> = {
  ASSIGNED: 'bg-yellow-100 text-yellow-700',
  CONFIRMED: 'bg-green-100 text-green-700',
  DECLINED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
};

export function isPendingAssignment(status: AssignmentStatus): boolean {
  return status === AssignmentStatus.ASSIGNED;
}

export function isActiveAssignment(status: AssignmentStatus): boolean {
  return status === AssignmentStatus.CONFIRMED || status === AssignmentStatus.COMPLETED;
}

// ---------------------------------------------------------------------------
// Event parts
//
// The API field names are `partType` / `customName` / `venueName`; several
// screens read `title` and `location`, which do not exist on the model.
// ---------------------------------------------------------------------------

import type { EventPart } from '@/types/api';

export function eventPartLabel(part: EventPart): string {
  return part.customName || part.partType || 'Event part';
}

export function eventPartVenue(part: EventPart): string {
  return [part.venueName, part.address, part.city].filter(Boolean).join(', ');
}

/** "15:00" in the viewer's own timezone, or "" when the part has no start. */
export function partTime(value: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ---------------------------------------------------------------------------
// Calendar
// ---------------------------------------------------------------------------

import type { Booking } from '@/types/api';

export interface CalendarEvent {
  id: string;
  bookingId: string;
  title: string;
  /** "YYYY-MM-DD" in the viewer's timezone. */
  date: string;
  /** "HH:mm" */
  startTime: string;
  /** "HH:mm" */
  endTime: string;
  location: string;
}

/** "YYYY-MM-DD" in the viewer's timezone. */
function dateKeyOf(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** "14:00" in the viewer's timezone. */
function clockOf(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/**
 * Flattens bookings into calendar entries.
 *
 * A `Booking` has an `eventDate` and a list of `eventParts`; it has never had
 * `date`, `startTime` or `endTime`, so the dashboard calendar - which filtered
 * on exactly those three fields - rendered nothing at all.
 */
export function bookingsToCalendarEvents(bookings: Booking[]): CalendarEvent[] {
  const events: CalendarEvent[] = [];

  for (const booking of bookings) {
    const parts = booking.eventParts ?? [];
    for (const part of parts) {
      if (!part.startAt) continue;
      const start = new Date(part.startAt);
      if (Number.isNaN(start.getTime())) continue;
      const end = part.endAt ? new Date(part.endAt) : null;
      events.push({
        id: part.id,
        bookingId: booking.id,
        title: booking.title || eventPartLabel(part),
        date: dateKeyOf(start),
        startTime: clockOf(start),
        endTime:
          end && !Number.isNaN(end.getTime())
            ? clockOf(end)
            : clockOf(new Date(start.getTime() + 60 * 60 * 1000)),
        location: eventPartVenue(part),
      });
    }

    // A booking with no scheduled parts still belongs on its event date.
    if (parts.every((p) => !p.startAt) && booking.eventDate) {
      const date = new Date(booking.eventDate);
      if (!Number.isNaN(date.getTime())) {
        events.push({
          id: booking.id,
          bookingId: booking.id,
          title: booking.title || 'Booking',
          date: dateKeyOf(date),
          startTime: '09:00',
          endTime: '17:00',
          location: '',
        });
      }
    }
  }

  return events;
}

// ---------------------------------------------------------------------------
// Availability
// ---------------------------------------------------------------------------

import { AvailabilityStatus, type AvailabilityConflict } from '@/types/api';

export const AVAILABILITY_LABEL: Record<AvailabilityStatus, string> = {
  AVAILABLE: 'Available',
  TENTATIVE: 'Maybe busy',
  BUSY: 'Already booked',
  UNKNOWN: 'Not checked',
};

export const AVAILABILITY_CLASS: Record<AvailabilityStatus, string> = {
  AVAILABLE: 'bg-emerald-100 text-emerald-700',
  TENTATIVE: 'bg-amber-100 text-amber-700',
  BUSY: 'bg-red-100 text-red-700',
  UNKNOWN: 'bg-gray-100 text-gray-600',
};

export const AVAILABILITY_HINT: Record<AvailabilityStatus, string> = {
  AVAILABLE: 'No clashes for this date.',
  TENTATIVE: 'Holds an invitation they have not answered yet.',
  BUSY: 'Already confirmed for another job at this time.',
  UNKNOWN: 'Add a date or schedule to this booking to check for clashes.',
};

/** "YYYY-MM-DD" for an ISO instant, in the viewer's timezone. */
export function localDateKey(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : dateKeyOf(date);
}

/** "14:00" for an ISO instant, in the viewer's timezone. */
export function localClock(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : clockOf(date);
}

/**
 * Renders an instant in the viewer's own timezone. The API returns instants
 * precisely so this is decided here rather than on the server.
 */
export function dateTime(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function timeOnly(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/** "Sep 29, 2:00 PM - 6:00 PM - another studio" */
export function conflictLabel(conflict: AvailabilityConflict): string {
  const span = conflict.endAt
    ? `${dateTime(conflict.startAt)} - ${timeOnly(conflict.endAt)}`
    : dateTime(conflict.startAt);
  const who = conflict.isOwnStudio
    ? conflict.title || 'one of your bookings'
    : 'another studio';
  return `${span} - ${who}`;
}

/**
 * Derives the wall-clock view of an assignment for the current viewer.
 *
 * Screens that group by day or lay events out on an hour grid need a local
 * date and time; the API deliberately ships instants so this conversion
 * happens once, here, in the viewer's timezone.
 */
export interface LocalSchedule {
  /** "YYYY-MM-DD" */
  date: string | null;
  /** "HH:mm" */
  startTime: string | null;
  /** "HH:mm" */
  endTime: string | null;
}

export function localSchedule(item: {
  startAt: string | null;
  endAt: string | null;
}): LocalSchedule {
  return {
    date: localDateKey(item.startAt),
    startTime: localClock(item.startAt),
    endTime: localClock(item.endAt),
  };
}

// ---------------------------------------------------------------------------
// Booking status
// ---------------------------------------------------------------------------

import { BookingStatus } from '@/types/api';

export const BOOKING_STATUS_LABEL: Record<BookingStatus, string> = {
  DRAFT: 'Draft',
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

export const BOOKING_STATUS_CLASS: Record<BookingStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  CONFIRMED: 'bg-emerald-100 text-emerald-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

/**
 * The states a booking can move to next.
 *
 * A booking walks Draft -> Confirmed -> In progress -> Completed, and can be
 * cancelled from anywhere before it is finished. Offering only the sensible
 * next steps keeps the control short and stops a completed job being dragged
 * back to draft by accident.
 */
export function nextBookingStatuses(current: BookingStatus): BookingStatus[] {
  switch (current) {
    case BookingStatus.DRAFT:
      return [BookingStatus.CONFIRMED, BookingStatus.CANCELLED];
    case BookingStatus.CONFIRMED:
      return [BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED, BookingStatus.CANCELLED];
    case BookingStatus.IN_PROGRESS:
      return [BookingStatus.COMPLETED, BookingStatus.CANCELLED];
    case BookingStatus.COMPLETED:
      return [BookingStatus.IN_PROGRESS];
    case BookingStatus.CANCELLED:
      return [BookingStatus.DRAFT];
    default:
      return [];
  }
}
