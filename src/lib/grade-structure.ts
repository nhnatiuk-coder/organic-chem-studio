import type { Ketcher } from "ketcher-core";

type Graph = { atoms: string[]; bonds: Array<Map<number, number>> };

export type StructureGrade =
  | { status: "empty" }
  | { status: "graded"; correct: boolean; smiles: string }
  | { status: "unavailable"; smiles: string };

/** Read a V2000 molfile but intentionally ignore atom coordinates. */
function graphFromMolfile(molfile: string): Graph | null {
  const lines = molfile.replace(/\r/g, "").split("\n");
  const countLine = lines.findIndex((line) => /V2000/.test(line));
  if (countLine < 0) return null;

  const atomCount = Number.parseInt(lines[countLine]!.slice(0, 3).trim(), 10);
  const bondCount = Number.parseInt(lines[countLine]!.slice(3, 6).trim(), 10);
  if (!Number.isFinite(atomCount) || !Number.isFinite(bondCount) || atomCount < 1) return null;

  const atoms: string[] = [];
  const bonds = Array.from({ length: atomCount }, () => new Map<number, number>());

  for (let i = 0; i < atomCount; i++) {
    const line = lines[countLine + 1 + i];
    if (!line) return null;
    const atom = line.slice(31, 34).trim();
    if (!atom) return null;
    atoms.push(atom);
  }

  for (let i = 0; i < bondCount; i++) {
    const line = lines[countLine + 1 + atomCount + i];
    if (!line) return null;
    const a = Number.parseInt(line.slice(0, 3).trim(), 10) - 1;
    const b = Number.parseInt(line.slice(3, 6).trim(), 10) - 1;
    const order = Number.parseInt(line.slice(6, 9).trim(), 10);
    if (!Number.isFinite(a) || !Number.isFinite(b) || !Number.isFinite(order) || !atoms[a] || !atoms[b]) return null;
    bonds[a]!.set(b, order);
    bonds[b]!.set(a, order);
  }

  return { atoms, bonds };
}

/**
 * Ketcher's native KET export is produced directly from the drawing canvas.
 * Unlike SMILES and Molfile export, it does not require the Indigo conversion
 * worker to be available, so it is a reliable final fallback in the browser.
 */
function graphFromKet(ket: string): Graph | null {
  try {
    const document = JSON.parse(ket) as {
      root?: { nodes?: Array<{ $ref?: string }> };
      [key: string]: unknown;
    };
    const ref = document.root?.nodes?.find((node) => node.$ref?.startsWith("mol"))?.$ref;
    const molecule = ref ? (document[ref] as { atoms?: Array<{ label?: string }>; bonds?: Array<{ atoms?: [number, number]; type?: unknown }> } | undefined) : undefined;
    if (!molecule?.atoms?.length) return null;

    const atoms = molecule.atoms.map((atom) => atom.label?.trim() || "*");
    const bonds = Array.from({ length: atoms.length }, () => new Map<number, number>());
    const orderOf = (type: unknown) => {
      if (type === 2 || type === "double") return 2;
      if (type === 3 || type === "triple") return 3;
      if (type === 4 || type === "aromatic") return 4;
      return 1;
    };

    for (const bond of molecule.bonds ?? []) {
      const [a, b] = bond.atoms ?? [];
      if (!Number.isInteger(a) || !Number.isInteger(b) || !atoms[a] || !atoms[b]) return null;
      const order = orderOf(bond.type);
      bonds[a]!.set(b, order);
      bonds[b]!.set(a, order);
    }
    return { atoms, bonds };
  } catch {
    return null;
  }
}

/** Read the live canvas model without asking Ketcher to export a file. */
function graphFromEditor(ketcher: Ketcher): Graph | null {
  try {
    const struct = ketcher.editor.struct();
    const entries = [...struct.atoms.entries()];
    if (!entries.length) return null;

    const indexOf = new Map(entries.map(([id], index) => [id, index]));
    const atoms = entries.map(([, atom]) => atom.label || "*");
    const bonds = Array.from({ length: atoms.length }, () => new Map<number, number>());

    for (const bond of struct.bonds.values()) {
      const begin = indexOf.get(bond.begin);
      const end = indexOf.get(bond.end);
      if (begin === undefined || end === undefined) return null;
      bonds[begin]!.set(end, bond.type);
      bonds[end]!.set(begin, bond.type);
    }
    return { atoms, bonds };
  } catch {
    return null;
  }
}

function atomSignature(graph: Graph, index: number): string {
  const neighbors = [...graph.bonds[index]!.entries()]
    .map(([neighbor, order]) => `${order}:${graph.atoms[neighbor]}`)
    .sort()
    .join(",");
  return `${graph.atoms[index]}|${neighbors}`;
}

function isTree(graph: Graph): boolean {
  const edgeCount = graph.bonds.reduce((sum, neighbors) => sum + neighbors.size, 0) / 2;
  return edgeCount === graph.atoms.length - 1;
}

function treeCenters(graph: Graph): number[] {
  const degree = graph.bonds.map((neighbors) => neighbors.size);
  let leaves = degree
    .map((value, index) => ({ value, index }))
    .filter(({ value }) => value <= 1)
    .map(({ index }) => index);
  let remaining = graph.atoms.length;

  while (remaining > 2) {
    remaining -= leaves.length;
    const next: number[] = [];
    for (const leaf of leaves) {
      for (const neighbor of graph.bonds[leaf]!.keys()) {
        degree[neighbor]! -= 1;
        if (degree[neighbor] === 1) next.push(neighbor);
      }
    }
    leaves = next;
  }
  return leaves;
}

function rootedTreeCode(graph: Graph, node: number, parent: number | null): string {
  const children = [...graph.bonds[node]!.entries()]
    .filter(([neighbor]) => neighbor !== parent)
    .map(([neighbor, bond]) => `${bond}:${rootedTreeCode(graph, neighbor, node)}`)
    .sort()
    .join(",");
  return `${graph.atoms[node]}(${children})`;
}

function treeCode(graph: Graph): string {
  const centers = treeCenters(graph);
  if (centers.length === 1) return rootedTreeCode(graph, centers[0]!, null);

  const [left, right] = centers;
  const bond = graph.bonds[left!]!.get(right!)!;
  const a = rootedTreeCode(graph, left!, right!);
  const b = rootedTreeCode(graph, right!, left!);
  return a < b ? `${a}=${bond}=${b}` : `${b}=${bond}=${a}`;
}

/** Compare molecular connectivity while ignoring page orientation and coordinates. */
function sameMolecule(a: Graph, b: Graph): boolean {
  if (a.atoms.length !== b.atoms.length) return false;

  const aSignatures = a.atoms.map((_, index) => atomSignature(a, index)).sort();
  const bSignatures = b.atoms.map((_, index) => atomSignature(b, index)).sort();
  if (aSignatures.join("|") !== bSignatures.join("|")) return false;

  // Expert prompts are acyclic. This is exact and avoids factorial matching
  // of the several equivalent carbon atoms in highly branched structures.
  if (isTree(a) && isTree(b)) return treeCode(a) === treeCode(b);

  const candidates = a.atoms.map((atom, aIndex) =>
    b.atoms
      .map((other, bIndex) => ({ other, bIndex }))
      .filter(({ other, bIndex }) => other === atom && atomSignature(a, aIndex) === atomSignature(b, bIndex))
      .map(({ bIndex }) => bIndex),
  );
  const order = candidates
    .map((choices, aIndex) => ({ aIndex, choices }))
    .sort((left, right) => left.choices.length - right.choices.length);
  const assigned = new Map<number, number>();
  const used = new Set<number>();

  let checks = 0;
  const search = (step: number): boolean => {
    if (++checks > 20_000) return false;
    if (step === order.length) return true;
    const { aIndex, choices } = order[step]!;

    for (const bIndex of choices) {
      if (used.has(bIndex)) continue;
      let compatible = true;
      for (const [aNeighbor, aBond] of a.bonds[aIndex]!) {
        const bNeighbor = assigned.get(aNeighbor);
        if (bNeighbor !== undefined && b.bonds[bIndex]!.get(bNeighbor) !== aBond) {
          compatible = false;
          break;
        }
      }
      if (!compatible) continue;
      assigned.set(aIndex, bIndex);
      used.add(bIndex);
      if (search(step + 1)) return true;
      assigned.delete(aIndex);
      used.delete(bIndex);
    }
    return false;
  };

  return search(0);
}

/**
 * Parse the small-molecule SMILES used by this activity into a heavy-atom
 * graph. This avoids asking Ketcher's worker to convert the answer-bank
 * SMILES during grading, which can hang in a deployed browser.
 */
function graphFromSmiles(smiles: string): Graph | null {
  const atoms: string[] = [];
  const bonds: Array<Map<number, number>> = [];
  const branches: number[] = [];
  const rings = new Map<string, { atom: number; order: number }>();
  let current: number | null = null;
  let pendingBond = 1;

  const addAtom = (atom: string) => {
    const index = atoms.length;
    atoms.push(atom);
    bonds.push(new Map<number, number>());
    if (current !== null) {
      bonds[current]!.set(index, pendingBond);
      bonds[index]!.set(current, pendingBond);
    }
    current = index;
    pendingBond = 1;
  };

  for (let i = 0; i < smiles.length; i++) {
    const ch = smiles[i]!;
    if (ch === "(") {
      if (current === null) return null;
      branches.push(current);
    } else if (ch === ")") {
      const parent = branches.pop();
      if (parent === undefined) return null;
      current = parent;
    } else if (ch === "=") {
      pendingBond = 2;
    } else if (ch === "#") {
      pendingBond = 3;
    } else if (ch === "-" || ch === "/" || ch === "\\") {
      pendingBond = 1;
    } else if (ch === ".") {
      current = null;
      pendingBond = 1;
    } else if (/\d/.test(ch)) {
      if (current === null) return null;
      const open = rings.get(ch);
      if (open) {
        const order = pendingBond === 1 ? open.order : pendingBond;
        bonds[current]!.set(open.atom, order);
        bonds[open.atom]!.set(current, order);
        rings.delete(ch);
      } else {
        rings.set(ch, { atom: current, order: pendingBond });
      }
      pendingBond = 1;
    } else if (ch === "[") {
      const close = smiles.indexOf("]", i + 1);
      if (close < 0) return null;
      const inside = smiles.slice(i + 1, close);
      const atom = inside.match(/^([A-Z][a-z]?|[cnops])/i)?.[1];
      if (!atom) return null;
      addAtom(atom);
      i = close;
    } else if (/[A-Z]/.test(ch)) {
      const next = smiles[i + 1];
      const atom = next && /[a-z]/.test(next) ? ch + next : ch;
      addAtom(atom);
      if (atom.length === 2) i += 1;
    } else if (/[cnops]/.test(ch)) {
      addAtom(ch.toUpperCase());
    } else if (ch === "@" || ch === "+" || ch === "%") {
      // Stereochemical and charge annotations do not alter heavy-atom
      // connectivity. E/Z questions are currently excluded from the bank.
    } else {
      return null;
    }
  }

  return atoms.length > 0 && branches.length === 0 && rings.size === 0 ? { atoms, bonds } : null;
}

export async function gradeDrawing(ketcher: Ketcher, targetSmiles: string): Promise<StructureGrade> {
  // This is the dependable path: it reads the structure the student drew
  // directly from Ketcher's canvas and does not require its export worker.
  const drawnGraph = graphFromEditor(ketcher);
  if (!drawnGraph) return { status: "empty" };

  const targetGraph = graphFromSmiles(targetSmiles);
  if (drawnGraph && targetGraph) {
    return { status: "graded", correct: sameMolecule(drawnGraph, targetGraph), smiles: "" };
  }
  return { status: "unavailable", smiles: "" };
}
