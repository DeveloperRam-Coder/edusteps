import { useAuth } from '@/auth/AuthContext';

export const usePermission = () => {
  const { user } = useAuth();

  const userRole = user?.role || 'user';

  return {
    // Customer permissions
    canViewCustomers: () => true,
    canCreateCustomer: () => ['admin', 'manager'].includes(userRole),
    canEditCustomer: () => ['admin', 'manager'].includes(userRole),
    canDeleteCustomer: () => userRole === 'admin',

    // Activity / Admin features
    canViewActivityLog: () => ['admin', 'manager'].includes(userRole),

    // Helper
    hasRole: (roles: string[]) => roles.includes(userRole),
    userRole: () => userRole
  };
};
