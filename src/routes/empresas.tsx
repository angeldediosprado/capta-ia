import { ICPControls } from "@/components/prospecting/ICPControls";
import { LeadActions } from "@/components/prospecting/LeadActions";
import { isDemo, getLeads, useDataRevision } from "@/lib/data-service";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { z } from "zod";
import { FilterChips, PageHeader, SearchBar, EmptyState, Field } from "@/components/data/primitives";
import { StatusPill } from "@/components/data/DemoBadge";
import { contactsForCompany, getCompanies, getSource, matches, signalsForCompany } from "@/lib/data-service";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/empresas")({
  validateSearch: z.object({ id: z.string().optional() }),
  head: () => ({ meta: [
    { title: "Empresas — capta IA" }, { name: "description", content: "Empresas con señales, fuentes vinculadas, contactos y cronología." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Empresas — capta IA" }, { property: "og:description", content: "Listado y detalle de empresas organizadas por Sorter." },
  ] }),
  component: Empresas,
});

function Empresas() {
  useDataRevision();
  const { id } = Route.useSearch(); const nav = Route.useNavigate();
  const all = getCompanies();
  const industries = useMemo(() => [...new Set(all.map((c) => c.industry))], [all]);
  const [q, setQ] = useState(""); const [ind, setInd] = useState<string>("todos");
  const rows = all.filter((c) => matches(q, c.name, c.city, c.industry) && (ind === "todos" || c.industry === ind));
  const sel = all.find((c) => c.id === (id ?? rows[0]?.id));
  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader eyebrow="Sorter · Organiza" title="Empresas" description="Cuentas con señales comerciales agrupadas a partir de las fuentes." />
      {!isDemo() && <ICPControls />}
      <div className="grid gap-4 xl:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]">
        <div className="panel min-w-0 self-start p-4">
          <SearchBar value={q} onChange={setQ} placeholder="Buscar empresa o ciudad" />
          <div className="my-3"><FilterChips label="Industria" options={industries} value={ind} onChange={setInd} /></div>
          {rows.length === 0 ? <EmptyState /> : (
            <ul className="max-h-[28rem] overflow-y-auto space-y-1.5">
              {rows.map((c) => (
                <li key={c.id}>
                  <Button variant="ghost" onClick={() => nav({ search: { id: c.id } })} aria-current={sel?.id === c.id}
                    className={cn("flex h-auto min-h-16 w-full items-center justify-between gap-3 whitespace-normal rounded-lg border px-3 py-2.5 text-left transition-colors", sel?.id === c.id ? "border-signal/50 bg-signal-soft" : "border-transparent hover:bg-accent/50")}>
                    <span className="min-w-0 break-words"><span className="block font-medium">{c.name}</span><span className="text-xs text-muted-foreground">{c.industry} · {c.city}</span></span>
                    <span className="shrink-0 font-mono text-sm tabular-nums text-signal" title={isDemo() ? "Score demo" : "Coincidencia ICP"}>{c.score}</span>
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
        {sel ? (
          <article className="panel min-w-0 break-words space-y-6 p-4 sm:p-6" aria-label={`Detalle de ${sel.name}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0"><p className="label-mono text-signal">{sel.industry}</p><h2 className="text-2xl font-semibold">{sel.name}</h2></div>
              <div className="text-right"><p className="label-mono">{isDemo() ? "Score (demo)" : "Coincidencia ICP"}</p><p className="text-3xl font-semibold tabular-nums">{sel.score}<span className="text-sm text-muted-foreground">/100</span></p></div>
            </div>
            <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4"><Field label="Ciudad">{sel.city}</Field><Field label="Tamaño">{sel.size} empleados</Field><Field label="Fuentes">{sel.sourceIds.length}</Field><Field label="Contactos">{contactsForCompany(sel.id).length}</Field></dl>
            {!isDemo() && getLeads().find(l => l.id === sel.id) && <LeadActions key={sel.id} lead={getLeads().find(l => l.id === sel.id) as NonNullable<ReturnType<typeof getLeads>[number]>} />}
            <section><h3 className="label-mono mb-2">Señales</h3><ul className="flex flex-wrap gap-2">{sel.signals.map((s) => <li key={s} className="holo px-3 py-1.5 text-sm">{s}</li>)}</ul></section>
            <div className="grid gap-6 md:grid-cols-2">
              <section><h3 className="label-mono mb-2">Fuentes vinculadas</h3><ul className="space-y-2">{sel.sourceIds.map((sid) => { const s = getSource(sid); if (!s) return null; return (
                <li key={sid} className="flex items-center justify-between gap-2 text-sm"><Link to="/fuentes" search={{ id: sid }} className="truncate hover:text-signal">{s.title}</Link><StatusPill status={s.status} /></li>); })}</ul></section>
              <section><h3 className="label-mono mb-2">Contactos</h3><ul className="space-y-2">{contactsForCompany(sel.id).map((p) => (
                <li key={p.id} className="text-sm"><Link to="/contactos" search={{ id: p.id }} className="font-medium hover:text-signal">{p.name}</Link> <span className="text-muted-foreground">· {p.role}</span></li>))}</ul></section>
            </div>
            <section><h3 className="label-mono mb-3">Cronología</h3>
              <ol className="space-y-3 border-l pl-5">{signalsForCompany(sel.id).map((g) => (
                <li key={g.id} className="relative text-sm"><span className="absolute -left-[1.6rem] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-signal bg-background" /><span className="font-mono text-xs text-muted-foreground">{g.date} · {g.kind}</span><p>{g.label}</p></li>))}</ol>
            </section>
          </article>
        ) : <div className="panel"><EmptyState title="Selecciona una empresa" /></div>}
      </div>
    </div>
  );
}
