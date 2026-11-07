import { BookingStatus, type CreateBookingPayload } from '@/types/api';

/**
 * Builds the `POST /bookings` body from the wizard's form state.
 */

export interface BookingFormState {
  name: string;
  /** "YYYY-MM-DD" from a <input type="date">, i.e. a local calendar date. */
  bookingDate: string;
  eventType: string;
  agreedPrice: number;
  deposit: number;
  notes: string;
}

export interface PersonFormState {
  role: string;
  fullName: string;
  phone: string;
}

export interface PartFormState {
  title: string;
  /** datetime-local value. */
  startTime: string;
  endTime: string;
  location: string;
}

/** "2026-11-20" (a local calendar date) -> ISO instant at local midnight. */
export function localDateToIso(value: string): string {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1).toISOString();
}

/** datetime-local value -> ISO instant, or undefined when blank/invalid. */
export function localDateTimeToIso(value: string): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function trimmed(value: string): string | undefined {
  const next = value.trim();
  return next || undefined;
}

export function buildBookingPayload(input: {
  form: BookingFormState;
  people: PersonFormState[];
  parts: PartFormState[];
}): CreateBookingPayload {
  const { form, people, parts } = input;

  return {
    title: form.name,
    eventDate: localDateToIso(form.bookingDate),
    eventType: form.eventType,
    status: BookingStatus.DRAFT,
    agreedPrice: Number(form.agreedPrice) || 0,
    deposit: Number(form.deposit) || 0,
    notes: trimmed(form.notes),
    people: people
      .filter((p) => p.fullName || p.role)
      .map((p) => {
        const names = p.fullName.trim().split(/\s+/).filter(Boolean);
        return {
          personType: p.role || 'Guest',
          firstName: names[0] || 'Unnamed',
          lastName: names.slice(1).join(' ') || undefined,
          phone: trimmed(p.phone),
        };
      }),
    parts: parts
      .filter((p) => p.title)
      .map((p) => ({
        partType: p.title || 'Main Event',
        venueName: trimmed(p.location),
        startAt: localDateTimeToIso(p.startTime),
        endAt: localDateTimeToIso(p.endTime),
      })),
  };
}
