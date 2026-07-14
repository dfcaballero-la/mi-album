/**
 * Merge de dos versiones de una misma colección — base del sync opcional v2.
 * Módulo puro (sin red ni persistencia): la capa de sync trae la copia remota
 * y llama a `mergeCollections`; IndexedDB sigue siendo la fuente de verdad
 * local (ADR-001).
 *
 * Estrategia: last-write-wins POR LÁMINA usando `stickerUpdatedAt`. Esto
 * preserva ediciones concurrentes de láminas distintas (que un LWW por
 * colección perdería) y propaga borrados vía tombstones (una lámina con
 * timestamp pero sin cuenta = borrada en ese momento).
 */
import type { Collection } from './types';

/**
 * Timestamp efectivo con que una colección "conoce" una lámina, o `null` si
 * no sabe nada de ella (no puede ganar el merge). Las colecciones legacy sin
 * `stickerUpdatedAt` atribuyen a cada lámina que poseen el `updatedAt` de la
 * colección.
 */
function effectiveTimestamp(collection: Collection, index: number): string | null {
  const perSticker = collection.stickerUpdatedAt?.[index];
  if (perSticker !== undefined) return perSticker;
  if (Object.prototype.hasOwnProperty.call(collection.ownedCounts, index)) {
    return collection.updatedAt;
  }
  return null;
}

function knownIndices(collection: Collection): number[] {
  const keys = new Set<number>();
  for (const k of Object.keys(collection.ownedCounts)) keys.add(Number(k));
  if (collection.stickerUpdatedAt) {
    for (const k of Object.keys(collection.stickerUpdatedAt)) keys.add(Number(k));
  }
  return [...keys];
}

/** Máximo lexicográfico de dos ISO-8601 en UTC (equivale al cronológico). */
function maxIso(a: string, b: string): string {
  return a >= b ? a : b;
}

/**
 * Combina dos versiones de la misma colección resolviendo por lámina. No muta
 * las entradas. Lanza si son de álbumes distintos (error de programación en
 * la capa que llama).
 */
export function mergeCollections(a: Collection, b: Collection): Collection {
  if (a.albumId !== b.albumId) {
    throw new Error(`No se pueden combinar colecciones de álbumes distintos: ${a.albumId} vs ${b.albumId}`);
  }

  const ownedCounts: Record<number, number> = {};
  const stickerUpdatedAt: Record<number, string> = {};

  const indices = new Set<number>([...knownIndices(a), ...knownIndices(b)]);
  for (const index of indices) {
    const tsA = effectiveTimestamp(a, index);
    const tsB = effectiveTimestamp(b, index);
    const countA = a.ownedCounts[index] ?? 0;
    const countB = b.ownedCounts[index] ?? 0;

    let winnerCount: number;
    let winnerTs: string | null;
    if (tsA === null) {
      winnerCount = countB;
      winnerTs = tsB;
    } else if (tsB === null) {
      winnerCount = countA;
      winnerTs = tsA;
    } else if (tsA === tsB) {
      // Empate exacto de timestamp (raro con precisión de ms): no perder
      // láminas, gana la cuenta mayor.
      winnerCount = Math.max(countA, countB);
      winnerTs = tsA;
    } else if (tsA > tsB) {
      winnerCount = countA;
      winnerTs = tsA;
    } else {
      winnerCount = countB;
      winnerTs = tsB;
    }

    if (winnerCount > 0) ownedCounts[index] = winnerCount;
    // Se conserva el timestamp aunque la cuenta sea 0 (tombstone) para que un
    // borrado siga ganando en merges futuros.
    if (winnerTs !== null) stickerUpdatedAt[index] = winnerTs;
  }

  return {
    albumId: a.albumId,
    ownedCounts,
    updatedAt: maxIso(a.updatedAt, b.updatedAt),
    stickerUpdatedAt,
  };
}
