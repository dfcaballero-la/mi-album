# Brief técnico — Mi Álbum

**Versión:** 1.0 · **Fecha:** julio 2026 · **Autor:** David Caballero · **Estado:** Aprobado

---

## 1. Idea principal

Aplicación web progresiva (PWA) open source para gestionar colecciones de láminas/cromos/stickers. El usuario registra qué láminas tiene, la app le dice qué le falta, qué tiene repetido, cuánto le queda para completar, y —el diferenciador— calcula intercambios óptimos con otros coleccionistas sin necesidad de cuentas ni servidores.

**Propuesta de valor:** reemplazar la lista manuscrita y el "¿la tienes, la tienes?" del recreo por una herramienta instantánea, privada y gratuita, sin perder el componente social del intercambio cara a cara.

## 2. Contexto y oportunidad

- El Mundial 2026 (jun-jul 2026) tiene a millones de familias llenando el álbum Panini en este momento.
- Las apps existentes son cerradas, con publicidad, requieren registro y monetizan datos de menores. No existe una alternativa open source, offline y sin cuentas.
- El formato "álbum como dato" (JSON declarativo) hace la herramienta perenne: sirve para cualquier colección pasada o futura, aportada por la comunidad.

## 3. Usuarios objetivo

| Persona | Necesidad principal |
|---------|---------------------|
| Niño coleccionista (7-14) | Marcar láminas rápido, ver cuánto le falta, presumir su avance |
| Padre/madre | Controlar el gasto en sobres, coordinar intercambios, privacidad del menor |
| Coleccionista adulto | Gestión seria de colecciones múltiples, estadísticas, exportación |

**Usuario cero:** Iñaki (8 años) con el álbum del Mundial 2026. Criterio de diseño: si él no puede usarlo solo, la UX está mal.

## 4. Alcance

### 4.1 MVP (v1.0) — EN alcance

- Colección única activa por álbum; múltiples álbumes por dispositivo.
- Marcar lámina: no la tengo / la tengo / repetida (con contador de copias).
- Vista de grilla por secciones (equipos/categorías) con estados visuales claros.
- Estadísticas: % global, % por sección, faltantes totales, repetidas totales, estimación probabilística de sobres restantes.
- Intercambio offline: exportar mi estado como código compacto (string/QR), importar el de un amigo, y ver la propuesta de trueque óptimo (mis repetidas × sus faltantes y viceversa).
- Persistencia local (IndexedDB), export/import de respaldo en JSON.
- PWA instalable, 100% funcional offline, responsive mobile-first.
- Álbum inicial incluido: Mundial 2026 (definición JSON).
- i18n preparado (ES primero, EN después).

### 4.2 v2 — FUERA del alcance del MVP (planificado)

- Cuentas opcionales y sincronización multi-dispositivo (Supabase).
- Salas de intercambio en tiempo real (grupo del curso, familia).
- Catálogo comunitario de álbumes con validación de esquema en CI.
- Modo "carrera" entre amigos (quién completa primero, respetando privacidad).

### 4.3 Explícitamente fuera de alcance

- Compra/venta de láminas o cualquier transacción monetaria.
- Scraping o reproducción de imágenes con copyright (Panini u otros): las definiciones de álbum contienen solo números, nombres y metadatos, nunca las imágenes de las láminas.
- Publicidad y analítica de terceros.

## 5. Requisitos no funcionales

| Atributo | Objetivo |
|----------|----------|
| Rendimiento | TTI < 2 s en gama media; marcar una lámina < 100 ms; grillas de 700+ ítems con scroll fluido (virtualización) |
| Offline | Toda funcionalidad del MVP disponible sin red (service worker + IndexedDB) |
| Privacidad | Cero datos salen del dispositivo en el MVP; sin cookies ni trackers; apto para menores (COPPA/GDPR-K por diseño) |
| Accesibilidad | WCAG 2.1 AA; estados no dependientes solo de color; targets táctiles ≥ 44 px |
| Calidad | Cobertura de tests ≥ 80% en dominio (`core/`); CI verde obligatorio para merge; TypeScript `strict` |
| Compatibilidad | Últimas 2 versiones de Chrome/Safari/Firefox/Edge; iOS ≥ 16, Android ≥ 10 |

## 6. Criterios de éxito

1. Iñaki gestiona su álbum real sin ayuda durante una semana (test de usabilidad definitivo).
2. Lighthouse ≥ 95 en Performance, Accessibility y PWA.
3. Un tercero puede añadir un álbum nuevo solo con la guía de CONTRIBUTING, sin tocar código.
4. 100+ usuarios reales o 50+ stars en los primeros 2 meses tras el lanzamiento público.

## 7. Riesgos y mitigaciones

| Riesgo | Prob. | Impacto | Mitigación |
|--------|-------|---------|------------|
| Marcas (Panini) por propiedad intelectual | Baja | Alto | Sin imágenes ni logos oficiales; solo datos fácticos (números, nombres); disclaimer de no afiliación |
| Ventana del Mundial se cierra | Alta | Medio | Diseño genérico multi-álbum desde el día 1; el Mundial es el gancho, no el producto |
| Scope creep hacia v2 | Media | Medio | Este brief es el contrato del MVP; v2 vive solo en ROADMAP.md |
| Pérdida de datos locales (borrado de caché) | Media | Alto | Export/import de respaldo prominente en la UI; recordatorios de respaldo |

## 8. Entregables del MVP

1. App desplegada en GitHub Pages con dominio `mi-album`.
2. Repositorio público con CI (lint + typecheck + tests + build) y releases semánticas.
3. Definición JSON del Mundial 2026 validada por esquema.
4. Documentación completa (este brief, arquitectura, modelo de datos, guía de contribución).
