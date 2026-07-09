/**
 * Shell de la aplicación.
 * Fase 1 del roadmap: Home → grilla del álbum → stats → trade.
 */
import { useEffect, useRef, useState } from 'react';
import type { AlbumDefinition, Collection, CollectionStats } from '@core/types';
import { computeStats } from '@core/stats';
import { parseFiguritas } from '@core/importers/figuritas';
import { getCollection, setStickerCount } from '@data/db';
import { createBackup, downloadBackup, parseBackup, restoreBackup } from '@data/backup';
import { db } from '@data/db';
import albumData from '../albums/mundial-2026.json';

const album = albumData as AlbumDefinition;

export default function App() {
  const [collection, setCollection] = useState<Collection | null>(null);
  const [stats, setStats] = useState<CollectionStats | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    const c = await getCollection(album.id);
    setCollection(c);
    setStats(computeStats(album, c));
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const cycleSticker = async (index: number) => {
    if (!collection) return;
    // Ciclo de estados: no la tengo → la tengo → repetida (+1) → ... → reset
    const current = collection.ownedCounts[index] ?? 0;
    const next = current >= 4 ? 0 : current + 1;
    await setStickerCount(album.id, index, next);
    const updated = await getCollection(album.id);
    setCollection(updated);
    setStats(computeStats(album, updated));
  };

  if (!collection || !stats) return <main className="p-8">Cargando…</main>;

  return (
    <main className="mx-auto max-w-2xl p-4 pb-24">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">{album.name}</h1>
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
      </header>

      {album.sections.map((section) => (
        <section key={section.id} className="mb-6">
          <h2 className="mb-2 font-semibold">
            {section.name}
            {section.group ? <span className="ml-2 text-xs opacity-60">{section.group}</span> : null}
          </h2>
          <div className="grid grid-cols-5 gap-2 sm:grid-cols-8">
            {section.stickers.map((sticker) => {
              const count = collection.ownedCounts[sticker.index] ?? 0;
              return (
                <button
                  key={sticker.index}
                  onClick={() => void cycleSticker(sticker.index)}
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
      ))}
    </main>
  );
}
