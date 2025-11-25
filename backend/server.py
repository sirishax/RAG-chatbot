"""Flask API Server for RAG PDF Q&A System."""

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import shutil

# Import from langchain
from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv, find_dotenv
import google.generativeai as genai

# Configuration
app = Flask(__name__)
CORS(app)

# Flask configuration for large file uploads
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

# Load environment variables FIRST
load_dotenv(find_dotenv())

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
DATASET_FOLDER = os.path.join(BASE_DIR, 'dataset')
VECTOR_DB_PATH = os.path.join(BASE_DIR, 'vectorstore', 'database_fs')

GEMINI_MODEL = "gemini-2.0-flash"
ALLOWED_EXTENSIONS = {'pdf'}

# Create folders
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DATASET_FOLDER, exist_ok=True)
os.makedirs(os.path.dirname(VECTOR_DB_PATH), exist_ok=True)

# Global variables
llm_client = None
retriever = None
current_pdf = None
embedding_model = None

# ============================================================
# EXACT Functions from phase1 (1).py
# ============================================================

def load_files(data_path: str):
    """Load PDF documents from a given directory - FROM PHASE1."""
    if not os.path.exists(data_path):
        raise ValueError(f"Data path does not exist: {data_path}")
    
    loader = DirectoryLoader(data_path, glob='*.pdf', loader_cls=PyPDFLoader)
    documents = loader.load()
    
    if not documents:
        raise ValueError("No PDF documents found in the specified directory")
    
    return documents

def create_chunks(extracted_data):
    """Split documents into smaller chunks - optimized for speed and quality."""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,  # Larger chunks = fewer embeddings = faster
        chunk_overlap=100,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""]
    )
    text_chunks = text_splitter.split_documents(extracted_data)
    return text_chunks

def get_embedding_model():
    """Initialize the HuggingFace embedding model - FROM PHASE1."""
    global embedding_model
    if embedding_model is None:
        embedding_model = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
    return embedding_model

def create_or_load_vectorstore(force_recreate=False):
    """Create new vectorstore or load existing one - FROM PHASE1."""
    embedding = get_embedding_model()
    
    # Check if vectorstore already exists
    if os.path.exists(VECTOR_DB_PATH) and not force_recreate:
        print(f"📂 Loading existing vector database from {VECTOR_DB_PATH}...")
        db = FAISS.load_local(
            VECTOR_DB_PATH, 
            embedding,
            allow_dangerous_deserialization=True
        )
        print("✓ Vector database loaded successfully!")
        return db
    
    # Create new vectorstore
    print("Creating new vector database...")
    documents = load_files(data_path=DATASET_FOLDER)
    print(f"✓ Number of pages loaded: {len(documents)}")
    
    text_chunks = create_chunks(extracted_data=documents)
    print(f"✓ Length of Text Chunks: {len(text_chunks)}")
    
    db = FAISS.from_documents(text_chunks, embedding)
    db.save_local(VECTOR_DB_PATH)
    print("✓ Vector database created and saved successfully!")
    
    return db

def load_llm(model_name: str):
    """Load the Gemini language model."""
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in environment variables")
    
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel(model_name)
    return model

# EXACT PROMPT from phase1
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

def set_custom_prompt(custom_prompt_template: str):
    """Set up a custom prompt template - FROM PHASE1."""
    prompt = PromptTemplate(
        template=custom_prompt_template,
        input_variables=['context', 'question']
    )
    return prompt

def allowed_file(filename):
    """Check if file extension is allowed."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# ============================================================
# Process PDF Function (Modified for single file upload)
# ============================================================

def process_single_pdf(file_path):
    """Process a single uploaded PDF and create/update vector store."""
    global qa_chain, current_pdf
    
    try:
        print(f"\n{'='*60}")
        print(f"📄 Processing PDF: {os.path.basename(file_path)}")
        print(f"{'='*60}")
        
        # Load the single PDF with faster parsing
        loader = PyPDFLoader(file_path, extract_images=False)  # Skip images for speed
        documents = loader.load()
        
        if not documents:
            raise ValueError("Failed to extract text from PDF")
        
        print(f"✓ Loaded {len(documents)} pages from PDF")
        
        # Create chunks with optimized settings
        text_chunks = create_chunks(extracted_data=documents)
        print(f"✓ Created {len(text_chunks)} text chunks")
        
        # Create embeddings and vector store with batch processing
        print("🔄 Creating embeddings (optimized for speed)...")
        embedding = get_embedding_model()
        
        # Process in batches for better performance
        batch_size = 100
        if len(text_chunks) > batch_size:
            print(f"📦 Processing {len(text_chunks)} chunks in batches of {batch_size}...")
            db = FAISS.from_documents(text_chunks[:batch_size], embedding)
            for i in range(batch_size, len(text_chunks), batch_size):
                batch = text_chunks[i:i+batch_size]
                temp_db = FAISS.from_documents(batch, embedding)
                db.merge_from(temp_db)
                print(f"   ✓ Processed {min(i+batch_size, len(text_chunks))}/{len(text_chunks)} chunks")
        else:
            db = FAISS.from_documents(text_chunks, embedding)
        
        # Save vector store
        print("💾 Saving vector store...")
        db.save_local(VECTOR_DB_PATH)
        print(f"✓ Vector store saved to: {VECTOR_DB_PATH}")
        
        # Create retriever and LLM client
        print("🔗 Initializing retriever and LLM client...")
        global retriever, llm_client
        retriever = db.as_retriever(search_kwargs={'k': 3})
        llm_client = load_llm(GEMINI_MODEL)
        
        current_pdf = os.path.basename(file_path)
        
        print(f"{'='*60}")
        print(f"✅ SUCCESS! PDF processed: {current_pdf}")
        print(f"{'='*60}\n")
        
        return {
            'pages': len(documents),
            'chunks': len(text_chunks),
            'filename': current_pdf
        }
    
    except Exception as e:
        print(f"\n{'='*60}")
        print(f"❌ ERROR processing PDF: {str(e)}")
        print(f"{'='*60}\n")
        raise Exception(f"Error processing PDF: {str(e)}")

def initialize_qa_from_existing():
    """Initialize retriever and LLM client from existing vector store."""
    global retriever, llm_client
    
    try:
        if os.path.exists(VECTOR_DB_PATH):
            print("\n📂 Found existing vector database, loading...")
            
            # Load vector store
            db = create_or_load_vectorstore(force_recreate=False)
            
            # Create retriever and LLM client
            print("🔗 Creating retriever and LLM client from existing database...")
            retriever = db.as_retriever(search_kwargs={'k': 3})
            llm_client = load_llm(GEMINI_MODEL)
            print("✅ Retriever and LLM client initialized from existing database!\n")
            return True
    except Exception as e:
        print(f"⚠️ Could not load existing database: {str(e)}\n")
    
    return False

# ============================================================
# Flask API Endpoints
# ============================================================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'ok',
        'message': 'Server is running',
        'qa_ready': retriever is not None and llm_client is not None,
        'has_token': bool(os.getenv('GEMINI_API_KEY'))
    })

@app.route('/api/upload', methods=['POST'])
def upload_pdf():
    """Upload and process PDF file."""
    try:
        print("\n" + "="*60)
        print("📤 UPLOAD REQUEST RECEIVED")
        print("="*60)
        
        # Check if file is present
        if 'file' not in request.files:
            print("❌ No file in request")
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        # Check if file is selected
        if file.filename == '':
            print("❌ Empty filename")
            return jsonify({'error': 'No file selected'}), 400
        
        # Check file type
        if not allowed_file(file.filename):
            print(f"❌ Invalid file type: {file.filename}")
            return jsonify({'error': 'Only PDF files are allowed'}), 400
        
        # Save file
        filename = secure_filename(file.filename)
        upload_path = os.path.join(UPLOAD_FOLDER, filename)
        dataset_path = os.path.join(DATASET_FOLDER, filename)
        
        print(f"💾 Saving file: {filename}")
        print(f"   Upload path: {upload_path}")
        print(f"   Dataset path: {dataset_path}")
        
        file.save(upload_path)
        
        # Copy to dataset folder
        shutil.copy(upload_path, dataset_path)
        print("✓ File saved to both locations")
        
        # Process PDF (this creates the QA chain)
        result = process_single_pdf(dataset_path)
        
        print("\n✅ Upload and processing completed successfully!\n")
        
        return jsonify({
            'success': True,
            'message': 'PDF uploaded and processed successfully',
            'data': result
        }), 200
    
    except Exception as e:
        print(f"\n❌ UPLOAD ERROR: {str(e)}\n")
        return jsonify({'error': str(e)}), 500

@app.route('/api/ask', methods=['POST'])
def ask_question():
    """Ask a question about the uploaded PDF."""
    global retriever, llm_client
    
    try:
        print("\n" + "="*60)
        print("❓ QUESTION REQUEST RECEIVED")
        print("="*60)
        
        # Check if retriever and client are initialized
        if retriever is None or llm_client is None:
            print("❌ System not initialized - no PDF uploaded")
            return jsonify({'error': 'Please upload a PDF first'}), 400
        
        # Get question from request
        data = request.get_json()
        question = data.get('question', '').strip()
        
        if not question:
            print("❌ Empty question")
            return jsonify({'error': 'Question is required'}), 400
        
        print(f"🤔 Question: {question}")
        print("🔄 Querying LLM (this may take 10-30 seconds)...")
        
        # Retrieve relevant documents
        source_docs = retriever.get_relevant_documents(question)
        print(f"📚 Found {len(source_docs)} relevant documents")
        
        # Build context from documents
        context = "\n\n".join([doc.page_content for doc in source_docs])
        
        # Create prompt with context
        prompt = f"""You are a helpful and friendly assistant that answers questions strictly based on the provided context.

Instructions:
- Start the response with a short, friendly greeting like "Hello!", "Hi there!", or "Hey!".
- Vary the greeting naturally to make responses feel less robotic.
- After the greeting, immediately answer the user's question based only on the given context.
- If the answer cannot be found in the context, reply: "I don't know based on the provided information."
- Avoid adding any external knowledge, personal opinions, or fabricated information.
- Keep the answer clear, factual, and concise.

Context:
{context}

Question: {question}

Answer:"""
        
        # Get answer from Gemini
        response = llm_client.generate_content(prompt)
        response_text = response.text
        
        print("✓ Response received from LLM")
        
        # Extract answer
        answer = response_text.strip()
        print(f"💬 Answer length: {len(answer)} characters")
        
        # Extract source documents
        sources = []
        for idx, doc in enumerate(source_docs):
            source_info = {
                'content': doc.page_content[:200] + '...' if len(doc.page_content) > 200 else doc.page_content,
                'source': os.path.basename(doc.metadata.get('source', 'Unknown')),
                'page': doc.metadata.get('page', 'N/A')
            }
            sources.append(source_info)
            print(f"   Source {idx+1}: {source_info['source']} (Page {source_info['page']})")
        
        print("="*60)
        print("✅ ANSWER GENERATED SUCCESSFULLY")
        print("="*60 + "\n")
        
        return jsonify({
            'success': True,
            'answer': answer,
            'sources': sources,
            'pdf': current_pdf
        }), 200
    
    except Exception as e:
        error_msg = str(e)
        print(f"\n{'='*60}")
        print(f"❌ ERROR GENERATING ANSWER")
        print(f"Error: {error_msg}")
        print(f"{'='*60}\n")
        return jsonify({'error': error_msg}), 500

@app.route('/api/status', methods=['GET'])
def get_status():
    """Get current system status."""
    status = {
        'ready': retriever is not None and llm_client is not None,
        'currentPDF': current_pdf,
        'vectorStoreExists': os.path.exists(VECTOR_DB_PATH),
        'datasetFolder': DATASET_FOLDER,
        'pdfCount': len([f for f in os.listdir(DATASET_FOLDER) if f.endswith('.pdf')]) if os.path.exists(DATASET_FOLDER) else 0
    }
    print(f"📊 Status check: {status}")
    return jsonify(status), 200

@app.route('/api/reset', methods=['POST'])
def reset_conversation():
    """Reset the current conversation."""
    global retriever, llm_client, current_pdf
    
    try:
        print("\n🔄 Reset request received")
        
        # Clear system
        retriever = None
        llm_client = None
        current_pdf = None
        
        # Optionally clear uploaded files
        data = request.get_json() or {}
        if data.get('clearFiles', False):
            for folder in [UPLOAD_FOLDER, DATASET_FOLDER]:
                if os.path.exists(folder):
                    for file in os.listdir(folder):
                        file_path = os.path.join(folder, file)
                        if os.path.isfile(file_path):
                            os.remove(file_path)
            
            # Clear vector store
            if os.path.exists(VECTOR_DB_PATH):
                shutil.rmtree(os.path.dirname(VECTOR_DB_PATH))
            
            print("🗑️ All files and vector store cleared")
        
        print("✅ Reset completed\n")
        
        return jsonify({
            'success': True,
            'message': 'Conversation reset successfully'
        }), 200
    
    except Exception as e:
        print(f"❌ Reset error: {str(e)}")
        return jsonify({'error': str(e)}), 500

# ============================================================
# Server Initialization
# ============================================================

if __name__ == '__main__':
    print("\n" + "="*70)
    print("🚀 RAG PDF Q&A Backend Server - Starting...")
    print("="*70)
    print(f"📍 Server URL: http://localhost:5000")
    print(f"📁 Upload folder: {UPLOAD_FOLDER}")
    print(f"📁 Dataset folder: {DATASET_FOLDER}")
    print(f"📁 Vector store: {VECTOR_DB_PATH}")
    
    # Check Gemini API key
    gemini_key = os.getenv('GEMINI_API_KEY')
    if gemini_key:
        print(f"✓ Gemini API key found: {gemini_key[:10]}...")
    else:
        print("⚠️  WARNING: No Gemini API key found in .env file")
        print("   Get one from: https://aistudio.google.com/app/apikey")
    
    print("="*70)
    
    # Try to load existing vector store on startup
    if os.path.exists(DATASET_FOLDER) and os.listdir(DATASET_FOLDER):
        print(f"\n📂 Found existing PDFs in dataset folder")
        initialize_qa_from_existing()
    
    print("\n✅ Server is ready! Upload a PDF to get started.\n")
    
    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)