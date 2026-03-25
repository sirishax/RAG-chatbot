import React, { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { FiUploadCloud, FiFile, FiCheck, FiX } from 'react-icons/fi';
import { usePDFUpload } from '../hooks/usePDFUpload';
import { formatFileSize } from '../utils/helpers';
import LoadingSpinner from './LoadingSpinner';
import ErrorMessage from './ErrorMessage';

/**
 * PDF Upload component with drag-and-drop support
 */
const PDFUpload = ({ onUploadSuccess }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const { isUploading, progress, error, success, uploadedFile, handleUpload, resetUpload } = usePDFUpload();

  const handleFileSelect = async (file) => {
    try {
      const response = await handleUpload(file);
      if (onUploadSuccess) {
        onUploadSuccess(response?.data || { filename: file.name });
      }
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  return (
    <div className="w-full space-y-3 sm:space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`glass rounded-xl sm:rounded-2xl p-4 sm:p-8 border-2 transition-all duration-300 ${
          isDragging
            ? 'border-accent-cyan neon-glow'
            : success
            ? 'border-green-500/50'
            : error
            ? 'border-red-500/50'
            : 'border-gray-700'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {!isUploading && !success && (
          <div
            onClick={handleClick}
            className="cursor-pointer flex flex-col items-center justify-center space-y-3 sm:space-y-4 text-center"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-accent-cyan"
            >
              <FiUploadCloud className="text-5xl sm:text-6xl" />
            </motion.div>
            
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-white mb-1 sm:mb-2">
                Upload Your PDF Document
              </h3>
              <p className="text-gray-400 text-xs sm:text-sm">
                Drag and drop your PDF here, or click to browse
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Maximum file size: 50MB
              </p>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 sm:px-6 sm:py-3 bg-gradient-to-r from-accent-cyan to-accent-purple rounded-lg sm:rounded-xl font-semibold text-white neon-glow transition-all text-sm sm:text-base"
            >
              Choose File
            </motion.button>
          </div>
        )}

        {isUploading && (
          <div className="flex flex-col items-center justify-center space-y-3 sm:space-y-4">
            <LoadingSpinner size="lg" />
            <div className="w-full max-w-md">
              <div className="flex justify-between text-xs sm:text-sm text-gray-400 mb-2">
                <span>Uploading...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-2 bg-dark-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-gradient-to-r from-accent-cyan to-accent-purple"
                />
              </div>
            </div>
            {uploadedFile && (
              <p className="text-gray-400 text-sm">
                {uploadedFile.name} ({formatFileSize(uploadedFile.size)})
              </p>
            )}
          </div>
        )}

        {success && uploadedFile && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center">
              <FiCheck className="text-green-500 text-3xl" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">
                Upload Successful!
              </h3>
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <FiFile />
                <span>{uploadedFile.name}</span>
                <span>({formatFileSize(uploadedFile.size)})</span>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={resetUpload}
              className="px-6 py-2 bg-dark-100 hover:bg-dark-200 rounded-xl text-white transition-all"
            >
              Upload Another
            </motion.button>
          </motion.div>
        )}
      </motion.div>

      {error && (
        <ErrorMessage
          message={error}
          onDismiss={resetUpload}
        />
      )}
    </div>
  );
};

export default PDFUpload;
