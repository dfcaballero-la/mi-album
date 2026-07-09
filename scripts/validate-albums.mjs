/**
 * Valida todas las definiciones de álbum contra el esquema y los invariantes
 * del dominio (docs/DATA_MODEL.md §7). Se ejecuta en CI y localmente:
 *   npm run validate:albums
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';

const albumsDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'albums');
const schema = JSON.parse(readFileSync(join(albumsDir, 'album.schema.json'), 'utf8'));
const ajv = new Ajv({ allErrors: true });
const validate = ajv.compile(schema);

let failures = 0;

for (const file of readdirSync(albumsDir).filter((f) => f.endsWith('.json') && !f.includes('schema'))) {
  const album = JSON.parse(readFileSync(join(albumsDir, file), 'utf8'));
  const errors = [];

  if (!validate(album)) {
    errors.push(...validate.errors.map((e) => `${e.instancePath} ${e.message}`));
  }

  // Invariantes del dominio
  const indices = album.sections.flatMap((s) => s.stickers.map((st) => st.index));
  const total = indices.length;

  if (album.totalStickers !== total) {
    errors.push(`totalStickers (${album.totalStickers}) ≠ suma real (${total})`);
  }
  if (new Set(indices).size !== total) {
    errors.push('índices duplicados');
  }
  const sorted = [...indices].sort((a, b) => a - b);
  if (sorted[0] !== 0 || sorted[total - 1] !== total - 1) {
    errors.push(`índices no contiguos 0..${total - 1}`);
  }
  const codes = album.sections.flatMap((s) => s.stickers.map((st) => st.code));
  if (new Set(codes).size !== codes.length) {
    errors.push('códigos duplicados');
  }

  if (errors.length > 0) {
    failures++;
    console.error(`❌ ${file}:`);
    for (const e of errors) console.error(`   - ${e}`);
  } else {
    console.log(`✅ ${file} (${total} láminas, ${album.sections.length} secciones)`);
  }
}

if (failures > 0) process.exit(1);
