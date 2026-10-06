import api from '@/core/api/client';

export type ProfilePreferences = {
  theme: 'system' | 'light' | 'dark';
  language: string;
  emailNotifications: boolean;
  smsReminders: boolean;
  marketingEmails: boolean;
};

export type SupportTicket = {
  id: number;
  subject: string;
  category: string;
  message: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateSupportTicketPayload = {
  subject: string;
  category: string;
  message: string;
  priority?: string;
};

// ── Preferences ──────────────────────────────────────────────────────────────

export const getPreferencesApi = () =>
  api.get<ProfilePreferences>('/preferences');

export const updatePreferencesApi = (payload: Partial<ProfilePreferences>) =>
  api.put<ProfilePreferences>('/preferences', payload);

// ── Support Tickets ───────────────────────────────────────────────────────────

export const createSupportTicketApi = (payload: CreateSupportTicketPayload) =>
  api.post<SupportTicket>('/support/tickets', payload);

export const getSupportTicketsApi = () =>
  api.get<SupportTicket[]>('/support/tickets');

export const getSupportTicketApi = (id: number) =>
  api.get<SupportTicket>(`/support/tickets/${id}`);
