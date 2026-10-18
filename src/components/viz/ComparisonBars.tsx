import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function ComparisonBars({ data, unit = "", max: maxProp }: { data: { label: string; value: number; note?: string }[]; unit?: string; max?: number }) {
  const max = Math.max(maxProp ?? Math.max(...data.map((d) => d.value), 1), 1);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => Math.round(t * max));
  return (
    <div role="list" aria-label="Comparativa" className="min-w-0 space-y-3">
      {data.map((d) => (
        <div role="listitem" key={d.label} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm">
          <span className="min-w-0 break-words text-xs text-muted-foreground" title={d.label}>{d.label}</span>
          <span className="shrink-0 text-right font-mono tabular-nums">{d.value}{unit}</span>
          <Tooltip>
            <TooltipTrigger asChild>
              <div tabIndex={0} className="relative col-span-2 h-3 overflow-hidden rounded-sm bg-surface-2 outline-none" aria-label={`${d.label}: ${d.value}${unit}`}>
                {ticks.slice(1, -1).map((t, i) => <span key={i} className="absolute top-0 h-full w-px bg-border" style={{ left: `${(t / max) * 100}%` }} />)}
                <div className="h-full rounded-sm bg-gradient-to-r from-signal/60 to-signal" style={{ width: `${Math.max(0,Math.min(100,(d.value / max) * 100))}%` }} />
              </div>
            </TooltipTrigger>
            <TooltipContent>{d.label}: {d.value}{unit}{d.note ? ` · ${d.note}` : ""}</TooltipContent>
          </Tooltip>

        </div>
      ))}
      <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3">
        <div className="col-span-2 flex justify-between font-mono text-[0.65rem] text-muted-foreground">{ticks.map((t, i) => <span key={i}>{t}{unit}</span>)}</div>
      </div>
    </div>
  );
}
