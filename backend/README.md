# Intellectus prototype

Run locally with Python 3.10+:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app:app --reload
```

Open `http://127.0.0.1:8000`. On each start, the backend reads the supplied `crime_analytics.sqlite3` and builds a local, derived `analytics_index.sqlite3` for search. The source database remains unchanged.

Optional OpenRouter synthesis:

```powershell
$env:OPENROUTER_API_KEY="your-key"
$env:OPENROUTER_MODEL="openai/gpt-4o-mini"
uvicorn app:app --reload
```

Or set `OPENROUTER_API_KEY` and `OPENROUTER_MODEL` in the local `.env` file; it is loaded automatically at startup.

Without an API key, the local deterministic router supports SQL-style counts, lexical-vector matching, hybrid metadata filtering, citations, profiles, manual lookup, mock voice, and export notification. An API key enables optional answer synthesis only; it does not replace database retrieval.
