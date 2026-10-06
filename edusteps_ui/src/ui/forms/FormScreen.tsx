/**
 * FormScreen Component
 * Standardized form layout wrapper combining PageContainer, PageHeader, and form handling
 * Works seamlessly with useForm + useValidation + useApi hooks
 * 
 * Usage:
 * <FormScreen
 *   title="Add Customer"
 *   description="Create a new customer"
 *   onCancel={() => navigate(-1)}
 *   isLoading={false}
 * >
 *   <FormField ... />
 *   <FormField ... />
 * </FormScreen>
 */

import React from 'react';
import { PageContainer, PageHeader } from '@/ui/layouts/main';
import { Button } from '@/ui/primitives/shadcn';
import { cn } from '@/lib/utils';

export interface FormScreenProps {
  children: React.ReactNode;
  title: string;
  description?: string;
  onCancel?: () => void;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showDivider?: boolean;
  breadcrumb?: React.ReactNode;
}

export const FormScreen: React.FC<FormScreenProps> = ({
  children,
  title,
  description,
  onCancel,
  onSubmit,
  isLoading = false,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  className,
  maxWidth = 'md',
  showDivider = true,
  breadcrumb,
}) => {
  return (
    <PageContainer maxWidth={maxWidth}>
      {/* Page Header */}
      <PageHeader
        title={title}
        description={description}
        breadcrumb={breadcrumb}
        divider={showDivider}
      />

      {/* Form */}
      <form onSubmit={onSubmit} className={cn('space-y-6', className)}>
        {/* Form Fields */}
        <div className="space-y-5">{children}</div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelLabel}
            </Button>
          )}
          <Button type="submit" disabled={isLoading}>
            {isLoading ? `${submitLabel}...` : submitLabel}
          </Button>
        </div>
      </form>
    </PageContainer>
  );
};

export default FormScreen;
