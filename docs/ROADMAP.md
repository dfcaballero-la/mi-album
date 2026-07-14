# Roadmap — Mi Álbum

## Fase 0 — Fundación (semana 1)
- [x] Brief técnico, arquitectura y modelo de datos
- [x] Scaffold del repo: Vite + React + TS strict + Tailwind + Dexie
- [x] CI: lint, typecheck, tests (unitarios + e2e con Playwright), validación de schemas, build
- [x] Definición JSON del Mundial 2026 completa (980 láminas, 49 secciones)

## Fase 1 — MVP core (semanas 2-3)
- [x] Grilla de láminas por sección con estados (falta / tengo / repetida ×n)
- [x] Filtro de láminas: todas / solo repetidas / faltantes
- [x] UX de grilla grande: buscador por país (con o sin tildes, en ambos idiomas), código o nombre; chips de salto rápido a sección; header sticky con progreso (virtualización real queda pendiente si el rendimiento lo exige)
- [x] Persistencia Dexie + export/import de respaldo (JSON + importador figuritas.app)
- [x] Traspaso entre dispositivos (compu→iPad): el botón de respaldo comparte el archivo por la hoja nativa del sistema (AirDrop, etc.) vía `navigator.share` con archivos, y cae a la descarga clásica en navegadores sin soporte. Se descartó hacerlo por QR: medido con la colección real, un álbum completo con repetidas no entra en un QR (la librería lo rechaza) — el QR queda para intercambios, donde el payload es chico
- [x] Estadísticas: % global, % por sección y estimador de sobres
- [x] PWA: `vite-plugin-pwa` configurado (manifest + service worker autoUpdate), íconos reales generados sin assets externos (`scripts/generate-icons.mjs`); Lighthouse en producción ver Fase 3
- [x] Selector de álbum en la UI (`src/albums.ts` descubre `albums/*.json` automáticamente vía `import.meta.glob`; se oculta si solo hay uno cargado). Colección y elección de álbum activo persisten por separado en Dexie — listo para que la comunidad sume álbumes solo con un PR de datos
- [~] **Hito: Iñaki empieza a usarlo con su álbum real** 🎯 — su colección real está en producción (564/980 al 2026-07-10) y **ya empezó a usarla en su dispositivo** (confirmado 2026-07-12). Corre la semana de uso sostenido e independiente que pide el BRIEF como criterio de éxito

## Fase 2 — Intercambio (semana 4)
- [x] Codec compacto (bitset + deflate + base64url) con tests de propiedad
- [x] Generación y lectura de QR local (`qrcode` + `jsqr`, npm, sin CDN)
- [x] `trade-matcher` con priorización (especiales, secciones rezagadas)
- [x] Pantalla de propuesta de trueque bilateral (`src/TradeScreen.tsx`): mostrar/escanear código, ver propuesta, confirmar — actualiza la colección local; requiere que ambos celulares se escaneen mutuamente (sin servidor)
- [x] Compartir listas de texto (repetidas / faltantes) por WhatsApp/Instagram vía `navigator.share` con fallback a copiar — agrupadas por sección con emoji de bandera (`core/share.ts`, `core/flags.ts`), para gente sin la app instalada

## Fase 3 — Lanzamiento (semanas 5-6)
- [x] Deploy GitHub Pages — https://dfcaballero-la.github.io/mi-album/ (dominio propio, pendiente)
- [x] Lighthouse en producción (mobile, simulado): Performance 97 · Accessibility 100 · Best Practices 100 · SEO 100 (medido 2026-07-10). La categoría "PWA" ya no existe en Lighthouse — Google la sacó; instalabilidad se verifica por manifest.webmanifest + sw.js, ya confirmados sirviendo bien
- [x] i18n ES/EN: catálogo puro en `core/i18n.ts`, hook `useLocale` (detecta `navigator.language`, persiste en Dexie), toggle en el header — cubre grilla, intercambio, listas para compartir y nombres de país/grupo (`core/section-names.ts`, con test de invariante que exige nombre EN para cada sección del álbum)
- [x] README en inglés como default del repo (`README.md`), español preservado en `README.es.md`, con links cruzados
- [x] Release v1.0.0 (tag + GitHub Release + `CHANGELOG.md`)
- [ ] Post de lanzamiento (LinkedIn, X, dev.to, Show HN) — lo escribe David
- [ ] Issues `good first issue` para nuevos álbumes de la comunidad

## v2 — Plan (post-MVP)

Orden propuesto; cada ítem es una fase entregable por sí sola, manteniendo las reglas de siempre (offline-first, IndexedDB como fuente de verdad, cero fricción para menores).

### v2.1 — Sync opcional multi-dispositivo

Supabase con cuentas anónimas (sin email ni datos personales). IndexedDB sigue siendo la fuente de verdad; el sync es una capa opcional que se activa explícitamente. Reemplaza el traspaso manual por AirDrop entre la compu y el iPad. Sub-pasos:

1. [x] **Merge por lámina (base, sin backend)** — `core/sync.ts` `mergeCollections()`, last-write-wins por lámina con tombstones para propagar borrados; `Collection.stickerUpdatedAt` y `setStickerCount` lo alimentan. Puro y testeado (`tests/unit/sync.test.ts`); sirve para cualquier backend. Ver DATA_MODEL §8.
2. [ ] **Cliente Supabase + auth anónima** — proyecto Supabase, tabla `collections` (RLS por `auth.uid()`), `signInAnonymously`. Gate: requiere la cuenta/proyecto de David.
3. [ ] **Pull/push manual** — botón "Sincronizar": baja la copia remota, `mergeCollections` con la local, sube el resultado. Vincular dispositivos por un código corto (el `uid` anónimo compartido por QR, reusando la infra de QR existente).
4. [ ] **Sync en background** — auto-sync al abrir y tras cada cambio (con debounce); indicador de estado.

### v2.2 — Salas de intercambio (curso, familia)

Comparar colecciones de un grupo en tiempo real (Supabase Realtime sobre la infra de v2.1) y proponer trueques dentro del grupo. Aquí es donde las **notificaciones push** empiezan a tener sentido (ver evaluación de app móvil).

### v2.3 — Matching multi-parte

Círculos de 3+ coleccionistas (A da a B, B da a C, C da a A) como extensión de `trade-matcher`; es un problema de asignación clásico.

### Continuas (sin bloqueo de versión)
- **Catálogo comunitario de álbumes** — la infraestructura ya existe (JSON + schema + CI + selector); falta la comunidad: issues `good first issue`, guía con ejemplos y difusión.
- **Modo "carrera"** entre amigos — quién completa primero, respetando privacidad (solo % de avance, nunca la colección detallada).

### App móvil nativa — evaluación (estilo figuritas.app)

**Decisión: no por ahora; reevaluar tras la v2.1 (sync).** Fundamento:

- Lo que una app nativa daría y hoy ya tenemos: instalable con ícono propio (PWA), offline total, cámara para QR (`getUserMedia` funciona en Safari/Chrome), compartir nativo (`navigator.share`). Lighthouse 97/100/100/100 en un CSS grid de 980 ítems — el rendimiento no lo justifica.
- Lo que sí justificaría el salto: presencia en App Store/Play Store (descubribilidad — el diferenciador real de figuritas.app), notificaciones push (para las salas de intercambio de v2.2), y menos fricción de instalación en iOS (la PWA requiere "Agregar a pantalla de inicio" manual desde Safari).
- Camino si se decide: **Capacitor** envolviendo esta misma base (cero reescritura, el core puro y la UI React se reutilizan al 100%), nunca una app paralela. Costo real: cuentas de desarrollador (USD 99/año Apple, USD 25 Google), proceso de review, y mantener releases de tienda además del deploy web.
- Gatillo para reevaluar: si las salas de intercambio (v2.2) necesitan push para ser útiles, o si la fricción de instalación iOS resulta ser una barrera real con usuarios que no son de la familia.

## Principios de priorización
1. Lo que Iñaki necesita para su álbum real gana siempre.
2. Offline y privacidad no se negocian.
3. Cada fase termina con algo desplegado y usable, no con ramas a medias.
