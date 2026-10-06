import { useState, useEffect } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { useNotification } from '@/core/components/NotificationProvider';
import {
  getRemindersApi,
  generateRemindersApi,
  sendReminderApi,
  cancelReminderApi,
  type FeeReminder,
} from '../api/feeReminder';
import { Bell, Send, X, RefreshCw, CheckCircle, AlertCircle, Clock, Plus } from 'lucide-react';
import { Skeleton } from '@/components';
import { formatDateForDisplay } from '@/lib/dateUtils';
import { cn } from '@/lib/utils';
import CreateReminderModal from '../components/CreateReminderModal';

export default function FeeReminderScreen() {
  const { businessDetails } = useAuth();
  const notification = useNotification();
  const [reminders, setReminders] = useState<FeeReminder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [generating, setGenerating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    if (businessDetails?.client_id) fetchReminders();
  }, [businessDetails?.client_id, filter]);

  const fetchReminders = async () => {
    try {
      setLoading(true);
      const status = filter === 'all' ? undefined : filter;
      const res = await getRemindersApi(businessDetails!.client_id, status);
      setReminders(Array.isArray(res.data) ? res.data : []);
    } catch {
      console.error('Failed to load reminders');
      notification?.toast('Failed to load reminders', 'error');
      setReminders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      setGenerating(true);
      await generateRemindersApi(businessDetails!.client_id);
      notification?.toast('Reminders generated successfully', 'success');
      fetchReminders();
    } catch {
      notification?.toast('Failed to generate reminders', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleSend = async (reminderId: string) => {
    try {
      await sendReminderApi(reminderId);
      notification?.toast('Reminder sent successfully', 'success');
      fetchReminders();
    } catch (error: any) {
      const serverMsg = error?.response?.data?.message || error?.response?.data || error?.message;
      notification?.toast(String(serverMsg || 'Failed to send reminder'), 'error');
    }
  };

  const handleCancel = async (reminderId: string) => {
    try {
      await cancelReminderApi(reminderId);
      notification?.toast('Reminder cancelled', 'success');
      fetchReminders();
    } catch {
      notification?.toast('Failed to cancel reminder', 'error');
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'sent') return <CheckCircle className="h-4 w-4 text-emerald-600" />;
    if (status === 'failed') return <AlertCircle className="h-4 w-4 text-red-600" />;
    if (status === 'pending') return <Clock className="h-4 w-4 text-amber-600" />;
    if (status === 'cancelled') return <X className="h-4 w-4 text-gray-600" />;
    return null;
  };

  const getStatusBadge = (status: string) => {
    const classes: Record<string, string> = {
      sent: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400',
      failed: 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-400',
      pending: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400',
      cancelled: 'bg-gray-50 text-gray-700 dark:bg-gray-950/40 dark:text-gray-400',
    };
    return (
      <span className={cn('inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-semibold', classes[status] ?? classes.cancelled)}>
        {getStatusIcon(status)}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="content-sequence space-y-5 animate-in fade-in duration-500">
        <div className="saas-card p-6">
          <Skeleton className="h-6 w-48 mb-4" />
          {[0, 1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full mb-3 rounded-lg" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="content-sequence space-y-5 animate-in fade-in duration-500">
      <div className="saas-card relative overflow-hidden border-border/80 bg-card p-4 sm:p-6 shadow-sm hover-lift">
        <div className="absolute inset-0 pattern-grid opacity-[0.08] pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Financial operations</p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">Fee Reminders</h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Automated payment reminders for students</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCreateModal(true)} className="btn-modern flex items-center gap-2 bg-primary">
              <Plus className="h-4 w-4" />
              Create Manual
            </button>
            <button onClick={handleGenerate} disabled={generating} className="btn-modern flex items-center gap-2">
              <RefreshCw className={cn('h-4 w-4', generating && 'animate-spin')} />
              {generating ? 'Generating...' : 'Auto-Generate'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto">
        {['all', 'pending', 'sent', 'failed'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={cn(
              'rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200',
              filter === status
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border bg-card text-muted-foreground hover:bg-accent'
            )}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      <div className="saas-card">
        <div className="border-b border-border px-5 py-3.5">
          <h2 className="text-sm font-semibold text-foreground">
            {reminders.length} Reminder{reminders.length !== 1 ? 's' : ''}
          </h2>
        </div>

        {reminders.length > 0 ? (
          <div className="overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-thin">
            <table className="table-compact relative min-w-[800px]">
              <thead className="sticky top-0 z-20 shadow-sm backdrop-blur-md">
                <tr className="border-b border-border/70 bg-slate-50/95 dark:bg-slate-900/95">
                  <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Student</th>
                  <th className="px-3 py-2.5 text-right text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Amount</th>
                  <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Due Date</th>
                  <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Reminder Date</th>
                  <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Status</th>
                  <th className="px-3 py-2.5 text-right text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {reminders.map(reminder => (
                <tr key={reminder.reminder_id} className="transition-colors duration-150 hover:bg-muted/20">
                  <td className="px-3 py-2.5">
                    <p className="font-medium text-foreground">{reminder.customers?.first_name} {reminder.customers?.last_name || ''}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{reminder.customers?.mobile}</p>
                  </td>
                  <td className="px-3 py-2.5 text-right font-bold text-foreground tabular-nums">₹{Number(reminder.amount_due).toLocaleString()}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{formatDateForDisplay(reminder.due_date)}</td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">{formatDateForDisplay(reminder.reminder_date)}</td>
                  <td className="px-3 py-2.5">{getStatusBadge(reminder.status)}</td>
                  <td className="px-3 py-2.5">
                    <div className="flex justify-end gap-2">
                      {reminder.status === 'pending' && (
                        <button
                          onClick={() => handleSend(String(reminder.reminder_id))}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-primary transition-colors hover:bg-accent"
                          title="Send now"
                        >
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      )}
                      {(reminder.status === 'pending' || reminder.status === 'failed') && (
                        <button
                          onClick={() => handleCancel(String(reminder.reminder_id))}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground transition-colors hover:bg-red-50 hover:text-red-600"
                          title="Cancel"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-sm font-medium text-foreground">No reminders found</p>
            <p className="text-meta mt-1">Click &quot;Auto-Generate&quot; to create automated reminders</p>
          </div>
        )}
      </div>

      <CreateReminderModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchReminders}
      />
    </div>
  );
}
