import { Calendar, CreditCard, Hash } from 'lucide-react';
import { getPaymentModeLabel } from '@/lib/utils';

interface Payment {
    id: string;
    amount: number;
    discount: number;
    date: string;
    mode: string | null;
    reference: string | null;
}

interface PaymentHistoryProps {
    payments: Payment[];
}

export default function PaymentHistory({ payments }: PaymentHistoryProps) {
    if (payments.length === 0) {
        return (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
                <p className="text-gray-500">No payment history available</p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Payment History</h3>
            </div>

            <div className="divide-y divide-gray-200">
                {payments.map((payment) => (
                    <div key={payment.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Calendar className="w-4 h-4" />
                                        <span className="text-sm">
                                            {new Date(payment.date).toLocaleDateString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric'
                                            })}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-2 text-gray-600">
                                        <CreditCard className="w-4 h-4" />
                                        <span className="text-sm">{getPaymentModeLabel(payment.mode)}</span>
                                    </div>

                                    {payment.reference && (
                                        <div className="flex items-center gap-2 text-gray-600">
                                            <Hash className="w-4 h-4" />
                                            <span className="text-sm font-mono">{payment.reference}</span>
                                        </div>
                                    )}
                                </div>

                                {payment.discount > 0 && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        Discount: ₹{payment.discount.toLocaleString()}
                                    </p>
                                )}
                            </div>

                            <div className="text-right">
                                <p className="text-lg font-bold text-green-600">
                                    ₹{payment.amount.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
