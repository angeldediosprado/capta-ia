import { Input } from '@/components/ui/input';
import { getLeads, evaluateICP, getProspectingData } from '@/lib/data-service';
import { IntegrationStatus } from "@/components/prospecting/IntegrationStatus";
import { CostMetrics } from "@/components/prospecting/CostMetrics";
import { isDemo, useDataRevision } from "@/lib/data-service";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChartPanel, MetricCard, PageHeader, FilterChips } from "@/components/data/primitives";
import { ComparisonBars } from "@/components/viz/ComparisonBars";
import { companyName, downloadCSV, getCompanies, getContacts, getSignals, getSource, getSources, toCSV } from "@/lib/data-service";
import { toast } from "sonner";

export const Route = createFileRoute("/reportes")({
  head: () => ({ meta: [
    { title: "Reportes — capta IA" }, { name: "description", content: "Reportes filtrados por periodo con procedencia, costos y exportación CSV del conjunto seleccionado." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Reportes — capta IA" }, { property: "og:description", content: "Reportes exportables de prospección." },
  ] }),
  component: Reportes,
});

const DATASETS = ["empresas", "contactos", "fuentes", "señales"] as const;

function Reportes() {
  useDataRevision();
  const [ind, setInd] = useState<string>("todos");
  const [from,setFrom]=useState(''),[to,setTo]=useState('');
  const inPeriod=(date:string)=> (!from||date.slice(0,10)>=from)&&(!to||date.slice(0,10)<=to);
  const industries = [...new Set(getCompanies().map((c) => c.industry))];
  const comps = getCompanies().filter((c) => (ind === "todos" || c.industry === ind) && (isDemo()||inPeriod(getLeads().find(l=>l.id===c.id)?.createdAt??'')));
  const ids = new Set(comps.map((c) => c.id));
  const contacts = getContacts().filter((p) => ids.has(p.companyId)&&inPeriod(p.addedAt));
  const sources = getSources().filter((s) => (ind === "todos" || s.industry === ind)&&inPeriod(s.date));
  const signals = getSignals().filter((s) => ids.has(s.companyId)&&inPeriod(s.date));
  const byKind = Object.entries(signals.reduce<Record<string, number>>((a, s) => ((a[s.kind] = (a[s.kind] ?? 0) + 1), a), {})).map(([label, value]) => ({ label, value }));
  const byType = Object.entries(sources.reduce<Record<string, number>>((a, s) => ((a[s.type] = (a[s.type] ?? 0) + 1), a), {})).map(([label, value]) => ({ label, value }));

  const exportSet = (d: (typeof DATASETS)[number]) => {
    const rows =
      d === "empresas" ? comps.map((c) => ({ id: c.id, nombre: c.name, industria: c.industry, ciudad: c.city, tamano: c.size, evaluacion: isDemo()?`score demo ${c.score}`:(getLeads().find(l=>l.id===c.id)?evaluateICP(getLeads().find(l=>l.id===c.id) as ReturnType<typeof getLeads>[number],getProspectingData().workspace.icp).status:'N/D'), fuentes: c.sourceIds.length, provenance:isDemo()?'demo':JSON.stringify(getLeads().find(l=>l.id===c.id)?.provenance) }))
      : d === "contactos" ? contacts.map((p) => ({ id: p.id, nombre: p.name, cargo: p.role, empresa: companyName(p.companyId), fuente: getSource(p.sourceId)?.title, email: p.email }))
      : d === "fuentes" ? sources.map((s) => ({ id: s.id, titulo: s.title, tipo: s.type, origen: s.origin, estado: s.status, fecha: s.date, industria: s.industry }))
      : signals.map((s) => ({ id: s.id, fecha: s.date, tipo: s.kind, empresa: companyName(s.companyId), agente: s.agent, descripcion: s.label }));
    if (!rows.length) { toast("No hay filas para exportar con este filtro"); return; }
    downloadCSV(`capta-ia-${d}-${isDemo() ? "demo" : "publicos"}.csv`, toCSV(rows.map(r=>({...r,clase_datos:isDemo()?'demo':'publicos',periodo_desde:from||'sin límite',periodo_hasta:to||'sin límite',exportado_utc:new Date().toISOString()}))));
    toast.success(`CSV de ${d} exportado`, { description: `${rows.length} filas · ${isDemo() ? "datos de demostración" : "datos públicos"}` });
  };

  return (
    <div className="mx-auto max-w-[1400px] space-y-4">
      <PageHeader eyebrow="Reportes" title="Resumen de prospección" description="Filtra por industria y exporta cualquier conjunto a CSV." />
      <CostMetrics />
      <IntegrationStatus />
      <div className="flex flex-wrap gap-3 border-b pb-4"><label className="text-xs">Desde<Input aria-label="Exportar desde" type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label className="text-xs">Hasta<Input aria-label="Exportar hasta" type="date" min={from} value={to} onChange={e=>setTo(e.target.value)}/></label><FilterChips label="Industria" options={industries} value={ind} onChange={setInd} /></div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard label="Empresas" value={comps.length} /><MetricCard label="Contactos" value={contacts.length} /><MetricCard label="Fuentes" value={sources.length} /><MetricCard label="Señales" value={signals.length} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartPanel title="Señales por tipo" subtitle="Número de señales">{byKind.length ? <ComparisonBars data={byKind} /> : <p className="text-sm text-muted-foreground">Sin señales.</p>}</ChartPanel>
        <ChartPanel title="Fuentes por tipo" subtitle="Número de fuentes">{byType.length ? <ComparisonBars data={byType} /> : <p className="text-sm text-muted-foreground">Sin fuentes.</p>}</ChartPanel>
      </div>
      <ChartPanel title="Exportar" subtitle="Descarga CSV (UTF-8) con el filtro actual">
        <div className="flex flex-wrap gap-2">{DATASETS.map((d) => <Button key={d} variant="outline" onClick={() => exportSet(d)}><Download /> {d}.csv</Button>)}</div>
      </ChartPanel>
    </div>
  );
}
