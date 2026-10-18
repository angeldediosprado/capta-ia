import { describe, it, expect } from "vitest";
import { toCSV, globalSearch, matches, getCompanies, getProspectingData, setProspectingData, emptyWorkspace } from "../data-service";

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
  it('never assigns the current search activity to previously saved companies',()=>{
    const previous=getProspectingData();
    try {
      const workspace=emptyWorkspace();workspace.icp.naics='722511';
      workspace.leads=[{id:'old',name:'Saved plumbing',city:'San Francisco',naics:'238220',classifications:[],review:false,createdAt:'2026-10-18',provenance:[{source:'datasf',recordId:'old',runId:'r',url:'https://data.sfgov.org',attribution:'City',query:'238220',dataClass:'live',fetchedAt:'2026-10-18'}]}];
      setProspectingData(workspace,0,'real');expect(getCompanies()[0]?.industry).toBe('NAICS 238220');
    }finally{setProspectingData(previous.workspace,previous.revision,previous.mode);}
  });
});
