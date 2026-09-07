/**
 * Exportador al formato de QR de figuritas.app (deducido por ingeniería
 * inversa de un export real; ver docs/DATA_MODEL.md §10). Módulo puro
 * (usa CompressionStream, como el codec).
 *
 * Payload = «encabezado» + base64(gzip(P0)) ; base64(gzip(P1)) ; base64(gzip(P2))
 *   P0: bitset de FALTANTES (count 0), LSB-first, sobre las N láminas.
 *   P1: bitset de REPETIDAS (count ≥ 2), mismo layout.
 *   P2: 1 byte por repetida, en orden de índice, valor = nº total de copias.
 * base64 estándar (con padding); gzip (no deflate-raw); orden de láminas =
 * el del álbum. El encabezado son 4 bytes fijos observados en la app.
 *
 * ADVERTENCIA: es una foto COMPLETA del álbum. El álbum debe tener las mismas
 * láminas y el mismo orden que figuritas (incluida la sección Coca-Cola), o el
 * import del otro lado quedará desalineado.
 */
import type { AlbumDefinition, Collection } from '../types';

const HEADER = Uint8Array.from([0xe2, 0x8b, 0x8b, 0x5e]);

async function gzip(bytes: Uint8Array<ArrayBuffer>): Promise<Uint8Array<ArrayBuffer>> {
  const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary); // estándar, con padding (a diferencia de nuestro codec)
}

/** Devuelve el contenido crudo del QR (bytes) listo para renderizar en modo byte. */
export async function encodeFiguritasQR(
  album: AlbumDefinition,
  collection: Collection,
): Promise<Uint8Array> {
  const total = album.totalStickers;
  const byteLen = Math.ceil(total / 8);
  const missing = new Uint8Array(byteLen);
  const dupes = new Uint8Array(byteLen);
  const counts: number[] = [];

  for (let i = 0; i < total; i++) {
    const count = collection.ownedCounts[i] ?? 0;
    if (count === 0) {
      missing[i >> 3]! |= 1 << (i & 7);
    } else if (count >= 2) {
      dupes[i >> 3]! |= 1 << (i & 7);
      counts.push(count);
    }
  }

  const [b0, b1, b2] = await Promise.all([gzip(missing), gzip(dupes), gzip(Uint8Array.from(counts))]);
  const body = new TextEncoder().encode([b0, b1, b2].map(toBase64).join(';'));

  const out = new Uint8Array(HEADER.length + body.length);
  out.set(HEADER, 0);
  out.set(body, HEADER.length);
  return out;
}
