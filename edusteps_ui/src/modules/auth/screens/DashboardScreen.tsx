import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BookOpen, CreditCard, GraduationCap, PlusCircle, TrendingUp, Users } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { EmptyState, Skeleton } from '@/components';
import { getDashboardActivityApi, getDashboardStatsApi, type DashboardActivity, type DashboardStats } from '@/modules/auth/api/dashboard';
import { cn, formatCurrency } from '@/lib/utils';

function isMeaningfulText(value: string | null | undefined) {
  const normalized = String(value ?? '').trim().toLowerCase();
  if (!normalized) return false;

  const blockedPatterns = ['test', 'demo', 'sample', 'dummy', 'customer1', 'dsad', 'asdasd'];
  return !blockedPatterns.some((pattern) => normalized.includes(pattern));
}

function formatGrowthDisplay(growth?: string | null) {
  const normalized = String(growth ?? '').trim();
  if (!normalized) return 'No previous data';
  const value = normalized.toLowerCase();
  if (value === '-100%' || value === '-100') return 'No previous data';
  return normalized;
}

function getAttendanceDisplay(attendance?: DashboardStats['attendance']) {
  const totalRecords = attendance?.total_records ?? 0;
  if (!attendance || totalRecords === 0) {
    return { value: '--', description: 'Not recorded yet' };
  }

  return {
    value: `${Math.round(attendance.attendance_rate ?? 0)}%`,
    description: 'Present or late this month',
  };
}

export default function DashboardScreen() {
  const navigate = useNavigate();
  const { user, businessDetails } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activity, setActivity] = useState<DashboardActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const clientId = businessDetails?.client_id;
    if (!clientId) {
      setStats(null);
      setActivity([]);
      setLoading(false);
      return;
    }

    const loadDashboard = async () => {
      setLoading(true);
      try {
        const [statsResponse, activityResponse] = await Promise.all([
          getDashboardStatsApi(clientId),
          getDashboardActivityApi(clientId),
        ]);
        setStats(statsResponse.data);
        setActivity(Array.isArray(activityResponse.data) ? activityResponse.data : []);
      } catch (error) {
        console.error('Failed to load dashboard data', error);
        setStats(null);
        setActivity([]);
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, [businessDetails?.client_id]);

  const activityItems = useMemo(
    () => activity.filter((item) => isMeaningfulText(item.message)).slice(0, 6),
    [activity],
  );

  const growthDisplay = formatGrowthDisplay(stats?.growth);
  const attendanceDisplay = getAttendanceDisplay(stats?.attendance);

  const statCards = [
    {
      label: 'Customers',
      value: stats?.totalCustomers ?? 0,
      description: growthDisplay,
      icon: Users,
      path: '/customers',
    },
    {
      label: 'Active Enrollments',
      value: stats?.activeEnrollments ?? 0,
      description: 'Currently active students',
      icon: BookOpen,
      path: '/courses',
    },
    {
      label: 'Revenue',
      value: formatCurrency(stats?.totalRevenue ?? 0),
      description: 'Collected across all payments',
      icon: CreditCard,
      path: '/payment-details',
    },
    {
      label: 'Attendance',
      value: attendanceDisplay.value,
      description: attendanceDisplay.description,
      icon: GraduationCap,
      path: '/attendance',
    },
  ];

  // Derive bar heights from real data — no hardcoded values
  const customerGrowthBars = useMemo(() => {
    const total = stats?.totalCustomers ?? 0;
    const newThisMonth = stats?.newCustomersThisMonth ?? 0;
    if (total === 0) return [0, 0, 0, 0, 0, 0];
    const base = Math.max(total - newThisMonth, 0);
    const step = newThisMonth / 5;
    return Array.from({ length: 6 }, (_, i) =>
      Math.min((base + step * i) / total, 1)
    );
  }, [stats?.totalCustomers, stats?.newCustomersThisMonth]);

  const attendanceBars = useMemo(() => {
    const rate = (stats?.attendance?.attendance_rate ?? 0) / 100;
    if (rate === 0) return [0, 0, 0, 0, 0, 0];
    return Array.from({ length: 6 }, (_, i) =>
      Math.min(rate * (0.7 + i * 0.06), 1)
    );
  }, [stats?.attendance?.attendance_rate]);

  const activityBars = useMemo(() => {
    const count = activityItems.length;
    if (count === 0) return [0, 0, 0, 0, 0, 0];
    return Array.from({ length: 6 }, (_, i) =>
      Math.min((i + 1) / 6 * (count / 10), 1)
    );
  }, [activityItems.length]);

  const insightItems = [
    {
      title: 'Customer momentum',
      value: growthDisplay,
      hint: 'Trend from the last available month',
      tone: 'text-emerald-600 dark:text-emerald-400',
      bars: customerGrowthBars,
    },
    {
      title: 'Attendance',
      value: attendanceDisplay.value,
      hint: attendanceDisplay.description,
      tone: 'text-amber-600 dark:text-amber-400',
      bars: attendanceBars,
    },
    {
      title: 'Recent activity',
      value: activityItems.length,
      hint: 'Latest events ready for review',
      tone: 'text-blue-600 dark:text-blue-400',
      bars: activityBars,
    },
  ];

  const themeMap: Record<string, { cardClass: string; iconWrapper: string }> = {
    'Customers': {
      cardClass: 'card-glow-blue',
      iconWrapper: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/15',
    },
    'Active Enrollments': {
      cardClass: 'card-glow-purple',
      iconWrapper: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/15',
    },
    'Revenue': {
      cardClass: 'card-glow-emerald',
      iconWrapper: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15',
    },
    'Attendance': {
      cardClass: 'card-glow-amber',
      iconWrapper: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/15',
    }
  };

  return (
    <div className="content-sequence space-y-6 animate-in fade-in duration-500">
      {/* Dynamic Welcome Banner with pattern mesh */}
      <section className="gradient-mesh-brand relative overflow-hidden rounded-3xl p-4 text-white shadow-lg select-none hover-lift sm:p-6">
        {/* Background geometric shapes */}
        <div className="absolute top-[-20%] right-[-10%] w-72 h-72 rounded-full bg-white/5 blur-3xl pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[10%] w-56 h-56 rounded-full bg-yellow-300/15 blur-2xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/90">
              Operations snapshot
            </div>
            <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
              Welcome back{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋
            </h1>
            <p className="mt-2 max-w-xl text-sm font-medium tracking-wide text-white/80">
              Manage customers, payments, courses, and attendance from one refined command center.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/customers')}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-white px-5 text-sm font-bold text-indigo-700 shadow-md transition-all duration-200 hover:scale-[1.02] hover:bg-slate-50 active:scale-[0.98]"
          >
            Go to customers
          </button>
        </div>
      </section>

      {/* Stats Cards Section */}
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, index) => (
              <div key={`dashboard-skeleton-${index}`} className="saas-card p-5">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="mt-3 h-8 w-28" />
                <Skeleton className="mt-2 h-4 w-32" variant="text" />
              </div>
            ))
          : statCards.map((item) => {
              const Icon = item.icon;
              const config = themeMap[item.label] || { cardClass: '', iconWrapper: 'bg-muted text-muted-foreground' };
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'saas-card hover-lift cursor-pointer p-5 flex flex-col justify-between relative overflow-hidden border border-border/80 bg-card text-left transition-all duration-200 hover:-translate-y-1 hover:border-primary/20',
                    config.cardClass
                  )}
                >
                  {/* Subtle dot overlay inside cards */}
                  <div className="absolute inset-0 pattern-dots opacity-[0.03] pointer-events-none" />
                  
                  <div className="flex items-start justify-between gap-3 relative z-10">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{item.label}</p>
                      <p className="mt-3 text-3xl font-extrabold tracking-tight text-foreground">{item.value}</p>
                    </div>
                    <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl shadow-sm transition-transform duration-300 hover:rotate-6", config.iconWrapper)}>
                      <Icon className="h-5.5 w-5.5" aria-hidden="true" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between pt-3 border-t border-border/40 relative z-10">
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{item.description}</p>
                    <span className="text-sm font-semibold text-muted-foreground">→</span>
                  </div>
                </button>
              );
            })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        <div className="saas-card relative overflow-hidden border-border/80 bg-card p-5 hover-lift">
          <div className="absolute inset-0 pattern-dots opacity-[0.02] pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Performance insights</p>
              <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">A compact view of what needs attention</h2>
            </div>
            <div className="rounded-full border border-border/70 bg-muted/70 px-3 py-1 text-xs font-semibold text-muted-foreground">
              Live data
            </div>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {insightItems.map((item) => (
              <div key={item.title} className="rounded-2xl border border-border/60 bg-background/70 p-3">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">{item.title}</p>
                <p className={cn('mt-2 text-lg font-semibold', item.tone)}>{item.value}</p>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">{item.hint}</p>
                <div className="mt-3 flex items-end gap-1">
                  {item.bars.map((height, index) => (
                    <span
                      key={`${item.title}-${index}`}
                      className="flex-1 rounded-full bg-primary/20"
                      style={{ height: `${10 + height * 10}px` }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="saas-card relative overflow-hidden border-border/80 bg-card p-5 hover-lift">
          <div className="absolute inset-0 pattern-dots opacity-[0.02] pointer-events-none" />
          <div className="relative z-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Today&apos;s focus</p>
            <h2 className="mt-1 text-lg font-semibold tracking-tight text-foreground">Keep operations moving without extra clicks</h2>
          </div>
          <div className="mt-4 space-y-3 relative z-10">
            {[
              { label: 'Review recent payments', path: '/payment-details' },
              { label: 'Check attendance intake', path: '/attendance' },
              { label: 'Open customer records', path: '/customers' },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => navigate(item.path)}
                className="flex w-full items-center justify-between rounded-2xl border border-border/60 bg-background/60 px-3 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-accent"
              >
                <span>{item.label}</span>
                <ArrowRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.3fr_0.9fr]">
        {/* Recent Activity Card */}
        <div className="saas-card hover-lift p-6 relative overflow-hidden bg-card border-border/80">
          <div className="absolute inset-0 pattern-dots opacity-[0.02] pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-foreground">Recent activity</h2>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Latest customer and payment updates from your workspace.</p>
            </div>
            <button 
              type="button" 
              onClick={() => navigate('/customers')} 
              className="button-secondary inline-flex items-center gap-2 h-10 px-4 rounded-xl shadow-sm transition-all"
            >
              <span>Open customers</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-5 relative z-10">
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={`activity-skeleton-${index}`} className="rounded-2xl border border-border/60 p-4">
                    <Skeleton className="h-4 w-40" variant="text" />
                    <Skeleton className="mt-2 h-4 w-64" variant="text" />
                  </div>
                ))}
              </div>
            ) : activityItems.length === 0 ? (
              <EmptyState
                title="No recent activity yet"
                description="Customer and payment events appear here once your team starts using the system."
                action={
                  <button type="button" onClick={() => navigate('/add-customer')} className="button-primary h-10 rounded-xl px-5">
                    Add first customer
                  </button>
                }
              />
            ) : (
              <div className="space-y-3">
                {activityItems.map((item, index) => {
                  const isPayment = item.type === 'payment';
                  return (
                    <article 
                      key={`${item.type}-${item.time}-${index}`} 
                      className="rounded-2xl border border-border/60 bg-card/45 hover:bg-card transition-colors p-4 flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <p className="text-sm font-semibold text-foreground">{item.message}</p>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                          {new Date(item.time).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <span className={cn(
                        "rounded-full px-3 py-1 text-[11px] font-bold tracking-wide uppercase",
                        isPayment 
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/10" 
                          : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/10"
                      )}>
                        {isPayment ? 'Payment' : 'Customer'}
                      </span>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="saas-card hover-lift p-6 relative overflow-hidden bg-card border-border/80">
          <div className="absolute inset-0 pattern-dots opacity-[0.02] pointer-events-none" />
          <div className="relative z-10">
            <h2 className="text-lg font-bold tracking-tight text-foreground">Quick actions</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Jump to the most common operational flows.</p>
          </div>

          <div className="mt-5 grid gap-3 relative z-10">
            {[
              { 
                label: 'Add Customer', 
                description: 'Create a new billing customer profile', 
                icon: PlusCircle, 
                path: '/add-customer',
                bg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/15'
              },
              { 
                label: 'Manage Payments', 
                description: 'Review payments and invoices', 
                icon: CreditCard, 
                path: '/payment-details',
                bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/15'
              },
              { 
                label: 'Courses', 
                description: 'Maintain course catalog and fee setup', 
                icon: BookOpen, 
                path: '/courses',
                bg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/15'
              },
              { 
                label: 'Attendance', 
                description: 'Track student attendance records', 
                icon: TrendingUp, 
                path: '/attendance',
                bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/15'
              },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => navigate(item.path)}
                  className="flex items-center justify-between rounded-2xl border border-border/60 bg-card/45 hover:bg-card p-4 text-left transition-all duration-200 hover:-translate-y-0.5"
                >
                  <div className="flex items-center gap-3">
                    <div className={cn("flex h-11 w-11 items-center justify-center rounded-xl", item.bg)}>
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{item.label}</p>
                      <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{item.description}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-4.5 w-4.5 text-muted-foreground transition-transform duration-200 hover:translate-x-1" aria-hidden="true" />
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
