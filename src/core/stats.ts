/**
 * Estadísticas de colección y estimador de sobres.
 * Módulo puro. Ver docs/DATA_MODEL.md §6 para el modelo del estimador.
 */
import type { AlbumDefinition, Collection, CollectionStats, SectionStats } from './types';

export function computeStats(album: AlbumDefinition, collection: Collection): CollectionStats {
  let owned = 0;
  let duplicates = 0;

  const bySection: SectionStats[] = album.sections.map((section) => {
    let sectionOwned = 0;
    for (const sticker of section.stickers) {
      const count = collection.ownedCounts[sticker.index] ?? 0;
      if (count > 0) {
        owned++;
        sectionOwned++;
        duplicates += count - 1;
      }
    }
    return {
      sectionId: section.id,
      name: section.name,
      total: section.stickers.length,
      owned: sectionOwned,
      progress: section.stickers.length === 0 ? 1 : sectionOwned / section.stickers.length,
    };
  });

  const total = album.totalStickers;
  const missing = total - owned;

  return {
    total,
    owned,
    missing,
    duplicates,
    progress: total === 0 ? 1 : owned / total,
    bySection,
    packsEstimate: estimatePacks(total, missing, album.packSize),
  };
}

/**
 * Estimador de sobres restantes (coupon collector adaptado).
 * Devuelve un rango honesto (±20%) — supuestos: distribución uniforme, sin intercambios.
 */
export function estimatePacks(
  totalStickers: number,
  missing: number,
  packSize: number,
): { min: number; max: number } {
  if (missing <= 0 || totalStickers <= 0 || packSize <= 0) return { min: 0, max: 0 };

  let packs = 0;
  let m = missing;
  // Cota de seguridad para evitar loops largos en álbumes gigantes casi completos.
  const maxIterations = totalStickers * 20;

  while (m > 0 && packs < maxIterations) {
    const expectedNew = Math.max(1, Math.round((packSize * m) / totalStickers));
    m -= expectedNew;
    packs++;
  }

  return {
    min: Math.max(1, Math.floor(packs * 0.8)),
    max: Math.ceil(packs * 1.2),
  };
}
