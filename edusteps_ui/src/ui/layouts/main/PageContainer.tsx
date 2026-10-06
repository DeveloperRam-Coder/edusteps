/**
 * PageContainer Component
 * Provides consistent page layout, padding, and max-width
 * 
 * Usage:
 * <PageContainer>
 *   <PageHeader title="Customers" />
 *   <div>Content</div>
 * </PageContainer>
 */

import React from 'react';
import { cn } from '@/lib/utils';

export interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | 'full'; // Default: lg
  noPadding?: boolean; // Don't add padding
  noMargin?: boolean; // Don't center with margin
}

const maxWidthClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  full: 'w-full',
};

export const PageContainer: React.FC<PageContainerProps> = ({
  children,
  className,
  maxWidth = 'lg',
  noPadding = false,
  noMargin = false,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col',
        !noPadding && 'px-4 sm:px-6 lg:px-8 py-6',
        !noMargin && 'mx-auto',
        maxWidthClasses[maxWidth],
        className
      )}
    >
      {children}
    </div>
  );
};

export default PageContainer;
