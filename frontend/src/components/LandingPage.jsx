import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FaFilePdf, 
  FaRobot, 
  FaBrain, 
  FaRocket, 
  FaArrowRight, 
  FaGithub,
  FaLinkedin,
  FaCheckCircle
} from 'react-icons/fa';
import { 
  HiSparkles, 
  HiLightningBolt, 
  HiShieldCheck,
  HiChartBar,
  HiClock,
  HiCloud
} from 'react-icons/hi';
import { 
  MdSecurity, 
  MdSpeed, 
  MdCloudUpload,
  MdAutoAwesome
} from 'react-icons/md';

const LandingPage = ({ onGetStarted }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const features = [
    {
      icon: <FaFilePdf className="text-4xl" />,
      title: "PDF Intelligence",
      description: "Upload any PDF document and get instant insights. Support for multi-page documents up to 50MB.",
      color: "from-red-500 to-orange-500"
    },
    {
      icon: <FaBrain className="text-4xl" />,
      title: "AI-Powered Analysis",
      description: "Powered by Groq and advanced RAG technology for accurate, context-aware responses.",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: <HiLightningBolt className="text-4xl" />,
      title: "Lightning Fast",
      description: "Vector-based search with FAISS ensures quick retrieval of relevant information from your documents.",
      color: "from-cyan-500 to-blue-500"
    },
    {
      icon: <HiShieldCheck className="text-4xl" />,
      title: "Source Citations",
      description: "Every answer includes source references with page numbers for complete transparency and accuracy.",
      color: "from-green-500 to-emerald-500"
    }
  ];

  const stats = [
    { value: "99.9%", label: "Accuracy Rate", icon: <HiChartBar /> },
    { value: "<3s", label: "Response Time", icon: <HiClock /> },
    { value: "50MB", label: "Max PDF Size", icon: <HiCloud /> },
    { value: "24/7", label: "Available", icon: <MdAutoAwesome /> }
  ];

  const benefits = [
    { icon: <MdSecurity />, text: "Secure & Private" },
    { icon: <MdSpeed />, text: "Lightning Fast" },
    { icon: <MdCloudUpload />, text: "Easy Upload" },
    { icon: <FaCheckCircle />, text: "Accurate Results" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute w-96 h-96 bg-purple-500 rounded-full filter blur-3xl opacity-20"
          animate={{
            x: mousePosition.x / 20,
            y: mousePosition.y / 20,
          }}
          transition={{ type: "spring", stiffness: 50 }}
          style={{ top: '10%', left: '10%' }}
        />
        <motion.div
          className="absolute w-96 h-96 bg-cyan-500 rounded-full filter blur-3xl opacity-20"
          animate={{
            x: -mousePosition.x / 30,
            y: -mousePosition.y / 30,
          }}
          transition={{ type: "spring", stiffness: 50 }}
          style={{ bottom: '10%', right: '10%' }}
        />
        <motion.div
          className="absolute w-64 h-64 bg-pink-500 rounded-full filter blur-3xl opacity-10"
          animate={{
            x: mousePosition.x / 40,
            y: -mousePosition.y / 40,
          }}
          transition={{ type: "spring", stiffness: 50 }}
          style={{ top: '50%', left: '50%' }}
        />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 container mx-auto px-6 py-6">
        <div className="flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
              <FaRobot className="text-2xl" />
            </div>
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
                ClarifyAI
              </span>
              <p className="text-xs text-gray-400">Intelligent PDF Assistant</p>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            <div className="hidden md:flex gap-6 mr-4">
              <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
              <a href="#how-it-works" className="hover:text-cyan-400 transition-colors">How It Works</a>
            </div>
            <div className="flex gap-2">
              <a href="https://github.com/sirishax" target="_blank" rel="noopener noreferrer" 
                 className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white/20 transition-all">
                <FaGithub className="text-xl" />
              </a>
              <a href="https://www.linkedin.com/in/sirishar1/" target="_blank" rel="noopener noreferrer"
                 className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white/20 transition-all">
                <FaLinkedin className="text-xl" />
              </a>
            </div>
          </motion.div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-6 pt-20 pb-32">
        <div className="max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6 border border-white/20">
              <HiSparkles className="text-yellow-400" />
              <span className="text-sm">🎉 Now with GPT-4 Level Intelligence</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-bold mb-6 leading-tight">
              Clarify Your PDFs
              <span className="block mt-2 bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent animate-gradient">
                With AI Precision
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto leading-relaxed">
              Upload your documents, ask questions in natural language, and get instant AI-powered answers with source citations. 
              <span className="text-cyan-400 font-semibold"> No more endless scrolling.</span>
            </p>

            {/* Single CTA Button */}
            <div className="flex justify-center mb-12">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onGetStarted}
                className="group px-12 py-6 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl font-bold text-xl flex items-center justify-center gap-3 hover:shadow-2xl hover:shadow-purple-500/50 transition-all"
              >
                Let's Get Started
                <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>

            {/* Benefits Pills */}
            <div className="flex flex-wrap gap-3 justify-center">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm rounded-full border border-white/10"
                >
                  <span className="text-cyan-400">{benefit.icon}</span>
                  <span className="text-sm">{benefit.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-20"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + index * 0.1 }}
                whileHover={{ scale: 1.05, y: -5 }}
                className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-cyan-500/50 transition-all group"
              >
                <div className="text-4xl mb-3 text-cyan-400 group-hover:scale-110 transition-transform">
                  {stat.icon}
                </div>
                <div className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-400 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative z-10 container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 backdrop-blur-sm rounded-full mb-6 border border-cyan-500/20">
            <HiSparkles className="text-cyan-400" />
            <span className="text-sm text-cyan-400">POWERFUL FEATURES</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold mb-4">
            Everything You Need
          </h2>
          <p className="text-gray-400 text-xl max-w-2xl mx-auto">
            Unlock the full potential of your documents with our cutting-edge AI technology
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="group relative bg-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10 hover:border-white/20 transition-all overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-r ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
              
              <div className={`inline-flex p-4 bg-gradient-to-r ${feature.color} rounded-2xl mb-6 shadow-lg`}>
                {feature.icon}
              </div>

              <h3 className="text-2xl font-bold mb-3">{feature.title}</h3>
              <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              
              <div className="mt-6 flex items-center gap-2 text-cyan-400 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                Learn more <FaArrowRight className="text-sm" />
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="relative z-10 container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 backdrop-blur-sm rounded-full mb-6 border border-purple-500/20">
            <FaRocket className="text-purple-400" />
            <span className="text-sm text-purple-400">SIMPLE PROCESS</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-bold mb-4">
            Get Started in 3 Steps
          </h2>
          <p className="text-gray-400 text-xl">
            It's as easy as 1, 2, 3
          </p>
        </motion.div>

        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                step: "1", 
                title: "Upload PDF", 
                desc: "Drag and drop or click to upload your PDF document. We support files up to 50MB.",
                icon: <MdCloudUpload />,
                color: "from-cyan-500 to-blue-500"
              },
              { 
                step: "2", 
                title: "AI Processing", 
                desc: "Our advanced AI analyzes and indexes your document content in seconds using RAG technology.",
                icon: <FaBrain />,
                color: "from-purple-500 to-pink-500"
              },
              { 
                step: "3", 
                title: "Ask Questions", 
                desc: "Start chatting naturally and get instant, accurate answers with source citations.",
                icon: <HiSparkles />,
                color: "from-pink-500 to-red-500"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
                className="relative"
              >
                <div className="text-center">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className={`w-20 h-20 bg-gradient-to-r ${item.color} rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-2xl`}
                  >
                    {item.icon}
                  </motion.div>
                  <div className="text-sm text-gray-500 mb-2">Step {item.step}</div>
                  <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{item.desc}</p>
                </div>
                
                {index < 2 && (
                  <div className="hidden md:block absolute top-10 -right-4 text-4xl text-cyan-500/30">
                    →
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 container mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-4xl mx-auto bg-gradient-to-r from-cyan-500/20 via-purple-500/20 to-pink-500/20 backdrop-blur-sm rounded-3xl p-16 border border-white/10 text-center relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 opacity-5"></div>
          
          <FaRocket className="text-7xl mx-auto mb-6 text-cyan-400" />
          <h2 className="text-5xl md:text-6xl font-bold mb-6">
            Ready to Transform Your Workflow?
          </h2>
          <p className="text-gray-300 text-2xl mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of professionals who are already using ClarifyAI to work smarter. 
            Start today—completely free!
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onGetStarted}
            className="px-14 py-7 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-2xl font-bold text-2xl hover:shadow-2xl hover:shadow-purple-500/50 transition-all"
          >
            Launch ClarifyAI Now →
          </motion.button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-white/10 mt-20">
        <div className="container mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <FaRobot className="text-3xl text-cyan-400" />
                <span className="text-xl font-bold">ClarifyAI</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">
                Transform your PDFs into intelligent conversations with cutting-edge AI technology.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3 text-gray-400 text-sm">
              <FaRobot className="text-cyan-400" />
              <span>© 2024 ClarifyAI. Built with ❤️ using RAG Technology</span>
            </div>
            <div className="flex gap-4">
              <a href="https://github.com/sirishax" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <FaGithub className="text-xl" />
              </a>
              <a href="https://www.linkedin.com/in/sirishar1/" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white transition-colors">
                <FaLinkedin className="text-xl" />
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
