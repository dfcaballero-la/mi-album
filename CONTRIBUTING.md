# Contribuir a Mi Álbum

¡Gracias por tu interés! Hay dos formas principales de aportar.

## 1. Añadir un nuevo álbum (sin tocar código)

1. Crea `albums/<id-del-album>.json` siguiendo el esquema de `albums/album.schema.json`.
2. Reglas de contenido: **solo datos fácticos** (códigos, números, nombres). Nunca imágenes, logos ni arte con copyright.
3. Invariantes: `index` contiguos 0..N-1 y únicos, `code` únicos, `totalStickers` = suma real.
4. Valida localmente: `npm run validate:albums`.
5. Abre un PR con título `album: <nombre>`.

## 2. Contribuir código

1. Haz fork y crea una rama desde `main`: `feat/<descripcion>` o `fix/<descripcion>`.
2. Instala y verifica: `npm install && npm run lint && npm test`.
3. Reglas del proyecto:
   - TypeScript `strict`; sin `any` salvo justificación comentada.
   - La lógica de negocio vive en `src/core/` (puro, sin React/browser) y requiere tests.
   - Commits con [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `docs:`, `test:`...
   - Cambios de UI incluyen screenshot en el PR.
4. El CI debe estar verde para hacer merge.

## Principios innegociables

- **Offline-first:** ninguna funcionalidad del MVP puede requerir red.
- **Privacidad:** cero telemetría, cero cuentas obligatorias, apto para menores.
- **Simplicidad:** si un niño de 8 años no puede usarlo, no está terminado.

## Código de conducta

Sé amable. Este proyecto lo usan familias y niños; el mismo espíritu aplica a la comunidad.
