import { createContext, useContext } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

export type NotificationContextType = {
  toast: (message: string, type?: ToastType, durationMs?: number) => void;
  confirm: (message: string, title?: string) => Promise<boolean>;
};

export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotification must be used within NotificationProvider');
  return ctx;
};
