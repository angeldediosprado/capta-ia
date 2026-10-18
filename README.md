# Entrega externa

Consulta **DEPLOY.md** para publicar este paquete en el repositorio existente capta-ia, Vercel y tu propio Supabase. Los detalles históricos de Lovable abajo describen la versión de origen, no la configuración externa.

# capta IA — Workspace de inteligencia comercial

Workspace SaaS navegable con tres agentes (Scout, Sorter, Check). La interfaz original se conserva. Los datos demo siguen separados del workspace real privado en Lovable Cloud.

## Ejecutar
```bash
bun install
bun run dev      # http://localhost:8080
bun run test     # pruebas (vitest)
```

## Estructura
```
src/
  routes/            Inicio (/), fuentes, empresas, contactos, resultados, reportes, agentes/$agent
  lib/demo-data.ts   Dataset sintético (fuentes, empresas, contactos, señales, reglas)
  lib/data-service.ts Capa de servicio: lecturas, búsqueda global, CSV. Sustituir aquí por un backend real.
  lib/visual-mode.tsx Modo visual / modo rendimiento (+ prefers-reduced-motion)
  components/brand    Logo (SVG propio), LogoMark
  components/agents   AgentCharacter, AgentCard, definiciones de agentes
  components/app      AppShell (sidebar colapsable, topbar, búsqueda global, menús)
  components/data     DataTable, SearchBar, FilterChips, EmptyState/Loading/Error, ChartPanel, MetricCard, Sparkline, Ring, DemoBadge
  components/viz      RelationshipGraph, ProvenanceFlow, ActivityTimeline, ComparisonBars, FlowStatus
  components/CinematicHero.tsx  Escena panorámica + partículas Canvas + paneles holográficos
  assets/             Renders generados: escena hero y un render por agente
```

## Sistema visual
Tokens en `src/styles.css` (oklch): fondo carbón ≈#080A0C, superficies ≈#101316/#15191D, bordes crema al 12 %, texto crema, naranja de señal ≈#FF5A24. Utilidades: `panel`, `holo`, `glow-signal`, `label-mono`, `scanline`. Tipografía Manrope + JetBrains Mono (solo metadatos).

## Vertical slice funcional
- Selección explícita Datos de demostración / Workspace real; ningún fallo cambia silenciosamente a demo.
- Inicio de sesión Google o Lovable; cada usuario tiene su workspace privado. RLS, validación y revisión optimista impiden leer otro workspace y sobrescribir cambios concurrentes.
- Fuentes: consulta DataSF real desde servidor (sin clave) y carga CSLB CSV/XLSX. Cada ejecución conserva URL, query, fecha, clase de datos, atribución, resultado/error y conteos.
- Deduplicación: licencia o account ID, después nombre + dirección exactos normalizados. Claves fuertes contradictorias o coincidencias ambiguas quedan en revisión y fuera del denominador.
- ICP editable y explicable. SF HVAC/plomería (NAICS 238220 / CSLB C-20,C-36) es provisional, no ICP oficial de Dapta. Campo ausente = información insuficiente. DataSF NAICS es autodeclarado; sin flag de estado no se confirma activo.
- Empresas: borrador no enviado, apertura tel:/web cuando exista canal público, registro manual con evidencia y fecha UTC, respuesta vinculada al intento y quién respondió, calificación manual.
- Reportes: gastos directos o tiempo humano (horas × tarifa), moneda y periodo, confirmación de completitud; CPL fuente first-touch y multi-touch, CPL canal, tasa respuesta y costo por calificado. Fórmulas y denominadores visibles, CSV con procedencia.
- Las tablas, búsqueda global, relación, procedencia y cronología leen la capa común. Diagramas limitados a 24 empresas para legibilidad; tablas y métricas no se truncan.

## Configurar y usar
1. Lovable Cloud está conectado; configuración de entorno y clientes son gestionados por la plataforma. No copiar secretos a archivos comprometidos.
2. Entrar con Google/Lovable, abrir Fuentes, confirmar términos y pulsar Consultar fuentes. DataSF consulta hasta 500 ubicaciones con orden estable. Una respuesta de 500 marca límite no exhaustivo. No hay paginación completa en esta iteración.
3. CSLB: descargar un extracto empresarial del [portal oficial](https://www.cslb.ca.gov/OnlineServices/DataPortal/ContractorList), CSV o XLSX, y elegir fecha de consulta. No subir archivos de personal ni datos sensibles. Límite 5 MB / 10.000 filas. Se conserva el nombre, fecha y registros normalizados; el binario original no se archiva.
4. Cabeceras soportadas (se ignoran espacios/mayúsculas): License Number / License No / License / LicNum; Business Name / Contractor Name / Name; Address / Address1 / Business Address / Mailing Address; City / Business City. Estas cuatro columnas son obligatorias. Opcionales Classification(s), Status / License Status, Phone / Telephone Number. Licencias se conservan como texto; revisar formato antes de importar. Estados desconocidos no se convierten en activos.
5. Revisar ICP, seleccionar empresa, guardar borrador y registrar solo acciones realmente realizadas. No hay envío automático. Registrar gasto con evidencia y periodo exacto; confirmar costos completos solo si lo son.
6. CSLB y DataSF no comparten identificador universal. No afirmar que una importación es consulta live. DataSF se atribuye a City and County of San Francisco (PDDL); revisar [políticas de datos](https://www.sfgov.org/data-policies). CSLB exige revisión de sus términos y sus estados son históricos a la fecha del archivo.

## Fórmulas y alcance
- CPL adquisición fuente = costo fuente / empresas únicas válidas ICP adquiridas en periodo. First-touch asigna cada empresa a primera fuente; multi-touch conserva todos los vínculos y no debe sumarse como total.
- CPL canal = costo canal / empresas válidas ICP con intento registrado no fallido en ese canal durante el periodo.
- Respuesta = empresas con respuesta observada vinculada a intento válido en periodo / empresas con intento válido en periodo.
- CP calificado = costos fuente + canal registrados / empresas con última calificación positiva real en periodo. Manual no equivale a Dapta. No duplicar gastos entre dimensiones.
- Sin denominador, sin costos completos, con monedas mezcladas, sin tarifa explícita o costos fuera del rango seleccionado: N/D. Costos conocidos cero deben declararse explícitamente.

## No conectado / limitaciones
- Este proyecto es independiente del ZIP Node ESM original; no comparte su server, conectores o JSON store. No se recibió ZIP en esta sesión.
- CSLB: importación manual validada; descarga automatizada no implementada ni afirmada como funcional. Falta probar con archivo oficial del evento.
- Dapta: adapter y esquema preparados, NO conectado. Faltan endpoint, credenciales, autorización y contrato request-response. Guardar credenciales solo en Project Settings → Secrets tras acordar integración.
- Outreach: proveedor no conectado. Sent/delivered requieren confirmación externa; servidor rechaza ambos estados y salida Dapta. No se automatiza contacto.
- No scraping general, enriquecimiento de teléfonos/emails, cierre de venta, reconciliación manual de identidad ni agente autónomo. Datos DataSF pueden carecer de canales públicos y estado activo. No se inventan.
- Automatización disponible: buscar, normalizar, deduplicar, evaluar ICP y preparar borradores personalizados con `{empresa}`. En Fuentes es opcional y se guarda junto con la consulta/importación; Contactos permite preparar el inventario en lote. Nunca sobrescribe borradores ni crea intentos, respuestas o envíos. Excluye demo, identidades ambiguas, ICP insuficiente y leads sin canal público. No hay ejecuciones programadas en segundo plano.
- Perfiles iniciales editables para climatización/plomería, electricidad y restaurantes de San Francisco. No son el perfil oficial del reto ni amplían la cobertura de DataSF; CSLB solo cubre contratistas de California por archivo.
- No está publicado. Los leads del evento deben consultarse/importarse en la cuenta del operador; las pruebas QA usan cuenta aislada y no son contactos reales del evento.
- Persistencia actual: documento JSON por usuario con revisión optimista; no adecuado aún para volúmenes masivos ni trabajo multiusuario compartido.

## QA
`bun run test`: dedup exacto/ambiguo, ICP ausente, cero/missing/mixta/multifuente/tiempo, estados de contacto, CSV y fallo fuente; pruebas de navegación existentes.
El entorno Lovable ejecuta build y typecheck automáticamente; verificar su diagnóstico después de cambios. No reiniciar scaffold.

## Descubrimiento guiado y agentes
- Fuentes: cuatro pasos (ICP provisional, catálogo, revisión, resultados). Ciudad y NAICS editables alimentan la consulta real; CSLB se filtra por ICP después de normalizar. Tipo empresarial obligatorio sin campo fuente produce información insuficiente. Criterios opcionales son notas para revisión humana, no evaluaciones inventadas.
- Catálogo comprobado por HTTP el 18/10/2026: DataSF JSON/metadata 200, PDDL; CSLB ContractorList 200 y descarga sin cargo declarada por el portal. Descarga CSLB automática no conectada; licencia amplia de reutilización y cuotas proveedor por validar.
- Importación CSV/XLSX: preview de cinco filas, mapeo editable, errores por fila y confirmación explícita. No se guarda ninguna fila si hay errores. XLS antiguo debe convertirse a CSV. Lector XLSX específico read-excel-file/browser; números conservados como texto, licencias con ceros iniciales deben venir como texto en el archivo. Primera hoja únicamente. No se archiva el binario.
- Cada nueva consulta/importación guarda Scout (registros/URL), Sorter (normalización, claves exactas y procedencias), Check (ICP y razones por empresa) dentro de SourceRun con snapshot ICP, inputs/outputs, eventos, IDs, fechas y estado success/partial/error. Son procesos deterministas, no IA autónoma ni resultados Dapta. Estado running se muestra únicamente durante la consulta pendiente; procesos locales breves se presentan como finalizados tras guardar. Sin consulta: idle.
- El error de una fuente conserva el inventario anterior, registra error Scout y no inventa ejecución Sorter/Check. Ejecuciones históricas anteriores sin auditoría se señalan como tales.
- Contactos expone canal público, borrador/intento/respuesta y acciones manuales. Resultados muestra conversión por etapa con denominadores y unidades; no trata llamadas como actividad de un agente. Reportes exporta dataset filtrado con clase demo/públicos, periodo, fecha exportación y procedencia de empresas.
- La elección demo/real se mantiene por sesión del navegador; la carga de datos nunca la cambia a escondidas.

QA de esta iteración: 40 pruebas aprobadas (11 nuevas), diagnóstico automático build/typecheck OK; navegador con sesión real: DataSF 329 registros, auditoría de tres etapas y persistencia tras recarga, mapeo CSV inválido bloqueado, XLSX válido con 00123 preservado (preview cancelado, no guardado), CSV público con procedencia/periodo, siete pantallas y móvil 390 px sin desbordamiento ni errores de consola. No se envió outreach ni se introdujeron leads QA sintéticos en el workspace real.

## QA de preparación de producto
46 pruebas aprobadas (6 nuevas para automatización); diagnóstico automático build OK. Consulta con sesión del operador: 329 filas recibidas, 329 coincidencias deduplicadas, inventario conservado de 257 registros. Con activo obligatorio, 0 coincidencias ICP y 0 borradores: no se inventaron contactos ni actividad. Consulta y auditoría persistieron tras recarga; preparación en lote mostró ausencia de nuevas empresas elegibles. La creación de borradores para leads elegibles se verificó con pruebas unitarias, no con un lead real contactable del evento. Navegador: Inicio, Fuentes, Empresas, Resultados, Reportes y Scout sin desbordamiento horizontal a 1280, 834 y 390 px ni errores de ejecución. Tablas largas permanecen desplazables; gráficos de relaciones muestran hasta 12 empresas y comparativas hasta 20, sin truncar exportación ni métricas. No se publicó ni se envió ningún mensaje.
