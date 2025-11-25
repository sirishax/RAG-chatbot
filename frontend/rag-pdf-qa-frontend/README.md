"""Flask API Server for RAG PDF Q&A System."""

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import shutil
from pathlib import Path

# Import your existing RAG functions
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings, HuggingFaceEndpoint
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import PromptTemplate
from langchain.chains.retrieval_qa.base import RetrievalQA
from dotenv import load_dotenv

# Configuration
app = Flask(__name__)
CORS(app)  # Enable CORS for React frontend

UPLOAD_FOLDER = './backend/uploads'
DATASET_FOLDER = './dataset'
VECTOR_DATABASE_PATH = 'vectorstore/database_fs'
HUGGINGFACE_REPO_ID = "mistralai/Mistral-7B-Instruct-v0.3"
ALLOWED_EXTENSIONS = {'pdf'}

# Create folders if they don't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DATASET_FOLDER, exist_ok=True)

# Global variable to store QA chain
qa_chain = None
current_pdf = None

# Load environment variables
load_dotenv()

def allowed_file(filename):
    """Check if file has allowed extension."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_embedding_model():
    """Initialize the HuggingFace embedding model."""
    return HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

def create_chunks(extracted_data):
    """Split documents into smaller chunks for better processing."""
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=60)
    text_chunks = text_splitter.split_documents(extracted_data)
    return text_chunks

def load_llm():
    """Load LLM from Hugging Face Inference Endpoint."""
    return HuggingFaceEndpoint(
        repo_id=HUGGINGFACE_REPO_ID,
        task="text-generation",
        temperature=0.6,
        max_new_tokens=512,
    )

CUSTOM_PROMPT_TEMPLATE = """
You are a helpful and friendly assistant that answers questions strictly based on the provided context.

Instructions:
- Start the response with a short, friendly greeting like "Hello!", "Hi there!", or "Hey!".
- Vary the greeting naturally to make responses feel less robotic.
- After the greeting, immediately answer the user's question based only on the given context.
- If the answer cannot be found in the context, reply: "I don't know based on the provided information."
- Avoid adding any external knowledge, personal opinions, or fabricated information.
- Keep the answer clear, factual, and concise.

Here is the context:
{context}

Here is the user's question:
{question}

Respond naturally:
"""

def set_custom_prompt():
    """Create a custom PromptTemplate for QA."""
    return PromptTemplate(
        template=CUSTOM_PROMPT_TEMPLATE, 
        input_variables=["context", "question"]
    )

def process_pdf(file_path):
    """Process uploaded PDF and create vector store."""
    global qa_chain, current_pdf
    
    try:
        # Load the PDF
        loader = PyPDFLoader(file_path)
        documents = loader.load()
        
        if not documents:
            raise ValueError("Failed to extract text from PDF")
        
        # Create chunks
        text_chunks = create_chunks(documents)
        
        # Create embeddings and vector store
        embedding_model = get_embedding_model()
        db = FAISS.from_documents(text_chunks, embedding_model)
        
        # Save vector store
        db.save_local(VECTOR_DATABASE_PATH)
        
        # Create QA chain
        qa_chain = RetrievalQA.from_chain_type(
            llm=load_llm(),
            chain_type="stuff",
            retriever=db.as_retriever(search_kwargs={'k': 3}),
            return_source_documents=True,
            chain_type_kwargs={'prompt': set_custom_prompt()}
        )
        
        current_pdf = os.path.basename(file_path)
        
        return {
            'success': True,
            'pages': len(documents),
            'chunks': len(text_chunks),
            'filename': current_pdf
        }
    
    except Exception as e:
        raise Exception(f"Error processing PDF: {str(e)}")

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({'status': 'ok', 'message': 'Server is running'})

@app.route('/api/upload', methods=['POST'])
def upload_pdf():
    """Upload and process PDF file."""
    try:
        # Check if file is present
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Check file type
        if not allowed_file(file.filename):
            return jsonify({'error': 'Only PDF files are allowed'}), 400
        
        # Save file
        filename = secure_filename(file.filename)
        upload_path = os.path.join(UPLOAD_FOLDER, filename)
        dataset_path = os.path.join(DATASET_FOLDER, filename)
        
        file.save(upload_path)
        
        # Copy to dataset folder
        shutil.copy(upload_path, dataset_path)
        
        # Process PDF
        result = process_pdf(dataset_path)
        
        return jsonify({
            'success': True,
            'message': 'PDF uploaded and processed successfully',
            'data': result
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/ask', methods=['POST'])
def ask_question():
    """Ask a question about the uploaded PDF."""
    global qa_chain
    
    try:
        # Check if QA chain is initialized
        if qa_chain is None:
            return jsonify({'error': 'Please upload a PDF first'}), 400
        
        # Get question from request
        data = request.get_json()
        question = data.get('question', '').strip()
        
        if not question:
            return jsonify({'error': 'Question is required'}), 400
        
        # Get answer
        response = qa_chain.invoke({'query': question})
        
        # Extract source documents
        sources = []
        for doc in response.get('source_documents', []):
            sources.append({
                'content': doc.page_content[:200] + '...' if len(doc.page_content) > 200 else doc.page_content,
                'source': doc.metadata.get('source', 'Unknown'),
                'page': doc.metadata.get('page', 'N/A')
            })
        
        return jsonify({
            'success': True,
            'answer': response['result'],
            'sources': sources,
            'pdf': current_pdf
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/reset', methods=['POST'])
def reset_conversation():
    """Reset the current conversation and clear uploaded files."""
    global qa_chain, current_pdf
    
    try:
        # Clear QA chain
        qa_chain = None
        current_pdf = None
        
        # Optionally clear uploaded files
        if request.get_json().get('clearFiles', False):
            # Clear uploads folder
            for file in os.listdir(UPLOAD_FOLDER):
                file_path = os.path.join(UPLOAD_FOLDER, file)
                if os.path.isfile(file_path):
                    os.remove(file_path)
        
        return jsonify({
            'success': True,
            'message': 'Conversation reset successfully'
        }), 200
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/status', methods=['GET'])
def get_status():
    """Get current system status."""
    return jsonify({
        'ready': qa_chain is not None,
        'currentPDF': current_pdf,
        'vectorStoreExists': os.path.exists(VECTOR_DATABASE_PATH)
    }), 200

if __name__ == '__main__':
    print("🚀 Starting RAG PDF Q&A Server...")
    print("📍 Server running on http://localhost:5000")
    print("📄 Upload PDFs to get started!")
    app.run(debug=True, host='0.0.0.0', port=5000)

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Upload PDF file to backend
 * @param {File} file - PDF file to upload
 * @param {Function} onUploadProgress - Progress callback
 * @returns {Promise} Upload response
 */
export const uploadPDF = async (file, onUploadProgress) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await api.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        if (onUploadProgress) {
          onUploadProgress(percentCompleted);
        }
      },
    });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || 'Failed to upload PDF'
    );
  }
};

/**
 * Ask a question about the uploaded PDF
 * @param {string} question - User's question
 * @returns {Promise} Answer response
 */
export const askQuestion = async (question) => {
  try {
    const response = await api.post('/ask', { question });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || 'Failed to get answer'
    );
  }
};

/**
 * Reset conversation and optionally clear files
 * @param {boolean} clearFiles - Whether to clear uploaded files
 * @returns {Promise} Reset response
 */
export const resetConversation = async (clearFiles = false) => {
  try {
    const response = await api.post('/reset', { clearFiles });
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || 'Failed to reset conversation'
    );
  }
};

/**
 * Get system status
 * @returns {Promise} Status response
 */
export const getStatus = async () => {
  try {
    const response = await api.get('/status');
    return response.data;
  } catch (error) {
    throw new Error(
      error.response?.data?.error || 'Failed to get status'
    );
  }
};

/**
 * Health check
 * @returns {Promise} Health response
 */
export const healthCheck = async () => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    throw new Error('Backend server is not reachable');
  }
};

export default api;

VITE_API_BASE_URL=http://localhost:5000