import { Link } from "@tanstack/react-router";
import { ArrowRight, Database } from "lucide-react";
import { useEffect, useRef } from "react";
import heroImg from "@/assets/hero-scene.jpg";
import { useVisualMode } from "@/lib/visual-mode";
import { Button } from "@/components/ui/button";
import { flowCounts } from "@/components/viz/FlowStatus";

function ParticleField() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { reduced } = useVisualMode();
  useEffect(() => {
    const c = ref.current; if (!c || reduced) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    let raf = 0; const dpr = Math.min(window.devicePixelRatio, 1.5);
    const resize = () => { c.width = c.offsetWidth * dpr; c.height = c.offsetHeight * dpr; };
    resize(); window.addEventListener("resize", resize);
    const pts = Array.from({ length: 46 }, () => ({ x: Math.random(), y: Math.random(), r: Math.random() * 1.4 + 0.3, v: Math.random() * 0.00025 + 0.00008, o: Math.random() }));
    const tick = () => {
      ctx.clearRect(0, 0, c.width, c.height);
      for (const p of pts) {
        p.y -= p.v; p.x += Math.sin(p.y * 20) * 0.0002; if (p.y < 0) { p.y = 1; p.x = Math.random(); }
        ctx.beginPath(); ctx.arc(p.x * c.width, p.y * c.height, p.r * dpr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,110,50,${0.25 + 0.45 * Math.abs(Math.sin(p.o + p.y * 6))})`; ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [reduced]);
  return <canvas ref={ref} aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" />;
}

export function CinematicHero() {
  const c = flowCounts();
  return (
    <section className="relative isolate overflow-hidden rounded-2xl border bg-background" aria-labelledby="hero-title">
      <img src={heroImg} alt="Scout, Sorter y Check trabajando juntos en un paisaje rocoso al atardecer" width={1920} height={912}
        className="absolute inset-0 -z-10 h-full w-full object-cover object-[70%_50%]" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-background via-background/75 to-transparent" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-background via-transparent to-background/30" />
      <ParticleField />
      <div className="relative grid min-h-[30rem] items-end gap-8 p-6 md:p-10 lg:min-h-[34rem] lg:grid-cols-[1.1fr_1fr]">
        <div className="max-w-xl self-center">
          <p className="label-mono mb-4 text-signal">capta IA · Agentes en equipo</p>
          <h1 id="hero-title" className="text-4xl font-semibold leading-[1.05] tracking-tight md:text-6xl">Inteligencia<br />en equipo.</h1>
          <p className="mt-5 text-base leading-relaxed text-foreground/80 md:text-lg">
            Scout, Sorter y Check trabajan juntos para capturar, organizar y verificar la información que importa. Más precisión, menos ruido, mejores decisiones.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild size="lg"><a href="#agentes">Explorar agentes <ArrowRight /></a></Button>
            <Button asChild size="lg" variant="outline" className="bg-background/40 backdrop-blur"><Link to="/fuentes"><Database /> Ver fuentes</Link></Button>
          </div>
        </div>
        <div className="hidden justify-end gap-3 self-end lg:flex" aria-label="Resumen del flujo (datos de demostración)">
          {[["Scout", "detectadas", c.scout], ["Sorter", "organizadas", c.sorter], ["Check", "revisadas", c.check]].map(([n, l, v]) => (
            <div key={n} className="holo anim-float w-32 p-3 [transform:perspective(600px)_rotateY(-8deg)]">
              <p className="label-mono text-signal">{n}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{v}</p>
              <p className="text-xs text-muted-foreground">fuentes {l}</p>
              <p className="mt-2 font-mono text-[0.6rem] text-muted-foreground">DEMO</p>
            </div>
          ))}
        </div>
      </div>
      <div aria-hidden className="anim-beam pointer-events-none absolute right-[19.5%] top-0 h-1/3 w-px bg-gradient-to-b from-signal to-transparent blur-[1px]" />
    </section>
  );
}
