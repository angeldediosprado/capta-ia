import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { EmptyState } from "./primitives";

export interface Column<T> { key: string; header: string; cell: (row: T) => ReactNode; className?: string }

export function DataTable<T extends { id: string }>({ rows, columns, onSelect, selectedId, caption }: { rows: T[]; columns: Column<T>[]; onSelect?: (row: T) => void; selectedId?: string | undefined; caption: string }) {
  if (!rows.length) return <EmptyState />;
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[640px] text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b">{columns.map((c) => <th key={c.key} scope="col" className={cn("label-mono px-3 py-2.5 font-normal", c.className)}>{c.header}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} tabIndex={onSelect ? 0 : undefined}
              onClick={() => onSelect?.(r)} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect?.(r); } }}
              aria-selected={selectedId === r.id}
              className={cn("border-b border-border/60 transition-colors", onSelect && "cursor-pointer hover:bg-accent/50 focus-visible:bg-accent/50", selectedId === r.id && "bg-signal-soft")}>
              {columns.map((c) => <td key={c.key} className={cn("px-3 py-3 align-middle", c.className)}>{c.cell(r)}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
