import { useState } from 'react';

export interface CrudNotification {
  isOpen: boolean;
  type: 'success' | 'error' | 'confirm' | 'info';
  title: string;
  message: string;
  action?: () => void | Promise<void>;
  onClose?: () => void;
}

export const useCrudNotification = () => {
  const [notification, setNotification] = useState<CrudNotification>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
  });

  const showSuccess = (title: string, message: string) => {
    setNotification({
      isOpen: true,
      type: 'success',
      title,
      message,
    });
  };

  const showError = (title: string, message: string) => {
    setNotification({
      isOpen: true,
      type: 'error',
      title,
      message,
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    action: () => void | Promise<void>
  ) => {
    setNotification({
      isOpen: true,
      type: 'confirm',
      title,
      message,
      action,
    });
  };

  const showInfo = (title: string, message: string) => {
    setNotification({
      isOpen: true,
      type: 'info',
      title,
      message,
    });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isOpen: false }));
  };

  return {
    notification,
    showSuccess,
    showError,
    showConfirm,
    showInfo,
    closeNotification,
  };
};
