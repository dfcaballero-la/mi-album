/**
 * Persistencia local (IndexedDB vía Dexie).
 * Única fuente de verdad del estado del usuario — ADR-001.
 */
import Dexie, { type Table } from 'dexie';
import type { Collection } from '@core/types';

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
  if (count <= 0) {
    delete collection.ownedCounts[index];
  } else {
    collection.ownedCounts[index] = count;
  }
  collection.updatedAt = new Date().toISOString();
  await db.collections.put(collection);
}
