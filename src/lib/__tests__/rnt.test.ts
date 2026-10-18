import { afterEach, describe, expect, it, vi } from 'vitest';
import { mapRNT, rntQuery } from '../prospecting/rnt';
import { fetchRNT } from '../prospecting/rnt.server';
import { defaultICP, emptyWorkspace, type ICP, type SourceRun } from '../prospecting/types';
import { applySourceResult } from '../prospecting/discovery';
import { evaluateICP, metrics } from '../prospecting/domain';
import { workspaceSchema } from '../prospecting/schemas';
const icp: ICP = { ...defaultICP, city: 'Bogotá', country: 'CO', sector: 'restaurants', requireContact: true, requireActive: false };
const run: SourceRun = { id:'rnt-run', source:'rnt', fetchedAt:'2026-10-18T15:00:00Z', query:'published period', url:'https://www.datos.gov.co/resource/thwd-ivmp.json', attribution:'MinCIT', dataClass:'live', status:'success', received:1,newUnique:0,merged:0,review:0 };
const row = { codigo_rnt:'00123', municipio:'BOGOTA D.C.', estado_rnt:'ACTIVO', razon_social_establecimiento:'Empresa de prueba', categoria:'ESTABLECIMIENTOS DE GASTRONOMÍA', sub_categoria:'RESTAURANTE', direcci_n_comercial_establecimiento:'Calle 10 20', n_m_tel_fono:'6011234567', correo_establecimiento:'info@example.org', ano:'2026',periodo:'AGOSTO' };
afterEach(()=>vi.unstubAllGlobals());
describe('useful public tourism establishments',()=>{
 it('limits coverage to Colombian restaurants and hotels and uses published period',()=>{
  expect(rntQuery(icp,'2026','AGOSTO')).toContain("municipio='BOGOTA D.C.'");
  expect(rntQuery(icp,'2026','AGOSTO')).toContain("ano='2026' AND periodo='AGOSTO'");
  expect(()=>rntQuery({...icp,sector:'legal'},'2026','AGOSTO')).toThrow();
  expect(()=>rntQuery({...icp,country:'US'},'2026','AGOSTO')).toThrow();
 });
 it('keeps company address phone role email and source-native identifier without invented codes',()=>{
  const lead=mapRNT([row],icp,run)[0];
  expect(lead?.address).toBe('Calle 10 20'); expect(lead?.phone).toBe('6011234567');expect(lead?.email).toBe('info@example.org');
  expect(lead?.provenance[0]?.recordId).toBe('00123');expect(lead?.naics).toBeUndefined();
  if(!lead)throw new Error('Missing lead');expect(evaluateICP(lead,icp).status).toBe('match');
 });
 it('does not import personal or notification emails as outreach contacts',()=>{
  for(const email of ['juan.perez@example.org','notificaciones@example.org','info@gmail.com'])expect(mapRNT([{...row,correo_establecimiento:email}],icp,run)[0]?.email).toBeUndefined();
 });
 it('excludes wrong city sector missing address and unavailable contact rather than inventing data',()=>{
  for(const patch of [{municipio:'MEDELLIN'},{categoria:'GUIAS DE TURISMO'},{direcci_n_comercial_establecimiento:'Sin dato'},{n_m_tel_fono:'Sin dato',correo_establecimiento:'Sin dato'}])expect(mapRNT([{...row,...patch}],icp,run)).toEqual([]);
 });
 it('preserves repeat-run provenance and includes this source in CPL without zero-cost assumptions',()=>{
  const w={...emptyWorkspace(),icp};
  const first=applySourceResult(w,{run,leads:mapRNT([row],icp,run)});
  const secondRun={...run,id:'next'};
  const second=applySourceResult(first,{run:secondRun,leads:mapRNT([row],icp,secondRun)});
  expect(second.leads).toHaveLength(1);expect(second.leads[0]?.provenance).toHaveLength(2);
  expect(workspaceSchema.parse(second).runs[0]?.source).toBe('rnt');
  expect(metrics(second,'2026-10-18','2026-10-18').sources.find(s=>s.source==='rnt')?.cpl.value).toBeNull();
 });
 it('selects latest published month from actual source periods and never requests owner contacts',async()=>{
  const mock=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify([{ano:'2026',periodo:'JULIO'},{ano:'2026',periodo:'AGOSTO'}]))).mockResolvedValueOnce(new Response(JSON.stringify([row])));
  vi.stubGlobal('fetch',mock);const result=await fetchRNT(icp);
  expect(result.run.status).toBe('success');expect(result.run.query).toContain('AGOSTO 2026');
  const url=new URL(String(mock.mock.calls[1]?.[0]));expect(url.searchParams.get('$select')).not.toContain('correo_prestador');
 });
 it('keeps failures separate from empty successful results and preserves inventory',async()=>{
  vi.stubGlobal('fetch',vi.fn().mockResolvedValue(new Response('',{status:503})));
  const result=await fetchRNT(icp);expect(result.run.status).toBe('error');expect(result.leads).toEqual([]);
  const w={...emptyWorkspace(),icp,leads:mapRNT([row],icp,run)};
  expect(applySourceResult(w,result).leads).toHaveLength(1);
 });
});