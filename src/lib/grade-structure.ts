import type { Ketcher } from "ketcher-core";

const INCHI = "chemical/x-inchi";

function trimInchi(s: string): string {
  return s.split("\n")[0]!.trim();
}

/** Convert a SMILES string to an InChI using the editor's own chemistry engine. */
async function inchiFromSmiles(ketcher: Ketcher, smiles: string): Promise<string | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = await (ketcher.indigo as any).convert(smiles, { outputFormat: INCHI });
    const out = typeof res === "string" ? res : res?.struct;
    return out ? trimInchi(String(out)) : null;
  } catch {
    return null;
  }
}
async function canonicalSmiles(ketcher: Ketcher, smiles: string): Promise<string | null> {
  try {
    const res: any = await (ketcher.indigo as any).convert(smiles, {
      outputFormat: "chemical/x-daylight-smiles",
    });
    const out = typeof res === "string" ? res : res?.struct;
    return out ? String(out).trim() : null;
  } catch {
    return null;
  }
}
export type StructureGrade =
  | { status: "empty" }
  | { status: "graded"; correct: boolean; smiles: string }
  | { status: "unavailable"; smiles: string };

/**
 * Read the drawn structure out of Ketcher and compare it with the expected
 * molecule by InChI, so drawing orientation and atom order do not matter.
 */
export async function gradeDrawing(
  ketcher: Ketcher,
  targetSmiles: string,
): Promise<StructureGrade> {
  let drawnSmiles = "";
  try {
    drawnSmiles = (await ketcher.getSmiles()).trim();
  } catch {
    return { status: "unavailable", smiles: "" };
  }
  if (!drawnSmiles) return { status: "empty" };

  try {
    const drawnInchi = trimInchi(await ketcher.getInchi());
    const targetInchi = await inchiFromSmiles(ketcher, targetSmiles);
    if (drawnInchi && targetInchi) {
      return { status: "graded", correct: drawnInchi === targetInchi, smiles: drawnSmiles };
    }
  } catch {
    /* fall through to SMILES comparison */
  }

// Fallback: canonicalize both structures before comparing them.
const [drawnCanonical, targetCanonical] = await Promise.all([
  canonicalSmiles(ketcher, drawnSmiles),
  canonicalSmiles(ketcher, targetSmiles),
]);

if (drawnCanonical && targetCanonical) {
  return {
    status: "graded",
    correct: drawnCanonical.toUpperCase() === targetCanonical.toUpperCase(),
    smiles: drawnSmiles,
  };
}
return { status: "unavailable", smiles: drawnSmiles };
