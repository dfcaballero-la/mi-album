/**
 * Algoritmo de intercambio óptimo entre dos colecciones.
 * Módulo puro. Ver docs/DATA_MODEL.md §5.
 *
 * Estrategia: trueque 1:1 justo, priorizando láminas especiales y
 * secciones con menor avance del receptor (máximo impacto percibido).
 */
import type { AlbumDefinition, Collection, StickerDef, TradeProposal } from './types';

interface IndexedAlbum {
  byIndex: Map<number, StickerDef>;
  sectionOf: Map<number, string>;
}

function indexAlbum(album: AlbumDefinition): IndexedAlbum {
  const byIndex = new Map<number, StickerDef>();
  const sectionOf = new Map<number, string>();
  for (const section of album.sections) {
    for (const sticker of section.stickers) {
      byIndex.set(sticker.index, sticker);
      sectionOf.set(sticker.index, section.id);
    }
  }
  return { byIndex, sectionOf };
}

function missingSet(album: AlbumDefinition, c: Collection): Set<number> {
  const missing = new Set<number>();
  for (let i = 0; i < album.totalStickers; i++) {
    if ((c.ownedCounts[i] ?? 0) === 0) missing.add(i);
  }
  return missing;
}

function duplicateIndices(c: Collection): number[] {
  return Object.entries(c.ownedCounts)
    .filter(([, count]) => count > 1)
    .map(([index]) => Number(index));
}

/** % de avance por sección del receptor — para priorizar secciones rezagadas. */
function sectionProgress(album: AlbumDefinition, c: Collection): Map<string, number> {
  const progress = new Map<string, number>();
  for (const section of album.sections) {
    const owned = section.stickers.filter((s) => (c.ownedCounts[s.index] ?? 0) > 0).length;
    progress.set(section.id, section.stickers.length === 0 ? 1 : owned / section.stickers.length);
  }
  return progress;
}

export function matchTrade(
  album: AlbumDefinition,
  a: Collection,
  b: Collection,
): TradeProposal {
  const { byIndex, sectionOf } = indexAlbum(album);
  const missingA = missingSet(album, a);
  const missingB = missingSet(album, b);

  const rank = (receiver: Collection) => {
    const progress = sectionProgress(album, receiver);
    return (index: number): number => {
      const def = byIndex.get(index);
      const sectionScore = progress.get(sectionOf.get(index) ?? '') ?? 1;
      // Menor score = mayor prioridad: especiales primero, luego secciones rezagadas.
      return (def?.special ? 0 : 1) * 10 + sectionScore;
    };
  };

  const offerA = duplicateIndices(a)
    .filter((i) => missingB.has(i))
    .sort((x, y) => rank(b)(x) - rank(b)(y));
  const offerB = duplicateIndices(b)
    .filter((i) => missingA.has(i))
    .sort((x, y) => rank(a)(x) - rank(a)(y));

  const n = Math.min(offerA.length, offerB.length);
  const toDefs = (indices: number[]): StickerDef[] =>
    indices.map((i) => byIndex.get(i)).filter((d): d is StickerDef => d !== undefined);

  return {
    aGives: toDefs(offerA.slice(0, n)),
    bGives: toDefs(offerB.slice(0, n)),
    aExtras: toDefs(offerA.slice(n)),
    bExtras: toDefs(offerB.slice(n)),
  };
}
