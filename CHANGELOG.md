# Changelog

Formato basado en [Keep a Changelog](https://keepachangelog.com/es/1.1.0/); versionado [SemVer](https://semver.org/lang/es/).

## [1.0.0] — 2026-07-12

Primera versión estable: el MVP completo del BRIEF, en producción y en uso real.

### Álbum y grilla
- Grilla por secciones con ciclo de estados: falta → tengo → repetida ×n (clic suma; Ctrl/Cmd+clic o mantener presionada resta).
- Filtros: todas / solo repetidas / faltantes.
- Buscador por país (con o sin tildes, en español e inglés), código o nombre de lámina.
- Salto rápido a sección y header sticky con progreso siempre visible.
- Estadísticas: % global, % por sección y estimador probabilístico de sobres restantes (coupon collector).
- Álbum Mundial 2026 completo: 980 láminas en 49 secciones, validado por schema en CI.

### Intercambio
- Codec compacto (bitset + deflate + base64url) para representar la colección en un QR.
- Pantalla de intercambio: mostrar mi QR, escanear el de un amigo con la cámara (o pegar el código como texto) y confirmar el trueque 1:1 óptimo que propone `trade-matcher` (prioriza láminas especiales y secciones rezagadas). Sin servidor ni cuentas.
- Compartir listas de repetidas/faltantes como texto por WhatsApp/Instagram, agrupadas por país con bandera emoji.

### Datos y plataforma
- PWA instalable y 100% offline (service worker + IndexedDB vía Dexie).
- Export/import de respaldo JSON; se comparte por AirDrop/hoja nativa (`navigator.share`) con fallback a descarga.
- Importador del formato de figuritas.app.
- Selector multi-álbum: los `albums/*.json` se descubren solos; agregar un álbum no requiere tocar código.
- i18n ES/EN completo (UI, nombres de país, grupos y listas compartidas) con detección de idioma y persistencia.

### Calidad
- `core/` puro con ~99% de cobertura (Vitest); suite e2e con Playwright (grilla, trueque, respaldo, idioma) en CI.
- Lighthouse en producción: Performance 97 · Accessibility 100 · Best Practices 100 · SEO 100.
- CI: lint + typecheck + tests + validación de álbumes + build + e2e; deploy automático a GitHub Pages.

[1.0.0]: https://github.com/dfcaballero-la/mi-album/releases/tag/v1.0.0
