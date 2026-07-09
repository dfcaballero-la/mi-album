import { describe, expect, it } from 'vitest';
import { decodeCollection, encodeCollection } from '@core/codec';
import type { AlbumDefinition, Collection } from '@core/types';

const album: AlbumDefinition = {
  id: 'test-album',
  name: 'Test',
  year: 2026,
  packSize: 5,
  version: '1.0.0',
  totalStickers: 20,
  sections: [
    {
      id: 's1',
      name: 'Sección 1',
      stickers: Array.from({ length: 20 }, (_, i) => ({ code: `T-${i + 1}`, index: i })),
    },
  ],
};

const collection = (ownedCounts: Record<number, number>): Collection => ({
  albumId: album.id,
  ownedCounts,
  updatedAt: new Date().toISOString(),
});

describe('codec', () => {
  it('round-trip: encode → decode preserva el estado', async () => {
    const original = collection({ 0: 1, 3: 4, 7: 1, 19: 2 });
    const encoded = await encodeCollection(album, original);
    const decoded = await decodeCollection(encoded, album);

    expect(decoded.albumId).toBe(album.id);
    expect(decoded.ownedCounts).toEqual({ 0: 1, 3: 4, 7: 1, 19: 2 });
  });

  it('colección vacía produce estado vacío', async () => {
    const encoded = await encodeCollection(album, collection({}));
    const decoded = await decodeCollection(encoded, album);
    expect(decoded.ownedCounts).toEqual({});
  });

  it('el string codificado es apto para URL/QR', async () => {
    const encoded = await encodeCollection(album, collection({ 1: 2, 5: 1 }));
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('rechaza códigos de otro álbum', async () => {
    const encoded = await encodeCollection(album, collection({ 0: 1 }));
    const otherAlbum = { ...album, id: 'otro-album' };
    await expect(decodeCollection(encoded, otherAlbum)).rejects.toThrow(/otro álbum/);
  });
});
