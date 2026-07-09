# Roadmap — Mi Álbum

## Fase 0 — Fundación (semana 1)
- [x] Brief técnico, arquitectura y modelo de datos
- [ ] Scaffold del repo: Vite + React + TS strict + Tailwind + Dexie
- [ ] CI: lint, typecheck, tests, validación de schemas, build
- [ ] Definición JSON del Mundial 2026 completa

## Fase 1 — MVP core (semanas 2-3)
- [ ] Grilla de láminas por sección con estados (falta / tengo / repetida ×n)
- [ ] Persistencia Dexie + export/import de respaldo
- [ ] Estadísticas: % global, % por sección, estimador de sobres
- [ ] PWA: manifest, service worker, instalable, offline completo
- [ ] **Hito: Iñaki empieza a usarlo con su álbum real** 🎯

## Fase 2 — Intercambio (semana 4)
- [ ] Codec compacto (bitset + deflate + base64url) con tests de propiedad
- [ ] Generación y lectura de QR local
- [ ] `trade-matcher` con priorización (especiales, secciones rezagadas)
- [ ] Pantalla de propuesta de trueque bilateral

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
