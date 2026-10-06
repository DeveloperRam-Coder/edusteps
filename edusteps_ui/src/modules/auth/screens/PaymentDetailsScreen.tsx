import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Line, LineChart, ResponsiveContainer, Tooltip } from 'recharts';
import ConfirmDialog from '../../../core/components/ConfirmDialog';
import { useAuth } from '@/auth/AuthContext';
import { useNotification } from '@/core/components/NotificationProvider';
import {
  createPaymentApi,
  createRazorpayOrderApi,
  deletePaymentApi,
  getPaymentQuickViewApi,
  getPaymentsByClientApi,
  getRevenueApi,
  updatePaymentApi,
  verifyRazorpayPaymentApi,
  type Payment,
  type PaymentQuickView,
  type Revenue,
} from '../api/payment';
import { searchCustomersApi } from '../api/customer';
import { getCustomerDetailsByCustomerIdApi } from '../api/customerDetails';
import { EmptyState, Skeleton } from '@/components';
import { ArrowUpRight, Download, Edit, Eye, Mail, MessageCircle, Trash2, X } from 'lucide-react';
import { formatCurrency, getPaymentModeLabel, normalizePaymentMode, PAYMENT_MODE_OPTIONS, type PaymentMode } from '@/lib/utils';
import { InvoiceModal } from '../../../components/invoice/InvoiceModal';
import { InvoiceData } from '../utils/invoiceEngine';

declare global { interface Window { Razorpay: any; } }

interface SearchResult { label: string; customer: any; detail: any; }
type DashboardStatusFilter = 'all' | 'SUCCESSFUL' | 'PENDING_OVERDUE' | 'REFUNDED';

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

const getStatusClasses = (status?: string) => {
  switch (status) {
    case 'SUCCESSFUL': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
    case 'PENDING_OVERDUE': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
    case 'REFUNDED': return 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300';
    default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }
};

const formatStatusLabel = (status?: string) => {
  switch (status) {
    case 'SUCCESSFUL': return 'Successful';
    case 'PENDING_OVERDUE': return 'Pending / Overdue';
    case 'REFUNDED': return 'Refunded';
    default: return 'Unknown';
  }
};

const formatDisplayDate = (value?: string | null) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function PaymentDetailsScreen() {
  const navigate = useNavigate();
  const { businessDetails } = useAuth();
  const notification = useNotification();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [paymentModeFilter, setPaymentModeFilter] = useState<'all' | PaymentMode>('all');
  const [statusFilter, setStatusFilter] = useState<DashboardStatusFilter>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 10;
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; id: string }>({ isOpen: false, id: '' });
  const [showQuickView, setShowQuickView] = useState(false);
  const [quickViewLoading, setQuickViewLoading] = useState(false);
  const [quickView, setQuickView] = useState<PaymentQuickView | null>(null);
  const [activePaymentId, setActivePaymentId] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [paymentMode, setPaymentMode] = useState<'online' | 'manual'>('manual');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customerSearchResults, setCustomerSearchResults] = useState<SearchResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<any>(null);
  const [selectedLabel, setSelectedLabel] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedInvoiceData, setSelectedInvoiceData] = useState<InvoiceData | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [paymentData, setPaymentData] = useState({
    customer_id: '',
    cd_id: '',
    paid_amount: 0,
    discount_amount: 0,
    payment_mode: 'CASH' as PaymentMode,
    transaction_ref: '',
  });

  const openInvoiceModal = (payment: Payment) => {
    const courseFee = payment.course_fee || payment.paid_amount || 0;
    const discount = payment.discount_amount || 0;
    const netAmount = Math.max(courseFee - discount, 0);
    const balanceDue = payment.enrollment_balance_due !== undefined
      ? payment.enrollment_balance_due
      : Math.max(courseFee - payment.paid_amount, 0);
    const totalPaid = payment.enrollment_total_paid !== undefined
      ? payment.enrollment_total_paid
      : payment.paid_amount;

    const invoiceData: InvoiceData = {
      invoiceNo: `INV-${String(payment.id).padStart(6, '0')}`,
      issueDate: payment.paid_on
        ? new Date(payment.paid_on).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: balanceDue <= 0 ? 'PAID' : totalPaid > 0 ? 'PARTIAL' : 'UNPAID',
      business: {
        name: businessDetails?.name || businessDetails?.business_name || 'Edusteps Academy',
        email: businessDetails?.email,
        phone: businessDetails?.phone,
        address: businessDetails?.address,
        gstin: businessDetails?.gstin,
        bankDetails: {
          upiId: businessDetails?.upi_id || 'edusteps@upi',
          bankName: businessDetails?.bank_name,
          accountNumber: businessDetails?.account_number,
          ifsc: businessDetails?.ifsc_code,
        }
      },
      customer: {
        name: payment.customer_name || 'Parent / Customer',
        email: payment.customer_email,
        mobile: payment.customer_mobile,
      },
      student: {
        name: payment.student_name || 'Student',
        subject: payment.subject || 'Course Fee',
        milestone: payment.milestone,
        cdId: payment.cd_id,
      },
      items: [
        {
          description: `${payment.milestone || 'Enrollment'} — ${payment.subject || 'Course Fee'}`,
          qty: 1,
          unitPrice: courseFee,
          discount: discount,
          amount: netAmount > 0 ? netAmount : payment.paid_amount,
        }
      ],
      payment: {
        totalFee: courseFee,
        discountTotal: discount,
        amountPaid: totalPaid,
        balanceDue: balanceDue,
        paymentMode: payment.payment_mode,
        transactionRef: payment.transaction_ref,
        paidOn: payment.paid_on,
      }
    };

    setSelectedInvoiceData(invoiceData);
    setIsInvoiceModalOpen(true);
  };

  const debouncedQuery = useDebounce(customerSearchQuery, 350);
  const getPaymentModeValue = (value: string): PaymentMode =>
    PAYMENT_MODE_OPTIONS.some(m => m.value === value) ? value as PaymentMode : 'CASH';

  useEffect(() => { loadDashboardData(); }, [businessDetails?.client_id]);
  useEffect(() => { setPage(1); }, [searchTerm, paymentModeFilter, statusFilter, fromDate, toDate]);
  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) { setCustomerSearchResults([]); return; }
    performSearch(debouncedQuery);
  }, [debouncedQuery]);
  useEffect(() => {
    if (showPaymentModal && paymentMode === 'online') {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, [showPaymentModal, paymentMode]);

  const loadDashboardData = async () => {
    if (!businessDetails?.client_id) return;
    setLoading(true);
    try {
      const [paymentResponse, revenueResponse] = await Promise.all([
        getPaymentsByClientApi(String(businessDetails.client_id)),
        getRevenueApi(String(businessDetails.client_id)),
      ]);
      setPayments(Array.isArray(paymentResponse.data) ? paymentResponse.data : []);
      setRevenue(revenueResponse.data || null);
    } catch (error: any) {
      console.error('Error loading payment dashboard', error);
      notification.toast('Failed to load payment dashboard', 'error');
    } finally { setLoading(false); }
  };

  const performSearch = async (query: string) => {
    setIsSearching(true);
    try {
      const res = await searchCustomersApi(query, businessDetails?.client_id);
      const customers = Array.isArray(res.data) ? res.data : [];
      const results: SearchResult[] = [];
      for (const customer of customers.slice(0, 10)) {
        try {
          const detailRes = await getCustomerDetailsByCustomerIdApi(customer.customer_id.toString());
          const details = Array.isArray(detailRes.data) ? detailRes.data : [];
          for (const detail of details) {
            results.push({
              label: `${customer.first_name} ${customer.last_name || ''} (${customer.mobile}) — ${detail.first_name} ${detail.last_name || ''}, ${detail.subject}`,
              customer, detail
            });
          }
          if (details.length === 0) {
            results.push({
              label: `${customer.first_name} ${customer.last_name || ''} (${customer.mobile}) — No details`,
              customer, detail: null
            });
          }
        } catch {
          results.push({
            label: `${customer.first_name} ${customer.last_name || ''} (${customer.mobile})`,
            customer, detail: null
          });
        }
      }
      setCustomerSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
    } finally { setIsSearching(false); }
  };

  const handleSelectResult = (result: SearchResult) => {
    setSelectedCustomer(result.customer);
    setSelectedCustomerDetail(result.detail);
    setSelectedLabel(result.label);
    setCustomerSearchQuery('');
    setPaymentData(prev => ({
      ...prev,
      customer_id: result.customer.customer_id.toString(),
      cd_id: result.detail ? result.detail.cd_id.toString() : '',
      paid_amount: result.detail?.amount || 0,
    }));
  };

  const resetModal = () => {
    setPaymentData({ customer_id: '', cd_id: '', paid_amount: 0, discount_amount: 0, payment_mode: 'CASH', transaction_ref: '' });
    setSelectedCustomer(null); setSelectedCustomerDetail(null); setSelectedLabel('');
    setShowPaymentModal(false); setEditingPayment(null); setPaymentMode('manual');
  };

  const openAddPaymentModal = () => { resetModal(); setShowPaymentModal(true); };
  const openEditPaymentModal = (payment: Payment) => {
    setEditingPayment(payment);
    const normalized = normalizePaymentMode(payment.payment_mode);
    setPaymentData({
      customer_id: payment.customer_id,
      cd_id: payment.cd_id,
      paid_amount: Number(payment.paid_amount || 0),
      discount_amount: Number(payment.discount_amount || 0),
      payment_mode: normalized === 'UNKNOWN' ? 'CASH' : normalized,
      transaction_ref: payment.transaction_ref || '',
    });
    setSelectedLabel(`${payment.customer_name || 'Customer'} — ${payment.student_name || 'Student'}, ${payment.subject || ''}`);
    setPaymentMode('manual');
    setShowPaymentModal(true);
  };

  const openQuickView = async (paymentId: string) => {
    setShowQuickView(true);
    setActivePaymentId(paymentId);
    setQuickViewLoading(true);
    try {
      const response = await getPaymentQuickViewApi(paymentId);
      setQuickView(response.data);
    } catch (error: any) {
      notification.toast(error?.response?.data?.message || error?.message || 'Failed to load payment details', 'error');
      setShowQuickView(false);
    } finally { setQuickViewLoading(false); }
  };

  const handleManualPayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!businessDetails?.client_id) { notification.toast('Client information not available', 'error'); return; }
    setPaymentLoading(true);
    try {
      if (paymentData.discount_amount > paymentData.paid_amount) {
        notification.toast('Discount cannot exceed the payable amount', 'error');
        return;
      }

      const payload = {
        customer_id: paymentData.customer_id,
        cd_id: paymentData.cd_id,
        client_id: String(businessDetails.client_id),
        paid_amount: paymentData.paid_amount.toString(),
        discount_amount: paymentData.discount_amount.toString(),
        payment_mode: paymentData.payment_mode,
        transaction_ref: paymentData.transaction_ref || undefined,
      };

      if (editingPayment) {
        await updatePaymentApi(editingPayment.id, payload);
        notification.toast('Payment updated successfully', 'success');
      } else {
        await createPaymentApi(payload);
        notification.toast('Payment recorded successfully', 'success');
      }
      resetModal();
      await loadDashboardData();
    } catch (error: any) {
      console.error('Error saving payment:', error);
      notification.toast(error?.response?.data?.message || error?.message || 'Error saving payment', 'error');
    } finally { setPaymentLoading(false); }
  };

  const handleRazorpayPayment = async () => {
    if (!selectedCustomerDetail) { notification.toast('Please select a customer/student first', 'error'); return; }
    setPaymentLoading(true);
    try {
      const orderRes = await createRazorpayOrderApi({
        amount: paymentData.paid_amount,
        cd_id: paymentData.cd_id,
        customer_id: paymentData.customer_id,
      });
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;
      if (!razorpayKey) { notification.toast('Razorpay is not configured', 'error'); setPaymentLoading(false); return; }

      const options = {
        key: razorpayKey,
        amount: orderRes.data.amount,
        currency: orderRes.data.currency,
        order_id: orderRes.data.orderId,
        name: businessDetails?.name || 'Edusteps',
        description: `Payment for ${selectedLabel}`,
        handler: async (response: any) => {
          try {
            await verifyRazorpayPaymentApi({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              cd_id: paymentData.cd_id,
              customer_id: paymentData.customer_id,
              client_id: String(businessDetails?.client_id || ''),
              paid_amount: paymentData.paid_amount,
            });
            notification.toast('Payment successful', 'success');
            resetModal();
            await loadDashboardData();
          } catch {
            notification.toast('Payment verification failed', 'error');
          } finally { setPaymentLoading(false); }
        },
        modal: { ondismiss: () => setPaymentLoading(false) },
        theme: { color: '#2563eb' },
      };
      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error: any) {
      notification.toast(error?.response?.data?.message || error?.message || 'Failed to initiate payment', 'error');
      setPaymentLoading(false);
    }
  };

  const handleDelete = (id: string) => setDeleteDialog({ isOpen: true, id });
  const confirmDelete = async () => {
    setLoading(true);
    try {
      await deletePaymentApi(deleteDialog.id);
      notification.toast('Payment deleted successfully', 'success');
      setDeleteDialog({ isOpen: false, id: '' });
      await loadDashboardData();
    } catch (error: any) {
      notification.toast(error?.message || 'Error deleting payment', 'error');
    } finally { setLoading(false); }
  };

  const handleSendWhatsApp = (payment: Payment) => {
    const mobile = String(payment.customer_mobile || '').replace(/\D/g, '');
    if (!mobile) { notification.toast('No mobile number found for this customer', 'error'); return; }
    const target = mobile.startsWith('91') ? mobile : `91${mobile}`;
    const message = encodeURIComponent(
      `Hello ${payment.customer_name || 'Parent'}, your receipt for ${payment.student_name || 'student'} (${payment.milestone || payment.subject || 'payment'}) is ready.\nAmount: ${formatCurrency(payment.paid_amount)}\nDate: ${new Date(payment.paid_on).toLocaleDateString('en-IN')}\nReference: ${payment.transaction_ref || 'N/A'}`
    );
    window.open(`https://wa.me/${target}?text=${message}`, '_blank');
  };

  const handleSendEmail = (payment: Payment) => {
    if (!payment.customer_email) { notification.toast('No email found for this customer', 'error'); return; }
    const subject = encodeURIComponent(`Invoice for ${payment.student_name || 'student'} - ${payment.milestone || payment.subject || 'Payment'}`);
    const body = encodeURIComponent(
      `Hello ${payment.customer_name || 'Parent'},\n\nPlease find the payment summary below:\nStudent: ${payment.student_name || 'N/A'}\nCourse: ${payment.subject || 'N/A'}\nMilestone: ${payment.milestone || 'N/A'}\nAmount: ${formatCurrency(payment.paid_amount)}\nPaid On: ${new Date(payment.paid_on).toLocaleDateString('en-IN')}\nReference: ${payment.transaction_ref || 'N/A'}\n\nRegards,\n${businessDetails?.business_name || 'Edusteps'}`
    );
    window.location.href = `mailto:${payment.customer_email}?subject=${subject}&body=${body}`;
  };

  const sortedPayments = useMemo(() =>
    [...payments].sort((a, b) => Date.parse(b.paid_on || '') - Date.parse(a.paid_on || '') || 0),
    [payments]);

  const filteredPayments = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return sortedPayments.filter(payment => {
      if (paymentModeFilter !== 'all' && normalizePaymentMode(payment.payment_mode) !== paymentModeFilter) return false;
      if (statusFilter !== 'all' && payment.status !== statusFilter) return false;
      const paidOn = String(payment.paid_on || '').slice(0, 10);
      if (fromDate && paidOn && paidOn < fromDate) return false;
      if (toDate && paidOn && paidOn > toDate) return false;
      if (!q) return true;
      return (
        String(payment.customer_name || '').toLowerCase().includes(q) ||
        String(payment.student_name || '').toLowerCase().includes(q) ||
        String(payment.subject || '').toLowerCase().includes(q) ||
        String(payment.milestone || '').toLowerCase().includes(q) ||
        String(payment.transaction_ref || '').toLowerCase().includes(q) ||
        getPaymentModeLabel(payment.payment_mode).toLowerCase().includes(q)
      );
    });
  }, [sortedPayments, searchTerm, paymentModeFilter, statusFilter, fromDate, toDate]);

  const totalRevenueFiltered = useMemo(() =>
    filteredPayments.reduce((sum, payment) => sum + Number(payment.paid_amount || 0), 0),
    [filteredPayments]);

  const hasActiveFilters = Boolean(searchTerm || statusFilter !== 'all' || paymentModeFilter !== 'all' || fromDate || toDate);
  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / pageSize));
  const paginatedPayments = useMemo(() =>
    filteredPayments.slice((page - 1) * pageSize, page * pageSize),
    [filteredPayments, page]);

  const exportPaymentsCsv = () => {
    if (filteredPayments.length === 0) return;
    const escape = (v: unknown) => {
      const str = v === null || v === undefined ? '' : String(v);
      return /[",\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
    };
    const headers = ['Payment ID', 'Customer', 'Student', 'Course', 'Milestone', 'Amount', 'Status', 'Date'];
    const rows = filteredPayments.map(p => [p.id, p.customer_name || '', p.student_name || '', p.subject || '', p.milestone || '', Number(p.paid_amount || 0), formatStatusLabel(p.status), formatDisplayDate(p.paid_on)]);
    const csv = [headers.map(escape).join(','), ...rows.map(r => r.map(escape).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `payments-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <ConfirmDialog isOpen={deleteDialog.isOpen} title="Delete Payment" message="Are you sure you want to delete this payment record? This action cannot be undone." onConfirm={confirmDelete} onCancel={() => setDeleteDialog({ isOpen: false, id: '' })} />

      <div className="content-sequence space-y-5 animate-in fade-in duration-500">
        <div className="saas-card relative overflow-hidden border-border/80 bg-card p-4 sm:p-6 shadow-sm hover-lift">
          <div className="absolute inset-0 pattern-grid opacity-[0.08] pointer-events-none" />
          <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">Financial operations</p>
              <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-foreground">Payment Details</h1>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">Monitor collections, open quick details, and jump directly into student and course workflows.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={exportPaymentsCsv} disabled={filteredPayments.length === 0} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50">Export CSV</button>
              <button type="button" onClick={openAddPaymentModal} className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm shadow-primary/20 hover:opacity-90">Add Payment</button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[0.9fr_1.3fr_0.8fr]">
          <div className="saas-card relative overflow-hidden border-border/80 bg-card p-3.5 sm:p-4 shadow-sm hover-lift">
            <div className="absolute inset-0 pattern-dots opacity-[0.04] pointer-events-none" />
            <p className="relative z-10 text-xs uppercase tracking-[0.24em] text-muted-foreground">Total Payments</p>
            <p className="relative z-10 mt-3 text-3xl font-bold text-foreground">{filteredPayments.length}</p>
            <p className="relative z-10 mt-2 text-sm text-slate-600 dark:text-slate-300">{hasActiveFilters ? 'Visible transactions in current filters' : 'All transactions currently available'}</p>
          </div>

          <div className="saas-card relative overflow-hidden border-border/80 bg-card p-3.5 sm:p-4 shadow-sm hover-lift">
            <div className="absolute inset-0 pattern-grid opacity-[0.06] pointer-events-none" />
            <div className="relative z-10 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-muted-foreground">{hasActiveFilters ? 'Revenue in View' : 'Total Revenue'}</p>
                <p className="mt-3 text-3xl font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(totalRevenueFiltered)}</p>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 font-medium ${(revenue?.growthPercentage || 0) >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300'}`}>
                    <ArrowUpRight className="h-4 w-4" />{(revenue?.growthPercentage || 0) >= 0 ? '+' : ''}{revenue?.growthPercentage || 0}% vs last month
                  </span>
                </div>
              </div>
              <div className="h-24 w-40">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenue?.trend || []}>
                    <Tooltip contentStyle={{ borderRadius: 12, border: '1px solid #e5e7eb', fontSize: 12 }} />
                    <Line type="monotone" dataKey="revenue" stroke="#2563eb" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="saas-card relative overflow-hidden border-border/80 bg-card p-3.5 sm:p-4 shadow-sm hover-lift">
            <div className="absolute inset-0 pattern-dots opacity-[0.04] pointer-events-none" />
            <p className="relative z-10 text-xs uppercase tracking-[0.24em] text-muted-foreground">Last Payment</p>
            <p className="relative z-10 mt-3 text-lg font-semibold text-foreground">{formatDisplayDate(filteredPayments[0]?.paid_on)}</p>
            <p className="relative z-10 mt-2 text-sm text-slate-600 dark:text-slate-300">{hasActiveFilters ? 'Most recent visible payment' : `Today: ${formatCurrency(revenue?.revenueToday || 0)}`}</p>
          </div>
        </div>

        <div className="saas-card border-border/80 bg-card p-4 sm:p-5 shadow-sm">
          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
            <input type="text" placeholder="Search by customer, student, course, milestone..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-modern" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as DashboardStatusFilter)} className="input-modern">
              <option value="all">All Statuses</option>
              <option value="SUCCESSFUL">Successful</option>
              <option value="PENDING_OVERDUE">Pending / Overdue</option>
              <option value="REFUNDED">Refunded</option>
            </select>
            <select value={paymentModeFilter} onChange={e => setPaymentModeFilter(e.target.value === 'all' ? 'all' : getPaymentModeValue(e.target.value))} className="input-modern">
              <option value="all">All Modes</option>
              {PAYMENT_MODE_OPTIONS.map(mode => <option key={mode.value} value={mode.value}>{mode.label}</option>)}
            </select>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="input-modern" />
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="input-modern" />
            <button type="button" onClick={() => { setSearchTerm(''); setStatusFilter('all'); setPaymentModeFilter('all'); setFromDate(''); setToDate(''); }} className="button-secondary">Clear Filters</button>
          </div>
        </div>

        {loading ? (
          <div className="py-12">
            <div className="mx-auto max-w-md">
              <EmptyState title="Loading payments..." description="Fetching dashboard transactions and analytics." icon={<Skeleton className="h-6 w-6 rounded-xl" variant="rect" />} />
            </div>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="py-12">
            <EmptyState title={searchTerm ? 'No matching payments' : 'No payments found'} description={searchTerm ? `No results for "${searchTerm}"` : 'Record your first payment to unlock quick views, linked navigation, and analytics.'} action={!searchTerm ? <button onClick={openAddPaymentModal} className="btn-modern rounded-xl px-6">Add First Payment</button> : undefined} />
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
            <div className="overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-thin">
              <table className="w-full min-w-[1100px] border-collapse relative">
                <thead className="sticky top-0 z-20 shadow-sm backdrop-blur-md">
                  <tr className="border-b border-border/70 bg-slate-50/95 dark:bg-slate-900/95">
                    <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Customer</th>
                    <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Student</th>
                    <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Course</th>
                    <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Milestone</th>
                    <th className="px-3 py-2.5 text-right text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Amount</th>
                    <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Status</th>
                    <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Date</th>
                    <th className="px-3 py-2.5 text-right text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPayments.map(payment => (
                    <tr key={payment.id} onClick={() => openQuickView(payment.id)} className="cursor-pointer border-b border-border/60 transition-colors hover:bg-primary/5 dark:hover:bg-primary/10">
                      <td className="px-3 py-2.5">
                        <p className="font-medium text-xs text-gray-900 dark:text-gray-100">{payment.customer_name || 'N/A'}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">{payment.customer_mobile || 'No contact'}</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <button type="button" onClick={e => { e.stopPropagation(); navigate(`/customers/${payment.customer_id}`); }} className="text-left font-semibold text-xs text-blue-600 hover:underline dark:text-blue-400">{payment.student_name || 'N/A'}</button>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">Parent profile and fee history</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <button type="button" onClick={e => { e.stopPropagation(); if (payment.course_id) navigate(`/courses/${payment.course_id}/analytics`); else notification.toast('No linked course analytics found for this payment', 'error'); }} className="text-left font-semibold text-xs text-violet-600 hover:underline dark:text-violet-400">{payment.subject || 'N/A'}</button>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">Open batch analytics</p>
                      </td>
                      <td className="px-3 py-2.5">
                        <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{payment.milestone || 'Payment'}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">Due left <span className="tabular-nums">{formatCurrency(payment.enrollment_balance_due || 0)}</span></p>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(payment.paid_amount)}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">{getPaymentModeLabel(payment.payment_mode)}</p>
                      </td>
                      <td className="px-3 py-2.5"><span className={`inline-flex rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wide ${getStatusClasses(payment.status)}`}>{formatStatusLabel(payment.status)}</span></td>
                      <td className="px-3 py-2.5 text-[11px] text-gray-700 dark:text-gray-300">{formatDisplayDate(payment.paid_on)}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex flex-wrap items-center justify-end gap-1.5">
                          <button type="button" onClick={e => { e.stopPropagation(); openQuickView(payment.id); }} className="rounded-md bg-slate-100 p-1.5 text-slate-700 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"><Eye className="h-3.5 w-3.5" /></button>
                          <button type="button" onClick={e => { e.stopPropagation(); openInvoiceModal(payment); }} className="rounded-md bg-blue-100 p-1.5 text-blue-700 transition-colors hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50" title="View & Download Invoice"><Download className="h-3.5 w-3.5" /></button>
                          <button type="button" onClick={e => { e.stopPropagation(); handleSendWhatsApp(payment); }} className="rounded-md bg-green-100 p-1.5 text-green-700 transition-colors hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50"><MessageCircle className="h-3.5 w-3.5" /></button>
                          <button type="button" onClick={e => { e.stopPropagation(); handleSendEmail(payment); }} className="rounded-md bg-violet-100 p-1.5 text-violet-700 transition-colors hover:bg-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:hover:bg-violet-900/50"><Mail className="h-3.5 w-3.5" /></button>
                          <button type="button" onClick={e => { e.stopPropagation(); openEditPaymentModal(payment); }} className="rounded-md bg-amber-100 p-1.5 text-amber-700 transition-colors hover:bg-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:hover:bg-amber-900/50"><Edit className="h-3.5 w-3.5" /></button>
                          <button type="button" onClick={e => { e.stopPropagation(); handleDelete(payment.id); }} className="rounded-md bg-rose-100 p-1.5 text-rose-700 transition-colors hover:bg-rose-200 dark:bg-rose-900/30 dark:text-rose-300 dark:hover:bg-rose-900/50"><Trash2 className="h-3.5 w-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredPayments.length > pageSize && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 px-4 py-3 dark:border-gray-800">
                <p className="text-sm text-gray-600 dark:text-gray-400">Showing {Math.min((page - 1) * pageSize + 1, filteredPayments.length)}-{Math.min(page * pageSize, filteredPayments.length)} of {filteredPayments.length} payments</p>
                <div className="flex items-center gap-2">
                  <button type="button" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800">Prev</button>
                  <button type="button" disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800">Next</button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showQuickView && (
        <div className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm">
          <div className="absolute inset-y-0 right-0 w-full max-w-2xl overflow-y-auto border-l border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-gray-700 dark:bg-gray-900/95">
              <div><h2 className="text-base font-bold text-gray-900 dark:text-gray-100">Payment Quick View</h2><p className="text-xs text-gray-500 dark:text-gray-400">Transaction #{activePaymentId}</p></div>
              <button type="button" onClick={() => setShowQuickView(false)} className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"><X className="h-4 w-4" /></button>
            </div>
            {quickViewLoading || !quickView ? (
              <div className="space-y-3 p-4">
                <Skeleton className="h-32 rounded-2xl" />
                <Skeleton className="h-28 rounded-2xl" />
                <Skeleton className="h-56 rounded-2xl" />
              </div>
            ) : (
              <div className="space-y-4 p-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/60">
                    <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Customer Profile</p>
                    <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">{quickView.customer_profile.name}</h3>
                    <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                      <p>Email: {quickView.customer_profile.email || 'Not available'}</p>
                      <p>Alternate Contact: {quickView.customer_profile.alternate_contact_number || 'Not available'}</p>
                      <p>Status: {quickView.customer_profile.overall_account_status}</p>
                    </div>
                    <button type="button" onClick={() => navigate(`/customers/${quickView.customer_profile.customer_id}`)} className="mt-4 text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400">Open Student Profile</button>
                  </div>
                  <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/60">
                    <p className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">Payment Milestone</p>
                    <h3 className="mt-2 text-lg font-semibold text-gray-900 dark:text-gray-100">{quickView.payment.milestone}</h3>
                    <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-300">
                      <p>Amount Paid: {formatCurrency(quickView.payment.paid_amount)}</p>
                      <p>Discount: {formatCurrency(quickView.payment.discount_amount)}</p>
                      <p>Mode: {getPaymentModeLabel(quickView.payment.payment_mode)}</p>
                      <p>Date: {formatDisplayDate(quickView.payment.paid_on)}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900">
                  <div className="flex items-center justify-between gap-3">
                    <div><h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Student Breakdown</h3><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">All students linked to this parent profile, including batch timings and attendance.</p></div>
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950/40 dark:text-blue-300">{quickView.student_breakdown.length} linked</span>
                  </div>
                  <div className="mt-4 space-y-3">
                    {quickView.student_breakdown.map(student => (
                      <div key={student.cd_id} className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/60">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div><p className="font-semibold text-gray-900 dark:text-gray-100">{student.student_name}</p><p className="text-sm text-gray-500 dark:text-gray-400">{student.subject}</p></div>
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(student.payment_status === 'PAID' || student.payment_status === 'OVERPAID' ? 'SUCCESSFUL' : student.payment_status === 'UNPAID' ? 'PENDING_OVERDUE' : 'PENDING_OVERDUE')}`}>{student.payment_status}</span>
                            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${student.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>{student.is_active ? 'Active' : 'Inactive'}</span>
                          </div>
                        </div>
                        <div className="mt-3 grid gap-3 text-sm text-gray-600 dark:text-gray-300 md:grid-cols-2">
                          <p>Attendance: {String(student.attendance_status || 'not_marked').replace(/_/g, ' ').charAt(0).toUpperCase() + String(student.attendance_status || 'not_marked').replace(/_/g, ' ').slice(1)}</p>
                          <p>Paid: {formatCurrency(student.amount_paid)}</p>
                          <p>Balance Due: {formatCurrency(student.balance_due)}</p>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <button type="button" onClick={() => navigate(`/customers/${quickView.customer_profile.customer_id}`)} className="text-sm font-semibold text-blue-600 hover:underline dark:text-blue-400">Student Profile</button>
                          {student.course_id && <button type="button" onClick={() => navigate(`/courses/${student.course_id}/analytics`)} className="text-sm font-semibold text-violet-600 hover:underline dark:text-violet-400">Course Analytics</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="grid w-full max-w-lg grid-rows-[auto_auto] overflow-hidden rounded-xl border bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900">
            <div className="flex items-center justify-between border-b px-4 py-3 dark:border-gray-700">
              <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">{editingPayment ? 'Edit Payment' : 'Record Payment'}</h2>
              <button type="button" onClick={resetModal} className="text-xs font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">Close</button>
            </div>

            {!editingPayment ? (
              <div className="px-4 pt-4">
                <label className="mb-2 block text-xs font-semibold text-gray-700 dark:text-gray-300">Search and select customer or student</label>
                {selectedLabel ? (
                  <div className="flex items-center gap-2 rounded-lg border border-green-400 bg-green-50 p-3 dark:border-green-600 dark:bg-green-900/30">
                    <span className="flex-1 truncate text-sm text-green-900 dark:text-green-100">{selectedLabel}</span>
                    <button type="button" onClick={() => { setSelectedCustomer(null); setSelectedCustomerDetail(null); setSelectedLabel(''); }} className="shrink-0 text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100">Clear</button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <input type="text" value={customerSearchQuery} onChange={e => setCustomerSearchQuery(e.target.value)} className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100" placeholder="Type name or mobile..." autoComplete="off" />
                      {isSearching && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" /></div>}
                    </div>
                    {customerSearchResults.length > 0 && (
                      <div className="max-h-48 overflow-y-auto rounded-lg border border-gray-200 bg-gray-50/80 dark:border-gray-700 dark:bg-gray-800/80">
                        {customerSearchResults.map((result, index) => (
                          <button key={`${result.label}-${index}`} type="button" onClick={() => handleSelectResult(result)} className="w-full border-b border-gray-100 px-4 py-2.5 text-left transition-colors last:border-b-0 hover:bg-blue-50 dark:border-gray-700 dark:hover:bg-blue-950/30">
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{result.label}</p>
                            {result.detail && <p className="mt-0.5 text-xs text-gray-500">{formatCurrency(result.detail.amount)} • {result.detail.is_active ? 'Active' : 'Inactive'}</p>}
                          </button>
                        ))}
                      </div>
                    )}
                    {customerSearchResults.length === 0 && !isSearching && debouncedQuery.length >= 2 && <p className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900/50">No match, try another search</p>}
                  </div>
                )}
              </div>
            ) : (
              <div className="px-4 pt-4">
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-2.5"><p className="text-xs font-semibold text-blue-900">{selectedLabel}</p></div>
              </div>
            )}

            {selectedCustomerDetail && !editingPayment && (
              <div className="px-4 pt-3">
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-2.5">
                  <div><p className="text-xs text-gray-500">Course Fee</p><p className="text-lg font-bold text-gray-900">{formatCurrency(selectedCustomerDetail.amount)}</p></div>
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${selectedCustomerDetail.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{selectedCustomerDetail.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            )}

            {!editingPayment && (
              <div className="px-4 pt-3">
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setPaymentMode('manual')} className={`rounded-lg border p-2.5 text-xs font-semibold transition-all ${paymentMode === 'manual' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>Manual Payment</button>
                  <button type="button" onClick={() => setPaymentMode('online')} className={`rounded-lg border p-2.5 text-xs font-semibold transition-all ${paymentMode === 'online' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>Online (Razorpay)</button>
                </div>
              </div>
            )}

            {(paymentMode === 'manual' || editingPayment) && (
              <form onSubmit={handleManualPayment} className="space-y-3 p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="mb-1 block text-xs font-medium text-gray-600">Payable Amount *</label><input type="number" value={paymentData.paid_amount} onChange={e => setPaymentData({ ...paymentData, paid_amount: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500" min="0" step="0.01" required /></div>
                  <div><label className="mb-1 block text-xs font-medium text-gray-600">Discount</label><input type="number" value={paymentData.discount_amount} onChange={e => setPaymentData({ ...paymentData, discount_amount: parseFloat(e.target.value) || 0 })} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500" min="0" step="0.01" /></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="mb-1 block text-xs font-medium text-gray-600">Payment Mode *</label><select value={paymentData.payment_mode} onChange={e => setPaymentData({ ...paymentData, payment_mode: getPaymentModeValue(e.target.value) })} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500" required>{PAYMENT_MODE_OPTIONS.map(mode => <option key={mode.value} value={mode.value}>{mode.label}</option>)}</select></div>
                  <div><label className="mb-1 block text-xs font-medium text-gray-600">Transaction Ref</label><input type="text" value={paymentData.transaction_ref} onChange={e => setPaymentData({ ...paymentData, transaction_ref: e.target.value })} className="w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500" placeholder="TXN123" /></div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                  <span className="text-sm text-gray-600">Final Amount</span>
                  <span className="text-xl font-bold text-green-600">{formatCurrency(Math.max(paymentData.paid_amount - paymentData.discount_amount, 0))}</span>
                </div>
                <button type="submit" disabled={paymentLoading || (!selectedCustomer && !editingPayment)} className="w-full rounded-lg bg-green-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50">{paymentLoading ? 'Processing...' : editingPayment ? 'Update Payment' : 'Record Payment'}</button>
              </form>
            )}

            {paymentMode === 'online' && !editingPayment && (
              <div className="space-y-3 p-4">
                {!import.meta.env.VITE_RAZORPAY_KEY_ID && <div className="rounded-lg border border-red-200 bg-red-50 p-2.5"><p className="text-xs font-medium text-red-800">Razorpay is not configured. Add `VITE_RAZORPAY_KEY_ID` to enable online payments.</p></div>}
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3"><p className="text-xs text-yellow-800">You will be redirected to Razorpay to complete the payment securely.</p></div>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                  <span className="text-sm text-gray-600">Amount</span>
                  <span className="text-xl font-bold text-blue-600">{formatCurrency(paymentData.paid_amount)}</span>
                </div>
                <button type="button" onClick={handleRazorpayPayment} disabled={paymentLoading || !import.meta.env.VITE_RAZORPAY_KEY_ID || !selectedCustomer} className="w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50">{paymentLoading ? 'Processing...' : 'Pay with Razorpay'}</button>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedInvoiceData && (
        <InvoiceModal
          isOpen={isInvoiceModalOpen}
          onClose={() => setIsInvoiceModalOpen(false)}
          data={selectedInvoiceData}
        />
      )}
    </>
  );
}