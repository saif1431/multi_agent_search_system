"use client";

import { useState, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";

const EXAMPLE_QUESTIONS = [
  "What is the latest research on multi-agent LLM systems?",
  "How does LangGraph differ from a plain LCEL chain?",
  "What are the known failure modes of ReAct agents?",
];

type Status = "idle" | "loading" | "done" | "error";

export function ResearchConsole() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function submitQuestion(value: string) {
    const trimmed = value.trim();
    if (!trimmed || status === "loading") return;

    setStatus("loading");
    setErrorMessage("");
    setAnswer("");

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
      setAnswer(data.answer);
      setStatus("done");
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

  return (
    <div className="flex flex-1 flex-col items-center bg-background px-6 py-20 sm:py-28">
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
              disabled={status === "loading" || question.trim().length === 0}
              className="rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background transition-all hover:bg-[#333333] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
            >
              {status === "loading" ? "Researching…" : "Ask"}
            </button>
          </div>
        </form>

        <div className="mt-10">
          {status === "loading" && (
            <div className="rise-in flex items-center gap-3 font-mono text-xs uppercase tracking-[0.1em] text-muted">
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

          {status === "done" && (
            <article className="answer rise-in">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {answer}
              </ReactMarkdown>
            </article>
          )}
        </div>
      </div>
    </div>
  );
}
