import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toast } from './Alert';

const NotificationContainer = ({ notifications, onRemove }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-3 max-w-sm">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification, index) => (
          <motion.div
            key={notification.id}
            layout
            initial={{ opacity: 0, x: 300, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 300, scale: 0.8 }}
            transition={{ 
              duration: 0.4, 
              ease: "easeOut",
              layout: { duration: 0.3 }
            }}
            style={{ zIndex: 1000 - index }}
          >
            <Toast
              type={notification.type}
              message={notification.message}
              title={notification.title}
              onClose={() => onRemove(notification.id)}
              duration={0} // We handle duration in the hook
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

export default NotificationContainer;
export { NotificationContainer };
