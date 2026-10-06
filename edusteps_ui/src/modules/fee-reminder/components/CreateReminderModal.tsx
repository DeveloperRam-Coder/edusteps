import { useState, useEffect } from 'react';
import { X, Bell, Calendar, DollarSign, User } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useNotification } from '@/core/components/NotificationProvider';
import { createManualReminderApi, sendReminderApi } from '../api/feeReminder';
import { getCustomersByClientIdApi } from '@/modules/auth/api/customer';
import { getCustomerDetailsByCustomerIdApi } from '@/modules/auth/api/customerDetails';
import { getTodayDateInputValue } from '@/lib/dateUtils';

interface CreateReminderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  prefilledCustomerId?: number;
  prefilledCdId?: number;
}

export default function CreateReminderModal({
  isOpen,
  onClose,
  onSuccess,
  prefilledCustomerId,
  prefilledCdId,
}: CreateReminderModalProps) {
  const { businessDetails } = useAuth();
  const notification = useNotification();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [customerDetails, setCustomerDetails] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [sendImmediately, setSendImmediately] = useState(false);

  const [formData, setFormData] = useState({
    customer_id: prefilledCustomerId || 0,
    cd_id: prefilledCdId || 0,
    due_date: '',
    amount_due: 0,
    reminder_date: '',
  });

  useEffect(() => {
    // If modal opened and no due_date set, default to today
    if (isOpen && !formData.due_date) {
      setFormData(prev => ({ ...prev, due_date: getTodayDateInputValue() }));
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && businessDetails?.client_id) fetchCustomers();
  }, [isOpen, businessDetails?.client_id]);

  useEffect(() => {
    if (formData.customer_id > 0) fetchCustomerDetails(formData.customer_id);
  }, [formData.customer_id]);

  const fetchCustomers = async () => {
    try {
      const res = await getCustomersByClientIdApi(businessDetails!.client_id);
      setCustomers(Array.isArray(res.data) ? res.data : []);
    } catch {
      // silently fail — user will see empty list
    }
  };

  const fetchCustomerDetails = async (customerId: number) => {
    try {
      setLoadingDetails(true);
      const res = await getCustomerDetailsByCustomerIdApi(String(customerId));
      setCustomerDetails(Array.isArray(res.data) ? res.data : []);
    } catch {
      setCustomerDetails([]);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customer_id || !formData.cd_id) {
      notification?.toast('Please select customer and enrollment', 'error');
      return;
    }
    if (!formData.due_date) {
      notification?.toast('Please select a due date', 'error');
      return;
    }
    if (formData.amount_due <= 0) {
      notification?.toast('Amount must be greater than 0', 'error');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        customer_id: formData.customer_id,
        client_id: businessDetails!.client_id,
        cd_id: formData.cd_id,
        due_date: formData.due_date,
        amount_due: formData.amount_due,
        reminder_date: sendImmediately ? getTodayDateInputValue() : (formData.reminder_date || undefined),
      } as any;
      const res = await createManualReminderApi(payload);
      const created = res?.data as any;

      if (sendImmediately && created?.reminder_id && created?.status === 'pending') {
        // Backend didn't auto-send (e.g. timing edge case) — send explicitly
        try {
          await sendReminderApi(created.reminder_id);
          notification?.toast('Reminder sent successfully', 'success');
        } catch {
          notification?.toast('Reminder created but sending failed', 'warning');
        }
      } else if (created?.status === 'sent') {
        notification?.toast('Reminder sent successfully', 'success');
      } else if (created?.status === 'failed') {
        notification?.toast('Reminder created but sending failed — check WhatsApp/SMS config', 'warning');
      } else {
        notification?.toast('Reminder created successfully', 'success');
      }
      onSuccess();
      onClose();
    } catch (error: any) {
      const serverMsg = error?.response?.data?.message || error?.response?.data || error?.message;
      console.error('Create reminder error:', error);
      notification?.toast(String(serverMsg) || 'Failed to create reminder', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerChange = (customerId: number) => {
    setFormData({ ...formData, customer_id: customerId, cd_id: 0, amount_due: 0 });
  };

  const handleDetailChange = (cdId: number) => {
    const detail = customerDetails.find(d => Number(d.cd_id) === cdId);
    setFormData({ ...formData, cd_id: cdId, amount_due: detail?.amount ? Number(detail.amount) : 0, due_date: detail?.registration_date || formData.due_date });
  };

  // If prefilled cd id is provided, populate amount when details load
  useEffect(() => {
    if (prefilledCdId && customerDetails.length > 0) {
      const d = customerDetails.find(dd => Number(dd.cd_id) === Number(prefilledCdId));
      if (d) setFormData(prev => ({ ...prev, cd_id: Number(prefilledCdId), amount_due: Number(d.amount || prev.amount_due) }));
    }
  }, [customerDetails, prefilledCdId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="saas-card w-full max-w-lg mx-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Create Fee Reminder</h2>
              <p className="text-meta text-xs">Send payment reminder to student</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="label-caps mb-2 flex items-center gap-2">
              <User className="h-3.5 w-3.5" />
              Select Customer (Payer)
            </label>
            <select
              value={formData.customer_id}
              onChange={(e) => handleCustomerChange(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
              disabled={!!prefilledCustomerId}
            >
              <option value={0}>-- Select Customer --</option>
              {customers.map((c) => (
                <option key={c.customer_id} value={c.customer_id}>
                  {c.first_name} {c.last_name || ''} - {c.mobile}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="label-caps mb-2 flex items-center gap-2">
              <User className="h-3.5 w-3.5" />
              Select Student Enrollment
            </label>
            <select
              value={formData.cd_id}
              onChange={(e) => handleDetailChange(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              required
              disabled={!formData.customer_id || loadingDetails || !!prefilledCdId}
            >
              <option value={0}>{loadingDetails ? 'Loading...' : '-- Select Enrollment --'}</option>
              {customerDetails.map((d) => (
                <option key={d.cd_id} value={Number(d.cd_id)}>
                  {d.first_name} {d.last_name || ''} - {d.subject} (₹{Number(d.amount).toLocaleString()})
                </option>
              ))}
            </select>
            {formData.customer_id > 0 && customerDetails.length === 0 && !loadingDetails && (
              <p className="text-meta text-xs mt-1">No enrollments found for this customer</p>
            )}
          </div>

          <div>
            <label className="label-caps mb-2 flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5" />
              Amount Due (₹)
            </label>
            <input
              type="number"
              value={formData.amount_due}
              onChange={(e) => setFormData({ ...formData, amount_due: Number(e.target.value) })}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              required min={0} step={0.01}
            />
          </div>

          <div>
            <label className="label-caps mb-2 flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5" />
              Payment Due Date
            </label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              required min={getTodayDateInputValue()}
            />
          </div>

          {!sendImmediately && (
          <div>
            <label className="label-caps mb-2 flex items-center gap-2">
              <Bell className="h-3.5 w-3.5" />
              Reminder Date (Optional)
            </label>
            <input
              type="date"
              value={formData.reminder_date}
              onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
              className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-sm text-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              max={formData.due_date}
            />
            <p className="text-meta text-xs mt-1">Leave empty to send immediately.</p>
          </div>
          )}

          <div className="flex items-center gap-2">
            <input id="send_now" type="checkbox" checked={sendImmediately} onChange={(e) => setSendImmediately(e.target.checked)} className="h-4 w-4" />
            <label htmlFor="send_now" className="text-sm">Send immediately</label>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit" disabled={loading}
              className="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-all hover:brightness-110 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Reminder'}
            </button>
            <button
              type="button" onClick={onClose}
              className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
