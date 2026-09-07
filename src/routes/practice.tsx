import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import type { Difficulty } from "@/lib/molecules";
import {
  DEFAULT_SETTINGS,
  kindsFor,
  loadSettings,
  pickMolecules,
  saveActive,
  saveSettings,
  type Mode,
  type Settings,
} from "@/lib/session";

export const Route = createFileRoute("/practice")({
  head: () => ({
    meta: [
      { title: "Set up your practice set — Organic Nomenclature Studio" },
      {
        name: "description",
        content:
          "Choose a practice mode, difficulty tier and set length before starting your organic nomenclature questions.",
      },
      { property: "og:title", content: "Set up your practice set" },
      {
        property: "og:description",
        content: "Pick mode, difficulty and number of questions, then start practising.",
      },
    ],
  }),
  component: Setup,
});

const MODES: { value: Mode; label: string; hint: string }[] = [
  { value: "mixed", label: "Mixed", hint: "Alternates both task types" },
  { value: "draw", label: "Draw from a Name", hint: "Name given, build the structure" },
  { value: "name", label: "Name from a Structure", hint: "Structure given, type the name" },
];

const TIERS: { value: Difficulty; label: string; hint: string }[] = [
  { value: "intro", label: "Intro", hint: "Straight chains, simple groups" },
  { value: "intermediate", label: "Intermediate", hint: "Branching, isomers, more groups" },
  { value: "challenge", label: "Challenge", hint: "Multiple substituents, E/Z, esters" },
];

function Setup() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const start = () => {
    saveSettings(settings);
    const molecules = pickMolecules(settings.difficulty, settings.count);
    saveActive({
      settings,
      moleculeIds: molecules.map((m) => m.id),
      kinds: kindsFor(settings.mode, molecules.length),
      index: 0,
      records: [],
    });
    navigate({ to: "/practice/run" });
  };

  return (
    <Shell>
      <h1 className="text-3xl font-bold">Set up your practice</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Nothing is locked in — you can restart with different settings any time.
      </p>

      <Group label="Mode">
        <div className="grid gap-3 sm:grid-cols-3">
          {MODES.map((m) => (
            <Choice
              key={m.value}
              selected={settings.mode === m.value}
              onSelect={() => setSettings({ ...settings, mode: m.value })}
              label={m.label}
              hint={m.hint}
            />
          ))}
        </div>
      </Group>

      <Group label="Difficulty">
        <div className="grid gap-3 sm:grid-cols-3">
          {TIERS.map((t) => (
            <Choice
              key={t.value}
              selected={settings.difficulty === t.value}
              onSelect={() => setSettings({ ...settings, difficulty: t.value })}
              label={t.label}
              hint={t.hint}
            />
          ))}
        </div>
      </Group>

      <Group label="Number of questions">
        <div className="flex flex-wrap gap-3">
          {[5, 10, 15, 20].map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setSettings({ ...settings, count: n })}
              aria-pressed={settings.count === n}
              className={`w-16 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors ${
                settings.count === n
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card hover:bg-secondary"
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </Group>

      <Group label="Options">
        <div className="space-y-3">
          <Toggle
            checked={settings.showHints}
            onChange={(v) => setSettings({ ...settings, showHints: v })}
            label="Offer a hint on each question"
          />
          <Toggle
            checked={settings.allowCommonNames}
            onChange={(v) => setSettings({ ...settings, allowCommonNames: v })}
            label="Accept common names (acetone, toluene, formic acid…)"
          />
        </div>
      </Group>

      <button
        type="button"
        onClick={start}
        className="mt-10 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
      >
        Start {settings.count} questions
      </button>
    </Shell>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <section className="mt-9">
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </h2>
      {children}
    </section>
  );
}

function Choice({
  selected,
  onSelect,
  label,
  hint,
}: {
  selected: boolean;
  onSelect: () => void;
  label: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={`rounded-xl border p-4 text-left transition-colors ${
        selected ? "border-primary bg-secondary" : "border-border bg-card hover:bg-secondary/60"
      }`}
    >
      <span className="block text-sm font-semibold">{label}</span>
      <span className="mt-1 block text-xs text-muted-foreground">{hint}</span>
    </button>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm">
      <span
        role="checkbox"
        aria-checked={checked}
        tabIndex={0}
        onClick={() => onChange(!checked)}
        onKeyDown={(e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            onChange(!checked);
          }
        }}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? "bg-accent" : "bg-muted"
        }`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-card shadow transition-all ${
            checked ? "left-[1.375rem]" : "left-0.5"
          }`}
        />
      </span>
      <span>{label}</span>
    </label>
  );
}
