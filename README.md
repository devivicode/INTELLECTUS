# Intellectus — merged project

This combines:

- **`backend/`** — the original FastAPI backend (`app.py`) with its retrieval, chat, and
  analytics logic **unchanged**. Only two additive things were added: CORS middleware (so
  the Vite dev server can call it) and static-file serving so it can host the new frontend's
  production build.
- **`frontend/`** — the new "KPS" React/Vite UI, now wired to the real backend instead of
  mock data (see "What changed in the frontend" below).

## Running in development (two servers, hot reload)

Terminal 1 — backend:
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # or the Windows equivalent
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
```

Terminal 2 — frontend:
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. The Vite dev server proxies every `/api/*` request to
`http://localhost:8000` (see `frontend/vite.config.ts`), so the browser never needs CORS in
practice — the backend's CORS middleware is just a safety net.

## Running as one server (production-style)

```bash
cd frontend
npm install
npm run build            # outputs frontend/dist

cd ../backend
pip install -r requirements.txt
uvicorn app:app --port 8000
```

Open `http://localhost:8000`. FastAPI now serves `frontend/dist` directly (built assets under
`/assets`, `index.html` at `/`, plus a catch-all for any other static file) alongside every
`/api/*` route. The old minimal test UI still lives at `/static/index.html` if you ever want to
compare behavior against the original reference frontend.

## What changed in the frontend

The new frontend was previously fully mocked. It now talks to the real backend for the three
areas you asked about:

- **`src/utils/api.ts`** (new) — typed fetch client for `/api/chat`, `/api/fir/{id}`,
  `/api/criminal/{id}`, `/api/search`, `/api/overview`, `/api/conversation/{id}`.
- **`src/utils/adapters.ts`** (new) — maps the backend's real FIR/criminal JSON onto the
  frontend's existing `FIR` UI type (used by `CaseDetails.tsx`), so that page didn't need to
  change at all. Fields the source database doesn't provide (lat/long, per-case sections,
  evidence files, filing officer, etc.) are filled with `"Not recorded"` — consistent with how
  the backend itself already handles missing data.
- **`src/pages/AIAssistant.tsx`** — replaced the hardcoded canned responses with real calls to
  `POST /api/chat`, session continuity (`session_id` persisted the same way the reference
  `static/app.js` frontend does), and **clickable citations**: an `FIR` citation fetches
  `/api/fir/{id}` and opens the real Case Details page; a `CRIMINAL` citation fetches
  `/api/criminal/{id}` and opens a profile modal, whose past cases are themselves clickable.
- **`src/pages/Search.tsx`** — replaced the static 5-record mock array with the backend's
  native search: it debounces the query box, calls `GET /api/search?q=...&kind=FIR`, then
  fetches full details for the matches (capped at 30) and adapts them for the existing card UI.
  Client-side facet filters (district, gravity, status, category, date range) still run on top
  of those live results, exactly like before.

Everything else in the frontend (Dashboard, Analytics, Admin, Settings, the language/dark-mode
toggle) is unchanged and still uses mock data — the request was scoped to chatbot, citations,
and search, so that's what got merged onto the real backend.

## Known limitations (inherited from the source data, not introduced by this merge)

- No persistent person ID across cases — repeat-offender matching is by exact name, exactly as
  the backend already documents.
- Per-case Act/Section and evidence-file data isn't exposed by `/api/fir/{id}` yet, so those
  tabs render empty in Case Details when populated from search/citations.
- The "Criminal Network" panel on the Search page is now scoped to whatever's currently loaded
  from a search (previously it silently used the whole 5-record mock array); the backend's own
  full-database repeat-offender view is available through the AI Assistant's "Find repeat
  offenders" suggestion.
