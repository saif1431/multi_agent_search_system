"use client";

import { formatRelativeTime, type HistoryEntry } from "@/lib/history";

type HistorySidebarProps = {
  history: HistoryEntry[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onRemove: (id: string) => void;
  onClear: () => void;
};

export function HistorySidebar({
  history,
  activeId,
  onSelect,
  onRemove,
  onClear,
}: HistorySidebarProps) {
  return (
    <aside className="hidden w-72 shrink-0 flex-col border-r border-border bg-surface md:flex">
      <div className="sticky top-0 flex h-screen flex-col overflow-y-auto p-5">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs uppercase tracking-[0.15em] text-muted">
            History
          </span>
          {history.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="font-mono text-xs text-muted transition-colors hover:text-foreground"
            >
              Clear
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <p className="mt-6 text-sm text-muted">
            Questions you ask will be saved here so you can revisit past
            answers.
          </p>
        ) : (
          <ul className="mt-4 flex-1 space-y-1">
            {history.map((entry) => (
              <li key={entry.id} className="group relative">
                <button
                  type="button"
                  onClick={() => onSelect(entry.id)}
                  className={`w-full rounded-[8px] border px-3 py-2.5 pr-8 text-left transition-colors ${
                    entry.id === activeId
                      ? "border-border bg-background"
                      : "border-transparent hover:border-border hover:bg-background"
                  }`}
                >
                  <p className="line-clamp-2 text-sm text-foreground">
                    {entry.question}
                  </p>
                  <p className="mt-1 font-mono text-[11px] text-muted">
                    {formatRelativeTime(entry.createdAt)}
                  </p>
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onRemove(entry.id);
                  }}
                  aria-label="Remove from history"
                  className="absolute right-2 top-2.5 hidden h-5 w-5 items-center justify-center rounded text-muted transition-colors hover:bg-border hover:text-foreground group-hover:flex"
                >
                  <svg
                    viewBox="0 0 16 16"
                    width="10"
                    height="10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  >
                    <path d="M3 3l10 10M13 3L3 13" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
