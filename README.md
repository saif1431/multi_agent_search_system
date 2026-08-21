# Multi-Agent Research System

A multi-agent research assistant built with LangChain/LangGraph, Groq (LLM), Tavily (web search), and BeautifulSoup (web scraping). Agents will use these tools via a ReAct agent and an LCEL (Runnables) pipeline to research topics on the web and return synthesized answers.

## Status

🚧 **Early stage.** Only the tools layer is implemented so far:

- [tools.py](tools.py)
  - `web_search(query)` — searches the web via Tavily, returns title/URL/content for top results.
  - `scrape_url(url)` — fetches a URL and extracts clean text from it via BeautifulSoup.

Not yet built: the Groq-backed LLM agents, the ReAct agent, and the LCEL pipeline connecting them.

## Purpose

The end goal is a research pipeline where:
1. An agent takes a research question.
2. It uses the `web_search` tool (Tavily) to find relevant sources.
3. It uses the `scrape_url` tool (BeautifulSoup) to pull full content from promising links.
4. A LangGraph ReAct agent reasons over these tool results, and an LCEL Runnable pipeline composes the steps (search → scrape → synthesize) into a final answer.

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

There's no test suite yet — the tools are verified by running the module directly. To try the search tool:

```powershell
python -c "from tools import web_search; print(web_search.invoke('What is the latest research on multi-agent systems?'))"
```

To try the scraping tool:

```powershell
python -c "from tools import scrape_url; print(scrape_url.invoke('https://example.com'))"
```

(Do **not** run `python -m tools.py` — with `-m` you give the module name without `.py`, i.e. `python -m tools`.)

## Roadmap

- [ ] Define Groq-backed LLM agent(s) using `langchain-groq`
- [ ] Build a LangGraph ReAct agent wired to `web_search` and `scrape_url`
- [ ] Compose the pipeline with LCEL Runnables
- [ ] Add a `main.py` entry point to run end-to-end queries
- [ ] Add automated tests
