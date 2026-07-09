# Mi Álbum 📒⚽

> Gestor open source de colecciones de láminas: registra tu álbum, controla faltantes y repetidas, e intercambia inteligentemente con amigos.

**Estado:** 🏗️ En desarrollo activo · **Licencia:** MIT · **Demo:** _próximamente_

---

## ¿Por qué existe?

Millones de familias llenan álbumes de láminas (Mundial, Pokémon, y más) con lápiz, papel y listas de WhatsApp. Mi Álbum digitaliza ese ritual sin quitarle la magia: sabes exactamente qué te falta, qué tienes repetido, y con quién conviene intercambiar.

Nació de un álbum real: el del Mundial 2026 que lleno junto a mi hijo Iñaki. Su primer usuario, tester y product owner tiene 8 años.

## Características (MVP)

- ✅ **Tracking completo**: marca láminas obtenidas, faltantes y repetidas con contador.
- 📊 **Estadísticas**: % de avance global y por sección, estimación de sobres restantes.
- 🔁 **Intercambio inteligente**: compara tu colección con la de un amigo (vía código/QR) y calcula el trueque óptimo.
- 📱 **PWA offline-first**: funciona sin conexión, instalable en el teléfono, tus datos viven en tu dispositivo.
- 🗂️ **Álbumes definidos por datos**: cualquier colección se describe en un JSON declarativo — la comunidad puede aportar nuevos álbumes.

## Stack

TypeScript · React 18 · Vite · Tailwind CSS · Dexie (IndexedDB) · Vitest · Playwright · GitHub Actions · GitHub Pages

Arquitectura local-first: sin backend en el MVP. Sincronización y trading en tiempo real (Supabase) planificados para v2. Ver [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Documentación

| Documento | Contenido |
|-----------|-----------|
| [docs/BRIEF.md](docs/BRIEF.md) | Brief técnico: visión, alcances, requisitos, criterios de éxito |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Arquitectura, decisiones técnicas (ADRs), estructura de módulos |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | Modelo de datos, esquema de álbumes, algoritmo de intercambio |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Fases, hitos y visión de largo plazo |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Cómo contribuir (¡incluye cómo aportar nuevos álbumes!) |

## Desarrollo

```bash
npm install
npm run dev        # servidor de desarrollo
npm run test       # tests unitarios (Vitest)
npm run test:e2e   # tests end-to-end (Playwright)
npm run build      # build de producción
```

Requisitos: Node.js ≥ 20.

## Contribuir

Las contribuciones son bienvenidas — especialmente definiciones de nuevos álbumes (ver [CONTRIBUTING.md](CONTRIBUTING.md)). Busca los issues etiquetados `good first issue`.

## Licencia

[MIT](LICENSE) © David Caballero

---

*Para Iñaki, que me enseñó que un álbum no se llena: se vive.* ⭐
