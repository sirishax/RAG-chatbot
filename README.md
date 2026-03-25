# ClarifyAI RAG Chatbot

ClarifyAI is a PDF question-answering app with:

- a React + Vite frontend in `frontend/`
- a Flask backend in `backend/`
- Gemini for answer generation
- FAISS + sentence-transformers for retrieval

## What API Key Is Needed

You need:

- `GEMINI_API_KEY`

Get it from Google AI Studio:

- https://aistudio.google.com/app/apikey

Notes:

- A Hugging Face token is not required for the current backend.
- The embedding model is downloaded on first run, so the backend needs internet access at least once.

## Best Deployment Method

For this project, the best split is:

1. Frontend on Vercel
2. Backend on Railway

Why:

- Vercel is a very good fit for the Vite frontend.
- Railway is a better fit for the Flask backend because this app writes uploaded PDFs and FAISS indexes to disk.
- Vercel serverless Python is possible, but it is not the best fit for this backend because local filesystem state is not durable between invocations.

I removed the previous Render-specific setup from the repo.

## Run Locally

Use Python `3.11` or `3.12`. Do not use `3.13` for this backend dependency stack.

### Backend

```powershell
cd backend
py -3.11 -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Then put this in `backend/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Start the backend:

```powershell
python server.py
```

Backend runs at:

- `http://localhost:5000`

### Frontend

```powershell
cd frontend
npm.cmd install
copy .env.example .env
```

Set:

```env
VITE_API_BASE_URL=http://localhost:5000
```

Start the frontend:

```powershell
npm.cmd run dev
```

Frontend runs at:

- `http://localhost:3000`

## Deploy Frontend To Vercel

Recommended approach:

1. Import the repo into Vercel
2. Set the project Root Directory to `frontend`
3. Set `VITE_API_BASE_URL` to your backend URL
4. Deploy

The repo includes `frontend/vercel.json` for SPA routing.

## Deploy Backend To Railway

Recommended approach:

1. Create a new Railway project
2. Deploy from your GitHub repo
3. Set the service root directory to `backend`
4. Set `GEMINI_API_KEY`
5. Use the start command from `backend/Procfile`

The backend already supports production port binding through `PORT`.
