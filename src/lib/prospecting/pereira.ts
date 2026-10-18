import type { ICP, Lead, SourceRun } from './types';
import { normalize } from './domain';
import { businessEmail, phone } from './rnt';
export const pereiraEndpoint='https://www.datos.gov.co/resource/hjhn-23mx.json';
// Native Colombian CIIU categories, never invented NAICS equivalents.
export const pereiraCategories:Record<string,readonly string[]>={restaurants:['5611','5612','5613','5619'],hotels:['5511'],architecture:['7110'],engineering:['7110'],legal:['6910'],software:['6201','6202','6209'],accounting:['6920'],realestate:['6810','6820'],automotive:['4520'],electrical:['4321']};
export const pereiraCities=['pereira','apia','balboa','belen de umbria','la virginia','marsella','quinchia'];
export function supportsPereira(icp:ICP){return icp.country==='CO'&&pereiraCities.includes(normalize(icp.city))&&!!pereiraCategories[icp.sector??''];}
export function pereiraQuery(icp:ICP){
 if(!supportsPereira(icp))throw new Error('Esta fuente cubre sociedades BIC de Risaralda en los sectores disponibles; no cubre Bogotá.');
 const city=icp.city.normalize('NFD').replace(/\p{Diacritic}/gu,'').trim().toUpperCase().replace(/'/g,"''");
 const codes=pereiraCategories[icp.sector??'']??[];
 return `mun_comercial='${city}' AND (${codes.map(c=>`ciiu like '%${c}%'`).join(' OR ')})`;
}
export function mapPereira(payload:unknown,icp:ICP,run:SourceRun):Lead[]{
 if(!Array.isArray(payload))throw new Error('La Cámara de Pereira devolvió una respuesta inválida.');
 const leads:Lead[]=[];const text=(v:unknown)=>typeof v==='string'?v.trim():'';
 for(const raw of payload.slice(0,100)){
  if(!raw||typeof raw!=='object')throw new Error('La Cámara de Pereira devolvió un registro inválido.');
  const row=raw as Record<string,unknown>;const id=text(row['matricula']),name=text(row['razon_social']),address=text(row['dir_comercial']),city=text(row['mun_comercial']),category=text(row['ciiu']);
  const code=category.match(/^[A-Z]?(\d{4})(?:\s|$)/)?.[1];
  if(!id||!name||!address||normalize(city)!==normalize(icp.city)||!code||!pereiraCategories[icp.sector??'']?.includes(code))continue;
  const publicPhone=phone(row['tel_com']),email=businessEmail(row['correo_comercial']);
  if(icp.requireContact!==false&&!publicPhone&&!email)continue;
  // 7110 combines architecture and engineering: preserve that uncertainty rather than guessing.
  const combined=code==='7110';
  leads.push({id:crypto.randomUUID(),name,address,city,country:'CO',mapSector:combined?undefined:icp.sector,classifications:[],phone:publicPhone,email,createdAt:run.fetchedAt,review:false,
   provenance:[{source:'pereira',recordId:id,url:run.url,fetchedAt:run.fetchedAt,sourceUpdatedAt:run.sourceUpdatedAt,dataClass:'live',attribution:run.attribution,query:`${run.query}; CIIU publicado: ${category}; ${combined?'arquitectura e ingeniería no diferenciadas; ':''}estado actual y vigencia de contacto no verificados; contacto publicado no autoriza publicidad`,runId:run.id}]});
 }
 return leads;
}