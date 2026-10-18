import { Search, Inbox, AlertTriangle, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { DemoBadge } from "./DemoBadge";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="label-mono mb-2 text-signal">{eyebrow}</p>}
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-2"><DemoBadge />{actions}</div>
    </header>
  );
}

export function SearchBar({ value, onChange, placeholder = "Buscar…", className, label = "Buscar" }: { value: string; onChange: (v: string) => void; placeholder?: string; className?: string; label?: string }) {
  return (
    <label className={cn("relative flex items-center", className)}>
      <span className="sr-only">{label}</span>
      <Search className="pointer-events-none absolute left-3 h-4 w-4 text-muted-foreground" aria-hidden />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="h-9 w-full rounded-lg border bg-surface-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:border-signal/60 focus:outline-none" />
    </label>
  );
}

export function FilterChips<T extends string>({ options, value, onChange, label }: { options: readonly T[]; value: T | "todos"; onChange: (v: T | "todos") => void; label: string }) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-1.5">
      {(["todos", ...options] as (T | "todos")[]).map((o) => (
        <Button variant="outline" size="sm" key={o} type="button" aria-pressed={value === o} onClick={() => onChange(o)}
          className={cn("h-auto min-h-7 max-w-full whitespace-normal break-words rounded-md border px-2.5 py-1 text-xs capitalize transition-colors", value === o ? "border-signal/60 bg-signal-soft text-signal" : "text-muted-foreground hover:text-foreground")}>
          {o}
        </Button>
      ))}
    </div>
  );
}

export function EmptyState({ title = "Sin resultados", description = "Ajusta la búsqueda o los filtros.", icon }: { title?: string; description?: string; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
      <div className="rounded-full border p-3 text-muted-foreground">{icon ?? <Inbox className="h-5 w-5" />}</div>
      <p className="font-medium">{title}</p>
      <p className="max-w-xs text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
export function LoadingState({ label = "Cargando…" }: { label?: string }) {
  return <div role="status" className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />{label}</div>;
}
export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-2 py-12 text-center text-sm">
      <AlertTriangle className="h-5 w-5 text-destructive" /><p>{message}</p>
      {onRetry && <Button variant="ghost" onClick={onRetry}>Reintentar</Button>}
    </div>
  );
}

export function ChartPanel({ title, subtitle, actions, children, className }: { title: string; subtitle?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={cn("panel min-w-0 flex flex-col p-5", className)} aria-label={title}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div><h2 className="font-semibold">{title}</h2>{subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}</div>
        {actions}
      </div>
      <div className="min-h-0 min-w-0 flex-1">{children}</div>
    </section>
  );
}

export function MetricCard({ label, value, unit, delta, spark, progress }: { label: string; value: string | number; unit?: string; delta?: string; spark?: number[]; progress?: number }) {
  return (
    <div className="panel min-w-0 flex flex-wrap items-center justify-between gap-3 p-4">
      <div className="min-w-0">
        <p className="label-mono break-words">{label}</p>
        <p className="mt-1 text-2xl font-semibold tabular-nums">{value}{unit && <span className="ml-1 text-sm font-normal text-muted-foreground">{unit}</span>}</p>
        {delta && <p className="mt-0.5 font-mono text-[0.7rem] text-signal">{delta}</p>}
      </div>
      {spark && <Sparkline data={spark} />}
      {progress !== undefined && <Ring value={progress} />}
    </div>
  );
}

export function Sparkline({ data, w = 84, h = 32 }: { data: number[]; w?: number; h?: number }) {
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((d, i) => `${(i / Math.max(data.length - 1, 1)) * w},${h - ((d - min) / (max - min || 1)) * (h - 4) - 2}`).join(" ");
  return <svg width={w} height={h} aria-hidden className="shrink-0"><polyline points={pts} fill="none" stroke="var(--signal)" strokeWidth="1.6" strokeLinejoin="round" /></svg>;
}
export function Ring({ value, size = 44 }: { value: number; size?: number }) {
  const r = size / 2 - 4, c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} role="img" aria-label={`${Math.round(value)}%`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth="4" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--signal)" strokeWidth="4" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="var(--foreground)" fontFamily="var(--font-mono)">{Math.round(value)}%</text>
    </svg>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <div className="min-w-0 break-words"><dt className="label-mono">{label}</dt><dd className="mt-0.5 text-sm">{children}</dd></div>;
}
