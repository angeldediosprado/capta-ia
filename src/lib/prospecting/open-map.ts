import type { ICP, Lead, SourceRun } from './types';

export const mapSectors = [
  { id: 'hvac', label: 'Climatización y plomería', tags: [['craft', 'plumber'], ['craft', 'hvac']], codes: ['238220'] },
  { id: 'electrical', label: 'Instalaciones eléctricas', tags: [['craft', 'electrician']], codes: ['238210'] },
  { id: 'restaurants', label: 'Restaurantes', tags: [['amenity', 'restaurant'], ['amenity', 'fast_food']], codes: ['722511', '722513'] },
  { id: 'architecture', label: 'Arquitectura', tags: [['office', 'architect']], codes: ['541310'] },
  { id: 'engineering', label: 'Ingeniería', tags: [['office', 'engineer']], codes: ['541330'] },
  { id: 'legal', label: 'Bufetes de abogados', tags: [['office', 'lawyer']], codes: ['541110'] },
  { id: 'aesthetics', label: 'Clínicas estéticas y belleza', tags: [['healthcare:speciality', 'plastic_surgery'], ['healthcare:speciality', 'dermatology'], ['shop', 'beauty']], codes: ['621111', '812112'] },
  { id: 'gaming', label: 'Videojuegos y entretenimiento', tags: [['shop', 'games'], ['leisure', 'amusement_arcade']], codes: ['459120', '713120'] },
  { id: 'software', label: 'Software y tecnología', tags: [['office', 'it'], ['office', 'telecommunication']], codes: ['541511'] },
  { id: 'health', label: 'Clínicas y consultorios', tags: [['amenity', 'clinic'], ['amenity', 'doctors'], ['amenity', 'dentist']], codes: ['621111', '621210'] },
  { id: 'hotels', label: 'Hoteles', tags: [['tourism', 'hotel'], ['tourism', 'guest_house']], codes: ['721110'] },
  { id: 'realestate', label: 'Inmobiliarias', tags: [['office', 'estate_agent']], codes: ['531210'] },
  { id: 'accounting', label: 'Contabilidad', tags: [['office', 'accountant'], ['office', 'tax_advisor']], codes: ['541211'] },
  { id: 'automotive', label: 'Talleres y automoción', tags: [['shop', 'car_repair'], ['shop', 'car']], codes: ['811111'] },
  { id: 'retail', label: 'Tiendas y comercios', tags: [['shop', 'supermarket'], ['shop', 'clothes'], ['shop', 'hardware']], codes: ['44'] },
  { id: 'fitness', label: 'Gimnasios', tags: [['leisure', 'fitness_centre']], codes: ['713940'] },
] as const;
export const searchCountries = [
  { code: 'US', name: 'Estados Unidos' }, { code: 'CO', name: 'Colombia' },
  { code: 'MX', name: 'México' }, { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' }, { code: 'PE', name: 'Perú' },
  { code: 'BR', name: 'Brasil' }, { code: 'EC', name: 'Ecuador' },
  { code: 'UY', name: 'Uruguay' }, { code: 'PA', name: 'Panamá' },
  { code: 'CR', name: 'Costa Rica' }, { code: 'DO', name: 'República Dominicana' },
  { code: 'GT', name: 'Guatemala' }, { code: 'BO', name: 'Bolivia' },
  { code: 'PY', name: 'Paraguay' }, { code: 'SV', name: 'El Salvador' },
  { code: 'HN', name: 'Honduras' }, { code: 'NI', name: 'Nicaragua' },
  { code: 'VE', name: 'Venezuela' }, { code: 'CU', name: 'Cuba' },
] as const;
export function sectorForICP(icp: ICP) {
  return mapSectors.find(s => s.id === icp.sector) ?? mapSectors.find(s => s.codes.some(c => icp.naics.split(',').map(v => v.trim()).includes(c)));
}
export function openMapQuery(icp: ICP, relationId?: number) {
  const sector = sectorForICP(icp);
  if (!sector) throw new Error('Elige uno de los sectores disponibles para buscar en OpenStreetMap.');
  if (!icp.city.trim() || icp.city.length > 100) throw new Error('Escribe una ciudad.');
  const country = icp.country ?? 'US';
  if (!searchCountries.some(c => c.code === country)) throw new Error('País no disponible en esta búsqueda.');
  const city = JSON.stringify(icp.city.trim());
  if (relationId !== undefined && (!Number.isSafeInteger(relationId) || relationId <= 0)) throw new Error('Área de búsqueda no válida.');
  const contact = icp.requireContact !== false ? '[~"^(contact:)?(phone|email)$"~"."]' : '';
  const selectors = sector.tags.map(([key, value]) => `nwr(area.city)["${key}"="${value}"]["name"]${contact};`).join('');
  const area = relationId ? `area(${3600000000 + relationId})->.city;` : `area["ISO3166-1"="${country}"]["admin_level"="2"]->.country;rel(area.country)["boundary"="administrative"]["name"=${city}];map_to_area->.city;`;
  return `[out:json][timeout:20];${area}(${selectors});out tags 100;`;
}
export function resolveMapCity(payload: unknown, icp: ICP) {
  if (!Array.isArray(payload)) throw new Error('No se pudo comprobar la ciudad.');
  const matches = payload.filter((row): row is { osm_id: number; name: string; display_name: string } =>
    row && typeof row === 'object' && row.osm_type === 'relation' && Number.isSafeInteger(row.osm_id) && row.osm_id > 0 &&
    ['city','town','municipality'].includes(row.addresstype) && row.address?.country_code === (icp.country ?? 'US').toLowerCase());
  if (matches.length !== 1) throw new Error(matches.length ? 'Hay varias ciudades con ese nombre. Añade el estado o departamento a la ciudad.' : 'No encontramos un área de ciudad válida. Revisa el nombre y el país.');
  const city = matches[0];
  if (!city) throw new Error('Ciudad no disponible.');
  return city;
}
export function contactCompleteness(lead: Lead) {
  const missing = [!lead.name.trim() && 'empresa', !lead.address?.trim() && 'dirección', !lead.phone?.trim() && 'teléfono', !lead.email?.trim() && 'correo'].filter((v): v is string => Boolean(v));
  return { missing, complete: missing.length === 0, contactable: Boolean(lead.phone?.trim() || lead.email?.trim()) };
}
export function mapOpenMap(payload: unknown, icp: ICP, run: SourceRun, area?: { relationId: number; label: string }): Lead[] {
  if (!payload || typeof payload !== 'object' || !('elements' in payload) || !Array.isArray(payload.elements)) throw new Error('OpenStreetMap devolvió una respuesta no válida.');
  if ('remark' in payload) throw new Error('OpenStreetMap no completó la consulta; intenta de nuevo más tarde.');
  const sector = sectorForICP(icp);
  const leads: Lead[] = [];
  for (const raw of payload.elements.slice(0, 100)) {
    if (!raw || typeof raw !== 'object') continue;
    const row = raw as { type?: string; id?: number; tags?: Record<string, unknown> };
    if (!['node', 'way', 'relation'].includes(row.type ?? '') || !Number.isSafeInteger(row.id) || !row.tags) continue;
    const tags = row.tags;
    const text = (key: string) => typeof tags[key] === 'string' ? String(tags[key]).trim() : '';
    if (!text('name') || !sector?.tags.some(([k, v]) => text(k) === v)) continue;
    const email = text('contact:email') || text('email');
    const site = text('contact:website') || text('website');
    let website: string | undefined;
    try { const url = new URL(site); if (['https:', 'http:'].includes(url.protocol)) website = url.toString(); } catch { /* Absent/invalid public website stays absent. */ }
    const address = text('addr:full') || [text('addr:street'), text('addr:housenumber')].filter(Boolean).join(' ');
    const phone = text('contact:phone') || text('phone');
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : undefined;
    if (icp.requireContact !== false && !phone && !validEmail) continue;
    const recordId = `${row.type}/${row.id}`;
    leads.push({ id: crypto.randomUUID(), name: text('name'), address: address || undefined, city: text('addr:city') || undefined,
      country: icp.country ?? 'US', mapSector: sector.id, classifications: [], phone: phone || undefined,
      searchArea: area ? { city: icp.city, relationId: area.relationId, label: area.label } : undefined,
      email: validEmail, website, createdAt: run.fetchedAt, review: false,
      provenance: [{ source: 'openmap', recordId, url: `https://www.openstreetmap.org/${recordId}`, fetchedAt: run.fetchedAt, dataClass: 'live', attribution: run.attribution, query: run.query, runId: run.id }] });
  }
  return leads;
}