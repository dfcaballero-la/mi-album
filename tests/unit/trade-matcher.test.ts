import { describe, expect, it } from 'vitest';
import { matchTrade } from '@core/trade-matcher';
import { computeStats, estimatePacks } from '@core/stats';
import type { AlbumDefinition, Collection } from '@core/types';

const album: AlbumDefinition = {
  id: 'test-album',
  name: 'Test',
  year: 2026,
  packSize: 5,
  version: '1.0.0',
  totalStickers: 6,
  sections: [
    {
      id: 's1',
      name: 'Sección 1',
      stickers: [
        { code: 'A-1', index: 0, special: true },
        { code: 'A-2', index: 1 },
        { code: 'A-3', index: 2 },
      ],
    },
    {
      id: 's2',
      name: 'Sección 2',
      stickers: [
        { code: 'B-1', index: 3 },
        { code: 'B-2', index: 4 },
        { code: 'B-3', index: 5 },
      ],
    },
  ],
};

const collection = (ownedCounts: Record<number, number>): Collection => ({
  albumId: album.id,
  ownedCounts,
  updatedAt: new Date().toISOString(),
});

describe('matchTrade', () => {
  it('propone trueque 1:1 con repetidas que el otro necesita', () => {
    const a = collection({ 0: 2, 1: 1, 3: 1 }); // repetida: #0; faltan 2,4,5
    const b = collection({ 2: 1, 4: 2, 5: 1 }); // repetida: #4; faltan 0,1,3

    const trade = matchTrade(album, a, b);

    expect(trade.aGives.map((s) => s.index)).toEqual([0]);
    expect(trade.bGives.map((s) => s.index)).toEqual([4]);
    expect(trade.aExtras).toEqual([]);
    expect(trade.bExtras).toEqual([]);
  });

  it('no ofrece láminas que el receptor ya tiene', () => {
    const a = collection({ 0: 3 });
    const b = collection({ 0: 1 }); // ya tiene la #0

    const trade = matchTrade(album, a, b);

    expect(trade.aGives).toEqual([]);
    expect(trade.bGives).toEqual([]);
  });

  it('prioriza láminas especiales en la oferta', () => {
    const a = collection({ 0: 2, 1: 2 }); // repetidas: #0 (especial) y #1
    const b = collection({ 2: 2, 3: 2 }); // repetidas: #2 y #3; faltan 0,1,4,5

    const trade = matchTrade(album, a, b);

    expect(trade.aGives[0]?.index).toBe(0); // la especial primero
  });
});

describe('computeStats', () => {
  it('calcula progreso, faltantes y repetidas', () => {
    const stats = computeStats(album, collection({ 0: 1, 1: 3, 3: 1 }));

    expect(stats.owned).toBe(3);
    expect(stats.missing).toBe(3);
    expect(stats.duplicates).toBe(2);
    expect(stats.progress).toBeCloseTo(0.5);
    expect(stats.bySection[0]?.owned).toBe(2);
    expect(stats.bySection[1]?.owned).toBe(1);
  });
});

describe('estimatePacks', () => {
  it('devuelve 0 para colecciones completas', () => {
    expect(estimatePacks(100, 0, 5)).toEqual({ min: 0, max: 0 });
  });

  it('devuelve un rango positivo cuando faltan láminas', () => {
    const { min, max } = estimatePacks(700, 350, 5);
    expect(min).toBeGreaterThan(0);
    expect(max).toBeGreaterThanOrEqual(min);
  });
});
