import React from 'react';
import { useAuth } from '@/auth/AuthContext';
import { cn } from '@/lib/utils';
import { ShieldAlert, BookOpen, User } from 'lucide-react';

interface UserRoleIndicatorProps {
  className?: string;
  showLabel?: boolean;
}

const roleConfig = {
  admin: {
    icon: ShieldAlert,
    label: 'Administrator',
    color: 'bg-red-100 text-red-700 border-red-300',
    description: 'Full system access and management',
  },
  instructor: {
    icon: BookOpen,
    label: 'Instructor',
    color: 'bg-blue-100 text-blue-700 border-blue-300',
    description: 'Course creation and student management',
  },
  user: {
    icon: User,
    label: 'User',
    color: 'bg-green-100 text-green-700 border-green-300',
    description: 'Student access to courses',
  },
};

const UserRoleIndicator: React.FC<UserRoleIndicatorProps> = ({ className, showLabel = true }) => {
  const { user } = useAuth();
  const role = (user?.role ?? 'user') as keyof typeof roleConfig;
  const config = roleConfig[role] ?? roleConfig.user;
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border', config.color)}
        title={config.description}
      >
        <Icon className="w-4 h-4" />
        {showLabel && <span className="text-sm font-medium">{config.label}</span>}
      </div>
    </div>
  );
};

export default UserRoleIndicator;
