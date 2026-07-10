# Roadmap — Mi Álbum

## Fase 0 — Fundación (semana 1)
- [x] Brief técnico, arquitectura y modelo de datos
- [x] Scaffold del repo: Vite + React + TS strict + Tailwind + Dexie
- [x] CI: lint, typecheck, tests, validación de schemas, build
- [x] Definición JSON del Mundial 2026 completa (980 láminas, 49 secciones)

## Fase 1 — MVP core (semanas 2-3)
- [x] Grilla de láminas por sección con estados (falta / tengo / repetida ×n)
- [x] Filtro de láminas: todas / solo repetidas
- [x] UX de grilla grande: buscador por código/nombre, chips de salto rápido a sección, header sticky con progreso (virtualización real queda pendiente si el rendimiento lo exige)
- [x] Persistencia Dexie + export/import de respaldo (JSON + importador figuritas.app)
- [x] Estadísticas: % global, % por sección y estimador de sobres
- [x] PWA: `vite-plugin-pwa` configurado (manifest + service worker autoUpdate), íconos reales generados sin assets externos (`scripts/generate-icons.mjs`); falta medir Lighthouse en producción
- [x] Selector de álbum en la UI (`src/albums.ts` descubre `albums/*.json` automáticamente vía `import.meta.glob`; se oculta si solo hay uno cargado). Colección y elección de álbum activo persisten por separado en Dexie — listo para que la comunidad sume álbumes solo con un PR de datos
- [ ] **Hito: Iñaki empieza a usarlo con su álbum real** 🎯

## Fase 2 — Intercambio (semana 4)
- [x] Codec compacto (bitset + deflate + base64url) con tests de propiedad
- [x] Generación y lectura de QR local (`qrcode` + `jsqr`, npm, sin CDN)
- [x] `trade-matcher` con priorización (especiales, secciones rezagadas)
- [x] Pantalla de propuesta de trueque bilateral (`src/TradeScreen.tsx`): mostrar/escanear código, ver propuesta, confirmar — actualiza la colección local; requiere que ambos celulares se escaneen mutuamente (sin servidor)
- [x] Compartir listas de texto (repetidas / faltantes) por WhatsApp/Instagram vía `navigator.share` con fallback a copiar — agrupadas por sección con emoji de bandera (`core/share.ts`, `core/flags.ts`), para gente sin la app instalada

## Fase 3 — Lanzamiento (semanas 5-6)
- [ ] Deploy GitHub Pages + dominio
- [ ] Lighthouse ≥ 95 en Performance/A11y/PWA
- [ ] i18n EN, README EN
- [ ] Release v1.0.0 + post de lanzamiento (LinkedIn, X, dev.to, Show HN)
- [ ] Issues `good first issue` para nuevos álbumes de la comunidad

## v2 — Visión (post-MVP)
- Sync opcional multi-dispositivo (Supabase, cuentas anónimas)
- Salas de intercambio en tiempo real (curso, familia)
- Matching multi-parte (círculos de 3+ coleccionistas)
- Catálogo comunitario de álbumes con CI de validación
- Modo "carrera" entre amigos

## Principios de priorización
1. Lo que Iñaki necesita para su álbum real gana siempre.
2. Offline y privacidad no se negocian.
3. Cada fase termina con algo desplegado y usable, no con ramas a medias.
