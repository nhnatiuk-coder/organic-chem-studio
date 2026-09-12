import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { ChartIcon, CheckIcon, CrossIcon } from "@/components/Icons";
import { byId, clearHistory, exportSession, loadHistory, type SessionResult } from "@/lib/session";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Your results — Organic Nomenclature Studio" },
      {
        name: "description",
        content:
          "Review your completed nomenclature sets question by question and export a summary for your instructor.",
      },
      { property: "og:title", content: "Your practice results" },
      {
        property: "og:description",
        content: "Question-by-question review and JSON export of your completed sets.",
      },
    ],
  }),
  component: Results,
});

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character]!;
  });
}

function modeLabel(mode: SessionResult["settings"]["mode"]): string {
  if (mode === "mixed") return "Mixed tasks";
  return mode === "draw" ? "Draw from a Name" : "Name from a Structure";
}

function Results() {
  const [history, setHistory] = useState<SessionResult[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setHistory(loadHistory());
    setLoaded(true);
  }, []);

  const latest = history[history.length - 1];

  const download = (r: SessionResult) => {
    const blob = new Blob([exportSession(r)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nomenclature-results-${new Date(r.finishedAt).toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadPdf = (r: SessionResult) => {
    const report = window.open("", "_blank");
    if (!report) {
      window.print();
      return;
    }

    report.opener = null;
    const finishedAt = new Date(r.finishedAt).toLocaleString();
    const rows = r.records
      .map((record, index) => {
        const molecule = byId(record.moleculeId);
        return `<article class="question">
          <div class="question-heading">
            <span class="status ${record.correct ? "correct" : "incorrect"}">${record.correct ? "Correct" : "Incorrect"}</span>
            <strong>${index + 1}. ${escapeHtml(molecule.displayName)}</strong>
          </div>
          <p class="meta">${record.kind === "draw" ? "Draw from a Name" : "Name from a Structure"} · ${escapeHtml(molecule.topic)} · ${record.attempts} attempt${record.attempts === 1 ? "" : "s"}${record.usedHint ? " · used hint" : ""}</p>
          <p><strong>Student answer:</strong> ${escapeHtml(record.answer || "No answer")}</p>
          <p><strong>Correct answer:</strong> ${escapeHtml(molecule.displayName)}</p>
          <p class="explanation">${escapeHtml(molecule.explanation)}</p>
        </article>`;
      })
      .join("");

    report.document.write(`<!doctype html>
      <html lang="en"><head><meta charset="utf-8"><title>Organic Nomenclature Results</title>
      <style>
        @page { margin: 0.6in; }
        body { color: #18232d; font-family: Arial, sans-serif; line-height: 1.45; }
        h1 { margin: 0; font-size: 24px; } h2 { margin-top: 28px; font-size: 18px; }
        .summary { margin-top: 18px; padding: 16px; border: 1px solid #b8c4cf; border-radius: 10px; }
        .score { font-size: 28px; font-weight: 700; } .meta { color: #52606d; font-size: 12px; }
        .question { break-inside: avoid; margin: 12px 0; padding: 13px; border: 1px solid #d5dde5; border-radius: 8px; }
        .question-heading { display: flex; align-items: center; gap: 9px; } .question p { margin: 7px 0; font-size: 13px; }
        .status { border-radius: 999px; padding: 3px 7px; color: #fff; font-size: 11px; font-weight: 700; }
        .correct { background: #237a45; } .incorrect { background: #b42318; } .explanation { color: #435363; }
      </style></head><body>
        <h1>Organic Nomenclature Studio — Results</h1>
        <section class="summary"><div class="score">${r.score}/${r.total}</div>
          <p>${escapeHtml(modeLabel(r.settings.mode))} · ${escapeHtml(r.settings.difficulty)} · completed ${escapeHtml(finishedAt)}</p>
        </section>
        <h2>Question review</h2>${rows}
      </body></html>`);
    report.document.close();
    report.focus();
    window.setTimeout(() => report.print(), 250);
  };

  if (loaded && !latest) {
    return (
      <Shell>
        <h1 className="text-3xl font-bold">No results yet</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Finish a practice set and your score, review and export will appear here.
        </p>
        <Link
          to="/practice"
          className="mt-6 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Start a set
        </Link>
      </Shell>
    );
  }

  return (
    <Shell>
      <h1 className="text-3xl font-bold">Your results</h1>
      {latest && (
        <>
          <section className="mt-6 rounded-2xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Most recent set
                </p>
                <p className="mt-1 font-display text-4xl font-bold">
                  {latest.score}
                  <span className="text-xl text-muted-foreground">/{latest.total}</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {latest.settings.mode === "mixed"
                    ? "Mixed tasks"
                    : latest.settings.mode === "draw"
                      ? "Draw from a Name"
                      : "Name from a Structure"}{" "}
                  · {latest.settings.difficulty} · {new Date(latest.finishedAt).toLocaleString()}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => downloadPdf(latest)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
                >
                  Download PDF
                </button>
                <button
                  type="button"
                  onClick={() => download(latest)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary"
                >
                  Export JSON
                </button>
                <Link
                  to="/practice"
                  className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  Practice again
                </Link>
              </div>
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-semibold">Question review</h2>
            <ul className="mt-4 space-y-3">
              {latest.records.map((r, i) => {
                const m = byId(r.moleculeId);
                return (
                  <li
                    key={i}
                    className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"
                  >
                    <span className={r.correct ? "text-[var(--success)]" : "text-destructive"}>
                      {r.correct ? (
                        <CheckIcon className="size-5" />
                      ) : (
                        <CrossIcon className="size-5" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{m.displayName}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {r.kind === "draw" ? "Draw from a Name" : "Name from a Structure"} ·{" "}
                        {m.topic} · {r.attempts} attempt{r.attempts === 1 ? "" : "s"}
                        {r.usedHint ? " · used hint" : ""}
                      </p>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                        {m.explanation}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        </>
      )}

      {history.length > 1 && (
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <ChartIcon className="size-5 text-accent" /> Earlier sets
          </h2>
          <ul className="mt-4 space-y-2">
            {[...history]
              .slice(0, -1)
              .reverse()
              .map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3 text-sm"
                >
                  <span>
                    {new Date(r.finishedAt).toLocaleDateString()} · {r.settings.difficulty} ·{" "}
                    {r.settings.mode}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="font-semibold">
                      {r.score}/{r.total}
                    </span>
                    <button
                      type="button"
                      onClick={() => download(r)}
                      className="rounded-lg border border-border px-2.5 py-1 text-xs hover:bg-secondary"
                    >
                      Export
                    </button>
                  </span>
                </li>
              ))}
          </ul>
          <button
            type="button"
            onClick={() => {
              clearHistory();
              setHistory([]);
            }}
            className="mt-4 text-xs font-medium text-destructive hover:underline"
          >
            Clear saved results from this device
          </button>
        </section>
      )}
    </Shell>
  );
}
