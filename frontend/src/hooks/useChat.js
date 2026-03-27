import { useState, useCallback } from 'react';
import { askQuestion } from '../services/api';
import { generateId } from '../utils/helpers';

/**
 * Custom hook for chat functionality
 */
export const useChat = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = useCallback(async (question) => {
    if (!question.trim()) return;

    // Add user message
    const userMessage = {
      id: generateId(),
      type: 'user',
      content: question,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      // Get AI response
      const response = await askQuestion(question);

      // Add AI message
      const aiMessage = {
        id: generateId(),
        type: 'ai',
        content: response.answer,
        sources: response.sources || [],
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (err) {
      const backendError = err?.message || 'Failed to get answer';
      setError(backendError);
      
      // Add error message
      const errorMessage = {
        id: generateId(),
        type: 'error',
        content: backendError,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearChat = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearChat,
  };
};