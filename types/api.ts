/**
 * The API contract, mirrored from the NestJS DTOs and Prisma enums.
 *
 * Keep this in sync with `backend/src/**` - Swagger at `/api/docs` is the
 * source of truth. Typing the client this way is what makes a wrong URL or a
 * missing field a compile error instead of a 400 discovered in production.
 */

// ---------------------------------------------------------------------------
// Enums (mirror of backend/prisma/schema.prisma)
// ---------------------------------------------------------------------------

export const BookingStatus = {
  DRAFT: 'DRAFT',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const AssignmentStatus = {
  ASSIGNED: 'ASSIGNED',
  CONFIRMED: 'CONFIRMED',
  DECLINED: 'DECLINED',
  COMPLETED: 'COMPLETED',
} as const;
export type AssignmentStatus =
  (typeof AssignmentStatus)[keyof typeof AssignmentStatus];

/** The only two answers `PATCH /crew-assignments/:id/respond` accepts. */
export type AssignmentResponse = typeof AssignmentStatus.CONFIRMED | typeof AssignmentStatus.DECLINED;

export const MemberStatus = {
  INVITED: 'INVITED',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;
export type MemberStatus = (typeof MemberStatus)[keyof typeof MemberStatus];

export const MemberRole = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  MEMBER: 'MEMBER',
} as const;
export type MemberRole = (typeof MemberRole)[keyof typeof MemberRole];

export const ClientPaymentType = {
  DEPOSIT: 'DEPOSIT',
  PAYMENT: 'PAYMENT',
  FINAL_PAYMENT: 'FINAL_PAYMENT',
  REFUND: 'REFUND',
} as const;
export type ClientPaymentType =
  (typeof ClientPaymentType)[keyof typeof ClientPaymentType];

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  avatarUrl: string | null;
  accountType: string | null;
  studioId: string | null;
  studio: { id: string; name: string; logoUrl: string | null } | null;
  roles: string[];
  workerProfileId: string | null;
  workerPublicId: string | null;
}

export interface AuthResponse {
  access_token: string;
  user: AuthUser;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface OnboardingPayload {
  role: 'STUDIO' | 'CREATIVE';
  whatsapp: string;
  firstName?: string;
  lastName?: string;
  studioName?: string;
  studioLocation?: string;
  specialization?: string;
  primaryGear?: string;
  creativeId?: string;
}

export interface WorkerProfile {
  id: string;
  workerPublicId: string;
  primaryRole: string | null;
  primaryGear: string | null;
  city: string | null;
  state: string | null;
  bio: string | null;
}

/** Shape of `GET /users/:id`. */
export interface UserProfile {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  avatarUrl: string | null;
  accountType: string | null;
  studioId: string | null;
  createdAt: string;
  workerProfile: WorkerProfile | null;
}

export interface UpdateProfilePayload {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
  primaryRole?: string;
  primaryGear?: string;
  bio?: string;
  city?: string;
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

export interface Client {
  id: string;
  studioId: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  instagramHandle: string | null;
  notes: string | null;
  createdAt: string;
}

export interface CreateClientPayload {
  firstName: string;
  lastName?: string;
  phone?: string;
  email?: string;
  instagramHandle?: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

export interface BookingPerson {
  id: string;
  personType: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  email: string | null;
}

export interface EventPart {
  id: string;
  partType: string | null;
  customName: string | null;
  startAt: string | null;
  endAt: string | null;
  venueName: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  notes: string | null;
  sortOrder: number;
}

export interface Booking {
  id: string;
  studioId: string;
  clientId: string;
  client?: Client;
  eventType: string | null;
  eventDate: string | null;
  location: string | null;
  title: string | null;
  status: BookingStatus;
  agreedPrice: string | number | null;
  currency: string | null;
  notes: string | null;
  people?: BookingPerson[];
  eventParts?: EventPart[];
  assignments?: CrewAssignment[];
  clientPayments?: ClientPayment[];
  expenses?: Expense[];
  createdAt: string;
}

/** A client created together with the booking. */
export interface NewBookingClient {
  firstName: string;
  lastName?: string;
  phone?: string;
  email?: string;
  instagramHandle?: string;
  notes?: string;
}

export interface CreateBookingPayload {
  /** Send exactly one of `clientId` or `client`. */
  clientId?: string;
  client?: NewBookingClient;
  eventType?: string;
  eventDate?: string;
  location?: string;
  title?: string;
  status: BookingStatus;
  agreedPrice?: number;
  deposit?: number;
  currency?: string;
  notes?: string;
  people?: Array<{
    personType: string;
    firstName: string;
    lastName?: string;
    phone?: string;
    email?: string;
  }>;
  parts?: Array<{
    partType: string;
    customName?: string;
    startAt?: string;
    endAt?: string;
    venueName?: string;
    address?: string;
    city?: string;
    notes?: string;
  }>;
}

// ---------------------------------------------------------------------------
// Crew
// ---------------------------------------------------------------------------

export interface AssignmentWorker {
  id: string;
  workerPublicId: string;
  primaryRole: string | null;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  email: string | null;
  /** Booking endpoints return the raw profile, with the name on the nested user. */
  user?: { firstName: string | null; lastName: string | null };
}

export interface CrewAssignment {
  id: string;
  bookingId: string;
  workerId: string;
  worker: AssignmentWorker;
  role: string | null;
  agreedFee: number | null;
  deposit: number | null;
  callTime: string | null;
  status: AssignmentStatus;
  notes: string | null;
  assignedParts: Array<{ id: string; eventPartId: string; eventPart: EventPart }>;
  /** Included by `GET /bookings` for the crew payments page. */
  payments?: WorkerPayment[];
}

/** Row shape of `GET /crew-assignments/worker/:id` - a worker's schedule. */
export interface WorkerAssignment {
  id: string;
  bookingId: string;
  workerId: string;
  role: string | null;
  notes: string | null;
  status: AssignmentStatus;
  callTime: string | null;
  fee: number | null;
  deposit: number | null;
  title: string | null;
  category: string | null;
  /** Comma-joined venue name, address and city. */
  location: string | null;
  /**
   * ISO instants. Format them in the viewer's timezone - the server has no
   * way to know it, and returning a wall clock showed everyone UTC.
   */
  startAt: string | null;
  endAt: string | null;
  studioId: string;
  studio: { id: string; name: string } | null;
  client: Client | null;
  assignedParts: Array<{ id: string; eventPartId: string; eventPart: EventPart }>;
}

export interface CreateAssignmentPayload {
  bookingId: string;
  /** Accepts either a WorkerProfile id or the underlying User id. */
  workerId: string;
  role?: string;
  agreedFee?: number;
  deposit?: number;
  callTime?: string;
  notes?: string;
  eventPartIds?: string[];
}

// ---------------------------------------------------------------------------
// Crew availability
// ---------------------------------------------------------------------------

export const AvailabilityStatus = {
  AVAILABLE: 'AVAILABLE',
  /** Holds an invitation they have not answered yet - not a hard clash. */
  TENTATIVE: 'TENTATIVE',
  BUSY: 'BUSY',
  /** The booking has no scheduled times, so nothing can be checked. */
  UNKNOWN: 'UNKNOWN',
} as const;
export type AvailabilityStatus =
  (typeof AvailabilityStatus)[keyof typeof AvailabilityStatus];

/**
 * A clashing engagement. `title` and `studioName` are only populated when the
 * clash is with one of your own bookings - another studio's details are not
 * disclosed.
 */
export interface AvailabilityConflict {
  /** ISO instant; format it in the viewer's own timezone. */
  startAt: string;
  endAt: string | null;
  status: AssignmentStatus;
  isOwnStudio: boolean;
  title: string | null;
  studioName: string | null;
}

export interface CreativeLookup {
  worker: {
    /** WorkerProfile id - this is what `POST /crew-assignments` expects. */
    id: string;
    userId: string;
    workerPublicId: string;
    fullName: string;
    avatarUrl: string | null;
    primaryRole: string | null;
    primaryGear: string | null;
    city: string | null;
    bio: string | null;
    skills: string[];
    /** False for a creative who works for another studio. */
    onYourTeam: boolean;
  };
  bookingWindow: { startAt: string; endAt: string | null } | null;
  availability: {
    status: AvailabilityStatus;
    conflicts: AvailabilityConflict[];
  };
  /** Set when this creative is already on the booking. */
  alreadyAssigned: { id: string; status: AssignmentStatus } | null;
}

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------

export interface TeamMember {
  id: string;
  studioMemberId: string;
  firstName: string | null;
  lastName: string | null;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  role: MemberRole;
  roleTitle: string | null;
  status: MemberStatus;
  workerProfileId: string | null;
  workerPublicId: string | null;
}

export interface Team {
  active: TeamMember[];
  pending: TeamMember[];
}

// ---------------------------------------------------------------------------
// Finance
// ---------------------------------------------------------------------------

export interface ClientPayment {
  id: string;
  bookingId: string;
  amount: number;
  paymentType: ClientPaymentType;
  paymentDate: string | null;
  paymentMethod: string | null;
  notes: string | null;
}

export const PaymentStatus = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export interface WorkerPayment {
  id: string;
  assignmentId: string;
  workerId: string;
  amount: number;
  paymentDate: string | null;
  paymentMethod: string | null;
  notes: string | null;
  status: PaymentStatus;
  worker: { id: string; workerPublicId: string; fullName: string };
}

export interface Expense {
  id: string;
  studioId: string;
  bookingId: string | null;
  category: string | null;
  description: string | null;
  amount: number;
  expenseDate: string | null;
  notes: string | null;
}

export interface StudioFinanceSummary {
  revenue: number;
  clientPaymentsReceived: number;
  clientBalance: number;
  workerCosts: number;
  workerPayments: number;
  workerBalance: number;
  otherExpenses: number;
  studioProfit: number;
}

export interface WorkerFinanceSummary {
  totalEarned: number;
  totalPaid: number;
  currentBalance: number;
}

export interface CreateClientPaymentPayload {
  bookingId: string;
  amount: number;
  paymentType: ClientPaymentType;
  /** Defaults to now on the server. */
  paymentDate?: string;
  paymentMethod?: string;
  notes?: string;
}

export interface CreateWorkerPaymentPayload {
  assignmentId: string;
  amount: number;
  paymentDate?: string;
  paymentMethod?: string;
  notes?: string;
}

export interface CreateExpensePayload {
  bookingId?: string;
  category: string;
  description: string;
  amount: number;
  expenseDate?: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  referenceId: string | null;
  read: boolean;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// ---------------------------------------------------------------------------
// Studio
// ---------------------------------------------------------------------------

export interface Studio {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  logoUrl: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  currency: string | null;
  timezone: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateStudioPayload {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  email?: string;
  phone?: string;
  website?: string;
  currency?: string;
  timezone?: string;
  logoUrl?: string;
}

