import type { ICP, Lead, SourceRun } from './types';
import { openMapQuery, mapOpenMap, resolveMapCity } from './open-map';
import { requestMap } from './map-transport.server';

// Exact city lookups are cached; never use the public geocoder for autocomplete.
const cityCache = new Map<string, { expires: number; city: ReturnType<typeof resolveMapCity> }>();
let lastGeocode = 0;
let geocodeQueue: Promise<void> = Promise.resolve();
async function locateCity(icp: ICP) {
  const key = `${icp.country??'US'}:${icp.city.trim().toLowerCase()}`;
  const cached = cityCache.get(key);
  if (cached && cached.expires > Date.now()) return cached.city;
  const previous = geocodeQueue;
  let release: (()=>void) | undefined;
  geocodeQueue = new Promise<void>(resolve => { release = resolve; });
  await previous;
  try {
    const wait = Math.max(0, 1100 - (Date.now() - lastGeocode));
    if(wait) await new Promise(resolve=>setTimeout(resolve,wait));
    lastGeocode = Date.now();
    const params = new URLSearchParams({ q: icp.city.trim(), countrycodes: (icp.country??'US').toLowerCase(), format:'jsonv2', addressdetails:'1', limit:'5' });
    const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { headers:{'User-Agent':'capta-ia/1.0 (https://capta-ia-six.vercel.app)',Accept:'application/json'},redirect:'error',signal:AbortSignal.timeout(12000) });
    if(!response.ok) throw new Error('No se pudo localizar la ciudad. Intenta de nuevo más tarde.');
    const city = resolveMapCity(await response.json(),icp);
    if(cityCache.size>=100)cityCache.clear();
    cityCache.set(key,{city,expires:Date.now()+86400000});
    return city;
  } finally { release?.(); }
}

export async function fetchOpenMap(icp: ICP): Promise<{ leads: Lead[]; run: SourceRun }> {
  const run: SourceRun = { id: crypto.randomUUID(), source: 'openmap', fetchedAt: new Date().toISOString(), query: '',
    dataClass: 'live', status: 'success', received: 0, newUnique: 0, merged: 0, review: 0,
    url: 'https://overpass-api.de/api/interpreter', attribution: '© OpenStreetMap contributors · ODbL 1.0 · https://www.openstreetmap.org/copyright' };
  try {
    run.query = openMapQuery(icp);
    const city = await locateCity(icp);
    run.query = openMapQuery(icp,city.osm_id);
    const { payload, url } = await requestMap(run.query);
    run.url = url;
    const leads = mapOpenMap(payload, icp, run, {relationId:city.osm_id,label:city.display_name});
    run.received = payload && typeof payload === 'object' && 'elements' in payload && Array.isArray(payload.elements) ? payload.elements.length : 0;
    run.discarded = run.received - leads.length;
    run.query += `; área comprobada: https://www.openstreetmap.org/relation/${city.osm_id}; ${city.display_name}; máximo 100 registros; teléfono o correo según filtro; no exhaustivo`;
    return { leads, run };
  } catch (error) {
    const message = error instanceof Error && ['TimeoutError','AbortError'].includes(error.name) ? 'La fuente tardó demasiado. La búsqueda no se completó; no significa que no existan empresas.' : error instanceof Error ? error.message : 'No se pudo consultar OpenStreetMap.';
    return { leads: [], run: { ...run, status: 'error', error: message } };
  }
}