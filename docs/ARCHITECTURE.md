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

```
mi-album/
├── docs/                    # BRIEF, ARCHITECTURE, DATA_MODEL, ROADMAP
├── public/                  # estáticos, manifest PWA, iconos
├── albums/                  # definiciones JSON de álbumes + schema
│   ├── album.schema.json
│   └── mundial-2026.json
├── src/
│   ├── core/                # dominio puro (sin React, sin browser APIs)
│   │   ├── types.ts         # entidades del dominio
│   │   ├── stats.ts         # progreso, estimador de sobres
│   │   ├── trade-matcher.ts # algoritmo de intercambio óptimo
│   │   └── codec.ts         # serialización compacta para QR/string
│   ├── data/
│   │   ├── db.ts            # Dexie: esquema y acceso a IndexedDB
│   │   └── backup.ts        # export/import JSON
│   ├── ui/
│   │   ├── pages/           # Home, Album, Stats, Trade, Settings
│   │   ├── components/      # StickerGrid, SectionHeader, ProgressRing...
│   │   └── hooks/           # useAlbum, useCollection, useTrade
│   ├── i18n/                # es.json, en.json
│   ├── App.tsx
│   └── main.tsx
├── tests/
│   ├── unit/                # Vitest — core/ al 80%+
│   └── e2e/                 # Playwright — flujos críticos
├── .github/workflows/ci.yml # lint + typecheck + test + build + deploy
└── package.json
```

## Flujos críticos

1. **Marcar lámina:** tap en grilla → actualización optimista de UI → persistencia Dexie → recálculo de stats memoizado. Presupuesto: < 100 ms.
2. **Intercambio:** Pantalla Trade → "Mi código" (genera QR/string desde codec) → amigo lo importa → `trade-matcher` produce lista bilateral: *"Tú le das: #45, #112… · Él te da: #7, #203…"*.
3. **Respaldo:** Settings → Export JSON (descarga) / Import JSON (restaura, con confirmación).

## Calidad y CI

- **CI (GitHub Actions):** en cada PR — ESLint, `tsc --noEmit`, Vitest con cobertura, validación de `albums/*.json` contra el schema, build. Deploy automático a GitHub Pages en merge a `main`.
- **Convenciones:** Conventional Commits, semver, CHANGELOG generado, PRs con descripción y screenshot para cambios de UI.
