import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, Clock, Trash2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ActivityItem {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  description?: string;
  timestamp?: Date;
}

interface ActivityLogProps {
  className?: string;
  maxItems?: number;
}

const ActivityLog: React.FC<ActivityLogProps> = ({ className, maxItems = 5 }) => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem('activity_log');
    if (stored) {
      try {
        setActivities(JSON.parse(stored).slice(0, maxItems));
      } catch {
        localStorage.removeItem('activity_log');
      }
    }
  }, [maxItems]);

  const removeActivity = (id: string) => {
    const updated = activities.filter((a) => a.id !== id);
    setActivities(updated);
    localStorage.setItem('activity_log', JSON.stringify(updated));
  };

  const clearAll = () => {
    setActivities([]);
    localStorage.removeItem('activity_log');
  };

  const typeConfig = {
    success: { icon: CheckCircle2, color: 'text-green-600 bg-green-50' },
    warning: { icon: AlertCircle, color: 'text-yellow-600 bg-yellow-50' },
    info: { icon: Clock, color: 'text-blue-600 bg-blue-50' },
    error: { icon: AlertCircle, color: 'text-red-600 bg-red-50' },
  };

  if (activities.length === 0) return null;

  return (
    <div className={cn('bg-card rounded-lg border border-border p-4', className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-foreground">Recent Activity</h3>
        <button
          onClick={clearAll}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          title="Clear activity log"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {activities.map((activity) => {
          const config = typeConfig[activity.type];
          const Icon = config.icon;
          return (
            <div
              key={activity.id}
              className={cn('flex items-start gap-3 p-3 rounded-lg', config.color)}
            >
              <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{activity.title}</p>
                {activity.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{activity.description}</p>
                )}
                {activity.timestamp && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(activity.timestamp).toLocaleTimeString()}
                  </p>
                )}
              </div>
              <button
                onClick={() => removeActivity(activity.id)}
                className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ActivityLog;
