/**
 * Persistencia local (IndexedDB vía Dexie).
 * Única fuente de verdad del estado del usuario — ADR-001.
 */
import Dexie, { type Table } from 'dexie';
import type { Collection } from '@core/types';
import { isLocale, type Locale } from '@core/i18n';

export interface Setting {
  key: string;
  value: unknown;
}

export class MiAlbumDB extends Dexie {
  collections!: Table<Collection, string>;
  settings!: Table<Setting, string>;

  constructor() {
    super('mi-album');
    this.version(1).stores({
      collections: 'albumId',
      settings: 'key',
    });
  }
}

export const db = new MiAlbumDB();

export async function getCollection(albumId: string): Promise<Collection> {
  const existing = await db.collections.get(albumId);
  return (
    existing ?? { albumId, ownedCounts: {}, updatedAt: new Date().toISOString() }
  );
}

export async function setStickerCount(
  albumId: string,
  index: number,
  count: number,
): Promise<void> {
  const collection = await getCollection(albumId);
  const now = new Date().toISOString();
  if (count <= 0) {
    delete collection.ownedCounts[index];
  } else {
    collection.ownedCounts[index] = count;
  }
  // Timestamp por lámina para el merge de sync (v2). Se registra también al
  // borrar (count 0): la entrada sin cuenta es un tombstone. Ver core/sync.ts.
  const stamps = collection.stickerUpdatedAt ?? {};
  stamps[index] = now;
  collection.stickerUpdatedAt = stamps;
  collection.updatedAt = now;
  await db.collections.put(collection);
}

const ACTIVE_ALBUM_KEY = 'activeAlbumId';

export async function getActiveAlbumId(): Promise<string | undefined> {
  const row = await db.settings.get(ACTIVE_ALBUM_KEY);
  return typeof row?.value === 'string' ? row.value : undefined;
}

export async function setActiveAlbumId(albumId: string): Promise<void> {
  await db.settings.put({ key: ACTIVE_ALBUM_KEY, value: albumId });
}

const LOCALE_KEY = 'locale';

export async function getLocale(): Promise<Locale | undefined> {
  const row = await db.settings.get(LOCALE_KEY);
  return typeof row?.value === 'string' && isLocale(row.value) ? row.value : undefined;
}

export async function setLocale(locale: Locale): Promise<void> {
  await db.settings.put({ key: LOCALE_KEY, value: locale });
}
