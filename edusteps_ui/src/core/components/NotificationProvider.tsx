import { useState, ReactNode } from 'react';
import ToastContainer from '../../components/Toast/ToastContainer';
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal';
import { NotificationContext } from './NotificationContext';

// Re-export so existing imports from NotificationProvider keep working
export { useNotification } from './NotificationContext';

type ToastType = 'success' | 'error' | 'info' | 'warning';

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: ToastType }>>([]);
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    message?: string;
    title?: string;
    resolver?: (val: boolean) => void;
  }>({ open: false });

  const toast = (message: string, type: ToastType = 'info', durationMs = 4000) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setToasts((s) => [...s, { id, message, type }]);
    setTimeout(() => setToasts((s) => s.filter((t) => t.id !== id)), durationMs);
  };

  const confirm = (message: string, title?: string) =>
    new Promise<boolean>((resolve) => {
      setConfirmState({ open: true, message, title, resolver: resolve });
    });

  const handleConfirmClose = (ok: boolean) => {
    if (confirmState.resolver) confirmState.resolver(ok);
    setConfirmState({ open: false });
  };

  return (
    <NotificationContext.Provider value={{ toast, confirm }}>
      {children}
      <ToastContainer
        toasts={toasts}
        onDismiss={(id: string) => setToasts((s) => s.filter((t) => t.id !== id))}
      />
      <ConfirmModal
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message || ''}
        onClose={handleConfirmClose}
      />
    </NotificationContext.Provider>
  );
};
