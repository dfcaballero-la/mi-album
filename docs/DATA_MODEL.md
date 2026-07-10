# Modelo de datos — Mi Álbum

## 1. Entidades del dominio

```typescript
/** Definición estática de un álbum (viene del JSON, inmutable) */
interface AlbumDefinition {
  id: string;              // "mundial-2026"
  name: string;            // "Mundial 2026"
  publisher?: string;      // informativo, sin afiliación
  year: number;
  packSize: number;        // láminas por sobre (para el estimador)
  sections: Section[];
  totalStickers: number;   // derivado, validado en CI
  version: string;         // semver de la definición
}

interface Section {
  id: string;              // "arg"
  name: string;            // "Argentina"
  group?: string;          // "Grupo A" — agrupación opcional de secciones
  stickers: StickerDef[];
}

interface StickerDef {
  code: string;            // "ARG-7" — identificador visible en la lámina física
  index: number;           // posición global 0..N-1 (clave para el bitset del codec)
  name?: string;           // "L. Messi" — opcional, solo datos fácticos
  special?: boolean;       // brillante/escudo/etc.
}

/** Estado del usuario sobre un álbum (mutable, vive en IndexedDB) */
interface Collection {
  albumId: string;
  ownedCounts: Record<number, number>; // index -> nº de copias (0 = no la tengo)
  updatedAt: string;                   // ISO-8601
}
```

**Derivaciones** (calculadas, nunca almacenadas): `missing = defs donde count 0`, `duplicates = defs donde count > 1 (count - 1 copias intercambiables)`, `progress = owned/total`.

## 2. Esquema de definición de álbum (JSON)

Los archivos `albums/*.json` se validan contra `albums/album.schema.json` en CI. Ejemplo mínimo:

```json
{
  "id": "mundial-2026",
  "name": "Mundial 2026",
  "year": 2026,
  "packSize": 5,
  "version": "1.0.0",
  "sections": [
    {
      "id": "intro",
      "name": "Introducción",
      "stickers": [
        { "code": "FWC-1", "index": 0, "special": true },
        { "code": "FWC-2", "index": 1 }
      ]
    }
  ]
}
```

**Regla de propiedad intelectual:** solo identificadores, nombres fácticos y estructura. Nunca imágenes, logos ni arte de las láminas.

## 3. Persistencia (Dexie / IndexedDB)

```typescript
// data/db.ts
class MiAlbumDB extends Dexie {
  collections!: Table<Collection, string>;   // pk: albumId
  settings!: Table<Setting, string>;         // pk: key
}
// v1 schema: collections: "albumId", settings: "key"
```

Migraciones versionadas con `db.version(n).stores(...)`. El export de respaldo serializa `collections` + versión de esquema.

## 4. Codec de intercambio

Objetivo: representar (poseídas, repetidas) en un string apto para QR (< 2 KB para álbumes de ~1000 láminas). Implementado en `core/codec.ts`.

```
payload = {
  a: albumId,
  v: 1,                        // versión del codec
  o: bitset(owned),            // 1 bit por lámina, empaquetado en bytes
  d: [[index, copiasExtra]]    // repetidas: pares [índice, count - 1]
}
encoded = base64url( deflate-raw( JSON.stringify(payload) ) )
```

`deflate-raw`/`inflate-raw` vía `CompressionStream`/`DecompressionStream` (Node ≥18 y navegadores modernos — es la única excepción documentada a "`core/` sin browser APIs"). Propiedades: sin datos personales (no hay nombre ni ID de usuario), unidireccional, importable offline. El QR se genera con `qrcode` y se lee con `jsqr` (cámara) o pegando el string manualmente — ambas librerías corren localmente, sin CDN.

## 5. Algoritmo de intercambio (`trade-matcher`)

**Entrada:** colección A y colección B (o su payload decodificado).
**Salida:** propuesta `{ aGives: StickerDef[], bGives: StickerDef[] }`.

```
1. ofertaA = repetidas(A) ∩ faltantes(B)
2. ofertaB = repetidas(B) ∩ faltantes(A)
3. n = min(|ofertaA|, |ofertaB|)          // trueque 1:1 justo
4. Priorización dentro de cada oferta:
   a. láminas `special` primero (mayor valor percibido)
   b. secciones con menor % de avance del receptor (máximo impacto)
5. Resultado: n láminas por lado + excedente listado como "extra disponible"
```

Complejidad O(N) con sets sobre índices. Extensible en v2 a matching multi-parte (círculos de 3+ coleccionistas → problema de asignación).

## 6. Estimador de sobres restantes

Modelo del coleccionista de cupones adaptado: si faltan `m` láminas de un universo `N` y cada sobre trae `k` láminas distintas uniformes, la esperanza de láminas nuevas por sobre es `k · m/N` (aproximación sin reemplazo para k ≪ N). Estimación iterativa:

```
sobres = 0; m = faltantes
while m > 0:
  nuevas = max(1, round(k * m / N))
  m -= nuevas; sobres += 1
```

Se presenta como rango (±20%) con lenguaje honesto: "aprox. 34–50 sobres". Documentar supuestos en la UI (distribución uniforme, sin intercambios).

## 7. Invariantes

- `ownedCounts[i] ≥ 0` para todo índice; índices fuera de rango se descartan al importar.
- `totalStickers === Σ |section.stickers|` (validado en CI).
- `index` es único y contiguo 0..N-1 dentro del álbum (validado en CI).
- Import de respaldo o payload nunca destruye datos sin confirmación explícita del usuario.
