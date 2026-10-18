import { SourceControls } from "@/components/prospecting/SourceControls";
import { RunDetail } from '@/components/prospecting/PipelineAudit';
import { getPipelineRuns } from '@/lib/data-service';
import { Button } from "@/components/ui/button";
import { isDemo, useDataRevision } from "@/lib/data-service";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import { z } from "zod";
import { DataTable } from "@/components/data/DataTable";
import { StatusPill } from "@/components/data/DemoBadge";
import { FilterChips, PageHeader, SearchBar, Field } from "@/components/data/primitives";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { companiesForSource, getSources, matches, type Source } from "@/lib/data-service";
import type { SourceStatus, SourceType } from "@/lib/demo-data";
import { toast } from "sonner";

export const Route = createFileRoute("/fuentes")({
  validateSearch: z.object({ id: z.string().optional() }),
  head: () => ({ meta: [
    { title: "Fuentes — capta IA" }, { name: "description", content: "Fuentes detectadas por Scout: tipo, origen, estado y procedencia." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Fuentes — capta IA" }, { property: "og:description", content: "Explora las fuentes de inteligencia comercial." },
  ] }),
  component: Fuentes,
});

const TYPES = ["Web", "Registro", "Noticia", "Red social", "Documento"] as const satisfies readonly SourceType[];
const STATUSES = ["nuevo", "organizado", "en revisión", "revisado (demo)"] as const satisfies readonly SourceStatus[];

export function SourceDetail({ s, onClose }: { s: Source | null; onClose: () => void }) {
  return (
    <Sheet open={!!s} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        {s && (<>
          <SheetHeader><p className="label-mono text-signal">{s.type}</p><SheetTitle>{s.title}</SheetTitle><SheetDescription>{s.origin}</SheetDescription></SheetHeader>
          <dl className="mt-6 grid grid-cols-2 gap-4 px-4">
            <Field label="Estado"><StatusPill status={s.status} /></Field>
            <Field label="Fecha">{s.date}</Field>
            <Field label="Industria">{s.industry}</Field>
            <Field label={isDemo()?"Confianza (demo)":"Confianza no evaluada"}>{isDemo()?`${Math.round(s.confidence * 100)}%`:"N/D"}</Field>
          </dl>
          <div className="mt-6 px-4">
            <p className="label-mono mb-2">Entidades vinculadas</p>
            <ul className="space-y-1">{companiesForSource(s.id).map((c) => <li key={c.id}><Link to="/empresas" search={{ id: c.id }} className="text-sm text-signal hover:underline">{c.name}</Link></li>)}</ul>
          </div>
          <div className="mt-6 px-4">
            <p className="label-mono mb-2">Procedencia</p>
            {!isDemo()?(()=>{const run=getPipelineRuns().find(r=>r.id===s.id);return run?<RunDetail run={run}/>:<p className="text-xs">Sin auditoría registrada.</p>;})():<ol className="space-y-2 border-l pl-4 text-sm">
              <li>Detectada por <b>Scout</b> · {s.date}</li>
              {s.status !== "nuevo" && <li>Organizada por <b>Sorter</b></li>}
              {s.status.includes("revisado") && <li>Revisada por <b>Check</b> (estado demo)</li>}
            </ol>}
          </div>
          <Button variant="outline" onClick={() => { if (!isDemo()) { window.open(s.url, "_blank", "noopener,noreferrer"); return; } toast("Fuente de demostración", { description: `“${s.origin}” es un dominio ficticio; no hay enlace externo.` }); }}
            className="mx-4 mt-6 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm hover:border-signal/60">
            <ExternalLink className="h-4 w-4" /> Abrir fuente original
          </Button>
        </>)}
      </SheetContent>
    </Sheet>
  );
}

function Fuentes() {
  const version = useDataRevision();
  const { id } = Route.useSearch(); const nav = Route.useNavigate();
  const [q, setQ] = useState(""); const [type, setType] = useState<SourceType | "todos">("todos"); const [status, setStatus] = useState<SourceStatus | "todos">("todos");
  const rows = useMemo(() => getSources().filter((s) => matches(q, s.title, s.origin, s.industry) && (type === "todos" || s.type === type) && (status === "todos" || s.status === status)).sort((a, b) => b.date.localeCompare(a.date)), [q, type, status, version]);
  const selected = getSources().find((s) => s.id === id) ?? null;
  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader eyebrow="Scout · Descubre" title="Fuentes" description="Descubrimiento guiado: perfil provisional, fuentes públicas, consulta e importación con trazabilidad." />
      <SourceControls />
      <div className="panel p-4">
        <div className="mb-4 flex flex-col gap-3">
          <SearchBar value={q} onChange={setQ} placeholder="Buscar por título, origen o industria" className="max-w-md" />
          <div className="flex flex-wrap gap-x-6 gap-y-2"><FilterChips label="Tipo" options={TYPES} value={type} onChange={setType} /><FilterChips label="Estado" options={STATUSES} value={status} onChange={setStatus} /></div>
        </div>
        <DataTable caption="Fuentes" rows={rows} selectedId={id} onSelect={(r) => nav({ search: { id: r.id } })} columns={[
          { key: "t", header: "Fuente", cell: (r) => <div><p className="font-medium">{r.title}</p><p className="font-mono text-xs text-muted-foreground">{r.origin}</p></div> },
          { key: "ty", header: "Tipo", cell: (r) => r.type },
          { key: "i", header: "Industria", cell: (r) => r.industry, className: "hidden lg:table-cell" },
          { key: "s", header: "Estado", cell: (r) => <StatusPill status={r.status} /> },
          { key: "d", header: "Fecha", cell: (r) => <span className="font-mono text-xs">{r.date}</span> },
        ]} />
      </div>
      <SourceDetail s={selected} onClose={() => nav({ search: {} })} />
    </div>
  );
}
