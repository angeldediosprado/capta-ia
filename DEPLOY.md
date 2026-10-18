# Publicar capta IA en Vercel con tu Supabase

## 1. Llevar esta versión a capta-ia
1. Descarga y descomprime este paquete.
2. En GitHub Desktop: File → Clone repository → URL → `https://github.com/angeldediosprado/capta-ia`.
3. Abre la carpeta clonada y copia dentro el contenido del paquete, incluidos `.gitignore` y `.env.example`. NO borres la carpeta `.git` del repositorio clonado.
4. En GitHub Desktop revisa los cambios, escribe “Preparar capta IA para Vercel”, pulsa Commit to main y Push origin.

Esto conserva el repositorio y su historial; no requiere crear otro ni hacer force push. La sincronización de Lovable sigue apuntando al repositorio nuevo, no a capta-ia. Los cambios futuros requieren trasladarse mediante una revisión/commit al repositorio elegido.

## 2. Preparar tu proyecto propio de Supabase
En tu proyecto EXTERNO, abre SQL Editor y ejecuta UNA VEZ el archivo `drizzle/migrations/0000_prospecting_workspace.sql`. Está diseñado para un proyecto sin esa tabla y función. Si ya existen, no lo ejecutes a ciegas: primero compara la estructura.

En Authentication → Sign In / Providers activa Google y configura el cliente OAuth de Google. Usa la URL de callback que muestre TU proyecto de Supabase en la configuración de Google. No copies URLs del proyecto de Lovable.

Esta versión ofrece Google. El acceso con Lovable no se transfiere. No hay registro anónimo ni confirmación automática de correo.

## 3. Importar en Vercel
Add New → Project → importa `angeldediosprado/capta-ia`.
- Framework Preset: Other.
- Node.js: 22.x.
- Install Command: `bun install --frozen-lockfile`.
- Build Command: `bun run build`.
- Output Directory: deja la detección de Nitro/Vercel; NO establezcas `dist` como sitio estático.

Añade en Environment Variables (Production y los Preview que vayas a utilizar):

| Nombre | Valor de TU proyecto externo |
| --- | --- |
| VITE_SUPABASE_URL | Project URL |
| VITE_SUPABASE_PUBLISHABLE_KEY | Publishable key (pública) |
| SUPABASE_URL | La misma Project URL |
| SUPABASE_PUBLISHABLE_KEY | La misma publishable key |

No se necesita service_role ni contraseña de base de datos para esta app. NUNCA pongas una clave secret/service_role en una variable VITE_. El paquete no contiene las credenciales originales. `.env.example` es solo una lista vacía.

Pulsa Deploy. Las variables VITE_ se incorporan al compilar: si las cambias, pulsa Redeploy.

## 4. Autorizar la dirección publicada
Copia la URL que dé Vercel. En TU Supabase → Authentication → URL Configuration, establece Site URL y añade esa dirección exacta (origen, sin rutas privadas) a Redirect URLs. Autoriza por separado las direcciones Preview necesarias; no abras comodines generales innecesarios.

## 5. Verificar antes de anunciarla
1. Abre Inicio y Reportes; comprueba las imágenes y navegación al refrescar cada dirección.
2. Entra con Google y selecciona Workspace real.
3. Busca fuentes con el perfil provisional; comprueba registros y auditoría, y recarga para comprobar que se guardaron.
4. Prueba CSV, borrador manual y exportación del inventario.
5. En una segunda cuenta, confirma que no ve los datos privados de la primera.
6. Revisa cualquier error de Vercel sin publicar claves o tokens.

## Qué incluye / qué no
- Incluye la aplicación, la misma identidad visual, fuentes/importador, auditoría, deduplicación, contacto manual, métricas y exportación.
- Demo separada y marcada; DataSF sigue siendo una consulta pública real cuando el usuario autenticado la ejecuta.
- NO incluye usuarios ni datos guardados de Lovable Cloud. La migración SQL crea estructura, no traslada cuentas, sesiones o inventarios. Si quieres conservar esos datos, hace falta una migración separada con correspondencia de usuarios; no reutilices IDs arbitrarios.
- Dapta y envíos automáticos permanecen desconectados.
- Lovable Cloud no se desconecta del proyecto del editor. Esta es una copia externa independiente.

## Verificación del paquete
51 pruebas aprobadas. Compilación externa Vercel aprobada: genera `.vercel/output` con funciones y archivos estáticos. Se usaron valores públicos ficticios exclusivamente para compilar, NO incluidos en la entrega. No se comprobó inicio de sesión, guardado ni consulta en TU Supabase/Vercel: requiere su configuración y el primer despliegue. No se ha subido código a GitHub ni publicado desde esta entrega.
