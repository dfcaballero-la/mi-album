/**
 * Codec de intercambio: serializa (faltantes + repetidas) a un string
 * compacto apto para QR o mensaje de chat. Ver docs/DATA_MODEL.md §4.
 *
 * v1: bitset de posesión + lista de repetidas, comprimido con
 * CompressionStream('deflate-raw') y codificado base64url.
 * Sin datos personales: el payload solo contiene el estado del álbum.
 */
import type { AlbumDefinition, Collection } from './types';

const CODEC_VERSION = 1;

interface Payload {
  a: string; // albumId
  v: number; // versión del codec
  o: number[]; // bitset de posesión empaquetado en bytes
  d: [number, number][]; // repetidas: [index, copiasExtra]
}

export async function encodeCollection(
  album: AlbumDefinition,
  collection: Collection,
): Promise<string> {
  const bytes = new Uint8Array(Math.ceil(album.totalStickers / 8));
  const dupes: [number, number][] = [];

  for (let i = 0; i < album.totalStickers; i++) {
    const count = collection.ownedCounts[i] ?? 0;
    if (count > 0) bytes[i >> 3]! |= 1 << (i & 7);
    if (count > 1) dupes.push([i, count - 1]);
  }

  const payload: Payload = {
    a: collection.albumId,
    v: CODEC_VERSION,
    o: Array.from(bytes),
    d: dupes,
  };

  const raw = new TextEncoder().encode(JSON.stringify(payload));
  const compressed = await compress(raw);
  return toBase64Url(compressed);
}

export async function decodeCollection(
  encoded: string,
  album: AlbumDefinition,
): Promise<Collection> {
  const compressed = fromBase64Url(encoded);
  const raw = await decompress(compressed);
  const payload = JSON.parse(new TextDecoder().decode(raw)) as Payload;

  if (payload.v !== CODEC_VERSION) {
    throw new Error(`Versión de código no soportada: ${payload.v}`);
  }
  if (payload.a !== album.id) {
    throw new Error(`El código pertenece a otro álbum: ${payload.a}`);
  }

  const ownedCounts: Record<number, number> = {};
  const bytes = Uint8Array.from(payload.o);
  for (let i = 0; i < album.totalStickers; i++) {
    if ((bytes[i >> 3]! >> (i & 7)) & 1) ownedCounts[i] = 1;
  }
  for (const [index, extra] of payload.d) {
    if (index >= 0 && index < album.totalStickers) {
      ownedCounts[index] = 1 + extra;
    }
  }

  return { albumId: album.id, ownedCounts, updatedAt: new Date().toISOString() };
}

// ---------- helpers ----------

async function compress(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function decompress(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromBase64Url(encoded: string): Uint8Array {
  const base64 = encoded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}
