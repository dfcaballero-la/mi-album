# Arquitectura — Mi Álbum

## Visión general

Aplicación **local-first**: el estado del usuario vive en su dispositivo (IndexedDB) y la app es 100% funcional sin red. No hay backend en el MVP; el intercambio entre usuarios se resuelve con codificación compacta del estado (string base64/QR) intercambiada por cualquier canal (WhatsApp, QR presencial).

```
┌─────────────────────────────────────────────────┐
│                    UI (React)                   │
│   pages/ · components/ · hooks/ · i18n/         │
├─────────────────────────────────────────────────┤
│                 core/ (dominio puro)            │
│  types · stats · trade-matcher · codec · packs  │
│        (TypeScript puro, sin dependencias UI)   │
├─────────────────────────────────────────────────┤
│                  data/ (persistencia)           │
│   Dexie (IndexedDB) · export/import JSON        │
├─────────────────────────────────────────────────┤
│              albums/ (definiciones)             │
│   JSON declarativos validados por JSON Schema   │
└─────────────────────────────────────────────────┘
```

**Regla de dependencia:** `core/` no importa nada de `ui/` ni `data/`. Toda la lógica de negocio (estadísticas, matching de intercambios, codec) es puramente funcional y testeable sin browser.

## Decisiones de arquitectura (ADRs)

### ADR-001: Local-first sin backend en MVP
**Contexto:** el público incluye menores; cualquier backend implica cuentas, privacidad, costos y fricción de registro.
**Decisión:** IndexedDB como única fuente de verdad; sin red obligatoria.
**Consecuencias:** (+) privacidad total, cero costo de operación, offline gratis. (−) sin sync multi-dispositivo → mitigado con export/import; v2 añadirá sync opcional (Supabase) sin romper el modo local.

### ADR-002: Álbumes como datos declarativos (JSON + JSON Schema)
**Contexto:** cada colección (Mundial, Pokémon...) difiere en estructura pero no en mecánica.
**Decisión:** un álbum es un JSON que declara secciones e ítems; la app es un motor genérico. Esquema validado en CI (`album.schema.json`).
**Consecuencias:** (+) la comunidad aporta álbumes sin tocar código; longevidad del producto. (−) el JSON no incluye imágenes con copyright — solo identificadores y nombres.

### ADR-003: Intercambio por codec compacto, no por servidor
**Contexto:** el intercambio real ocurre cara a cara o por chat familiar.
**Decisión:** el estado relevante (faltantes + repetidas) se serializa a un string compacto (bitset + RLE + base64url) que cabe en un QR o mensaje. El receptor lo importa y `trade-matcher` calcula el trueque óptimo localmente.
**Consecuencias:** (+) cero infraestructura, funciona entre niños en el recreo. (−) no hay tiempo real → v2.

### ADR-004: Stack — React 18 + Vite + TypeScript strict + Tailwind + Dexie
**Contexto:** balance entre productividad, ecosistema, y objetivos de portafolio.
**Decisión:** stack mainstream moderno con tipado estricto; Dexie como capa ergonómica sobre IndexedDB; Vite PWA plugin para service worker.
**Alternativas descartadas:** Next.js (SSR innecesario para app offline), localStorage (límites de tamaño y sin índices), Redux (overkill; estado local + hooks suficiente).

### ADR-005: Estimación de sobres por modelo probabilístico
**Contexto:** "¿cuántos sobres me faltan?" es la pregunta #1 de todo coleccionista.
**Decisión:** implementar el estimador con el modelo del coleccionista de cupones (coupon collector) ajustado por tamaño de sobre y repetidas, documentado en DATA_MODEL.md.
**Consecuencias:** feature diferenciadora y excusa perfecta para hablar de matemáticas con Iñaki.

## Estructura de carpetas

Estado real (julio 2026) — `ui/`, `hooks/` e `i18n/` como carpetas separadas de la sección anterior eran aspiracionales y no se crearon: con el tamaño actual del proyecto, `App.tsx` + `TradeScreen.tsx` alcanzan sin una capa de componentes separada, y el i18n vive como un módulo puro (`core/i18n.ts`) + un hook (`useLocale.ts`) en vez de una carpeta propia. Se revisará si el proyecto crece.

```
mi-album/
├── docs/                    # BRIEF, ARCHITECTURE, DATA_MODEL, ROADMAP
├── public/icons/            # íconos PWA generados por scripts/generate-icons.mjs
├── scripts/
│   ├── validate-albums.mjs  # valida albums/*.json contra el schema
│   └── generate-icons.mjs   # genera los íconos PWA sin assets externos
├── albums/                  # definiciones JSON de álbumes + schema
│   ├── album.schema.json
│   └── mundial-2026.json
├── src/
│   ├── core/                 # dominio puro (sin React, sin browser APIs)
│   │   ├── types.ts          # entidades del dominio
│   │   ├── stats.ts          # progreso, estimador de sobres
│   │   ├── trade-matcher.ts  # algoritmo de intercambio óptimo
│   │   ├── codec.ts          # serialización compacta para QR/string
│   │   ├── share.ts          # listas de texto para compartir (WhatsApp, etc.)
│   │   ├── flags.ts          # emoji de bandera por sección
│   │   ├── i18n.ts           # catálogo de traducciones ES/EN (solo datos)
│   │   └── importers/figuritas.ts
│   ├── data/
│   │   ├── db.ts             # Dexie: esquema, acceso a IndexedDB, settings
│   │   └── backup.ts         # export/import JSON (todas las colecciones)
│   ├── albums.ts             # catálogo: descubre albums/*.json vía import.meta.glob
│   ├── useLocale.ts          # hook: detecta/persiste el idioma activo
│   ├── App.tsx                # shell: grilla, filtros, buscador, selector de álbum/idioma
│   ├── TradeScreen.tsx        # intercambio bilateral: QR, escaneo, propuesta, compartir
│   ├── RondaScreen.tsx        # ronda multi-parte: juntar códigos → círculos de trueque
│   ├── CodeScanner.tsx        # captura de código (cámara jsQR + pegar), reusado por ambos
│   ├── vite-env.d.ts
│   └── main.tsx
├── tests/
│   ├── unit/                 # Vitest — core/ al 80%+ (hoy ~99%)
│   └── e2e/                  # Playwright — flujos críticos (grilla, trueque, respaldo)
├── playwright.config.ts      # levanta build+preview en :4173 bajo /mi-album/
├── .github/workflows/ci.yml  # lint + typecheck + test + validate + build + e2e + deploy
└── package.json
```

i18n implementado sin librería externa: `core/i18n.ts` exporta un catálogo `Record<Locale, Translations>` tipado (ES/EN, TypeScript obliga a que ambos objetos tengan las mismas claves) y `useLocale.ts` decide el idioma activo (persistido en Dexie, si no hay nada guardado detecta `navigator.language`) y expone `t` para consumir en JSX. Cubre toda la UI (`App.tsx`, `TradeScreen.tsx`, `core/share.ts`); las excepciones lanzadas por `core/codec.ts`, `data/backup.ts` y `core/importers/figuritas.ts` siguen en español (ver CLAUDE.md).

## Flujos críticos

1. **Marcar lámina:** tap en grilla → suma una copia; Ctrl/Cmd+clic (desktop) o mantener presionada (mobile) resta una → persistencia Dexie → recálculo de stats. Presupuesto: < 100 ms.
2. **Intercambio (QR):** pantalla Intercambiar → "Mostrar mi código" (QR desde `encodeCollection`) → el amigo lo escanea con su cámara (`jsqr`) o pega el string → `trade-matcher` produce la propuesta bilateral → confirmar aplica el trueque a la colección local. Sin servidor: para que ambas colecciones queden al día, los dos celulares se escanean mutuamente.
3. **Compartir por texto:** misma pantalla → "Compartir repetidas/faltantes" → `formatShareList` arma un texto agrupado por sección con bandera emoji → `navigator.share` (o copiar como fallback) para WhatsApp/Instagram, sin que el destinatario necesite la app.
4. **Respaldo:** botones en el header → Exportar JSON (descarga todas las colecciones) / Importar (respaldo JSON o export de figuritas.app, con confirmación antes de sobrescribir).

## Calidad y CI

- **CI (GitHub Actions):** en cada PR — ESLint, `tsc --noEmit`, Vitest con cobertura, validación de `albums/*.json` contra el schema, build. Deploy automático a GitHub Pages en merge a `main`.
- **Convenciones:** Conventional Commits, semver, CHANGELOG generado, PRs con descripción y screenshot para cambios de UI.
