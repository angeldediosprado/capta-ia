import { PipelineAudit } from '@/components/prospecting/PipelineAudit';
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { AgentCharacter } from "@/components/agents/AgentCharacter";
import { AGENTS, AGENT_LIST } from "@/components/agents/agents";
import { DemoBadge, StatusPill } from "@/components/data/DemoBadge";
import { ChartPanel, FilterChips, SearchBar, EmptyState } from "@/components/data/primitives";
import { RelationshipGraph } from "@/components/viz/RelationshipGraph";
import { ProvenanceFlow } from "@/components/viz/ProvenanceFlow";
import { getCompanies, getRules, getSource, getSources, matches, useDataRevision, isDemo } from "@/lib/data-service";
import type { AgentId, SourceType } from "@/lib/demo-data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/agentes/$agent")({
  loader: ({ params }) => { if (!(params.agent in AGENTS)) throw notFound(); return { id: params.agent as AgentId }; },
  head: ({ loaderData }) => {
    const a = loaderData ? AGENTS[loaderData.id] : null;
    return { meta: a ? [
      { title: `${a.name} — capta IA` }, { name: "description", content: a.summary },
      { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: `${a.name} · ${a.verb} — capta IA` }, { property: "og:description", content: a.summary },
    ] : [{ title: "Agente — capta IA" }, { name: "robots", content: "noindex" }] };
  },
  component: AgentPage,
});

function AgentPage() {
  useDataRevision();
  const { id } = Route.useLoaderData(); const a = AGENTS[id];
  return (
    <div className="mx-auto max-w-[1400px] space-y-6">
      <nav aria-label="Agentes" className="flex flex-wrap gap-2">
        {AGENT_LIST.map((x) => <Link key={x.id} to="/agentes/$agent" params={{ agent: x.id }} className={cn("rounded-lg border px-3 py-1.5 text-sm", x.id === id ? "border-signal/50 bg-signal-soft text-signal" : "text-muted-foreground hover:text-foreground")}>{x.name}</Link>)}
      </nav>
      <section className="panel grid overflow-hidden p-0 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <AgentCharacter id={id} size="lg" eager className="rounded-none lg:h-full" />
        <div className="flex flex-col justify-center gap-3 p-6 md:p-10">
          <div className="flex items-center gap-3"><span className="label-mono text-signal">{a.verb}</span><DemoBadge label={a.demoStatus} /></div>
          <h1 className="text-4xl font-semibold tracking-tight">{a.name}</h1>
          <p className="text-muted-foreground">{a.role}</p>
          <p className="max-w-xl leading-relaxed text-foreground/85">{a.summary}</p>
          <p className="text-xs text-muted-foreground">{isDemo() ? "Agente de demostración: datos sintéticos." : "Datos públicos consultables en Fuentes; organización y evaluación ICP deterministas, no agentes autónomos. Dapta no conectado."}</p>
        </div>
      </section>
      <PipelineAudit agent={id} />
      {isDemo() && id === "scout" && <ScoutView />}
      {isDemo() && id === "sorter" && <SorterView />}
      {isDemo() && id === "check" && <CheckView />}
    </div>
  );
}

function ScoutView() {
  const [q, setQ] = useState(""); const [type, setType] = useState<SourceType | "todos">("todos");
  const rows = getSources().filter((s) => matches(q, s.title, s.origin, s.industry) && (type === "todos" || s.type === type));
  return (
    <ChartPanel title="Exploración de fuentes" subtitle="Resultados de búsqueda de ejemplo sobre datos locales">
      <div className="mb-4 flex flex-col gap-3"><SearchBar value={q} onChange={setQ} placeholder="p. ej. energía, registro, serie A" className="max-w-md" /><FilterChips label="Tipo" options={["Web", "Registro", "Noticia", "Red social", "Documento"] as const} value={type} onChange={setType} /></div>
      {rows.length === 0 ? <EmptyState /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {rows.map((s) => (
            <Link key={s.id} to="/fuentes" search={{ id: s.id }} className="holo block p-4 transition-shadow hover:glow-signal">
              <div className="mb-2 flex items-center justify-between"><span className="label-mono">{s.type}</span><StatusPill status={s.status} /></div>
              <p className="font-medium">{s.title}</p>
              <p className="mt-1 font-mono text-xs text-muted-foreground">{s.origin}</p>
              <p className="mt-3 flex justify-between font-mono text-[0.7rem] text-muted-foreground"><span>{s.date}</span><span>confianza {Math.round(s.confidence * 100)}%</span></p>
            </Link>
          ))}
        </div>
      )}
    </ChartPanel>
  );
}

function SorterView() {
  const inds = [...new Set(getCompanies().map((c) => c.industry))];
  return (
    <div className="space-y-4">
      <ChartPanel title="Clusters por industria" subtitle="Clasificación de empresas (demo)">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {inds.map((i) => { const cs = getCompanies().filter((c) => c.industry === i); return (
            <div key={i} className="holo p-3"><p className="label-mono text-signal">{i}</p><ul className="mt-2 space-y-1 text-sm">{cs.map((c) => <li key={c.id}><Link to="/empresas" search={{ id: c.id }} className="hover:text-signal">{c.name}</Link></li>)}</ul></div>); })}
        </div>
      </ChartPanel>
      <ChartPanel title="Relaciones entre entidades"><RelationshipGraph /></ChartPanel>
    </div>
  );
}

function CheckView() {
  useDataRevision();
  const rules = getRules(); const [sel, setSel] = useState(rules[1]?.id ?? rules[0]?.id ?? "");
  const r = rules.find((x) => x.id === sel) ?? rules[0];
  if (!r) return <EmptyState />;
  const Icon = { pasa: CheckCircle2, atención: AlertTriangle, falla: XCircle } as const;
  const tone = { pasa: "text-ok", atención: "text-warn", falla: "text-destructive" } as const;
  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <ChartPanel title="Checklist de reglas" subtitle="Estados de demostración, no resultados reales">
          <ul className="space-y-1.5">
            {rules.map((x) => { const I = Icon[x.status]; return (
              <li key={x.id}><button onClick={() => setSel(x.id)} aria-pressed={sel === x.id} className={cn("flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm", sel === x.id ? "border-signal/50 bg-signal-soft" : "border-transparent hover:bg-accent/50")}>
                <I className={cn("h-4 w-4 shrink-0", tone[x.status])} /><span className="flex-1">{x.name}</span><StatusPill status={x.status} /></button></li>); })}
          </ul>
        </ChartPanel>
        <ChartPanel title={r.name} subtitle="Evidencia enlazada y trazabilidad">
          <p className="text-sm text-foreground/85">{r.description}</p>
          {r.status !== "pasa" && <p className={cn("mt-3 rounded-lg border px-3 py-2 text-sm", r.status === "falla" ? "border-destructive/40 text-destructive" : "border-warn/40 text-warn")}>Posible riesgo (demo): requiere revisión humana antes de usar esta información.</p>}
          <p className="label-mono mb-2 mt-5">Evidencia</p>
          <ul className="space-y-2">{r.evidence.map((e) => { const s = getSource(e); if (!s) return null; return (
            <li key={e} className="flex items-center justify-between gap-2 text-sm"><Link to="/fuentes" search={{ id: e }} className="truncate hover:text-signal">{s.title}</Link><span className="font-mono text-xs text-muted-foreground">{s.date}</span></li>); })}</ul>
        </ChartPanel>
      </div>
      <ChartPanel title="Trazabilidad completa" subtitle="Fuente → empresa → contacto"><ProvenanceFlow highlight={r.evidence[0]} /></ChartPanel>
    </div>
  );
}
