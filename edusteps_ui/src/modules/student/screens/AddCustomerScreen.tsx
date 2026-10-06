import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle2, Info, UserPlus } from 'lucide-react';
import { useAuth } from '@/auth/AuthContext';
import { useNotification } from '@/core/components/NotificationProvider';
import { createCustomerApi } from '@/modules/auth/api/customer';
import { createCustomerDetailsApi, type CreateCustomerDetailPayload } from '@/modules/auth/api/customerDetails';
import { getCoursesByClientIdApi } from '@/modules/auth/api/course';
import { cn, formatCurrency } from '@/lib/utils';
import { getTodayDateInputValue } from '@/lib/dateUtils';
import { validateCustomer, sanitizeCustomerData } from '@/core/utils/validation';

interface CourseOption {
  course_id?: string | number;
  course_name?: string;
  courseName?: string;
  rate?: number | string;
  rate_type?: string;
}

interface CustomerForm {
  firstName: string;
  lastName: string;
  mobile: string;
  email: string;
  address: string;
}

interface EnrollmentForm {
  first_name: string;
  last_name: string;
  subject: string;
  registration_date: string;
  amount: number;
  is_active: boolean;
}

interface FeeBreakdown {
  fullMonthlyRate: number;
  rateType: string;
  admitDate: string;
  daysRemaining: number;
  daysInMonth: number;
  proratedAmount: number;
  isProrated: boolean;
}

const emptyCustomer: CustomerForm = {
  firstName: '',
  lastName: '',
  mobile: '',
  email: '',
  address: '',
};

const emptyEnrollment: EnrollmentForm = {
  first_name: '',
  last_name: '',
  subject: '',
  registration_date: getTodayDateInputValue(),
  amount: 0,
  is_active: true,
};

function FieldLabel({ children, optional }: { children: React.ReactNode; optional?: boolean }) {
  return (
    <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
      {children}
      {optional && <span className="ml-1 normal-case tracking-normal text-muted-foreground/60">(optional)</span>}
    </span>
  );
}

function calculateProratedFee(courseRate: number, rateType: string, admitDateStr: string): FeeBreakdown {
  const admit = new Date(admitDateStr);
  const dayOfMonth = admit.getDate();
  const daysInMonth = new Date(admit.getFullYear(), admit.getMonth() + 1, 0).getDate();
  const daysRemaining = daysInMonth - dayOfMonth + 1;
  const isProrated = rateType === 'per_month' && dayOfMonth > 1;
  const proratedAmount = isProrated
    ? Math.round((courseRate * daysRemaining) / daysInMonth * 100) / 100
    : courseRate;

  return {
    fullMonthlyRate: courseRate,
    rateType,
    admitDate: admitDateStr,
    daysRemaining,
    daysInMonth,
    proratedAmount,
    isProrated,
  };
}

function FeeBreakdownPanel({ breakdown }: { breakdown: FeeBreakdown | null }) {
  if (!breakdown) return null;

  return (
    <div className="rounded-lg border border-amber-100 bg-amber-50/80 px-4 py-3 dark:border-amber-900/40 dark:bg-amber-950/25">
      <div className="flex items-start gap-2">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
        <div className="space-y-1 text-sm">
          <p className="font-semibold text-amber-800 dark:text-amber-300">Prorated fee calculated</p>
          <p className="text-amber-700 dark:text-amber-400">
            Admission on <strong>{breakdown.admitDate}</strong> — day {breakdown.daysInMonth - breakdown.daysRemaining + 1} of {breakdown.daysInMonth}.
          </p>
          <div className="grid grid-cols-3 gap-x-4 gap-y-0.5 text-xs text-amber-700 dark:text-amber-400 pt-1">
            <span>Full monthly rate</span>
            <span>Days remaining</span>
            <span>Amount due</span>
            <span className="font-semibold">{formatCurrency(breakdown.fullMonthlyRate)}</span>
            <span className="font-semibold">{breakdown.daysRemaining} / {breakdown.daysInMonth}</span>
            <span className="font-semibold text-amber-900 dark:text-amber-200">{formatCurrency(breakdown.proratedAmount)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AddCustomerScreen() {
  const navigate = useNavigate();
  const notification = useNotification();
  const { businessDetails } = useAuth();
  const isMasterMode = businessDetails?.requires_master_config ?? false;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [createdCustomerId, setCreatedCustomerId] = useState<string | null>(null);
  const [customer, setCustomer] = useState<CustomerForm>(emptyCustomer);
  const [enrollment, setEnrollment] = useState<EnrollmentForm>(emptyEnrollment);

  useEffect(() => {
    if (!businessDetails?.client_id) return;

    const loadCourses = async () => {
      try {
        const response = await getCoursesByClientIdApi(businessDetails.client_id);
        setCourses(Array.isArray(response.data) ? (response.data as CourseOption[]) : []);
      } catch {
        setCourses([]);
      }
    };

    void loadCourses();
  }, [businessDetails?.client_id]);

  const subjectOptions = useMemo(() => {
    return courses.map((course) => course.course_name || course.courseName || '').filter(Boolean);
  }, [courses]);

  const selectedCourse = useMemo(
    () => courses.find((course) => (course.course_name || course.courseName) === enrollment.subject),
    [courses, enrollment.subject],
  );

  const feeBreakdown = useMemo<FeeBreakdown | null>(() => {
    if (!selectedCourse || !enrollment.registration_date) return null;
    const rate = Number(selectedCourse.rate ?? 0);
    if (!rate) return null;
    return calculateProratedFee(rate, selectedCourse.rate_type ?? 'per_month', enrollment.registration_date);
  }, [selectedCourse, enrollment.registration_date]);

  useEffect(() => {
    if (!isMasterMode) return;

    const nextAmount =
      !selectedCourse || !enrollment.registration_date
        ? 0
        : feeBreakdown?.proratedAmount ?? Number(selectedCourse.rate ?? 0) ?? 0;

    setEnrollment((current) => (
      current.amount === nextAmount ? current : { ...current, amount: nextAmount }
    ));
  }, [isMasterMode, selectedCourse, enrollment.registration_date, feeBreakdown]);

  const updateCustomer = (key: keyof CustomerForm, value: string) => {
    setCustomer((current) => ({ ...current, [key]: value }));
  };

  const updateEnrollment = (key: keyof EnrollmentForm, value: string | number | boolean) => {
    setEnrollment((current) => ({ ...current, [key]: value }));
  };

  const validateCustomerForm = () => {
    const validation = validateCustomer({
      firstName: customer.firstName,
      lastName: customer.lastName,
      mobile: customer.mobile,
      email: customer.email,
      address: customer.address,
    });

    if (!validation.isValid) {
      // Show first error
      const firstError = Object.values(validation.errors)[0];
      notification.toast(firstError, 'error');
      return false;
    }
    return true;
  };

  const validateEnrollment = () => {
    if (!enrollment.first_name.trim()) {
      notification.toast('Student first name is required', 'error');
      return false;
    }
    if (!enrollment.subject.trim()) {
      notification.toast('Course subject is required', 'error');
      return false;
    }
    if (enrollment.amount <= 0) {
      notification.toast('Valid amount is required', 'error');
      return false;
    }
    return true;
  };

  const handleCreateCustomer = async (event: FormEvent) => {
    event.preventDefault();
    if (!businessDetails?.client_id || !validateCustomerForm()) return;

    setLoading(true);
    try {
      const sanitizedData = sanitizeCustomerData({
        firstName: customer.firstName,
        lastName: customer.lastName,
        mobile: customer.mobile,
        email: customer.email,
        address: customer.address,
      });

      const response = await createCustomerApi({
        clientId: businessDetails.client_id,
        firstName: sanitizedData.firstName,
        lastName: sanitizedData.lastName,
        mobile: sanitizedData.mobile,
        email: sanitizedData.email,
        address: sanitizedData.address,
      });

      const data = response.data as any;
      const id = String(data?.customer_id ?? data?.id ?? '');
      if (!id) {
        notification.toast('Customer created, but profile ID was not returned', 'warning');
        navigate('/customers');
        return;
      }

      setCreatedCustomerId(id);
      notification.toast('Customer created', 'success');
      setStep(2);
    } catch (error: any) {
      notification.toast(error?.response?.data?.message || error?.message || 'Unable to create customer', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEnrollment = async (event: FormEvent) => {
    event.preventDefault();
    if (!createdCustomerId || !validateEnrollment()) return;

    setLoading(true);
    try {
      const payload: CreateCustomerDetailPayload = {
        customer_id: createdCustomerId,
        first_name: enrollment.first_name.trim(),
        last_name: enrollment.last_name.trim(),
        subject: enrollment.subject.trim(),
        registration_date: enrollment.registration_date,
        amount: enrollment.amount,
        is_active: enrollment.is_active,
      };

      await createCustomerDetailsApi(payload);
      notification.toast('Student profile and enrollment created', 'success');
      setStep(3);
    } catch (error: any) {
      notification.toast(error?.response?.data?.message || error?.message || 'Unable to add enrollment', 'error');
    } finally {
      setLoading(false);
    }
  };

  const skipEnrollment = () => {
    navigate(createdCustomerId ? `/customers/${createdCustomerId}` : '/customers');
  };

  return (
    <div className="content-sequence space-y-5">
      <section className="saas-card p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/customers')}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title="Back to customers"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <div>
              <h1 className="text-xl font-semibold tracking-normal text-foreground">Add Customer</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Add customer contact information and optionally add the first student enrollment.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { id: 1, label: 'Customer', icon: UserPlus },
          { id: 2, label: 'Student', icon: BookOpen },
          { id: 3, label: 'Done', icon: CheckCircle2 },
        ].map((item) => {
          const Icon = item.icon;
          const active = step === item.id;
          const done = step > item.id;
          return (
            <div
              key={item.id}
              className={cn(
                'saas-card flex items-center gap-3 p-4',
                active && 'border-primary/40 bg-primary/5',
                done && 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/50 dark:bg-emerald-950/20',
              )}
            >
              <div className={cn('flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground', (active || done) && 'bg-primary text-primary-foreground')}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground">{item.label}</p>
                <p className="text-xs text-muted-foreground">Step {item.id}</p>
              </div>
            </div>
          );
        })}
      </section>

      {step === 1 && (
        <section className="saas-card p-5">
          <form onSubmit={handleCreateCustomer} className="space-y-6">
            <div>
              <h2 className="text-base font-semibold text-foreground">Customer contact</h2>
              <p className="mt-1 text-sm text-muted-foreground">Basic customer details for billing and communication.</p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="grid gap-2">
                <FieldLabel>First name</FieldLabel>
                <input className="input-modern rounded-lg" value={customer.firstName} onChange={(event) => updateCustomer('firstName', event.target.value)} required />
              </label>
              <label className="grid gap-2">
                <FieldLabel>Last name</FieldLabel>
                <input className="input-modern rounded-lg" value={customer.lastName} onChange={(event) => updateCustomer('lastName', event.target.value)} />
              </label>
              <label className="grid gap-2">
                <FieldLabel>Mobile</FieldLabel>
                <input
                  className="input-modern rounded-lg"
                  inputMode="numeric"
                  maxLength={10}
                  value={customer.mobile}
                  onChange={(event) => updateCustomer('mobile', event.target.value.replace(/\D/g, ''))}
                  required
                />
              </label>
              <label className="grid gap-2">
                <FieldLabel>Email <span className="text-xs text-muted-foreground">(optional)</span></FieldLabel>
                <input className="input-modern rounded-lg" type="email" value={customer.email} onChange={(event) => updateCustomer('email', event.target.value)} />
              </label>
              <label className="grid gap-2 md:col-span-2">
                <FieldLabel>Address</FieldLabel>
                <input className="input-modern rounded-lg" value={customer.address} onChange={(event) => updateCustomer('address', event.target.value)} />
              </label>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => navigate('/customers')}
                className="button-secondary w-full sm:w-auto"
              >
                Cancel
              </button>
              <button type="submit" disabled={loading} className="button-primary w-full sm:w-auto">
                {loading ? 'Saving...' : 'Create customer'}
              </button>
            </div>
          </form>
        </section>
      )}

      {step === 2 && (
        <section className="saas-card p-5">
          <div className="space-y-4">
            <div>
              <h2 className="text-base font-semibold text-foreground">Student Profile</h2>
              <p className="mt-1 text-sm text-muted-foreground">Create a dedicated student record linked to this parent.</p>
            </div>
            <form onSubmit={handleSaveEnrollment} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <FieldLabel>Student first name</FieldLabel>
                  <input className="input-modern rounded-lg" value={enrollment.first_name} onChange={(event) => updateEnrollment('first_name', event.target.value)} required />
                </label>
                <label className="grid gap-2">
                  <FieldLabel>Student last name</FieldLabel>
                  <input className="input-modern rounded-lg" value={enrollment.last_name} onChange={(event) => updateEnrollment('last_name', event.target.value)} />
                </label>
                <label className="grid gap-2">
                  <FieldLabel>Course</FieldLabel>
                  <select
                    className="input-modern rounded-lg"
                    value={enrollment.subject}
                    onChange={(event) => updateEnrollment('subject', event.target.value)}
                    required
                  >
                    <option value="">Select course</option>
                    {subjectOptions.map((subject) => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                </label>
                <label className="grid gap-2">
                  <FieldLabel>Admission date</FieldLabel>
                  <input
                    type="date"
                    className="input-modern rounded-lg"
                    value={enrollment.registration_date}
                    onChange={(event) => updateEnrollment('registration_date', event.target.value)}
                    required
                  />
                </label>
                {!isMasterMode && (
                  <label className="grid gap-2">
                    <FieldLabel>Amount</FieldLabel>
                    <input
                      type="number"
                      className="input-modern rounded-lg"
                      min={0}
                      step={0.01}
                      value={enrollment.amount}
                      onChange={(event) => updateEnrollment('amount', Number(event.target.value))}
                      required
                    />
                  </label>
                )}
                {isMasterMode && (
                  <label className="grid gap-2">
                    <FieldLabel>Course Amount (₹)</FieldLabel>
                    <input
                      type="text"
                      className="input-modern rounded-lg"
                      value={enrollment.amount ? formatCurrency(enrollment.amount) : ''}
                      readOnly
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Amount is automatically populated from the selected course
                    </p>
                  </label>
                )}
                <label className="grid gap-2">
                  <FieldLabel>Status</FieldLabel>
                  <select
                    className="input-modern rounded-lg"
                    value={enrollment.is_active ? 'active' : 'inactive'}
                    onChange={(event) => updateEnrollment('is_active', event.target.value === 'active')}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </label>
              </div>
              <FeeBreakdownPanel breakdown={feeBreakdown} />
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={skipEnrollment}
                  className="button-secondary w-full sm:w-auto"
                >
                  Skip enrollment
                </button>
                <button type="submit" disabled={loading} className="button-primary w-full sm:w-auto">
                  {loading ? 'Saving...' : 'Save enrollment'}
                </button>
              </div>
            </form>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="saas-card p-5">
          <div className="flex flex-col gap-4 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200">
              <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">Customer added successfully</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                The customer profile and student enrollment are saved. You can continue managing customers now.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button type="button" onClick={() => navigate('/customers')} className="button-secondary w-full sm:w-auto">
                Back to customers
              </button>
              {createdCustomerId ? (
                <button type="button" onClick={() => navigate(`/customers/${createdCustomerId}`)} className="button-primary w-full sm:w-auto">
                  View customer
                </button>
              ) : null}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
