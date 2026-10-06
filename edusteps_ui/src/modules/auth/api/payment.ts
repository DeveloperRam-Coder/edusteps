import api from '@/core/api/client';
import { AxiosResponse } from 'axios';
import type { PaymentMode, PaymentStatus } from '@/lib/utils';

export interface Payment {
  id: string;
  customer_id: string;
  cd_id: string;
  client_id: string;
  paid_amount: number;
  discount_amount: number;
  payment_mode: PaymentMode | string;
  transaction_ref?: string;
  paid_on: string;
  created_at: string;
  customer_name?: string;
  customer_mobile?: string;
  customer_email?: string;
  student_name?: string;
  subject?: string;
  course_fee?: number;
  course_id?: string | null;
  milestone?: string;
  enrollment_total_paid?: number;
  enrollment_balance_due?: number;
  status?: 'SUCCESSFUL' | 'PENDING_OVERDUE' | 'REFUNDED';
}

export interface CreatePaymentPayload {
    customer_id: string;
    cd_id: string;
    client_id: string;
    paid_amount: string;
    discount_amount?: string;
    payment_mode: PaymentMode;
    transaction_ref?: string;
}

export interface Revenue {
  totalRevenue: number;
  revenueToday: number;
  revenueThisMonth: number;
  previousMonthRevenue: number;
  growthPercentage: number;
  trend: Array<{
    month: string;
    revenue: number;
  }>;
}

export interface RazorpayOrder {
    orderId: string;
    amount: number;
    currency: string;
    receipt: string;
}

export interface InvoiceResponse {
  html: string;
  invoiceNo: string;
  studentName: string;
}

export interface CustomerDueEnrollmentSummary {
  cd_id: string;
  courseFee: number;
  totalPaid: number;
  balanceDue: number;
  status: PaymentStatus | string;
}

export interface CustomerDueSummary {
  customerId: string;
  totalFee: number;
  totalPaid: number;
  totalDue: number;
  enrollments: CustomerDueEnrollmentSummary[];
}

export interface PaymentQuickViewStudent {
  cd_id: string;
  student_name: string;
  subject: string;
  course_id: string | null;
  batch_timing: string;
  attendance_status: string;
  attendance_date: string | null;
  payment_status: PaymentStatus | string;
  amount_paid: number;
  balance_due: number;
  milestone: string;
  is_active: boolean;
}

export interface PaymentQuickView {
  payment: {
    id: string;
    paid_amount: number;
    discount_amount: number;
    paid_on: string;
    payment_mode: PaymentMode | string;
    transaction_ref?: string;
    milestone: string;
  };
  customer_profile: {
    customer_id: string;
    name: string;
    email?: string;
    alternate_contact_number?: string;
    overall_account_status: string;
  };
  student_breakdown: PaymentQuickViewStudent[];
}

// Get all payments for a client (clientId required by backend)
export const getAllPaymentsApi = (clientId: string): Promise<AxiosResponse<Payment[]>> =>
    api.get('/payment-details', { params: { clientId } });

// Get payments by customer
export const getPaymentsByCustomerApi = (customerId: string): Promise<AxiosResponse<Payment[]>> =>
    api.get(`/payment-details/customer/${customerId}`);

// Get payments by client
export const getPaymentsByClientApi = (clientId: string): Promise<AxiosResponse<Payment[]>> =>
  api.get(`/payment-details/client/${clientId}`);

// Get payments by customer detail
export const getPaymentsByCustomerDetailApi = (cdId: string): Promise<AxiosResponse<Payment[]>> =>
    api.get(`/payment-details/cd/${cdId}`);

// Get revenue statistics
export const getRevenueApi = (clientId: string): Promise<AxiosResponse<Revenue>> =>
  api.get(`/payment-details/revenue/${clientId}`);

export const getPaymentQuickViewApi = (paymentId: string): Promise<AxiosResponse<PaymentQuickView>> =>
  api.get(`/payment-details/quick-view/${paymentId}`);

// Create payment (manual)
export const createPaymentApi = (payload: CreatePaymentPayload): Promise<AxiosResponse<Payment>> =>
  api.post('/payment-details', payload);

// Update payment
export const updatePaymentApi = (id: string, payload: Partial<CreatePaymentPayload>): Promise<AxiosResponse<Payment>> =>
  api.put(`/payment-details/${id}`, payload);

// Delete payment
export const deletePaymentApi = (id: string): Promise<AxiosResponse<void>> =>
  api.delete(`/payment-details/${id}`);

// Create Razorpay order
export const createRazorpayOrderApi = (data: { amount: number; cd_id: string; customer_id: string }): Promise<AxiosResponse<RazorpayOrder>> =>
  api.post('/razorpay/create-order', data);

// Get payment summary for enrollment
export const getPaymentSummaryApi = (cdId: string): Promise<AxiosResponse<any>> =>
  api.get(`/payment-details/summary/${cdId}`);

// Generate invoice HTML for a payment
export const getInvoiceHtmlApi = (paymentId: string): Promise<AxiosResponse<InvoiceResponse>> =>
  api.get(`/payment-details/invoice/${paymentId}`);

export const getCustomerDueSummaryApi = (customerId: string): Promise<AxiosResponse<CustomerDueSummary>> =>
  api.get(`/payment-details/customer-due/${customerId}`);

// Verify Razorpay payment
export const verifyRazorpayPaymentApi = (data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    cd_id: string;
    customer_id: string;
    client_id: string;
    paid_amount: number;
    discount_amount?: number;
}): Promise<AxiosResponse<any>> =>
  api.post('/razorpay/verify-payment', data);
