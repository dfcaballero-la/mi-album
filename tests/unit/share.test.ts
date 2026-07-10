import { describe, expect, it } from 'vitest';
import { formatShareList } from '@core/share';
import { flagForSection } from '@core/flags';
import type { AlbumDefinition, Collection } from '@core/types';

const album: AlbumDefinition = {
  id: 'test-album',
  name: 'Test',
  year: 2026,
  packSize: 5,
  version: '1.0.0',
  totalStickers: 4,
  sections: [
    {
      id: 'arg',
      name: 'Argentina',
      stickers: [
        { code: 'ARG-1', index: 0 },
        { code: 'ARG-2', index: 1 },
      ],
    },
    {
      id: 'zzz',
      name: 'Ficticio',
      stickers: [
        { code: 'ZZZ-1', index: 2 },
        { code: 'ZZZ-2', index: 3 },
      ],
    },
  ],
};

const collection = (ownedCounts: Record<number, number>): Collection => ({
  albumId: album.id,
  ownedCounts,
  updatedAt: new Date().toISOString(),
});

describe('flagForSection', () => {
  it('devuelve la bandera correcta para un país mapeado', () => {
    expect(flagForSection('arg')).toBe('🇦🇷');
  });

  it('devuelve una bandera genérica para secciones sin mapeo', () => {
    expect(flagForSection('zzz')).toBe('🏳️');
  });

  it('devuelve el trofeo para la sección especial del Mundial', () => {
    expect(flagForSection('fwc')).toBe('🏆');
  });
});

describe('formatShareList', () => {
  it('agrupa las repetidas por sección con su bandera y la cantidad extra', () => {
    const text = formatShareList(album, collection({ 0: 3, 2: 1 }), 'duplicates');
    expect(text).toContain('🇦🇷 Argentina: ARG-1 (x2)');
    expect(text).not.toContain('ZZZ');
  });

  it('agrupa las faltantes por sección', () => {
    const text = formatShareList(album, collection({ 0: 1 }), 'missing');
    expect(text).toContain('ARG-2');
    expect(text).toContain('ZZZ-1');
    expect(text).toContain('ZZZ-2');
  });

  it('avisa cuando no hay repetidas', () => {
    const text = formatShareList(album, collection({}), 'duplicates');
    expect(text).toContain('Todavía no tengo repetidas');
  });

  it('avisa cuando el álbum está completo', () => {
    const full = collection({ 0: 1, 1: 1, 2: 1, 3: 1 });
    const text = formatShareList(album, full, 'missing');
    expect(text).toContain('¡Álbum completo!');
  });
});
