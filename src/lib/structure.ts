// Lightweight 2D structure model + geometry helpers.
// Molecules are authored as atom coordinates (unit bond length ~0.87) and bonds.
// A local React renderer (see components/StructureView.tsx) turns these into crisp SVG.

export type Atom = { el: string; x: number; y: number };
export type Bond = { a: number; b: number; order: 1 | 2 | 3 };
export type Structure = { atoms: Atom[]; bonds: Bond[] };

const DX = 0.87;
const DY = 0.5;

class Builder {
  atoms: Atom[] = [];
  bonds: Bond[] = [];
  add(el: string, x: number, y: number) {
    this.atoms.push({ el, x, y });
    return this.atoms.length - 1;
  }
  bond(a: number, b: number, order: 1 | 2 | 3 = 1) {
    this.bonds.push({ a, b, order });
    return this;
  }
  done(): Structure {
    return { atoms: this.atoms, bonds: this.bonds };
  }
}

export type Sub = {
  at: number; // index of the backbone atom the group hangs from
  els: string[]; // atoms of the group, outward from the backbone
  dir?: 1 | -1; // 1 = below, -1 = above (chains only)
  order?: 1 | 2 | 3; // order of the first bond
  orders?: (1 | 2 | 3)[]; // orders inside the group
};

function attachChainSub(b: Builder, sub: Sub) {
  const base = b.atoms[sub.at]!;
  const dir = sub.dir ?? -1;
  let prev = sub.at;

  sub.els.forEach((el, i) => {
    let x = base.x + i * DX;
    let y = base.y + dir * (0.87 + (i % 2 === 0 ? 0 : -DY) + (i > 0 ? DY : 0));

    // Carbonyl carbons are trigonal planar. Place the first double-bonded
    // atom so the visible bonds meet at approximately 120 degrees.
    if (i === 0 && (sub.order ?? 1) === 2 && base.el === "C") {
      const neighbors = b.bonds
        .filter((bond) => bond.a === sub.at || bond.b === sub.at)
        .map((bond) => b.atoms[bond.a === sub.at ? bond.b : bond.a]!)
        .map((atom) => {
          const dx = atom.x - base.x;
          const dy = atom.y - base.y;
          const length = Math.hypot(dx, dy) || 1;
          return { x: dx / length, y: dy / length };
        });

      let ux: number;
      let uy: number;

      if (neighbors.length >= 2) {
        const sx = neighbors.reduce((sum, vector) => sum + vector.x, 0);
        const sy = neighbors.reduce((sum, vector) => sum + vector.y, 0);
        const length = Math.hypot(sx, sy) || 1;
        ux = -sx / length;
        uy = -sy / length;
      } else if (neighbors.length === 1) {
        const angle = (-dir * 2 * Math.PI) / 3;
        const vector = neighbors[0]!;
        ux = vector.x * Math.cos(angle) - vector.y * Math.sin(angle);
        uy = vector.x * Math.sin(angle) + vector.y * Math.cos(angle);
      } else {
        ux = 0;
        uy = dir;
      }

      x = base.x + ux * DX;
      y = base.y + uy * DX;
    }

    const idx = b.add(el, x, y);
    b.bond(prev, idx, i === 0 ? (sub.order ?? 1) : (sub.orders?.[i - 1] ?? 1));
    prev = idx;
  });
}
/** Zigzag straight chain. `orders` maps chain-bond index (i between atom i and i+1) to order. */
export function chain(
  els: string[],
  opts: { orders?: Partial<Record<number, 1 | 2 | 3>>; subs?: Sub[] } = {},
): Structure {
  const b = new Builder();

  // An sp carbon must be linear with the atoms on either side of its triple bond.
  // Keep the triple bond and its adjacent backbone bonds collinear at 180°.
  const isAdjacentToTripleBond = (atomIndex: number) =>
    [atomIndex - 2, atomIndex - 1, atomIndex, atomIndex + 1].some(
      (bondIndex) => opts.orders?.[bondIndex] === 3,
    );

  els.forEach((el, i) =>
    b.add(el, i * DX, isAdjacentToTripleBond(i) ? 0 : i % 2 === 0 ? 0 : -DY),
  );

  for (let i = 0; i < els.length - 1; i++) {
    b.bond(i, i + 1, opts.orders?.[i] ?? 1);
  }

  (opts.subs ?? []).forEach((s) => attachChainSub(b, s));
  return b.done();
}

/** Regular ring of n atoms, optional substituent groups placed radially outward. */
export function ring(
  n: number,
  opts: {
    els?: string[];
    orders?: Partial<Record<number, 1 | 2 | 3>>;
    subs?: Sub[];
    aromatic?: boolean;
  } = {},
): Structure {
  const b = new Builder();
  const r = DX / (2 * Math.sin(Math.PI / n));
  const pts: { x: number; y: number }[] = [];

  for (let i = 0; i < n; i++) {
    const ang = -Math.PI / 2 + (2 * Math.PI * i) / n;
    const x = r * Math.cos(ang);
    const y = r * Math.sin(ang);
    pts.push({ x, y });
    b.add(opts.els?.[i] ?? "C", x, y);
  }

  for (let i = 0; i < n; i++) {
    const order = opts.aromatic
      ? ((i % 2 === 0 ? 2 : 1) as 1 | 2)
      : (opts.orders?.[i] ?? 1);
    b.bond(i, (i + 1) % n, order);
  }

  (opts.subs ?? []).forEach((s) => {
    const base = pts[s.at]!;
    const len = Math.hypot(base.x, base.y) || 1;
    let ux = base.x / len;
    let uy = base.y / len;
    let px = base.x;
    let py = base.y;
    let prev = s.at;

    s.els.forEach((el, i) => {
      if (i > 0) {
        const rot = (i % 2 === 0 ? -1 : 1) * (Math.PI / 6);
        const nx = ux * Math.cos(rot) - uy * Math.sin(rot);
        const ny = ux * Math.sin(rot) + uy * Math.cos(rot);
        ux = nx;
        uy = ny;
      }

      px += ux * DX;
      py += uy * DX;
      const idx = b.add(el, px, py);
      b.bond(prev, idx, i === 0 ? (s.order ?? 1) : (s.orders?.[i - 1] ?? 1));
      prev = idx;
    });
  });

  return b.done();
}

export function benzene(subs: Sub[] = []): Structure {
  return ring(6, { aromatic: true, subs });
}

/** cis/trans layout: explicit coordinates for E/Z alkenes. */
export function custom(
  atoms: [string, number, number][],
  bonds: [number, number, (1 | 2 | 3)?][],
): Structure {
  const b = new Builder();
  atoms.forEach(([el, x, y]) => b.add(el, x, y));
  bonds.forEach(([a, c, o]) => b.bond(a, c, o ?? 1));
  return b.done();
}

/** Hang one extra atom off an existing atom. */
export function attach(
  s: Structure,
  from: number,
  el: string,
  dx: number,
  dy: number,
  order: 1 | 2 | 3 = 1,
): Structure {
  const base = s.atoms[from]!;
  s.atoms.push({ el, x: base.x + dx, y: base.y + dy });
  s.bonds.push({ a: from, b: s.atoms.length - 1, order });
  return s;
}
