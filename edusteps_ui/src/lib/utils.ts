import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERPAID';
export type PaymentMode = 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE';

export const PAYMENT_MODE_OPTIONS: Array<{ value: PaymentMode; label: string }> = [
  { value: 'CASH', label: 'Cash' },
  { value: 'CARD', label: 'Card' },
  { value: 'UPI', label: 'UPI' },
  { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
  { value: 'CHEQUE', label: 'Cheque' },
];

export function normalizePaymentStatus(status: string | null | undefined): PaymentStatus | 'UNKNOWN' {
  const normalized = String(status ?? '').trim().toUpperCase();

  switch (normalized) {
    case 'PAID':
    case 'PARTIAL':
    case 'UNPAID':
    case 'OVERPAID':
      return normalized;
    default:
      return 'UNKNOWN';
  }
}

export function getPaymentStatusAppearance(status: string | null | undefined): string {
  switch (normalizePaymentStatus(status)) {
    case 'PAID':
      return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-400';
    case 'PARTIAL':
      return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/30 dark:text-amber-400';
    case 'UNPAID':
      return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/30 dark:text-red-400';
    case 'OVERPAID':
      return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-400';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300';
  }
}

export function normalizePaymentMode(mode: string | null | undefined): PaymentMode | 'UNKNOWN' {
  const normalized = String(mode ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');

  switch (normalized) {
    case 'CASH': return 'CASH';
    case 'CARD': return 'CARD';
    case 'UPI': return 'UPI';
    case 'CHEQUE': return 'CHEQUE';
    case 'BANK_TRANSFER':
    case 'BANK':
    case 'NET_BANKING':
    case 'NETBANKING':
    case 'RAZORPAY': return 'BANK_TRANSFER';
    default: return 'UNKNOWN';
  }
}

export function getPaymentModeLabel(mode: string | null | undefined): string {
  switch (normalizePaymentMode(mode)) {
    case 'CASH': return 'Cash';
    case 'CARD': return 'Card';
    case 'UPI': return 'UPI';
    case 'CHEQUE': return 'Cheque';
    case 'BANK_TRANSFER': return 'Bank Transfer';
    default: return 'Unknown';
  }
}

/**
 * Formats number as Indian Rupees with proper comma separators
 */
export function formatCurrency(amount: number | string | null | undefined): string {
  const num = Number(amount ?? 0);
  if (isNaN(num)) return "₹0";
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Gets payment status based on total paid vs course fee
 */
export function getPaymentStatus(paidAmount: number, courseFee: number): PaymentStatus {
  if (paidAmount >= courseFee) {
    return paidAmount > courseFee ? "OVERPAID" : "PAID";
  }
  if (paidAmount > 0) {
    return "PARTIAL";
  }
  return "UNPAID";
}
