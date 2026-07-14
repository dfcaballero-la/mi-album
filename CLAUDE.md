# CLAUDE.md — Guía para agentes

## Qué es este proyecto

Mi Álbum: PWA open source para gestionar colecciones de láminas (álbum Mundial 2026 y futuros). Local-first: los datos viven en IndexedDB del dispositivo, sin backend ni cuentas en el MVP. Creado por David Caballero; el usuario cero es su hijo Iñaki (8 años) — **si un niño de 8 años no puede usarlo solo, no está terminado**.

Lee antes de tocar código: `docs/BRIEF.md` (alcances y requisitos), `docs/ARCHITECTURE.md` (ADRs), `docs/DATA_MODEL.md` (modelo y algoritmos), `docs/ROADMAP.md` (fases).

## Comandos

```bash
npm run dev              # servidor de desarrollo
npm run lint             # ESLint 9 (flat config, sin plugin react-hooks)
npx tsc --noEmit         # typecheck (strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes)
npm run test             # Vitest + cobertura (core/ debe mantener ≥80%)
npm run test:e2e         # Playwright — arma su propio build+preview en :4173/mi-album/
npm run validate:albums  # valida albums/*.json contra schema e invariantes
npm run build            # tsc + vite build
```

`npm run test:e2e` requiere haber corrido `npx playwright install --with-deps chromium` una vez.

CI (`.github/workflows/ci.yml`): lint + typecheck + tests + validate + build + e2e en cada push; deploy a GitHub Pages en merge a `main`. Producción: https://dfcaballero-la.github.io/mi-album/

## Reglas de arquitectura (no negociables)

1. **`src/core/` es puro**: TypeScript sin React, sin browser APIs (excepción documentada: codec usa CompressionStream, disponible en Node ≥18 y browsers). Toda lógica de negocio va aquí, con tests.
2. **Local-first**: ninguna funcionalidad del MVP puede requerir red. La v2 añade sync *opcional* sin romper el modo local.
3. **Privacidad**: cero telemetría, cero trackers, apto para menores. Los payloads de intercambio no llevan datos personales.
4. **Propiedad intelectual**: los JSON de álbumes solo contienen datos fácticos (códigos, números, nombres). Nunca imágenes, logos ni arte de Panini u otros.
5. **Álbumes = datos**: la app es un motor genérico; los álbumes se definen en `albums/*.json` validados por `album.schema.json` (índices contiguos 0..N-1, códigos únicos, totalStickers exacto).
6. Conventional Commits. TS strict sin `any`. Cambios de UI con screenshot en el PR.

## Estado actual (julio 2026)

Hecho: grilla por secciones con ciclo de estados (falta→tengo→repetida×n, click suma / Ctrl-Cmd+click o mantener presionada resta), filtros todas/solo-repetidas/faltantes, buscador por país (sin tildes, en ambos idiomas) + código + nombre, salto rápido a sección + header sticky, % por sección, stats + estimador de sobres (coupon collector, `core/stats.ts`), codec compacto para QR (`core/codec.ts`), matcher de intercambio 1:1 con priorización (`core/trade-matcher.ts`), pantalla de intercambio con QR real (`qrcode`+`jsqr`, `src/TradeScreen.tsx`), compartir listas de repetidas/faltantes por WhatsApp con banderas emoji (`core/share.ts`, `core/flags.ts`), importador de figuritas.app (`core/importers/figuritas.ts`), export/import de respaldo en UI (con `navigator.share`/AirDrop), selector de álbum (`src/albums.ts`, oculto si hay uno solo), i18n ES/EN (`core/i18n.ts` + hook `useLocale`, toggle en el header, persiste en Dexie; nombres de país/grupo en `core/section-names.ts`), PWA instalable con íconos generados sin assets externos (`scripts/generate-icons.mjs`), suite e2e con Playwright cubriendo grilla/trueque/respaldo/idioma (`tests/e2e/`, corre en CI), álbum real de 980 láminas (49 secciones), CI + deploy funcionando.

Pendiente de validar con el álbum físico: sección FWC asumida como 00–19; equipos asumidos 1–20 c/u.

## Backlog priorizado

v1.0.0 liberada (2026-07-12, tag + GitHub Release + CHANGELOG.md; README.md en inglés, README.es.md en español). Lo que sigue es la v2 — plan detallado en `docs/ROADMAP.md`:

1. **Sync opcional multi-dispositivo (v2.1)** — EN CURSO. Base lista: `core/sync.ts` `mergeCollections()` (last-write-wins por lámina + tombstones, puro y testeado; ver DATA_MODEL §8). Falta: cliente Supabase + auth anónima (necesita el proyecto de David), pull/push, y sync en background. Sub-pasos detallados en `docs/ROADMAP.md`.
2. **Salas de intercambio (v2.2)** (curso/familia): comparar colecciones de un grupo en tiempo real, matching multi-parte (círculos de 3+, problema de asignación — extensión de `trade-matcher`).
3. **Issues `good first issue`** para álbumes de la comunidad + post de lanzamiento (los escribe David).
4. **App móvil nativa**: evaluada y pospuesta — si se retoma, es Capacitor sobre esta misma base, nunca una app paralela; gatillos de reevaluación documentados en el ROADMAP.
5. **Virtualización real de la grilla** si el rendimiento lo llega a exigir (hoy CSS grid nativo con 980 ítems anda fluido).
6. *(Opcional, no bloqueante)* `unused-javascript` en el audit de Lighthouse marca ~61 KiB sin usar (probablemente de `qrcode`/`jsqr`, cargados siempre aunque el usuario nunca abra Intercambiar) — candidato a lazy-load de `TradeScreen` con `React.lazy` si se quiere afinar el performance score más allá de 97.

**Hito Iñaki:** en curso — ya usa la app con su colección real en su dispositivo (desde 2026-07-12). El BRIEF pide "una semana de uso sostenido e independiente" para darlo por cumplido.

## Trampas conocidas

- ESLint 9 flat config **sin** `eslint-plugin-react-hooks`: no uses `eslint-disable` de reglas react-hooks (rompió el CI una vez).
- `exactOptionalPropertyTypes` está activo: los props opcionales requieren spread condicional (`...(cond ? { x } : {})`).
- TS 5.7: los helpers de bytes usan `Uint8Array<ArrayBuffer>` explícito (ver `codec.ts`).
- Los álbumes se descubren solos vía `import.meta.glob('../albums/*.json')` en `src/albums.ts` (excluye `*.schema.json`); si agregás un álbum nuevo solo con el JSON alcanza, no hay que tocar `App.tsx`. Requiere `src/vite-env.d.ts` con `/// <reference types="vite/client" />` para que `import.meta.glob` tipe bien.
- El álbum activo y la colección de cada álbum se persisten por separado en Dexie (`settings` para la elección activa, `collections` keyed por `albumId`); si cambias ese esquema, actualizá `getActiveAlbumId`/`setActiveAlbumId` en `data/db.ts`.
- Vitest usa la config de `vite.config.ts` (importada desde `vitest/config`); los alias `@core/@data/@ui` viven ahí y en `tsconfig.json`.
- **macOS + Playwright**: `locator.click({ modifiers: ['Control'] })` en un `<button>` dispara `contextmenu` en vez de `click` (convención del SO: Ctrl+clic = clic secundario), así que nunca llega el evento que resta una repetida. En `tests/e2e/` se usa `modifiers: ['Meta']` (Cmd) para probar esa rama, que sí produce un `click` normal en cualquier plataforma. CI corre en `ubuntu-latest`, donde Ctrl+clic sí es un click común — el problema es solo al correr los e2e en una Mac local.
- Los tests e2e (`tests/e2e/*.spec.ts`) importan módulos de `src/core/` con rutas relativas (no los alias `@core/*`, que Playwright no resuelve) y los JSON de álbum con `import ... from '...' with { type: 'json' }` (requerido por el loader ESM de Node, a diferencia de Vite/Vitest que no lo exige).
- **i18n cubre la UI, no las excepciones de `core/`**: los `throw new Error(...)` de `codec.ts`, `backup.ts` y `figuritas.ts` (versión de código no soportada, respaldo inválido, etc.) siguen hardcodeados en español. `App.tsx`/`TradeScreen.tsx` traducen el texto que ENVUELVE al error (`t.importFlow.error(...)`, fallback `t.trade.invalidCode`) pero no el `error.message` en sí si viene de una excepción de `core/`. Si se necesita traducir eso también, esas funciones van a necesitar recibir `locale` igual que `formatShareList`.
- `playwright.config.ts` fija `use.locale = 'es-AR'` a propósito: sin eso, `navigator.language` del Chromium de CI podría no ser español y `useLocale` arrancaría la app en inglés, rompiendo las aserciones de texto en español de los demás specs.
- **No intentar traspaso de colección completa por QR**: medido con la colección real (jul 2026, 564/980) el código ya genera un QR versión 21; con el álbum completo y repetidas realistas llega a versión 38, y con muchas repetidas directamente `qrcode` lo rechaza ("data too big"). El traspaso entre dispositivos va por respaldo JSON (`shareOrDownloadBackup` en `data/backup.ts`: `navigator.share` con archivo → AirDrop en iOS/iPadOS, fallback a descarga). El QR es solo para intercambio, donde el payload es chico.
- Los nombres de país en inglés viven en `core/section-names.ts` keyed por id de sección (los `section.name` del JSON están en español y son la fuente primaria). Si se agrega un álbum nuevo, sus secciones caen al nombre del JSON en EN salvo que se amplíe el mapa; para el Mundial 2026 hay un test de invariante (`tests/unit/section-names.test.ts`) que falla si falta alguna. La búsqueda matchea nombre localizado + nombre original + id, todo normalizado sin tildes (`normalizeForSearch`).
- **`Collection.stickerUpdatedAt` (v2)**: mapa `index -> ISO` paralelo a `ownedCounts`, lo escribe `setStickerCount` (incluso al borrar → tombstone) y lo lee SOLO `core/sync.ts` para el merge. El resto de la app (codec, stats, trade-matcher, share) ignora ese campo y sigue leyendo `ownedCounts` — no lo rompas asumiendo que `ownedCounts` y `stickerUpdatedAt` tienen las mismas claves: un tombstone es una clave en `stickerUpdatedAt` que NO está en `ownedCounts`. No requiere bump de versión de Dexie (es una prop no indexada). El respaldo lo serializa solo (whole-object), así que viaja entre dispositivos sin tocar `backup.ts`.
