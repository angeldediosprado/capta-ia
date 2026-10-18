import { useState } from "react";
import type { Signal } from "@/lib/demo-data";
import { companyName } from "@/lib/data-service";
import { AGENTS } from "@/components/agents/agents";
import { EmptyState } from "@/components/data/primitives";

const LANES = ["scout", "sorter", "check"] as const;

/** Signal timeline: lanes per agent, dots per signal, day ticks. */
export function ActivityTimeline({ signals }: { signals: Signal[] }) {
  const [sel, setSel] = useState<Signal | null>(null);
  if (!signals.length) return <EmptyState title="Sin señales en el periodo" />;
  const dates = signals.map((s) => +new Date(s.date));
  const min = Math.min(...dates), max = Math.max(...dates) || min + 1;
  const W = 760, L = 70, R = 20, laneH = 46, H = LANES.length * laneH + 34;
  const x = (d: string) => L + ((+new Date(d) - min) / (max - min || 1)) * (W - L - R);
  const days = Math.round((max - min) / 864e5);
  const ticks = Array.from({ length: Math.min(days, 8) + 1 }, (_, i) => new Date(min + (i * (max - min)) / Math.max(Math.min(days, 8), 1)));
  return (
    <div>
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full min-w-[560px]" role="group" aria-label="Línea de tiempo de señales por agente">
          {LANES.map((l, i) => (
            <g key={l}>
              <line x1={L} x2={W - R} y1={i * laneH + 24} y2={i * laneH + 24} stroke="var(--border)" />
              <text x={0} y={i * laneH + 28} fontSize={11} fill="var(--muted-foreground)">{AGENTS[l].name}</text>
            </g>
          ))}
          {ticks.map((t, i) => (
            <g key={i}>
              <line x1={L + (i / (ticks.length - 1 || 1)) * (W - L - R)} x2={L + (i / (ticks.length - 1 || 1)) * (W - L - R)} y1={8} y2={H - 22} stroke="var(--border)" strokeDasharray="2 4" />
              <text x={L + (i / (ticks.length - 1 || 1)) * (W - L - R)} y={H - 6} fontSize={10} textAnchor="middle" fill="var(--muted-foreground)" fontFamily="var(--font-mono)">{t.toISOString().slice(5, 10)}</text>
            </g>
          ))}
          {signals.map((s) => {
            const lane = LANES.indexOf(s.agent);
            const risk = s.kind === "Riesgo";
            return (
              <g key={s.id} tabIndex={0} role="button" aria-label={`${s.date}: ${s.label}, ${companyName(s.companyId)}`} className="cursor-pointer outline-none"
                onClick={() => setSel(s)} onFocus={() => setSel(s)} onMouseEnter={() => setSel(s)} onKeyDown={(e) => e.key === "Enter" && setSel(s)}>
                <circle cx={x(s.date)} cy={lane * laneH + 24} r={sel?.id === s.id ? 8 : 5.5} fill={risk ? "var(--destructive)" : sel?.id === s.id ? "var(--signal)" : "var(--background)"} stroke={risk ? "var(--destructive)" : "var(--signal)"} strokeWidth={1.8} />
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-2 min-h-12 rounded-lg border bg-surface-2 px-3 py-2 text-sm" aria-live="polite">
        {sel ? (<><span className="font-mono text-xs text-signal">{sel.date} · {sel.kind}</span><p>{sel.label} — <span className="text-muted-foreground">{companyName(sel.companyId)}</span></p></>) : <p className="text-muted-foreground">Pasa el cursor o enfoca una señal para ver el detalle.</p>}
      </div>
    </div>
  );
}
