import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Bell, Building2, Database, FileBarChart, Home, LineChart, Menu, PanelLeftClose, PanelLeftOpen, Search, Users, Gauge, Sparkles } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Logo } from "@/components/brand/Logo";
import { globalSearch, isDemo, useDataRevision } from "@/lib/data-service";
import { useVisualMode } from "@/lib/visual-mode";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useProspecting } from "@/lib/prospecting-context";
import { supabase } from "@/lib/backend/client";
import { Button } from "@/components/ui/button";

const NAV = [
  { to: "/", label: "Inicio", icon: Home },
  { to: "/fuentes", label: "Fuentes", icon: Database },
  { to: "/empresas", label: "Empresas", icon: Building2 },
  { to: "/contactos", label: "Contactos", icon: Users },
  { to: "/resultados", label: "Resultados", icon: LineChart },
  { to: "/reportes", label: "Reportes", icon: FileBarChart },
] as const;

function NavList({ collapsed, onNavigate }: { collapsed?: boolean; onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav aria-label="Principal" className="flex flex-col gap-1">
      {NAV.map((n) => {
        const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
        return (
          <Link key={n.to} to={n.to} onClick={onNavigate} title={collapsed ? n.label : undefined} aria-current={active ? "page" : undefined}
            className={cn("group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors", active ? "bg-sidebar-accent text-foreground" : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground", collapsed && "justify-center px-0")}>
            {active && <span aria-hidden className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded bg-signal shadow-[0_0_10px_var(--signal)]" />}
            <n.icon className={cn("h-4 w-4 shrink-0", active && "text-signal")} />
            {!collapsed && n.label}
          </Link>
        );
      })}
    </nav>
  );
}

function ModeToggle({ collapsed }: { collapsed?: boolean }) {
  const { mode, setMode } = useVisualMode();
  const perf = mode === "rendimiento";
  return (
    <button type="button" onClick={() => setMode(perf ? "visual" : "rendimiento")} aria-pressed={perf}
      className={cn("flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-xs text-muted-foreground hover:text-foreground", collapsed && "justify-center px-0")}
      title={perf ? "Modo rendimiento activo" : "Modo visual activo"}>
      {perf ? <Gauge className="h-4 w-4" /> : <Sparkles className="h-4 w-4 text-signal" />}
      {!collapsed && (perf ? "Modo rendimiento" : "Modo visual")}
    </button>
  );
}

function GlobalSearch() {
  useDataRevision();
  const [q, setQ] = useState(""); const [open, setOpen] = useState(false);
  const nav = useNavigate(); const ref = useRef<HTMLInputElement>(null);
  const hits = globalSearch(q);
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); ref.current?.focus(); } };
    window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k);
  }, []);
  return (
    <Popover open={open && q.length > 0} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="relative min-w-0 flex-1 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input ref={ref} value={q} onChange={(e) => { setQ(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
            aria-label="Búsqueda global" placeholder="Buscar fuentes, empresas, personas, industrias…"
            className="h-9 w-full rounded-lg border bg-surface pl-9 pr-12 text-sm placeholder:text-muted-foreground focus:border-signal/60 focus:outline-none" />
          <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border px-1.5 font-mono text-[0.65rem] text-muted-foreground sm:block">⌘K</kbd>
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] p-1" onOpenAutoFocus={(e) => e.preventDefault()}>
        {hits.length === 0 ? <p className="p-3 text-sm text-muted-foreground">Sin coincidencias en el conjunto seleccionado.</p> : (
          <ul role="listbox" aria-label="Resultados">
            {hits.map((h, i) => (
              <li key={i}>
                <button type="button" className="flex w-full items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm hover:bg-accent focus:bg-accent focus:outline-none"
                  onClick={() => { setOpen(false); setQ(""); nav({ to: h.to, search: h.id ? { id: h.id } : {} } as never); }}>
                  <span className="min-w-0"><span className="block truncate">{h.label}</span><span className="block truncate text-xs text-muted-foreground">{h.sub}</span></span>
                  <span className="label-mono shrink-0">{h.kind}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const session = useProspecting();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  return (
    <div className="flex min-h-screen w-full">
      <aside className={cn("sticky top-0 hidden h-screen shrink-0 flex-col gap-6 border-r bg-sidebar p-3 transition-[width] lg:flex", collapsed ? "w-16" : "w-60")}>
        <div className={cn("flex items-center px-2 pt-1", collapsed ? "justify-center" : "justify-between")}>
          <Link to="/" aria-label="capta IA, inicio"><Logo compact={collapsed} /></Link>
        </div>
        <NavList collapsed={collapsed} />
        <div className="mt-auto flex flex-col gap-2">
          <ModeToggle collapsed={collapsed} />
          <button onClick={() => setCollapsed((c) => !c)} aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
            className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs text-muted-foreground hover:text-foreground">
            {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <><PanelLeftClose className="h-4 w-4" /> Colapsar</>}
          </button>
        </div>
      </aside>
      <Sheet open={mobile} onOpenChange={setMobile}>
        <SheetContent side="left" className="w-64 bg-sidebar p-4">
          <SheetTitle className="mb-6"><Logo /></SheetTitle>
          <NavList onNavigate={() => setMobile(false)} />
          <div className="mt-6"><ModeToggle /></div>
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6">
          <Button size="icon" variant="ghost" className="shrink-0 lg:hidden" onClick={() => setMobile(true)} aria-label="Abrir menú"><Menu className="h-5 w-5" /></Button>
          <Link to="/" className="lg:hidden" aria-label="capta IA"><Logo compact /></Link>
          <GlobalSearch />
          <div className="ml-auto flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger className="relative rounded-lg p-2 text-muted-foreground hover:text-foreground" aria-label={isDemo()?"Notificaciones demo (3)":"Notificaciones"}>
                <Bell className="h-4 w-4" />{isDemo()&&<span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-signal" />}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuLabel className="flex items-center justify-between">Notificaciones {isDemo()&&<span className="label-mono">demo</span>}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isDemo()?<><DropdownMenuItem asChild><Link to="/fuentes">Scout detectó 2 fuentes nuevas</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/agentes/$agent" params={{ agent: "check" }}>Check marcó 1 regla con fallo</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/agentes/$agent" params={{ agent: "sorter" }}>Sorter agrupó 6 empresas</Link></DropdownMenuItem></>:<DropdownMenuItem>Sin notificaciones nuevas</DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger className="flex h-8 w-8 items-center justify-center rounded-full border bg-surface-2 text-xs font-semibold" aria-label="Menú de usuario">{session.user?session.user.slice(0,2).toUpperCase():"—"}</DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{session.user?"Mi cuenta":"Sin sesión"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/reportes">Mis reportes</Link></DropdownMenuItem>
                <DropdownMenuItem disabled>{session.user?"Workspace privado":"Inicia sesión para guardar"}</DropdownMenuItem>
                {session.user&&<DropdownMenuItem onSelect={()=>void supabase.auth.signOut()}>Cerrar sesión</DropdownMenuItem>}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
