/**
 * Listas para compartir fuera de la app (WhatsApp, Instagram, etc.): texto
 * plano agrupado por sección, con bandera, para que la otra persona
 * identifique de un vistazo qué le puede ofrecer. Módulo puro.
 */
import type { AlbumDefinition, Collection } from './types';
import { flagForSection } from './flags';
import { localizedSectionName } from './section-names';
import { translations, type Locale } from './i18n';

export type ShareListKind = 'missing' | 'duplicates';

export function formatShareList(
  album: AlbumDefinition,
  collection: Collection,
  kind: ShareListKind,
  locale: Locale,
): string {
  const t = translations[locale].share;
  const lines: string[] = [];
  let total = 0;

  for (const section of album.sections) {
    const codes: string[] = [];
    for (const sticker of section.stickers) {
      const count = collection.ownedCounts[sticker.index] ?? 0;
      if (kind === 'missing' && count === 0) {
        codes.push(sticker.code);
      } else if (kind === 'duplicates' && count > 1) {
        codes.push(count > 2 ? `${sticker.code} (x${count - 1})` : sticker.code);
      }
    }
    if (codes.length === 0) continue;
    total += codes.length;
    lines.push(`${flagForSection(section.id)} ${localizedSectionName(section, locale)}: ${codes.join(', ')}`);
  }

  const title = kind === 'missing' ? t.missingTitle : t.duplicatesTitle;
  const header = `📋 ${title} — ${album.name} (${total})`;

  if (lines.length === 0) {
    const emptyMessage = kind === 'missing' ? t.albumComplete : t.noDuplicates;
    return `${header}\n\n${emptyMessage}\n\n${t.footer}`;
  }

  return `${header}\n\n${lines.join('\n')}\n\n${t.footer}`;
}
