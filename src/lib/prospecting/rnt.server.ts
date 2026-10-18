import type { ICP, Lead, SourceRun } from './types';
import { mapRNT, rntEndpoint, rntMonths, rntQuery, supportsRNT } from './rnt';
const fields = 'codigo_rnt,municipio,estado_rnt,razon_social_establecimiento,categoria,sub_categoria,direcci_n_comercial_establecimiento,n_m_tel_fono,num_celular,correo_establecimiento,ano,periodo';
async function read(url: URL) {
  const response = await fetch(url, { signal: AbortSignal.timeout(20000), redirect: 'error', headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('La fuente de turismo no está disponible. Intenta más tarde.');
  return response.json() as Promise<unknown>;
}
export async function fetchRNT(icp: ICP): Promise<{ leads: Lead[]; run: SourceRun }> {
  const run: SourceRun = { id: crypto.randomUUID(), source: 'rnt', fetchedAt: new Date().toISOString(), query: '', url: rntEndpoint,
    attribution: 'MinCIT · Registro Nacional de Turismo · Datos Abiertos Colombia · CC BY-SA 4.0 · https://www.datos.gov.co/d/thwd-ivmp',
    dataClass: 'live', status: 'success', received: 0, newUnique: 0, merged: 0, review: 0 };
  try {
    if (!supportsRNT(icp)) throw new Error('Esta fuente cubre restaurantes y hoteles registrados en Colombia.');
    const periodsUrl = new URL(rntEndpoint);
    periodsUrl.search = new URLSearchParams({ '$select': 'ano,periodo', '$group': 'ano,periodo', '$order': 'ano DESC', '$limit': '24' }).toString();
    const periods = await read(periodsUrl);
    if (!Array.isArray(periods)) throw new Error('No se pudo comprobar la fecha publicada de la fuente.');
    const valid = periods.filter((row): row is { ano: string; periodo: string } => row && /^\d{4}$/.test(row.ano) && rntMonths.includes(row.periodo));
    valid.sort((a,b) => b.ano.localeCompare(a.ano) || rntMonths.indexOf(b.periodo) - rntMonths.indexOf(a.periodo));
    const latest = valid[0];
    if (!latest) throw new Error('No se encontró un periodo válido en la fuente.');
    run.query = rntQuery(icp, latest.ano, latest.periodo);
    const url = new URL(rntEndpoint);
    url.search = new URLSearchParams({ '$select': fields, '$where': run.query, '$order': 'codigo_rnt ASC', '$limit': '100' }).toString();
    run.url = url.toString();
    const rows = await read(url);
    if (!Array.isArray(rows)) throw new Error('La fuente de turismo devolvió una respuesta inválida.');
    run.received = rows.length;
    const leads = mapRNT(rows, icp, run);
    run.discarded = rows.length - leads.length;
    run.query += `; periodo publicado: ${latest.periodo} ${latest.ano}; hasta 100 registros, no exhaustivo; teléfono empresarial y correos de función; sin correos personales o de notificación; contacto publicado no autoriza publicidad`;
    return { leads, run };
  } catch (error) {
    return { leads: [], run: { ...run, status: 'error', error: error instanceof Error && ['TimeoutError','AbortError'].includes(error.name) ? 'La fuente de turismo tardó demasiado. No se guardaron resultados de esta búsqueda.' : error instanceof Error ? error.message : 'No se pudo consultar la fuente de turismo.' } };
  }
}