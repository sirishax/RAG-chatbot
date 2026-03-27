# Backend

Flask API for PDF upload, indexing, and question answering.

## Required Environment Variable

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.3-70b-versatile
GROQ_FALLBACK_MODELS=llama-3.1-8b-instant,gemma2-9b-it
PORT=5000
FLASK_DEBUG=0
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
AUTO_INIT_ON_START=0
```

Get the key here:

- https://console.groq.com/keys

## Local Run

Use Python `3.11` or `3.12`.

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python server.py
```

Notes:

- `AUTO_INIT_ON_START=0` keeps startup fast and avoids long boot times.
- If `GROQ_API_KEY` is missing or invalid, PDF upload/indexing still works, but Q&A responses will fail until the key is fixed.
- If the primary model is rate-limited, backend automatically retries configured `GROQ_FALLBACK_MODELS`.

## Railway Deploy

Recommended service settings:

- Root directory: `backend`
- Start command: `gunicorn server:app --bind 0.0.0.0:$PORT`
- Environment variable: `GROQ_API_KEY`

Files included for deploy:

- `.python-version`
- `Procfile`
