/**
 * Entidades del dominio — Mi Álbum
 * Módulo puro: sin dependencias de React, browser ni persistencia.
 * Ver docs/DATA_MODEL.md para el modelo completo.
 */

/** Definición estática de un álbum (inmutable, proviene de albums/*.json). */
export interface AlbumDefinition {
  id: string;
  name: string;
  publisher?: string;
  year: number;
  /** Láminas por sobre — insumo del estimador de sobres. */
  packSize: number;
  sections: Section[];
  /** Derivado: debe igualar la suma de stickers de todas las secciones (validado en CI). */
  totalStickers: number;
  /** Semver de la definición del álbum. */
  version: string;
}

export interface Section {
  id: string;
  name: string;
  /** Agrupación opcional, p. ej. "Grupo A". */
  group?: string;
  stickers: StickerDef[];
}

export interface StickerDef {
  /** Identificador visible en la lámina física, p. ej. "ARG-7". */
  code: string;
  /** Posición global 0..N-1 — clave para el bitset del codec. */
  index: number;
  name?: string;
  /** Lámina especial (brillante, escudo, etc.). */
  special?: boolean;
}

/** Estado mutable del usuario sobre un álbum. */
export interface Collection {
  albumId: string;
  /** index -> número de copias (ausente o 0 = no la tengo). */
  ownedCounts: Record<number, number>;
  /** ISO-8601 del último cambio a la colección (nivel colección). */
  updatedAt: string;
  /**
   * index -> ISO-8601 del último cambio de ESA lámina. Solo lo usa el merge
   * de sync (`core/sync.ts`) para last-write-wins por lámina; el resto de la
   * app lee `ownedCounts`. Una entrada acá cuya lámina NO está en
   * `ownedCounts` es un "tombstone" (se borró en ese momento), lo que permite
   * que un borrado se propague al sincronizar. Opcional: las colecciones
   * creadas antes de v2 no lo tienen y el merge cae a `updatedAt`.
   */
  stickerUpdatedAt?: Record<number, string>;
}

/** Vista derivada de una colección (nunca se persiste). */
export interface CollectionStats {
  total: number;
  owned: number;
  missing: number;
  duplicates: number;
  progress: number; // 0..1
  bySection: SectionStats[];
  packsEstimate: { min: number; max: number };
}

export interface SectionStats {
  sectionId: string;
  name: string;
  total: number;
  owned: number;
  progress: number;
}

/** Propuesta de intercambio bilateral calculada por trade-matcher. */
export interface TradeProposal {
  aGives: StickerDef[];
  bGives: StickerDef[];
  /** Repetidas de A que B no necesita (y viceversa) — visibles como "extras". */
  aExtras: StickerDef[];
  bExtras: StickerDef[];
}
