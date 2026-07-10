/**
 * Catálogo de álbumes disponibles: descubre automáticamente cualquier
 * `albums/*.json` (menos el esquema) para que un álbum nuevo aportado por
 * la comunidad aparezca en el selector sin tocar código.
 */
import type { AlbumDefinition } from '@core/types';

const modules = import.meta.glob<AlbumDefinition>('../albums/*.json', {
  eager: true,
  import: 'default',
});

export const albums: AlbumDefinition[] = Object.entries(modules)
  .filter(([path]) => !path.endsWith('.schema.json'))
  .map(([, album]) => album)
  .sort((a, b) => a.name.localeCompare(b.name));
