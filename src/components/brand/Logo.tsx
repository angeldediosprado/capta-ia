import { cn } from "@/lib/utils";

/** capta IA mark: faceted capture aperture — three cream segments closing around an orange signal facet. */
export function LogoMark({ className, title = "capta IA" }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-8 w-8", className)} role="img" aria-label={title}>
      <path d="M16 2 L27.5 8.6 L22.6 11.4 L16 7.6 Z" fill="var(--cream)" />
      <path d="M4.5 8.6 L16 2 L16 7.6 L9.4 11.4 Z" fill="var(--cream)" opacity="0.82" />
      <path d="M4.5 8.6 L9.4 11.4 L9.4 20.6 L4.5 23.4 Z" fill="var(--cream)" opacity="0.64" />
      <path d="M4.5 23.4 L9.4 20.6 L16 24.4 L16 30 Z" fill="var(--cream)" opacity="0.82" />
      <path d="M16 30 L16 24.4 L22.6 20.6 L27.5 23.4 Z" fill="var(--cream)" />
      <path d="M16 12.2 L20.6 14.8 L20.6 17.2 L16 19.8 L13.2 18.2 L13.2 13.8 Z" fill="var(--signal)" />
    </svg>
  );
}

export function Logo({ className, compact }: { className?: string; compact?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark className="h-7 w-7 shrink-0" />
      {!compact && (
        <span className="text-[1.05rem] font-semibold tracking-tight text-cream">
          capta <span className="text-signal">IA</span>
        </span>
      )}
    </span>
  );
}
