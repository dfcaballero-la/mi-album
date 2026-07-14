import { describe, expect, it } from 'vitest';
import { findTradeCircles, type Participant } from '@core/trade-circles';
import { matchTrade } from '@core/trade-matcher';
import type { AlbumDefinition, Collection } from '@core/types';

// Álbum de 4 láminas; la #3 es especial (para probar priorización).
const album: AlbumDefinition = {
  id: 'test',
  name: 'Test',
  year: 2026,
  packSize: 5,
  version: '1.0.0',
  totalStickers: 4,
  sections: [
    {
      id: 's',
      name: 'Sección',
      stickers: [
        { code: 'S-0', index: 0 },
        { code: 'S-1', index: 1 },
        { code: 'S-2', index: 2 },
        { code: 'S-3', index: 3, special: true },
      ],
    },
  ],
};

const coll = (id: string, ownedCounts: Record<number, number>): Participant => ({
  id,
  collection: { albumId: album.id, ownedCounts, updatedAt: '2026-07-01T00:00:00.000Z' } as Collection,
});

describe('findTradeCircles', () => {
  // Triángulo diseñado para que NINGÚN par tenga trueque bilateral posible,
  // pero el círculo A→B→C→A sí cierre.
  //  A da 0 (repetida) → B; B da 1 → C; C da 2 → A.
  //  Reversas imposibles: cada uno YA tiene la que el otro le ofrecería.
  const A = coll('Ana', { 0: 2, 1: 1 }); // repetida 0; le falta 2
  const B = coll('Beto', { 1: 2, 2: 1 }); // repetida 1; le falta 0
  const C = coll('Caro', { 2: 2, 0: 1 }); // repetida 2; le falta 1

  it('encuentra el círculo que el trueque bilateral no puede', () => {
    // Confirmamos primero que de a dos no hay nada.
    expect(matchTrade(album, A.collection, B.collection).aGives).toEqual([]);
    expect(matchTrade(album, B.collection, C.collection).aGives).toEqual([]);
    expect(matchTrade(album, C.collection, A.collection).aGives).toEqual([]);

    const circles = findTradeCircles(album, [A, B, C]);
    expect(circles).toHaveLength(1);

    const steps = circles[0]!.steps;
    expect(steps).toHaveLength(3);
    // Cada quien da lo que tiene repetido y el receptor lo necesita.
    const byFrom = Object.fromEntries(steps.map((s) => [s.from, s]));
    expect(byFrom.Ana!.to).toBe('Beto');
    expect(byFrom.Ana!.sticker.code).toBe('S-0');
    expect(byFrom.Beto!.to).toBe('Caro');
    expect(byFrom.Beto!.sticker.code).toBe('S-1');
    expect(byFrom.Caro!.to).toBe('Ana');
    expect(byFrom.Caro!.sticker.code).toBe('S-2');
  });

  it('cada paso entrega una repetida del emisor que al receptor le falta', () => {
    const circles = findTradeCircles(album, [A, B, C]);
    for (const { steps } of circles) {
      for (const step of steps) {
        const giver = [A, B, C].find((p) => p.id === step.from)!;
        const receiver = [A, B, C].find((p) => p.id === step.to)!;
        expect(giver.collection.ownedCounts[step.sticker.index]).toBeGreaterThan(1);
        expect(receiver.collection.ownedCounts[step.sticker.index] ?? 0).toBe(0);
      }
    }
  });

  it('emite cada círculo una sola vez (sin rotaciones repetidas)', () => {
    const circles = findTradeCircles(album, [A, B, C]);
    expect(circles).toHaveLength(1);
  });

  it('no propone círculos cuando alguien no puede cerrar el ciclo', () => {
    // C ya no tiene repetida de 2 → C no puede darle a A → sin círculo.
    const C2 = coll('Caro', { 2: 1, 0: 1 });
    expect(findTradeCircles(album, [A, B, C2])).toEqual([]);
  });

  it('por defecto ignora los ciclos de largo 2 (eso es el bilateral)', () => {
    const X = coll('X', { 0: 2, 1: 0 }); // repetida 0; falta 1
    const Y = coll('Y', { 1: 2, 0: 0 }); // repetida 1; falta 0 → X↔Y es bilateral
    expect(findTradeCircles(album, [X, Y])).toEqual([]);
    // Con minLength 2 sí lo devuelve.
    expect(findTradeCircles(album, [X, Y], { minLength: 2 }).length).toBeGreaterThan(0);
  });

  it('prioriza entregar la lámina especial cuando hay opción', () => {
    // A puede darle a B la 0 (normal) o la 3 (especial); B necesita ambas.
    const A2 = coll('Ana', { 0: 2, 3: 2 });
    const B2 = coll('Beto', { 1: 2 }); // falta 0, 2 y 3
    const C2 = coll('Caro', { 2: 2, 0: 1, 3: 1 }); // cierra dándole la 1 a... espera
    // Cerramos el triángulo: A→B (0 o 3), B→C (1), C→A (2). A necesita 2.
    const A3 = coll('Ana', { 0: 2, 3: 2, 1: 1 }); // repetidas 0 y 3; falta 2
    const B3 = coll('Beto', { 1: 2, 2: 1 }); // repetida 1; falta 0 y 3
    const C3 = coll('Caro', { 2: 2, 0: 1, 3: 1 }); // repetida 2; falta 1

    const circles = findTradeCircles(album, [A3, B3, C3]);
    expect(circles.length).toBeGreaterThan(0);
    const anaStep = circles[0]!.steps.find((s) => s.from === 'Ana')!;
    expect(anaStep.sticker.special).toBe(true); // eligió la especial (S-3)
    // (variables auxiliares para documentar el diseño; no se usan)
    void A2;
    void B2;
    void C2;
  });

  it('rankea primero los círculos más cortos', () => {
    // Grupo donde existe un triángulo y también un cuadrado; el triángulo va primero.
    const p = [
      coll('P0', { 0: 2, 1: 1 }),
      coll('P1', { 1: 2, 2: 1 }),
      coll('P2', { 2: 2, 0: 1 }),
      coll('P3', { 3: 2 }),
    ];
    const circles = findTradeCircles(album, p, { maxLength: 4 });
    expect(circles.length).toBeGreaterThan(0);
    // El primero (más corto) es el triángulo de 3.
    expect(circles[0]!.steps.length).toBe(3);
  });

  it('respeta maxResults', () => {
    const A2 = coll('Ana', { 0: 2, 1: 1 });
    const B2 = coll('Beto', { 1: 2, 2: 1 });
    const C2 = coll('Caro', { 2: 2, 0: 1 });
    expect(findTradeCircles(album, [A2, B2, C2], { maxResults: 0 })).toEqual([]);
  });

  it('devuelve vacío si hay menos participantes que minLength', () => {
    expect(findTradeCircles(album, [A])).toEqual([]);
    expect(findTradeCircles(album, [A, B])).toEqual([]);
  });
});
