import {
  ASSIGNMENT_STATUS_LABEL,
  bookingsToCalendarEvents,
  eventPartLabel,
  eventPartVenue,
  initials,
  isActiveAssignment,
  isPendingAssignment,
  money,
  personName,
} from '@/libs/format';
import { AssignmentStatus, BookingStatus, type Booking } from '@/types/api';

function booking(overrides: Partial<Booking> = {}): Booking {
  return {
    id: 'b1',
    studioId: 's1',
    clientId: 'c1',
    eventType: 'Wedding',
    eventDate: '2026-11-20T00:00:00.000Z',
    location: null,
    title: 'Sarah & David Wedding',
    status: BookingStatus.CONFIRMED,
    agreedPrice: 7500,
    currency: 'USD',
    notes: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('personName', () => {
  it('joins the API fields instead of reading a non-existent fullName', () => {
    expect(personName({ firstName: 'Sarah', lastName: 'Smith' })).toBe('Sarah Smith');
    expect(personName({ firstName: 'Sarah', lastName: null })).toBe('Sarah');
    expect(personName(null)).toBe('—');
  });
});

describe('initials', () => {
  it('takes at most two letters and falls back when empty', () => {
    expect(initials('Sarah Smith')).toBe('SS');
    expect(initials('Sarah')).toBe('S');
    expect(initials('', 'TM')).toBe('TM');
  });
});

describe('money', () => {
  it('formats numbers and Prisma decimal strings alike', () => {
    expect(money(7500)).toBe('$7,500');
    expect(money('7500')).toBe('$7,500');
    expect(money(null)).toBe('$0');
    expect(money(undefined)).toBe('$0');
  });
});

describe('assignment status helpers', () => {
  it('treats only ASSIGNED as pending', () => {
    expect(isPendingAssignment(AssignmentStatus.ASSIGNED)).toBe(true);
    expect(isPendingAssignment(AssignmentStatus.CONFIRMED)).toBe(false);
  });

  it('counts confirmed and completed work as active, matching the finance query', () => {
    expect(isActiveAssignment(AssignmentStatus.CONFIRMED)).toBe(true);
    expect(isActiveAssignment(AssignmentStatus.COMPLETED)).toBe(true);
    expect(isActiveAssignment(AssignmentStatus.DECLINED)).toBe(false);
    expect(isActiveAssignment(AssignmentStatus.ASSIGNED)).toBe(false);
  });

  it('has a label for every status in the enum', () => {
    for (const status of Object.values(AssignmentStatus)) {
      expect(ASSIGNMENT_STATUS_LABEL[status]).toBeTruthy();
    }
  });
});

describe('event parts', () => {
  const part = {
    id: 'p1',
    partType: 'Ceremony',
    customName: null,
    startAt: '2026-11-20T15:00:00.000Z',
    endAt: '2026-11-20T18:00:00.000Z',
    venueName: 'Plaza Hotel',
    address: '5th Ave',
    city: 'NYC',
    state: null,
    zipCode: null,
    notes: null,
    sortOrder: 0,
  };

  it('labels a part by its custom name, then its type', () => {
    expect(eventPartLabel(part)).toBe('Ceremony');
    expect(eventPartLabel({ ...part, customName: "Bride's Prep" })).toBe("Bride's Prep");
  });

  it('joins the venue fields', () => {
    expect(eventPartVenue(part)).toBe('Plaza Hotel, 5th Ave, NYC');
  });
});

describe('bookingsToCalendarEvents', () => {
  it('derives calendar entries from event parts', () => {
    const events = bookingsToCalendarEvents([
      booking({
        eventParts: [
          {
            id: 'p1',
            partType: 'Ceremony',
            customName: null,
            startAt: '2026-11-20T15:00:00.000Z',
            endAt: '2026-11-20T18:00:00.000Z',
            venueName: 'Plaza Hotel',
            address: null,
            city: null,
            state: null,
            zipCode: null,
            notes: null,
            sortOrder: 0,
          },
        ],
      }),
    ]);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      bookingId: 'b1',
      title: 'Sarah & David Wedding',
      location: 'Plaza Hotel',
    });
    expect(events[0].startTime).toMatch(/^\d{2}:\d{2}$/);
  });

  it('still places a booking with no scheduled parts on its event date', () => {
    const events = bookingsToCalendarEvents([booking({ eventParts: [] })]);
    expect(events).toHaveLength(1);
    expect(events[0].startTime).toBe('09:00');
  });

  it('ignores parts with an unparseable start', () => {
    const events = bookingsToCalendarEvents([
      booking({
        eventDate: null,
        eventParts: [
          {
            id: 'p1',
            partType: 'Ceremony',
            customName: null,
            startAt: 'not-a-date',
            endAt: null,
            venueName: null,
            address: null,
            city: null,
            state: null,
            zipCode: null,
            notes: null,
            sortOrder: 0,
          },
        ],
      }),
    ]);
    expect(events).toHaveLength(0);
  });
});
