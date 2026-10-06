import React from 'react';
import { LockIcon } from 'lucide-react';

interface LockedCustomerFieldProps {
  customerId?: number | string;
  customerName: string;
  onNavigateToCustomer?: () => void;
  description?: string;
}

export const LockedCustomerField: React.FC<LockedCustomerFieldProps> = ({
  customerId,
  customerName,
  onNavigateToCustomer,
  description = 'Cannot change customer. Edit customer details separately.'
}) => {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Customer <span className="text-red-500">*</span>
      </label>

      <div className="relative">
        <div className="flex items-center gap-3 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed">
          <div className="flex-1">
            <p className="font-medium text-gray-900">{customerName}</p>
            {customerId && <p className="text-xs text-gray-500">ID: {customerId}</p>}
          </div>
          <LockIcon className="w-4 h-4 text-gray-500 flex-shrink-0" />
        </div>
      </div>

      <p className="text-xs text-gray-600">{description}</p>

      {onNavigateToCustomer && (
        <button
          type="button"
          onClick={onNavigateToCustomer}
          className="text-xs text-blue-600 hover:text-blue-800 underline"
        >
          View customer details
        </button>
      )}
    </div>
  );
};
