import { useState, useMemo } from 'react';
import { ArrowLeft, HelpCircle, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

type FAQ = { q: string; a: string };
type Category = { label: string; faqs: FAQ[] };

const CATEGORIES: Category[] = [
  {
    label: 'Getting Started',
    faqs: [
      { q: 'How do I add my first student?', a: 'Go to Customers → Add Customer. Fill in the student\'s name, mobile number, and enrollment details. If Master Config is ON, select a course from the dropdown.' },
      { q: 'What is Master Config mode?', a: 'Master Config mode links enrollment forms to your Courses module, auto-filling fees from course rates. Manual mode lets you type any class name and fee amount freely. Toggle it in Settings.' },
      { q: 'How do I set up my business profile?', a: 'After registration, you are prompted to fill in your business details. You can update them anytime from Profile → Business & Billing.' },
    ],
  },
  {
    label: 'Payments',
    faqs: [
      { q: 'How do I record a payment?', a: 'Go to Payment Details, click "Record Payment", select the student, enter the amount and payment mode, then save.' },
      { q: 'How do I generate an invoice?', a: 'On the Payment Details screen, click the invoice icon next to any payment record. A PDF-ready invoice will be generated.' },
      { q: 'What payment modes are supported?', a: 'Cash, UPI, bank transfer, cheque, and Razorpay online payments are all supported.' },
    ],
  },
  {
    label: 'Attendance',
    faqs: [
      { q: 'How do I mark attendance?', a: 'Go to Attendance, select the date and course, then mark each student as Present, Absent, Late, or Excused.' },
      { q: 'Can I mark attendance in bulk?', a: 'Yes. Use the "Mark All Present" button on the Attendance screen to mark all students present at once, then adjust individual exceptions.' },
    ],
  },
  {
    label: 'Fee Reminders',
    faqs: [
      { q: 'How do fee reminders work?', a: 'The system auto-generates reminders for students with overdue fees. You can also create manual reminders and send them via WhatsApp or SMS.' },
      { q: 'Can I cancel a reminder?', a: 'Yes. On the Fee Reminders screen, click the cancel icon next to any pending reminder.' },
    ],
  },
  {
    label: 'Account & Settings',
    faqs: [
      { q: 'How do I change my password?', a: 'Go to Profile → Change Password. Enter your current password and your new password (minimum 8 characters).' },
      { q: 'How do I change the app theme?', a: 'Go to Profile → Preferences → Theme. Choose Light, Dark, or System (follows your OS setting). The preference is saved to your account.' },
      { q: 'How do I turn off email notifications?', a: 'Go to Profile → Preferences and toggle off Email Notifications. This is saved to your account and synced across devices.' },
      { q: 'How do I delete my account?', a: 'Go to Profile → Danger Zone → Delete Account. This action is permanent and removes all your data within 30 days.' },
    ],
  },
];

function FAQItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border/60 last:border-0">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between gap-3 py-3 text-left text-sm font-medium text-foreground hover:text-primary"
      >
        {faq.q}
        {open ? <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />}
      </button>
      {open && (
        <p className="pb-3 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
      )}
    </div>
  );
}

export default function HelpCenterScreen() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return CATEGORIES.map(cat => ({
      ...cat,
      faqs: cat.faqs.filter(
        f => !q || f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q),
      ),
    })).filter(cat =>
      (!activeCategory || cat.label === activeCategory) && cat.faqs.length > 0,
    );
  }, [query, activeCategory]);

  return (
    <div className="content-sequence p-4 md:p-6 max-w-3xl">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
          <HelpCircle className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Help Center</h1>
          <p className="text-sm text-muted-foreground">Find answers to common questions</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search questions…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full rounded-xl border border-border bg-background pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* Category filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          type="button"
          onClick={() => setActiveCategory(null)}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${!activeCategory ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
        >
          All
        </button>
        {CATEGORIES.map(cat => (
          <button
            key={cat.label}
            type="button"
            onClick={() => setActiveCategory(c => c === cat.label ? null : cat.label)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${activeCategory === cat.label ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-accent'}`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* FAQ list */}
      <div className="space-y-4">
        {filtered.length === 0 ? (
          <div className="surface-elevated rounded-2xl p-8 text-center text-sm text-muted-foreground">
            No results found for &quot;{query}&quot;. Try a different search term or{' '}
            <button type="button" onClick={() => navigate('/support')} className="text-primary underline">contact support</button>.
          </div>
        ) : (
          filtered.map(cat => (
            <div key={cat.label} className="surface-elevated rounded-2xl p-5">
              <h2 className="text-sm font-semibold text-foreground mb-3">{cat.label}</h2>
              {cat.faqs.map(faq => <FAQItem key={faq.q} faq={faq} />)}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
