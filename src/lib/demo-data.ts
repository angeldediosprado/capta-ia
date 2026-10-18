// Synthetic demo dataset. Not real companies, people, or activity.
export type SourceType = "Web" | "Registro" | "Noticia" | "Red social" | "Documento";
export type SourceStatus = "nuevo" | "organizado" | "en revisión" | "revisado (demo)";
export type AgentId = "scout" | "sorter" | "check";

export interface Source {
  id: string; title: string; type: SourceType; origin: string; url: string;
  status: SourceStatus; date: string; industry: string; confidence: number;
}
export interface Company {
  id: string; name: string; industry: string; city: string; size: string;
  score: number; sourceIds: string[]; signals: string[];
}
export interface Contact {
  id: string; name: string; role: string; companyId: string; sourceId: string; email: string; addedAt: string;
}
export interface Signal {
  id: string; date: string; companyId: string; sourceId: string; agent: AgentId;
  kind: "Contratación" | "Expansión" | "Financiación" | "Producto" | "Riesgo"; label: string;
}
export interface Rule { id: string; name: string; description: string; status: "pasa" | "atención" | "falla"; evidence: string[] }

export const sources: Source[] = [
  { id: "s1", title: "Página de empleo — Ingeniería de datos", type: "Web", origin: "nortelogistica.example", url: "#", status: "organizado", date: "2026-10-14", industry: "Logística", confidence: 0.86 },
  { id: "s2", title: "Alta en registro mercantil", type: "Registro", origin: "registro.example", url: "#", status: "revisado (demo)", date: "2026-10-12", industry: "Energía", confidence: 0.94 },
  { id: "s3", title: "Nota: ronda serie A", type: "Noticia", origin: "diario-tech.example", url: "#", status: "en revisión", date: "2026-10-11", industry: "Fintech", confidence: 0.72 },
  { id: "s4", title: "Publicación sobre nueva planta", type: "Red social", origin: "red.example/solaria", url: "#", status: "nuevo", date: "2026-10-16", industry: "Energía", confidence: 0.61 },
  { id: "s5", title: "Memoria anual 2025 (PDF)", type: "Documento", origin: "vertice.example/memoria.pdf", url: "#", status: "organizado", date: "2026-10-08", industry: "Salud", confidence: 0.9 },
  { id: "s6", title: "Lanzamiento de producto API", type: "Web", origin: "pagoclaro.example/blog", url: "#", status: "revisado (demo)", date: "2026-10-09", industry: "Fintech", confidence: 0.88 },
  { id: "s7", title: "Entrevista al CEO", type: "Noticia", origin: "negocios.example", url: "#", status: "en revisión", date: "2026-10-13", industry: "Retail", confidence: 0.67 },
  { id: "s8", title: "Licitación pública adjudicada", type: "Registro", origin: "contratos.example", url: "#", status: "organizado", date: "2026-10-05", industry: "Logística", confidence: 0.91 },
  { id: "s9", title: "Vacantes comerciales LATAM", type: "Red social", origin: "red.example/mercalia", url: "#", status: "nuevo", date: "2026-10-17", industry: "Retail", confidence: 0.58 },
  { id: "s10", title: "Ficha técnica de dispositivo", type: "Documento", origin: "vertice.example/ficha", url: "#", status: "revisado (demo)", date: "2026-10-03", industry: "Salud", confidence: 0.83 },
  { id: "s11", title: "Alianza con operador portuario", type: "Noticia", origin: "puerto-hoy.example", url: "#", status: "organizado", date: "2026-10-10", industry: "Logística", confidence: 0.79 },
  { id: "s12", title: "Cambio de domicilio social", type: "Registro", origin: "registro.example", url: "#", status: "en revisión", date: "2026-10-15", industry: "Industria", confidence: 0.7 },
];

export const companies: Company[] = [
  { id: "c1", name: "Norte Logística", industry: "Logística", city: "Bilbao", size: "200–500", score: 82, sourceIds: ["s1", "s8", "s11"], signals: ["Contratando equipo de datos", "Adjudicación pública", "Alianza portuaria"] },
  { id: "c2", name: "Solaria Grid", industry: "Energía", city: "Sevilla", size: "50–200", score: 74, sourceIds: ["s2", "s4"], signals: ["Nueva sociedad registrada", "Planta en construcción"] },
  { id: "c3", name: "PagoClaro", industry: "Fintech", city: "Madrid", size: "50–200", score: 88, sourceIds: ["s3", "s6"], signals: ["Ronda serie A", "Nueva API pública"] },
  { id: "c4", name: "Vértice Salud", industry: "Salud", city: "Valencia", size: "500+", score: 69, sourceIds: ["s5", "s10"], signals: ["Memoria anual publicada", "Nuevo dispositivo"] },
  { id: "c5", name: "Mercalia", industry: "Retail", city: "Ciudad de México", size: "500+", score: 63, sourceIds: ["s7", "s9"], signals: ["Expansión LATAM", "Contratación comercial"] },
  { id: "c6", name: "Forja Andina", industry: "Industria", city: "Bogotá", size: "200–500", score: 51, sourceIds: ["s12"], signals: ["Cambio de domicilio"] },
];

export const contacts: Contact[] = [
  { id: "p1", name: "Lucía Arregui", role: "Directora de Operaciones", companyId: "c1", sourceId: "s11", email: "l.arregui@demo.example", addedAt: "2026-10-10" },
  { id: "p2", name: "Iker Salas", role: "Head of Data", companyId: "c1", sourceId: "s1", email: "i.salas@demo.example", addedAt: "2026-10-14" },
  { id: "p3", name: "Marta Rueda", role: "CEO", companyId: "c2", sourceId: "s2", email: "m.rueda@demo.example", addedAt: "2026-10-12" },
  { id: "p4", name: "Daniel Ochoa", role: "CFO", companyId: "c3", sourceId: "s3", email: "d.ochoa@demo.example", addedAt: "2026-10-11" },
  { id: "p5", name: "Sara Llorente", role: "VP Producto", companyId: "c3", sourceId: "s6", email: "s.llorente@demo.example", addedAt: "2026-10-09" },
  { id: "p6", name: "Andrés Peral", role: "Director Médico", companyId: "c4", sourceId: "s5", email: "a.peral@demo.example", addedAt: "2026-10-08" },
  { id: "p7", name: "Valeria Núñez", role: "CEO", companyId: "c5", sourceId: "s7", email: "v.nunez@demo.example", addedAt: "2026-10-13" },
  { id: "p8", name: "Tomás Herrera", role: "Gerente Comercial", companyId: "c5", sourceId: "s9", email: "t.herrera@demo.example", addedAt: "2026-10-17" },
  { id: "p9", name: "Camila Restrepo", role: "Directora General", companyId: "c6", sourceId: "s12", email: "c.restrepo@demo.example", addedAt: "2026-10-15" },
];

export const signals: Signal[] = [
  { id: "g1", date: "2026-10-03", companyId: "c4", sourceId: "s10", agent: "scout", kind: "Producto", label: "Ficha técnica detectada" },
  { id: "g2", date: "2026-10-05", companyId: "c1", sourceId: "s8", agent: "scout", kind: "Expansión", label: "Licitación adjudicada" },
  { id: "g3", date: "2026-10-08", companyId: "c4", sourceId: "s5", agent: "sorter", kind: "Producto", label: "Memoria clasificada" },
  { id: "g4", date: "2026-10-09", companyId: "c3", sourceId: "s6", agent: "check", kind: "Producto", label: "Lanzamiento contrastado" },
  { id: "g5", date: "2026-10-10", companyId: "c1", sourceId: "s11", agent: "sorter", kind: "Expansión", label: "Alianza vinculada a empresa" },
  { id: "g6", date: "2026-10-11", companyId: "c3", sourceId: "s3", agent: "scout", kind: "Financiación", label: "Ronda serie A detectada" },
  { id: "g7", date: "2026-10-12", companyId: "c2", sourceId: "s2", agent: "check", kind: "Expansión", label: "Registro contrastado" },
  { id: "g8", date: "2026-10-13", companyId: "c5", sourceId: "s7", agent: "sorter", kind: "Expansión", label: "Entrevista organizada" },
  { id: "g9", date: "2026-10-14", companyId: "c1", sourceId: "s1", agent: "scout", kind: "Contratación", label: "Vacante de datos detectada" },
  { id: "g10", date: "2026-10-15", companyId: "c6", sourceId: "s12", agent: "check", kind: "Riesgo", label: "Cambio de domicilio a revisar" },
  { id: "g11", date: "2026-10-16", companyId: "c2", sourceId: "s4", agent: "scout", kind: "Expansión", label: "Nueva planta mencionada" },
  { id: "g12", date: "2026-10-17", companyId: "c5", sourceId: "s9", agent: "scout", kind: "Contratación", label: "Vacantes comerciales" },
];

export const rules: Rule[] = [
  { id: "r1", name: "Fuente con fecha", description: "Toda fuente debe tener fecha de publicación identificable.", status: "pasa", evidence: ["s1", "s2", "s6"] },
  { id: "r2", name: "Doble procedencia", description: "Señales clave respaldadas por al menos dos fuentes.", status: "atención", evidence: ["s3", "s7"] },
  { id: "r3", name: "Consistencia de razón social", description: "Nombre de empresa coincide entre registro y web.", status: "pasa", evidence: ["s2", "s8"] },
  { id: "r4", name: "Datos de contacto profesionales", description: "Solo correos corporativos; sin datos personales sensibles.", status: "pasa", evidence: ["s1", "s11"] },
  { id: "r5", name: "Cambios societarios recientes", description: "Marcar cambios de domicilio o administración en 30 días.", status: "falla", evidence: ["s12"] },
  { id: "r6", name: "Antigüedad de la señal", description: "Señales con más de 90 días se marcan como caducadas.", status: "pasa", evidence: ["s5", "s10"] },
];

export const periodActivity = [
  { week: "S37", scout: 14, sorter: 9, check: 6 },
  { week: "S38", scout: 18, sorter: 12, check: 8 },
  { week: "S39", scout: 15, sorter: 14, check: 11 },
  { week: "S40", scout: 22, sorter: 16, check: 12 },
  { week: "S41", scout: 26, sorter: 19, check: 15 },
  { week: "S42", scout: 24, sorter: 21, check: 17 },
];
