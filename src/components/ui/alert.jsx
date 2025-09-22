import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, XCircle, X } from 'lucide-react';

const Alert = ({ 
  type = 'info', 
  title, 
  message, 
  onClose, 
  className = '',
  showIcon = true,
  variant = 'default'
}) => {
  const alertConfig = {
    success: {
      icon: CheckCircle,
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-200 dark:border-green-800',
      textColor: 'text-green-800 dark:text-green-200',
      iconColor: 'text-green-500 dark:text-green-400',
      iconBg: 'bg-green-100 dark:bg-green-900/40'
    },
    error: {
      icon: XCircle,
      bgColor: 'bg-red-50 dark:bg-red-900/20',
      borderColor: 'border-red-200 dark:border-red-800',
      textColor: 'text-red-800 dark:text-red-200',
      iconColor: 'text-red-500 dark:text-red-400',
      iconBg: 'bg-red-100 dark:bg-red-900/40'
    },
    warning: {
      icon: AlertCircle,
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
      borderColor: 'border-yellow-200 dark:border-yellow-800',
      textColor: 'text-yellow-800 dark:text-yellow-200',
      iconColor: 'text-yellow-500 dark:text-yellow-400',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/40'
    },
    info: {
      icon: Info,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-800 dark:text-blue-200',
      iconColor: 'text-blue-500 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40'
    }
  };

  const config = alertConfig[type];
  const Icon = config.icon;

  return (
    <motion.div 
      className={`rounded-xl border p-4 ${config.bgColor} ${config.borderColor} ${className} shadow-sm`}
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="flex items-start">
        {showIcon && (
          <motion.div 
            className={`rounded-full p-1 ${config.iconBg} mr-3 flex-shrink-0`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2, delay: 0.1 }}
          >
            <Icon className={`h-4 w-4 ${config.iconColor}`} />
          </motion.div>
        )}
        <div className="flex-1 min-w-0">
          {title && (
            <motion.h3 
              className={`text-sm font-semibold ${config.textColor} mb-1`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.2, delay: 0.1 }}
            >
              {title}
            </motion.h3>
          )}
          <motion.p 
            className={`text-sm ${config.textColor} leading-relaxed`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.15 }}
          >
            {message}
          </motion.p>
        </div>
        {onClose && (
          <motion.button
            onClick={onClose}
            className={`ml-3 ${config.textColor} hover:opacity-75 transition-opacity duration-200 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5`}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <X className="h-4 w-4" />
          </motion.button>
        )}
      </div>
    </motion.div>
  );
};

// Toast notification component
export const Toast = ({ 
  type = 'info', 
  message, 
  title,
  onClose, 
  duration = 5000,
  className = ''
}) => {
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <motion.div 
      className={`fixed top-4 right-4 z-50 max-w-sm ${className}`}
      initial={{ opacity: 0, x: 300, scale: 0.8 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 300, scale: 0.8 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Alert type={type} message={message} title={title} onClose={onClose} />
    </motion.div>
  );
};

// Success message component
export const SuccessAlert = ({ title, message, onClose, className }) => (
  <Alert type="success" title={title} message={message} onClose={onClose} className={className} />
);

// Error message component
export const ErrorAlert = ({ title, message, onClose, className }) => (
  <Alert type="error" title={title} message={message} onClose={onClose} className={className} />
);

// Warning message component
export const WarningAlert = ({ title, message, onClose, className }) => (
  <Alert type="warning" title={title} message={message} onClose={onClose} className={className} />
);

// Info message component
export const InfoAlert = ({ title, message, onClose, className }) => (
  <Alert type="info" title={title} message={message} onClose={onClose} className={className} />
);

export default Alert;