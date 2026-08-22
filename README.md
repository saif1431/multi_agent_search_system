# Multi-Agent Research System

A multi-agent research assistant built with LangChain/LangGraph, Groq (LLM), Tavily (web search), and BeautifulSoup (web scraping). A LangGraph ReAct agent uses the tools to research a topic, and an LCEL (Runnables) pipeline wraps that agent with a synthesis step to produce a final, cited answer.

## Status

✅ **LCEL pipeline working end-to-end** (CLI only so far, no API/UI yet).

- [tools.py](tools.py)
  - `web_search(query)` — searches the web via Tavily (top 2 results), returns title/URL/content.
  - `scrape_url(url)` — fetches a URL and extracts clean text from it via BeautifulSoup.
- [llm.py](llm.py) — `ChatGroq` instance (`openai/gpt-oss-20b`) used by both the agent and the synthesis step.
- [agent.py](agent.py) — a `langchain.agents.create_agent` ReAct agent bound to both tools, exposed as `run_research_agent(question)`.
- [pipeline.py](pipeline.py) — the LCEL pipeline: `RunnablePassthrough.assign` runs the ReAct agent to gather research notes, then pipes `{question, research}` through a synthesis prompt → `llm` → `StrOutputParser` to produce the final formatted answer with a Sources section.
- [main.py](main.py) — CLI entry point that runs one hardcoded question through the pipeline.

Not yet built: FastAPI backend, Next.js frontend, automated tests.

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
python -c "from pipeline import run; print(run('What is the latest research on multi-agent systems?'))"
```

To test the tools in isolation:

```powershell
python -c "from tools import web_search; print(web_search.invoke('multi-agent LLM systems'))"
python -c "from tools import scrape_url; print(scrape_url.invoke('https://example.com'))"
```

**Note on Groq rate limits:** the free-tier API key is capped at 8000 tokens/minute across the whole account (not per-model). `web_search` and `scrape_url` deliberately return small, truncated output to stay under this, and `llm.py` sets `max_retries=6` to ride out transient 429s. If you see `RateLimitError`, wait a few seconds and retry, or upgrade the Groq tier.

**Note on answer grounding:** `openai/gpt-oss-20b` is a small model — spot-check the URLs it cites in the Sources section, as it can occasionally add plausible-looking sources beyond what the tools actually returned.

## Roadmap

- [x] Define Groq-backed LLM agent(s) using `langchain-groq`
- [x] Build a ReAct agent wired to `web_search` and `scrape_url`
- [x] Compose the pipeline with LCEL Runnables
- [x] Add a `main.py` entry point to run end-to-end queries
- [ ] FastAPI backend exposing the pipeline as an endpoint
- [ ] Next.js frontend UI
- [ ] Add automated tests
