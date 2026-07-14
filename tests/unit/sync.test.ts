import { describe, expect, it } from 'vitest';
import { mergeCollections } from '@core/sync';
import type { Collection } from '@core/types';

const T0 = '2026-07-01T10:00:00.000Z';
const T1 = '2026-07-02T10:00:00.000Z';
const T2 = '2026-07-03T10:00:00.000Z';

function coll(
  ownedCounts: Record<number, number>,
  updatedAt: string,
  stickerUpdatedAt?: Record<number, string>,
): Collection {
  return {
    albumId: 'test',
    ownedCounts,
    updatedAt,
    ...(stickerUpdatedAt ? { stickerUpdatedAt } : {}),
  };
}

describe('mergeCollections', () => {
  it('preserva ediciones concurrentes de láminas distintas', () => {
    const a = coll({ 0: 1 }, T1, { 0: T1 });
    const b = coll({ 1: 2 }, T1, { 1: T1 });

    const merged = mergeCollections(a, b);

    expect(merged.ownedCounts).toEqual({ 0: 1, 1: 2 });
  });

  it('para la misma lámina gana el timestamp más reciente', () => {
    const a = coll({ 0: 1 }, T1, { 0: T1 });
    const b = coll({ 0: 3 }, T2, { 0: T2 });

    expect(mergeCollections(a, b).ownedCounts).toEqual({ 0: 3 });
    // Simétrico: el orden de los argumentos no cambia el resultado.
    expect(mergeCollections(b, a).ownedCounts).toEqual({ 0: 3 });
  });

  it('propaga un borrado si es más reciente (tombstone gana)', () => {
    // A todavía la tiene (marcada en T0); B la borró después (T1).
    const a = coll({ 5: 2 }, T0, { 5: T0 });
    const b = coll({}, T1, { 5: T1 });

    const merged = mergeCollections(a, b);

    expect(merged.ownedCounts[5]).toBeUndefined();
    // El tombstone se conserva para que el borrado siga ganando a futuro.
    expect(merged.stickerUpdatedAt?.[5]).toBe(T1);
  });

  it('un borrado viejo no pisa una marca más nueva', () => {
    const a = coll({}, T0, { 5: T0 }); // borrada en T0
    const b = coll({ 5: 1 }, T1, { 5: T1 }); // re-marcada en T1

    expect(mergeCollections(a, b).ownedCounts).toEqual({ 5: 1 });
  });

  it('maneja colecciones legacy sin stickerUpdatedAt (cae a updatedAt)', () => {
    const legacy = coll({ 0: 1, 1: 1 }, T1); // sin timestamps por lámina
    const fresh = coll({ 0: 3 }, T2, { 0: T2 }); // editó la 0 después

    const merged = mergeCollections(legacy, fresh);

    // La 0: fresh (T2) gana a legacy (T1). La 1: solo legacy la conoce.
    expect(merged.ownedCounts).toEqual({ 0: 3, 1: 1 });
  });

  it('en empate exacto de timestamp conserva la cuenta mayor (no pierde láminas)', () => {
    const a = coll({ 0: 1 }, T1, { 0: T1 });
    const b = coll({ 0: 4 }, T1, { 0: T1 });

    expect(mergeCollections(a, b).ownedCounts).toEqual({ 0: 4 });
  });

  it('updatedAt del resultado es el máximo de ambos', () => {
    const merged = mergeCollections(coll({}, T1), coll({}, T2));
    expect(merged.updatedAt).toBe(T2);
  });

  it('no muta las colecciones de entrada', () => {
    const a = coll({ 0: 1 }, T1, { 0: T1 });
    const b = coll({ 0: 3 }, T2, { 0: T2 });
    mergeCollections(a, b);
    expect(a.ownedCounts).toEqual({ 0: 1 });
    expect(b.ownedCounts).toEqual({ 0: 3 });
  });

  it('lanza si los álbumes no coinciden', () => {
    const a: Collection = { albumId: 'x', ownedCounts: {}, updatedAt: T1 };
    const b: Collection = { albumId: 'y', ownedCounts: {}, updatedAt: T1 };
    expect(() => mergeCollections(a, b)).toThrow(/álbumes distintos/);
  });
});
