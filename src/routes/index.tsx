import { isDemo, useDataRevision } from "@/lib/data-service";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CinematicHero } from "@/components/CinematicHero";
import { AgentCard } from "@/components/agents/AgentCard";
import { AGENTS } from "@/components/agents/agents";
import { DemoBadge } from "@/components/data/DemoBadge";
import { MetricCard } from "@/components/data/primitives";
import { FlowStatus } from "@/components/viz/FlowStatus";
import { getCompanies, getContacts, getSignals, getSources, companyName, getActivity } from "@/lib/data-service";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Inicio — capta IA" },
      { name: "description", content: "Scout, Sorter y Check: agentes que capturan, organizan y verifican inteligencia comercial." },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "capta IA — Inteligencia en equipo" },
      { property: "og:description", content: "Workspace de prospección con agentes Scout, Sorter y Check." },
    ],
  }),
  component: Index,
});

function Index() {
  useDataRevision();
  const act = getActivity();
  const recent = [...getSignals()].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);
  return (
    <div className="mx-auto max-w-[1400px] space-y-8">
      <CinematicHero />
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_22rem]">
        <section id="agentes" aria-labelledby="agentes-title" className="min-w-0 scroll-mt-20">
          <div className="mb-4 flex items-end justify-between">
            <div><p className="label-mono text-signal">El equipo</p><h2 id="agentes-title" className="text-2xl font-semibold tracking-tight">Tres agentes, un flujo</h2></div>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">{(["scout", "sorter", "check"] as const).map((id) => <AgentCard key={id} id={id} />)}</div>
          <div className="panel mt-6 p-5"><div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">Estado del flujo</h3><DemoBadge /></div><FlowStatus /></div>
        </section>
        <aside className="min-w-0 space-y-4" aria-label="Panel lateral">
          <section className="panel p-5">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Visión general</h2><DemoBadge label="demo" /></div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <MetricCard label="Fuentes" value={getSources().length} spark={act.map((a) => a.scout)} />
              <MetricCard label="Empresas" value={getCompanies().length} />
              <MetricCard label="Contactos" value={getContacts().length} />
              <MetricCard label="Señales" value={getSignals().length} />
            </div>
          </section>
          <section className="panel p-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h2 className="font-semibold">Actividad reciente</h2><DemoBadge label="muestra" /></div>
            <p className="mb-3 text-xs text-muted-foreground">{isDemo() ? "Eventos de ejemplo, no actividad real." : "Registros públicos y eventos manuales observados."}</p>
            <ol className="space-y-3">
              {recent.map((s) => (
                <li key={s.id} className="flex gap-3 text-sm">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-signal" aria-hidden />
                  <div className="min-w-0"><p className="truncate">{s.label}</p><p className="font-mono text-[0.7rem] text-muted-foreground">{AGENTS[s.agent].name} · {companyName(s.companyId)} · {s.date}</p></div>
                </li>
              ))}
            </ol>
            <Link to="/resultados" className="mt-4 inline-block text-sm text-signal hover:underline">Ver resultados</Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
