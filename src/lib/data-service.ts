// One shared read boundary: legacy visual projections and functional domain use the same selected dataset.
import { companies as demoCompanies, contacts as demoContacts, sources as demoSources, signals as demoSignals, rules as demoRules, periodActivity, type Company, type Contact, type Source, type Signal } from './demo-data';
import { getProspectingData } from './prospecting-store';
import { evaluateICP } from './prospecting/domain';
import { mapSectors } from './prospecting/open-map';
export { useDataRevision, getProspectingData, setProspectingData } from './prospecting-store';
export { evaluateICP, deduplicate, metrics, validLead } from './prospecting/domain';
export { SOURCE_DEFINITIONS, emptyWorkspace } from './prospecting/types';
export type * from './prospecting/types';
export const IS_DEMO=true;
export const isDemo=()=>getProspectingData().mode==='demo';
export const getLeads=()=>getProspectingData().workspace.leads;
export const getSources=():Source[]=>isDemo()?demoSources:getProspectingData().workspace.runs.map(r=>({id:r.id,title:`${r.source.toUpperCase()} · ${r.filename ?? r.fetchedAt.slice(0,10)}`,type:'Registro',origin:r.url,url:r.url,status:r.status==='error'?'en revisión':'organizado',date:r.fetchedAt.slice(0,10),industry:mapSectors.find(s=>s.id===r.icpSnapshot?.sector)?.label??(r.icpSnapshot?.naics?`Perfil NAICS ${r.icpSnapshot.naics}`:'Actividad no informada'),confidence:0}));
export const getSource=(id:string)=>getSources().find(s=>s.id===id);
export const getCompanies=():Company[]=>isDemo()?demoCompanies:getLeads().map(l=>({id:l.id,name:l.name,city:l.city??'Sin ciudad',industry:mapSectors.find(s=>s.id===l.mapSector)?.label??(l.naics?`NAICS ${l.naics}`:'Actividad no informada'),size:'N/D',score:evaluateICP(l,getProspectingData().workspace.icp).status==='match'?100:0,sourceIds:[...new Set(l.provenance.map(p=>p.runId))],signals:[l.review?'Revisión de identidad':evaluateICP(l,getProspectingData().workspace.icp).status]}));
export const getCompany=(id:string)=>getCompanies().find(c=>c.id===id);
export const getContacts=():Contact[]=>isDemo()?demoContacts:getLeads().filter(l=>l.phone||l.email||l.website).map(l=>({id:`contact-${l.id}`,name:l.name,role:'Contacto comercial público',companyId:l.id,sourceId:l.provenance[0]?.runId??'',email:l.email??l.phone??l.website??'',addedAt:l.createdAt.slice(0,10)}));
export const getSignals=():Signal[]=>isDemo()?demoSignals:[...getLeads().map(l=>({id:`found-${l.id}`,date:l.createdAt.slice(0,10),companyId:l.id,sourceId:l.provenance[0]?.runId??'',agent:'scout' as const,kind:'Producto' as const,label:`Registro público adquirido · ${l.name}`})),...getProspectingData().workspace.attempts.map(a=>({id:a.id,date:a.date.slice(0,10),companyId:a.leadId,sourceId:getLeads().find(l=>l.id===a.leadId)?.provenance[0]?.runId??'',agent:'sorter' as const,kind:'Producto' as const,label:`Acción manual · ${a.channel} · ${a.note}`})),...getProspectingData().workspace.responses.map(r=>({id:r.id,date:r.date.slice(0,10),companyId:r.leadId,sourceId:getLeads().find(l=>l.id===r.leadId)?.provenance[0]?.runId??'',agent:'check' as const,kind:'Producto' as const,label:`Respuesta observada · ${r.responder} · ${r.note}`}))];
export const getRules=()=>isDemo()?demoRules:[{id:'icp',name:'Evaluación ICP provisional',description:'Ciudad, actividad y estado público; campos ausentes no coinciden.',status:'atención' as const,evidence:getSources().map(s=>s.id)}];
export const getActivity=()=>isDemo()?periodActivity:getPipelineRuns().map(r=>({week:r.fetchedAt.slice(0,10),scout:r.stages?.find(s=>s.agent==='scout')?.output??0,sorter:r.stages?.find(s=>s.agent==='sorter')?.output??0,check:r.stages?.find(s=>s.agent==='check')?.output??0}));
export const contactsForCompany=(id:string)=>getContacts().filter(c=>c.companyId===id);
export const signalsForCompany=(id:string)=>getSignals().filter(s=>s.companyId===id).sort((a,b)=>a.date.localeCompare(b.date));
export const companiesForSource=(id:string)=>getCompanies().filter(c=>c.sourceIds.includes(id));
const norm=(s:string)=>s.normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase();
export const matches=(q:string,...fields:string[])=>!q.trim()||fields.some(f=>norm(f).includes(norm(q.trim())));
export interface SearchHit {kind:'Fuente'|'Empresa'|'Contacto'|'Industria';label:string;sub:string;to:string;id?:string}
export function globalSearch(q:string):SearchHit[] {
 if(!q.trim())return[]; const hits:SearchHit[]=[];
 getSources().filter(s=>matches(q,s.title,s.origin)).forEach(s=>hits.push({kind:'Fuente',label:s.title,sub:s.origin,to:'/fuentes',id:s.id}));
 getCompanies().filter(c=>matches(q,c.name,c.city)).forEach(c=>hits.push({kind:'Empresa',label:c.name,sub:`${c.industry} · ${c.city}`,to:'/empresas',id:c.id}));
 getContacts().filter(p=>matches(q,p.name,p.role)).forEach(p=>hits.push({kind:'Contacto',label:p.name,sub:p.role,to:'/contactos',id:p.id}));
 [...new Set(getCompanies().map(c=>c.industry))].filter(i=>matches(q,i)).forEach(i=>hits.push({kind:'Industria',label:i,sub:'Industria',to:'/empresas'}));return hits.slice(0,10);
}
function csvCell(v:unknown){const s=String(v??'');return /[",\n;]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;}
export function toCSV<T extends object>(rows:T[]):string {const first=rows[0];if(!first)return '';const keys=Object.keys(first) as (keyof T)[];return[keys.join(','),...rows.map(r=>keys.map(k=>csvCell(r[k])).join(','))].join('\n');}
export function downloadCSV(name:string,csv:string){const blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);}
export const companyName=(id:string)=>getCompany(id)?.name??'—';
export type {Company,Contact,Source};

export { applySourceResult, dataSFQuery, sourceRecommendation } from './prospecting/discovery';
export const getPipelineRuns=()=>isDemo()?[]:getProspectingData().workspace.runs;

export { sourceCatalog } from './prospecting/catalog';
export { discoveryProfiles, prepareDrafts, publicChannel } from './prospecting/automation';

export { mapSectors, searchCountries, sectorForICP, openMapQuery, contactCompleteness } from './prospecting/open-map';

export { supportsPereira } from './prospecting/pereira';
