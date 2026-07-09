/**
 * Importador del formato de exportación de figuritas.app.
 *
 * Formato esperado (texto plano):
 *   Me faltan
 *   MEX 🇲🇽: 1, 4, 13
 *   FWC 🏆: 00, 1, 2
 *   ...
 *   Repetidas
 *   CZE 🇨🇿: 4, 7 (×2), 8
 *
 * Semántica: todo lo no listado en "Me faltan" se posee (count 1).
 * "Repetidas" indica copias extra: "7 (×2)" = 2 copias extra (3 en total).
 */
import type { AlbumDefinition, Collection } from '../types';

interface ParsedLine {
  teamCode: string;
  entries: { num: string; extra: number }[];
}

const LINE_RE = /^([A-Z]{2,4})\s*[^:]*:\s*(.+)$/u;

function parseLine(line: string): ParsedLine | null {
  const match = LINE_RE.exec(line.trim());
  if (!match) return null;
  const entries = match[2]!
    .split(',')
    .map((part) => {
      const m = /^\s*(\d+)\s*(?:\(×(\d+)\))?\s*$/u.exec(part);
      if (!m) return null;
      return { num: m[1]!, extra: m[2] ? Number(m[2]) : 1 };
    })
    .filter((e): e is { num: string; extra: number } => e !== null);
  return { teamCode: match[1]!, entries };
}

/** Mapa código-de-lámina → índice global, tolerante a "00" vs "0". */
function buildCodeIndex(album: AlbumDefinition): Map<string, number> {
  const map = new Map<string, number>();
  for (const section of album.sections) {
    for (const sticker of section.stickers) {
      map.set(sticker.code, sticker.index);
      // Alias sin ceros a la izquierda: FWC-00 → FWC-0
      const parts = sticker.code.split('-');
      const tail = parts[parts.length - 1];
      if (tail && /^0\d*$/.test(tail)) {
        map.set(`${parts.slice(0, -1).join('-')}-${Number(tail)}`, sticker.index);
      }
    }
  }
  return map;
}

export interface FiguritasImportResult {
  collection: Collection;
  /** Códigos del texto que no existen en el álbum (para mostrar aviso). */
  unmatched: string[];
}

export function parseFiguritas(text: string, album: AlbumDefinition): FiguritasImportResult {
  const codeIndex = buildCodeIndex(album);
  const unmatched: string[] = [];

  const resolve = (teamCode: string, num: string): number | undefined => {
    const code = `${teamCode}-${num}`;
    const index = codeIndex.get(code) ?? codeIndex.get(`${teamCode}-${Number(num)}`);
    if (index === undefined) unmatched.push(code);
    return index;
  };

  // Todo se posee por defecto; "Me faltan" resta, "Repetidas" suma.
  const ownedCounts: Record<number, number> = {};
  for (let i = 0; i < album.totalStickers; i++) ownedCounts[i] = 1;

  let mode: 'none' | 'missing' | 'duplicates' = 'none';

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const lower = line.toLowerCase();
    if (lower.startsWith('me faltan')) { mode = 'missing'; continue; }
    if (lower.startsWith('repetidas')) { mode = 'duplicates'; continue; }
    if (mode === 'none') continue;

    const parsed = parseLine(line);
    if (!parsed) { mode = mode === 'duplicates' && !LINE_RE.test(line) ? 'none' : mode; continue; }

    for (const { num, extra } of parsed.entries) {
      const index = resolve(parsed.teamCode, num);
      if (index === undefined) continue;
      if (mode === 'missing') {
        ownedCounts[index] = 0;
      } else {
        ownedCounts[index] = 1 + extra;
      }
    }
  }

  // Compactar: eliminar los count 0 para cumplir la convención del dominio.
  for (const key of Object.keys(ownedCounts)) {
    if (ownedCounts[Number(key)] === 0) delete ownedCounts[Number(key)];
  }

  return {
    collection: { albumId: album.id, ownedCounts, updatedAt: new Date().toISOString() },
    unmatched,
  };
}
