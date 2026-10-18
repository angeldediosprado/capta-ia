import type { ICP, Lead, SourceRun } from './types';
import { normalize } from './domain';
export const rntEndpoint = 'https://www.datos.gov.co/resource/thwd-ivmp.json';
export const rntMonths = ['ENERO','FEBRERO','MARZO','ABRIL','MAYO','JUNIO','JULIO','AGOSTO','SEPTIEMBRE','OCTUBRE','NOVIEMBRE','DICIEMBRE'];
export function supportsRNT(icp: ICP) {
  return icp.country === 'CO' && ['restaurants','hotels'].includes(icp.sector ?? '');
}
export function rntCity(city: string) {
  const folded = normalize(city);
  return ['bogota','bogota d c','bogota dc'].includes(folded) ? 'bogota' : folded;
}
export function rntQuery(icp: ICP, year: string, period: string) {
  if (!supportsRNT(icp)) throw new Error('Esta fuente cubre restaurantes y hoteles registrados en Colombia.');
  if (!/^\d{4}$/.test(year) || !rntMonths.includes(period)) throw new Error('La fecha publicada por la fuente no es válida.');
  const quote = (s: string) => s.replace(/'/g, "''");
  const city = rntCity(icp.city) === 'bogota' ? "municipio='BOGOTA D.C.'" : `upper(municipio) in ('${quote(icp.city.trim().toUpperCase())}','${quote(icp.city.normalize('NFD').replace(/\p{Diacritic}/gu,'').trim().toUpperCase())}')`;
  const category = icp.sector === 'restaurants' ? "categoria='ESTABLECIMIENTOS DE GASTRONOMÍA' AND upper(sub_categoria) like 'RESTAURANTE%'" : "categoria='ESTABLECIMIENTOS DE ALOJAMIENTO TURÍSTICO' AND sub_categoria in ('HOTEL','HOSTAL','APARTAHOTEL')";
  return `${city} AND ano='${year}' AND periodo='${period}' AND estado_rnt='ACTIVO' AND ${category}`;
}
const text = (value: unknown) => typeof value === 'string' && !['sin dato','no aplica','n/a','0'].includes(value.trim().toLowerCase()) ? value.trim() : '';
export const businessEmail = (value: unknown) => {
  const email = text(value).toLowerCase();
  const [local, domain] = email.split('@');
  // Do not collect named personal contacts or notification addresses as sales contacts.
  return local && domain && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    /^(info|contacto|contactenos|ventas|reservas|comercial|servicioalcliente|recepcion|administracion|gerencia|contabilidad)([._-][a-z0-9]+)?$/.test(local) &&
    !/^(gmail|hotmail|outlook|yahoo|live)\./.test(domain) ? email : undefined;
};
export const phone = (value: unknown) => {
  const valueText = text(value);
  const digits = valueText.replace(/\D/g, '');
  return digits.length >= 7 && digits.length <= 15 && !/^0+$/.test(digits) ? valueText : undefined;
};
export function mapRNT(payload: unknown, icp: ICP, run: SourceRun): Lead[] {
  if (!Array.isArray(payload)) throw new Error('La fuente de turismo devolvió una respuesta inválida.');
  const leads: Lead[] = [];
  for (const raw of payload.slice(0, 100)) {
    if (!raw || typeof raw !== 'object') throw new Error('La fuente de turismo devolvió un registro inválido.');
    const row = raw as Record<string, unknown>;
    const id = text(row['codigo_rnt']), name = text(row['razon_social_establecimiento']), address = text(row['direcci_n_comercial_establecimiento']), city = text(row['municipio']);
    const restaurant = row['categoria'] === 'ESTABLECIMIENTOS DE GASTRONOMÍA' && text(row['sub_categoria']).startsWith('RESTAURANTE');
    const hotel = row['categoria'] === 'ESTABLECIMIENTOS DE ALOJAMIENTO TURÍSTICO' && ['HOTEL','HOSTAL','APARTAHOTEL'].includes(text(row['sub_categoria']));
    if (!id || !name || !address || rntCity(city) !== rntCity(icp.city) || row['estado_rnt'] !== 'ACTIVO' || !(icp.sector === 'restaurants' ? restaurant : icp.sector === 'hotels' && hotel)) continue;
    const publicPhone = phone(row['n_m_tel_fono']) || phone(row['num_celular']);
    const email = businessEmail(row['correo_establecimiento']);
    if (icp.requireContact !== false && !publicPhone && !email) continue;
    leads.push({ id: crypto.randomUUID(), name, address, city, country: 'CO', mapSector: icp.sector,
      active: true, classifications: [], phone: publicPhone, email, createdAt: run.fetchedAt, review: false,
      provenance: [{ source: 'rnt', recordId: id, url: run.url, fetchedAt: run.fetchedAt, sourceUpdatedAt: run.sourceUpdatedAt,
        dataClass: 'live', attribution: run.attribution, query: `${run.query}; categoría publicada: ${text(row['categoria'])} / ${text(row['sub_categoria'])}; estado ACTIVO en ${text(row['periodo'])} ${text(row['ano'])}, no verificación actual`, runId: run.id }] });
  }
  return leads;
}