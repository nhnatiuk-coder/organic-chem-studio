import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Shell } from "@/components/Shell";
import { BookIcon, HexIcon } from "@/components/Icons";
import { StructureView } from "@/components/StructureView";
import { MOLECULES, type Difficulty } from "@/lib/molecules";
import { loadSettings, saveSettings, type Settings } from "@/lib/session";

export const Route = createFileRoute("/instructor")({
  head: () => ({
    meta: [
      { title: "Instructor guide — Organic Nomenclature Studio" },
      {
        name: "description",
        content:
          "How to embed the nomenclature activity in Canvas, set defaults such as common-name acceptance, and review or extend the question bank.",
      },
      { property: "og:title", content: "Instructor guide" },
      {
        property: "og:description",
        content: "Embedding, defaults, question bank export and integration notes for teachers.",
      },
    ],
  }),
  component: Instructor,
});

function Instructor() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [imported, setImported] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [topic, setTopic] = useState("all");
  const [difficulty, setDifficulty] = useState<"all" | Difficulty>("all");

  useEffect(() => setSettings(loadSettings()), []);

  const update = (patch: Partial<Settings>) => {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
  };

  const exportBank = () => {
    const data = MOLECULES.map((m) => ({
      id: m.id,
      smiles: m.smiles,
      iupacNames: m.iupacNames,
      commonNames: m.commonNames,
      difficulty: m.difficulty,
      topic: m.topic,
      hint: m.hint,
      explanation: m.explanation,
    }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nomenclature-question-bank.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importBank = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const n = Array.isArray(parsed) ? parsed.length : 0;
        setImported(
          n > 0
            ? `Read ${n} items. Validation passed — in this standalone build the bank is seeded in code, so imported items are previewed here rather than saved.`
            : "That file did not contain a list of questions.",
        );
      } catch {
        setImported("That file is not valid JSON.");
      }
    };
    reader.readAsText(file);
  };

  const byTopic = [...new Set(MOLECULES.map((m) => m.topic))].map((t) => ({
    topic: t,
    count: MOLECULES.filter((m) => m.topic === t).length,
  }));

  const reviewedMolecules = useMemo(() => {
    const term = query.trim().toLowerCase();
    return MOLECULES.filter((molecule) => {
      const matchesTopic = topic === "all" || molecule.topic === topic;
      const matchesDifficulty = difficulty === "all" || molecule.difficulty === difficulty;
      const searchable = [
        molecule.displayName,
        molecule.smiles,
        ...molecule.iupacNames,
        ...molecule.commonNames,
      ]
        .join(" ")
        .toLowerCase();
      return matchesTopic && matchesDifficulty && (!term || searchable.includes(term));
    });
  }, [difficulty, query, topic]);

  return (
    <Shell>
      <h1 className="text-3xl font-bold">Instructor review</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
        Review the complete question bank, including structures, accepted answers and explanations.
        Protect this route with Cloudflare Access before sharing the student-facing activity.
      </p>

      <section className="mt-8 rounded-2xl border border-primary/30 bg-primary/5 p-6">
        <h2 className="text-lg font-semibold">Question bank review</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Showing {reviewedMolecules.length} of {MOLECULES.length} questions. Search by name or
          SMILES, then filter by topic or difficulty.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-medium">
            Search
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="e.g. aldehyde or CC=O"
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal"
            />
          </label>
          <label className="text-sm font-medium">
            Topic
            <select
              value={topic}
              onChange={(event) => setTopic(event.target.value)}
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal"
            >
              <option value="all">All topics</option>
              {byTopic.map((item) => (
                <option key={item.topic} value={item.topic}>
                  {item.topic}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium">
            Difficulty
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as "all" | Difficulty)}
              className="mt-1.5 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal"
            >
              <option value="all">All difficulty levels</option>
              {(["intro", "intermediate", "challenge", "advanced", "expert"] as Difficulty[]).map(
                (level) => (
                  <option key={level} value={level}>
                    {level[0]!.toUpperCase() + level.slice(1)}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {reviewedMolecules.map((molecule) => (
            <article key={molecule.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold">{molecule.displayName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {molecule.topic} · {molecule.difficulty}
                  </p>
                </div>
                <code className="max-w-28 break-all rounded bg-secondary px-2 py-1 text-[10px] text-muted-foreground">
                  {molecule.smiles}
                </code>
              </div>
              <StructureView
                structure={molecule.structure}
                title={molecule.displayName}
                className="my-3 max-h-32 w-full"
              />
              <p className="text-xs leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">Accepted:</span>{" "}
                {molecule.iupacNames.join("; ")}
                {molecule.commonNames.length ? `; ${molecule.commonNames.join("; ")}` : ""}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">Explanation:</span>{" "}
                {molecule.explanation}
              </p>
            </article>
          ))}
        </div>
        {!reviewedMolecules.length && (
          <p className="mt-5 rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No questions match those filters.
          </p>
        )}
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Default for common names</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Decide whether answers like <em>acetone</em> or <em>formic acid</em> count as correct, or
          whether only the systematic IUPAC name is accepted. Students can see the setting on the
          setup screen.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {[
            { v: true, label: "Accept common names" },
            { v: false, label: "Systematic names only" },
          ].map((o) => (
            <button
              key={String(o.v)}
              type="button"
              onClick={() => update({ allowCommonNames: o.v })}
              aria-pressed={settings?.allowCommonNames === o.v}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                settings?.allowCommonNames === o.v
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-secondary"
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <BookIcon className="size-5 text-accent" /> Using it in Canvas
        </h2>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
          <li>
            Add the activity URL as an external link in a module, or embed the page in a Canvas
            page.
          </li>
          <li>Tell students which mode, difficulty and length to run for the assignment.</li>
          <li>
            Ask them to export the JSON summary at the end of a set and submit it to a Canvas
            assignment set to “file upload”.
          </li>
        </ol>
        <p className="mt-3 rounded-xl bg-[var(--amber)]/20 p-3 text-sm text-[var(--amber-foreground)]">
          This standalone version is embed- and launch-ready, but it does not provide native Canvas
          grade passback or LTI support. Automatic grade sync would require a later LTI integration.
        </p>
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h2 className="flex items-center gap-2 text-lg font-semibold">
          <HexIcon className="size-5 text-accent" /> Question bank
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {MOLECULES.length} molecules, each with accepted systematic names, common names, a hint
          and a worked explanation.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {byTopic.map((t) => (
            <span
              key={t.topic}
              className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
            >
              {t.topic} · {t.count}
            </span>
          ))}
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={exportBank}
            className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Export bank as JSON
          </button>
          <label className="cursor-pointer rounded-xl border border-border px-4 py-2 text-sm font-semibold hover:bg-secondary">
            Import a JSON bank
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) importBank(f);
              }}
            />
          </label>
        </div>
        {imported && <p className="mt-3 text-sm text-muted-foreground">{imported}</p>}
      </section>

      <section className="mt-6 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-lg font-semibold">Structure input</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Drawing questions currently accept a selected structure or a typed SMILES string. The
          drawing panel is built so a full editor can be dropped in later without changing how
          answers are checked.
        </p>
      </section>
    </Shell>
  );
}
