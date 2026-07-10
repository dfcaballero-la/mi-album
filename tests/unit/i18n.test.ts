import { describe, expect, it } from 'vitest';
import { isLocale, LOCALES, translations, type Locale } from '@core/i18n';

describe('isLocale', () => {
  it('acepta "es" y "en"', () => {
    expect(isLocale('es')).toBe(true);
    expect(isLocale('en')).toBe(true);
  });

  it('rechaza cualquier otro valor', () => {
    expect(isLocale('fr')).toBe(false);
    expect(isLocale('')).toBe(false);
  });
});

describe('LOCALES', () => {
  it('lista exactamente los locales soportados', () => {
    expect(LOCALES).toEqual(['es', 'en']);
  });
});

describe.each(LOCALES)('translations[%s]', (locale: Locale) => {
  const t = translations[locale];

  it('arma la línea de stats con los números provistos', () => {
    const text = t.header.stats({ owned: 3, total: 980, progressPct: 0, duplicates: 1, packsMin: 5, packsMax: 8 });
    expect(text).toContain('3/980');
    expect(text).toContain('5');
    expect(text).toContain('8');
  });

  it('el aria-label de una lámina cambia según el estado', () => {
    const missing = t.sticker.ariaLabel('ARG-1', 0);
    const owned = t.sticker.ariaLabel('ARG-1', 1);
    const duplicate = t.sticker.ariaLabel('ARG-1', 3);
    expect(missing).toContain('ARG-1');
    expect(owned).not.toBe(missing);
    expect(duplicate).not.toBe(owned);
    expect(duplicate).toContain('2'); // count - 1 copias de más
  });

  it('interpola cantidades en los botones de filtro y compartir', () => {
    expect(t.header.filterDuplicates(4)).toContain('4');
    expect(t.trade.youGive(2)).toContain('2');
    expect(t.trade.youReceive(0)).toContain('0');
    expect(t.trade.shareDuplicates(7)).toContain('7');
    expect(t.trade.shareMissing(3)).toContain('3');
  });

  it('interpola la búsqueda sin resultados y el % por sección', () => {
    expect(t.header.noResultsFor('arg-99')).toContain('arg-99');
    expect(t.header.sectionStats({ owned: 2, total: 20, progressPct: 10 })).toContain('2/20');
  });

  it('el mensaje de error de importación incluye el motivo original', () => {
    expect(t.importFlow.error('boom')).toContain('boom');
  });

  it('agrega o quita los puntos suspensivos según truncated', () => {
    const full = t.importFlow.unmatched({ count: 3, codes: 'A, B, C', truncated: false });
    const truncated = t.importFlow.unmatched({ count: 15, codes: 'A, B, C', truncated: true });
    expect(full.endsWith('…')).toBe(false);
    expect(truncated.endsWith('…')).toBe(true);
  });

  it('todas las strings estáticas son no vacías', () => {
    expect(t.common.loading.length).toBeGreaterThan(0);
    expect(t.trade.title.length).toBeGreaterThan(0);
    expect(t.share.footer.length).toBeGreaterThan(0);
  });
});
