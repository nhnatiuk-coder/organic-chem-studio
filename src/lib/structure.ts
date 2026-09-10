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
