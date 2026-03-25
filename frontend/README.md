# Frontend

React + Vite frontend for ClarifyAI.

## Local Run

```powershell
npm.cmd install
copy .env.example .env
npm.cmd run dev
```

Set:

```env
VITE_API_BASE_URL=http://localhost:5000
```

## Vercel Deploy

Recommended Vercel settings:

- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Environment Variable: `VITE_API_BASE_URL`

The repo includes `vercel.json` for SPA routing.
