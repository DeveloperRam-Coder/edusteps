import { toast } from 'sonner';

export interface ApiError {
  message: string;
  status?: number;
  field?: string;
}

export class ErrorHandler {
  private static sanitize = (v: unknown) => String(v ?? '').replace(/[\r\n]/g, ' ');

  static handle(error: any): ApiError {
    if (import.meta.env?.DEV) {
      console.error('Error occurred:', ErrorHandler.sanitize(error?.message ?? error));
    }

    if (error.response) {
      const { status, data } = error.response;
      const message = data?.message || data?.error || 'An error occurred';
      
      toast.error(message);
      
      return {
        message,
        status,
        field: data?.field
      };
    }

    if (error.request) {
      const message = 'Network error. Please check your connection.';
      toast.error(message);
      return { message };
    }

    const message = error.message || 'An unexpected error occurred';
    toast.error(message);
    return { message };
  }

  static success(message: string) {
    toast.success(message);
  }

  static info(message: string) {
    toast.info(message);
  }

  static warning(message: string) {
    toast.warning(message);
  }
}

export const validateRequired = (value: any, fieldName: string): string | null => {
  if (!value || (typeof value === 'string' && value.trim() === '')) {
    return `${fieldName} is required`;
  }
  return null;
};

export const validateEmail = (email: string): string | null => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }
  return null;
};

export const validatePhone = (phone: string): string | null => {
  const phoneRegex = /^[+]?[\d\s\-()]{10,}$/;
  if (!phoneRegex.test(phone)) {
    return 'Please enter a valid phone number';
  }
  return null;
};

export const validateAmount = (amount: number | string): string | null => {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount) || numAmount < 0) {
    return 'Please enter a valid amount';
  }
  return null;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date));
};