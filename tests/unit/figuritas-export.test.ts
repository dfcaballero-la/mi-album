import { describe, expect, it } from 'vitest';
import { gunzipSync } from 'node:zlib';
import { encodeFiguritasQR } from '@core/exporters/figuritas';
import type { AlbumDefinition, Collection } from '@core/types';

const album: AlbumDefinition = {
  id: 'test',
  name: 'Test',
  year: 2026,
  packSize: 5,
  version: '1.0.0',
  totalStickers: 10,
  sections: [
    { id: 's', name: 'S', stickers: Array.from({ length: 10 }, (_, i) => ({ code: `S-${i}`, index: i })) },
  ],
};

const coll = (ownedCounts: Record<number, number>): Collection => ({
  albumId: album.id,
  ownedCounts,
  updatedAt: '2026-07-01T00:00:00.000Z',
});

/** Separa el payload en sus 3 planos descomprimidos (salta el encabezado de 4 bytes). */
function planes(payload: Uint8Array): Buffer[] {
  const body = Buffer.from(payload.slice(4)).toString('latin1');
  return body.split(';').map((b64) => gunzipSync(Buffer.from(b64, 'base64')));
}
const bit = (buf: Buffer, i: number) => (buf[i >> 3]! >> (i & 7)) & 1;

describe('encodeFiguritasQR', () => {
  it('emite el encabezado fijo de 4 bytes de figuritas', async () => {
    const out = await encodeFiguritasQR(album, coll({}));
    expect([...out.slice(0, 4)]).toEqual([0xe2, 0x8b, 0x8b, 0x5e]);
  });

  it('plano 0 = faltantes, plano 1 = repetidas, plano 2 = copias por repetida', async () => {
    // index 0 falta; 1 la tengo; 2 repetida ×2 (3 copias); 3 repetida ×1 (2 copias); resto falta.
    const out = await encodeFiguritasQR(album, coll({ 1: 1, 2: 3, 3: 2 }));
    const [missing, dupes, counts] = planes(out);

    // Faltantes: todas menos 1,2,3.
    expect(bit(missing!, 0)).toBe(1);
    expect(bit(missing!, 1)).toBe(0);
    expect(bit(missing!, 4)).toBe(1);
    // Repetidas: solo 2 y 3.
    expect(bit(dupes!, 2)).toBe(1);
    expect(bit(dupes!, 3)).toBe(1);
    expect(bit(dupes!, 1)).toBe(0);
    // Copias por repetida, en orden de índice: 3 (index 2) y 2 (index 3).
    expect([...counts!]).toEqual([3, 2]);
  });

  it('sin repetidas, el plano de copias queda vacío', async () => {
    const out = await encodeFiguritasQR(album, coll({ 0: 1, 1: 1 }));
    const [, dupes, counts] = planes(out);
    expect(counts!.length).toBe(0);
    for (let i = 0; i < 10; i++) expect(bit(dupes!, i)).toBe(0);
  });

  it('los bitsets se empaquetan a ceil(N/8) bytes', async () => {
    const [missing] = planes(await encodeFiguritasQR(album, coll({})));
    expect(missing!.length).toBe(2); // ceil(10/8)
  });
});
