/**
 * Every API call the web app makes, in one typed place.
 */
import api from './api';
import type {
  AuthResponse,
  AuthUser,
  Booking,
  Client,
  ClientPayment,
  CreateAssignmentPayload,
  CreateBookingPayload,
  CreateClientPayload,
  CreateClientPaymentPayload,
  CreateExpensePayload,
  CreateWorkerPaymentPayload,
  CreativeLookup,
  CrewAssignment,
  Expense,
  LoginPayload,
  Notification,
  OnboardingPayload,
  StudioFinanceSummary,
  Team,
  WorkerAssignment,
  WorkerFinanceSummary,
  WorkerPayment,
  AssignmentResponse,
  UpdateProfilePayload,
  UserProfile,
  PaginatedResponse,
  Studio,
  UpdateStudioPayload,
} from '@/types/api';

export const authApi = {
  login: (payload: LoginPayload) =>
    api.post<AuthResponse>('/auth/login', payload).then((r) => r.data),

  me: () => api.get<AuthUser>('/auth/me').then((r) => r.data),

  onboarding: (payload: OnboardingPayload) =>
    api.post<AuthResponse>('/auth/onboarding', payload).then((r) => r.data),

  sendWhatsappOtp: (phoneNumber: string) =>
    api
      .post<{ message: string }>('/auth/whatsapp/send-otp', { phoneNumber })
      .then((r) => r.data),

  verifyWhatsappOtp: (otp: string) =>
    api
      .post<{ message: string; verified: boolean }>('/auth/whatsapp/verify-otp', { otp })
      .then((r) => r.data),
};

export const usersApi = {
  get: (id: string) => api.get<UserProfile>(`/users/${id}`).then((r) => r.data),

  updateMe: (payload: UpdateProfilePayload) =>
    api.patch<UserProfile>('/users/me', payload).then((r) => r.data),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api
      .post<UserProfile>('/users/me/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
};

export const clientsApi = {
  list: () => api.get<Client[]>('/clients').then((r) => r.data),
  get: (id: string) => api.get<Client>(`/clients/${id}`).then((r) => r.data),
  create: (payload: CreateClientPayload) =>
    api.post<Client>('/clients', payload).then((r) => r.data),
  update: (id: string, payload: Partial<CreateClientPayload>) =>
    api.patch<Client>(`/clients/${id}`, payload).then((r) => r.data),
  remove: (id: string) => api.delete(`/clients/${id}`).then((r) => r.data),
};

export const bookingsApi = {
  list: (params?: Record<string, any>) => {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== 'ALL') {
          searchParams.append(key, String(value));
        }
      });
    }
    const query = searchParams.toString();
    return api.get<PaginatedResponse<Booking>>(`/bookings${query ? `?${query}` : ''}`).then((r) => r.data);
  },
  get: (id: string) => api.get<Booking>(`/bookings/${id}`).then((r) => r.data),
  create: (payload: CreateBookingPayload) =>
    api.post<Booking>('/bookings', payload).then((r) => r.data),
  update: (id: string, payload: Partial<CreateBookingPayload>) =>
    api.patch<Booking>(`/bookings/${id}`, payload).then((r) => r.data),
  remove: (id: string) => api.delete(`/bookings/${id}`).then((r) => r.data),
};

export const crewApi = {
  listByBooking: (bookingId: string) =>
    api.get<CrewAssignment[]>(`/crew-assignments/booking/${bookingId}`).then((r) => r.data),
  listMine: () =>
    api.get<WorkerAssignment[]>('/crew-assignments/worker/me').then((r) => r.data),
  listByWorker: (workerId: string) =>
    api.get<WorkerAssignment[]>(`/crew-assignments/worker/${workerId}`).then((r) => r.data),
  checkAvailability: (bookingId: string, workerPublicId: string) =>
    api
      .get<CreativeLookup>(
        `/crew-assignments/availability/${bookingId}/${encodeURIComponent(workerPublicId)}`,
      )
      .then((r) => r.data),
  create: (payload: CreateAssignmentPayload) =>
    api.post<CrewAssignment>('/crew-assignments', payload).then((r) => r.data),
  respond: (id: string, status: AssignmentResponse) =>
    api
      .patch<CrewAssignment>(`/crew-assignments/${id}/respond`, { status })
      .then((r) => r.data),
  update: (id: string, payload: { role?: string; agreedFee?: number; deposit?: number }) =>
    api.patch<CrewAssignment>(`/crew-assignments/${id}`, payload).then((r) => r.data),
  remove: (id: string) => api.delete(`/crew-assignments/${id}`).then((r) => r.data),
};

export const teamApi = {
  get: () => api.get<Team>('/users/team').then((r) => r.data),
  invite: (workerPublicId: string) =>
    api.post('/users/team/invite', { workerPublicId }).then((r) => r.data),
  remove: (userId: string) =>
    api.post('/users/team/remove', { userId }).then((r) => r.data),
  respond: (studioId: string, action: 'accept' | 'reject') =>
    api.post('/users/team/respond', { studioId, action }).then((r) => r.data),
};

export const notificationsApi = {
  list: () => api.get<Notification[]>('/users/notifications').then((r) => r.data),
  markRead: (id: string) =>
    api.put(`/users/notifications/${id}/read`).then((r) => r.data),
  markAllRead: () => api.put('/users/notifications/read-all').then((r) => r.data),
};

export const financeApi = {
  studioSummary: () =>
    api.get<StudioFinanceSummary>('/finance/summary').then((r) => r.data),
  myEarnings: () =>
    api.get<WorkerFinanceSummary>('/finance/worker/me').then((r) => r.data),
  workerSummary: (workerId: string) =>
    api.get<WorkerFinanceSummary>(`/finance/worker/${workerId}`).then((r) => r.data),
  clientPayments: (bookingId: string) =>
    api
      .get<ClientPayment[]>(`/finance/client-payments/booking/${bookingId}`)
      .then((r) => r.data),
  createClientPayment: (payload: CreateClientPaymentPayload) =>
    api.post<ClientPayment>('/finance/client-payments', payload).then((r) => r.data),
  workerPayments: (bookingId: string) =>
    api
      .get<WorkerPayment[]>(`/finance/worker-payments/booking/${bookingId}`)
      .then((r) => r.data),
  createWorkerPayment: (payload: any) =>
    api.post<WorkerPayment>('/finance/worker-payments', payload).then((r) => r.data),
  expenses: (bookingId: string) =>
    api.get<Expense[]>(`/finance/expenses/booking/${bookingId}`).then((r) => r.data),
  studioExpenses: () => api.get<Expense[]>('/finance/expenses').then((r) => r.data),
  createExpense: (payload: CreateExpensePayload) =>
    api.post<Expense>('/finance/expenses', payload).then((r) => r.data),
  deleteExpense: (id: string) => api.delete(`/finance/expenses/${id}`).then((r) => r.data),
};

export const studioApi = {
  get: () => api.get<Studio>('/studio').then((r) => r.data),

  update: (payload: UpdateStudioPayload) =>
    api.patch<Studio>('/studio', payload).then((r) => r.data),

  uploadLogo: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api
      .post<{ logoUrl: string }>('/studio/logo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data);
  },
};
