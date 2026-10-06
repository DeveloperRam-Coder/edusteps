import React from 'react';
import { X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/ui/primitives/shadcn';

export interface CrudModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  type: 'create' | 'update' | 'delete' | 'view' | 'confirm';
  message?: string;
  loading?: boolean;
  error?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  destructive?: boolean;
  children?: React.ReactNode;
}

export const CrudModal: React.FC<CrudModalProps> = ({
  isOpen,
  title,
  description,
  type,
  message,
  loading = false,
  error,
  onConfirm,
  onCancel,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  destructive = false,
  children,
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    if (error) return <AlertCircle className="w-8 h-8 text-red-500" />;
    if (type === 'delete') return <AlertCircle className="w-8 h-8 text-orange-500" />;
    if (type === 'view') return <CheckCircle className="w-8 h-8 text-blue-500" />;
    return null;
  };

  const getColorScheme = () => {
    if (type === 'delete') return 'from-orange-500/10 to-red-500/10 border-orange-200';
    if (error) return 'from-red-500/10 to-red-500/10 border-red-200';
    return 'from-blue-500/10 to-blue-500/10 border-blue-200';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-card rounded-xl shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className={`bg-gradient-to-r ${getColorScheme()} border-b border-border px-4 py-3`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h2 className="text-sm font-bold text-foreground">{title}</h2>
              {description && (
                <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
              )}
            </div>
            <button
              onClick={onCancel}
              disabled={loading}
              className="ml-3 p-1 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
              title="Close"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Icon and Message */}
          {getIcon() && (
            <div className="flex flex-col items-center mb-4">
              <div className="mb-4">{getIcon()}</div>
              {message && (
                <p className="text-center text-gray-700 font-medium mb-4">
                  {message}
                </p>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Custom Content */}
          {children && <div className="mb-6">{children}</div>}

          {/* Success Message */}
          {!error && type !== 'delete' && type !== 'confirm' && !children && (
            <p className="text-center text-gray-700">
              {type === 'create' && 'Are you sure you want to create this item?'}
              {type === 'update' && 'Are you sure you want to update this item?'}
              {type === 'view' && 'View item details'}
            </p>
          )}

          {/* Delete Confirmation */}
          {type === 'delete' && !error && !children && (
            <div className="space-y-3">
              <p className="text-center text-gray-700 font-medium">
                This action cannot be undone.
              </p>
              <p className="text-center text-sm text-gray-600">
                {message || 'Are you sure you want to delete this item?'}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4 flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="px-6"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            variant={destructive || type === 'delete' ? 'destructive' : 'default'}
            className="px-6 gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
