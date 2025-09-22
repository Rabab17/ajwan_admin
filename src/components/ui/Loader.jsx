import React from 'react';
import { motion } from 'framer-motion';

const Loader = ({ size = 'medium', className = '', variant = 'default' }) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12',
    xlarge: 'w-16 h-16'
  };

  const variants = {
    default: 'border-primary/20 border-t-primary',
    blue: 'border-blue-200 border-t-blue-600',
    green: 'border-green-200 border-t-green-600',
    purple: 'border-purple-200 border-t-purple-600',
    white: 'border-white/30 border-t-white'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div 
        className={`animate-spin rounded-full border-4 ${variants[variant]} ${sizeClasses[size]}`}
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
};

export const PageLoader = ({ message = 'جاري التحميل...', variant = 'default' }) => {
  return (
    <motion.div 
      className="flex flex-col items-center justify-center min-h-[400px] space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <Loader size="large" variant={variant} />
      </motion.div>
      <motion.p 
        className="text-muted-foreground text-lg font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {message}
      </motion.p>
    </motion.div>
  );
};

export const InlineLoader = ({ size = 'small', className = '', variant = 'default' }) => {
  return (
    <div className={`inline-flex items-center ${className}`}>
      <Loader size={size} variant={variant} />
    </div>
  );
};

export const ButtonLoader = ({ size = 'small', className = '' }) => {
  return (
    <div className={`inline-flex items-center ${className}`}>
      <Loader size={size} variant="white" />
    </div>
  );
};

export const CardLoader = ({ message = 'جاري التحميل...' }) => {
  return (
    <motion.div 
      className="flex flex-col items-center justify-center py-12 space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Loader size="medium" variant="default" />
      <p className="text-muted-foreground text-sm">{message}</p>
    </motion.div>
  );
};

export default Loader;
