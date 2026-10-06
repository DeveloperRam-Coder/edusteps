import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

const ROUTE_LABELS: Record<string, string> = {
  '/': 'Home',
  '/dashboard': 'Dashboard',
  '/customers': 'Customers',
  '/add-customer': 'Add Customer',
  '/edit-customer': 'Edit Customer',
  '/customer-details': 'Customer Details',
  '/courses': 'Courses',
  '/add-course': 'Add Course',
  '/profile': 'Profile',
};

interface BreadcrumbProps {
  className?: string;
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ className }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathnames = location.pathname.split('/').filter((x) => x);

    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Home', path: '/dashboard' },
    ];

    pathnames.forEach((name, index) => {
      const routePath = '/' + pathnames.slice(0, index + 1).join('/');
      const label = ROUTE_LABELS[routePath] || name.charAt(0).toUpperCase() + name.slice(1);
      breadcrumbs.push({ label, path: routePath });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  if (breadcrumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-2 text-sm', className)}>
      {breadcrumbs.map((crumb, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
          {index === 0 ? (
            <button
              onClick={() => navigate(crumb.path || '/dashboard')}
              className="flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
            >
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">{crumb.label}</span>
            </button>
          ) : index === breadcrumbs.length - 1 ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <button
              onClick={() => navigate(crumb.path || '#')}
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              {crumb.label}
            </button>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;
