import { describe, it, expect } from "vitest";
import { toCSV, globalSearch, matches } from "../data-service";

describe("data-service", () => {
  it("escapes CSV cells with commas and quotes", () => {
    expect(toCSV([{ a: 'x,"y"', b: 1 }])).toBe('a,b\n"x,""y""",1');
  });
  it("search ignores accents", () => {
    expect(matches("logistica", "Norte Logística")).toBe(true);
  });
  it("global search finds companies", () => {
    expect(globalSearch("pagoclaro").some((h) => h.kind === "Empresa")).toBe(true);
  });
});
