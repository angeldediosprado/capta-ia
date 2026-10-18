import { dataSFQuery } from './discovery';
import { defaultICP, type ICP } from './types';
import type { Lead, SourceRun } from './types';
import { SOURCE_DEFINITIONS } from './types';
export async function fetchDataSF(icp:ICP=defaultICP): Promise<{leads:Lead[];run:SourceRun}> {
 const source=SOURCE_DEFINITIONS[0]; if(!source) throw new Error('DataSF no configurada');
 const id=crypto.randomUUID(), fetchedAt=new Date().toISOString();
 const query=dataSFQuery(icp);
 const url=new URL(source.url); url.searchParams.set('$where',query); url.searchParams.set('$limit','500'); url.searchParams.set('$order','uniqueid ASC');
 const run:SourceRun={id,source:'datasf',fetchedAt,query,dataClass:'live',status:'success',received:0,newUnique:0,merged:0,review:0,url:url.toString(),attribution:'City and County of San Francisco · PDDL · https://www.sfgov.org/data-policies'};
 try {
  const response=await fetch(url,{signal:AbortSignal.timeout(20000)}); if(!response.ok) throw new Error(`DataSF HTTP ${response.status}`);
  const rows:unknown=await response.json(); if(!Array.isArray(rows)) throw new Error('Respuesta DataSF inválida');
  const metadata=await fetch('https://data.sfgov.org/api/views/g8m3-pdis.json',{signal:AbortSignal.timeout(10000)}).then(r=>r['ok']?r['json']():null).catch(()=>null);
  if(metadata?.rowsUpdatedAt) run.sourceUpdatedAt=new Date(metadata.rowsUpdatedAt*1000).toISOString();
  const leads:Lead[]=rows.map((r:Record<string,string>)=> {
   if(!r['dba_name'] || !r['uniqueid']) throw new Error('Respuesta DataSF: faltan identificadores o nombre');
   const closed=String(r['administratively_closed'] ?? '').toLowerCase();
   const active=(r['location_end_date'] || r['dba_end_date'] || ['true','yes','y'].includes(closed)) ? false : ['false','no','n'].includes(closed) ? true : undefined;
   return {id:crypto.randomUUID(),name:r['dba_name'],address:r['full_business_address'],city:r['city'],naics:r['self_reported_naics_code'],classifications:[],accountId:r['certificate_number'] || r['uniqueid'],active,createdAt:fetchedAt,review:false,provenance:[{source:'datasf',recordId:r['uniqueid'],url:url.toString(),fetchedAt,sourceUpdatedAt:run.sourceUpdatedAt,dataClass:'live',attribution:run.attribution,query,runId:id}]};
  }); run.received=leads.length; if(rows.length===500) run.query+='; limitado a 500 filas, no exhaustivo'; return {leads,run};
 } catch(error) { return {leads:[],run:{...run,status:'error',error:error instanceof Error ? error.message : 'Fuente no disponible'}}; }
}
