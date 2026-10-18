import { ChevronRight } from "lucide-react";
import { AgentCharacter } from "@/components/agents/AgentCharacter";
import { getSources, getPipelineRuns, isDemo, useDataRevision } from "@/lib/data-service";
import type { AgentId } from "@/lib/demo-data";

export function flowCounts() {
  if(!isDemo()){
    const run=getPipelineRuns().at(-1);
    return {scout:run?.stages?.find(s=>s.agent==='scout')?.output??0,sorter:run?.stages?.find(s=>s.agent==='sorter')?.output??0,check:run?.stages?.find(s=>s.agent==='check')?.output??0};
  }
  const s = getSources();
  return {
    scout: s.length,
    sorter: s.filter((x) => x.status !== "nuevo").length,
    check: s.filter((x) => x.status === "revisado (demo)").length,
  };
}

export function FlowStatus() {
  useDataRevision();
  const c = flowCounts();
  const stages: { id: AgentId; name: string; n: number; desc: string }[] = [
    { id: "scout", name: "Descubrimiento", n: c.scout, desc: isDemo()?"fuentes detectadas":"registros · último run" },
    { id: "sorter", name: "Organización", n: c.sorter, desc: isDemo()?"fuentes organizadas":"empresas · último run" },
    { id: "check", name: "Verificación", n: c.check, desc: isDemo()?"revisadas (demo)":"coincidencias ICP · último run" },
  ];
  return (
    <ol className="grid gap-3 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:items-center" aria-label="Estado del flujo">
      {stages.map((s, i) => (
        <li key={s.id} className="contents">
          <div className="min-w-0 flex items-center gap-3 rounded-lg border bg-surface-2 p-3">
            <AgentCharacter id={s.id} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="label-mono">{s.name}</p>
              <p className="text-xl font-semibold tabular-nums">{s.n}<span className="ml-1 text-xs font-normal text-muted-foreground">{s.desc}</span></p>
              <div className="mt-1.5 h-1 rounded bg-background"><div className="h-full rounded bg-signal" style={{ width: `${(s.n / (c.scout || 1)) * 100}%` }} /></div>
            </div>
          </div>
          {i < 2 && <ChevronRight className="mx-auto hidden h-5 w-5 text-signal lg:block" aria-hidden />}
        </li>
      ))}
    </ol>
  );
}
