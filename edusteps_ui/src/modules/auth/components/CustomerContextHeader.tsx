import React, { useState } from 'react';
import { ArrowLeft, MessageCircle, Mail, Pencil, Trash2 } from 'lucide-react';
import EmailTemplateModal from './EmailTemplateModal';

export interface Customer {
  customer_id?: number;
  customerId?: number;
  id?: number;
  name?: string;
  first_name?: string;
  last_name?: string;
  status?: 'active' | 'inactive';
  created_at?: string;
  mobile?: string;
  email?: string;
  [key: string]: any;
}

interface CustomerContextHeaderProps {
  customer: Customer | null;
  onBack: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  loading?: boolean;
  showMenu?: boolean;
  businessName?: string;
}

export const CustomerContextHeader: React.FC<CustomerContextHeaderProps> = ({
  customer,
  onBack,
  onEdit,
  onDelete,
  loading = false,
  showMenu = true,
  businessName = 'EduSteps Coaching'
}) => {
  const [showEmailModal, setShowEmailModal] = useState(false);

  const getCustomerName = () => {
    if (!customer) return 'Loading...';
    return (
      customer.name ||
      `${customer.first_name || ''} ${customer.last_name || ''}`.trim() ||
      'Unknown Customer'
    );
  };

  const getCustomerStatus = () => {
    return customer?.status || 'active';
  };

  const statusColor = getCustomerStatus() === 'active' ? 'text-green-600' : 'text-gray-500';

  const handleWhatsApp = () => {
    const mobile = customer?.mobile || '';
    if (!mobile) {
      alert('No mobile number found for this customer.');
      return;
    }
    const digits = mobile.replace(/\D/g, '');
    const num = digits.startsWith('91') ? digits : `91${digits}`;
    const name = getCustomerName();
    const message = encodeURIComponent(
      `Hello ${name}! 👋\n\nThis is ${businessName}. We wanted to reach out regarding your enrollment. Please feel free to contact us for any queries.\n\nThank you!`
    );
    window.open(`https://wa.me/${num}?text=${message}`, '_blank');
  };

  return (
    <>
      <div className="mb-8 border-b border-gray-200 pb-6 dark:border-gray-800">
        <div className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <button
              type="button"
              onClick={onBack}
              title="Back"
              className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-3xl font-bold text-gray-900 dark:text-gray-100">
                {loading ? 'Loading...' : getCustomerName()}
              </h1>
            </div>
          </div>

          <div className="mt-1 flex shrink-0 items-center gap-1">
            {!loading && customer?.mobile && (
              <button
                type="button"
                onClick={handleWhatsApp}
                title="WhatsApp"
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-500 text-white shadow-sm transition-colors hover:bg-green-600"
                aria-label="WhatsApp"
              >
                <MessageCircle className="h-5 w-5" />
              </button>
            )}

            {!loading && (
              <button
                type="button"
                onClick={() => setShowEmailModal(true)}
                title="Email"
                className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500 text-white shadow-sm transition-colors hover:bg-blue-600"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </button>
            )}

            {showMenu && onEdit && (
              <button
                type="button"
                onClick={onEdit}
                title="Edit customer"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-gray-200 text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-800"
                aria-label="Edit customer"
              >
                <Pencil className="h-5 w-5" />
              </button>
            )}
            {showMenu && onDelete && (
              <button
                type="button"
                onClick={onDelete}
                title="Delete customer"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-200 text-red-600 transition-colors hover:bg-red-50 dark:border-red-900 dark:text-red-400 dark:hover:bg-red-950/40"
                aria-label="Delete customer"
              >
                <Trash2 className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {!loading && customer && (
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className={`text-sm font-medium ${statusColor}`} title="Status">
              {getCustomerStatus() === 'active' ? '●' : '○'} {getCustomerStatus().charAt(0).toUpperCase() + getCustomerStatus().slice(1)}
            </span>
            {customer.mobile && (
              <span className="text-sm text-gray-500 dark:text-gray-400" title={customer.mobile}>
                📱 {customer.mobile}
              </span>
            )}
            {customer.email && (
              <span className="truncate text-sm text-gray-500 dark:text-gray-400" title={customer.email}>
                ✉️ {customer.email}
              </span>
            )}
          </div>
        )}
      </div>

      <EmailTemplateModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        studentName={getCustomerName()}
        businessName={businessName}
      />
    </>
  );
};
