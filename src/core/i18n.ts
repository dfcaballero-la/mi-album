/**
 * Catálogo de traducciones (ES primero, EN después — ver BRIEF §4.1).
 * Módulo puro: solo datos y funciones de formateo de texto, sin React ni
 * browser APIs. La detección/persistencia del locale activo vive en la UI.
 */

export type Locale = 'es' | 'en';

export interface Translations {
  common: {
    loading: string;
    noAlbums: string;
    back: string;
    cancel: string;
  };
  header: {
    chooseAlbumLabel: string;
    stats: (a: {
      owned: number;
      total: number;
      progressPct: number;
      duplicates: number;
      packsMin: number;
      packsMax: number;
    }) => string;
    trade: string;
    exportBackup: string;
    importBackup: string;
    filterGroupLabel: string;
    filterAll: string;
    filterDuplicates: (count: number) => string;
    searchPlaceholder: string;
    searchLabel: string;
    jumpNavLabel: string;
    noDuplicatesYet: string;
    noResultsFor: (query: string) => string;
    sectionStats: (a: { owned: number; total: number; progressPct: number }) => string;
  };
  sticker: {
    tooltip: string;
    ariaLabel: (code: string, count: number) => string;
  };
  importFlow: {
    confirmFiguritas: string;
    confirmBackup: string;
    unmatched: (a: { count: number; codes: string; truncated: boolean }) => string;
    error: (message: string) => string;
    unknownFormat: string;
  };
  trade: {
    title: string;
    close: string;
    menuIntro: string;
    showMyCode: string;
    scanFriendCode: string;
    shareIntro: string;
    shareDuplicates: (count: number) => string;
    shareMissing: (count: number) => string;
    showCodeInstructions: string;
    textFallbackSummary: string;
    back: string;
    cameraError: string;
    invalidCode: string;
    pasteLabel: string;
    pastePlaceholder: string;
    useThisCode: string;
    shareTextInstructions: string;
    copy: string;
    copied: string;
    youGive: (count: number) => string;
    noDuplicatesTheyNeed: string;
    youReceive: (count: number) => string;
    friendHasNothing: string;
    noTradePossible: string;
    confirmTrade: string;
    cancel: string;
    done: string;
    doneInstructions: string;
    backToAlbum: string;
  };
  share: {
    missingTitle: string;
    duplicatesTitle: string;
    footer: string;
    albumComplete: string;
    noDuplicates: string;
  };
}

const es: Translations = {
  common: {
    loading: 'Cargando…',
    noAlbums: 'No hay álbumes disponibles.',
    back: 'Volver',
    cancel: 'Cancelar',
  },
  header: {
    chooseAlbumLabel: 'Elegir álbum',
    stats: ({ owned, total, progressPct, duplicates, packsMin, packsMax }) =>
      `${owned}/${total} · ${progressPct}% · ${duplicates} repetidas · faltan aprox. ${packsMin}–${packsMax} sobres`,
    trade: '🔄 Intercambiar',
    exportBackup: '⬇️ Guardar respaldo',
    importBackup: '⬆️ Importar (respaldo o figuritas.app)',
    filterGroupLabel: 'Filtrar láminas',
    filterAll: 'Todas',
    filterDuplicates: (count) => `Solo repetidas (${count})`,
    searchPlaceholder: 'Buscar por código o nombre…',
    searchLabel: 'Buscar lámina por código o nombre',
    jumpNavLabel: 'Saltar a sección',
    noDuplicatesYet: 'Todavía no tenés láminas repetidas.',
    noResultsFor: (query) => `No encontramos láminas para «${query}».`,
    sectionStats: ({ owned, total, progressPct }) => `${owned}/${total} · ${progressPct}%`,
  },
  sticker: {
    tooltip: 'Clic: sumar · Ctrl/Cmd+clic o mantener presionada: restar',
    ariaLabel: (code, count) => {
      if (count === 0) return `${code}: no la tengo`;
      if (count === 1) return `${code}: la tengo`;
      return `${code}: repetida ×${count - 1}`;
    },
  },
  importFlow: {
    confirmFiguritas: 'Esto reemplazará la colección actual con la importada. ¿Continuar?',
    confirmBackup: 'Esto restaurará el respaldo y sobrescribirá la colección actual. ¿Continuar?',
    unmatched: ({ count, codes, truncated }) =>
      `Importado con ${count} códigos no reconocidos: ${codes}${truncated ? '…' : ''}`,
    error: (message) => `No se pudo importar: ${message}`,
    unknownFormat: 'formato desconocido',
  },
  trade: {
    title: '🔄 Intercambiar',
    close: '✕ Cerrar',
    menuIntro:
      'Sin cuentas ni internet: cada uno escanea el código del otro desde su celular. Para que las dos colecciones queden al día, ambos tienen que escanearse mutuamente.',
    showMyCode: '📤 Mostrar mi código',
    scanFriendCode: '📷 Escanear código de un amigo',
    shareIntro:
      'O mandá una lista de texto por WhatsApp o Instagram para que la otra persona vea qué te puede ofrecer, aunque no tenga la app:',
    shareDuplicates: (count) => `📋 Compartir repetidas (${count})`,
    shareMissing: (count) => `📋 Compartir faltantes (${count})`,
    showCodeInstructions:
      'Mostrale esta pantalla a tu amigo para que la escanee con la opción «Escanear código de un amigo» de su celular.',
    textFallbackSummary: 'No podés escanear: usar el código como texto',
    back: 'Volver',
    cameraError: 'No se pudo acceder a la cámara. Pegá el código manualmente.',
    invalidCode: 'Código inválido.',
    pasteLabel: 'O pegá el código que te compartieron:',
    pastePlaceholder: 'Pegá acá el código…',
    useThisCode: 'Usar este código',
    shareTextInstructions: 'Copiá este texto y pegalo en WhatsApp, Instagram o donde quieras.',
    copy: '📋 Copiar',
    copied: '✅ Copiado',
    youGive: (count) => `Vos das (${count})`,
    noDuplicatesTheyNeed: 'No tenés repetidas que a tu amigo le falten.',
    youReceive: (count) => `Vos recibís (${count})`,
    friendHasNothing: 'Tu amigo no tiene repetidas que te falten.',
    noTradePossible: 'No hay trueque posible por ahora.',
    confirmTrade: '✅ Confirmar intercambio',
    cancel: 'Cancelar',
    done: '¡Listo! Tu colección se actualizó.',
    doneInstructions:
      'Para que la colección de tu amigo también quede al día, ahora mostrale tu código (📤 Mostrar mi código) y que la escanee desde su celular.',
    backToAlbum: 'Volver al álbum',
  },
  share: {
    missingTitle: 'Me FALTAN estas láminas',
    duplicatesTitle: 'Tengo REPETIDAS estas láminas',
    footer: 'Generado con Mi Álbum 📱 (offline, sin cuentas)',
    albumComplete: '¡Álbum completo! 🎉',
    noDuplicates: 'Todavía no tengo repetidas.',
  },
};

const en: Translations = {
  common: {
    loading: 'Loading…',
    noAlbums: 'No albums available.',
    back: 'Back',
    cancel: 'Cancel',
  },
  header: {
    chooseAlbumLabel: 'Choose album',
    stats: ({ owned, total, progressPct, duplicates, packsMin, packsMax }) =>
      `${owned}/${total} · ${progressPct}% · ${duplicates} duplicates · about ${packsMin}–${packsMax} packs left`,
    trade: '🔄 Trade',
    exportBackup: '⬇️ Save backup',
    importBackup: '⬆️ Import (backup or figuritas.app)',
    filterGroupLabel: 'Filter stickers',
    filterAll: 'All',
    filterDuplicates: (count) => `Duplicates only (${count})`,
    searchPlaceholder: 'Search by code or name…',
    searchLabel: 'Search sticker by code or name',
    jumpNavLabel: 'Jump to section',
    noDuplicatesYet: "You don't have any duplicates yet.",
    noResultsFor: (query) => `No stickers found for "${query}".`,
    sectionStats: ({ owned, total, progressPct }) => `${owned}/${total} · ${progressPct}%`,
  },
  sticker: {
    tooltip: 'Click: add · Ctrl/Cmd+click or long-press: remove',
    ariaLabel: (code, count) => {
      if (count === 0) return `${code}: missing`;
      if (count === 1) return `${code}: owned`;
      return `${code}: duplicate ×${count - 1}`;
    },
  },
  importFlow: {
    confirmFiguritas: 'This will replace your current collection with the imported one. Continue?',
    confirmBackup: 'This will restore the backup and overwrite your current collection. Continue?',
    unmatched: ({ count, codes, truncated }) =>
      `Imported with ${count} unrecognized codes: ${codes}${truncated ? '…' : ''}`,
    error: (message) => `Couldn't import: ${message}`,
    unknownFormat: 'unknown format',
  },
  trade: {
    title: '🔄 Trade',
    close: '✕ Close',
    menuIntro:
      "No accounts, no internet: each person scans the other's code from their phone. For both collections to stay up to date, you both need to scan each other.",
    showMyCode: '📤 Show my code',
    scanFriendCode: "📷 Scan a friend's code",
    shareIntro:
      'Or send a text list via WhatsApp or Instagram so the other person can see what they can offer you, even without the app:',
    shareDuplicates: (count) => `📋 Share duplicates (${count})`,
    shareMissing: (count) => `📋 Share missing (${count})`,
    showCodeInstructions:
      'Show this screen to your friend so they can scan it with the "Scan a friend\'s code" option on their phone.',
    textFallbackSummary: "Can't scan? Use the code as text",
    back: 'Back',
    cameraError: 'Could not access the camera. Paste the code manually instead.',
    invalidCode: 'Invalid code.',
    pasteLabel: 'Or paste the code they shared with you:',
    pastePlaceholder: 'Paste the code here…',
    useThisCode: 'Use this code',
    shareTextInstructions: 'Copy this text and paste it into WhatsApp, Instagram, or wherever you like.',
    copy: '📋 Copy',
    copied: '✅ Copied',
    youGive: (count) => `You give (${count})`,
    noDuplicatesTheyNeed: "You don't have any duplicates your friend needs.",
    youReceive: (count) => `You receive (${count})`,
    friendHasNothing: "Your friend doesn't have any duplicates you need.",
    noTradePossible: 'No trade is possible right now.',
    confirmTrade: '✅ Confirm trade',
    cancel: 'Cancel',
    done: 'Done! Your collection was updated.',
    doneInstructions:
      "For your friend's collection to stay up to date too, now show them your code (📤 Show my code) so they can scan it from their phone.",
    backToAlbum: 'Back to album',
  },
  share: {
    missingTitle: "I'm MISSING these stickers",
    duplicatesTitle: 'I have these DUPLICATE stickers',
    footer: 'Generated with Mi Álbum 📱 (offline, no accounts)',
    albumComplete: 'Album complete! 🎉',
    noDuplicates: "I don't have any duplicates yet.",
  },
};

export const translations: Record<Locale, Translations> = { es, en };

export const LOCALES: Locale[] = ['es', 'en'];

export function isLocale(value: string): value is Locale {
  return value === 'es' || value === 'en';
}
