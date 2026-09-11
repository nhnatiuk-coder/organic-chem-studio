import type { Ketcher } from "ketcher-core";

const MOLFILE = "chemical/x-mdl-molfile";

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

async function targetMolfile(ketcher: Ketcher, smiles: string): Promise<string | null> {
  try {
    const result = await ketcher.indigo.convert(smiles, { outputFormat: MOLFILE });
    return result?.struct?.trim() || null;
  } catch {
    return null;
  }
}

function within<T>(promise: Promise<T>, milliseconds: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => resolve(null), milliseconds);
    promise.then(
      (value) => {
        window.clearTimeout(timer);
        resolve(value);
      },
      () => {
        window.clearTimeout(timer);
        resolve(null);
      },
    );
  });
}

export async function gradeDrawing(ketcher: Ketcher, targetSmiles: string): Promise<StructureGrade> {
  let drawnSmiles = "";
  let drawnMolfile = "";

  try {
    [drawnSmiles, drawnMolfile] = await Promise.all([ketcher.getSmiles(), ketcher.getMolfile()]);
    drawnSmiles = drawnSmiles.trim();
  } catch {
    return { status: "unavailable", smiles: "" };
  }
  if (!drawnSmiles) return { status: "empty" };

  const target = await within(targetMolfile(ketcher, targetSmiles), 3_000);
  const drawnGraph = graphFromMolfile(drawnMolfile);
  const targetGraph = target ? graphFromMolfile(target) : null;

  if (drawnGraph && targetGraph) {
    return { status: "graded", correct: sameMolecule(drawnGraph, targetGraph), smiles: drawnSmiles };
  }
  return { status: "unavailable", smiles: drawnSmiles };
}
