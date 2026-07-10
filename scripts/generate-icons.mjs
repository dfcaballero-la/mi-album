#!/usr/bin/env node
/**
 * Genera los íconos PWA (public/icons/icon-*.png) sin dependencias binarias
 * ni assets externos: solo geometría + zlib (stdlib de Node).
 * Diseño: dos "láminas" apiladas (paleta de la app) — sin arte de terceros.
 * Ejecutar: node scripts/generate-icons.mjs
 */
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.resolve(__dirname, '../public/icons');

const BG = [0x0f, 0x17, 0x2a]; // navy — theme_color del manifest
const CARD_BACK = [0x10, 0xb9, 0x81]; // emerald-500 — estado "la tengo"
const CARD_FRONT = [0xff, 0xff, 0xff];
const BADGE = [0xf5, 0x9e, 0x0b]; // amber-500 — estado "repetida"

function roundedRectSDF(px, py, cx, cy, halfW, halfH, radius) {
  const qx = Math.abs(px - cx) - (halfW - radius);
  const qy = Math.abs(py - cy) - (halfH - radius);
  const outsideX = Math.max(qx, 0);
  const outsideY = Math.max(qy, 0);
  return Math.min(Math.max(qx, qy), 0) + Math.hypot(outsideX, outsideY) - radius;
}

function circleSDF(px, py, cx, cy, r) {
  return Math.hypot(px - cx, py - cy) - r;
}

/** Cobertura anti-aliased (0..1) de un SDF en el borde del píxel. */
function coverage(dist) {
  return Math.max(0, Math.min(1, 0.5 - dist));
}

function blend(dst, src, alpha) {
  return [
    Math.round(dst[0] * (1 - alpha) + src[0] * alpha),
    Math.round(dst[1] * (1 - alpha) + src[1] * alpha),
    Math.round(dst[2] * (1 - alpha) + src[2] * alpha),
  ];
}

function renderIcon(size) {
  const pixels = new Uint8Array(size * size * 4);
  const cx = size / 2;
  const cy = size / 2;
  const cardHalf = size * 0.29;
  const cardRadius = size * 0.09;
  const offset = size * 0.09;
  const badgeR = size * 0.1;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let color = BG;

      const backDist = roundedRectSDF(x, y, cx + offset, cy + offset, cardHalf, cardHalf, cardRadius);
      const backCoverage = coverage(backDist);
      if (backCoverage > 0) color = blend(color, CARD_BACK, backCoverage);

      const frontDist = roundedRectSDF(x, y, cx - offset, cy - offset, cardHalf, cardHalf, cardRadius);
      const frontCoverage = coverage(frontDist);
      if (frontCoverage > 0) color = blend(color, CARD_FRONT, frontCoverage);

      const badgeDist = circleSDF(x, y, cx + cardHalf + offset * 0.4, cy - cardHalf - offset * 0.4 + cardHalf * 0.15, badgeR);
      const badgeCoverage = coverage(badgeDist);
      if (badgeCoverage > 0) color = blend(color, BADGE, badgeCoverage);

      const i = (y * size + x) * 4;
      pixels[i] = color[0];
      pixels[i + 1] = color[1];
      pixels[i + 2] = color[2];
      pixels[i + 3] = 255;
    }
  }
  return pixels;
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePng(pixels, size) {
  const raw = Buffer.alloc(size * (1 + size * 4));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (1 + size * 4);
    raw[rowStart] = 0; // filtro "None"
    pixels.copy
      ? pixels.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4)
      : raw.set(pixels.subarray(y * size * 4, (y + 1) * size * 4), rowStart + 1);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // profundidad de bit
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(outDir, { recursive: true });

for (const size of [192, 512]) {
  const pixels = Buffer.from(renderIcon(size));
  const png = encodePng(pixels, size);
  const outPath = path.join(outDir, `icon-${size}.png`);
  writeFileSync(outPath, png);
  console.log(`Generado ${outPath} (${png.length} bytes)`);
}
