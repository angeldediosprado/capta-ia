import type { ICP, Lead, SourceId, SourceRun, Workspace } from './types';
import { deduplicate, evaluateICP, validLead } from './domain';
export interface StageAudit { agent: 'scout'|'sorter'|'check'; status:'success'|'partial'|'error'; startedAt:string; finishedAt:string; input:number; output:number; rules:string[]; events:string[]; leadIds:string[] }
export function dataSFQuery(icp:ICP) {
 if (!/^\d{2,6}(,\s*\d{2,6})*$/.test(icp.naics)) throw new Error('NAICS: códigos numéricos de 2–6 dígitos separados por coma');
 if (!icp.city.trim() || icp.city.length>100) throw new Error('Ciudad inválida');
 const city=icp.city.replace(/'/g,"''"); const codes=icp.naics.split(',').map(c=>`'${c.trim()}'`).join(',');
 return `self_reported_naics_code in (${codes}) AND city='${city}' AND state='CA' AND location_end_date IS NULL`;
}
export function sourceRecommendation(source:SourceId,icp:ICP) {
 if(source==='pereira')return {covered:['empresa','dirección comercial','municipio','teléfono comercial','correo empresarial cuando corresponda','CIIU publicado'],missing:['negocios no BIC','Bogotá y otras regiones','estado activo actual','permiso de publicidad','distinción entre arquitectura e ingeniería en CIIU 7110'],reasons:['Publicación independiente de la Cámara de Comercio de Pereira','Sociedades BIC de Risaralda; no es un directorio completo']};
 if(source==='rnt')return {covered:['empresa','dirección','ciudad','teléfono y correo empresarial cuando estén publicados','actividad registrada'],missing:['sectores fuera de restaurantes y hoteles','negocios sin registro turístico','vigencia del contacto','permiso de publicidad'],reasons:[icp.country==='CO'&&['restaurants','hotels'].includes(icp.sector??'')?'Registro oficial colombiano alineado con tu búsqueda':'Solo restaurantes y hoteles registrados en Colombia','Último periodo publicado; no incluye todos los negocios de la ciudad']};
 if(source==='openmap')return {covered:['nombre','dirección, teléfono, correo y web cuando estén publicados'],missing:['cobertura completa','estado activo confirmado','datos de contacto ausentes en muchos registros'],reasons:[`Busca negocios mapeados en ${icp.city}, ${icp.country??'US'}`, 'Información comunitaria; revisar campos faltantes antes de contactar']};
 const covered=source==='datasf'?['nombre','dirección','ciudad','NAICS','identificador']:['nombre','dirección','ciudad','licencia','clasificaciones','estado (si el archivo lo incluye)'];
 const missing=source==='datasf'?['licencia CSLB','teléfono/email','estado activo confirmado en todos los registros']:['NAICS','email/web (no garantizados)'];
 const reasons=source==='datasf'?[`NAICS ${icp.naics} consultable`,icp.city.toLowerCase()==='san francisco'?'Cobertura alineada con San Francisco':'Cobertura de registros SF; direcciones fuera de SF pueden existir, no es un registro de toda California']:[`Clasificaciones ${icp.classifications.join(', ') || 'sin definir'}`, 'Licencias de contratistas de California; filtrar ciudad después de importar'];
 if(icp.businessType)missing.push('tipo de empresa no disponible: información insuficiente si es obligatorio');
 return {covered,missing,reasons};
}
export function applySourceResult(workspace:Workspace,result:{leads:Lead[];run:SourceRun},finishedAt=new Date().toISOString()):Workspace {
 const run={...result.run,finishedAt,discarded:result.run.discarded??0,icpSnapshot:{...workspace.icp}};
 const start=run.fetchedAt;
 const stage=(agent:StageAudit['agent'],input:number,output:number,rules:string[],events:string[],ids:string[],status:StageAudit['status']='success'):StageAudit=>({agent,status,startedAt:start,finishedAt,input,output,rules,events,leadIds:ids});
 if(run.status==='error')return {...workspace,runs:[...workspace.runs,{...run,stages:[stage('scout',0,0,['Consulta pública; sin sustitución sintética'],[run.error??'Fuente fallida'],[],'error')]}]};
 const d=deduplicate(workspace.leads,result.leads);
 const keys=new Set(result.leads.flatMap(l=>l.provenance.map(p=>`${p.runId}:${p.recordId}`)));
 const processed=d.leads.filter(l=>l.provenance.some(p=>keys.has(`${p.runId}:${p.recordId}`)));
 const evaluations=processed.map(l=>({leadId:l.id,...evaluateICP(l,workspace.icp)}));
 const matches=processed.filter(l=>validLead(l)&&evaluateICP(l,workspace.icp).status==='match');
 Object.assign(run,{newUnique:d.newUnique,merged:d.merged,review:d.review});
 const stages=[stage('scout',run.received,result.leads.length,['Identificador y URL de fuente','Datos públicos; no outreach'],[`${run.dataClass}: ${run.query}`,`${run.discarded} descartados en validación`],processed.map(l=>l.id)),stage('sorter',result.leads.length,processed.length,['Licencia/account ID','Nombre + dirección exactos normalizados','Conflicto/ambigüedad → revisión','Preservar todas las procedencias'],[`${d.newUnique} nuevos · ${d.merged} fusionados · ${d.review} ambiguos`],processed.map(l=>l.id),d.review?'partial':'success'),stage('check',processed.length,matches.length,['ICP provisional versionado en esta ejecución','Ausente ≠ coincide','Registros ambiguos fuera del denominador'],evaluations.map(e=>`${e.leadId}: ${e.status} · ${e.reasons.join('; ')}`),processed.map(l=>l.id),evaluations.some(e=>e.status==='insufficient')||d.review?'partial':'success')];
 return {...workspace,leads:d.leads,runs:[...workspace.runs,{...run,stages,evaluations}]};
}
