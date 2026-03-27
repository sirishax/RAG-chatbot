"""Flask API Server for RAG PDF Q&A System."""

from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename
import os
import shutil
import traceback
import requests

from langchain_community.document_loaders import PyPDFLoader, DirectoryLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.embeddings import FastEmbedEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import PromptTemplate
from dotenv import load_dotenv, find_dotenv

app = Flask(__name__)

app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

load_dotenv(find_dotenv())


def parse_cors_origins(raw_origins):
    """Parse CORS origins from comma-separated environment variable."""
    if not raw_origins:
        # Default to permissive CORS so deploy domain changes do not break uploads.
        return ['*']

    origins = [origin.strip() for origin in raw_origins.split(',') if origin.strip()]
    return origins if origins else ['*']


CORS(app, resources={
    r"/api/*": {
        'origins': parse_cors_origins(os.getenv('CORS_ORIGINS')),
    }
})

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
DATASET_FOLDER = os.path.join(BASE_DIR, 'dataset')
VECTOR_DB_PATH = os.path.join(BASE_DIR, 'vectorstore', 'database_fs')

GROQ_BASE_URL = "https://api.groq.com/openai/v1"
DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile"
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
    """Initialize and cache a lightweight FastEmbed model."""
    global embedding_model
    if embedding_model is None:
        embedding_model = FastEmbedEmbeddings(
            model_name="BAAI/bge-small-en-v1.5"
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
    """Load Groq configuration."""
    api_key = os.getenv('GROQ_API_KEY')
    if not api_key:
        raise ValueError("GROQ_API_KEY not found in environment variables")

    fallback_models = [
        model.strip()
        for model in os.getenv('GROQ_FALLBACK_MODELS', '').split(',')
        if model.strip()
    ]

    return {
        'api_key': api_key,
        'model': model_name,
        'fallback_models': fallback_models,
        'base_url': GROQ_BASE_URL,
    }


def ensure_llm_initialized():
    """Initialize the LLM client if it has not been created yet."""
    global llm_client
    if llm_client is not None:
        return llm_client

    model_name = os.getenv('GROQ_MODEL', DEFAULT_GROQ_MODEL)
    llm_client = load_llm(model_name)
    return llm_client


CUSTOM_PROMPT_TEMPLATE = """
You are a helpful and friendly assistant for document intelligence.

Instructions:
- Start with a short natural greeting.
- Use only the provided context as factual evidence. Do not invent details.
- Provide a richer, structured response with:
    1) Direct Answer
    2) Key Insights (3-6 bullets)
    3) Practical Improvements/Recommendations (when the question asks "how to improve", "what next", or similar)
- Recommendations must be grounded in the context and clearly phrased as suggestions.
- If the context is insufficient, say: "I don't know based on the provided information." and then add what information is missing.
- Keep tone clear and helpful, avoid generic filler.

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

        retriever = db.as_retriever(
            search_type='mmr',
            search_kwargs={
                'k': 5,
                'fetch_k': 20,
                'lambda_mult': 0.7,
            },
        )

        # PDF indexing should succeed even if Groq key is not configured yet.
        try:
            llm_client = ensure_llm_initialized()
        except Exception as llm_error:
            llm_client = None
            print(f"LLM not initialized yet: {llm_error}")

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
            retriever = db.as_retriever(
                search_type='mmr',
                search_kwargs={
                    'k': 5,
                    'fetch_k': 20,
                    'lambda_mult': 0.7,
                },
            )

            try:
                llm_client = ensure_llm_initialized()
                print("Retriever and LLM client initialized from existing database.\n")
            except Exception as llm_error:
                llm_client = None
                print(f"Retriever initialized. LLM not ready: {llm_error}\n")

            return True
    except Exception as exc:
        print(f"Could not load existing database: {exc}\n")

    return False


def extract_response_text(response_json):
    """Safely extract text from a Groq chat completion response."""
    choices = response_json.get('choices', [])
    for choice in choices:
        message = choice.get('message', {})
        content = message.get('content', '')
        if isinstance(content, str) and content.strip():
            return content.strip()

        if isinstance(content, list):
            parts = [part.get('text', '') for part in content if isinstance(part, dict)]
            joined = ''.join(parts).strip()
            if joined:
                return joined

    return ""


def generate_with_groq(prompt):
    """Generate answer text using Groq chat completions."""
    if llm_client is None:
        raise ValueError("LLM client is not initialized")

    url = f"{llm_client['base_url']}/chat/completions"
    headers = {
        'Authorization': f"Bearer {llm_client['api_key']}",
        'Content-Type': 'application/json',
    }
    model_candidates = [llm_client['model'], *llm_client.get('fallback_models', [])]
    tried = []

    for model_name in model_candidates:
        payload = {
            'model': model_name,
            'messages': [
                {
                    'role': 'user',
                    'content': prompt,
                }
            ],
            'temperature': 0.35,
            'max_tokens': 1000,
        }

        response = requests.post(url, json=payload, headers=headers, timeout=120)

        if response.status_code < 400:
            return response.json()

        error_payload = {}
        try:
            error_payload = response.json()
        except Exception:
            pass

        error_message = (
            error_payload.get('error', {}).get('message')
            or error_payload.get('message')
            or response.text
            or 'Groq request failed'
        )

        tried.append(f"{model_name}: {response.status_code} {error_message}")

        # Retry with fallback model for rate-limit/temporary saturation/no-endpoint issues.
        if response.status_code in (404, 429, 503):
            continue

        raise Exception(f"{response.status_code} {error_message}")

    raise Exception("All configured Groq models failed. " + " | ".join(tried))


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        'status': 'ok',
        'message': 'Server is running',
        'qa_ready': retriever is not None and llm_client is not None,
        'has_token': bool(os.getenv('GROQ_API_KEY')),
        'model': os.getenv('GROQ_MODEL', DEFAULT_GROQ_MODEL),
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
        if retriever is None:
            return jsonify({'error': 'Please upload a PDF first'}), 400

        if llm_client is None:
            try:
                ensure_llm_initialized()
            except Exception:
                return jsonify({
                    'error': 'GROQ_API_KEY is missing or invalid. Add it to backend/.env and restart backend.',
                }), 503

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

        prompt_template = set_custom_prompt(CUSTOM_PROMPT_TEMPLATE)
        prompt = prompt_template.format(context=context, question=question)

        response_json = generate_with_groq(prompt)
        answer = extract_response_text(response_json)

        if not answer:
            print("Groq returned no text content; using fallback answer.")
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
        message = str(exc)
        lowered = message.lower()
        if '401' in message or 'invalid api key' in lowered or 'unauthorized' in lowered:
            message = 'GROQ_API_KEY is invalid. Update backend/.env with a valid key and restart backend.'
        elif '402' in message or 'insufficient credits' in lowered or 'payment' in lowered:
            message = 'Groq credits are insufficient for this model. Use another available model or add credits.'
        elif '429' in message or 'quota' in lowered or 'rate limit' in lowered:
            message = 'Groq rate limit or quota reached. Wait and retry, or switch to another model.'

        print(f"ERROR GENERATING ANSWER: {exc}")
        traceback.print_exc()
        return jsonify({'error': message}), 500


@app.route('/api/status', methods=['GET'])
def get_status():
    """Get current system status."""
    status = {
        'ready': retriever is not None and llm_client is not None,
        'retrieverReady': retriever is not None,
        'llmReady': llm_client is not None,
        'hasGroqKey': bool(os.getenv('GROQ_API_KEY')),
        'model': os.getenv('GROQ_MODEL', DEFAULT_GROQ_MODEL),
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

    groq_key = os.getenv('GROQ_API_KEY')
    groq_model = os.getenv('GROQ_MODEL', DEFAULT_GROQ_MODEL)
    if groq_key:
        print(f"Groq API key found: {groq_key[:10]}...")
        print(f"Groq model: {groq_model}")
    else:
        print("WARNING: No Groq API key found in .env file")
        print("Get one from: https://console.groq.com/keys")

    print("=" * 70)

    auto_init = os.getenv('AUTO_INIT_ON_START', '0') == '1'
    if auto_init and os.path.exists(DATASET_FOLDER) and os.listdir(DATASET_FOLDER):
        print("\nFound existing PDFs in dataset folder")
        initialize_qa_from_existing()
    elif not auto_init:
        print("\nSkipping startup vector load (AUTO_INIT_ON_START=0).")

    print("\nServer is ready! Upload a PDF to get started.\n")

    app.run(debug=debug_mode, host='0.0.0.0', port=port, use_reloader=False)
