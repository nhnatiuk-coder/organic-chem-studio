import type { Structure } from "@/lib/structure";

function label(s: Structure, i: number): string | null {
  const a = s.atoms[i]!;
  if (a.el === "C") return null;
  const bonds = s.bonds.filter((b) => b.a === i || b.b === i);
  const used = bonds.reduce((n, b) => n + b.order, 0);
  const valence: Record<string, number> = { O: 2, N: 3, S: 2, Cl: 1, Br: 1, F: 1, I: 1 };
  const h = Math.max(0, (valence[a.el] ?? 0) - used);
  return h === 0 ? a.el : h === 1 ? `${a.el}H` : `${a.el}H${h}`;
}

export function StructureView({
  structure,
  className,
  title,
}: {
  structure: Structure;
  className?: string;
  title: string;
}) {
  const S = 46; // px per unit
  const xs = structure.atoms.map((a) => a.x);
  const ys = structure.atoms.map((a) => a.y);
  const pad = 1.1;
  const minX = Math.min(...xs) - pad;
  const maxX = Math.max(...xs) + pad;
  const minY = Math.min(...ys) - pad;
  const maxY = Math.max(...ys) + pad;
  const w = (maxX - minX) * S;
  const h = (maxY - minY) * S;
  const px = (v: number) => (v - minX) * S;
  const py = (v: number) => (v - minY) * S;
  const labels = structure.atoms.map((_, i) => label(structure, i));

  return (
    <svg
      role="img"
      aria-label={`Skeletal structure: ${title}`}
      viewBox={`0 0 ${w} ${h}`}
      className={className}
      style={{ maxWidth: "100%", height: "auto" }}
    >
      <title>{`Skeletal structure: ${title}`}</title>
      {structure.bonds.map((b, k) => {
        const A = structure.atoms[b.a]!;
        const B = structure.atoms[b.b]!;
        let x1 = px(A.x);
        let y1 = py(A.y);
        let x2 = px(B.x);
        let y2 = py(B.y);
        const dx = x2 - x1;
        const dy = y2 - y1;
        const len = Math.hypot(dx, dy) || 1;
        const ux = dx / len;
        const uy = dy / len;
        const trimA = labels[b.a] ? 14 : 0;
        const trimB = labels[b.b] ? 14 : 0;
        x1 += ux * trimA;
        y1 += uy * trimA;
        x2 -= ux * trimB;
        y2 -= uy * trimB;
        const ox = -uy * 4.2;
        const oy = ux * 4.2;
        const offs = b.order === 1 ? [0] : b.order === 2 ? [-1, 1] : [-1.6, 0, 1.6];
        return (
          <g key={k} stroke="var(--structure-ink)" strokeWidth={2.1} strokeLinecap="round">
            {offs.map((o, j) => (
              <line key={j} x1={x1 + ox * o} y1={y1 + oy * o} x2={x2 + ox * o} y2={y2 + oy * o} />
            ))}
          </g>
        );
      })}
      {structure.atoms.map((a, i) =>
        labels[i] ? (
          <g key={i}>
            <circle cx={px(a.x)} cy={py(a.y)} r={13} fill="var(--structure-bg)" />
            <text
              x={px(a.x)}
              y={py(a.y)}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={17}
              fontWeight={600}
              fill="var(--structure-ink)"
              fontFamily="ui-sans-serif, system-ui, sans-serif"
            >
              {labels[i]}
            </text>
          </g>
        ) : null,
      )}
    </svg>
  );
}
