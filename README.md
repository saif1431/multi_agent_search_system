# Multi-Agent Research System

A multi-agent research assistant built with LangChain/LangGraph, Groq (LLM), Tavily (web search), and BeautifulSoup (web scraping). A LangGraph ReAct agent uses the tools to research a topic, and an LCEL (Runnables) pipeline wraps that agent with a synthesis step to produce a final, cited answer.

## Status

✅ **LCEL pipeline + FastAPI backend + Next.js frontend all wired up end-to-end.**

- [app/](app/) — the backend, as an installable Python package (required by FastAPI Cloud's deploy tooling; see `pyproject.toml`)
  - [app/tools.py](app/tools.py)
    - `web_search(query)` — searches the web via Tavily (top 2 results), returns title/URL/content.
    - `scrape_url(url)` — fetches a URL and extracts clean text from it via BeautifulSoup.
  - [app/llm.py](app/llm.py) — `ChatGroq` instance (`openai/gpt-oss-20b`) used by both the agent and the synthesis step.
  - [app/agent.py](app/agent.py) — a `langchain.agents.create_agent` ReAct agent bound to both tools, exposed as `run_research_agent(question)`.
  - [app/pipeline.py](app/pipeline.py) — the LCEL pipeline: `RunnablePassthrough.assign` runs the ReAct agent to gather research notes, then pipes `{question, research}` through a synthesis prompt → `llm` → `StrOutputParser` to produce the final formatted answer with a Sources section.
  - [app/api.py](app/api.py) — FastAPI app exposing `POST /research` (and `GET /health`), wrapping `pipeline.run`. CORS is enabled for `http://localhost:3000`.
- [main.py](main.py) — CLI entry point (at repo root, outside the package) that runs one hardcoded question through the pipeline.
- [frontend/](frontend/) — Next.js (App Router, TypeScript, Tailwind v4) UI. `src/components/research-console.tsx` is the client component with the question form and rendered answer; styled as a minimalist editorial console (warm monochrome palette, Newsreader serif headings, Geist Sans/Mono) per the project's minimalist-ui design skill. Answers are rendered with `react-markdown` + `remark-gfm` (the API returns markdown, including tables).
  - **History** — every answered question is saved to `localStorage` (`src/lib/history.ts`, capped at 30 entries) and listed in a sidebar with relative timestamps; selecting one re-displays it with no new API call. Entries can be removed individually or all at once. Desktop-only for now (sidebar is hidden below the `md` breakpoint).
  - **Export** — an "Export PDF" button renders the currently displayed question + answer to a paginated PDF client-side (`src/lib/export.ts`, via `html2canvas-pro` + `jspdf`) and downloads it directly, no server round-trip or print dialog.

Not yet built: automated tests.

## Purpose

The pipeline works like this:
1. A question comes in (currently hardcoded in `main.py`; will come from the API/UI next).
2. The ReAct agent (`agent.py`) reasons over the question, calling `web_search` to find sources and `scrape_url` to read the most promising pages in full.
3. The agent's raw findings + the original question are passed through a synthesis prompt in `pipeline.py`, which asks the LLM to write a clear, well-organized answer grounded only in those findings, ending with a Sources list.
4. The result is a synthesized, cited research answer returned as a plain string.

## Setup

1. Create/activate the virtual environment (already present as `.venv`):
   ```powershell
   .venv\Scripts\activate
   ```
2. Install dependencies:
   ```powershell
   pip install -r requirements.txt
   ```
3. Create a `.env` file in the project root (already gitignored) with:
   ```
   TAVILY_API_KEY=your_tavily_key
   GROQ_API_KEY=your_groq_key
   ```

## Testing what's built so far

There's no automated test suite yet. Run the full pipeline end-to-end:

```powershell
python main.py
```

Or call it directly with your own question:

```powershell
python -c "from app.pipeline import run; print(run('What is the latest research on multi-agent systems?'))"
```

To test the tools in isolation:

```powershell
python -c "from app.tools import web_search; print(web_search.invoke('multi-agent LLM systems'))"
python -c "from app.tools import scrape_url; print(scrape_url.invoke('https://example.com'))"
```

**Note on Groq rate limits:** the free-tier API key is capped at 8000 tokens/minute across the whole account (not per-model). `web_search` and `scrape_url` deliberately return small, truncated output to stay under this, and `llm.py` sets `max_retries=6` to ride out transient 429s. If you see `RateLimitError`, wait a few seconds and retry, or upgrade the Groq tier.

**Note on answer grounding:** `openai/gpt-oss-20b` is a small model — spot-check the URLs it cites in the Sources section, as it can occasionally add plausible-looking sources beyond what the tools actually returned.

### Running the API

Start the dev server:

```powershell
python -m uvicorn app.api:app --reload --host 127.0.0.1 --port 8000
```

Interactive docs (Swagger UI) are then available at `http://127.0.0.1:8000/docs`.

Test it with curl/PowerShell:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/research" -Method Post -ContentType "application/json" -Body (@{ question = "What is LangGraph used for?" } | ConvertTo-Json)
```

`POST /research` takes `{"question": "..."}` and returns `{"answer": "..."}`. It returns HTTP 429 if the Groq rate limit is hit.

### Running the frontend

With the API running (see above), in a separate terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:3000`. The frontend reads the API's base URL from `frontend/.env.local` (`NEXT_PUBLIC_API_BASE_URL`, defaults to `http://127.0.0.1:8000`).

## Deployment

**Backend — FastAPI Cloud.** Deployed with the `fastapi-cloud-cli` (installed via `pip install "fastapi[standard]"`):
```powershell
fastapi login
fastapi deploy
```
This requires `pyproject.toml` at the repo root (present) and the backend to be a real installable package — hence `app/` being a package (`app/__init__.py`) rather than loose top-level `.py` files; a flat layout with multiple top-level modules made setuptools refuse to guess how to package it. After the first deploy, set `TAVILY_API_KEY`, `GROQ_API_KEY`, and `FRONTEND_ORIGINS` (your Vercel URL, once deployed) as env vars/secrets in the FastAPI Cloud dashboard.

**Backend — Docker/Render fallback.** [Dockerfile](Dockerfile) still works as an alternative (`uvicorn app.api:app`) if FastAPI Cloud isn't viable; `render.yaml` was removed when we moved off Render but the Dockerfile itself needs no changes to redeploy there.

**Frontend — Vercel** (not yet done): set `NEXT_PUBLIC_API_BASE_URL` to the deployed backend URL.

## Roadmap

- [x] Define Groq-backed LLM agent(s) using `langchain-groq`
- [x] Build a ReAct agent wired to `web_search` and `scrape_url`
- [x] Compose the pipeline with LCEL Runnables
- [x] Add a `main.py` entry point to run end-to-end queries
- [x] FastAPI backend exposing the pipeline as an endpoint
- [x] Next.js frontend UI
- [ ] Deploy backend (FastAPI Cloud, in progress)
- [ ] Deploy frontend (Vercel)
- [ ] Add automated tests
