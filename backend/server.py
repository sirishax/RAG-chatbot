"""Flask API Server for RAG PDF Q&A System."""

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import shutil
import traceback

from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv, find_dotenv
import google.generativeai as genai

app = Flask(__name__)
CORS(app)

app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

load_dotenv(find_dotenv())

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
DATASET_FOLDER = os.path.join(BASE_DIR, 'dataset')
VECTOR_DB_PATH = os.path.join(BASE_DIR, 'vectorstore', 'database_fs')

GEMINI_MODEL = "gemini-2.0-flash"
ALLOWED_EXTENSIONS = {'pdf'}

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DATASET_FOLDER, exist_ok=True)
os.makedirs(os.path.dirname(VECTOR_DB_PATH), exist_ok=True)

llm_client = None
retriever = None
current_pdf = None
embedding_model = None


def load_files(data_path: str):
    """Load PDF documents from a directory."""
    if not os.path.exists(data_path):
        raise ValueError(f"Data path does not exist: {data_path}")

    loader = DirectoryLoader(data_path, glob='*.pdf', loader_cls=PyPDFLoader)
    documents = loader.load()

    if not documents:
        raise ValueError("No PDF documents found in the specified directory")

    return documents


def create_chunks(extracted_data):
    """Split documents into chunks optimized for retrieval."""
    text_splitter = RecursiveCharacterTextSplitter(
        chunk_size=800,
        chunk_overlap=100,
        length_function=len,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    return text_splitter.split_documents(extracted_data)


def get_embedding_model():
    """Initialize and cache the HuggingFace embedding model."""
    global embedding_model
    if embedding_model is None:
        embedding_model = HuggingFaceEmbeddings(
            model_name="sentence-transformers/all-MiniLM-L6-v2"
        )
    return embedding_model


def create_or_load_vectorstore(force_recreate=False):
    """Create a new vector store or load the existing one."""
    embedding = get_embedding_model()

    if os.path.exists(VECTOR_DB_PATH) and not force_recreate:
        print(f"Loading existing vector database from {VECTOR_DB_PATH}...")
        db = FAISS.load_local(
            VECTOR_DB_PATH,
            embedding,
            allow_dangerous_deserialization=True,
        )
        print("Vector database loaded successfully.")
        return db

    print("Creating new vector database...")
    documents = load_files(data_path=DATASET_FOLDER)
    print(f"Number of pages loaded: {len(documents)}")

    text_chunks = create_chunks(extracted_data=documents)
    print(f"Number of text chunks: {len(text_chunks)}")

    db = FAISS.from_documents(text_chunks, embedding)
    db.save_local(VECTOR_DB_PATH)
    print("Vector database created and saved successfully.")

    return db


def load_llm(model_name: str):
    """Load the Gemini language model."""
    api_key = os.getenv('GEMINI_API_KEY')
    if not api_key:
        raise ValueError("GEMINI_API_KEY not found in environment variables")

    genai.configure(api_key=api_key)
    return genai.GenerativeModel(model_name)


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
    """Create the prompt template used for answering."""
    return PromptTemplate(
        template=custom_prompt_template,
        input_variables=['context', 'question'],
    )


def allowed_file(filename):
    """Check if the uploaded file is a PDF."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def process_single_pdf(file_path):
    """Process an uploaded PDF and create or update the vector store."""
    global retriever, llm_client, current_pdf

    try:
        print("\n" + "=" * 60)
        print(f"Processing PDF: {os.path.basename(file_path)}")
        print("=" * 60)

        loader = PyPDFLoader(file_path, extract_images=False)
        documents = loader.load()

        if not documents:
            raise ValueError("Failed to extract text from PDF")

        print(f"Loaded {len(documents)} pages from PDF")

        text_chunks = create_chunks(extracted_data=documents)
        print(f"Created {len(text_chunks)} text chunks")

        print("Creating embeddings...")
        embedding = get_embedding_model()

        batch_size = 100
        if len(text_chunks) > batch_size:
            print(f"Processing {len(text_chunks)} chunks in batches of {batch_size}...")
            db = FAISS.from_documents(text_chunks[:batch_size], embedding)
            for i in range(batch_size, len(text_chunks), batch_size):
                batch = text_chunks[i:i + batch_size]
                temp_db = FAISS.from_documents(batch, embedding)
                db.merge_from(temp_db)
                print(f"Processed {min(i + batch_size, len(text_chunks))}/{len(text_chunks)} chunks")
        else:
            db = FAISS.from_documents(text_chunks, embedding)

        print("Saving vector store...")
        db.save_local(VECTOR_DB_PATH)
        print(f"Vector store saved to: {VECTOR_DB_PATH}")

        retriever = db.as_retriever(search_kwargs={'k': 3})
        llm_client = load_llm(GEMINI_MODEL)
        current_pdf = os.path.basename(file_path)

        print("=" * 60)
        print(f"SUCCESS! PDF processed: {current_pdf}")
        print("=" * 60 + "\n")

        return {
            'pages': len(documents),
            'chunks': len(text_chunks),
            'filename': current_pdf,
        }

    except Exception as exc:
        print("\n" + "=" * 60)
        print(f"ERROR processing PDF: {exc}")
        print("=" * 60 + "\n")
        raise Exception(f"Error processing PDF: {exc}")


def initialize_qa_from_existing():
    """Initialize retriever and LLM client from an existing vector store."""
    global retriever, llm_client

    try:
        if os.path.exists(VECTOR_DB_PATH):
            print("\nFound existing vector database, loading...")
            db = create_or_load_vectorstore(force_recreate=False)
            retriever = db.as_retriever(search_kwargs={'k': 3})
            llm_client = load_llm(GEMINI_MODEL)
            print("Retriever and LLM client initialized from existing database.\n")
            return True
    except Exception as exc:
        print(f"Could not load existing database: {exc}\n")

    return False


def extract_response_text(response):
    """Safely extract text from a Gemini response."""
    try:
        text = getattr(response, 'text', None)
        if text:
            return text.strip()
    except Exception:
        pass

    candidates = getattr(response, 'candidates', None) or []
    for candidate in candidates:
        content = getattr(candidate, 'content', None)
        parts = getattr(content, 'parts', None) or []
        text_parts = [getattr(part, 'text', '') for part in parts if getattr(part, 'text', '')]
        if text_parts:
            return "".join(text_parts).strip()

    return ""


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'ok',
        'message': 'Server is running',
        'qa_ready': retriever is not None and llm_client is not None,
        'has_token': bool(os.getenv('GEMINI_API_KEY')),
    })


@app.route('/api/upload', methods=['POST'])
def upload_pdf():
    """Upload and process a PDF file."""
    try:
        print("\n" + "=" * 60)
        print("UPLOAD REQUEST RECEIVED")
        print("=" * 60)
        print(f"Content-Type: {request.content_type}")
        print(f"Files in request: {list(request.files.keys())}")

        if 'file' not in request.files:
            print("Upload rejected: no 'file' field found in request.files")
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']

        if file.filename == '':
            print("Upload rejected: empty filename")
            return jsonify({'error': 'No file selected'}), 400

        if not allowed_file(file.filename):
            print(f"Upload rejected: invalid file type for {file.filename}")
            return jsonify({'error': 'Only PDF files are allowed'}), 400

        filename = secure_filename(file.filename)
        upload_path = os.path.join(UPLOAD_FOLDER, filename)
        dataset_path = os.path.join(DATASET_FOLDER, filename)

        print(f"Saving upload as: {filename}")

        file.save(upload_path)
        shutil.copy(upload_path, dataset_path)

        result = process_single_pdf(dataset_path)

        return jsonify({
            'success': True,
            'message': 'PDF uploaded and processed successfully',
            'data': result,
        }), 200

    except Exception as exc:
        print(f"\nUPLOAD ERROR: {exc}\n")
        return jsonify({'error': str(exc)}), 500


@app.route('/api/ask', methods=['POST'])
def ask_question():
    """Ask a question about the uploaded PDF."""
    global retriever, llm_client

    try:
        if retriever is None or llm_client is None:
            return jsonify({'error': 'Please upload a PDF first'}), 400

        data = request.get_json() or {}
        question = data.get('question', '').strip()

        if not question:
            return jsonify({'error': 'Question is required'}), 400

        print(f"Question: {question}")

        source_docs = retriever.get_relevant_documents(question)
        print(f"Relevant documents found: {len(source_docs)}")

        if not source_docs:
            return jsonify({
                'success': True,
                'answer': "I don't know based on the provided information.",
                'sources': [],
                'pdf': current_pdf,
            }), 200

        context = "\n\n".join([doc.page_content for doc in source_docs])

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

        response = llm_client.generate_content(prompt)
        answer = extract_response_text(response)

        if not answer:
            print("Gemini returned no text content; using fallback answer.")
            answer = "I don't know based on the provided information."

        sources = []
        for doc in source_docs:
            sources.append({
                'content': doc.page_content[:200] + '...' if len(doc.page_content) > 200 else doc.page_content,
                'source': os.path.basename(doc.metadata.get('source', 'Unknown')),
                'page': doc.metadata.get('page', 'N/A'),
            })

        return jsonify({
            'success': True,
            'answer': answer,
            'sources': sources,
            'pdf': current_pdf,
        }), 200

    except Exception as exc:
        print(f"ERROR GENERATING ANSWER: {exc}")
        traceback.print_exc()
        return jsonify({'error': str(exc)}), 500


@app.route('/api/status', methods=['GET'])
def get_status():
    """Get current system status."""
    status = {
        'ready': retriever is not None and llm_client is not None,
        'currentPDF': current_pdf,
        'vectorStoreExists': os.path.exists(VECTOR_DB_PATH),
        'datasetFolder': DATASET_FOLDER,
        'pdfCount': len([f for f in os.listdir(DATASET_FOLDER) if f.endswith('.pdf')]) if os.path.exists(DATASET_FOLDER) else 0,
    }
    print(f"Status check: {status}")
    return jsonify(status), 200


@app.route('/api/reset', methods=['POST'])
def reset_conversation():
    """Reset the current conversation."""
    global retriever, llm_client, current_pdf

    try:
        retriever = None
        llm_client = None
        current_pdf = None

        data = request.get_json() or {}
        if data.get('clearFiles', False):
            for folder in [UPLOAD_FOLDER, DATASET_FOLDER]:
                if os.path.exists(folder):
                    for file_name in os.listdir(folder):
                        file_path = os.path.join(folder, file_name)
                        if os.path.isfile(file_path):
                            os.remove(file_path)

            if os.path.exists(VECTOR_DB_PATH):
                shutil.rmtree(os.path.dirname(VECTOR_DB_PATH))

        return jsonify({
            'success': True,
            'message': 'Conversation reset successfully',
        }), 200

    except Exception as exc:
        print(f"Reset error: {exc}")
        return jsonify({'error': str(exc)}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    debug_mode = os.getenv('FLASK_DEBUG', '0') == '1'

    print("\n" + "=" * 70)
    print("Starting RAG PDF Q&A Backend Server...")
    print("=" * 70)
    print(f"Server URL: http://localhost:{port}")
    print(f"Upload folder: {UPLOAD_FOLDER}")
    print(f"Dataset folder: {DATASET_FOLDER}")
    print(f"Vector store: {VECTOR_DB_PATH}")

    gemini_key = os.getenv('GEMINI_API_KEY')
    if gemini_key:
        print(f"Gemini API key found: {gemini_key[:10]}...")
    else:
        print("WARNING: No Gemini API key found in .env file")
        print("Get one from: https://aistudio.google.com/app/apikey")

    print("=" * 70)

    if os.path.exists(DATASET_FOLDER) and os.listdir(DATASET_FOLDER):
        print("\nFound existing PDFs in dataset folder")
        initialize_qa_from_existing()

    print("\nServer is ready! Upload a PDF to get started.\n")

    app.run(debug=debug_mode, host='0.0.0.0', port=port, use_reloader=False)
