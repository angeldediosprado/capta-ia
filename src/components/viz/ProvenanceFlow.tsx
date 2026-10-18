import { useState } from "react";
import { getCompanies, getContacts, getSources, useDataRevision } from "@/lib/data-service";

/** Source → Company → Contact provenance graph (three columns, curved links). */
export function ProvenanceFlow({ highlight }: { highlight?: string | undefined }) {
  useDataRevision();
  const companies = getCompanies().slice(0,24);
  const sources = getSources().filter(s => companies.some(c => c.sourceIds.includes(s.id))), contacts = getContacts().filter(p => companies.some(c => c.id === p.companyId));
  const [hover, setHover] = useState<string | null>(highlight ?? null);
  const W = 760, rowH = 30, H = Math.max(sources.length, contacts.length, companies.length, 1) * rowH + 30;
  const colX = [10, 330, 560] as const;
  const sy = (i: number, n: number) => n===1 ? H/2 : 24 + i * ((H - 40) / Math.max(n - 1, 1));
  const pos: Record<string, { x: number; y: number }> = {};
  sources.forEach((s, i) => (pos[s.id] = { x: colX[0], y: sy(i, sources.length) }));
  companies.forEach((c, i) => (pos[c.id] = { x: colX[1], y: sy(i, companies.length) }));
  contacts.forEach((p, i) => (pos[p.id] = { x: colX[2], y: sy(i, contacts.length) }));
  const links = [
    ...companies.flatMap((c) => c.sourceIds.map((s) => ({ a: s, b: c.id }))),
    ...contacts.map((p) => ({ a: p.companyId, b: p.id })),
  ];
  const related = (() => {
    if (!hover) return null;
    const set = new Set([hover]);
    const comps = sources.some(s => s.id === hover) ? companies.filter((c) => c.sourceIds.includes(hover))
      : companies.some(c => c.id === hover) ? companies.filter((c) => c.id === hover)
      : companies.filter((c) => contacts.some((p) => p.id === hover && p.companyId === c.id));
    comps.forEach((c) => {
      set.add(c.id);
      if (!sources.some(s => s.id === hover)) c.sourceIds.forEach((x) => set.add(x));
      if (!contacts.some(p => p.id === hover)) contacts.filter((p) => p.companyId === c.id).forEach((p) => set.add(p.id));
    });
    return set;
  })();
  const active = (l: { a: string; b: string }) => !related || (related.has(l.a) && related.has(l.b));
  const label = (id: string, text: string, x: number, y: number, anchor: "start" | "end" = "start", dx = 10, limit = 25) => (
    <g key={id} tabIndex={0} role="button" aria-label={text} onMouseEnter={() => setHover(id)} onMouseLeave={() => setHover(highlight ?? null)} onFocus={() => setHover(id)} onBlur={() => setHover(highlight ?? null)} className="cursor-pointer outline-none">
      <title>{text}</title><circle cx={x} cy={y} r={4.5} fill={hover === id ? "var(--signal)" : "var(--background)"} stroke={companies.some(c => c.id === id) ? "var(--signal)" : sources.some(s => s.id === id) ? "var(--chart-3)" : "var(--cream)"} strokeWidth={1.6} />
      <text x={x + (anchor === "start" ? dx : -dx)} y={y + 4} textAnchor={anchor} fontSize={11} fill={hover === id ? "var(--foreground)" : "var(--muted-foreground)"}>{text.length > limit ? text.slice(0, limit-1) + "…" : text}</text>
    </g>
  );
  return (
    <div className="max-h-[32rem] max-w-full overflow-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[640px]" role="group" aria-label="Grafo de procedencia: fuente a empresa a contacto">
        <text x={colX[0]} y={10} fontSize={10} fill="var(--signal)" fontFamily="var(--font-mono)">FUENTES</text>
        <text x={colX[1]} y={10} fontSize={10} fill="var(--signal)" fontFamily="var(--font-mono)">EMPRESAS</text>
        <text x={colX[2]} y={10} fontSize={10} fill="var(--signal)" fontFamily="var(--font-mono)">CONTACTOS</text>
        {links.map((l, i) => {
          const a = pos[l.a], b = pos[l.b]; if (!a || !b) return null; const on = active(l);
          const ax = sources.some(s => s.id === l.a) ? a.x + 210 : a.x;
          const mx = (ax + b.x) / 2;
          return <path key={i} d={`M${ax},${a.y} C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`} fill="none" stroke={on && hover ? "var(--signal)" : "var(--cream)"} strokeOpacity={on ? (hover ? 0.75 : 0.22) : 0.05} strokeWidth={1.2} />;
        })}
        {sources.map((s) => label(s.id, s.title, colX[0] + 210, pos[s.id]?.y ?? 0, "end"))}
        {companies.map((c) => label(c.id, c.name, colX[1], pos[c.id]?.y ?? 0, "start", 10, 23))}
        {contacts.map((p) => label(p.id, p.name, colX[2], pos[p.id]?.y ?? 0, "start", 10, 25))}
      </svg>
    </div>
  );
}
