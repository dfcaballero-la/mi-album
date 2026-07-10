/**
 * Emoji de bandera por sección — específico del álbum Mundial 2026.
 * Los IDs de sección no mapean 1:1 a ISO 3166 (códigos FIFA como RSA, GER,
 * SUI usan la sigla del país en inglés/local, no el ISO2), así que la
 * tabla se arma a mano en vez de derivarse algorítmicamente. Módulo puro.
 */
const ISO2_BY_SECTION: Record<string, string> = {
  mex: 'MX', rsa: 'ZA', kor: 'KR', cze: 'CZ', can: 'CA', bih: 'BA', qat: 'QA',
  sui: 'CH', bra: 'BR', mar: 'MA', hai: 'HT', usa: 'US', par: 'PY', aus: 'AU',
  tur: 'TR', ger: 'DE', cuw: 'CW', civ: 'CI', ecu: 'EC', ned: 'NL', jpn: 'JP',
  swe: 'SE', tun: 'TN', bel: 'BE', egy: 'EG', irn: 'IR', nzl: 'NZ', esp: 'ES',
  cpv: 'CV', ksa: 'SA', uru: 'UY', fra: 'FR', sen: 'SN', irq: 'IQ', nor: 'NO',
  arg: 'AR', alg: 'DZ', aut: 'AT', jor: 'JO', por: 'PT', cod: 'CD', uzb: 'UZ',
  col: 'CO', cro: 'HR', gha: 'GH', pan: 'PA',
};

// Selecciones sin código ISO de país propio: usan la bandera con secuencia
// de "tag" de Unicode para subdivisiones del Reino Unido.
const LITERAL_FLAGS: Record<string, string> = {
  eng: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  sco: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  fwc: '🏆',
};

const FALLBACK_FLAG = '🏳️';

function isoToFlagEmoji(iso2: string): string {
  return [...iso2.toUpperCase()]
    .map((char) => String.fromCodePoint(127397 + char.charCodeAt(0)))
    .join('');
}

export function flagForSection(sectionId: string): string {
  const literal = LITERAL_FLAGS[sectionId];
  if (literal) return literal;
  const iso2 = ISO2_BY_SECTION[sectionId];
  return iso2 ? isoToFlagEmoji(iso2) : FALLBACK_FLAG;
}
