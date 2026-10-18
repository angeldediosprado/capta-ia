import { describe,it,expect } from 'vitest';
import { applySourceResult,dataSFQuery,sourceRecommendation } from '../prospecting/discovery';
import { previewImport,suggestMapping,mapCSLB } from '../prospecting/import';
import { emptyWorkspace,defaultICP, type SourceRun } from '../prospecting/types';
import { evaluateICP } from '../prospecting/domain';
import { workspaceSchema } from '../prospecting/schemas';
const rows=[{'Permit':'00123','Trading name':'SF Plumbing','Street':'100 Main St','Town':'San Francisco','Class':'C-36','State':'Active'}];
const mapping={licenseNumber:'Permit',name:'Trading name',address:'Street',city:'Town',classifications:'Class',status:'State',phone:''};
const date='2026-10-18T12:00:00Z';
describe('guided discovery',()=>{
 it('uses editable city and sector codes in actual query',()=>expect(dataSFQuery({...defaultICP,city:'Oakland',naics:'238220,238210'})).toBe("self_reported_naics_code in ('238220','238210') AND city='Oakland' AND state='CA' AND location_end_date IS NULL"));
 it('rejects injected NAICS and quotes city safely',()=>{expect(()=>dataSFQuery({...defaultICP,naics:"238220' OR 1=1"})).toThrow();expect(dataSFQuery({...defaultICP,city:"O'Brien"})).toContain("O''Brien");});
 it('explains absent business type and does not make it match',()=>{const imported=mapCSLB([{'License Number':'123','Business Name':'SF Plumbing',Address:'100 Main',City:'San Francisco',Classification:'C-36',Status:'Active'}],'official.csv',date,'2026-10-17');expect(evaluateICP(imported.leads[0] as typeof imported.leads[number],{...defaultICP,businessType:'LLC',requireBusinessType:true}).status).toBe('insufficient');expect(sourceRecommendation('datasf',{...defaultICP,businessType:'LLC'}).missing.join()).toContain('tipo de empresa');});
});
describe('preview mapping',()=>{
 it('maps custom columns without mutating originals; preserves zeros',()=>{const p=previewImport(rows,mapping,'official.csv',date,'2026-10-17');expect(p.errors).toEqual([]);expect(mapCSLB(p.rows,'official.csv',date,'2026-10-17').leads[0]?.licenseNumber).toBe('00123');expect(rows[0]?.Permit).toBe('00123');});
 it('lists all invalid row numbers; does not silently skip',()=>{const p=previewImport([...rows,{...rows[0],Permit:'oops'},{...rows[0],Town:''}],mapping,'official.csv',date,'2026-10-17');expect(p.errors.map(e=>e.row)).toEqual([3,4]);expect(p.valid).toBe(1);});
 it('rejects mapping same column twice',()=>expect(()=>previewImport(rows,{...mapping,name:'Permit'},'official.csv',date,'2026-10-17')).toThrow('dos campos'));
 it('detects known column aliases',()=>expect(suggestMapping(['License Number','Business Name','City']).licenseNumber).toBe('License Number'));
});
describe('persistent deterministic pipeline',()=>{
 const result=()=>mapCSLB(previewImport(rows,mapping,'official.csv',date,'2026-10-17').rows,'official.csv',date,'2026-10-17');
 it('records inputs outputs rules ICP snapshot and linked entities for three stages',()=>{const r=result();const w=applySourceResult(emptyWorkspace(),r,date);expect(w.runs[0]?.stages?.map(s=>s.agent)).toEqual(['scout','sorter','check']);expect(w.runs[0]?.stages?.map(s=>s.output)).toEqual([1,1,1]);expect(w.runs[0]?.evaluations?.[0]?.status).toBe('match');expect(w.runs[0]?.icpSnapshot?.city).toBe('San Francisco');expect(workspaceSchema.parse(JSON.parse(JSON.stringify(w))).runs[0]?.stages?.[0]?.leadIds).toEqual([r.leads[0]?.id]);});
 it('deduplicates repeat imports preserving both execution provenance',()=>{const w=applySourceResult(applySourceResult(emptyWorkspace(),result(),date),result(),date);expect(w.leads).toHaveLength(1);expect(w.leads[0]?.provenance).toHaveLength(2);expect(w.runs[1]?.merged).toBe(1);expect(w.runs[1]?.stages?.[1]?.leadIds).toEqual([w.leads[0]?.id]);});
 it('failed source preserves existing data and does not invent later agent activity',()=>{const w=applySourceResult(emptyWorkspace(),result(),date);const failed:SourceRun={...result().run,source:'datasf',status:'error',received:0,error:'HTTP 503'};const out=applySourceResult(w,{leads:[],run:failed},date);expect(out.leads).toEqual(w.leads);expect(out.runs[1]?.stages?.map(s=>s.agent)).toEqual(['scout']);expect(out.runs[1]?.stages?.[0]?.status).toBe('error');});
 it('missing active yields partial check with reasons',()=>{const r=result();if(r.leads[0])r.leads[0].active=undefined;const w=applySourceResult(emptyWorkspace(),r,date);expect(w.runs[0]?.stages?.[2]?.status).toBe('partial');expect(w.runs[0]?.evaluations?.[0]?.reasons.join()).toContain('desconocido');});
});
