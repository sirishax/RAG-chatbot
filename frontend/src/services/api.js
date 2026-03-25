import axios from 'axios';

const normalizeApiBaseUrl = (value) => {
  if (!value) {
    return '';
  }

  return value.trim().replace(/\/+$/, '').replace(/\/api$/, '');
};

const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5 minutes for large files
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
});

/**
 * Upload PDF file to the server
 * @param {File} file - PDF file to upload
 * @param {Function} onUploadProgress - Progress callback
 * @returns {Promise} Response data
 */
export const uploadPDF = async (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file, file.name);

  try {
    const response = await api.post('/api/upload', formData, {
      onUploadProgress,
      timeout: 300000, // 5 minutes
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to upload PDF');
  }
};

/**
 * Ask a question to the RAG system
 * @param {string} question - User's question
 * @returns {Promise} Response with answer and sources
 */
export const askQuestion = async (question) => {
  try {
    const response = await api.post('/api/ask', { question }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.error || 'Failed to get answer');
  }
};

/**
 * Check if vector database is ready
 * @returns {Promise} Status response
 */
export const checkStatus = async () => {
  try {
    const response = await api.get('/api/status', {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.data;
  } catch (error) {
    throw new Error('Failed to check status');
  }
};

export default api;
