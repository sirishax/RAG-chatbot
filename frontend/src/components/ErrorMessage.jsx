import React from 'react';
import { motion } from 'framer-motion';
import { MdError, MdClose } from 'react-icons/md';

/**
 * Error message component with dismiss functionality
 */
const ErrorMessage = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="glass rounded-xl p-4 border border-red-500/30 bg-red-500/10"
    >
      <div className="flex items-start gap-3">
        <MdError className="text-red-500 text-xl flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-red-400 text-sm">{message}</p>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <MdClose className="text-xl" />
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default ErrorMessage;