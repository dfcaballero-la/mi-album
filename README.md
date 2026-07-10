# Mi Álbum 📒⚽

> Gestor open source de colecciones de láminas: registra tu álbum, controla faltantes y repetidas, e intercambia inteligentemente con amigos.

**Estado:** 🏗️ En desarrollo activo · **Licencia:** MIT · **Demo:** [dfcaballero-la.github.io/mi-album](https://dfcaballero-la.github.io/mi-album/)

---

## ¿Por qué existe?

Millones de familias llenan álbumes de láminas (Mundial, Pokémon, y más) con lápiz, papel y listas de WhatsApp. Mi Álbum digitaliza ese ritual sin quitarle la magia: sabes exactamente qué te falta, qué tienes repetido, y con quién conviene intercambiar.

Nació de un álbum real: el del Mundial 2026 que lleno junto a mi hijo Iñaki. Su primer usuario, tester y product owner tiene 8 años.

## Características (MVP)

- ✅ **Tracking completo**: marca láminas obtenidas, faltantes y repetidas con contador (clic suma, Ctrl/Cmd+clic o mantener presionada resta).
- 🔍 **Grilla usable con 980+ láminas**: buscador por código/nombre, salto rápido a sección, header con progreso siempre visible, filtro "solo repetidas".
- 📊 **Estadísticas**: % de avance global y por sección, estimación de sobres restantes.
- 🔁 **Intercambio con QR**: generá tu código, escaneá el de un amigo con la cámara (o pegalo a mano) y confirmá el trueque óptimo que calcula `trade-matcher` — sin servidor ni cuentas.
- 💬 **Compartir por WhatsApp/Instagram**: exportá tus repetidas o faltantes como texto (con banderas de país) para gente que no tiene la app instalada.
- 📱 **PWA offline-first**: funciona sin conexión, instalable en el teléfono, tus datos viven en tu dispositivo.
- 🗂️ **Álbumes definidos por datos**: cualquier colección se describe en un JSON declarativo; el selector de álbum aparece solo con sumar un `albums/*.json` — la comunidad puede aportar nuevos álbumes sin tocar código.

## Stack

TypeScript · React 18 · Vite · Tailwind CSS · Dexie (IndexedDB) · Vitest · GitHub Actions · GitHub Pages

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
npm run dev              # servidor de desarrollo
npm run test             # tests unitarios (Vitest)
npm run validate:albums  # valida albums/*.json contra el schema
npm run build             # tsc + vite build
```

(`npm run test:e2e` con Playwright está en el `package.json` pero todavía no tiene config ni tests — pendiente.)

Requisitos: Node.js ≥ 20.

## Contribuir

Las contribuciones son bienvenidas — especialmente definiciones de nuevos álbumes (ver [CONTRIBUTING.md](CONTRIBUTING.md)). Busca los issues etiquetados `good first issue`.

## Licencia

[MIT](LICENSE) © David Caballero

---

*Para Iñaki, que me enseñó que un álbum no se llena: se vive.* ⭐
