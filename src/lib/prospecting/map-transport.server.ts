// Fixed, global public instances only. Never retry rate limits or accept partial data.
const endpoints = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
] as const;

export async function requestMap(query: string) {
  for (const [index, url] of endpoints.entries()) {
    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        body: new URLSearchParams({ data: query }),
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'capta-ia/1.0 (https://capta-ia-six.vercel.app)',
        },
        redirect: 'error',
        signal: AbortSignal.timeout(25000),
      });
    } catch {
      if (index < endpoints.length - 1) continue;
      throw new Error('El servicio de mapas no respondió. Tus empresas guardadas siguen intactas. Intenta más tarde.');
    }
    if (response.status === 429) {
      throw new Error('El servicio de mapas alcanzó su límite de consultas. Intenta más tarde; no se buscará en otro servidor para saltar ese límite.');
    }
    if (!response.ok) {
      if ((response.status >= 500 || response.status === 406) && index < endpoints.length - 1) continue;
      throw new Error('El servicio de mapas no está disponible. Tus empresas guardadas siguen intactas. Intenta más tarde.');
    }
    let payload: unknown;
    try { payload = await response.json(); }
    catch { throw new Error('El servicio de mapas devolvió una respuesta inválida. No se guardaron empresas de esta búsqueda.'); }
    if (!payload || typeof payload !== 'object' || !('elements' in payload) || !Array.isArray(payload.elements) || 'remark' in payload) {
      throw new Error('El servicio de mapas no completó la búsqueda. No se guardaron resultados parciales.');
    }
    return { payload, url };
  }
  throw new Error('El servicio de mapas no está disponible. Intenta más tarde.');
}