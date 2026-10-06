import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Plus, Users, CreditCard, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import styles from './QuickActions.module.css';

interface QuickAction {
  icon: React.ReactNode;
  label: string;
  description: string;
  path: string;
  color: string;
}

interface QuickActionsProps {
  actions?: QuickAction[];
  className?: string;
}

const DEFAULT_ACTIONS: QuickAction[] = [
  {
    icon: <Plus className="w-5 h-5" />,
    label: 'Add Customer',
    description: 'Create a new customer',
    path: '/customers',
    color: 'from-blue-500 to-blue-600',
  },
  {
    icon: <Users className="w-5 h-5" />,
    label: 'View Customers',
    description: 'Manage all customers',
    path: '/customers',
    color: 'from-purple-500 to-purple-600',
  },
  {
    icon: <CreditCard className="w-5 h-5" />,
    label: 'Payments',
    description: 'Manage payments',
    path: '/payment-details',
    color: 'from-orange-500 to-orange-600',
  },
  {
    icon: <Settings className="w-5 h-5" />,
    label: 'Profile',
    description: 'Update your profile',
    path: '/profile',
    color: 'from-green-500 to-green-600',
  },
];

const QuickActions: React.FC<QuickActionsProps> = ({
  actions = DEFAULT_ACTIONS,
  className,
}) => {
  const navigate = useNavigate();

  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4', className)}>
      {actions.map((action, index) => (
        <button
          key={index}
          onClick={() => navigate(action.path)}
          className={cn(styles.quickActionButton, 'group')}
          data-gradient={action.color}
        >
          {/* Background Animation */}
          <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Content */}
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex-1">
              <div className="bg-white/20 rounded-lg p-2.5 w-fit mb-3">
                {action.icon}
              </div>
              <h3 className="font-semibold text-sm mb-1">{action.label}</h3>
              <p className="text-xs opacity-90">{action.description}</p>
            </div>
            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 mt-1" />
          </div>
        </button>
      ))}
    </div>
  );
};

export default QuickActions;
