# RAG PDF Q&A Backend

Flask-based REST API server for RAG (Retrieval Augmented Generation) PDF question-answering system.

## Features

- 📄 PDF upload and processing
- 🔍 Intelligent document chunking
- 🧠 Vector embeddings with FAISS
- 💬 Question answering with Mistral AI
- 📚 Source document tracking

## Setup

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

Create `.env` file:

```env
HF_TOKEN=your_huggingface_token_here
```

Get your token from [HuggingFace Settings](https://huggingface.co/settings/tokens)

### 3. Run Server

```bash
python server.py
```

Server will start on `http://localhost:5000`

## API Endpoints

### Health Check
```
GET /api/health
```

### Upload PDF
```
POST /api/upload
Content-Type: multipart/form-data
Body: { file: <pdf_file> }
```

### Ask Question
```
POST /api/ask
Content-Type: application/json
Body: { "question": "your question here" }
```

### Get Status
```
GET /api/status
```

### Reset Conversation
```
POST /api/reset
Content-Type: application/json
Body: { "clearFiles": true/false }
```

## Project Structure

```
backend/
├── server.py           # Flask API server
├── requirements.txt    # Python dependencies
├── .env               # Environment variables
├── .env.example       # Example env file
├── uploads/           # Temporary uploaded files
├── dataset/           # Processed PDFs
└── vectorstore/       # FAISS vector database
    └── database_fs/
```

## Tech Stack

- **Flask**: Web framework
- **LangChain**: LLM orchestration
- **FAISS**: Vector similarity search
- **HuggingFace**: Embeddings & LLM
- **Mistral AI**: Language model

## Configuration

- **Max File Size**: 10MB
- **Chunk Size**: 500 characters
- **Chunk Overlap**: 60 characters
- **Top K Results**: 3 documents
- **LLM Temperature**: 0.6
- **Max Tokens**: 512

## Error Handling

All endpoints return JSON responses with appropriate HTTP status codes:

- `200`: Success
- `400`: Bad request / validation error
- `500`: Server error

## Development

Enable debug mode (already set in `server.py`):

```python
app.run(debug=True, host='0.0.0.0', port=5000)
```

## CORS

CORS is enabled for all origins to allow frontend communication.

## Notes

- PDFs are stored in both `uploads/` and `dataset/` folders
- Vector database is persisted in `vectorstore/database_fs/`
- Embeddings are cached after first load