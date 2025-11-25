import React from 'react';
import { motion } from 'framer-motion';
import { FiFile, FiExternalLink } from 'react-icons/fi';

/**
 * Source documents display component
 */
const SourceDocuments = ({ sources }) => {
  if (!sources || sources.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mt-3 space-y-2"
    >
      <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
        Sources
      </p>
      <div className="space-y-2">
        {sources.map((source, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass rounded-lg p-3 border border-gray-700/50 hover:border-accent-cyan/50 transition-all cursor-pointer group"
          >
            <div className="flex items-start gap-3">
              <FiFile className="text-accent-cyan text-lg flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-300 group-hover:text-white transition-colors truncate">
                  {source.source || source.metadata?.source || 'Unknown source'}
                </p>
                {source.page && (
                  <p className="text-xs text-gray-500 mt-1">
                    Page {source.page}
                  </p>
                )}
              </div>
              <FiExternalLink className="text-gray-500 group-hover:text-accent-cyan transition-colors flex-shrink-0" />
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default SourceDocuments;