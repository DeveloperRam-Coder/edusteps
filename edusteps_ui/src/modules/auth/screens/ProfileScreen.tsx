import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail, Edit2, Check, X,
  Trash2, LogOut, ChevronRight, AlertCircle, Loader2, KeyRound,
  ShieldCheck, Sparkles, Bell, Languages,
  CreditCard, HelpCircle, Download, MonitorSmartphone, BadgeCheck,
  SunMedium, MoonStar, Clock3, FileText,
} from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useNotification } from '@/core/components/NotificationProvider';
import { Button } from '@/ui/primitives/shadcn';
import { updateProfileApi, deleteProfileApi, uploadAvatarApi, changePasswordApi } from '../api/auth';
import { updateClientApi } from '../api/client';
import DeleteAccountModal from '../components/DeleteAccountModal';
import LogoutModal from '../../../components/LogoutModal/LogoutModal';
import { resolveApiAssetUrl } from '@/core/api/client';
import { Skeleton } from '@/components';
import { getPreferencesApi, updatePreferencesApi, ProfilePreferences } from '@/modules/profile/api/profile';
import { useTheme } from '@/core/theme/ThemeContext';
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle,
} from '@/ui/primitives/shadcn';

function formatDate(d?: string) {
  if (!d) return '—';
  return new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(d));
}

function FieldRow({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</label>
      {children}
      {helper && <p className="text-xs text-muted-foreground/70">{helper}</p>}
    </div>
  );
}

function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: 'positive' | 'neutral' | 'warning' }) {
  const toneClasses = {
    positive: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300',
    neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300',
  };

  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${toneClasses[tone]}`}>{label}</span>;
}

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { user, logout, refreshUser, businessDetails, checkBusinessDetails } = useAuth();
  const notification = useNotification();

  const [pageLoading, setPageLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [avatarTs, setAvatarTs] = useState(() => Date.now()); // cache-buster for avatar img
  const [formData, setFormData] = useState({ name: '', email: '', mobile: '' });
  const [businessFormData, setBusinessFormData] = useState({ name: '', phone: '', email: '', address: '' });
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [isEditingBusiness, setIsEditingBusiness] = useState(false);
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const { setTheme: setAppTheme } = useTheme();
  const [preferences, setPreferences] = useState<ProfilePreferences>({
    theme: 'system', language: 'en', emailNotifications: true, smsReminders: true, marketingEmails: false,
  });
  const [, setPrefsLoading] = useState(true);
  const [, setPrefsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({ name: user.name || '', email: user.email || '', mobile: user.mobile || '' });
      setPageLoading(false);
    }
    if (businessDetails) {
      setBusinessFormData({
        name: businessDetails.name || '',
        phone: businessDetails.phone || '',
        email: businessDetails.email || '',
        address: businessDetails.address || '',
      });
    }
  }, [user, businessDetails]);

  // Load preferences from backend on mount
  useEffect(() => {
    if (!user) return;
    getPreferencesApi()
      .then(res => {
        setPreferences(res.data);
        setAppTheme(res.data.theme as any);
      })
      .catch(() => {/* use defaults */})
      .finally(() => setPrefsLoading(false));
  }, [user, setAppTheme]);

  const handlePrefChange = useCallback(async (patch: Partial<ProfilePreferences>) => {
    const next = { ...preferences, ...patch };
    setPreferences(next);
    if (patch.theme) setAppTheme(patch.theme as any);
    setPrefsSaving(true);
    try {
      const res = await updatePreferencesApi(patch);
      setPreferences(res.data);
    } catch (err) {
      notification?.toast('Failed to save preference', 'error');
      setPreferences(preferences);
    } finally {
      setPrefsSaving(false);
    }
  }, [preferences, setAppTheme, notification]);

  const handleUpdateProfile = async () => {
    if (!formData.name.trim() || !formData.email.trim()) {
      notification?.toast('Name and email are required', 'error'); return;
    }
    if (!user?.id) {
      notification?.toast('User profile is not ready yet', 'error'); return;
    }
    setIsLoading(true);
    try {
      await updateProfileApi(user.id, {
        name: formData.name.trim(),
        email: formData.email.trim(),
        mobile: formData.mobile.trim(),
      });
      await refreshUser();
      notification?.toast('Profile updated successfully', 'success');
      setIsEditing(false);
    } catch (e: any) {
      notification?.toast(e?.response?.data?.message || 'Failed to update profile', 'error');
    } finally { setIsLoading(false); }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      await deleteProfileApi(user?.id || '');
      notification?.toast('Account deleted successfully', 'success');
      await logout(); navigate('/login');
    } catch (e: any) {
      notification?.toast(e?.response?.data?.message || 'Failed to delete account', 'error');
    } finally { setIsLoading(false); setShowDeleteModal(false); }
  };

  const handleUpdateBusiness = async () => {
    if (!businessFormData.name.trim()) {
      notification?.toast('Business name is required', 'error');
      return;
    }
    if (!businessDetails?.client_id) {
      notification?.toast('No business profile found', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await updateClientApi(businessDetails.client_id, {
        name: businessFormData.name.trim(),
        phone: businessFormData.phone.trim(),
        email: businessFormData.email.trim(),
        address: businessFormData.address.trim(),
      });
      await checkBusinessDetails();
      notification?.toast('Business details updated', 'success');
      setIsEditingBusiness(false);
    } catch (e: any) {
      notification?.toast(e?.response?.data?.message || 'Failed to update business details', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const username = useMemo(() => {
    if (user?.email) return user.email.split('@')[0].replace(/[^a-zA-Z0-9]+/g, '.').toLowerCase();
    return 'account-owner';
  }, [user?.email]);

  const profileCompletion = useMemo(() => {
    const checks = [Boolean(user?.name), Boolean(user?.email), Boolean(user?.mobile), Boolean(businessDetails?.name), Boolean(user?.avatar)];
    const completed = checks.filter(Boolean).length;
    return Math.round((completed / checks.length) * 100);
  }, [businessDetails?.name, user?.avatar, user?.email, user?.mobile, user?.name]);

  const planLabel = businessDetails?.requires_master_config ? 'Enterprise' : 'Standard';
  const securityHighlights = [
    { label: 'Password', value: 'Protected', detail: 'Change your sign-in password anytime' },
    { label: 'Avatar', value: user?.avatar ? 'Uploaded' : 'Pending', detail: user?.avatar ? 'Profile photo is active' : 'Add a photo to strengthen recognition' },
    { label: 'Business profile', value: businessDetails?.name ? 'Ready' : 'Pending', detail: businessDetails?.name ? 'Your workspace details are saved' : 'Add business details to unlock full setup' },
  ];

  if (pageLoading) {
    return (
      <div className="content-sequence space-y-5 animate-in fade-in duration-500">
        <div className="saas-card p-6">
          <div className="flex items-center gap-5">
            <Skeleton className="h-16 w-16 rounded-xl" />
            <div className="space-y-2 flex-1">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-56" variant="text" />
              <div className="flex gap-2 pt-1"><Skeleton className="h-8 w-24 rounded-lg" /><Skeleton className="h-8 w-20 rounded-lg" /></div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {[0, 1].map(i => (
            <div key={i} className="saas-card p-6 space-y-4">
              <Skeleton className="h-4 w-36" />
              {[0, 1, 2].map(j => <div key={j} className="space-y-1.5"><Skeleton className="h-3 w-20" variant="text" /><Skeleton className="h-9 w-full rounded-lg" /></div>)}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="content-sequence space-y-5 animate-in fade-in duration-500">
      <div className="saas-card relative overflow-hidden border-border/80 bg-card p-4 sm:p-6 shadow-sm hover-lift">
        <div className="absolute inset-0 pattern-grid opacity-[0.08] pointer-events-none" />
        <div className="relative z-10 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative shrink-0">
              <div className="aspect-square w-24 overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-blue-600 shadow-lg sm:w-24">
                {user?.avatar ? (
                  <img
                    key={avatarTs}
                    src={`${resolveApiAssetUrl(user.avatar)}?t=${avatarTs}`}
                    alt="Profile avatar"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-white">{initials}</span>
                )}
                <label className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-3xl bg-black/50 opacity-0 transition-opacity hover:opacity-100 focus-within:opacity-100">
                  <input
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp"
                    onClick={(e) => { (e.target as HTMLInputElement).value = '' }}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) {
                        notification?.toast('Image must be under 5 MB', 'error');
                        return;
                      }
                      try {
                        setIsLoading(true);
                        await uploadAvatarApi(file);
                        await refreshUser();
                        setAvatarTs(Date.now());
                        notification?.toast('Avatar updated successfully', 'success');
                      } catch (err: any) {
                        notification?.toast(err?.response?.data?.message || 'Failed to upload avatar', 'error');
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                  />
                  {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-white" /> : <><Edit2 className="h-4 w-4 text-white" /><span className="text-[10px] font-semibold text-white">Change</span></>}
                </label>
              </div>
              <div className="pointer-events-none absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-card bg-primary shadow">
                <Edit2 className="h-3 w-3 text-primary-foreground" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">{user?.name || 'Your profile'}</h1>
                <StatusBadge label="Verified" tone="positive" />
                <StatusBadge label="Security ready" tone="neutral" />
              </div>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{user?.role || 'Business owner'} • {businessDetails?.name || 'No business profile yet'}</p>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />{user?.email || 'Email pending'}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(!isEditing)}
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 hover:opacity-90"
                >
                  {isEditing ? <><X className="h-3.5 w-3.5" />Cancel</> : <><Edit2 className="h-3.5 w-3.5" />Edit profile</>}
                </button>
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-3.5 py-2 text-sm font-semibold text-foreground hover:bg-accent"
                >
                  <KeyRound className="h-3.5 w-3.5" />Change password
                </button>
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300"
                >
                  <LogOut className="h-3.5 w-3.5" />Logout
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-background/80 p-4 sm:min-w-[220px]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Profile health</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{profileCompletion}%</p>
              </div>
              <div className="rounded-2xl bg-primary/10 p-2 text-primary">
                <Sparkles className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3 h-2 rounded-full bg-muted">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${profileCompletion}%` }} />
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{profileCompletion >= 85 ? 'Almost complete — your account is ready for advanced security.' : 'Add a few details to unlock richer controls and billing insights.'}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="saas-card border-border/80 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Account</p>
            <BadgeCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="mt-3 text-2xl font-semibold text-foreground">{user?.email ? 'Verified' : 'Pending'}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Primary email access</p>
        </div>
        <div className="saas-card border-border/80 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Role</p>
            <MonitorSmartphone className="h-4 w-4 text-blue-600" />
          </div>
          <p className="mt-3 text-2xl font-semibold text-foreground capitalize">{user?.role || 'Owner'}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Account permission level</p>
        </div>
        <div className="saas-card border-border/80 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Plan</p>
            <ShieldCheck className="h-4 w-4 text-violet-600" />
          </div>
          <p className="mt-3 text-2xl font-semibold text-foreground">{planLabel}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{businessDetails?.requires_master_config ? 'Structured course mode' : 'Manual entry mode'}</p>
        </div>
        <div className="saas-card border-border/80 bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Member since</p>
            <Clock3 className="h-4 w-4 text-amber-600" />
          </div>
          <p className="mt-3 text-2xl font-semibold text-foreground">{formatDate(user?.created_at)}</p>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">You are in good standing</p>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <div className="saas-card border-border/80 bg-card p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Account information</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Core identity and contact details.</p>
              </div>
              <button type="button" onClick={() => setIsEditing(!isEditing)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent">{isEditing ? 'Cancel edit' : 'Edit'}</button>
            </div>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              <FieldRow label="Full name" helper="Shown across the platform">
                {isEditing ? <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /> : <p className="text-sm font-medium text-foreground">{user?.name || 'Not provided'}</p>}
              </FieldRow>
              <FieldRow label="Username" helper="Used for quick mentions and links">
                <p className="text-sm font-medium text-foreground">@{username}</p>
              </FieldRow>
              <FieldRow label="Email" helper="Sign-in and alert delivery">
                {isEditing ? <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /> : <p className="text-sm font-medium text-foreground">{user?.email || 'Not provided'}</p>}
              </FieldRow>
              <FieldRow label="Phone" helper="Support and SMS updates">
                {isEditing ? <input type="text" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /> : <p className="text-sm font-medium text-foreground">{user?.mobile || 'Not provided'}</p>}
              </FieldRow>
              <FieldRow label="Role" helper="Permission context">
                <p className="text-sm font-medium text-foreground">{user?.role || 'Business owner'}</p>
              </FieldRow>
              <FieldRow label="Member since" helper="Account age and seniority">
                <p className="text-sm font-medium text-foreground">{formatDate(user?.created_at)}</p>
              </FieldRow>
            </div>
            <div className="mt-5 rounded-2xl border border-border/70 bg-background/60 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-foreground">About</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Add a short bio so your team recognizes your role faster.</p>
                </div>
                <button type="button" onClick={() => setIsEditing(true)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent">Edit profile</button>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">No bio added yet.</p>
            </div>
            {isEditing && (
              <div className="mt-5 flex justify-end border-t border-border pt-4">
                <Button onClick={handleUpdateProfile} disabled={isLoading} className="h-9 rounded-lg px-6 text-sm">{isLoading ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Saving…</> : <><Check className="mr-1.5 h-3.5 w-3.5" />Save profile</>}</Button>
              </div>
            )}
          </div>

          <div className="saas-card border-border/80 bg-card p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Security center</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Protect the account with layered controls and visibility.</p>
              </div>
              <StatusBadge label="Recommended" tone="warning" />
            </div>
            <div className="mt-5 space-y-3">
              {securityHighlights.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/60 px-3 py-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-sm text-muted-foreground">{item.detail}</p>
                  </div>
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="saas-card border-border/80 bg-card p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Business & billing</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Plan health, payments, and billing context.</p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge label="Pro" tone="positive" />
                <button type="button" onClick={() => setIsEditingBusiness((value) => !value)} className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent">
                  {isEditingBusiness ? 'Cancel' : 'Edit'}
                </button>
              </div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-2xl border border-border/70 bg-background/60 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><CreditCard className="h-4 w-4 text-primary" />Plan</div>
                <p className="mt-2 text-sm text-muted-foreground">{planLabel} workspace • Linked to your business profile</p>
              </div>
              <div className="rounded-2xl border border-border/70 bg-background/60 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground"><Download className="h-4 w-4 text-primary" />Workspace data</div>
                <p className="mt-2 text-sm text-muted-foreground">Syncs with your attendance, customer, and course records</p>
              </div>
            </div>
            {isEditingBusiness ? (
              <div className="mt-4 space-y-3 rounded-2xl border border-border/70 bg-background/60 p-4">
                <FieldRow label="Business name" helper="Appears in invoices and workspace contexts">
                  <input type="text" value={businessFormData.name} onChange={(e) => setBusinessFormData({ ...businessFormData, name: e.target.value })} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </FieldRow>
                <FieldRow label="Phone" helper="Primary contact number">
                  <input type="text" value={businessFormData.phone} onChange={(e) => setBusinessFormData({ ...businessFormData, phone: e.target.value })} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </FieldRow>
                <FieldRow label="Email" helper="Operational contact address">
                  <input type="email" value={businessFormData.email} onChange={(e) => setBusinessFormData({ ...businessFormData, email: e.target.value })} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </FieldRow>
                <FieldRow label="Address" helper="Physical or registered address">
                  <input type="text" value={businessFormData.address} onChange={(e) => setBusinessFormData({ ...businessFormData, address: e.target.value })} className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
                </FieldRow>
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-border/70 bg-background/60 p-4">
                <p className="text-sm font-semibold text-foreground">Business profile</p>
                <p className="mt-2 text-sm text-muted-foreground">{businessDetails?.name || 'No business profile added yet.'}</p>
                <p className="mt-2 text-sm text-muted-foreground">{businessDetails?.email || 'Add a contact email to keep billing and support notices current.'}</p>
              </div>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={() => navigate('/payment-details')} className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent">Payment details</button>
              <button type="button" onClick={() => navigate('/courses')} className="rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground hover:bg-accent">Manage courses</button>
              {isEditingBusiness && (
                <Button onClick={handleUpdateBusiness} disabled={isLoading} className="h-9 rounded-lg px-5 text-sm">
                  {isLoading ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Saving…</> : <><Check className="mr-1.5 h-3.5 w-3.5" />Save business</>}
                </Button>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="saas-card border-border/80 bg-card p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Preferences</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Control how the workspace feels and behaves.</p>
              </div>
              <StatusBadge label="Adaptive" tone="neutral" />
            </div>
            <div className="mt-5 space-y-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Theme</span>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-2">
                  {preferences.theme === 'dark' ? <MoonStar className="h-4 w-4 text-primary" /> : <SunMedium className="h-4 w-4 text-primary" />}
                  <select value={preferences.theme} onChange={(e) => handlePrefChange({ theme: e.target.value as 'light' | 'dark' | 'system' })} className="w-full bg-transparent text-sm outline-none">
                    <option value="system">System</option>
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Language</span>
                <div className="flex items-center gap-2 rounded-xl border border-border bg-background p-2">
                  <Languages className="h-4 w-4 text-primary" />
                  <select value={preferences.language} onChange={(e) => handlePrefChange({ language: e.target.value })} className="w-full bg-transparent text-sm outline-none">
                    <option value="en">English</option>
                    <option value="hi">Hindi</option>
                    <option value="mr">Marathi</option>
                  </select>
                </div>
              </label>
              <div className="space-y-2 rounded-2xl border border-border/70 bg-background/60 p-3">
                {[
                  { key: 'emailNotifications', label: 'Email notifications', description: 'Product, account, and billing updates' },
                  { key: 'smsReminders', label: 'SMS reminders', description: 'Attendance and payment alerts' },
                  { key: 'marketingEmails', label: 'Marketing emails', description: 'New feature and learning content' },
                ].map((item) => (
                  <label key={item.key} className="flex items-start justify-between gap-3 rounded-xl border border-transparent px-2 py-2 hover:border-border/70">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                    <input type="checkbox" checked={preferences[item.key as keyof typeof preferences] as boolean} onChange={() => handlePrefChange({ [item.key]: !preferences[item.key as keyof typeof preferences] })} className="mt-1 h-4 w-4 rounded border-border text-primary focus:ring-primary" />
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="saas-card border-border/80 bg-card p-4 shadow-sm sm:p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Support & legal</h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Get help, share feedback, and review policies.</p>
              </div>
              <HelpCircle className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-5 space-y-2">
              {[
                { label: 'Help center', icon: HelpCircle, action: () => window.open('https://support.example.com', '_blank', 'noopener,noreferrer') },
                { label: 'Contact support', icon: Bell, action: () => notification?.toast('Support will contact you shortly', 'success') },
                { label: 'Privacy policy', icon: ShieldCheck, action: () => navigate('/privacy') },
                { label: 'Terms of service', icon: FileText, action: () => navigate('/terms') },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.label} type="button" onClick={item.action} className="flex w-full items-center justify-between rounded-2xl border border-border/70 bg-background/60 px-3 py-3 text-left text-sm font-semibold text-foreground hover:bg-accent">
                    <span className="flex items-center gap-2"><Icon className="h-4 w-4" />{item.label}</span>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="saas-card border-red-200 bg-card p-4 shadow-sm dark:border-red-900/50 sm:p-5">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <h2 className="text-lg font-semibold text-red-700 dark:text-red-400">Danger zone</h2>
            </div>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">This permanently removes your workspace access and account data.</p>
            <button type="button" onClick={() => setShowDeleteModal(true)} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2 text-sm font-semibold text-red-700 hover:bg-red-100 dark:border-red-900 dark:bg-red-950/20 dark:text-red-300">
              <Trash2 className="h-4 w-4" />Delete account
            </button>
          </div>
        </div>
      </div>

      <Dialog open={showPasswordModal} onOpenChange={setShowPasswordModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Enter your current password and choose a new one.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {(['oldPassword', 'newPassword', 'confirmPassword'] as const).map((field, i) => (
              <div key={field} className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{['Current Password', 'New Password', 'Confirm New Password'][i]}</label>
                <input type="password" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" value={passwordData[field]} onChange={(e) => setPasswordData({ ...passwordData, [field]: e.target.value })} />
                {field === 'newPassword' && <p className="text-xs text-muted-foreground/70">Use at least 8 characters with a mix of letters and numbers</p>}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button onClick={async () => {
              if (passwordData.newPassword !== passwordData.confirmPassword) {
                notification?.toast('Passwords do not match', 'error');
                return;
              }
              try {
                setIsLoading(true);
                await changePasswordApi({ oldPassword: passwordData.oldPassword, newPassword: passwordData.newPassword });
                notification?.toast('Password changed successfully', 'success');
                setShowPasswordModal(false);
                setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
              } catch (e: any) {
                notification?.toast(e?.response?.data?.message || 'Failed to change password', 'error');
              } finally {
                setIsLoading(false);
              }
            }} disabled={isLoading} className="w-full rounded-lg">{isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Updating…</> : 'Update Password'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LogoutModal isOpen={showLogoutModal} onConfirm={async () => { setIsLoading(true); await logout(); navigate('/login'); }} onCancel={() => setShowLogoutModal(false)} isLoading={isLoading} />
      <DeleteAccountModal isOpen={showDeleteModal} onConfirm={handleDeleteAccount} onCancel={() => setShowDeleteModal(false)} isLoading={isLoading} />
    </div>
  );
}
