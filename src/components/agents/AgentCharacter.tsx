import { cn } from "@/lib/utils";
import { AGENTS } from "./agents";
import type { AgentId } from "@/lib/demo-data";

/** Individual rendered agent with its own light/motion layer. */
export function AgentCharacter({ id, className, size = "md", eager }: { id: AgentId; className?: string; size?: "sm" | "md" | "lg"; eager?: boolean }) {
  const a = AGENTS[id];
  const h = size === "sm" ? "h-16 w-14" : size === "lg" ? "h-[26rem] w-full" : "h-64 w-full";
  return (
    <div className={cn("relative min-w-0 shrink-0 overflow-hidden rounded-lg bg-background", h, className)}>
      <img
        src={a.image} alt={`${a.name}, agente que ${a.verb.toLowerCase()}`} width={768} height={960}
        loading={eager ? "eager" : "lazy"}
        className={cn("h-full w-full object-cover", size !== "sm" && "anim-float", a.motion === "lean" && "[animation-duration:4.5s]", a.motion === "focus" && "[animation-duration:7.5s]")}
        style={{ objectPosition: "50% 30%" }}
      />
      {size !== "sm" && (
        <>
          <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
          <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-[radial-gradient(60%_80%_at_50%_100%,var(--signal-soft),transparent)]" />
          <div aria-hidden className="scanline pointer-events-none absolute inset-0 opacity-40" />
        </>
      )}
    </div>
  );
}
