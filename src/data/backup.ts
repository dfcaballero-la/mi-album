/**
 * Export/import de respaldo (Fase 1 del roadmap).
 * El respaldo es un JSON con la colección; protege contra pérdida
 * de datos locales (borrado de caché del navegador).
 */
import type { Collection } from '@core/types';
import { mergeCollections } from '@core/sync';
import { db } from './db';

const BACKUP_VERSION = 1;

export interface Backup {
  app: 'mi-album';
  version: number;
  exportedAt: string;
  collections: Collection[];
}

export async function createBackup(): Promise<Backup> {
  const collections = await db.collections.toArray();
  return {
    app: 'mi-album',
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    collections,
  };
}

function backupFilename(backup: Backup): string {
  return `mi-album-respaldo-${backup.exportedAt.slice(0, 10)}.json`;
}

export function downloadBackup(backup: Backup): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = backupFilename(backup);
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Comparte el respaldo como archivo por la hoja nativa del sistema
 * (AirDrop, WhatsApp, Archivos…) donde el navegador lo soporte —
 * el camino fácil compu→iPad. Si no hay soporte o el usuario cancela
 * la hoja sin elegir destino, cae a la descarga clásica.
 */
export async function shareOrDownloadBackup(backup: Backup): Promise<void> {
  const file = new File([JSON.stringify(backup, null, 2)], backupFilename(backup), {
    type: 'application/json',
  });
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (error) {
      // AbortError = el usuario cerró la hoja a propósito; no forzar una descarga encima.
      if (error instanceof Error && error.name === 'AbortError') return;
    }
  }
  downloadBackup(backup);
}

export function parseBackup(json: string): Backup {
  const data = JSON.parse(json) as Backup;
  if (data.app !== 'mi-album' || !Array.isArray(data.collections)) {
    throw new Error('El archivo no es un respaldo válido de Mi Álbum');
  }
  return data;
}

/** Restaura las colecciones del respaldo (sobrescribe las existentes). */
export async function restoreBackup(backup: Backup): Promise<void> {
  await db.collections.bulkPut(backup.collections);
}

/**
 * Importa un respaldo fusionándolo con las colecciones locales por álbum
 * (last-write-wins por lámina, ver `core/sync.ts`) en vez de sobrescribir.
 * Es el camino no destructivo para poner al día dos dispositivos del mismo
 * dueño: nunca se pierde lo que ya tenías localmente.
 */
export async function mergeBackup(backup: Backup): Promise<void> {
  for (const incoming of backup.collections) {
    const local = await db.collections.get(incoming.albumId);
    await db.collections.put(local ? mergeCollections(local, incoming) : incoming);
  }
}
