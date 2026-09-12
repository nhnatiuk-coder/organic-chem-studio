// Lightweight 2D structure model + geometry helpers.
// Molecules are authored as atom coordinates (unit bond length ~0.87) and bonds.
// A local React renderer (see components/StructureView.tsx) turns these into crisp SVG.

export type Atom = { el: string; x: number; y: number };
export type Bond = { a: number; b: number; order: 1 | 2 | 3 };
export type Structure = { atoms: Atom[]; bonds: Bond[] };

const BOND = 1;

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
  let ux = 0;
  let uy = dir;

  const neighbors = () =>
    b.bonds
      .filter((bond) => bond.a === prev || bond.b === prev)
      .map((bond) => b.atoms[bond.a === prev ? bond.b : bond.a]!)
      .map((atom) => {
        const dx = atom.x - b.atoms[prev]!.x;
        const dy = atom.y - b.atoms[prev]!.y;
        const length = Math.hypot(dx, dy) || 1;
        return { x: dx / length, y: dy / length };
      });

  sub.els.forEach((el, i) => {
    if (i === 0) {
      const connected = neighbors();
      if (connected.length >= 2) {
        // The third direction in a trigonal-planar drawing is opposite the
        // bisector of the first two. This gives 120° at C=C and C=O centers.
        const sx = connected.reduce((sum, vector) => sum + vector.x, 0);
        const sy = connected.reduce((sum, vector) => sum + vector.y, 0);
        const length = Math.hypot(sx, sy);
        if (length > 0.001) {
          ux = -sx / length;
          uy = -sy / length;
        }
      } else if (connected.length === 1) {
        // A terminal carbonyl has one visible neighbour and one implicit H.
        // Rotate its O direction by 120°, choosing the requested side.
        const angle = (-dir * 2 * Math.PI) / 3;
        const vector = connected[0]!;
        ux = vector.x * Math.cos(angle) - vector.y * Math.sin(angle);
        uy = vector.x * Math.sin(angle) + vector.y * Math.cos(angle);
      }
    } else {
      // Continue a substituent as a conventional zigzag chain.
      const angle = (dir * Math.PI) / 3;
      const nextX = ux * Math.cos(angle) - uy * Math.sin(angle);
      const nextY = ux * Math.sin(angle) + uy * Math.cos(angle);
      ux = nextX;
      uy = nextY;
    }

    const start = b.atoms[prev]!;
    const idx = b.add(el, start.x + ux * BOND, start.y + uy * BOND);
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
  if (!els.length) return b.done();

  // Each bond has a direction. At a C#C carbon the incoming and outgoing
  // bonds are collinear (180°); everywhere else the backbone turns by 60°,
  // producing the conventional 120° planar projection.
  const directions: number[] = [0];
  let turn = -1;
  for (let atom = 1; atom < els.length - 1; atom++) {
    const isSp = opts.orders?.[atom - 1] === 3 || opts.orders?.[atom] === 3;
    if (isSp) {
      directions[atom] = directions[atom - 1]!;
    } else {
      directions[atom] = directions[atom - 1]! + turn * (Math.PI / 3);
      turn *= -1;
    }
  }

  b.add(els[0]!, 0, 0);
  for (let i = 1; i < els.length; i++) {
    const prior = b.atoms[i - 1]!;
    const angle = directions[i - 1] ?? 0;
    b.add(els[i]!, prior.x + BOND * Math.cos(angle), prior.y + BOND * Math.sin(angle));
  }
  for (let i = 0; i < els.length - 1; i++) b.bond(i, i + 1, opts.orders?.[i] ?? 1);
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
  const r = BOND / (2 * Math.sin(Math.PI / n));
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < n; i++) {
    const ang = -Math.PI / 2 + (2 * Math.PI * i) / n;
    const x = r * Math.cos(ang);
    const y = r * Math.sin(ang);
    pts.push({ x, y });
    b.add(opts.els?.[i] ?? "C", x, y);
  }
  for (let i = 0; i < n; i++) {
    const order = opts.aromatic ? ((i % 2 === 0 ? 2 : 1) as 1 | 2) : (opts.orders?.[i] ?? 1);
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
      px += ux * 0.87;
      py += uy * 0.87;
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

/** Hang one extra atom off an existing atom (used for branched substituents). */
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
