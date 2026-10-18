export function validatePublicConfig(url: string | undefined, key: string | undefined) {
  if (!url || !key) throw new Error('Falta configurar la conexión de datos en Vercel');
  if (!url.startsWith('https://')) throw new Error('La conexión de datos debe usar HTTPS');
  if (key.startsWith('sb_secret_')) throw new Error('Una clave privada no puede usarse en el navegador');
  if (key.split('.').length === 3) {
    try {
      const payload = JSON.parse(atob(key.split('.')[1] ?? ''));
      if (payload.role === 'service_role') throw new Error('Una clave privada no puede usarse en el navegador');
    } catch (error) {
      if (error instanceof Error && error.message.includes('clave privada')) throw error;
      throw new Error('Clave pública inválida');
    }
  }
  return { url, key };
}
