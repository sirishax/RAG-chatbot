export const formatMessage = (message) => {
    return message.trim().replace(/\s+/g, ' ');
};

export const handleError = (error) => {
    if (error.response) {
        return error.response.data.message || "An error occurred. Please try again.";
    } else if (error.request) {
        return "No response received from the server. Please check your connection.";
    } else {
        return "An unexpected error occurred: " + error.message;
    }
};

export const isValidPDF = (file) => {
    return file && file.type === 'application/pdf';
};

/**
 * Format file size to human-readable format
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size
 */
export const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Validate PDF file
 * @param {File} file - File to validate
 * @returns {Object} Validation result
 */
export const validatePDF = (file) => {
  const maxSize = 50 * 1024 * 1024; // 50MB
  
  if (!file) {
    return { valid: false, error: 'No file selected' };
  }
  
  if (file.type !== 'application/pdf') {
    return { valid: false, error: 'Please select a PDF file' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size exceeds 50MB limit' };
  }
  
  return { valid: true };
};

/**
 * Format timestamp to readable format
 * @param {Date} date - Date object
 * @returns {string} Formatted time
 */
export const formatTime = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Generate unique ID
 * @returns {string} Unique ID
 */
export const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} Debounced function
 */
export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};