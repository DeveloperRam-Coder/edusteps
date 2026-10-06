import React from 'react';
import { InvoiceData, formatCurrency, generateQRCodeSVG } from '../../modules/auth/utils/invoiceEngine';
import { CheckCircle2, Clock, AlertTriangle, Building2, User, BookOpen, ShieldCheck } from 'lucide-react';

interface InvoiceTemplateProps {
  data: InvoiceData;
  isDarkMode?: boolean;
}

export const InvoiceTemplate: React.FC<InvoiceTemplateProps> = ({ data, isDarkMode = false }) => {
  const getBadge = () => {
    switch (data.status) {
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" /> PAID
          </span>
        );
      case 'PARTIAL':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5" /> PARTIAL
          </span>
        );
      case 'OVERDUE':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <AlertTriangle className="w-3.5 h-3.5" /> OVERDUE
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            UNPAID
          </span>
        );
    }
  };

  const upiId = data.business.bankDetails?.upiId || 'edusteps@upi';
  const upiUrl = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(data.business.name)}&am=${data.payment.balanceDue || data.payment.amountPaid}&cu=INR`;
  const qrSvg = generateQRCodeSVG(upiUrl, 96);

  return (
    <div className={`w-full max-w-[800px] mx-auto p-6 md:p-10 rounded-2xl shadow-xl border transition-colors duration-200 ${
      isDarkMode 
        ? 'bg-slate-900 text-slate-100 border-slate-800 shadow-slate-950/50' 
        : 'bg-white text-slate-900 border-slate-200 shadow-slate-200/50'
    }`}>
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 pb-6 border-b-2 border-blue-600 dark:border-blue-500">
        <div>
          <div className="flex items-center gap-2 text-2xl font-extrabold text-blue-700 dark:text-blue-400 tracking-tight">
            <Building2 className="w-7 h-7 text-blue-600 dark:text-blue-400" />
            <span>{data.business.name}</span>
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
            {data.business.address && <div>{data.business.address}</div>}
            <div>
              {data.business.email && <span>Email: {data.business.email}</span>}
              {data.business.phone && <span className="ml-2">| Phone: {data.business.phone}</span>}
            </div>
            {data.business.gstin && <div className="font-semibold text-slate-600 dark:text-slate-300">GSTIN: {data.business.gstin}</div>}
          </div>
        </div>

        <div className="sm:text-right">
          <div className="text-3xl font-black tracking-wider text-slate-900 dark:text-slate-100">INVOICE</div>
          <div className="text-sm font-bold text-blue-600 dark:text-blue-400 mt-0.5">#{data.invoiceNo}</div>
          <div className="mt-2">{getBadge()}</div>
        </div>
      </div>

      {/* Date & Reference Meta Bar */}
      <div className={`my-6 p-3 rounded-xl border flex flex-wrap justify-between items-center gap-3 text-xs ${
        isDarkMode ? 'bg-blue-950/40 border-blue-900/50 text-blue-200' : 'bg-blue-50 border-blue-100 text-blue-900'
      }`}>
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-blue-600 dark:text-blue-400">Issue Date:</span>
          <span className="font-bold">{data.issueDate}</span>
        </div>
        {data.dueDate && (
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-blue-600 dark:text-blue-400">Due Date:</span>
            <span className="font-bold">{data.dueDate}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-blue-600 dark:text-blue-400">Payment Mode:</span>
          <span className="font-bold">{data.payment.paymentMode || 'Online / UPI'}</span>
        </div>
        {data.payment.transactionRef && (
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-blue-600 dark:text-blue-400">Ref No:</span>
            <span className="font-bold font-mono">{data.payment.transactionRef}</span>
          </div>
        )}
      </div>

      {/* Grid Cards (Bill To & Student Details) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            <User className="w-3.5 h-3.5 text-blue-500" /> Billed To (Parent / Client)
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-slate-100">{data.customer.name}</div>
          {data.customer.mobile && <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">📞 {data.customer.mobile}</div>}
          {data.customer.email && <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">✉ {data.customer.email}</div>}
          {data.customer.address && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">📍 {data.customer.address}</div>}
        </div>

        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-800/60 border-slate-700/80' : 'bg-slate-50 border-slate-100'}`}>
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> Student & Course Details
          </div>
          <div className="text-base font-bold text-slate-900 dark:text-slate-100">{data.student.name}</div>
          <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">Subject: <span className="font-semibold text-slate-900 dark:text-slate-100">{data.student.subject || 'N/A'}</span></div>
          {data.student.milestone && <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">Milestone: <span className="font-semibold text-blue-600 dark:text-blue-400">{data.student.milestone}</span></div>}
          {data.student.cdId && <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Reg ID: #{data.student.cdId}</div>}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto mb-6 rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className={isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}>
              <th className="py-2.5 px-3 text-center text-[11px] font-bold uppercase tracking-wider w-10">#</th>
              <th className="py-2.5 px-3 text-[11px] font-bold uppercase tracking-wider">Description</th>
              <th className="py-2.5 px-3 text-center text-[11px] font-bold uppercase tracking-wider w-16">Qty</th>
              <th className="py-2.5 px-3 text-right text-[11px] font-bold uppercase tracking-wider w-28">Unit Price</th>
              <th className="py-2.5 px-3 text-right text-[11px] font-bold uppercase tracking-wider w-24">Discount</th>
              <th className="py-2.5 px-3 text-right text-[11px] font-bold uppercase tracking-wider w-28">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {data.items.map((item, index) => (
              <tr key={index} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <td className="py-3 px-3 text-center text-xs text-slate-400">{index + 1}</td>
                <td className="py-3 px-3">
                  <div className="font-semibold text-sm text-slate-900 dark:text-slate-100">{item.description}</div>
                  {item.hsnSac && <div className="text-xs text-slate-400">HSN/SAC: {item.hsnSac}</div>}
                </td>
                <td className="py-3 px-3 text-center text-xs font-medium text-slate-600 dark:text-slate-300">{item.qty}</td>
                <td className="py-3 px-3 text-right text-xs font-medium tabular-nums text-slate-600 dark:text-slate-300">{formatCurrency(item.unitPrice)}</td>
                <td className="py-3 px-3 text-right text-xs font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                  {item.discount ? `-${formatCurrency(item.discount)}` : '—'}
                </td>
                <td className="py-3 px-3 text-right text-xs font-bold tabular-nums text-slate-900 dark:text-slate-100">{formatCurrency(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        <div className={`md:col-span-7 p-4 rounded-xl border flex items-center gap-4 ${
          isDarkMode ? 'bg-slate-800/50 border-slate-800' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="bg-white p-1.5 rounded-lg border border-slate-300 shrink-0 shadow-sm"
               dangerouslySetInnerHTML={{ __html: qrSvg }} />
          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> Instant UPI Scan & Pay
            </div>
            <div>UPI ID: <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{upiId}</span></div>
            {data.business.bankDetails?.bankName && (
              <div>Bank: {data.business.bankDetails.bankName} | A/C: {data.business.bankDetails.accountNumber}</div>
            )}
            <div className="text-[10px] text-slate-400">Supported by GPay, PhonePe, Paytm, BHIM</div>
          </div>
        </div>

        <div className="md:col-span-5 space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400 py-1">
            <span>Subtotal Fee</span>
            <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-200">{formatCurrency(data.payment.totalFee)}</span>
          </div>
          {!!data.payment.discountTotal && (
            <div className="flex justify-between items-center text-xs text-emerald-600 dark:text-emerald-400 py-1">
              <span>Discount</span>
              <span className="font-semibold tabular-nums">-{formatCurrency(data.payment.discountTotal)}</span>
            </div>
          )}
          {!!data.payment.taxTotal && (
            <div className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-400 py-1">
              <span>GST / Tax</span>
              <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-200">{formatCurrency(data.payment.taxTotal)}</span>
            </div>
          )}
          <div className="flex justify-between items-center text-sm font-bold text-slate-900 dark:text-slate-100 pt-2 border-t border-slate-200 dark:border-slate-800">
            <span>Total Fee</span>
            <span className="tabular-nums">{formatCurrency(data.payment.totalFee - (data.payment.discountTotal || 0))}</span>
          </div>
          <div className="flex justify-between items-center text-xs font-semibold text-emerald-600 dark:text-emerald-400 py-1">
            <span>Total Paid to Date</span>
            <span className="tabular-nums">{formatCurrency(data.payment.amountPaid)}</span>
          </div>
          <div className="flex justify-between items-center text-sm font-extrabold p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 mt-1">
            <span>Balance Due</span>
            <span className="tabular-nums text-base">{formatCurrency(data.payment.balanceDue)}</span>
          </div>
        </div>
      </div>

      {/* Footer Notes */}
      <div className="mt-8 pt-4 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row justify-between items-end gap-4 text-xs text-slate-400">
        <div>
          <p>Thank you for choosing <strong>{data.business.name}</strong>.</p>
          <p className="text-[11px] mt-0.5">This is a computer-generated invoice. No physical signature required.</p>
        </div>
        <div className="text-right">
          <div className="w-32 border-b border-slate-400 dark:border-slate-600 mb-1 inline-block" />
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Authorized Signatory</div>
        </div>
      </div>
    </div>
  );
};
