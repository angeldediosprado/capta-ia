import { describe, expect, it, vi, afterEach } from 'vitest';
import { openMapQuery, mapOpenMap, contactCompleteness, resolveMapCity, mapSectors } from '../prospecting/open-map';
import { fetchOpenMap } from '../prospecting/open-map.server';
import { defaultICP, emptyWorkspace, type SourceRun, type ICP } from '../prospecting/types';
import { applySourceResult } from '../prospecting/discovery';
import { evaluateICP, metrics } from '../prospecting/domain';
import { workspaceSchema } from '../prospecting/schemas';
const icp: ICP = { ...defaultICP, city: 'Bogotá', country: 'CO', sector: 'restaurants', naics: '722511', requireActive: false, requireContact: true };
const run: SourceRun = { id: 'run', source: 'openmap', fetchedAt: '2026-10-18T15:00:00Z', query: 'restaurant Bogotá', dataClass: 'live', status: 'success', received: 1, newUnique: 0, merged: 0, review: 0, url: 'https://overpass-api.de/api/interpreter', attribution: '© OpenStreetMap contributors · ODbL' };
const payload = { elements: [{ type: 'node', id: 123, tags: { name: 'Empresa pública', amenity: 'restaurant', 'addr:street': 'Calle 10', 'addr:housenumber': '20', 'addr:city': 'Bogotá', 'contact:phone': '+57 601 1234567', 'contact:email': 'ventas@example.org', website: 'https://example.org' } }] };
afterEach(() => vi.unstubAllGlobals());
describe('file-free public business lookup', () => {
  it('queries United States and Latin America without a CSLB file', () => {
    expect(openMapQuery(icp)).toContain('["ISO3166-1"="CO"]');
    expect(openMapQuery({ ...icp, city: 'Miami', country: 'US' })).toContain('["ISO3166-1"="US"]');
    expect(openMapQuery(icp)).toContain('["amenity"="restaurant"]');
  });
  it('escapes city syntax and rejects unsupported countries', () => {
    expect(openMapQuery({ ...icp, city: 'A";out;' })).toContain('A\\";out;');
    expect(() => openMapQuery({ ...icp, country: 'XX' })).toThrow();
  });
  it('keeps real company address phone email and individual source URL', () => {
    const lead = mapOpenMap(payload, icp, run)[0];
    expect(lead?.name).toBe('Empresa pública'); expect(lead?.address).toBe('Calle 10 20');
    expect(lead?.phone).toBe('+57 601 1234567'); expect(lead?.email).toBe('ventas@example.org');
    expect(lead?.provenance[0]?.url).toBe('https://www.openstreetmap.org/node/123');
    if (!lead) throw new Error('Missing test lead');
    expect(contactCompleteness(lead).complete).toBe(true); expect(evaluateICP(lead, icp).status).toBe('match');
    expect(lead.naics).toBeUndefined(); expect(lead.active).toBeUndefined();
  });
  it('never fills missing contact or city from search inputs', () => {
    const lead = mapOpenMap({ elements: [{ type: 'way', id: 456, tags: { name: 'Otra empresa', amenity: 'restaurant' } }] }, {...icp,requireContact:false}, run)[0];
    if (!lead) throw new Error('Missing test lead');
    expect(lead.city).toBeUndefined(); expect(lead.phone).toBeUndefined(); expect(lead.email).toBeUndefined();
    expect(contactCompleteness(lead).missing).toEqual(['dirección', 'teléfono', 'correo']);
    expect(evaluateICP(lead, icp).status).not.toBe('match');
  });
  it('rejects runtime error payloads rather than treating partial results as success', () => {
    expect(() => mapOpenMap({ ...payload, remark: 'runtime timeout' }, icp, run)).toThrow();
  });
  it('supports architecture engineering gaming aesthetics and law firm source tags', () => {
    for(const id of ['architecture','engineering','gaming','aesthetics','legal']) {
      const sector=mapSectors.find(s=>s.id===id);
      expect(sector).toBeDefined();
      expect(openMapQuery({...icp,sector:id})).toContain(sector?.tags[0]?.[1]);
      expect(workspaceSchema.parse({...emptyWorkspace(),icp:{...icp,sector:id}}).icp.sector).toBe(id);
    }
  });
  it('resolves Bogotá by checked relation instead of exact boundary name', () => {
    const city=resolveMapCity([{osm_type:'relation',osm_id:7426387,name:'Bogotá ciudad',display_name:'Bogotá ciudad, Colombia',addresstype:'city',address:{country_code:'co'}}],icp);
    expect(openMapQuery(icp,city.osm_id)).toContain('area(3607426387)');
    expect(()=>resolveMapCity([],icp)).toThrow();
    expect(()=>resolveMapCity([{osm_type:'relation',osm_id:1,addresstype:'city',address:{country_code:'us'}}],icp)).toThrow();
  });
  it('excludes uncontactable records before saving when public contact is required', () => {
    expect(mapOpenMap({elements:[{type:'node',id:1,tags:{name:'Sin contacto',amenity:'restaurant'}}]},icp,run)).toEqual([]);
    expect(openMapQuery(icp,7426387)).toContain('contact:');
  });
  it('keeps geographic evidence separate from missing postal city', () => {
    const lead=mapOpenMap({elements:[{type:'node',id:1,tags:{name:'Empresa',amenity:'restaurant',phone:'+57 601 1234567','addr:full':'Calle 10'}}]},icp,run,{relationId:7426387,label:'Bogotá ciudad, Colombia'})[0];
    if(!lead)throw new Error('Missing test lead');
    expect(lead.city).toBeUndefined();
    expect(lead.searchArea?.relationId).toBe(7426387);
    expect(evaluateICP(lead,icp).status).toBe('match');
    expect(evaluateICP(lead,{...icp,city:'Medellín'}).status).toBe('no-match');
  });
  it('deduplicates stable source IDs even if public address is missing', () => {
    const leads = mapOpenMap(payload, icp, run);
    const w = { ...emptyWorkspace(), icp };
    const out = applySourceResult(applySourceResult(w, { leads, run }), { leads: mapOpenMap(payload, icp, { ...run, id: 'next' }), run: { ...run, id: 'next' } });
    expect(out.leads).toHaveLength(1); expect(out.leads[0]?.provenance).toHaveLength(2);
    expect(workspaceSchema.parse(out).runs[1]?.source).toBe('openmap');
  });
  it('includes known source costs in CPL without assigning zero to unknown costs', () => {
    const w = { ...emptyWorkspace(), icp, leads: mapOpenMap(payload, icp, run) };
    expect(metrics(w, '2026-10-18', '2026-10-18').sources.find(s => s.source === 'openmap')?.cpl.value).toBeNull();
    w.costs.push({ id: 'expense', target: 'openmap', dimension: 'source', date: '2026-10-18', amount: 12, currency: 'USD', note: 'Costo real de consulta y revisión', type: 'direct', complete: true, periodFrom: '2026-10-18', periodTo: '2026-10-18' });
    expect(metrics(w, '2026-10-18', '2026-10-18').sources.find(s => s.source === 'openmap')?.cpl.value).toBe(12);
  });
  it('records source failure with no synthetic fallback or invented later stages', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 406 })));
    const result = await fetchOpenMap(icp);
    expect(result.leads).toEqual([]); expect(result.run.status).toBe('error');
    const out = applySourceResult({ ...emptyWorkspace(), icp }, result);
    expect(out.runs[0]?.stages?.map(s => s.agent)).toEqual(['scout']);
    expect(out.leads).toHaveLength(0);
  });
  it('uses checked city area for the server lookup and returns only supplied public contacts', async () => {
    const fetchMock=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify([{osm_type:'relation',osm_id:7426387,name:'Bogotá ciudad',display_name:'Bogotá ciudad, Colombia',addresstype:'city',address:{country_code:'co'}}]))).mockResolvedValueOnce(new Response(JSON.stringify(payload)));
    vi.stubGlobal('fetch',fetchMock);
    const result=await fetchOpenMap({...icp,city:'Bogota'});
    expect(result.run.status).toBe('success');
    expect(result.leads[0]?.phone).toBe('+57 601 1234567');
    expect(result.leads[0]?.searchArea?.relationId).toBe(7426387);
    expect(String(fetchMock.mock.calls[1]?.[1]?.body)).toContain('3607426387');
  });
});