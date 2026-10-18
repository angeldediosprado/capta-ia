import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

type Mode = "visual" | "rendimiento";
const Ctx = createContext<{ mode: Mode; setMode: (m: Mode) => void; reduced: boolean }>({ mode: "visual", setMode: () => {}, reduced: false });

export function VisualModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<Mode>("visual");
  const [prm, setPrm] = useState(false);
  useEffect(() => {
    const saved = localStorage.getItem("capta-mode");
    if (saved === "rendimiento") setModeState("rendimiento");
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrm(mq.matches);
    const on = () => setPrm(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("perf-mode", mode === "rendimiento");
  }, [mode]);
  const setMode = (m: Mode) => { setModeState(m); localStorage.setItem("capta-mode", m); };
  return <Ctx.Provider value={{ mode, setMode, reduced: prm || mode === "rendimiento" }}>{children}</Ctx.Provider>;
}
export const useVisualMode = () => useContext(Ctx);
