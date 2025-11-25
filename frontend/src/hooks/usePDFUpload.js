import { useState } from 'react';
import { uploadPDF } from '../services/api';
import { validatePDF } from '../utils/helpers';

/**
 * Custom hook for PDF upload functionality
 */
export const usePDFUpload = () => {
  const [uploadState, setUploadState] = useState({
    isUploading: false,
    progress: 0,
    error: null,
    success: false,
    uploadedFile: null,
  });

  const handleUpload = async (file) => {
    // Validate file
    const validation = validatePDF(file);
    if (!validation.valid) {
      setUploadState(prev => ({
        ...prev,
        error: validation.error,
      }));
      return;
    }

    // Reset state
    setUploadState({
      isUploading: true,
      progress: 0,
      error: null,
      success: false,
      uploadedFile: file,
    });

    try {
      // Upload with progress tracking
      const response = await uploadPDF(file, (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadState(prev => ({
          ...prev,
          progress,
        }));
      });

      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        success: true,
        error: null,
      }));

      return response;
    } catch (error) {
      setUploadState(prev => ({
        ...prev,
        isUploading: false,
        error: error.message,
        success: false,
      }));
      throw error;
    }
  };

  const resetUpload = () => {
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null,
      success: false,
      uploadedFile: null,
    });
  };

  return {
    ...uploadState,
    handleUpload,
    resetUpload,
  };
};