/**
 * PageHeader Component
 * Provides consistent page title and action buttons layout
 * 
 * Usage:
 * <PageHeader 
 *   title="Customers" 
 *   description="Manage your business customers"
 *   actions={<Button onClick={openModal}>Add Customer</Button>}
 * />
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode; // Right-side action buttons
  subtitle?: React.ReactNode; // Additional content below title
  className?: string;
  divider?: boolean; // Show bottom border (default: true)
  breadcrumb?: React.ReactNode; // Breadcrumb component
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  subtitle,
  className,
  divider = true,
  breadcrumb,
}) => {
  return (
    <div className={cn('mb-6', className)}>
      {/* Breadcrumb */}
      {breadcrumb && <div className="mb-4">{breadcrumb}</div>}

      {/* Main Header */}
      <div className={cn('flex flex-col sm:flex-row sm:items-start sm:justify-between', divider && 'pb-6 border-b border-gray-200')}>
        {/* Title Section */}
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {description && <p className="mt-2 text-base text-gray-600">{description}</p>}
          {subtitle && <div className="mt-4">{subtitle}</div>}
        </div>

        {/* Actions Section */}
        {actions && <div className="mt-4 sm:mt-0 sm:ml-4 flex gap-2">{actions}</div>}
      </div>
    </div>
  );
};

export default PageHeader;
