# Backend

Flask API for PDF upload, indexing, and question answering.

## Required Environment Variable

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Get the key here:

- https://aistudio.google.com/app/apikey

## Local Run

Use Python `3.11` or `3.12`.

```powershell
py -3.11 -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python server.py
```

## Railway Deploy

Recommended service settings:

- Root directory: `backend`
- Start command: `gunicorn server:app --bind 0.0.0.0:$PORT`
- Environment variable: `GEMINI_API_KEY`

Files included for deploy:

- `.python-version`
- `Procfile`
