import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen, Pencil, SunMedium, MoonStar, Monitor, Languages,
  Bell, Mail, MessageSquare, ShieldCheck, HelpCircle, FileText,
  ChevronRight, Loader2, Check, CheckCircle2,
} from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useNotification } from '@/core/components/NotificationProvider';
import { useTheme } from '@/core/theme/ThemeContext';
import { getErrorMessage } from '@/core/utils/error';
import {
  getPreferencesApi, updatePreferencesApi, ProfilePreferences,
} from '@/modules/profile/api/profile';
import { Skeleton } from '@/components';
import { cn } from '@/lib/utils';

// ── Shared sub-components ────────────────────────────────────────────────────

function SectionCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('saas-card border-border/80 bg-card p-5 shadow-sm', className)}>
      {children}
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-5">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function ToggleSwitch({
  checked, onChange, disabled,
}: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={onChange}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-primary' : 'bg-muted-foreground/30',
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-200',
          checked ? 'translate-x-5' : 'translate-x-0.5',
        )}
      />
    </button>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────

export default function SettingsScreen() {
  const navigate = useNavigate();
  const { businessDetails, updateBusinessDetails } = useAuth();
  const notification = useNotification();
  const { setTheme: setAppTheme } = useTheme();

  const [modeSaving, setModeSaving] = useState(false);
  const [prefsLoading, setPrefsLoading] = useState(true);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [savedKey, setSavedKey] = useState<string | null>(null); // which key just saved
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [preferences, setPreferences] = useState<ProfilePreferences>({
    theme: 'system',
    language: 'en',
    emailNotifications: true,
    smsReminders: true,
    marketingEmails: false,
  });

  const isMasterMode = businessDetails?.requires_master_config ?? false;

  // Load preferences from DB once on mount
  useEffect(() => {
    getPreferencesApi()
      .then((res) => {
        setPreferences(res.data);
        setAppTheme(res.data.theme as any);
        // Apply language to document
        document.documentElement.lang = res.data.language || 'en';
      })
      .catch(() => { /* use defaults */ })
      .finally(() => setPrefsLoading(false));
  }, [setAppTheme]);

  const flashSaved = (key: string) => {
    setSavedKey(key);
    if (savedTimer.current) clearTimeout(savedTimer.current);
    savedTimer.current = setTimeout(() => setSavedKey(null), 1800);
  };

  const handlePrefChange = useCallback(async (patch: Partial<ProfilePreferences>) => {
    const prev = preferences;
    const next = { ...preferences, ...patch };
    setPreferences(next);

    // Apply side-effects immediately
    if (patch.theme) setAppTheme(patch.theme as any);
    if (patch.language) document.documentElement.lang = patch.language;

    setPrefsSaving(true);
    try {
      const res = await updatePreferencesApi(patch);
      setPreferences(res.data);
      flashSaved(Object.keys(patch)[0]);
    } catch (err) {
      notification.toast(getErrorMessage(err), 'error');
      setPreferences(prev); // revert optimistic update
    } finally {
      setPrefsSaving(false);
    }
  }, [preferences, setAppTheme, notification]);

  const handleModeToggle = async () => {
    if (!businessDetails?.client_id) return;
    const next = !isMasterMode;
    setModeSaving(true);
    try {
      await updateBusinessDetails(businessDetails.client_id, { requiresMasterConfig: next });
      notification.toast(
        next
          ? 'Master Config enabled — enrollment forms now use course & fee dropdowns.'
          : 'Manual Entry enabled — enrollment forms now use free-text inputs.',
        'success',
      );
    } catch (err) {
      notification.toast(getErrorMessage(err), 'error');
    } finally {
      setModeSaving(false);
    }
  };

  const themeOptions: { value: ProfilePreferences['theme']; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Light', icon: <SunMedium className="h-4 w-4" /> },
    { value: 'dark', label: 'Dark', icon: <MoonStar className="h-4 w-4" /> },
    { value: 'system', label: 'System', icon: <Monitor className="h-4 w-4" /> },
  ];

  const languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'hi', label: 'Hindi' },
    { value: 'mr', label: 'Marathi' },
  ];

  const notificationToggles: {
    key: keyof ProfilePreferences;
    label: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      key: 'emailNotifications',
      label: 'Email notifications',
      description: 'Product, account, and billing updates',
      icon: <Mail className="h-4 w-4 text-primary" />,
    },
    {
      key: 'smsReminders',
      label: 'SMS reminders',
      description: 'Attendance and payment alerts',
      icon: <MessageSquare className="h-4 w-4 text-primary" />,
    },
    {
      key: 'marketingEmails',
      label: 'Marketing emails',
      description: 'New features and learning content',
      icon: <Bell className="h-4 w-4 text-primary" />,
    },
  ];

  const legalLinks: { label: string; icon: React.ReactNode; action: () => void }[] = [
    { label: 'Help center', icon: <HelpCircle className="h-4 w-4" />, action: () => navigate('/help') },
    { label: 'Contact support', icon: <Bell className="h-4 w-4" />, action: () => navigate('/support') },
    { label: 'Privacy policy', icon: <ShieldCheck className="h-4 w-4" />, action: () => navigate('/privacy') },
    { label: 'Terms of service', icon: <FileText className="h-4 w-4" />, action: () => navigate('/terms') },
  ];

  return (
    <div className="content-sequence space-y-5 animate-in fade-in duration-500">
      {/* ── Header ── */}
      <section className="saas-card relative overflow-hidden border-border/80 bg-card p-4 sm:p-6 shadow-sm hover-lift">
        <div className="absolute inset-0 pattern-grid opacity-[0.08] pointer-events-none" />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Settings</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your workspace preferences and configuration.
            </p>
          </div>
          {prefsSaving && (
            <div className="flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving…
            </div>
          )}
          {!prefsSaving && savedKey && (
            <div className="flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" /> Saved
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* ── Theme ── */}
        <SectionCard>
          <SectionHeader title="Theme" description="Choose how the workspace looks." />
          {prefsLoading ? (
            <div className="flex gap-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-20 flex-1 rounded-xl" />)}
            </div>
          ) : (
            <div className="flex gap-3">
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  disabled={prefsSaving}
                  onClick={() => handlePrefChange({ theme: opt.value })}
                  className={cn(
                    'flex flex-1 flex-col items-center gap-2 rounded-xl border p-4 text-sm font-medium transition-colors disabled:opacity-60',
                    preferences.theme === opt.value
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                >
                  {opt.icon}
                  {opt.label}
                  {preferences.theme === opt.value && (
                    savedKey === 'theme'
                      ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      : <Check className="h-3.5 w-3.5" />
                  )}
                </button>
              ))}
            </div>
          )}
        </SectionCard>

        {/* ── Language ── */}
        <SectionCard>
          <SectionHeader title="Language" description="Select your preferred display language." />
          {prefsLoading ? (
            <Skeleton className="h-11 w-full rounded-lg" />
          ) : (
            <>
              <div className="flex items-center gap-3 rounded-xl border border-border bg-background p-3">
                <Languages className="h-4 w-4 shrink-0 text-primary" />
                <select
                  value={preferences.language}
                  disabled={prefsSaving}
                  onChange={(e) => handlePrefChange({ language: e.target.value })}
                  className="w-full bg-transparent text-sm text-foreground outline-none disabled:opacity-60"
                >
                  {languageOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                {prefsSaving
                  ? <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                  : savedKey === 'language' && <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                }
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Language preference is saved to your account and applied on every login.
              </p>
            </>
          )}
        </SectionCard>

        {/* ── Notifications ── */}
        <SectionCard>
          <SectionHeader title="Notifications" description="Control which alerts you receive." />
          {prefsLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
            </div>
          ) : (
            <div className="space-y-2">
              {notificationToggles.map((item) => (
                <div
                  key={item.key}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-background/60 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    {item.icon}
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {savedKey === item.key && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )}
                    <ToggleSwitch
                      checked={preferences[item.key] as boolean}
                      onChange={() => handlePrefChange({ [item.key]: !preferences[item.key] })}
                      disabled={prefsSaving}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        {/* ── Enrollment Configuration Mode ── */}
        <SectionCard>
          <SectionHeader
            title="Enrollment Configuration Mode"
            description="Controls how class and fee data is entered during enrollment."
          />
          <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {isMasterMode ? 'Master Config (Structured)' : 'Manual Entry (Free-text)'}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isMasterMode
                    ? 'Enrollment forms show Course and Fee Structure dropdowns linked to your master data.'
                    : 'Enrollment forms show free-text class name and a numeric amount field.'}
                </p>
              </div>
              <ToggleSwitch checked={isMasterMode} onChange={handleModeToggle} disabled={modeSaving} />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-1">
              <div className={cn(
                'rounded-lg border p-3 text-xs space-y-1.5 transition-colors',
                !isMasterMode ? 'border-primary/40 bg-primary/5' : 'border-border bg-card',
              )}>
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <Pencil className="h-3.5 w-3.5" /> Manual Entry
                </p>
                <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                  <li>Free-text class / subject name</li>
                  <li>Numeric fee amount per enrollment</li>
                  <li>No master course setup required</li>
                  <li>Best for small or informal institutes</li>
                </ul>
              </div>
              <div className={cn(
                'rounded-lg border p-3 text-xs space-y-1.5 transition-colors',
                isMasterMode ? 'border-primary/40 bg-primary/5' : 'border-border bg-card',
              )}>
                <p className="font-semibold text-foreground flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" /> Master Config
                </p>
                <ul className="space-y-1 text-muted-foreground list-disc list-inside">
                  <li>Course dropdown from Courses module</li>
                  <li>Fee auto-filled from course rate</li>
                  <li>Consistent reporting by course</li>
                  <li>Best for structured institutes</li>
                </ul>
              </div>
            </div>
          </div>

          {isMasterMode ? (
            <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20 px-4 py-3 text-xs text-amber-800 dark:text-amber-300">
              Master Config is <strong>ON</strong> — make sure you have courses added in the{' '}
              <strong>Courses</strong> module before creating enrollments.
            </p>
          ) : (
            <p className="mt-3 rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-950/20 px-4 py-3 text-xs text-blue-800 dark:text-blue-300">
              Manual Entry is <strong>ON</strong> — you can type any class name and fee amount directly on the enrollment form.
            </p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            Switching modes does not affect existing enrollment records. Historical data is always preserved.
          </p>
        </SectionCard>
      </div>

      {/* ── Support & Legal ── */}
      <SectionCard>
        <SectionHeader title="Support & Legal" description="Get help, share feedback, and review policies." />
        <div className="grid gap-2 sm:grid-cols-2">
          {legalLinks.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={item.action}
              className="flex items-center justify-between rounded-xl border border-border/70 bg-background/60 px-4 py-3 text-left text-sm font-medium text-foreground hover:bg-accent transition-colors"
            >
              <span className="flex items-center gap-2 text-muted-foreground">
                {item.icon}
                <span className="text-foreground">{item.label}</span>
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
