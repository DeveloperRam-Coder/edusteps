export const PAYMENT_MODE_VALUES = ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CHEQUE'] as const;

export type PaymentMode = (typeof PAYMENT_MODE_VALUES)[number];
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERPAID';

export function normalizePaymentMode(mode?: string | null): PaymentMode {
  const normalized = String(mode ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');

  switch (normalized) {
    case 'CASH': return 'CASH';
    case 'CARD': return 'CARD';
    case 'UPI': return 'UPI';
    case 'CHEQUE': return 'CHEQUE';
    case 'BANK_TRANSFER':
    case 'BANK':
    case 'NETBANKING':
    case 'NET_BANKING':
    case 'RAZORPAY': return 'BANK_TRANSFER';
    default: return 'CASH';
  }
}

export function mapRazorpayMethodToPaymentMode(method?: string | null): PaymentMode {
  const normalized = String(method ?? '').trim().toLowerCase();

  switch (normalized) {
    case 'card': return 'CARD';
    case 'upi': return 'UPI';
    case 'netbanking':
    case 'bank_transfer':
    case 'bank':
    case 'emi':
    case 'wallet': return 'BANK_TRANSFER';
    default: return 'BANK_TRANSFER';
  }
}

export function getPaymentStatus(totalPaid: number, courseFee: number): PaymentStatus {
  if (totalPaid <= 0) {
    return 'UNPAID';
  }

  if (totalPaid < courseFee) {
    return 'PARTIAL';
  }

  return totalPaid === courseFee ? 'PAID' : 'OVERPAID';
}
