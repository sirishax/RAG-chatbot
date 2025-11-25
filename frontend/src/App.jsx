import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HomePage from './components/HomePage';
import LandingPage from './components/LandingPage';
import ChatInterface from './components/ChatInterface';
import PDFUpload from './components/PDFUpload';
import ErrorMessage from './components/ErrorMessage';
import { usePDFUpload } from './hooks/usePDFUpload';
import { useChat } from './hooks/useChat';

function App() {
  const [currentPage, setCurrentPage] = useState('landing'); // 'landing', 'home', or 'app'
  const { uploadPDF, isUploading, uploadProgress, uploadError, pdfInfo } = usePDFUpload();
  const { messages, isLoading, error, sendMessage, clearError } = useChat();

  const handleGetStarted = () => {
    setCurrentPage('app');
  };

  const handleBackToHome = () => {
    setCurrentPage('landing');
  };

  const handleSwitchToSimple = () => {
    setCurrentPage('home');
  };

  const handleSwitchToFull = () => {
    setCurrentPage('landing');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <AnimatePresence mode="wait">
        {/* Landing Page - Full Featured */}
        {currentPage === 'landing' && (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
          >
            <LandingPage onGetStarted={handleGetStarted} />
            {/* Switch to Simple View Button */}
            <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSwitchToSimple}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 text-white hover:bg-white/20 transition-all flex items-center gap-2 shadow-lg text-sm sm:text-base"
              >
                <span>Simple View</span>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Home Page - Simplified Version */}
        {currentPage === 'home' && (
          <motion.div
            key="home"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
          >
            <HomePage onGetStarted={handleGetStarted} />
            {/* Switch to Full View Button */}
            <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleSwitchToFull}
                className="px-4 py-2 sm:px-6 sm:py-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 text-white hover:bg-white/20 transition-all flex items-center gap-2 shadow-lg text-sm sm:text-base"
              >
                <span>Full View</span>
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Chat Application */}
        {currentPage === 'app' && (
          <motion.div
            key="app"
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="min-h-screen"
          >
            {/* Navigation Bar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-white/10">
              <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex justify-between items-center">
                  {/* Logo */}
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center">
                      <span className="text-xl sm:text-2xl">🤖</span>
                    </div>
                    <div>
                      <span className="text-lg sm:text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                        ClarifyAI
                      </span>
                      <p className="text-xs text-gray-400 hidden sm:block">Intelligent PDF Assistant</p>
                    </div>
                  </div>

                  {/* Back Button */}
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleBackToHome}
                    className="px-3 py-2 sm:px-6 sm:py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 text-white hover:bg-white/20 transition-all flex items-center gap-1 sm:gap-2 text-sm sm:text-base"
                  >
                    <span>←</span>
                    <span className="hidden sm:inline">Back to Home</span>
                    <span className="sm:hidden">Back</span>
                  </motion.button>
                </div>
              </div>
            </nav>

            {/* Main Content */}
            <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8 pt-20 sm:pt-24 pb-20 sm:pb-8">
              <motion.div
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="text-center mb-4 sm:mb-8"
              >
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-2">
                  <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">ClarifyAI</span> Assistant
                </h1>
                <p className="text-gray-400 text-sm sm:text-base">Upload a PDF and start asking questions!</p>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 max-w-7xl mx-auto">
                {/* Upload Section */}
                <motion.div
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="lg:col-span-1 order-1 lg:order-1"
                >
                  <PDFUpload
                    onUpload={uploadPDF}
                    isUploading={isUploading}
                    uploadProgress={uploadProgress}
                    pdfInfo={pdfInfo}
                  />
                  {uploadError && (
                    <div className="mt-4">
                      <ErrorMessage message={uploadError} />
                    </div>
                  )}
                </motion.div>

                {/* Chat Section */}
                <motion.div
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="lg:col-span-2 order-2 lg:order-2 min-h-[60vh] lg:min-h-0"
                >
                  <ChatInterface
                    messages={messages}
                    onSendMessage={sendMessage}
                    isLoading={isLoading}
                    pdfInfo={pdfInfo}
                  />
                  {error && (
                    <div className="mt-4">
                      <ErrorMessage message={error} onClose={clearError} />
                    </div>
                  )}
                </motion.div>
              </div>
            </div>

            {/* Page Indicator */}
            {pdfInfo && (
              <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-40">
                <div className="px-3 py-2 sm:px-4 sm:py-2 bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 text-white text-xs sm:text-sm max-w-[200px] sm:max-w-none truncate">
                  📄 {pdfInfo.filename}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;