/**
 * Nombres de sección localizados y normalización de búsqueda.
 * Los `section.name` de albums/*.json están en español (idioma primario);
 * este mapa aporta el nombre en inglés por id de sección — mismo patrón
 * que flags.ts, específico del álbum Mundial 2026. Una sección sin mapeo
 * cae al nombre original del JSON. Módulo puro.
 */
import type { Locale } from './i18n';

interface NamedSection {
  id: string;
  name: string;
}

const EN_NAMES: Record<string, string> = {
  fwc: 'FIFA World Cup 26',
  mex: 'Mexico', rsa: 'South Africa', kor: 'South Korea', cze: 'Czechia',
  can: 'Canada', bih: 'Bosnia and Herzegovina', qat: 'Qatar', sui: 'Switzerland',
  bra: 'Brazil', mar: 'Morocco', hai: 'Haiti', sco: 'Scotland',
  usa: 'United States', par: 'Paraguay', aus: 'Australia', tur: 'Turkey',
  ger: 'Germany', cuw: 'Curaçao', civ: 'Ivory Coast', ecu: 'Ecuador',
  ned: 'Netherlands', jpn: 'Japan', swe: 'Sweden', tun: 'Tunisia',
  bel: 'Belgium', egy: 'Egypt', irn: 'Iran', nzl: 'New Zealand',
  esp: 'Spain', cpv: 'Cape Verde', ksa: 'Saudi Arabia', uru: 'Uruguay',
  fra: 'France', sen: 'Senegal', irq: 'Iraq', nor: 'Norway',
  arg: 'Argentina', alg: 'Algeria', aut: 'Austria', jor: 'Jordan',
  por: 'Portugal', cod: 'DR Congo', uzb: 'Uzbekistan', col: 'Colombia',
  eng: 'England', cro: 'Croatia', gha: 'Ghana', pan: 'Panama',
};

export function localizedSectionName(section: NamedSection, locale: Locale): string {
  if (locale === 'en') return EN_NAMES[section.id] ?? section.name;
  return section.name;
}

/** "Grupo A" → "Group A" en inglés; cualquier otro formato queda igual. */
export function localizedGroup(group: string, locale: Locale): string {
  if (locale === 'en') return group.replace(/^Grupo /, 'Group ');
  return group;
}

/**
 * Normaliza texto para búsqueda: minúsculas y sin tildes/diacríticos,
 * así "japon" encuentra "Japón" y "Turkiye" encontraría "Türkiye".
 */
export function normalizeForSearch(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}
