/**
 * Shell de la aplicación.
 * Fase 1 del roadmap: Home → grilla del álbum → stats → trade.
 */
import { useEffect, useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import type { Collection, CollectionStats } from '@core/types';
import { computeStats } from '@core/stats';
import { parseFiguritas } from '@core/importers/figuritas';
import { LOCALES } from '@core/i18n';
import { localizedGroup, localizedSectionName, normalizeForSearch } from '@core/section-names';
import { getActiveAlbumId, getCollection, setActiveAlbumId, setStickerCount } from '@data/db';
import { createBackup, mergeBackup, parseBackup, shareOrDownloadBackup } from '@data/backup';
import { db } from '@data/db';
import TradeScreen from './TradeScreen';
import { albums } from './albums';
import { useLocale } from './useLocale';

const DEFAULT_ALBUM_ID = albums.find((a) => a.id === 'mundial-2026')?.id ?? albums[0]?.id ?? '';

type StickerFilter = 'all' | 'duplicates' | 'missing';

export default function App() {
  const { locale, t, setLocale } = useLocale();
  const [albumId, setAlbumId] = useState(DEFAULT_ALBUM_ID);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const [filter, setFilter] = useState<StickerFilter>('all');
  const [search, setSearch] = useState('');
  const [showTrade, setShowTrade] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const longPressTimer = useRef<number | null>(null);
  const longPressTriggered = useRef(false);

  const album = albums.find((a) => a.id === albumId) ?? albums[0];

  const refresh = async () => {
    if (!album) return;
    const c = await getCollection(album.id);
    setCollection(c);
    setStats(computeStats(album, c));
  };

  useEffect(() => {
    void refresh();
  }, [albumId]);

  // Restaura el álbum elegido la última vez (si sigue existiendo en el catálogo).
  useEffect(() => {
    void (async () => {
      const saved = await getActiveAlbumId();
      if (saved && albums.some((a) => a.id === saved)) setAlbumId(saved);
    })();
  }, []);

  const switchAlbum = async (id: string) => {
    setCollection(null);
    setStats(null);
    setFilter('all');
    setSearch('');
    setAlbumId(id);
    await setActiveAlbumId(id);
  };

  if (!album) return <main className="p-8">{t.common.noAlbums}</main>;
  if (!collection || !stats) return <main className="p-8">{t.common.loading}</main>;

  const handleExport = async () => {
    await shareOrDownloadBackup(await createBackup());
  };

  const handleImportFile = async (file: File) => {
    const text = await file.text();
    try {
      if (file.name.endsWith('.txt') || text.trimStart().startsWith('Figuritas')) {
        // Export de figuritas.app
        const { collection: imported, unmatched } = parseFiguritas(text, album);
        if (!window.confirm(t.importFlow.confirmFiguritas)) return;
        await db.collections.put(imported);
        if (unmatched.length > 0) {
          window.alert(
            t.importFlow.unmatched({
              count: unmatched.length,
              codes: unmatched.slice(0, 10).join(', '),
              truncated: unmatched.length > 10,
            }),
          );
        }
      } else {
        // Respaldo JSON de Mi Álbum: se FUSIONA con lo local (no sobrescribe),
        // el camino no destructivo para poner al día dos dispositivos.
        const backup = parseBackup(text);
        if (!window.confirm(t.importFlow.confirmBackup)) return;
        await mergeBackup(backup);
      }
      await refresh();
    } catch (error) {
      window.alert(t.importFlow.error(error instanceof Error ? error.message : t.importFlow.unknownFormat));
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

  if (showTrade) {
    return (
      <TradeScreen
        album={album}
        collection={collection}
        stats={stats}
        locale={locale}
        t={t}
        onClose={() => setShowTrade(false)}
        onTradeApplied={() => void refresh()}
      />
    );
  }

  const query = normalizeForSearch(search.trim());
  const visibleSections = album.sections
    .map((section, sectionIndex) => {
      const sectionName = localizedSectionName(section, locale);
      // Buscar por país muestra la sección entera; matchea el nombre en el
      // idioma activo, el original del JSON y el id, todo sin tildes.
      const sectionMatches =
        query !== '' &&
        (normalizeForSearch(sectionName).includes(query) ||
          normalizeForSearch(section.name).includes(query) ||
          normalizeForSearch(section.id).includes(query));
      const stickers = section.stickers.filter((sticker) => {
        const count = collection.ownedCounts[sticker.index] ?? 0;
        if (filter === 'duplicates' && count <= 1) return false;
        if (filter === 'missing' && count !== 0) return false;
        if (query && !sectionMatches) {
          const matchesCode = normalizeForSearch(sticker.code).includes(query);
          const matchesName = sticker.name ? normalizeForSearch(sticker.name).includes(query) : false;
          if (!matchesCode && !matchesName) return false;
        }
        return true;
      });
      return { section, sectionName, stickers, sectionStats: stats.bySection[sectionIndex] };
    })
    .filter((entry) => entry.stickers.length > 0);

  const jumpToSection = (sectionId: string) => {
    document.getElementById(`section-${sectionId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  let emptyMessage: string | null = null;
  if (visibleSections.length === 0) {
    if (filter === 'duplicates' && stats.duplicates === 0) {
      emptyMessage = t.header.noDuplicatesYet;
    } else if (filter === 'missing' && stats.missing === 0) {
      emptyMessage = t.header.albumComplete;
    } else if (query) {
      emptyMessage = t.header.noResultsFor(search.trim());
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24">
      <header className="sticky top-0 z-10 -mx-4 bg-slate-50/95 px-4 pb-3 backdrop-blur dark:bg-slate-900/95">
        <div className="flex items-center justify-between gap-2 pt-4">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{album.name}</h1>
            {albums.length > 1 ? (
              <select
                value={album.id}
                onChange={(e) => void switchAlbum(e.target.value)}
                aria-label={t.header.chooseAlbumLabel}
                className="rounded-lg border bg-transparent px-2 py-1 text-xs font-medium"
              >
                {albums.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            ) : null}
          </div>
          <div className="flex gap-1" role="group" aria-label="Idioma / Language">
            {LOCALES.map((l) => (
              <button
                key={l}
                onClick={() => setLocale(l)}
                aria-pressed={locale === l}
                className={[
                  'rounded-lg border px-2 py-1 text-xs font-medium uppercase',
                  locale === l && 'border-sky-500 bg-sky-500/15',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
        <p className="text-sm opacity-70">
          {t.header.stats({
            owned: stats.owned,
            total: stats.total,
            progressPct: Math.round(stats.progress * 100),
            duplicates: stats.duplicates,
            packsMin: stats.packsEstimate.min,
            packsMax: stats.packsEstimate.max,
          })}
        </p>
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => setShowTrade(true)}
            className="rounded-lg border border-sky-500 bg-sky-500/15 px-3 py-1.5 text-xs font-medium"
          >
            {t.header.trade}
          </button>
          <button
            onClick={() => void handleExport()}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium"
          >
            {t.header.exportBackup}
          </button>
          <button
            onClick={() => fileInput.current?.click()}
            className="rounded-lg border px-3 py-1.5 text-xs font-medium"
          >
            {t.header.importBackup}
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
        <div className="mt-3 flex gap-2" role="group" aria-label={t.header.filterGroupLabel}>
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
            {t.header.filterAll}
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
            {t.header.filterDuplicates(stats.duplicates)}
          </button>
          <button
            onClick={() => setFilter('missing')}
            aria-pressed={filter === 'missing'}
            className={[
              'rounded-lg border px-3 py-1.5 text-xs font-medium',
              filter === 'missing' && 'border-slate-500 bg-slate-500/15',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {t.header.filterMissing(stats.missing)}
          </button>
        </div>
        <div className="mt-3">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t.header.searchPlaceholder}
            aria-label={t.header.searchLabel}
            className="w-full rounded-lg border bg-transparent px-3 py-1.5 text-sm"
          />
        </div>
        <nav aria-label={t.header.jumpNavLabel} className="mt-3 flex gap-1.5 overflow-x-auto pb-1">
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

      {visibleSections.map(({ section, sectionName, stickers, sectionStats }) => {
        return (
          <section key={section.id} id={`section-${section.id}`} className="mb-6 scroll-mt-64">
            <h2 className="mb-2 font-semibold">
              {sectionName}
              {section.group ? (
                <span className="ml-2 text-xs opacity-60">{localizedGroup(section.group, locale)}</span>
              ) : null}
              {sectionStats ? (
                <span className="ml-2 text-xs font-normal opacity-60">
                  {t.header.sectionStats({
                    owned: sectionStats.owned,
                    total: sectionStats.total,
                    progressPct: Math.round(sectionStats.progress * 100),
                  })}
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
                    title={t.sticker.tooltip}
                    aria-label={t.sticker.ariaLabel(sticker.code, count)}
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
