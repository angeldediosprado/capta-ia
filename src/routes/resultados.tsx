import { PipelineAudit } from '@/components/prospecting/PipelineAudit';
import { getLeads, getProspectingData, evaluateICP, validLead } from '@/lib/data-service';
import { CostMetrics } from "@/components/prospecting/CostMetrics";
import { isDemo, useDataRevision } from "@/lib/data-service";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Area, AreaChart, CartesianGrid, Legend as RLegend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartPanel, MetricCard, PageHeader, Field } from "@/components/data/primitives";
import { RelationshipGraph, type GNode } from "@/components/viz/RelationshipGraph";
import { ProvenanceFlow } from "@/components/viz/ProvenanceFlow";
import { ActivityTimeline } from "@/components/viz/ActivityTimeline";
import { ComparisonBars } from "@/components/viz/ComparisonBars";
import { FlowStatus } from "@/components/viz/FlowStatus";
import { getActivity, getCompanies, getRules, getSignals, getSources } from "@/lib/data-service";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/resultados")({
  head: () => ({ meta: [
    { title: "Resultados — capta IA" }, { name: "description", content: "Mapa de relaciones, procedencia, señales y comparativas de la prospección." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Resultados — capta IA" }, { property: "og:description", content: "Visualizaciones interactivas de inteligencia comercial." },
  ] }),
  component: Resultados,
});

const PERIODS = { "7d": 7, "14d": 14, "30d": 30 } as const;
type Period = keyof typeof PERIODS;
const REF = new Date("2026-10-17");

export function PeriodFilter({ value, onChange }: { value: Period; onChange: (p: Period) => void }) {
  return (
    <div role="radiogroup" aria-label="Periodo" className="flex rounded-lg border p-0.5">
      {(Object.keys(PERIODS) as Period[]).map((p) => (
        <button key={p} role="radio" aria-checked={value === p} onClick={() => onChange(p)} className={cn("rounded-md px-2.5 py-1 font-mono text-xs", value === p ? "bg-signal-soft text-signal" : "text-muted-foreground hover:text-foreground")}>{p}</button>
      ))}
    </div>
  );
}

function Resultados() {
  useDataRevision();
  const [period, setPeriod] = useState<Period>("14d");
  const [ind, setInd] = useState("todas");
  const [node, setNode] = useState<GNode | null>(null);
  const from = new Date((isDemo() ? REF : new Date()).getTime() - PERIODS[period] * 864e5).toISOString().slice(0, 10);
  const sigs = getSignals().filter((s) => s.date >= from);
  const industries = ["todas", ...new Set(getCompanies().map((c) => c.industry))];
  const act = getActivity();
  const rules = getRules();
  const w=getProspectingData().workspace;
  const inventory=getLeads().filter(l=>l.createdAt.slice(0,10)>=from);
  const realMatch=inventory.filter(l=>validLead(l)&&evaluateICP(l,w.icp).status==='match');
  const stages=[{label:'Registros recibidos (incluye duplicados)',value:w.runs.filter(r=>r.status==='success'&&r.fetchedAt.slice(0,10)>=from).reduce((n,r)=>n+r.received,0)},{label:'Empresas únicas sin ambigüedad',value:inventory.filter(l=>!l.review).length},{label:'Válidas: nombre + dirección, sin revisión',value:inventory.filter(validLead).length},{label:'Coinciden ICP',value:realMatch.length},{label:'ICP con canal público',value:realMatch.filter(l=>l.phone||l.email||l.website).length}];
  const passRate = (rules.filter((r) => r.status === "pasa").length / rules.length) * 100;
  return (
    <div className="mx-auto max-w-[1400px] space-y-4">
      <PageHeader eyebrow="Resultados" title="Inteligencia consolidada" description="Relaciones, procedencia y señales calculadas sobre el conjunto seleccionado." actions={<PeriodFilter value={period} onChange={setPeriod} />} />
      {!isDemo() && <CostMetrics />}
      {!isDemo()&&<><ChartPanel title="Conversión por etapa" subtitle={`Desde ${from} UTC · unidades indicadas; no sumar registros con empresas`}><ComparisonBars data={stages}/></ChartPanel><PipelineAudit/></>}
      {isDemo()&&<div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Señales en periodo" value={sigs.length} delta={`desde ${from}`} spark={act.map((a) => a.scout + a.sorter + a.check)} />
        <MetricCard label="Fuentes" value={getSources().length} unit="total" spark={act.map((a) => a.scout)} />
        <MetricCard label="Reglas que pasan" value={`${rules.filter((r) => r.status === "pasa").length}/${rules.length}`} progress={passRate} />
        <MetricCard label="Score medio" value={Math.round(getCompanies().reduce((a, c) => a + c.score, 0) / (getCompanies().length || 1))} unit="/100" />
      </div>
      }
      {isDemo()&&<ChartPanel title="Estado del flujo" subtitle="Descubrimiento → Organización → Verificación"><FlowStatus /></ChartPanel>}
      <div className="grid gap-4 xl:grid-cols-[1fr_20rem]">
        <ChartPanel title="Mapa de relaciones" subtitle="Empresas, personas y fuentes. Selecciona un nodo." actions={
          <label className="text-xs text-muted-foreground">Industria{" "}
            <select value={ind} onChange={(e) => { setInd(e.target.value); setNode(null); }} className="ml-1 rounded-md border bg-surface-2 px-2 py-1 text-foreground">{industries.map((i) => <option key={i}>{i}</option>)}</select>
          </label>}>
          <RelationshipGraph industry={ind} onSelect={setNode} />
        </ChartPanel>
        <ChartPanel title="Detalle del nodo">
          {node ? (
            <dl className="space-y-3" aria-live="polite"><Field label="Tipo"><span className="capitalize">{node.kind}</span></Field><Field label="Nombre">{node.label}</Field><Field label="Información">{node.meta}</Field></dl>
          ) : <p className="text-sm text-muted-foreground">Ningún nodo seleccionado. Usa clic o Tab + Enter sobre el mapa.</p>}
        </ChartPanel>
      </div>
      <ChartPanel title="Procedencia" subtitle="Fuente → empresa → contacto. Pasa el cursor para seguir un camino."><ProvenanceFlow /></ChartPanel>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel title="Timeline de señales" subtitle={`Últimos ${PERIODS[period]} días · por agente`}><ActivityTimeline signals={sigs} /></ChartPanel>
        <ChartPanel title="Score por empresa" subtitle="Hasta 20 empresas · coincidencia ICP / puntuación demo, 0–100">
          <ComparisonBars unit="" max={100} data={[...getCompanies()].sort((a, b) => b.score - a.score).slice(0,20).map((c) => ({ label: c.name, value: c.score, note: c.industry }))} />
        </ChartPanel>
      </div>
      {isDemo()&&<ChartPanel title="Actividad semanal por agente" subtitle="Elementos del conjunto seleccionado">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={act} margin={{ left: -16, right: 8, top: 8 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="week" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
              <RLegend wrapperStyle={{ fontSize: 12 }} />
              <Area type="monotone" dataKey="scout" name="Scout" stroke="var(--signal)" fill="var(--signal)" fillOpacity={0.15} />
              <Area type="monotone" dataKey="sorter" name="Sorter" stroke="var(--cream)" fill="var(--cream)" fillOpacity={0.06} />
              <Area type="monotone" dataKey="check" name="Check" stroke="var(--chart-3)" fill="var(--chart-3)" fillOpacity={0.08} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </ChartPanel>}
    </div>
  );
}
