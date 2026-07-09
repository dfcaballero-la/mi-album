/**
 * Export/import de respaldo (Fase 1 del roadmap).
 * El respaldo es un JSON con la colección; protege contra pérdida
 * de datos locales (borrado de caché del navegador).
 */
import type { Collection } from '@core/types';
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

export function downloadBackup(backup: Backup): void {
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `mi-album-respaldo-${backup.exportedAt.slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
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
