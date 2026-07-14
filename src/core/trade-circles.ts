/**
 * Intercambios en círculo (multi-parte) — extensión de `trade-matcher`.
 * Módulo puro. Ver docs/DATA_MODEL.md §9.
 *
 * Muchos trueques imposibles de a dos se destraban en un círculo: A le da a B,
 * B a C, C le cierra a A. Cada uno entrega UNA repetida y recibe UNA que le
 * falta, aunque entre pares no tuvieran nada que ofrecerse. Es el problema de
 * hallar ciclos dirigidos en el grafo "X puede darle una lámina a Y".
 */
import type { AlbumDefinition, Collection, StickerDef, TradeCircle } from './types';
import { duplicateIndices, indexAlbum, makeStickerRanker, missingSet } from './trade-matcher';

export interface Participant {
  /** Identificador único y estable dentro del grupo (nombre, apodo, etc.). */
  id: string;
  collection: Collection;
}

export interface TradeCircleOptions {
  /** Mínimo de participantes por círculo. Default 3 (2 ya lo cubre el bilateral). */
  minLength?: number;
  /** Máximo de participantes por círculo (más = más difícil de coordinar). Default 4. */
  maxLength?: number;
  /** Tope de círculos devueltos, ya rankeados. Default 20. */
  maxResults?: number;
}

// Cota de seguridad para grupos grandes: no acumular más candidatos que esto
// antes de rankear (protege memoria/tiempo ante enumeraciones patológicas).
const CANDIDATE_CAP = 5000;

/**
 * Encuentra círculos de intercambio entre las colecciones del grupo, rankeados
 * (primero los más cortos —más fáciles de coordinar—, luego los que entregan
 * láminas de mayor prioridad: especiales y secciones rezagadas del receptor).
 * Cada círculo se emite una sola vez (forma canónica: arranca en el
 * participante de menor índice).
 */
export function findTradeCircles(
  album: AlbumDefinition,
  participants: Participant[],
  options: TradeCircleOptions = {},
): TradeCircle[] {
  const minLength = Math.max(2, options.minLength ?? 3);
  const maxLength = Math.max(minLength, options.maxLength ?? 4);
  const maxResults = options.maxResults ?? 20;

  const n = participants.length;
  if (n < minLength) return [];

  const indexed = indexAlbum(album);
  const missing = participants.map((p) => missingSet(album, p.collection));
  const duplicates = participants.map((p) => new Set(duplicateIndices(p.collection)));
  const rankers = participants.map((p) => makeStickerRanker(album, indexed, p.collection));

  // bestGift[i][j] = mejor lámina que i puede darle a j (repetida de i que a j
  // le falta), priorizada según lo que más le sirve a j. undefined = sin arista.
  const bestGift: (StickerDef | undefined)[][] = [];
  const giftScore: number[][] = [];
  for (let i = 0; i < n; i++) {
    const gifts = new Array<StickerDef | undefined>(n).fill(undefined);
    const scores = new Array<number>(n).fill(Infinity);
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      const rankForJ = rankers[j]!;
      const missingJ = missing[j]!;
      let bestIdx = -1;
      let bestScore = Infinity;
      for (const idx of duplicates[i]!) {
        if (!missingJ.has(idx)) continue;
        const score = rankForJ(idx);
        if (score < bestScore) {
          bestScore = score;
          bestIdx = idx;
        }
      }
      if (bestIdx >= 0) {
        gifts[j] = indexed.byIndex.get(bestIdx);
        scores[j] = bestScore;
      }
    }
    bestGift.push(gifts);
    giftScore.push(scores);
  }

  // Enumeración de ciclos dirigidos simples con DFS. La restricción `next >=
  // start` (y cerrar solo en `start`) garantiza que el nodo de menor índice sea
  // el inicio, así cada ciclo aparece una sola vez (sin rotaciones repetidas).
  const candidates: { order: number[]; score: number }[] = [];
  const path: number[] = [];
  const inPath = new Array<boolean>(n).fill(false);

  const dfs = (start: number, last: number, scoreSoFar: number): void => {
    if (candidates.length >= CANDIDATE_CAP) return;
    for (let next = start; next < n; next++) {
      if (bestGift[last]![next] === undefined) continue;
      if (next === start) {
        if (path.length >= minLength) {
          candidates.push({ order: [...path], score: scoreSoFar + giftScore[last]![start]! });
        }
        continue;
      }
      if (inPath[next] || path.length >= maxLength) continue;
      path.push(next);
      inPath[next] = true;
      dfs(start, next, scoreSoFar + giftScore[last]![next]!);
      inPath[next] = false;
      path.pop();
    }
  };

  for (let start = 0; start < n; start++) {
    path.length = 0;
    path.push(start);
    inPath.fill(false);
    inPath[start] = true;
    dfs(start, start, 0);
    if (candidates.length >= CANDIDATE_CAP) break;
  }

  candidates.sort((a, b) => a.order.length - b.order.length || a.score - b.score);

  return candidates.slice(0, maxResults).map(({ order }) => ({
    steps: order.map((from, k) => {
      const to = order[(k + 1) % order.length]!;
      return {
        from: participants[from]!.id,
        to: participants[to]!.id,
        sticker: bestGift[from]![to]!,
      };
    }),
  }));
}
