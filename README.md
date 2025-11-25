<div align="center">

# 🤖 ClarifyAI

### *Transform Your PDFs into Intelligent Conversations*

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
[![Flask](https://img.shields.io/badge/Flask-3.x-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![LangChain](https://img.shields.io/badge/LangChain-0.1.x-1C3C3C?style=for-the-badge&logo=chainlink&logoColor=white)](https://langchain.com/)
[![FAISS](https://img.shields.io/badge/FAISS-Vector%20DB-00ADD8?style=for-the-badge&logo=meta&logoColor=white)](https://faiss.ai/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-AI-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square" alt="License">
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome">
  <img src="https://img.shields.io/badge/Maintained-Yes-green.svg?style=flat-square" alt="Maintained">
</p>

---

*Powered by Retrieval Augmented Generation (RAG) technology, ClarifyAI enables you to have natural conversations with your PDF documents using advanced AI models.*

[🚀 Demo](#-demo) • [✨ Features](#-features) • [🛠️ Tech Stack](#️-tech-stack) • [📦 Installation](#-installation) • [🎯 Usage](#-usage)

</div>

---

## 🌟 Why ClarifyAI?

<table>
<tr>
<td width="50%">

### 🎯 **Smart & Accurate**
Advanced RAG technology ensures precise answers backed by source citations from your documents.

</td>
<td width="50%">

### ⚡ **Lightning Fast**
Optimized processing with batch operations and efficient vector search for instant responses.

</td>
</tr>
<tr>
<td width="50%">

### 🎨 **Beautiful UI**
Modern dark theme with glassmorphism effects and smooth animations for an immersive experience.

</td>
<td width="50%">

### 📱 **Fully Responsive**
Works seamlessly across all devices - desktop, tablet, and mobile.

</td>
</tr>
</table>

---

## ✨ Features

<div align="center">

| Feature | Description |
|---------|-------------|
| 📄 **PDF Upload** | Drag-and-drop or click to upload PDFs up to **50MB** |
| 🔍 **Semantic Search** | FAISS-powered vector search for accurate information retrieval |
| 💬 **Interactive Chat** | Beautiful chat interface with real-time responses and typing indicators |
| 📚 **Source Citations** | Every answer includes exact page references and context |
| 🎨 **Modern UI** | Dark theme with glassmorphism, neon glows, and smooth animations |
| 📱 **Mobile Optimized** | Touch-friendly interface with responsive design |
| ⚡ **Batch Processing** | Efficient handling of large documents with progress tracking |
| 🔒 **Secure** | Local processing with no data stored permanently |
| 🌐 **Multi-Language** | Supports documents in multiple languages |
| 🎯 **Context-Aware** | Maintains conversation context for natural interactions |

</div>

---

## 🎬 Demo

<div align="center">

### 🖥️ Desktop Experience
*Coming Soon*

### 📱 Mobile Experience  
*Coming Soon*

</div>

---

## 🛠️ Tech Stack

<div align="center">

### **Frontend**
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-5.4.21-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4.0-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-10.16.16-0055FF?style=for-the-badge&logo=framer&logoColor=white)

### **Backend**
![Python](https://img.shields.io/badge/Python-3.13-3776AB?style=for-the-badge&logo=python&logoColor=white)
![Flask](https://img.shields.io/badge/Flask-3.0.0-000000?style=for-the-badge&logo=flask&logoColor=white)
![LangChain](https://img.shields.io/badge/LangChain-0.1.0-1C3C3C?style=for-the-badge)

### **AI & ML**
![Google Gemini](https://img.shields.io/badge/Gemini_Pro-AI-4285F4?style=for-the-badge&logo=google&logoColor=white)
![FAISS](https://img.shields.io/badge/FAISS-Vector_DB-00ADD8?style=for-the-badge)
![HuggingFace](https://img.shields.io/badge/HuggingFace-Embeddings-FFD21E?style=for-the-badge&logo=huggingface&logoColor=black)

</div>

---

## 📦 Installation

### Prerequisites

<div align="center">

| Requirement | Version |
|------------|---------|
| 🐍 Python | 3.10+ |
| 📦 Node.js | 16+ |
| 📝 npm | 8+ |
| 🔑 Gemini API Key | [Get Free Key](https://aistudio.google.com/app/apikey) |

</div>

### 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/sirishax/RAG-chatbot.git
cd RAG-chatbot

# Backend Setup
cd backend
pip install -r requirements.txt

# Create .env file
echo "GEMINI_API_KEY=your_gemini_api_key_here" > .env

# Start backend server
python server.py

# Frontend Setup (new terminal)
cd frontend/rag-pdf-qa-frontend
npm install

# Start development server
npm run dev
```

<div align="center">

**🎉 Your app is now running!**

Backend: `http://localhost:5000` | Frontend: `http://localhost:3000`

</div>

---

## 🎯 Usage

### 1️⃣ **Upload Your PDF**
<div align="center">
Drag and drop or click to upload any PDF document (up to 50MB)
</div>

### 2️⃣ **Wait for Processing**
<div align="center">
The app will extract text, create embeddings, and build a vector database
</div>

### 3️⃣ **Start Asking Questions**
<div align="center">
Type your questions in natural language and get instant, accurate answers with source citations
</div>

### 4️⃣ **Explore Sources**
<div align="center">
Click on source references to see the exact context from your PDF
</div>

---

## 🏗️ Project Structure

```
chatbot/
├── 📂 backend/
│   ├── server.py              # Flask API server
│   ├── .env                   # Environment variables (Gemini API key)
│   ├── requirements.txt       # Python dependencies
│   ├── uploads/               # Temporary PDF storage
│   ├── dataset/               # Processed PDFs
│   └── vectorstore/           # FAISS vector database
│
├── 📂 frontend/
│   └── rag-pdf-qa-frontend/
│       ├── src/
│       │   ├── components/    # React components
│       │   ├── hooks/         # Custom hooks
│       │   ├── services/      # API services
│       │   ├── styles/        # CSS styles
│       │   └── utils/         # Utility functions
│       ├── package.json       # Frontend dependencies
│       └── vite.config.js     # Vite configuration
│
└── README.md                  # You are here! 📍
```

---

## 🔧 Configuration

### Backend Configuration

Edit `backend/.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### Frontend Configuration

Edit `frontend/rag-pdf-qa-frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000
```

---

## 🚀 Deployment

### Backend Deployment

<details>
<summary>Click to expand deployment options</summary>

- **Heroku**: Use `Procfile` and deploy with Git
- **Railway**: Connect GitHub repo and deploy automatically
- **AWS EC2**: Set up Python environment and run Flask app
- **Google Cloud Run**: Containerize and deploy

</details>

### Frontend Deployment

<details>
<summary>Click to expand deployment options</summary>

```bash
# Build for production
npm run build

# Deploy to Vercel
vercel deploy

# Deploy to Netlify
netlify deploy --prod
```

</details>

---

## 🎨 Features Showcase

### 🌈 **Modern UI/UX**
- Glassmorphism effects with backdrop blur
- Neon glow animations on interactive elements
- Smooth page transitions with Framer Motion
- Responsive grid layouts

### ⚡ **Performance Optimizations**
- Batch processing for large documents (100 chunks at a time)
- Optimized text chunking (800 chars with 100 char overlap)
- Lazy loading for better initial load times
- Efficient vector search with FAISS

### 🔐 **Security Features**
- Environment variable protection
- No permanent data storage
- CORS configuration for API security
- Sanitized file uploads

---

## 🤝 Contributing

Contributions are what make the open-source community amazing! Any contributions you make are **greatly appreciated**.

<div align="center">

```bash
# Fork the Project
# Create your Feature Branch
git checkout -b feature/AmazingFeature

# Commit your Changes
git commit -m 'Add some AmazingFeature'

# Push to the Branch
git push origin feature/AmazingFeature

# Open a Pull Request
```

</div>

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.

---

## 👨‍💻 Author

<div align="center">

**Sirisha**

[![GitHub](https://img.shields.io/badge/GitHub-sirishax-181717?style=for-the-badge&logo=github)](https://github.com/sirishax)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-sirishar1-0A66C2?style=for-the-badge&logo=linkedin)](https://www.linkedin.com/in/sirishar1/)

</div>

---

## 🙏 Acknowledgments

<div align="center">

- [LangChain](https://langchain.com/) - For the amazing RAG framework
- [Google Gemini](https://ai.google.dev/) - For powerful AI capabilities
- [FAISS](https://faiss.ai/) - For efficient vector similarity search
- [React](https://reactjs.org/) - For the UI framework
- [TailwindCSS](https://tailwindcss.com/) - For beautiful styling

</div>

---

<div align="center">

### ⭐ Star this repository if you find it helpful!

**Made with ❤️ and lots of ☕**

[⬆ Back to Top](#-clarifyai)

</div>