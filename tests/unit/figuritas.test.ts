import { describe, expect, it } from 'vitest';
import { parseFiguritas } from '@core/importers/figuritas';
import type { AlbumDefinition } from '@core/types';

const album: AlbumDefinition = {
  id: 'mundial-2026',
  name: 'Test',
  year: 2026,
  packSize: 5,
  version: '1.0.0',
  totalStickers: 8,
  sections: [
    {
      id: 'fwc',
      name: 'FWC',
      stickers: [
        { code: 'FWC-00', index: 0, special: true },
        { code: 'FWC-1', index: 1 },
        { code: 'FWC-2', index: 2 },
      ],
    },
    {
      id: 'mex',
      name: 'México',
      group: 'Grupo A',
      stickers: [
        { code: 'MEX-1', index: 3 },
        { code: 'MEX-2', index: 4 },
        { code: 'MEX-3', index: 5 },
        { code: 'MEX-4', index: 6 },
        { code: 'MEX-5', index: 7 },
      ],
    },
  ],
};

const sample = `Figuritas App - Lista
Usa Méx Can 26
Me faltan
FWC 🏆: 00, 1
MEX 🇲🇽: 2, 4

Repetidas
MEX 🇲🇽: 1, 3 (×2)

Descarga la app
https://www.figuritas.app/es/descargar`;

describe('parseFiguritas', () => {
  const { collection, unmatched } = parseFiguritas(sample, album);

  it('marca como faltantes las láminas listadas en "Me faltan"', () => {
    expect(collection.ownedCounts[0]).toBeUndefined(); // FWC-00
    expect(collection.ownedCounts[1]).toBeUndefined(); // FWC-1
    expect(collection.ownedCounts[4]).toBeUndefined(); // MEX-2
    expect(collection.ownedCounts[6]).toBeUndefined(); // MEX-4
  });

  it('lo no listado se posee con 1 copia', () => {
    expect(collection.ownedCounts[2]).toBe(1); // FWC-2
    expect(collection.ownedCounts[7]).toBe(1); // MEX-5
  });

  it('las repetidas suman copias extra', () => {
    expect(collection.ownedCounts[3]).toBe(2); // MEX-1: 1 + 1 extra
    expect(collection.ownedCounts[5]).toBe(3); // MEX-3: 1 + 2 extra (×2)
  });

  it('no reporta códigos sin match en datos válidos', () => {
    expect(unmatched).toEqual([]);
  });

  it('ignora el encabezado y el pie del export', () => {
    expect(collection.albumId).toBe('mundial-2026');
  });

  it('reporta códigos desconocidos sin romper', () => {
    const result = parseFiguritas('Me faltan\nZZZ 🏳️: 1, 2', album);
    expect(result.unmatched).toEqual(['ZZZ-1', 'ZZZ-2']);
  });
});
