import { AlertCircle, CheckCircle, DollarSign, HelpCircle, TrendingUp } from 'lucide-react';
import { formatCurrency, getPaymentStatusAppearance, normalizePaymentStatus, type PaymentStatus } from '@/lib/utils';

interface PaymentSummaryProps {
    courseFee: number;
    totalPaid: number;
    balanceDue: number;
    status: PaymentStatus | string;
    paymentCount: number;
}

export default function PaymentSummary({ courseFee, totalPaid, balanceDue, status, paymentCount }: PaymentSummaryProps) {
    const normalizedStatus = normalizePaymentStatus(status);

    const getStatusIcon = () => {
        switch (normalizedStatus) {
            case 'PAID': return <CheckCircle className="w-5 h-5" />;
            case 'PARTIAL': return <TrendingUp className="w-5 h-5" />;
            case 'UNPAID': return <AlertCircle className="w-5 h-5" />;
            case 'OVERPAID': return <DollarSign className="w-5 h-5" />;
            default: return <HelpCircle className="w-5 h-5" />;
        }
    };

    return (
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                    Payment Summary
                </h3>
                <span className={`px-3 py-1 rounded-full text-sm font-medium border flex items-center gap-1 ${getPaymentStatusAppearance(status)}`}>
                    {getStatusIcon()}
                    {normalizedStatus === 'UNKNOWN' ? 'Unknown' : normalizedStatus}
                </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Course Fee</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(courseFee)}</p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Total Paid</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Balance Due</p>
                    <p className={`text-2xl font-bold ${balanceDue > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                        {formatCurrency(Math.abs(balanceDue))}
                    </p>
                </div>

                <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-xs text-gray-600 mb-1">Payments Made</p>
                    <p className="text-2xl font-bold text-blue-600">{paymentCount}</p>
                </div>
            </div>

            {balanceDue > 0 && (
                <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800">
                        <strong>Note:</strong> {formatCurrency(balanceDue)} remaining to be paid
                    </p>
                </div>
            )}

            {balanceDue < 0 && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <p className="text-sm text-blue-800">
                        <strong>Overpaid:</strong> {formatCurrency(Math.abs(balanceDue))} excess payment
                    </p>
                </div>
            )}
        </div>
    );
}
