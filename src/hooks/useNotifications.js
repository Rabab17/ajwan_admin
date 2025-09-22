import { useState, useCallback } from 'react';

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      type: 'info',
      duration: 5000,
      ...notification,
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto remove after duration
    if (newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }
    
    return id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods
  const showSuccess = useCallback((message, title = 'نجح!') => {
    return addNotification({ type: 'success', message, title });
  }, [addNotification]);

  const showError = useCallback((message, title = 'خطأ!') => {
    return addNotification({ type: 'error', message, title, duration: 8000 });
  }, [addNotification]);

  const showWarning = useCallback((message, title = 'تحذير!') => {
    return addNotification({ type: 'warning', message, title });
  }, [addNotification]);

  const showInfo = useCallback((message, title = 'معلومة') => {
    return addNotification({ type: 'info', message, title });
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAll,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };
};
