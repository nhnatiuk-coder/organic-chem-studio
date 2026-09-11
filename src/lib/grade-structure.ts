import type { Ketcher } from "ketcher-core";

const MOLFILE = "chemical/x-mdl-molfile";

type Graph = {
  atoms: string[];
  bonds: Array<Map<number, number>>;
};

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

  if (
    !Number.isFinite(atomCount) ||
    !Number.isFinite(bondCount) ||
    atomCount < 1
  ) {
    return null;
  }

  const atoms: string[] = [];
  const bonds = Array.from(
    { length: atomCount },
    () => new Map<number, number>(),
  );

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

    if (
      !Number.isFinite(a) ||
      !Number.isFinite(b) ||
      !Number.isFinite(order) ||
      !atoms[a] ||
      !atoms[b]
    ) {
      return null;
    }

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

/** Compare molecular connectivity while ignoring page orientation and coordinates. */
function sameMolecule(a: Graph, b: Graph): boolean {
  if (a.atoms.length !== b.atoms.length) return false;

  const aSignatures = a.atoms
    .map((_, index) => atomSignature(a, index))
    .sort();

  const bSignatures = b.atoms
    .map((_, index) => atomSignature(b, index))
    .sort();

  if (aSignatures.join("|") !== bSignatures.join("|")) return false;

  const candidates = a.atoms.map((atom, aIndex) =>
    b.atoms
      .map((other, bIndex) => ({ other, bIndex }))
      .filter(
        ({ other, bIndex }) =>
          other === atom &&
          atomSignature(a, aIndex) === atomSignature(b, bIndex),
      )
      .map(({ bIndex }) => bIndex),
  );

  const order = candidates
    .map((choices, aIndex) => ({ aIndex, choices }))
    .sort((left, right) => left.choices.length - right.choices.length);

  const assigned = new Map<number, number>();
  const used = new Set<number>();

  const search = (step: number): boolean => {
    if (step === order.length) return true;

    const { aIndex, choices } = order[step]!;

    for (const bIndex of choices) {
      if (used.has(bIndex)) continue;

      let compatible = true;

      for (const [aNeighbor, aBond] of a.bonds[aIndex]!) {
        const bNeighbor = assigned.get(aNeighbor);

        if (
          bNeighbor !== undefined &&
          b.bonds[bIndex]!.get(bNeighbor) !== aBond
        ) {
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

async function targetMolfile(
  ketcher: Ketcher,
  smiles: string,
): Promise<string | null> {
  try {
    const result = await ketcher.indigo.convert(smiles, {
      outputFormat: MOLFILE,
    });

    return result?.struct?.trim() || null;
  } catch {
    return null;
  }
}

export async function gradeDrawing(
  ketcher: Ketcher,
  targetSmiles: string,
): Promise<StructureGrade> {
  let drawnSmiles = "";
  let drawnMolfile = "";

  try {
    [drawnSmiles, drawnMolfile] = await Promise.all([
      ketcher.getSmiles(),
      ketcher.getMolfile(),
    ]);

    drawnSmiles = drawnSmiles.trim();
  } catch {
    return { status: "unavailable", smiles: "" };
  }

  if (!drawnSmiles) {
    return { status: "empty" };
  }

  const target = await targetMolfile(ketcher, targetSmiles);
  const drawnGraph = graphFromMolfile(drawnMolfile);
  const targetGraph = target ? graphFromMolfile(target) : null;

  if (drawnGraph && targetGraph) {
    return {
      status: "graded",
      correct: sameMolecule(drawnGraph, targetGraph),
      smiles: drawnSmiles,
    };
  }

  return { status: "unavailable", smiles: drawnSmiles };
}
