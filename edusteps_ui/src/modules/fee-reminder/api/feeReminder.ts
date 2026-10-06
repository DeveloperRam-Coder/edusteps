import api from '../../../core/api/client';

export interface FeeReminder {
  reminder_id: string;
  customer_id: string;
  client_id: string;
  cd_id: string;
  due_date: string;
  amount_due: number;
  reminder_date: string;
  status: 'pending' | 'sent' | 'failed' | 'cancelled';
  sent_at?: string;
  delivery_status?: string;
  message_id?: string;
  created_at: string;
  customers?: {
    first_name: string;
    last_name?: string;
    mobile: string;
    email: string;
  };
}

export const generateRemindersApi = (clientId: number | string) =>
  api.post(`/fee-reminders/generate/${clientId}`);

export const createManualReminderApi = (data: {
  customer_id: number;
  client_id: number | string;
  cd_id: number;
  due_date: string;
  amount_due: number;
  reminder_date?: string;
}) => api.post('/fee-reminders/manual', { ...data, client_id: Number(data.client_id) });

export const sendReminderApi = (reminderId: string | number) =>
  api.post(`/fee-reminders/send/${reminderId}`);

export const getRemindersApi = (clientId: number | string, status?: string) =>
  api.get<FeeReminder[]>(`/fee-reminders/client/${clientId}`, { params: { status } });

export const getCustomerRemindersApi = (customerId: number | string) =>
  api.get<FeeReminder[]>(`/fee-reminders/customer/${customerId}`);

export const cancelReminderApi = (reminderId: string | number) =>
  api.delete(`/fee-reminders/${reminderId}`);
