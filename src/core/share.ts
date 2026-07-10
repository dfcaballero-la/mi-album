/**
 * Listas para compartir fuera de la app (WhatsApp, Instagram, etc.): texto
 * plano agrupado por sección, con bandera, para que la otra persona
 * identifique de un vistazo qué le puede ofrecer. Módulo puro.
 */
import type { AlbumDefinition, Collection } from './types';
import { flagForSection } from './flags';

export type ShareListKind = 'missing' | 'duplicates';

export function formatShareList(
  album: AlbumDefinition,
  collection: Collection,
  kind: ShareListKind,
): string {
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
    lines.push(`${flagForSection(section.id)} ${section.name}: ${codes.join(', ')}`);
  }

  const title = kind === 'missing' ? 'Me FALTAN estas láminas' : 'Tengo REPETIDAS estas láminas';
  const header = `📋 ${title} — ${album.name} (${total})`;
  const footer = 'Generado con Mi Álbum 📱 (offline, sin cuentas)';

  if (lines.length === 0) {
    const emptyMessage = kind === 'missing' ? '¡Álbum completo! 🎉' : 'Todavía no tengo repetidas.';
    return `${header}\n\n${emptyMessage}\n\n${footer}`;
  }

  return `${header}\n\n${lines.join('\n')}\n\n${footer}`;
}
