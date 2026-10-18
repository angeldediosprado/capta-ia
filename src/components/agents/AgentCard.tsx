import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { AgentCharacter } from "./AgentCharacter";
import { AGENTS } from "./agents";
import type { AgentId } from "@/lib/demo-data";
import { DemoBadge } from "@/components/data/DemoBadge";

export function AgentCard({ id }: { id: AgentId }) {
  const a = AGENTS[id];
  return (
    <article className="panel group relative min-w-0 flex flex-col overflow-hidden p-0 transition-shadow hover:glow-signal focus-within:glow-signal">
      <AgentCharacter id={id} />
      <div className="relative -mt-16 flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="label-mono text-signal">{a.verb}</span>
          <DemoBadge label={a.demoStatus} />
        </div>
        <div>
          <h3 className="text-2xl font-semibold tracking-tight">{a.name}</h3>
          <p className="text-sm text-muted-foreground">{a.role}</p>
        </div>
        <p className="text-sm leading-relaxed text-foreground/80">{a.summary}</p>
        <ul className="flex flex-wrap gap-1.5">
          {a.tags.map((t) => <li key={t} className="rounded-md border px-2 py-0.5 font-mono text-[0.7rem] text-muted-foreground">{t}</li>)}
        </ul>
        <Link to="/agentes/$agent" params={{ agent: id }} className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-medium text-signal hover:underline">
          Ver detalles <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </article>
  );
}
