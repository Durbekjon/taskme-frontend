import {
  buildBookingPayload,
  localDateTimeToIso,
  localDateToIso,
  type BookingFormState,
} from '@/libs/booking-payload';

const form: BookingFormState = {
  name: 'Sarah & David Wedding',
  bookingDate: '2026-11-20',
  eventType: 'Wedding',
  agreedPrice: 7500,
  deposit: 1000,
  notes: '',
};

const build = (over: Partial<Parameters<typeof buildBookingPayload>[0]> = {}) =>
  buildBookingPayload({
    form,
    people: [],
    parts: [],
    ...over,
  });

describe('dates', () => {
  it('reads a date input as a local calendar day, not UTC midnight', () => {
    // `new Date("2026-11-20")` is UTC midnight, which is the 19th for anyone
    // west of Greenwich.
    const iso = localDateToIso('2026-11-20');
    const local = new Date(iso);
    expect(local.getFullYear()).toBe(2026);
    expect(local.getMonth()).toBe(10);
    expect(local.getDate()).toBe(20);
  });

  it('ignores a blank or unparseable datetime-local value', () => {
    expect(localDateTimeToIso('')).toBeUndefined();
    expect(localDateTimeToIso('not-a-date')).toBeUndefined();
    expect(localDateTimeToIso('2026-11-20T15:00')).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe('people and parts', () => {
  it('splits a full name and skips entirely blank rows', () => {
    const payload = build({
      people: [
        { role: 'bride', fullName: 'Sarah Anne Smith', phone: '555' },
        { role: '', fullName: '', phone: '' },
      ],
    });
    expect(payload.people).toEqual([
      { personType: 'bride', firstName: 'Sarah', lastName: 'Anne Smith', phone: '555' },
    ]);
  });

  it('falls back to a placeholder when only a role was given', () => {
    const payload = build({ people: [{ role: 'groom', fullName: '', phone: '' }] });
    expect(payload.people?.[0]).toMatchObject({ personType: 'groom', firstName: 'Unnamed' });
  });

  it('keeps only parts that have a name', () => {
    const payload = build({
      parts: [
        { title: 'Ceremony', startTime: '2026-11-20T15:00', endTime: '', location: 'Plaza' },
        { title: '', startTime: '2026-11-20T18:00', endTime: '', location: 'Ignored' },
      ],
    });
    expect(payload.parts).toHaveLength(1);
    expect(payload.parts?.[0]).toMatchObject({ partType: 'Ceremony', venueName: 'Plaza' });
    expect(payload.parts?.[0].endAt).toBeUndefined();
  });
});
