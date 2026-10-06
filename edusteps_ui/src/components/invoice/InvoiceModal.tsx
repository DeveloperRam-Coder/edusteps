import React, { useState } from 'react';
import { InvoiceData, generateInvoiceHTML, printInvoiceHTML } from '../../modules/auth/utils/invoiceEngine';
import { InvoiceTemplate } from './InvoiceTemplate';
import { Printer, Download, Share2, Mail, X, Sun, Moon, Check } from 'lucide-react';
import { toast } from 'sonner';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: InvoiceData;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, data }) => {
  const [isDarkModePreview, setIsDarkModePreview] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handlePrint = () => {
    const html = generateInvoiceHTML(data);
    printInvoiceHTML(html);
  };

  const handleDownloadPdf = async () => {
    try {
      toast.info('Preparing print-ready PDF...');
      const html = generateInvoiceHTML(data);
      printInvoiceHTML(html);
    } catch (e: any) {
      toast.error('Failed to generate PDF');
    }
  };

  const handleShareWhatsApp = () => {
    const mobile = String(data.customer.mobile || '').replace(/\D/g, '');
    if (!mobile) {
      toast.error('No mobile number available for customer');
      return;
    }
    const target = mobile.startsWith('91') ? mobile : `91${mobile}`;
    const text = encodeURIComponent(
      `Hello ${data.customer.name},\nHere is your invoice receipt from ${data.business.name}.\nInvoice #: ${data.invoiceNo}\nTotal Fee: ₹${data.payment.totalFee.toLocaleString('en-IN')}\nAmount Paid: ₹${data.payment.amountPaid.toLocaleString('en-IN')}\nBalance Due: ₹${data.payment.balanceDue.toLocaleString('en-IN')}\nDate: ${data.issueDate}\n\nThank you!`
    );
    window.open(`https://wa.me/${target}?text=${text}`, '_blank');
  };

  const handleSendEmail = () => {
    if (!data.customer.email) {
      toast.error('No email address available for customer');
      return;
    }
    const subject = encodeURIComponent(`Invoice Receipt #${data.invoiceNo} - ${data.business.name}`);
    const body = encodeURIComponent(
      `Dear ${data.customer.name},\n\nPlease find the invoice receipt details below:\nInvoice #: ${data.invoiceNo}\nStudent Name: ${data.student.name}\nCourse: ${data.student.subject || 'N/A'}\nTotal Amount: ₹${data.payment.totalFee.toLocaleString('en-IN')}\nPaid Amount: ₹${data.payment.amountPaid.toLocaleString('en-IN')}\nBalance Due: ₹${data.payment.balanceDue.toLocaleString('en-IN')}\nIssue Date: ${data.issueDate}\n\nRegards,\n${data.business.name}`
    );
    window.location.href = `mailto:${data.customer.email}?subject=${subject}&body=${body}`;
  };

  const handleCopySummary = () => {
    const text = `Invoice #${data.invoiceNo} | Billed to ${data.customer.name} | Paid: ₹${data.payment.amountPaid.toLocaleString('en-IN')} | Balance: ₹${data.payment.balanceDue.toLocaleString('en-IN')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Invoice summary copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-slate-100 dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden my-auto">
        
        {/* Action Header Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
              Invoice #{data.invoiceNo}
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">
              Preview
            </span>
          </div>

          {/* Buttons Toolbar */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsDarkModePreview(!isDarkModePreview)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors text-xs font-semibold flex items-center gap-1.5"
              title="Toggle preview theme"
            >
              {isDarkModePreview ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              <span className="hidden sm:inline">{isDarkModePreview ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>

            <button
              onClick={handleDownloadPdf}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Download className="w-4 h-4" /> Download PDF
            </button>

            <button
              onClick={handleShareWhatsApp}
              className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Share via WhatsApp"
            >
              <Share2 className="w-4 h-4" /> <span className="hidden sm:inline">WhatsApp</span>
            </button>

            <button
              onClick={handleSendEmail}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
              title="Email Invoice"
            >
              <Mail className="w-4 h-4" /> <span className="hidden sm:inline">Email</span>
            </button>

            <button
              onClick={handleCopySummary}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors"
              title="Copy Summary"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <span className="text-xs font-bold">Copy</span>}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Document Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 bg-slate-100 dark:bg-slate-950">
          <InvoiceTemplate data={data} isDarkMode={isDarkModePreview} />
        </div>
      </div>
    </div>
  );
};
