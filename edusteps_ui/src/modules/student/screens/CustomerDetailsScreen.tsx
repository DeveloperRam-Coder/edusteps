import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useNotification } from '@/core/components/NotificationProvider';
import { Plus, Users, Edit, Trash2, Save, X, CreditCard, Download, BookOpen, CheckCircle2, Circle, Bell } from 'lucide-react';
import { Button, Tabs, TabsContent, TabsList, TabsTrigger, Card, Input } from '@/ui/primitives/shadcn';
import { formatDateForDisplay, getTodayDateInputValue, toDateInputValue } from '@/lib/dateUtils';
import { formatCurrency, getPaymentStatusAppearance } from '@/lib/utils';
import { CustomerContextHeader } from '@/modules/auth/components/CustomerContextHeader';
import PaymentModal from '@/modules/auth/components/PaymentModal';
import { useAuth } from '@/auth/AuthContext';
import { getCoursesByClientIdApi } from '@/modules/auth/api/course';
import { getCustomerDueSummaryApi } from '@/modules/auth/api/payment';
import { getAttendanceByCustomerApi, type AttendanceRecord } from '@/modules/attendance/api/attendance';
import { EmptyState, Skeleton } from '@/components';
import CreateReminderModal from '@/modules/fee-reminder/components/CreateReminderModal';
import { getCustomerByIdApi } from '@/modules/auth/api/customer';
import { getCustomerDetailsByCustomerIdApi, createCustomerDetailsApi, updateCustomerDetailsApi, deleteCustomerDetailsApi } from '@/modules/auth/api/customerDetails';

interface CustomerDetail {
  id: string | null;
  cd_id: string;
  first_name: string;
  last_name?: string;
  subject: string;
  registration_date: string;
  amount: number;
  is_active?: boolean;
  deactivate_date?: string;
  customer_id: number;
  created_at?: string;
}

import { generateInvoiceHTML, printInvoiceHTML, InvoiceData } from '@/modules/auth/utils/invoiceEngine';

function generateInvoicePDF(opts: {
  invoiceNo: string;
  studentName: string;
  subject: string;
  amount: number;
  date: string;
  businessName: string;
  customerName: string;
  mobile?: string;
}) {
  const invoiceData: InvoiceData = {
    invoiceNo: opts.invoiceNo,
    issueDate: opts.date,
    status: 'PAID',
    business: {
      name: opts.businessName || 'Edusteps Academy',
    },
    customer: {
      name: opts.customerName || 'Parent',
      mobile: opts.mobile,
    },
    student: {
      name: opts.studentName || 'Student',
      subject: opts.subject,
    },
    items: [
      {
        description: `Enrollment Fee — ${opts.subject}`,
        qty: 1,
        unitPrice: opts.amount,
        amount: opts.amount,
      }
    ],
    payment: {
      totalFee: opts.amount,
      amountPaid: opts.amount,
      balanceDue: 0,
      paymentMode: 'Online / Bank Transfer',
    }
  };

  const html = generateInvoiceHTML(invoiceData);
  printInvoiceHTML(html);
}

function ProgressTracker({ details }: { details: CustomerDetail[] }) {
  if (details.length === 0) return null;

  const activeCount = details.filter(d => d.is_active).length;
  const pct = Math.round((activeCount / details.length) * 100);
  const courseSteps = ['Enrolled', 'First Class', 'Mid-Course', 'Assessment', 'Completed'];
  const achievedStep = Math.min(Math.floor((pct / 100) * courseSteps.length), courseSteps.length - 1);

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-800/80 border border-blue-100 dark:border-gray-700 rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-4">
        <BookOpen className="w-5 h-5 text-primary" />
        <h3 className="font-bold text-gray-900 dark:text-gray-100">Course Progress Tracker</h3>
        <span className="ml-auto text-sm font-bold text-primary">{pct}% active</span>
      </div>
      <div className="w-full h-3 bg-white dark:bg-gray-700 rounded-full overflow-hidden mb-4 shadow-inner">
        <div className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700 ease-out" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex items-center justify-between">
        {courseSteps.map((step, i) => {
          const done = i <= achievedStep;
          return (
            <div key={step} className="flex flex-col items-center gap-1" style={{ flex: 1 }}>
              <div className={`transition-all duration-300 ${done ? 'text-primary scale-110' : 'text-gray-300 dark:text-gray-600'}`}>
                {done ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
              </div>
              <span className={`text-[10px] font-semibold text-center leading-tight ${done ? 'text-primary' : 'text-gray-400 dark:text-gray-500'}`}>{step}</span>
            </div>
          );
        })}
      </div>
      {details.length > 1 && (
        <div className="mt-4 space-y-2">
          {details.map(d => (
            <div key={d.cd_id} className="flex items-center gap-3">
              <span className="text-xs text-gray-600 dark:text-gray-400 w-28 truncate">{d.subject}</span>
              <div className="flex-1 h-1.5 bg-white dark:bg-gray-700 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${d.is_active ? 'bg-green-400' : 'bg-red-300'}`} style={{ width: d.is_active ? '100%' : '30%' }} />
              </div>
              <span className={`text-[10px] font-bold ${d.is_active ? 'text-green-600' : 'text-red-400'}`}>{d.is_active ? 'Active' : 'Inactive'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CustomerDetailsScreen() {
  const { id: customerId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const notification = useNotification();
  const { businessDetails } = useAuth();
  const isMasterMode = businessDetails?.requires_master_config ?? false;

  const [customer, setCustomer] = useState<any>(null);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showAddForm, setShowAddForm] = useState(false);
  const [paymentModal, setPaymentModal] = useState<{ isOpen: boolean; detail: CustomerDetail | null }>({ isOpen: false, detail: null });
  const [courses, setCourses] = useState<any[]>([]);
  const [reminderModal, setReminderModal] = useState<{ isOpen: boolean; detail: CustomerDetail | null }>({ isOpen: false, detail: null });
  const [customerDueSummary, setCustomerDueSummary] = useState<any>(null);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    subject: '',
    registration_date: getTodayDateInputValue(),
    amount: 0,
    is_active: true
  });

  const [editData, setEditData] = useState<CustomerDetail | null>(null);

  const loadData = async () => {
    if (!customerId || !businessDetails?.client_id) return;
    setLoading(true);
    try {
      const [customerRes, customerDetailsRes, coursesRes, dueRes, attendanceRes] = await Promise.all([
        getCustomerByIdApi(customerId),
        getCustomerDetailsByCustomerIdApi(customerId),
        getCoursesByClientIdApi(businessDetails.client_id),
        getCustomerDueSummaryApi(customerId),
        getAttendanceByCustomerApi(customerId, businessDetails.client_id)
      ]);

      setCustomer(customerRes.data || customerRes);
      setCustomerDetails(Array.isArray(customerDetailsRes.data) ? customerDetailsRes.data : []);
      setCourses(Array.isArray(coursesRes.data) ? coursesRes.data : []);
      setCustomerDueSummary(dueRes.data);
      setAttendanceRecords(attendanceRes || []);
    } catch (err) {
      console.error('Error loading data:', err);
      notification.toast('Failed to load customer details', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!customerId) {
      notification.toast('No customer selected', 'error');
      navigate('/customers');
      return;
    }
    loadData();
  }, [customerId, businessDetails?.client_id]);

  const handlePaymentSuccess = () => loadData();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCustomerDetailsApi({ ...formData, customer_id: Number(customerId) });
      notification.toast('Customer details created successfully', 'success');
      setShowAddForm(false);
      setFormData({ ...formData, first_name: '', last_name: '', subject: '', amount: 0, registration_date: getTodayDateInputValue(), is_active: true });
      loadData();
    } catch (error) {
      console.error('Error creating customer details:', error);
      notification.toast('Failed to create customer details', 'error');
    }
  };

  const handleUpdate = async () => {
    if (!editData) return;
    try {
      await updateCustomerDetailsApi(editData.cd_id, {
        first_name: editData.first_name,
        last_name: editData.last_name,
        subject: editData.subject,
        registration_date: toDateInputValue(editData.registration_date),
        amount: editData.amount,
        is_active: editData.is_active,
        customer_id: editData.customer_id
      });
      notification.toast('Customer details updated successfully', 'success');
      setEditing(null);
      setEditData(null);
      loadData();
    } catch (error) {
      console.error('Error updating customer details:', error);
      notification.toast('Failed to update customer details', 'error');
    }
  };

  const handleDelete = async (detail: CustomerDetail) => {
    const confirmed = await notification.confirm('Are you sure you want to delete this customer detail? This action cannot be undone.', 'Delete Customer Detail');
    if (!confirmed) return;

    setDeleting(String(detail.cd_id));
    try {
      await deleteCustomerDetailsApi(detail.cd_id);
      setCustomerDetails(prev => prev.filter(d => d.cd_id !== detail.cd_id));
      notification.toast('Customer detail deleted successfully', 'success');
    } catch (err) {
      console.error('Error deleting:', err);
      notification.toast('Failed to delete customer detail', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const handleDownloadInvoice = (detail: CustomerDetail) => {
    const firstName = customer?.first_name || customer?.firstName || '';
    const lastName = customer?.last_name || customer?.lastName || '';
    generateInvoicePDF({
      invoiceNo: `INV-${detail.cd_id}`,
      studentName: `${detail.first_name} ${detail.last_name || ''}`.trim(),
      subject: detail.subject,
      amount: detail.amount,
      date: formatDateForDisplay(detail.registration_date) || new Date().toLocaleDateString('en-IN'),
      businessName: businessDetails?.business_name || 'EduSteps Coaching',
      customerName: `${firstName} ${lastName}`.trim() || 'Student',
      mobile: customer?.mobile,
    });
  };

  const subjects = courses.map(c => c.course_name || c.courseName).filter(Boolean);

  const getCourseAmountBySubject = (subject: string) => {
    const selectedCourse = courses.find(c => (c.course_name || c.courseName) === subject);
    return selectedCourse ? Number(selectedCourse.rate ?? 0) || 0 : 0;
  };

  if (loading) {
    return (
      <div className="content-sequence min-h-screen animate-in fade-in duration-300">
        <div className="space-y-4">
          <div className="surface-elevated rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-2/5" />
                <Skeleton className="h-3 w-3/4" variant="text" />
              </div>
            </div>
          </div>
          <div className="surface-elevated rounded-2xl p-4 sm:p-5">
            <Skeleton className="h-4 w-48" />
            <div className="pt-6 grid gap-4 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-3/4" variant="text" />
                  <Skeleton className="h-5 w-full" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 text-lg mb-4">Customer not found</p>
          <Button onClick={() => navigate('/customers')}>Back to Customers</Button>
        </div>
      </div>
    );
  }

  const firstName = customer.firstName || customer.first_name || '';
  const lastName = customer.lastName || customer.last_name || '';
  const attendanceSummary = {
    total: attendanceRecords.length,
    present: attendanceRecords.filter(r => r.status === 'present').length,
    late: attendanceRecords.filter(r => r.status === 'late').length,
    absent: attendanceRecords.filter(r => r.status === 'absent').length,
  };
  const attendanceRate = attendanceSummary.total > 0 ? Math.round(((attendanceSummary.present + attendanceSummary.late) / attendanceSummary.total) * 100) : 0;

  return (
    <div className="content-sequence space-y-5 animate-in fade-in duration-500">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <button onClick={() => navigate('/customers')} className="hover:text-primary hover:underline">Customers</button>
        <span>/</span>
        <span className="font-semibold text-foreground">{firstName} {lastName}</span>
      </div>

      <CustomerContextHeader customer={customer} onBack={() => navigate('/customers')} onEdit={() => navigate(`/customers/${customerId}?edit=true`)} showMenu={true} businessName={businessDetails?.business_name} />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Student Details <span className="ml-1 text-[10px] bg-muted px-1.5 py-0.5 rounded-md">{customerDetails.length}</span></TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <ProgressTracker details={customerDetails} />

          {customerDueSummary && customerDueSummary.enrollments.length > 0 && (
            <div className="surface-elevated rounded-xl p-4 sm:p-5">
              <h3 className="text-base font-bold text-foreground mb-3">Customer Financial Summary</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Total Course Fees</p>
                  <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(customerDueSummary.totalFee)}</p>
                </div>
                <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">Total Paid</p>
                  <p className="text-xl font-bold text-green-700 dark:text-green-400">{formatCurrency(customerDueSummary.totalPaid)}</p>
                </div>
                <div className={`${customerDueSummary.totalDue > 0 ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800' : customerDueSummary.totalDue < 0 ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'} rounded-xl p-4`}>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1">{customerDueSummary.totalDue < 0 ? 'Customer Credit' : 'Total Outstanding'}</p>
                  <p className={`text-xl font-bold ${customerDueSummary.totalDue > 0 ? 'text-red-700 dark:text-red-400' : customerDueSummary.totalDue < 0 ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>{formatCurrency(Math.abs(customerDueSummary.totalDue))}</p>
                </div>
              </div>
              <h4 className="text-md font-semibold text-gray-800 dark:text-gray-200 mb-3">Enrollment Breakdown</h4>
              <div className="space-y-2">
                {customerDueSummary.enrollments.map((enrollment: any) => {
                  const detail = customerDetails.find(d => d.cd_id === enrollment.cd_id);
                  return (
                    <div key={enrollment.cd_id} className="bg-card border border-border rounded-lg p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-sm text-foreground">{detail ? `${detail.first_name} ${detail.last_name || ''}` : 'Student'} — {detail?.subject || 'Course'}</p>
                          <div className="mt-0.5 text-xs text-muted-foreground">Course Fee: {formatCurrency(enrollment.courseFee)} • Paid: {formatCurrency(enrollment.totalPaid)}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md border text-[10px] font-semibold ${getPaymentStatusAppearance(enrollment.status)}`}>{enrollment.status}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="surface-elevated rounded-xl p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Attendance & Pending Fees</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Snapshot of attendance consistency and outstanding balances for this linked profile.</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">Attendance Rate {attendanceRate}%</span>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-4">
              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Present</p>
                <p className="mt-2 text-2xl font-bold text-green-600 dark:text-green-400">{attendanceSummary.present}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Late</p>
                <p className="mt-2 text-2xl font-bold text-amber-600 dark:text-amber-400">{attendanceSummary.late}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Absent</p>
                <p className="mt-2 text-2xl font-bold text-red-600 dark:text-red-400">{attendanceSummary.absent}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Outstanding</p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(customerDueSummary?.totalDue || 0)}</p>
              </div>
            </div>
            <div className="mt-5 space-y-3">
              {attendanceRecords.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">No attendance history has been recorded for this profile yet.</div>
              ) : (
                attendanceRecords.slice(0, 6).map(record => (
                  <div key={record.attendance_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-gray-100">{record.course?.course_name || 'General Attendance'}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{formatDateForDisplay(record.date) || new Date(record.date).toLocaleDateString('en-IN')}</p>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${record.status === 'present' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : record.status === 'late' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>{record.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="surface-elevated space-y-3 rounded-xl p-4 sm:p-5">
            <div className="rounded-lg border border-primary/20 bg-primary/10 p-3">
              <p className="text-xs text-primary"><strong>{customerDetails.length}</strong> student enrollment{customerDetails.length !== 1 ? 's' : ''} linked to this customer</p>
            </div>
            <h3 className="text-base font-bold text-foreground">Customer Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Full Name</p><p className="font-semibold text-sm text-foreground">{`${firstName} ${lastName}`.trim() || '-'}</p></div>
              <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</p><p className="capitalize text-sm text-foreground">{customer.status || 'Active'}</p></div>
              <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Email</p><p className="text-sm text-foreground">{customer.email || '-'}</p></div>
              <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Mobile</p><p className="text-sm text-foreground">{customer.mobile || '-'}</p></div>
              <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Address</p><p className="text-sm text-foreground">{customer.address || '-'}</p></div>
              <div><p className="text-[10px] text-muted-foreground uppercase tracking-wider">Created</p><p className="text-sm text-foreground">{customer.created_at ? new Date(customer.created_at).toLocaleDateString('en-IN') : '-'}</p></div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground">Enrollments</h3>
            <Button size="sm" onClick={() => setShowAddForm(true)}><Plus className="w-3.5 h-3.5 mr-1.5" />Add Enrollment</Button>
          </div>

          {showAddForm && (
            <Card className="surface-elevated rounded-xl p-4 sm:p-5">
              <h4 className="text-sm font-bold mb-3 text-foreground">New Enrollment</h4>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">First Name</label><Input value={formData.first_name} onChange={e => setFormData({ ...formData, first_name: e.target.value })} required /></div>
                  <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Last Name</label><Input value={formData.last_name} onChange={e => setFormData({ ...formData, last_name: e.target.value })} /></div>
                  <div>
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">{isMasterMode ? 'Course' : 'Class / Subject'}</label>
                    {isMasterMode ? (
                      <select value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value, amount: getCourseAmountBySubject(e.target.value) })} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" required>
                        <option value="">Select Course</option>
                        {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    ) : (
                      <input type="text" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100" placeholder="e.g. Mathematics" required />
                    )}
                  </div>
                  <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Registration Date</label><Input type="date" value={formData.registration_date} onChange={e => setFormData({ ...formData, registration_date: e.target.value })} required /></div>
                  {!isMasterMode && <div><label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Amount (₹)</label><Input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })} required /></div>}
                  {isMasterMode && (
                    <div>
                      <label className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300">Course Amount (₹)</label>
                      <Input type="text" value={formData.amount ? formatCurrency(formData.amount) : ''} readOnly />
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Amount is automatically populated from the selected course</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-6">
                    <input type="checkbox" id="is_active" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />
                    <label htmlFor="is_active" className="text-sm font-medium dark:text-gray-300">Active</label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button type="submit">Create Enrollment</Button>
                  <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
                </div>
              </form>
            </Card>
          )}

          {customerDetails.length === 0 ? (
            <div className="py-6">
              <EmptyState title="No enrollments yet" description="Add a student enrollment to start tracking progress and payments." action={<Button size="sm" onClick={() => setShowAddForm(true)} variant="default"><Plus className="mr-1.5 h-3.5 w-3.5" />Add First Enrollment</Button>} icon={<Users className="h-5 w-5" />} />
            </div>
          ) : (
            <div className="space-y-2.5">
              {customerDetails.map(detail => (
                <div key={detail.cd_id} className="bg-card border border-border rounded-xl p-4 shadow-sm">
                  {editing === detail.cd_id ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <Input value={editData?.first_name || ''} onChange={e => setEditData(p => p ? { ...p, first_name: e.target.value } : null)} placeholder="First Name" />
                        <Input value={editData?.last_name || ''} onChange={e => setEditData(p => p ? { ...p, last_name: e.target.value } : null)} placeholder="Last Name" />
                        <select value={editData?.subject || ''} onChange={e => setEditData(p => p ? { ...p, subject: e.target.value, ...(isMasterMode ? { amount: getCourseAmountBySubject(e.target.value) } : {}) } : null)} className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                          {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <Input type="date" value={editData?.registration_date || ''} onChange={e => setEditData(p => p ? { ...p, registration_date: e.target.value } : null)} />
                        {!isMasterMode ? <Input type="number" value={editData?.amount || 0} onChange={e => setEditData(p => p ? { ...p, amount: parseFloat(e.target.value) || 0 } : null)} /> : <Input type="number" value={editData?.amount || 0} readOnly className="bg-gray-100 dark:bg-gray-700 dark:border-gray-600 text-gray-900 dark:text-gray-100 opacity-80" />}
                        <div className="flex items-center gap-2">
                          <input type="checkbox" checked={editData?.is_active || false} onChange={e => setEditData(p => p ? { ...p, is_active: e.target.checked } : null)} />
                          <span className="text-sm dark:text-gray-300">Active</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={handleUpdate} className="flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-xl text-sm font-medium hover:bg-green-600 transition-colors"><Save className="w-4 h-4" />Save</button>
                        <button onClick={() => { setEditing(null); setEditData(null); }} className="flex items-center gap-1.5 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl text-sm font-medium hover:bg-gray-300 transition-colors"><X className="w-4 h-4" />Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-bold text-gray-900 dark:text-gray-100">{detail.first_name} {detail.last_name || ''}</p>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${detail.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'}`}>{detail.is_active ? 'Active' : 'Inactive'}</span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                          <span>📚 {detail.subject}</span>
                          <span>📅 {formatDateForDisplay(detail.registration_date) || '-'}</span>
                          <span className="text-green-600 dark:text-green-400 font-semibold">₹{detail.amount.toLocaleString()}</span>
                        </div>
                        <div className="mt-2 w-full max-w-xs">
                          <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${detail.is_active ? 'bg-green-400 w-full' : 'bg-red-300 w-1/3'}`} />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => handleDownloadInvoice(detail)} className="flex items-center gap-1.5 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl text-xs font-semibold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"><Download className="w-3.5 h-3.5" />Invoice</button>
                        <button onClick={() => setPaymentModal({ isOpen: true, detail })} className="flex items-center gap-1.5 px-3 py-2 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl text-xs font-semibold hover:bg-green-100 transition-colors"><CreditCard className="w-3.5 h-3.5" />Pay</button>
                        <button onClick={() => setReminderModal({ isOpen: true, detail })} className="flex items-center gap-1.5 px-3 py-2 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-xl text-xs font-semibold hover:bg-amber-100 transition-colors"><Bell className="w-3.5 h-3.5" />Remind</button>
                        <button onClick={() => { setEditData({ ...detail, registration_date: toDateInputValue(detail.registration_date) }); setEditing(detail.cd_id); }} className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 transition-colors"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(detail)} disabled={deleting === String(detail.cd_id)} className="p-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {paymentModal.isOpen && paymentModal.detail && (
        <PaymentModal isOpen={paymentModal.isOpen} onClose={() => setPaymentModal({ isOpen: false, detail: null })} customerDetail={{ cd_id: paymentModal.detail.cd_id, customer_id: paymentModal.detail.customer_id.toString(), first_name: paymentModal.detail.first_name, last_name: paymentModal.detail.last_name, subject: paymentModal.detail.subject, amount: paymentModal.detail.amount }} onSuccess={handlePaymentSuccess} />
      )}

      {reminderModal.isOpen && reminderModal.detail && (
        <CreateReminderModal isOpen={reminderModal.isOpen} onClose={() => setReminderModal({ isOpen: false, detail: null })} onSuccess={() => { notification.toast('Reminder created successfully', 'success'); setReminderModal({ isOpen: false, detail: null }); }} prefilledCustomerId={reminderModal.detail.customer_id} prefilledCdId={Number(reminderModal.detail.cd_id)} />
      )}
    </div>
  );
}