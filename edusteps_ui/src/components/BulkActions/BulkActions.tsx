import React from 'react';
import { Trash2, Mail, Download, CheckSquare, Square } from 'lucide-react';

interface BulkActionsProps {
  selectedItems: string[];
  totalItems: number;
  onSelectAll: (selected: boolean) => void;
  onBulkDelete: () => void;
  onBulkExport: () => void;
  onBulkEmail: () => void;
  loading?: boolean;
}

export const BulkActions: React.FC<BulkActionsProps> = ({
  selectedItems,
  totalItems,
  onSelectAll,
  onBulkDelete,
  onBulkExport,
  onBulkEmail,
  loading = false
}) => {
  const isAllSelected = selectedItems.length === totalItems && totalItems > 0;

  if (selectedItems.length === 0) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => onSelectAll(!isAllSelected)}
            className="flex items-center gap-2 text-blue-700 hover:text-blue-900"
            disabled={loading}
          >
            {isAllSelected ? (
              <CheckSquare className="h-5 w-5" />
            ) : (
              <Square className="h-5 w-5" />
            )}
            {isAllSelected ? 'Deselect All' : 'Select All'}
          </button>
          
          <span className="text-blue-700 font-medium">
            {selectedItems.length} customer{selectedItems.length !== 1 ? 's' : ''} selected
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onBulkEmail}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            title="Send bulk email"
          >
            <Mail className="h-4 w-4" />
            Email
          </button>
          
          <button
            onClick={onBulkExport}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            title="Export selected customers"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          
          <button
            onClick={onBulkDelete}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            title="Delete selected customers"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkActions;