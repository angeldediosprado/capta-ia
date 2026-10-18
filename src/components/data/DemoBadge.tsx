import { isDemo, useDataRevision } from "@/lib/data-service";
import { cn } from "@/lib/utils";

export function DemoBadge({ label = "Datos de demostración", className }: { label?: string; className?: string }) {
  useDataRevision();
  if (!isDemo() && ["Datos de demostración", "demo", "muestra"].includes(label)) label = "Datos públicos · workspace real";
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-signal/30 bg-signal-soft px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider text-signal", className)}>
      <span className="anim-pulse h-1.5 w-1.5 rounded-full bg-signal" aria-hidden />
      {label}
    </span>
  );
}

export function StatusPill({ status }: { status: string }) {
  const tone = status.includes("revisado") || status === "pasa" ? "text-ok border-ok/30" : status.includes("revisión") || status === "atención" ? "text-warn border-warn/30" : status === "falla" ? "text-destructive border-destructive/40" : status === "nuevo" ? "text-signal border-signal/30" : "text-cream/80 border-border";
  return <span className={cn("inline-flex whitespace-nowrap rounded-md border px-2 py-0.5 font-mono text-[0.68rem]", tone)}>{status}</span>;
}
