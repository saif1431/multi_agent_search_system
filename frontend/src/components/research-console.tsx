"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { HistorySidebar } from "@/components/history-sidebar";
import { exportPdf } from "@/lib/export";
import { loadHistory, saveHistory, type HistoryEntry } from "@/lib/history";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

const EXAMPLE_QUESTIONS = [
  "What is the latest research on multi-agent LLM systems?",
  "How does LangGraph differ from a plain LCEL chain?",
  "What are the known failure modes of ReAct agents?",
];

type Status = "idle" | "loading" | "error";

export function ResearchConsole() {
  const [question, setQuestion] = useState("");
  const [pendingQuestion, setPendingQuestion] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState("");
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setHistory(loadHistory());
    setHistoryLoaded(true);
  }, []);

  useEffect(() => {
    if (historyLoaded) saveHistory(history);
  }, [history, historyLoaded]);

  const activeEntry = history.find((entry) => entry.id === activeId) ?? null;

  async function submitQuestion(value: string) {
    const trimmed = value.trim();
    if (!trimmed || status === "loading") return;

    setStatus("loading");
    setErrorMessage("");
    setActiveId(null);
    setPendingQuestion(trimmed);

    try {
      const res = await fetch(`${API_BASE_URL}/research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });

      if (res.status === 429) {
        throw new Error(
          "The research backend hit its Groq rate limit. Wait a few seconds and try again.",
        );
      }
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.detail ?? `Request failed (${res.status}).`);
      }

      const data: { answer: string } = await res.json();
      const entry: HistoryEntry = {
        id:
          typeof crypto.randomUUID === "function"
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        question: trimmed,
        answer: data.answer,
        createdAt: Date.now(),
      };

      setHistory((prev) => [entry, ...prev]);
      setActiveId(entry.id);
      setStatus("idle");
      setQuestion("");
    } catch (err) {
      setErrorMessage(
        err instanceof Error
          ? err.message
          : "Something went wrong reaching the research backend.",
      );
      setStatus("error");
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitQuestion(question);
  }

  function selectEntry(id: string) {
    setActiveId(id);
    setStatus("idle");
    setErrorMessage("");
  }

  function removeEntry(id: string) {
    setHistory((prev) => prev.filter((entry) => entry.id !== id));
    if (activeId === id) setActiveId(null);
  }

  async function handleExportPdf() {
    if (!activeEntry || !exportRef.current || exporting) return;
    setExporting(true);
    setExportError("");
    try {
      await exportPdf(activeEntry, exportRef.current);
    } catch {
      setExportError("Could not generate the PDF. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  function clearHistory() {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Clear all saved research history?")
    ) {
      return;
    }
    setHistory([]);
    setActiveId(null);
  }

  return (
    <div className="flex min-h-screen w-full flex-1">
      <HistorySidebar
        history={history}
        activeId={activeId}
        onSelect={selectEntry}
        onRemove={removeEntry}
        onClear={clearHistory}
      />

      <main className="flex flex-1 flex-col items-center overflow-y-auto bg-background px-6 py-20 sm:py-28">
        <div className="w-full max-w-3xl">
          <header className="rise-in mb-12">
            <p className="font-mono text-xs uppercase tracking-[0.15em] text-muted">
              Multi-agent research system
            </p>
            <h1 className="mt-3 font-serif text-4xl italic tracking-tight text-foreground sm:text-5xl">
              Research console
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted">
              Ask a question. A search agent and a page-reading agent gather
              sources, then a synthesis pass writes a cited answer.
            </p>
          </header>

          <form
            onSubmit={handleSubmit}
            className="rise-in rounded-[10px] border border-border bg-surface p-6 sm:p-8"
            style={{ animationDelay: "80ms" }}
          >
            <label
              htmlFor="question"
              className="font-mono text-xs uppercase tracking-[0.1em] text-muted"
            >
              Question
            </label>
            <textarea
              id="question"
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              placeholder="What is the latest research on multi-agent LLM systems?"
              rows={3}
              className="mt-3 w-full resize-none border-0 bg-transparent text-lg text-foreground placeholder:text-muted/60 focus:outline-none"
            />

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5">
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_QUESTIONS.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => {
                      setQuestion(example);
                      void submitQuestion(example);
                    }}
                    className="rounded-full border border-border px-3 py-1 text-xs text-muted transition-colors hover:border-foreground/20 hover:text-foreground"
                  >
                    {example.length > 38
                      ? `${example.slice(0, 38)}…`
                      : example}
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={
                  status === "loading" || question.trim().length === 0
                }
                className="rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-all hover:bg-[#333333] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {status === "loading" ? "Researching…" : "Ask"}
              </button>
            </div>
          </form>

          <div className="mt-10">
            {status === "loading" && (
              <div className="rise-in">
                <p className="font-serif text-xl italic text-foreground">
                  {pendingQuestion}
                </p>
                <div className="mt-4 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.1em] text-muted">
                  <span className="flex gap-1">
                    <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-muted" />
                    <span
                      className="pulse-dot h-1.5 w-1.5 rounded-full bg-muted"
                      style={{ animationDelay: "160ms" }}
                    />
                    <span
                      className="pulse-dot h-1.5 w-1.5 rounded-full bg-muted"
                      style={{ animationDelay: "320ms" }}
                    />
                  </span>
                  Searching, then reading sources
                </div>
              </div>
            )}

            {status === "error" && (
              <div
                className="rise-in rounded-[10px] border px-5 py-4 text-sm"
                style={{
                  borderColor: "var(--pastel-red-text)",
                  background: "var(--pastel-red-bg)",
                  color: "var(--pastel-red-text)",
                }}
              >
                {errorMessage}
              </div>
            )}

            {status === "idle" && activeEntry && (
              <div className="rise-in">
                <div className="flex justify-end">
                  <div className="flex flex-col items-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => void handleExportPdf()}
                      disabled={exporting}
                      className="shrink-0 rounded-md border border-border px-3 py-1.5 font-mono text-xs uppercase tracking-[0.08em] text-muted transition-colors hover:border-foreground/30 hover:text-foreground disabled:cursor-wait disabled:opacity-50"
                    >
                      {exporting ? "Preparing PDF…" : "Export PDF"}
                    </button>
                    {exportError && (
                      <span
                        className="text-xs"
                        style={{ color: "var(--pastel-red-text)" }}
                      >
                        {exportError}
                      </span>
                    )}
                  </div>
                </div>

                <div ref={exportRef} className="mt-2 bg-surface">
                  <h2 className="border-b border-border pb-4 font-serif text-xl italic text-foreground">
                    {activeEntry.question}
                  </h2>
                  <p className="pt-4 font-mono text-xs text-muted">
                    {new Date(activeEntry.createdAt).toLocaleString()}
                  </p>
                  <article className="answer">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {activeEntry.answer}
                    </ReactMarkdown>
                  </article>
                </div>
              </div>
            )}

            {status === "idle" && !activeEntry && (
              <p className="rise-in text-sm text-muted">
                Ask a question above to start your first research brief.
              </p>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
