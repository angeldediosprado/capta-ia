import Papa from 'papaparse';
import type { Lead, SourceRun } from './types';
import { SOURCE_DEFINITIONS } from './types';
import { normalize } from './domain';
export function parseCSLB(text: string, filename: string, fetchedAt: string, sourceUpdatedAt: string) {
 const parsed = Papa.parse<Record<string,string>>(text, { header: true, skipEmptyLines: true, transformHeader: h => normalize(h).replace(/ /g,'') });
 if (parsed.errors.length) throw new Error(`CSV inválido: ${parsed.errors[0]?.message}`);
 return mapCSLB(parsed.data,filename,fetchedAt,sourceUpdatedAt);
}
export function mapCSLB(rows: Record<string,unknown>[], filename: string, fetchedAt: string, sourceUpdatedAt: string) {
 if (!rows.length || rows.length > 10000) throw new Error('Archivo vacío o más de 10.000 filas; importa un extracto empresarial');
 if (!filename || !/^\d{4}-\d{2}-\d{2}$/.test(sourceUpdatedAt) || sourceUpdatedAt > fetchedAt.slice(0,10)) throw new Error('Indica nombre de archivo y fecha de consulta válida');
 const get = (r: Record<string,unknown>, ...keys:string[]) => { const norm = Object.fromEntries(Object.entries(r).map(([k,v])=>[normalize(k).replace(/ /g,''),String(v ?? '').trim()])); return keys.map(k=>norm[k]).find(Boolean) ?? ''; };
 const source = SOURCE_DEFINITIONS.find(s=>s.id==='cslb'); if (!source) throw new Error('Fuente no disponible');
 const id = crypto.randomUUID();
 const leads: Lead[] = rows.map((r,i)=> {
  const licenseNumber=get(r,'licensenumber','licenseno','license','licnum'); const name=get(r,'businessname','name','contractorname');
  const address=get(r,'address','address1','businessaddress','mailingaddress'); const city=get(r,'city','businesscity');
  if (!/^\d+$/.test(licenseNumber) || !name || !address || !city) throw new Error(`Fila ${i+2}: License Number, Business Name, Address y City obligatorios; licencia debe ser texto numérico`);
  const status=get(r,'status','licensestatus');
  return { id: crypto.randomUUID(), name,address,city,licenseNumber, classifications: get(r,'classifications','classification','primaryclassification').toUpperCase().match(/C-?\d+/g)?.map(c=>c.replace(/^C-?/,'C-')) ?? [], active: /^(active|a|current|valid)$/i.test(status) ? true : /^(inactive|expired|revoked|suspended|cancelled)$/i.test(status) ? false : undefined,
   phone: get(r,'phone','telephonenumber','telephone','businessphone') || undefined, createdAt:fetchedAt, review:false,
   provenance:[{source:'cslb',recordId:licenseNumber,url:`https://www.cslb.ca.gov/OnlineServices/CheckLicenseII/LicenseDetail.aspx?LicNum=${licenseNumber}`,fetchedAt,sourceUpdatedAt,dataClass:'imported',attribution:source.attribution,query:`Archivo empresarial ${filename}`,runId:id}] };
 });
 const run: SourceRun={id,source:'cslb',fetchedAt,sourceUpdatedAt,query:`Importación ${filename}`,filename,dataClass:'imported',status:'success',received:rows.length,newUnique:0,merged:0,review:0,url:source.url,attribution:source.attribution};
 return {leads,run};
}

export const IMPORT_FIELDS = ['licenseNumber','name','address','city','classifications','status','phone'] as const;
export type ImportField = typeof IMPORT_FIELDS[number];
export type ColumnMapping = Record<ImportField,string>;
const aliases: Record<ImportField,string[]> = {licenseNumber:['licensenumber','licenseno','license','licnum'],name:['businessname','contractorname','name'],address:['address','address1','businessaddress','mailingaddress'],city:['city','businesscity'],classifications:['classification','classifications','primaryclassification'],status:['status','licensestatus'],phone:['phone','telephone','telephonenumber','businessphone']};
export function readCSV(text:string){const p=Papa.parse<Record<string,string>>(text,{header:true,skipEmptyLines:true});if(p.errors.length)throw new Error(`CSV inválido: ${p.errors[0]?.message}`);return p.data;}
export function suggestMapping(columns:string[]):ColumnMapping {return Object.fromEntries(IMPORT_FIELDS.map(f=>[f,columns.find(c=>aliases[f].includes(normalize(c).replace(/ /g,'')))??''])) as ColumnMapping;}
export function previewImport(rows:Record<string,unknown>[],mapping:ColumnMapping,filename:string,fetchedAt:string,sourceUpdatedAt:string){
 if(!rows.length||rows.length>10000)throw new Error('Archivo vacío o más de 10.000 filas');
 const used=Object.values(mapping).filter(Boolean);if(new Set(used).size!==used.length)throw new Error('Una columna no puede representar dos campos');
 const errors:{row:number;message:string}[]=[];const mapped=rows.map(r=>Object.fromEntries(IMPORT_FIELDS.map(f=>[f,r[mapping[f]]??''])));
 for(const [i,r] of mapped.entries()){try{mapCSLB([r],filename,fetchedAt,sourceUpdatedAt);}catch(e){errors.push({row:i+2,message:e instanceof Error?e.message:'Fila inválida'});}}
 return {rows:mapped,errors,total:rows.length,valid:rows.length-errors.length};
}
