import { ClientOnly, createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from "react";
import type { Ketcher } from "ketcher-core";
import { Shell } from "@/components/Shell";
import { StructureView } from "@/components/StructureView";
import { CheckIcon, CrossIcon, LightbulbIcon, PencilIcon, TagIcon } from "@/components/Icons";
import { gradeDrawing } from "@/lib/grade-structure";
import {
  byId,
  checkName,
  checkSmiles,
  clearActive,
  loadActive,
  loadHistory,
  saveActive,
  saveHistory,
  scoreOf,
  type ActiveSession,
  type AttemptRecord,
} from "@/lib/session";

const KetcherEditor = lazy(() => import("@/components/KetcherEditor"));

export const Route = createFileRoute("/practice/run")({
  head: () => ({
    meta: [
      { title: "Practice questions — Organic Nomenclature Studio" },
      {
        name: "description",
        content:
          "Work through your organic nomenclature set with hints, two attempts per question and a worked explanation.",
      },
      { property: "og:title", content: "Practice questions" },
      {
        property: "og:description",
        content: "Naming and structure questions with instant feedback.",
      },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Runner,
});

type Phase = "answering" | "retry" | "resolved";

function Runner() {
  const navigate = useNavigate();
  const [session, setSession] = useState<ActiveSession | null>(null);
  const [loaded, setLoaded] = useState(false);

  const [text, setText] = useState("");
  const [smiles, setSmiles] = useState("");
  const [phase, setPhase] = useState<Phase>("answering");
  const [attempts, setAttempts] = useState(0);
  const [usedHint, setUsedHint] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [editorReady, setEditorReady] = useState(false);
  const [editorFailed, setEditorFailed] = useState(false);
  const [checking, setChecking] = useState(false);
  const ketcherRef = useRef<Ketcher | null>(null);

  const handleEditorReady = useCallback((k: Ketcher) => {
    ketcherRef.current = k;
    setEditorReady(true);
  }, []);
  const handleEditorFail = useCallback(() => setEditorFailed(true), []);

  useEffect(() => {
    setSession(loadActive());
    setLoaded(true);
  }, []);

  const molecule = session ? byId(session.moleculeIds[session.index]!) : null;
  const kind = session?.kinds[session.index] ?? "name";

  if (!loaded) return <Shell><p className="text-sm text-muted-foreground">Loading…</p></Shell>;

  if (!session || !molecule) {
    return (
      <Shell>
        <h1 className="text-2xl font-bold">No practice set in progress</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Choose your mode and length, then start a new set.
        </p>
        <Link
          to="/practice"
          className="mt-6 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          Set up practice
        </Link>
      </Shell>
    );
  }

  const total = session.moleculeIds.length;
  const number = session.index + 1;

  const resolve = (correct: boolean, answer: string, attemptCount: number) => {
    setWasCorrect(correct);
    setPhase("resolved");
    const record: AttemptRecord = {
      moleculeId: molecule.id,
      kind,
      attempts: attemptCount,
      correct,
      usedHint,
      answer,
    };
    const next = { ...session, records: [...session.records, record] };
    setSession(next);
    saveActive(next);
  };

  const submit = () => {
    if (kind === "name" && !text.trim()) {
      setMessage("Type a name before checking.");
      return;
    }
    if (kind === "draw" && !smiles.trim()) {
      setMessage("Draw the molecule in Ketcher, then paste its exported SMILES to check it.");
      return;
    }
    const attemptCount = attempts + 1;
    setAttempts(attemptCount);

    if (kind === "name") {
      const answer = text.trim();
      const res = checkName(answer, molecule, session.settings.allowCommonNames);
      if (res.correct) {
        setMessage(
          res.viaCommonName
            ? `Accepted — that is the common name. The systematic name is ${molecule.iupacNames[0]}.`
            : "Correct.",
        );
        resolve(true, answer, attemptCount);
        return;
      }
      if (res.viaCommonName) {
        setMessage(
          "That is a common name, and this set requires the systematic IUPAC name. Try again.",
        );
      } else {
        setMessage("Not quite. Check the parent chain, the locants and the suffix.");
      }
      if (attemptCount >= 2) {
        resolve(false, answer, attemptCount);
        setMessage(`Answer: ${molecule.iupacNames[0]}.`);
      } else {
        setPhase("retry");
      }
      return;
    }

    // draw
    const typed = smiles.trim();
    const answer = typed;
    const correct = checkSmiles(typed, molecule);
    if (correct) {
      setMessage("Correct — that structure matches the name.");
      resolve(true, answer, attemptCount);
      return;
    }
    setMessage("That structure does not match the name. Recount the parent chain and branches.");
    if (attemptCount >= 2) {
      resolve(false, answer, attemptCount);
      setMessage(`The correct structure is highlighted below (${molecule.displayName}).`);
    } else {
      setPhase("retry");
    }
  };

  const next = () => {
    const idx = session.index + 1;
    if (idx >= total) {
      const result = {
        id: `s${Date.now()}`,
        finishedAt: Date.now(),
        settings: session.settings,
        records: session.records,
        score: scoreOf(session.records),
        total,
      };
      saveHistory([...loadHistory(), result]);
      clearActive();
      navigate({ to: "/results" });
      return;
    }
    const updated = { ...session, index: idx };
    setSession(updated);
    saveActive(updated);
    setText("");
    setSmiles("");
    setAttempts(0);
    setUsedHint(false);
    setPhase("answering");
    setMessage(null);
    setWasCorrect(false);
  };

  const quit = () => {
    clearActive();
    navigate({ to: "/practice" });
  };

  return (
    <Shell>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Question {number} of {total}
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-bold">
            {kind === "draw" ? (
              <PencilIcon className="size-5 text-accent" />
            ) : (
              <TagIcon className="size-5 text-accent" />
            )}
            {kind === "draw" ? "Draw from a Name" : "Name from a Structure"}
          </h1>
        </div>
        <button
          type="button"
          onClick={quit}
          className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:bg-secondary"
        >
          End set
        </button>
      </div>

      <div
        className="mt-4 h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={number}
        aria-valuemin={1}
        aria-valuemax={total}
      >
        <div
          className="h-full rounded-full bg-accent transition-all"
          style={{ width: `${(number / total) * 100}%` }}
        />
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-card p-6">
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          {molecule.topic} · {molecule.difficulty}
        </span>

        {kind === "draw" ? (
          <>
            <p className="mt-5 text-sm text-muted-foreground">Draw the structure of</p>
            <p className="font-display text-2xl font-semibold">{molecule.displayName}</p>
            <div className="mt-6 overflow-hidden rounded-xl border border-border bg-background">
              <iframe
                title="Ketcher molecular editor"
                src="https://lifescience.opensource.epam.com/ketcher/"
                className="h-[520px] w-full border-0"
                allow="clipboard-read; clipboard-write"
              />
            </div>
            <label className="mt-5 block text-sm font-medium" htmlFor="smiles-answer">
              Exported SMILES
            </label>
            <input
              id="smiles-answer"
              value={smiles}
              onChange={(e) => setSmiles(e.target.value)}
              disabled={phase === "resolved"}
              placeholder="Paste the SMILES exported from your drawing"
              className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-2.5 font-mono text-sm outline-none focus:border-accent"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Use the editor’s copy/export option to copy your structure as SMILES, then paste it
              here to check your drawing.
            </p>
            {phase === "resolved" && (
              <div className="mt-5 flex justify-center rounded-xl border border-border bg-background p-6">
                <StructureView
                  structure={molecule.structure}
                  title={molecule.displayName}
                  className="max-h-56 w-full max-w-md"
                />
              </div>
            )}
          </>
        ) : (
          <>
            <p className="mt-5 text-sm text-muted-foreground">Give the systematic name of</p>
            <div className="mt-4 flex justify-center rounded-xl border border-border bg-background p-6">
              <StructureView
                structure={molecule.structure}
                title="the molecule to name"
                className="max-h-56 w-full max-w-md"
              />
            </div>
            <label className="mt-5 block text-sm font-medium" htmlFor="name-answer">
              Your answer
            </label>
            <input
              id="name-answer"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && phase !== "resolved") submit();
              }}
              disabled={phase === "resolved"}
              placeholder="e.g. 2-methylbutane"
              className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:border-accent"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Spacing, capitalisation and hyphens are forgiven.{" "}
              {session.settings.allowCommonNames
                ? "Common names are accepted in this set."
                : "Common names are not accepted in this set."}
            </p>
          </>
        )}

        {session.settings.showHints && phase !== "resolved" && (
          <div className="mt-5">
            {usedHint ? (
              <p className="flex items-start gap-2 rounded-xl bg-[var(--amber)]/20 p-3 text-sm text-[var(--amber-foreground)]">
                <LightbulbIcon className="mt-0.5 size-4 shrink-0" />
                {molecule.hint}
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setUsedHint(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-secondary"
              >
                <LightbulbIcon className="size-4" /> Show a hint
              </button>
            )}
          </div>
        )}

        {message && (
          <p
            className={`mt-5 flex items-start gap-2 rounded-xl p-3 text-sm ${
              phase === "resolved"
                ? wasCorrect
                  ? "bg-[var(--success)]/15 text-foreground"
                  : "bg-destructive/10 text-foreground"
                : "bg-secondary text-secondary-foreground"
            }`}
          >
            {phase === "resolved" ? (
              wasCorrect ? (
                <CheckIcon className="mt-0.5 size-4 shrink-0 text-[var(--success)]" />
              ) : (
                <CrossIcon className="mt-0.5 size-4 shrink-0 text-destructive" />
              )
            ) : null}
            {message}
          </p>
        )}

        {phase === "resolved" && (
          <div className="mt-4 rounded-xl border border-border bg-background p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Why
            </p>
            <p className="mt-2 text-sm leading-relaxed">{molecule.explanation}</p>
            {molecule.commonNames.length > 0 && (
              <p className="mt-2 text-xs text-muted-foreground">
                Also known as: {molecule.commonNames.join(", ")}
              </p>
            )}
          </div>
        )}

        <div className="mt-6 flex items-center gap-3">
          {phase === "resolved" ? (
            <button
              type="button"
              onClick={next}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              {number === total ? "See results" : "Next question"}
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              {phase === "retry" ? "Check again (last attempt)" : "Check answer"}
            </button>
          )}
          <span className="text-xs text-muted-foreground">
            Attempt {Math.min(attempts + (phase === "resolved" ? 0 : 1), 2)} of 2
          </span>
        </div>
      </div>
    </Shell>
  );
}
