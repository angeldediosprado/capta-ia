import type { ICP, Lead, SourceRun } from './types';
import { mapPereira, pereiraEndpoint, pereiraQuery } from './pereira';
export async function fetchPereira(icp:ICP):Promise<{leads:Lead[];run:SourceRun}>{
 const run:SourceRun={id:crypto.randomUUID(),source:'pereira',fetchedAt:new Date().toISOString(),query:'',url:pereiraEndpoint,attribution:'Cámara de Comercio de Pereira, Risaralda · Sociedades BIC · CC BY-SA 4.0 · https://www.datos.gov.co/d/hjhn-23mx',dataClass:'live',status:'success',received:0,newUnique:0,merged:0,review:0};
 try{
  run.query=pereiraQuery(icp);
  const url=new URL(pereiraEndpoint);url.search=new URLSearchParams({'$select':'matricula,razon_social,dir_comercial,mun_comercial,tel_com,correo_comercial,ciiu','$where':run.query,'$order':'matricula ASC','$limit':'100'}).toString();run.url=url.toString();
  const response=await fetch(url,{signal:AbortSignal.timeout(20000),redirect:'error',headers:{Accept:'application/json'}});
  if(!response.ok)throw new Error(`La Cámara de Pereira no está disponible (HTTP ${response.status}).`);
  const payload:unknown=await response.json();if(!Array.isArray(payload))throw new Error('La Cámara de Pereira devolvió una respuesta inválida.');
  const metadata=await fetch('https://www.datos.gov.co/api/views/hjhn-23mx.json',{signal:AbortSignal.timeout(10000),redirect:'error'}).then(r=>r.ok?r.json():null).catch(()=>null);
  if(typeof metadata?.rowsUpdatedAt==='number')run.sourceUpdatedAt=new Date(metadata.rowsUpdatedAt*1000).toISOString();
  run.received=payload.length;const leads=mapPereira(payload,icp,run);run.discarded=payload.length-leads.length;
  run.query+='; hasta 100 sociedades BIC, no exhaustivo; no es un directorio de todos los negocios';return {leads,run};
 }catch(error){return {leads:[],run:{...run,status:'error',error:error instanceof Error&&['TimeoutError','AbortError'].includes(error.name)?'La Cámara de Pereira tardó demasiado. No se guardaron resultados de esta fuente.':error instanceof Error?error.message:'No se pudo consultar la Cámara de Pereira.'}};}
}