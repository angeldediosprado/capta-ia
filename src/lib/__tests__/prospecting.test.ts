import { describe,it,expect,vi,afterEach } from 'vitest';
import { deduplicate,evaluateICP,metrics,ratio,validateAttempt } from '../prospecting/domain';
import { emptyWorkspace,defaultICP,type Lead,type CostRecord } from '../prospecting/types';
import { parseCSLB } from '../prospecting/import';
import { fetchDataSF } from '../prospecting/sources.server';
const lead=(id:string,patch:Partial<Lead>={}):Lead=>({id,name:'SF Plumbing',address:'100 Main St',city:'San Francisco',naics:'238220',classifications:[],active:true,review:false,createdAt:'2026-10-18T12:00:00Z',provenance:[{source:'datasf',recordId:id,url:'https://data.sfgov.org/resource/g8m3-pdis.json',fetchedAt:'2026-10-18T12:00:00Z',dataClass:'live',attribution:'City',query:'238220',runId:'r1'}],...patch});
const cost=(patch:Partial<CostRecord>={}):CostRecord=>({id:'cost',amount:20,currency:'USD',date:'2026-10-18',periodFrom:'2026-10-01',periodTo:'2026-10-31',dimension:'source',target:'datasf',note:'Recorded expense',type:'direct',complete:true,...patch});
afterEach(()=>vi.unstubAllGlobals());
describe('deduplication',()=>{
 it('merges exact normalized name/address preserving both sources',()=>{const b=lead('b',{name:'SF PLUMBING',address:'100 Main St.'});b.provenance[0]={...b.provenance[0],source:'cslb',runId:'r2',recordId:'222',url:'https://www.cslb.ca.gov/'} as Lead['provenance'][number];const d=deduplicate([lead('a')],[b]);expect(d.leads).toHaveLength(1);expect(d.merged).toBe(1);expect(d.leads[0]?.provenance).toHaveLength(2);});
 it('strong license merges across different spelling',()=>expect(deduplicate([lead('a',{licenseNumber:'123'})],[lead('b',{name:'Other name',licenseNumber:'123'})]).merged).toBe(1));
 it('partial name match never merges and goes to review',()=>{const d=deduplicate([lead('a')],[lead('b',{address:'200 Main St'})]);expect(d.leads).toHaveLength(2);expect(d.review).toBe(1);expect(d.merged).toBe(0);});
 it('conflicting strong keys on exact match go to review',()=>expect(deduplicate([lead('a',{licenseNumber:'123'})],[lead('b',{licenseNumber:'456'})]).review).toBe(1));
});
describe('ICP',()=>{
 it('missing fields are insufficient, not a match',()=>expect(evaluateICP(lead('a',{city:undefined,active:undefined}),defaultICP).status).toBe('insufficient'));
 it('accepts provisional SF 238220 active',()=>expect(evaluateICP(lead('a'),defaultICP).status).toBe('match'));
 it('accepts C-20 or C-36 without NAICS',()=>{for(const c of ['C-20','C-36'])expect(evaluateICP(lead('a',{naics:undefined,classifications:[c]}),defaultICP).status).toBe('match');});
 it('rejects other city',()=>expect(evaluateICP(lead('a',{city:'Oakland'}),defaultICP).status).toBe('no-match'));
});
describe('metrics',()=>{
 it('denominator zero is N/D',()=>expect(ratio([cost()],0,'2026-10-01','2026-10-31').value).toBeNull());
 it('cost coverage must span the full requested period',()=>expect(ratio([cost({periodTo:'2026-10-18'})],1,'2026-10-01','2026-10-31').value).toBeNull());
 it('later negative qualification supersedes prior positive',()=>{const w=emptyWorkspace();w.leads=[lead('a')];w.qualifications=[{id:'q1',leadId:'a',positive:true,method:'manual',date:'2026-10-17',evidence:'Manual review'},{id:'q2',leadId:'a',positive:false,method:'manual',date:'2026-10-18',evidence:'Later review'}];expect(metrics(w,'2026-10-01','2026-10-31').qualified).toBe(0);});
 it('missing cost is not zero',()=>expect(ratio([],1,'2026-10-01','2026-10-31').value).toBeNull());
 it('mixed currency is N/D',()=>expect(ratio([cost(),cost({currency:'EUR'})],2,'2026-10-01','2026-10-31').value).toBeNull());
 it('incomplete cost is N/D',()=>expect(ratio([cost({complete:false})],1,'2026-10-01','2026-10-31').value).toBeNull());
 it('human time requires explicit hourly rate',()=>expect(ratio([cost({type:'human-time',hours:2})],1,'2026-10-01','2026-10-31').value).toBeNull());
 it('calculates human cost hours times rate',()=>expect(ratio([cost({type:'human-time',hours:2,hourlyRate:15})],2,'2026-10-01','2026-10-31').value).toBe(15));
 it('multi-source does not inflate eligible leads or first touch',()=>{const w=emptyWorkspace();const a=lead('a');a.provenance.push({...a.provenance[0],source:'cslb'} as Lead['provenance'][number]);w.leads=[a];w.costs=[cost()];const m=metrics(w,'2026-10-01','2026-10-31');expect(m.eligible).toBe(1);expect(m.sources.find(r=>r.source==='datasf')?.first).toBe(1);expect(m.sources.find(r=>r.source==='cslb')?.first).toBe(0);expect(m.sources.find(r=>r.source==='datasf')?.multi).toBe(1);expect(m.sources.find(r=>r.source==='cslb')?.multi).toBe(1);expect(m.sources.find(r=>r.source==='openmap')?.multi).toBe(0);expect(m.sources[0]?.cpl.value).toBe(20);});
 it('demo is excluded from real lead denominator',()=>{const w=emptyWorkspace();const a=lead('a');if(a.provenance[0])a.provenance[0].dataClass='demo';w.leads=[a];expect(metrics(w,'2026-10-01','2026-10-31').eligible).toBe(0);});
 it('counts response companies once and excludes failed attempts',()=>{const w=emptyWorkspace();w.leads=[lead('a')];w.attempts=[{id:'a1',leadId:'a',channel:'phone',date:'2026-10-18',status:'attempt-recorded',note:'Called',providerConfirmed:false},{id:'a2',leadId:'a',channel:'phone',date:'2026-10-18',status:'failed',note:'Failed',providerConfirmed:false}];w.responses=[{id:'reply',attemptId:'a1',leadId:'a',date:'2026-10-18',responder:'Office',note:'Observed',status:'response-observed'}];const m=metrics(w,'2026-10-01','2026-10-31');expect(m.attempted).toBe(1);expect(m.responseRate).toBe(1);});
});
describe('contact and source safety',()=>{
 it('manual attempt cannot assert sent without provider confirmation',()=>expect(()=>validateAttempt({id:'x',leadId:'a',channel:'email',date:'2026-10-18',status:'sent',note:'Draft',providerConfirmed:false})).toThrow('proveedor'));
 it('delivered also requires confirmation',()=>expect(()=>validateAttempt({id:'x',leadId:'a',channel:'email',date:'2026-10-18',status:'delivered',note:'Draft',providerConfirmed:false})).toThrow('proveedor'));
 it('allows an evidenced manual attempt',()=>expect(()=>validateAttempt({id:'x',leadId:'a',channel:'phone',date:'2026-10-18',status:'attempt-recorded',note:'Called commercial phone',providerConfirmed:false})).not.toThrow());
 it('rejects import without required license identifier',()=>expect(()=>parseCSLB('Business Name,Address,City\nSF Plumbing,100 Main,San Francisco','cslb.csv','2026-10-18T12:00:00Z','2026-10-17')).toThrow('License Number'));
 it('preserves license as text and records filename/date',()=>{const r=parseCSLB('License Number,Business Name,Address,City,Classification,Status\n00123,SF Plumbing,100 Main,San Francisco,C-36,Active','cslb.csv','2026-10-18T12:00:00Z','2026-10-17');expect(r.leads[0]?.licenseNumber).toBe('00123');expect(r.run.filename).toBe('cslb.csv');expect(r.leads[0]?.provenance[0]?.dataClass).toBe('imported');});
 it('failed source returns error audit and no synthetic leads',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('',{status:503})));const r=await fetchDataSF();expect(r.leads).toEqual([]);expect(r.run.status).toBe('error');expect(r.run.error).toContain('503');});
});
