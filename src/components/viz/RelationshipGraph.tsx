import { useMemo, useState } from "react";
import { getCompanies, getContacts, getSource, useDataRevision } from "@/lib/data-service";
import { cn } from "@/lib/utils";

type NodeKind = "empresa" | "persona" | "fuente";
interface GNode { id: string; kind: NodeKind; label: string; x: number; y: number; meta: string }
interface GEdge { a: string; b: string }

const W = 800, H = 520;
const COLORS: Record<NodeKind, string> = { empresa: "var(--signal)", persona: "var(--cream)", fuente: "var(--chart-3)" };

export function buildGraph(industry?: string) {
  const comps = getCompanies().filter((c) => !industry || industry === "todas" || c.industry === industry).slice(0, 12);
  const nodes: GNode[] = []; const edges: GEdge[] = [];
  const seen = new Set<string>();
  comps.forEach((c, i) => {
    const ang = (i / comps.length) * Math.PI * 2 - Math.PI / 2;
    const R = comps.length > 1 ? 160 : 0;
    const cx = W / 2 + Math.cos(ang) * R * 1.35, cy = H / 2 + Math.sin(ang) * R;
    nodes.push({ id: c.id, kind: "empresa", label: c.name, x: cx, y: cy, meta: `${c.industry} · score ${c.score}` });
    const sats = [
      ...getContacts().filter((p) => p.companyId === c.id).map((p) => ({ id: p.id, kind: "persona" as const, label: p.name, meta: p.role })),
      ...c.sourceIds.map((s) => { const src = getSource(s); return { id: s, kind: "fuente" as const, label: src?.title ?? "Fuente", meta: `${src?.type ?? "Registro"} · ${src?.origin ?? ""}` }; }),
    ];
    sats.forEach((s, j) => {
      edges.push({ a: c.id, b: s.id });
      if (seen.has(s.id)) return; seen.add(s.id);
      const a2 = ang + ((j - (sats.length - 1) / 2) * 0.55);
      nodes.push({ ...s, x: cx + Math.cos(a2) * 78, y: cy + Math.sin(a2) * 70 });
    });
  });
  return { nodes, edges };
}

export function RelationshipGraph({ industry, onSelect }: { industry?: string; onSelect?: (n: GNode | null) => void }) {
  const version = useDataRevision();
  const { nodes, edges } = useMemo(() => buildGraph(industry), [industry, version]);
  const [sel, setSel] = useState<string | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const focus = hover ?? sel;
  const linked = useMemo(() => {
    if (!focus) return null;
    const s = new Set([focus]);
    edges.forEach((e) => { if (e.a === focus) s.add(e.b); if (e.b === focus) s.add(e.a); });
    return s;
  }, [focus, edges]);
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const pick = (n: GNode) => { const next = sel === n.id ? null : n.id; setSel(next); onSelect?.(next ? n : null); };

  return (
    <div className="relative">
      {getCompanies().length > 12 && <p className="mb-2 text-xs text-muted-foreground">Mapa limitado a 12 empresas; listado y métricas incluyen todas.</p>}
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="group" aria-label="Mapa de relaciones entre empresas, personas y fuentes">
        <defs>
          <radialGradient id="ng"><stop offset="0%" stopColor="var(--signal)" stopOpacity=".5" /><stop offset="100%" stopColor="var(--signal)" stopOpacity="0" /></radialGradient>
        </defs>
        {edges.map((e, i) => {
          const a = byId[e.a], b = byId[e.b]; if(!a||!b)return null; const on = linked?.has(e.a) && linked?.has(e.b);
          return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={on ? "var(--signal)" : "var(--cream)"} strokeOpacity={linked ? (on ? 0.8 : 0.06) : 0.18} strokeWidth={on ? 1.4 : 1} />;
        })}
        {nodes.map((n) => {
          const dim = linked && !linked.has(n.id); const r = n.kind === "empresa" ? 13 : 6;
          return (
            <g key={n.id} transform={`translate(${n.x},${n.y})`} tabIndex={0} role="button" aria-pressed={sel === n.id}
              aria-label={`${n.kind}: ${n.label}. ${n.meta}`}
              onClick={() => pick(n)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(n); } }}
              onMouseEnter={() => setHover(n.id)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(n.id)} onBlur={() => setHover(null)}
              className="cursor-pointer outline-none" opacity={dim ? 0.25 : 1}>
              {n.kind === "empresa" && <circle r={30} fill="url(#ng)" />}
              {n.kind === "fuente"
                ? <rect x={-r} y={-r} width={r * 2} height={r * 2} rx={2} fill="var(--background)" stroke={COLORS[n.kind]} strokeWidth={1.6} />
                : <circle r={r} fill={n.kind === "empresa" ? COLORS.empresa : "var(--background)"} stroke={COLORS[n.kind]} strokeWidth={sel === n.id ? 3 : 1.6} />}
              {((n.kind === "empresa" && nodes.filter(x=>x.kind==="empresa").length<=6) || focus === n.id) && (
                <text y={n.kind === "empresa" ? -20 : -12} textAnchor="middle" fontSize={n.kind === "empresa" ? 12 : 10.5} fill="var(--foreground)" fontWeight={n.kind === "empresa" ? 600 : 400}
                  style={{ paintOrder: "stroke", stroke: "var(--background)", strokeWidth: 3 }}>
                  {n.label.length > 30 ? n.label.slice(0, 28) + "…" : n.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <Legend />
    </div>
  );
}

export function Legend() {
  return (
    <ul className="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground" aria-label="Leyenda">
      <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full bg-signal" />Empresa</li>
      <li className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border-2 border-cream" />Persona</li>
      <li className="flex items-center gap-1.5"><span className={cn("h-3 w-3 rounded-sm border-2 border-chart-3")} />Fuente</li>
    </ul>
  );
}
export type { GNode };
