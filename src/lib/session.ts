import { MOLECULES, type Difficulty, type Molecule, type Topic } from "./molecules";

export type Mode = "mixed" | "draw" | "name";
export type QuestionKind = "draw" | "name";

export type Settings = {
  mode: Mode;
  difficulty: Difficulty;
  count: number;
  allowCommonNames: boolean;
  showHints: boolean;
};

export const DEFAULT_SETTINGS: Settings = {
  mode: "mixed",
  difficulty: "intro",
  count: 10,
  allowCommonNames: true,
  showHints: true,
};

export type Question = {
  kind: QuestionKind;
  molecule: Molecule;
  /** Structure choices for draw questions (ids into MOLECULES). */
  choices: string[];
};

export type AttemptRecord = {
  moleculeId: string;
  kind: QuestionKind;
  attempts: number;
  correct: boolean;
  usedHint: boolean;
  answer: string;
};

export type SessionResult = {
  id: string;
  finishedAt: number;
  settings: Settings;
  records: AttemptRecord[];
  score: number;
  total: number;
};

/* ------------------------------ storage ------------------------------ */

const SETTINGS_KEY = "ons.settings.v1";
const HISTORY_KEY = "ons.history.v1";
const ACTIVE_KEY = "ons.active.v1";

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? ({ ...(fallback as object), ...JSON.parse(raw) } as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — the session still works in memory */
  }
}

export function loadSettings(): Settings {
  return read<Settings>(SETTINGS_KEY, DEFAULT_SETTINGS);
}
export function saveSettings(s: Settings) {
  write(SETTINGS_KEY, s);
}

export function loadHistory(): SessionResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as SessionResult[]) : [];
  } catch {
    return [];
  }
}
export function saveHistory(list: SessionResult[]) {
  write(HISTORY_KEY, list.slice(-50));
}
export function clearHistory() {
  if (typeof window !== "undefined") window.localStorage.removeItem(HISTORY_KEY);
}

export type ActiveSession = {
  settings: Settings;
  moleculeIds: string[];
  kinds: QuestionKind[];
  index: number;
  records: AttemptRecord[];
};

export function loadActive(): ActiveSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(ACTIVE_KEY);
    return raw ? (JSON.parse(raw) as ActiveSession) : null;
  } catch {
    return null;
  }
}
export function saveActive(s: ActiveSession) {
  write(ACTIVE_KEY, s);
}
export function clearActive() {
  if (typeof window !== "undefined") window.localStorage.removeItem(ACTIVE_KEY);
}

/* ---------------------------- generation ---------------------------- */

/** Topics intentionally hidden from practice until they are introduced in class. */
const HIDDEN_TOPICS: Topic[] = [
  "Ethers",
  "Amides",
  "Benzene derivatives",
  "Carboxylic acids",
  "Esters",
  "Phenols",
  "Amines",
];

// Aromatic atoms are lowercase in SMILES (for example, c1ccccc1).
const ACTIVE_MOLECULES = MOLECULES.filter(
  (m) => !HIDDEN_TOPICS.includes(m.topic) && !/[cn]/.test(m.smiles) && !m.iupacNames.some((name) => /^\([EZ]\)-/.test(name)),
);

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function byId(id: string): Molecule {
  return MOLECULES.find((m) => m.id === id) ?? MOLECULES[0]!;
}

export function pickMolecules(difficulty: Difficulty, count: number): Molecule[] {
  const tiers: Difficulty[] =
    difficulty === "intro"
      ? ["intro"]
      : difficulty === "intermediate"
        ? ["intro", "intermediate"]
        : difficulty === "challenge"
          ? ["intermediate", "challenge"]
          : ["challenge", "advanced"]
          : ["advanced", "expert"];
  let pool = ACTIVE_MOLECULES.filter((m) => tiers.includes(m.difficulty));
  if (pool.length < count) pool = ACTIVE_MOLECULES;
  return shuffle(pool).slice(0, Math.min(count, pool.length));
}

export function kindsFor(mode: Mode, count: number): QuestionKind[] {
  if (mode === "draw") return Array.from({ length: count }, () => "draw" as const);
  if (mode === "name") return Array.from({ length: count }, () => "name" as const);
  return shuffle(
    Array.from({ length: count }, (_, i) => (i % 2 === 0 ? "draw" : "name") as QuestionKind),
  );
}

/** Distractor structures for a "draw from a name" question. */
export function choicesFor(target: Molecule): string[] {
  const sameTopic = ACTIVE_MOLECULES.filter(
    (m) => m.id !== target.id && m.topic === target.topic,
  );
  const others = ACTIVE_MOLECULES.filter(
    (m) => m.id !== target.id && m.topic !== target.topic,
  );
  const picks = [...shuffle(sameTopic).slice(0, 3), ...shuffle(others)].slice(0, 3);
  return shuffle([target.id, ...picks.map((m) => m.id)]);
}

/* ----------------------------- grading ----------------------------- */

export function normalizeName(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/\s+/g, "")
    .replace(/[()\[\]{}]/g, "")
    .replace(/,/g, "")
    .replace(/-/g, "")
    .replace(/^n(?=[a-z])/, "n");
}

export function checkName(
  input: string,
  molecule: Molecule,
  allowCommonNames: boolean,
): { correct: boolean; viaCommonName: boolean } {
  const guess = normalizeName(input);
  if (!guess) return { correct: false, viaCommonName: false };
  const iupac = molecule.iupacNames.map(normalizeName);
  if (iupac.includes(guess)) return { correct: true, viaCommonName: false };
  const common = molecule.commonNames.map(normalizeName);
  if (common.includes(guess)) return { correct: allowCommonNames, viaCommonName: true };
  return { correct: false, viaCommonName: false };
}

export function normalizeSmiles(s: string): string {
  return s.replace(/\s+/g, "").replace(/^\[|\]$/g, "");
}

export function checkSmiles(input: string, molecule: Molecule): boolean {
  const a = normalizeSmiles(input).toUpperCase();
  const b = normalizeSmiles(molecule.smiles).toUpperCase();
  return a.length > 0 && a === b;
}

export function scoreOf(records: AttemptRecord[]): number {
  return records.filter((r) => r.correct).length;
}

export function exportSession(result: SessionResult): string {
  return JSON.stringify(
    {
      app: "Organic Nomenclature Studio",
      version: 1,
      finishedAt: new Date(result.finishedAt).toISOString(),
      settings: result.settings,
      score: result.score,
      total: result.total,
      items: result.records.map((r) => ({
        molecule: byId(r.moleculeId).displayName,
        task: r.kind === "draw" ? "Draw from a Name" : "Name from a Structure",
        attempts: r.attempts,
        usedHint: r.usedHint,
        correct: r.correct,
        response: r.answer,
      })),
    },
    null,
    2,
  );
}
