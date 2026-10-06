import { useState, useEffect } from 'react';
import { ArrowLeft, MessageSquare, Loader2, CheckCircle2, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createSupportTicketApi, getSupportTicketsApi, SupportTicket } from '@/modules/profile/api/profile';
import { useNotification } from '@/core/components/NotificationProvider';
import { getErrorMessage } from '@/core/utils/error';

const CATEGORIES = [
  { value: 'billing',   label: 'Billing & Payments' },
  { value: 'technical', label: 'Technical Issue' },
  { value: 'account',   label: 'Account & Access' },
  { value: 'feature',   label: 'Feature Request' },
  { value: 'other',     label: 'Other' },
];

const PRIORITIES = [
  { value: 'low',    label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high',   label: 'High' },
];

const STATUS_COLORS: Record<string, string> = {
  open:        'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
  in_progress: 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
  resolved:    'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
  closed:      'bg-muted text-muted-foreground',
};

function formatDate(d: string) {
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(d));
}

export default function ContactSupportScreen() {
  const navigate = useNavigate();
  const notification = useNotification();

  const [form, setForm] = useState({ subject: '', category: 'technical', message: '', priority: 'medium' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);

  useEffect(() => {
    getSupportTicketsApi()
      .then(res => setTickets(res.data))
      .catch(() => {/* non-critical */})
      .finally(() => setLoadingTickets(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.subject.trim().length < 5) {
      notification.toast('Subject must be at least 5 characters', 'error'); return;
    }
    if (form.message.trim().length < 20) {
      notification.toast('Message must be at least 20 characters', 'error'); return;
    }
    setSubmitting(true);
    try {
      const res = await createSupportTicketApi(form);
      setTickets(prev => [res.data, ...prev]);
      setSubmitted(true);
      setForm({ subject: '', category: 'technical', message: '', priority: 'medium' });
      notification.toast('Support ticket submitted successfully', 'success');
    } catch (err) {
      notification.toast(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="content-sequence p-4 md:p-6 max-w-3xl space-y-6">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <MessageSquare className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contact Support</h1>
          <p className="text-sm text-muted-foreground">We typically respond within 24 hours</p>
        </div>
      </div>

      {/* Submission form */}
      <div className="surface-elevated rounded-2xl p-6">
        {submitted && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            Ticket submitted! We&apos;ll get back to you soon.
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Subject</label>
            <input
              type="text"
              value={form.subject}
              onChange={e => setForm({ ...form, subject: e.target.value })}
              placeholder="Brief description of your issue"
              maxLength={200}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Category</label>
              <select
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Priority</label>
              <select
                value={form.priority}
                onChange={e => setForm({ ...form, priority: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Message</label>
            <textarea
              value={form.message}
              onChange={e => setForm({ ...form, message: e.target.value })}
              placeholder="Describe your issue in detail (minimum 20 characters)…"
              rows={5}
              maxLength={2000}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{form.message.length}/2000</p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" />Submitting…</> : 'Submit Ticket'}
          </button>
        </form>
      </div>

      {/* Ticket history */}
      <div className="surface-elevated rounded-2xl p-6">
        <h2 className="text-base font-semibold text-foreground mb-4">Your Tickets</h2>
        {loadingTickets ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : tickets.length === 0 ? (
          <p className="text-sm text-muted-foreground">No tickets yet.</p>
        ) : (
          <div className="space-y-3">
            {tickets.map(t => (
              <div key={t.id} className="rounded-xl border border-border/70 bg-background/60 px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{t.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">{t.category} · {t.priority} priority</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold capitalize ${STATUS_COLORS[t.status] ?? STATUS_COLORS.open}`}>
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" /> {formatDate(t.createdAt)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
