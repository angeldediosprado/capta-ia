import { LeadActions } from '@/components/prospecting/LeadActions';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useProspecting } from '@/lib/prospecting-context';
import { prepareDrafts } from '@/lib/data-service';
import { getLeads, getProspectingData, isDemo } from '@/lib/data-service';
import { useDataRevision } from "@/lib/data-service";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { DataTable } from "@/components/data/DataTable";
import { FilterChips, PageHeader, SearchBar } from "@/components/data/primitives";
import { companyName, getCompanies, getContacts, getSource, matches } from "@/lib/data-service";

export const Route = createFileRoute("/contactos")({
  validateSearch: z.object({ id: z.string().optional() }),
  head: () => ({ meta: [
    { title: "Contactos — capta IA" }, { name: "description", content: "Contactos con empresa, cargo, fuente de origen y trazabilidad." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Contactos — capta IA" }, { property: "og:description", content: "Personas vinculadas a empresas y fuentes." },
  ] }),
  component: Contactos,
});

function Contactos() {
  useDataRevision();
  const s=useProspecting();
  const [template,setTemplate]=useState(''),[prepared,setPrepared]=useState<string>('');
  const { id } = Route.useSearch(); const nav = Route.useNavigate();
  const [q, setQ] = useState(""); const [co, setCo] = useState<string>("todos");
  const names = getCompanies().map((c) => c.name);
  const rows = getContacts().filter((p) => matches(q, p.name, p.role, companyName(p.companyId)) && (co === "todos" || companyName(p.companyId) === co));
  const sel = getContacts().find((p) => p.id === id);
  const lead = sel ? getLeads().find(l=>l.id===sel.companyId) : undefined;
  return (
    <div className="mx-auto max-w-[1400px]">
      <PageHeader eyebrow="Sorter · Organiza" title="Contactos" description="Cada contacto conserva la fuente de la que procede." />
      {!isDemo()&&<details className="mb-5 border-b pb-4"><summary className="cursor-pointer font-medium">Preparar borradores en lote · sin enviar</summary><div className="mt-3 space-y-3"><label className="block text-xs">Mi mensaje · personalización con {"{empresa}"}<Textarea aria-label="Mensaje para borradores en lote" maxLength={10000} value={template} onChange={e=>setTemplate(e.target.value)}/></label><p className="text-xs text-muted-foreground">Solo coincidencias ICP con identidad sin ambigüedad y canal público. No reemplaza borradores ni vuelve a contactar empresas con intentos registrados. Aplica al inventario completo, no al filtro de esta tabla.</p><Button disabled={!s.user||s.busy||!template.trim()} onClick={async()=>{try{const next=prepareDrafts(s.workspace,template);const count=next.drafts.length-s.workspace.drafts.length;if(count)await s.save(next);setPrepared(count?`${count} borradores guardados · ninguno enviado`:'Sin nuevas empresas elegibles con canal público; no se inventaron contactos.');}catch{setPrepared('No se guardaron los borradores; revisa el aviso de conexión.');}}}>Preparar y guardar borradores</Button>{prepared&&<p role="status" className="text-xs text-signal">{prepared}</p>}</div></details>}
      <div className="panel p-4">
        <div className="mb-4 flex flex-col gap-3"><SearchBar value={q} onChange={setQ} placeholder="Buscar nombre, cargo o empresa" className="max-w-md" /><FilterChips label="Empresa" options={names} value={co} onChange={setCo} /></div>
        <DataTable caption="Contactos" rows={rows} selectedId={id} onSelect={(r) => nav({ search: { id: r.id === id ? undefined : r.id } })} columns={[
          { key: "n", header: "Nombre", cell: (r) => <div><p className="font-medium">{r.name}</p><p className="font-mono text-xs text-muted-foreground">{r.email}</p></div> },
          { key: 'r', header: isDemo()?'Cargo':'Canal / estado', cell: (r) => {if(isDemo())return r.role;const w=getProspectingData().workspace;const l=getLeads().find(l=>l.id===r.companyId);return <div className="text-xs"><p>{l?.phone?'Teléfono sugerido':l?.email?'Email sugerido':'Web pública'}</p><p>{w.responses.some(a=>a.leadId===r.companyId)?'Respuesta observada':w.attempts.some(a=>a.leadId===r.companyId)?'Intento manual registrado':w.drafts.some(a=>a.leadId===r.companyId)?'Borrador · no enviado':'Sin actividad'}</p></div>;} },
          { key: "c", header: "Empresa", cell: (r) => <Link to="/empresas" search={{ id: r.companyId }} onClick={(e) => e.stopPropagation()} className="hover:text-signal">{companyName(r.companyId)}</Link> },
          { key: "s", header: "Fuente de origen", cell: (r) => <Link to="/fuentes" search={{ id: r.sourceId }} onClick={(e) => e.stopPropagation()} className="text-muted-foreground hover:text-signal">{getSource(r.sourceId)?.title}</Link> },
          { key: "d", header: "Añadido", cell: (r) => <span className="font-mono text-xs">{r.addedAt}</span>, className: "hidden md:table-cell" },
        ]} />
        {!isDemo()&&lead&&<div className="mt-5 border-t pt-4"><LeadActions key={lead.id} lead={lead}/></div>}
        {isDemo() && sel && (
          <div className="holo mt-4 p-4 text-sm" aria-live="polite">
            <p className="label-mono mb-2 text-signal">Trazabilidad · {sel.name}</p>
            <ol className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <li className="rounded border px-2 py-1">{getSource(sel.sourceId)?.origin}</li><li aria-hidden>→</li>
              <li className="rounded border px-2 py-1">Scout detecta · {getSource(sel.sourceId)?.date}</li><li aria-hidden>→</li>
              <li className="rounded border px-2 py-1">Sorter vincula a {companyName(sel.companyId)}</li><li aria-hidden>→</li>
              <li className="rounded border border-signal/40 px-2 py-1 text-signal">Contacto añadido · {sel.addedAt}</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
