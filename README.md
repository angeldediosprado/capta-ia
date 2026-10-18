# capta IA

Workspace de prospección con datos públicos empresariales, búsqueda guiada y las etapas Scout / Sorter / Check.

## Uso local

Requiere Node 22 o superior y Bun. Copia `.env.example` como `.env` únicamente en tu máquina y configura tu proyecto externo. Instala con `bun install --frozen-lockfile`, inicia con `bun run dev` y comprueba con `bun run test`.

## Publicación

Vercel usa Nitro con funciones de servidor, no un sitio estático. Consulta `DEPLOY.md` para actualizar el repositorio existente capta-ia, configurar Google y preparar el espacio privado.

## Fuentes y límites actuales

- Turismo Colombia (Registro Nacional de Turismo): búsqueda pública gratuita de restaurantes y hoteles registrados en Colombia; último periodo publicado, hasta 100 establecimientos por consulta. Bogotá restaurantes comprobado desde el editor con sesión real. Contactos publicados no equivalen a autorización publicitaria ni verificación de vigencia.
- OpenStreetMap: búsqueda implementada, pero los servidores públicos fallaron en Bogotá. No se considera fuente verificada para completar el requisito de dos fuentes útiles.
- DataSF: registros de San Francisco; no ofrece teléfono/correo en esta consulta. No sustituye una segunda fuente con contactos útiles para Bogotá.
- CSLB: importación opcional, fuera del flujo principal.
- Cámara de Pereira: sociedades BIC de Risaralda, API pública gratuita CC BY-SA 4.0, contactos comerciales; no cubre todos los negocios ni confirma actividad actual. Búsqueda combinada de restaurantes en Pereira comprobada aquí: RNT 24 + Cámara 16, 40 con dirección y teléfono, guardado y recarga. Segunda fuente de Bogotá aún pendiente. No hay conexión de pago habilitada.

## Veracidad

La demostración está separada de los datos reales. Las búsquedas fallidas nunca fabrican resultados. Se guardan procedencia, criterios y auditoría por ejecución. Los costos desconocidos aparecen como N/D; API gratuita no implica CPL total cero.

Solo se preparan borradores y se registran intentos/respuestas manuales. No hay envío automático, conexión Dapta ni calificaciones simuladas.

## Verificación de esta entrega

84 pruebas pasan en la copia externa. La compilación genera `.vercel/output` usando configuración pública de ejemplo que no se incluye en el paquete. El acceso y guardado en tu proyecto externo aún requieren comprobación en Vercel. No incluye usuarios, claves ni registros guardados en Lovable Cloud.
