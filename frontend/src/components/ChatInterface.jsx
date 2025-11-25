import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiTrash2, FiMessageSquare } from 'react-icons/fi';
import ChatMessage from './ChatMessage';
import LoadingSpinner from './LoadingSpinner';
import { useChat } from '../hooks/useChat';

/**
 * Main chat interface component
 */
const ChatInterface = ({ isDisabled }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const { messages, isLoading, sendMessage, clearChat } = useChat();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading && !isDisabled) {
      sendMessage(input);
      setInput('');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[500px] sm:min-h-[600px]">
      {/* Header */}
      <div className="glass border-b border-gray-700/50 p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center neon-glow">
              <FiMessageSquare className="text-white text-base sm:text-lg" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-white">AI Assistant</h2>
              <p className="text-xs text-gray-400">
                {messages.length > 0 ? `${messages.length} messages` : 'Start a conversation'}
              </p>
            </div>
          </div>

          {messages.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={clearChat}
              className="p-2 rounded-lg hover:bg-dark-100 text-gray-400 hover:text-red-400 transition-all"
              title="Clear chat"
            >
              <FiTrash2 className="text-lg sm:text-xl" />
            </motion.button>
          )}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 bg-gradient-to-b from-transparent via-dark-200/20 to-transparent">
        {messages.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center h-full text-center space-y-4 sm:space-y-6 px-4"
          >
            <motion.div
              animate={{ 
                rotate: 360,
                scale: [1, 1.05, 1]
              }}
              transition={{ 
                rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
                scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
              }}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-accent-cyan via-accent-purple to-accent-cyan flex items-center justify-center neon-glow shadow-2xl"
            >
              <FiMessageSquare className="text-white text-3xl sm:text-4xl" />
            </motion.div>
            <div className="space-y-2 sm:space-y-3">
              <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 bg-gradient-to-r from-accent-cyan to-accent-purple bg-clip-text text-transparent">
                {isDisabled ? 'Upload a PDF to get started' : 'Ready to answer your questions'}
              </h3>
              <p className="text-gray-400 text-sm sm:text-base max-w-lg leading-relaxed">
                {isDisabled
                  ? 'Please upload a PDF document first, then you can start asking questions about its content.'
                  : 'Ask me anything about your uploaded document and I\'ll provide detailed answers with sources.'}
              </p>
            </div>
            
            {/* Suggested Questions */}
            {!isDisabled && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 w-full max-w-2xl mt-4 sm:mt-6\"
              >
                {[
                  'What is this document about?',
                  'Summarize the key points',
                  'What are the main findings?',
                  'Tell me more details'
                ].map((suggestion, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setInput(suggestion)}
                    className="glass p-3 sm:p-4 rounded-xl border border-gray-700/50 hover:border-accent-cyan/50 transition-all text-left group"
                  >
                    <p className="text-xs sm:text-sm text-gray-300 group-hover:text-white transition-colors">
                      {suggestion}
                    </p>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </motion.div>
        ) : (
          <AnimatePresence>
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                isLast={index === messages.length - 1}
              />
            ))}
          </AnimatePresence>
        )}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-4"
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center neon-glow">
              <FiMessageSquare className="text-white text-lg" />
            </div>
            <div className="glass rounded-2xl p-4 border-gray-700/50">
              <LoadingSpinner size="sm" />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="glass border-t border-gray-700/50 p-2 sm:p-3 md:p-6 bg-gradient-to-t from-dark-200/30 to-transparent">
        <form onSubmit={handleSubmit} className="flex gap-2 sm:gap-3 md:gap-4">
          <div className="flex-1 relative group">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isDisabled ? 'Upload PDF first...' : 'Ask a question...'}
              disabled={isDisabled || isLoading}
              rows={1}
              className="w-full bg-dark-100/80 backdrop-blur-sm border-2 border-gray-700 rounded-lg sm:rounded-xl md:rounded-2xl px-3 py-2.5 sm:px-4 sm:py-3 md:px-5 md:py-4 text-sm sm:text-base text-white placeholder-gray-500 focus:outline-none focus:border-accent-cyan focus:bg-dark-100 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed shadow-lg group-hover:border-gray-600"
              style={{ minHeight: '44px', maxHeight: '100px' }}
            />
            <div className="absolute right-2 bottom-1.5 sm:right-2 sm:bottom-2 md:right-3 md:bottom-3 text-xs text-gray-600">
              {input.length}/500
            </div>
          </div>

          <motion.button
            whileHover={{ scale: isDisabled || isLoading ? 1 : 1.05 }}
            whileTap={{ scale: isDisabled || isLoading ? 1 : 0.95 }}
            type="submit"
            disabled={isDisabled || isLoading || !input.trim()}
            className="px-3 py-2.5 sm:px-4 sm:py-3 md:px-8 md:py-4 bg-gradient-to-r from-accent-cyan via-accent-purple to-accent-cyan bg-size-200 bg-pos-0 hover:bg-pos-100 rounded-lg sm:rounded-xl md:rounded-2xl font-semibold text-white neon-glow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 shadow-xl disabled:shadow-none text-sm sm:text-base min-w-[44px] sm:min-w-[52px]"
          >
            <FiSend className="text-base sm:text-lg md:text-xl" />
            <span className="hidden sm:inline">Send</span>
          </motion.button>
        </form>

        <div className="flex flex-col sm:flex-row items-center justify-between mt-1.5 sm:mt-2 md:mt-3 px-1 gap-1 sm:gap-2">
          <p className="text-xs text-gray-500 text-center sm:text-left">
            <kbd className="px-1.5 py-0.5 sm:px-2 sm:py-1 bg-dark-100 rounded border border-gray-700 text-gray-400 text-xs">Enter</kbd> to send
          </p>
          {!isDisabled && (
            <p className="text-xs text-gray-600">
              Powered by Gemini AI ✨
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;