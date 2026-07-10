import { describe, expect, it } from 'vitest';
import { localizedGroup, localizedSectionName, normalizeForSearch } from '@core/section-names';
import type { AlbumDefinition } from '@core/types';
import albumData from '../../albums/mundial-2026.json';

const album = albumData as AlbumDefinition;

describe('localizedSectionName', () => {
  it('traduce al inglés cuando el locale es "en"', () => {
    expect(localizedSectionName({ id: 'ger', name: 'Alemania' }, 'en')).toBe('Germany');
    expect(localizedSectionName({ id: 'jpn', name: 'Japón' }, 'en')).toBe('Japan');
  });

  it('devuelve el nombre original en español', () => {
    expect(localizedSectionName({ id: 'ger', name: 'Alemania' }, 'es')).toBe('Alemania');
  });

  it('cae al nombre del JSON si la sección no tiene mapeo', () => {
    expect(localizedSectionName({ id: 'xyz', name: 'Sección Nueva' }, 'en')).toBe('Sección Nueva');
  });

  it('cubre todas las secciones del álbum Mundial 2026', () => {
    for (const section of album.sections) {
      // Con un nombre sentinela, si la sección no tuviera mapeo EN el
      // fallback devolvería el sentinela — así detectamos huecos en el mapa.
      const en = localizedSectionName({ id: section.id, name: '__SIN_MAPEO__' }, 'en');
      expect(en, `sección ${section.id} sin nombre EN en section-names.ts`).not.toBe('__SIN_MAPEO__');
    }
  });
});

describe('localizedGroup', () => {
  it('traduce "Grupo X" a "Group X" en inglés', () => {
    expect(localizedGroup('Grupo A', 'en')).toBe('Group A');
  });

  it('no toca el texto en español ni formatos desconocidos', () => {
    expect(localizedGroup('Grupo A', 'es')).toBe('Grupo A');
    expect(localizedGroup('Especiales', 'en')).toBe('Especiales');
  });
});

describe('normalizeForSearch', () => {
  it('quita tildes y pasa a minúsculas', () => {
    expect(normalizeForSearch('Japón')).toBe('japon');
    expect(normalizeForSearch('TÚNEZ')).toBe('tunez');
    expect(normalizeForSearch('Curaçao')).toBe('curacao');
  });

  it('deja igual el texto sin diacríticos', () => {
    expect(normalizeForSearch('ARG-7')).toBe('arg-7');
  });
});
