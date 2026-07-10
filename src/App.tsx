/**
 * Shell de la aplicación.
 * Fase 1 del roadmap: Home → grilla del álbum → stats → trade.
 */
import { useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import type { AlbumDefinition, Collection, CollectionStats } from '@core/types';
import { computeStats } from '@core/stats';
import { parseFiguritas } from '@core/importers/figuritas';
import { getCollection, setStickerCount } from '@data/db';
import { createBackup, downloadBackup, parseBackup, restoreBackup } from '@data/backup';
import { db } from '@data/db';
import albumData from '../albums/mundial-2026.json';

const album = albumData as AlbumDefinition;

type StickerFilter = 'all' | 'duplicates';

export default function App() {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [filter, setFilter] = useState<StickerFilter>('all');
  const [search, setSearch] = useState('');
  const fileInput = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<number | null>(null);
  const longPressTriggered = useRef(false);

  const refresh = async () => {
    const c = await getCollection(album.id);
    setCollection(c);
    setStats(computeStats(album, c));
  };

  useEffect(() => {
    void refresh();
  }, []);

  const handleExport = async () => {
    downloadBackup(await createBackup());
  };

  const handleImportFile = async (file: File) => {
    const text = await file.text();
    try {
      if (file.name.endsWith('.txt') || text.trimStart().startsWith('Figuritas')) {
        // Export de figuritas.app
        const { collection: imported, unmatched } = parseFiguritas(text, album);
        if (!window.confirm('Esto reemplazará la colección actual con la importada. ¿Continuar?')) return;
        await db.collections.put(imported);
        if (unmatched.length > 0) {
          window.alert(`Importado con ${unmatched.length} códigos no reconocidos: ${unmatched.slice(0, 10).join(', ')}${unmatched.length > 10 ? '…' : ''}`);
        }
      } else {
        // Respaldo JSON de Mi Álbum
        const backup = parseBackup(text);
        if (!window.confirm('Esto restaurará el respaldo y sobrescribirá la colección actual. ¿Continuar?')) return;
        await restoreBackup(backup);
      }
      await refresh();
    } catch (error) {
      window.alert(`No se pudo importar: ${error instanceof Error ? error.message : 'formato desconocido'}`);
    }
  };

  const changeSticker = async (index: number, delta: 1 | -1) => {
    if (!collection) return;
    const current = collection.ownedCounts[index] ?? 0;
    const next = Math.max(0, current + delta);
    await setStickerCount(album.id, index, next);
    const updated = await getCollection(album.id);
    setCollection(updated);
    setStats(computeStats(album, updated));
  };

  const clearLongPress = () => {
    if (longPressTimer.current !== null) {
      window.clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Mantener presionada una lámina (solo touch) resta una copia — atajo para
  // corregir repetidas sin recorrer todo el ciclo hacia adelante.
  const handleStickerPointerDown = (e: PointerEvent<HTMLButtonElement>, index: number) => {
    if (e.pointerType !== 'touch') return;
    longPressTriggered.current = false;
    clearLongPress();
    longPressTimer.current = window.setTimeout(() => {
      longPressTriggered.current = true;
      void changeSticker(index, -1);
    }, 500);
  };

  const handleStickerClick = (e: { ctrlKey: boolean; metaKey: boolean }, index: number) => {
    if (longPressTriggered.current) {
      longPressTriggered.current = false;
      return;
    }
    void changeSticker(index, e.ctrlKey || e.metaKey ? -1 : 1);
  };

  if (!collection || !stats) return <main className="p-8">Cargando…</main>;

  const query = search.trim().toLowerCase();
  const visibleSections = album.sections
    .map((section, sectionIndex) => {
      const stickers = section.stickers.filter((sticker) => {
        if (filter === 'duplicates' && (collection.ownedCounts[sticker.index] ?? 0) <= 1) return false;
        if (query) {
          const matchesCode = sticker.code.toLowerCase().includes(query);
          const matchesName = sticker.name?.toLowerCase().includes(query) ?? false;
          if (!matchesCode && !matchesName) return false;
        }
        return true;
      });
      return { section, stickers, sectionStats: stats.bySection[sectionIndex] };
    })
    .filter((entry) => entry.stickers.length > 0);

  const jumpToSection = (sectionId: string) => {
    document.getElementById(`section-${sectionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  let emptyMessage: string | null = null;
  if (visibleSections.length === 0) {
    if (filter === 'duplicates' && stats.duplicates === 0) {
      emptyMessage = 'Todavía no tenés láminas repetidas.';
    } else if (query) {
      emptyMessage = `No encontramos láminas para «${search.trim()}».`;
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24">
      <header className="sticky top-0 z-10 -mx-4 bg-slate-50/95 px-4 pb-3 backdrop-blur dark:bg-slate-900/95">
        <h1 className="pt-4 text-2xl font-bold">{album.name}</h1>
        <p className="text-sm opacity-70">
          {stats.owned}/{stats.total} · {Math.round(stats.progress * 100)}% ·{' '}
          {stats.duplicates} repetidas · faltan aprox. {stats.packsEstimate.min}–
          {stats.packsEstimate.max} sobres
        </p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => void handleExport()}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium"
          >
            ⬇️ Guardar respaldo
          </button>
          <button
            onClick={() => fileInput.current?.click()}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium"
          >
            ⬆️ Importar (respaldo o figuritas.app)
          </button>
          <input
            ref={fileInput}
            type="file"
            accept=".json,.txt"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImportFile(file);
              e.target.value = '';
            }}
          />
        </div>
        <div className="mt-3 flex gap-2" role="group" aria-label="Filtrar láminas">
          <button
            onClick={() => setFilter('all')}
            aria-pressed={filter === 'all'}
            className={[
              'rounded-lg border px-3 py-1.5 text-xs font-medium',
              filter === 'all' && 'border-sky-500 bg-sky-500/15',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            Todas
          </button>
          <button
            onClick={() => setFilter('duplicates')}
            aria-pressed={filter === 'duplicates'}
            className={[
              'rounded-lg border px-3 py-1.5 text-xs font-medium',
              filter === 'duplicates' && 'border-amber-500 bg-amber-500/15',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            Solo repetidas ({stats.duplicates})
          </button>
        </div>
        <div className="mt-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por código o nombre…"
            aria-label="Buscar lámina por código o nombre"
            className="w-full rounded-lg border bg-transparent px-3 py-1.5 text-sm"
          />
        </div>
        <nav
          aria-label="Saltar a sección"
          className="mt-3 flex gap-1.5 overflow-x-auto pb-1"
        >
          {visibleSections.map(({ section }) => (
            <button
              key={section.id}
              onClick={() => jumpToSection(section.id)}
              className="shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase opacity-70"
            >
              {section.id}
            </button>
          ))}
        </nav>
      </header>

      {emptyMessage ? <p className="mt-4 opacity-70">{emptyMessage}</p> : null}

      {visibleSections.map(({ section, stickers, sectionStats }) => {
        return (
          <section key={section.id} id={`section-${section.id}`} className="mb-6 scroll-mt-64">
            <h2 className="mb-2 font-semibold">
              {section.name}
              {section.group ? <span className="ml-2 text-xs opacity-60">{section.group}</span> : null}
              {sectionStats ? (
                <span className="ml-2 text-xs font-normal opacity-60">
                  {sectionStats.owned}/{sectionStats.total} · {Math.round(sectionStats.progress * 100)}%
                </span>
              ) : null}
            </h2>
            <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
              {stickers.map((sticker) => {
                const count = collection.ownedCounts[sticker.index] ?? 0;
                return (
                  <button
                    key={sticker.index}
                    onClick={(e) => handleStickerClick(e, sticker.index)}
                    onPointerDown={(e) => handleStickerPointerDown(e, sticker.index)}
                    onPointerUp={clearLongPress}
                    onPointerLeave={clearLongPress}
                    onContextMenu={(e) => e.preventDefault()}
                    title="Clic: sumar · Ctrl/Cmd+clic o mantener presionada: restar"
                    aria-label={`${sticker.code}: ${count === 0 ? 'no la tengo' : count === 1 ? 'la tengo' : `repetida ×${count - 1}`}`}
                    className={[
                      'min-h-11 rounded-lg border p-1 text-xs font-medium transition',
                      count === 0 && 'border-dashed opacity-50',
                      count === 1 && 'border-emerald-500 bg-emerald-500/15',
                      count > 1 && 'border-amber-500 bg-amber-500/15',
                      sticker.special && 'ring-1 ring-sky-400',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    {sticker.code}
                    {count > 1 ? <span className="block text-[10px]">+{count - 1}</span> : null}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })}
    </main>
  );
}
