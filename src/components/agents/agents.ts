import scoutImg from "@/assets/agent-scout.jpg";
import sorterImg from "@/assets/agent-sorter.jpg";
import checkImg from "@/assets/agent-check.jpg";
import type { AgentId } from "@/lib/demo-data";

export interface AgentDef {
  id: AgentId; name: string; verb: string; role: string; summary: string; tags: string[]; image: string;
  motion: "lean" | "steady" | "focus"; demoStatus: string;
}

export const AGENTS: Record<AgentId, AgentDef> = {
  scout: { id: "scout", name: "Scout", verb: "Descubre", role: "Exploración de fuentes", image: scoutImg, motion: "lean",
    summary: "Detecta fuentes y oportunidades: webs, registros, noticias y documentos con señales comerciales.",
    tags: ["Fuentes", "Señales", "Oportunidades"], demoStatus: "Demo · explora" },
  sorter: { id: "sorter", name: "Sorter", verb: "Organiza", role: "Clasificación y relaciones", image: sorterImg, motion: "steady",
    summary: "Ordena fuentes, empresas y contactos en capas conectadas, con clusters por industria y señal.",
    tags: ["Entidades", "Clusters", "Relaciones"], demoStatus: "Demo · organiza" },
  check: { id: "check", name: "Check", verb: "Verifica", role: "Reglas y consistencia", image: checkImg, motion: "focus",
    summary: "Revisa reglas, riesgos y consistencia con evidencia enlazada y trazabilidad completa.",
    tags: ["Reglas", "Riesgos", "Trazabilidad"], demoStatus: "Demo · revisa" },
};
export const AGENT_LIST = [AGENTS.scout, AGENTS.sorter, AGENTS.check];
