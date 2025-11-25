import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiCpu } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import SourceDocuments from './SourceDocuments';
import { formatTime } from '../utils/helpers';

/**
 * Individual chat message component with typing animation
 */
const ChatMessage = ({ message, isLast }) => {
  const [displayedContent, setDisplayedContent] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    if (message.type === 'ai' && isLast) {
      setIsTyping(true);
      let index = 0;
      const content = message.content;

      const interval = setInterval(() => {
        if (index < content.length) {
          setDisplayedContent(content.slice(0, index + 1));
          index++;
        } else {
          setIsTyping(false);
          clearInterval(interval);
        }
      }, 20);

      return () => clearInterval(interval);
    } else {
      setDisplayedContent(message.content);
    }
  }, [message, isLast]);

  const isUser = message.type === 'user';
  const isError = message.type === 'error';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
          isUser
            ? 'bg-gradient-to-br from-accent-purple to-accent-pink neon-glow-purple'
            : isError
            ? 'bg-red-500/20'
            : 'bg-gradient-to-br from-accent-cyan to-accent-purple neon-glow'
        }`}
      >
        {isUser ? (
          <FiUser className="text-white text-lg" />
        ) : (
          <FiCpu className="text-white text-lg" />
        )}
      </div>

      {/* Message Content */}
      <div className={`flex-1 space-y-2 ${isUser ? 'items-end' : 'items-start'} flex flex-col`}>
        <div
          className={`glass rounded-2xl p-4 max-w-[80%] ${
            isUser
              ? 'bg-gradient-to-br from-accent-purple/10 to-accent-pink/10 border-accent-purple/30'
              : isError
              ? 'bg-red-500/10 border-red-500/30'
              : 'border-gray-700/50'
          }`}
        >
          <div className="prose prose-invert prose-sm max-w-none">
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className="bg-dark-100 px-1.5 py-0.5 rounded text-accent-cyan" {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {displayedContent}
            </ReactMarkdown>
            {isTyping && (
              <span className="inline-block w-2 h-4 bg-accent-cyan animate-pulse ml-1" />
            )}
          </div>

          {/* Source Documents */}
          {message.sources && message.sources.length > 0 && (
            <SourceDocuments sources={message.sources} />
          )}
        </div>

        {/* Timestamp */}
        <span className="text-xs text-gray-500">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </motion.div>
  );
};

export default ChatMessage;