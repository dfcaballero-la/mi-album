# Mi Álbum 📒⚽

> Open-source sticker collection manager: track your album, know what's missing and duplicated, and trade smartly with friends.

**Status:** ✅ v1.0.0 · **License:** MIT · **Live demo:** [dfcaballero-la.github.io/mi-album](https://dfcaballero-la.github.io/mi-album/)

🇪🇸 [Leer en español](README.es.md)

---

## Why does this exist?

Millions of families fill sticker albums (World Cup, Pokémon, and more) with pencil, paper, and WhatsApp lists. Mi Álbum digitizes that ritual without killing the magic: you know exactly what you're missing, what you have duplicated, and who's worth trading with.

It was born from a real album: the 2026 World Cup one I'm filling with my son Iñaki. Its first user, tester, and product owner is 8 years old.

## Features (v1.0)

- ✅ **Full tracking**: mark stickers as owned, missing, or duplicated with a counter (click adds, Ctrl/Cmd+click or long-press removes).
- 🔍 **A grid that works with 980+ stickers**: search by country (accents optional), code, or name; quick jump to any section; sticky header with progress always visible; all / duplicates-only / missing filters.
- 📊 **Statistics**: overall and per-section progress, probabilistic estimate of packs left to buy.
- 🔁 **QR trading**: generate your code, scan a friend's with the camera (or paste it), and confirm the optimal 1:1 trade computed by `trade-matcher` — no server, no accounts.
- 💬 **Share via WhatsApp/Instagram**: export your duplicates or missing stickers as text (with country flag emoji) for people who don't have the app.
- 🌐 **Spanish and English**, with automatic browser-language detection.
- 📱 **Offline-first PWA**: works without a connection, installable on your phone, your data lives on your device. Backups share through AirDrop or the native share sheet.
- 🗂️ **Albums as data**: any collection is described in a declarative JSON; the album selector appears just by adding an `albums/*.json` — the community can contribute new albums without touching code.

## Stack

TypeScript · React 18 · Vite · Tailwind CSS · Dexie (IndexedDB) · Vitest · Playwright · GitHub Actions · GitHub Pages

Local-first architecture: no backend in the MVP. Optional sync and real-time trading rooms (Supabase) are planned for v2. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Documentation

Project docs are in Spanish (the primary audience is Spanish-speaking families); code and commit history are English-friendly.

| Document | Contents |
|----------|----------|
| [docs/BRIEF.md](docs/BRIEF.md) | Technical brief: vision, scope, requirements, success criteria |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Architecture, ADRs, module structure |
| [docs/DATA_MODEL.md](docs/DATA_MODEL.md) | Data model, album schema, trading algorithm |
| [docs/ROADMAP.md](docs/ROADMAP.md) | Phases, milestones, long-term vision |
| [CONTRIBUTING.md](CONTRIBUTING.md) | How to contribute (including new albums!) |

## Development

```bash
npm install
npx playwright install --with-deps chromium  # once, for e2e tests
npm run dev              # dev server
npm run test             # unit tests (Vitest)
npm run test:e2e         # end-to-end tests (Playwright, runs its own build+preview)
npm run validate:albums  # validates albums/*.json against the schema
npm run build             # tsc + vite build
```

Requires Node.js ≥ 20.

## Contributing

Contributions are welcome — especially new album definitions (see [CONTRIBUTING.md](CONTRIBUTING.md)). Look for issues labeled `good first issue`.

## License

[MIT](LICENSE) © David Caballero

---

*For Iñaki, who taught me that an album isn't filled — it's lived.* ⭐
