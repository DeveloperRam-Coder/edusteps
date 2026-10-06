import { useState, useEffect } from 'react';
import { useAuth } from '@/auth/AuthContext';
import { useNotification } from '@/core/components/NotificationProvider';
import { createRazorpayOrderApi, verifyRazorpayPaymentApi, createPaymentApi } from '../api/payment';
import { formatCurrency, PAYMENT_MODE_OPTIONS, type PaymentMode } from '@/lib/utils';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerDetail: {
    cd_id: string;
    customer_id: string;
    first_name: string;
    last_name?: string;
    subject: string;
    amount: number;
  };
  onSuccess: () => void;
}

export default function PaymentModal({ isOpen, onClose, customerDetail, onSuccess }: PaymentModalProps) {
  const { businessDetails } = useAuth();
  const notification = useNotification();
  const [paymentMode, setPaymentMode] = useState<'online' | 'manual'>('manual');
  const [loading, setLoading] = useState(false);
  const getPaymentModeValue = (value: string): PaymentMode =>
    PAYMENT_MODE_OPTIONS.some((mode) => mode.value === value)
      ? (value as PaymentMode)
      : 'CASH';

  const [manualPaymentData, setManualPaymentData] = useState({
    mode: 'CASH' as PaymentMode,
    amount: customerDetail.amount,
    discount: 0,
    transactionRef: '',
  });

  useEffect(() => {
    if (!isOpen) return;

    setPaymentMode('manual');
    setManualPaymentData({
      mode: 'CASH',
      amount: customerDetail.amount,
      discount: 0,
      transactionRef: '',
    });

    // Load Razorpay script once.
    const scriptSrc = 'https://checkout.razorpay.com/v1/checkout.js';
    const existingScript = document.querySelector(`script[src="${scriptSrc}"]`);
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = scriptSrc;
      script.async = true;
      document.body.appendChild(script);
    }
  }, [isOpen, customerDetail.amount]);

  const handleRazorpayPayment = async () => {
    setLoading(true);
    try {
      const orderRes = await createRazorpayOrderApi({
        amount: customerDetail.amount,
        cd_id: customerDetail.cd_id,
        customer_id: customerDetail.customer_id.toString(),
      });

      const order = orderRes.data;
      const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID;

      if (!razorpayKey) {
        notification.toast('Razorpay is not configured', 'error');
        setLoading(false);
        return;
      }

      const options = {
        key: razorpayKey,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: businessDetails?.business_name || 'Edusteps',
        description: `Payment for ${customerDetail.first_name} ${customerDetail.last_name || ''} - ${customerDetail.subject}`,
        handler: async (response: any) => {
          try {
            await verifyRazorpayPaymentApi({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              cd_id: customerDetail.cd_id,
              customer_id: customerDetail.customer_id.toString(),
              client_id: businessDetails?.client_id?.toString() || '',
              paid_amount: customerDetail.amount,
            });

            notification.toast('Payment successful!', 'success');
            onSuccess();
            onClose();
          } catch (error: any) {
            console.error('Payment verification error:', error);
            notification.toast('Payment verification failed', 'error');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: `${customerDetail.first_name} ${customerDetail.last_name || ''}`,
        },
        theme: {
          color: '#3b82f6',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error: any) {
      console.error('Error creating payment:', error);
      const errMsg = error?.response?.data?.message || error?.message || 'Failed to initiate payment';
      notification.toast(errMsg, 'error');
      setLoading(false);
    }
  };

  const handleManualPayment = async () => {
    setLoading(true);
    try {
      const finalAmount = manualPaymentData.amount - manualPaymentData.discount;
      if (finalAmount < 0) {
        notification.toast('Discount cannot exceed the payable amount', 'error');
        return;
      }
      await createPaymentApi({
        customer_id: customerDetail.customer_id.toString(),
        cd_id: customerDetail.cd_id,
        client_id: businessDetails?.client_id?.toString() || '',
        paid_amount: finalAmount.toString(),
        discount_amount: manualPaymentData.discount.toString(),
        payment_mode: manualPaymentData.mode,
        transaction_ref: manualPaymentData.transactionRef || undefined,
      });

      notification.toast('Payment recorded successfully!', 'success');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error recording payment:', error);
      notification.toast('Failed to record payment', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4'>
      <div className='grid w-full max-w-lg grid-rows-[auto_1fr] overflow-hidden rounded-2xl bg-white shadow-2xl'>
        <div className='flex items-center justify-between border-b px-5 py-4'>
          <h2 className='text-lg font-bold text-gray-900'>Make Payment</h2>
          <button onClick={onClose} className='text-sm font-medium text-gray-600 hover:text-gray-900' type='button'>
            Close
          </button>
        </div>

        <div className='space-y-4 px-5 py-4'>
          <div className='grid grid-cols-[1fr_auto] gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4'>
            <div className='min-w-0 space-y-1'>
              <p className='text-xs font-medium uppercase tracking-wide text-gray-500'>Student</p>
              <p className='font-semibold text-gray-900'>{`${customerDetail.first_name} ${customerDetail.last_name || ''}`}</p>
              <p className='truncate text-sm text-gray-600'>{customerDetail.subject}</p>
            </div>
            <div className='text-right'>
              <p className='text-xs text-gray-500'>Amount</p>
              <p className='text-xl font-bold text-blue-600'>{formatCurrency(customerDetail.amount)}</p>
            </div>
          </div>

          <div className='space-y-4'>
            <div className='grid grid-cols-2 gap-2'>
              <button
                type='button'
                onClick={() => setPaymentMode('online')}
                className={`flex min-h-[72px] items-center justify-center rounded-lg border-2 p-3 text-center transition-all ${paymentMode === 'online'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <span className='text-sm font-medium'>Online</span>
              </button>

              <button
                type='button'
                onClick={() => setPaymentMode('manual')}
                className={`flex min-h-[72px] items-center justify-center rounded-lg border-2 p-3 text-center transition-all ${paymentMode === 'manual'
                  ? 'border-green-500 bg-green-50 text-green-700'
                  : 'border-gray-200 hover:border-gray-300'
                  }`}
              >
                <span className='text-sm font-medium'>Manual</span>
              </button>
            </div>

            {paymentMode === 'online' && (
              <div className='grid gap-3'>
                {!import.meta.env.VITE_RAZORPAY_KEY_ID && (
                  <div className='rounded-lg border border-red-200 bg-red-50 p-3'>
                    <p className='text-xs font-medium text-red-800 sm:text-sm'>
                      Razorpay is not configured. Add `VITE_RAZORPAY_KEY_ID` to `.env`, or use Manual Payment.
                    </p>
                  </div>
                )}

                <div className='rounded-lg border border-yellow-200 bg-yellow-50 p-3'>
                  <p className='text-xs text-yellow-800 sm:text-sm'>
                    You will be redirected to Razorpay to complete the payment securely.
                  </p>
                </div>

                <button
                  type='button'
                  onClick={handleRazorpayPayment}
                  disabled={loading || !import.meta.env.VITE_RAZORPAY_KEY_ID}
                  className='w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50'
                >
                  {loading ? 'Processing...' : 'Pay with Razorpay'}
                </button>
              </div>
            )}

            {paymentMode === 'manual' && (
              <div className='grid gap-3'>
                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                  <div>
                    <label className='mb-1 block text-xs font-medium text-gray-700'>Payment mode</label>
                    <select
                      value={manualPaymentData.mode}
                      onChange={(e) => setManualPaymentData({ ...manualPaymentData, mode: getPaymentModeValue(e.target.value) })}
                      className='w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
                    >
                      {PAYMENT_MODE_OPTIONS.map((mode) => (
                        <option key={mode.value} value={mode.value}>
                          {mode.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className='mb-1 block text-xs font-medium text-gray-700'>Payable amount</label>
                    <input
                      type='number'
                      value={manualPaymentData.amount}
                      onChange={(e) => setManualPaymentData({ ...manualPaymentData, amount: parseFloat(e.target.value) || 0 })}
                      className='w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
                      min='0'
                      step='0.01'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                  <div>
                    <label className='mb-1 block text-xs font-medium text-gray-700'>Discount</label>
                    <input
                      type='number'
                      value={manualPaymentData.discount}
                      onChange={(e) => setManualPaymentData({ ...manualPaymentData, discount: parseFloat(e.target.value) || 0 })}
                      className='w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
                      min='0'
                      step='0.01'
                    />
                  </div>

                  <div>
                    <label className='mb-1 block text-xs font-medium text-gray-700'>Transaction ref (optional)</label>
                    <input
                      type='text'
                      value={manualPaymentData.transactionRef}
                      onChange={(e) => setManualPaymentData({ ...manualPaymentData, transactionRef: e.target.value })}
                      className='w-full rounded-lg border border-gray-300 p-2.5 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500'
                      placeholder='TXN123...'
                    />
                  </div>
                </div>

                <div className='flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2'>
                  <span className='text-sm text-gray-600'>Final amount</span>
                  <span className='text-lg font-bold text-green-600'>
                    {formatCurrency(Math.max(manualPaymentData.amount - manualPaymentData.discount, 0))}
                  </span>
                </div>

                <button
                  type='button'
                  onClick={handleManualPayment}
                  disabled={loading}
                  className='w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50'
                >
                  {loading ? 'Recording...' : 'Record Payment'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
