# Cómo sumar un álbum

Mi Álbum es un **motor genérico**: la app no sabe nada de fútbol ni de Dragon Ball, solo lee archivos `albums/*.json`. Sumar un álbum nuevo **no requiere tocar código** — alcanza con un JSON válido. El selector, la grilla, las estadísticas, el buscador, el intercambio y el respaldo funcionan solos.

> Prueba de que esto es de verdad: el álbum `albums/dragon-ball-super-batalla-dioses.json` (200 láminas) se agregó con **un solo archivo JSON, cero cambios de código**. Úsalo de plantilla viva.

## Regla de oro (propiedad intelectual)

El JSON contiene **solo datos fácticos**: códigos, números y nombres. **Nunca** imágenes, logos, escaneos ni arte de las láminas. Esos son propiedad de la editorial (Panini, Big Bang, etc.) y de los dueños del contenido (FIFA, Toei, Nintendo…). La app muestra celdas con el código de cada lámina, no la ilustración.

## Paso a paso

### 1. Conseguí la lista de láminas

Necesitás el **checklist**: cuántas láminas hay, cómo están numeradas y en qué secciones se dividen. Fuentes típicas:

- La **contratapa del álbum físico** o su índice.
- El sitio de la **editorial** (p. ej. `big-bang.cl`, `paninigroup.com`).
- Catálogos de coleccionistas (checklists comunitarios).

Anotá: total de láminas, sistema de numeración (¿enteros `1..N`? ¿códigos como `ARG-7`? ¿letras para especiales?), y las secciones (equipos, sagas, categorías).

### 2. Creá `albums/<id>.json`

El `id` va en minúsculas con guiones (`^[a-z0-9]+(-[a-z0-9]+)*$`) y es también el nombre del archivo. Estructura mínima (ver el esquema completo en [`albums/album.schema.json`](../albums/album.schema.json)):

```json
{
  "id": "mi-album-nuevo",
  "name": "Nombre visible del álbum",
  "publisher": "Editorial",
  "year": 2024,
  "packSize": 5,
  "version": "1.0.0",
  "totalStickers": 200,
  "sections": [
    {
      "id": "seccion-uno",
      "name": "Primera sección",
      "stickers": [
        { "code": "1", "index": 0 },
        { "code": "2", "index": 1 }
      ]
    }
  ]
}
```

Campos:

| Campo | Qué es |
|---|---|
| `id` | Identificador único del álbum (= nombre del archivo). |
| `name` | El texto que ve el usuario en el selector y el encabezado. |
| `publisher` | *(opcional)* Editorial. Informativo, sin afiliación. |
| `year` | Año de publicación. |
| `packSize` | Láminas por sobre — alimenta el estimador de sobres. |
| `version` | Semver de **la definición**, empezá en `1.0.0`. |
| `totalStickers` | Total exacto; el CI valida que coincida con la suma real. |
| `sections[]` | Grupos de láminas. Cada sección tiene `id`, `name` y `stickers`. |
| `sections[].group` | *(opcional)* Agrupación de secciones (p. ej. `"Grupo A"`). |
| `stickers[].code` | Identificador visible de la lámina (`"7"`, `"ARG-7"`, `"A"`). Único en el álbum. |
| `stickers[].index` | Posición global `0..N-1`. **Contigua, única, sin huecos.** |
| `stickers[].name` | *(opcional)* Nombre fáctico ("L. Messi", "Beerus"). |
| `stickers[].special` | *(opcional)* `true` para brillantes/holográficas. |

**La clave que más confunde:** `code` es lo que dice la lámina física; `index` es la posición interna `0..N-1` que usa la app. Si la lámina #1 abre el álbum, su `code` es `"1"` y su `index` es `0`. Los `index` de todo el álbum deben cubrir `0, 1, 2, … totalStickers-1` sin saltos ni repetidos, aunque las secciones dividan la numeración.

> **Tip:** para álbumes grandes, generá el JSON con un script en vez de a mano — es la forma segura de no equivocar un índice. Mirá cómo se armó el de Dragon Ball Super.

### 3. Validá

```bash
npm run validate:albums
```

Chequea el esquema y los invariantes del dominio (índices contiguos, códigos únicos, `totalStickers` correcto). Tiene que decir `✅` para tu archivo.

### 4. (Opcional) Verificá en la app

```bash
npm run dev
```

Con dos o más álbumes, aparece un selector en el encabezado. Elegí el tuyo y revisá que la grilla, las secciones y las estadísticas se vean bien.

### 5. Abrí el PR

Título: `album: <nombre>`. El CI corre la validación automáticamente.

## Enriquecimientos opcionales (para mantenedores)

Un álbum funciona 100% solo con el JSON. Estos extras lo pulen y son **buenos primeros aportes de código**:

- **Nombres de sección en inglés** — por defecto la app muestra el `name` del JSON en ambos idiomas. Para traducirlos, agregá el `id` de sección a `EN_NAMES` en [`src/core/section-names.ts`](../src/core/section-names.ts).
- **Emoji por sección** — en las listas para compartir, cada sección lleva un emoji (banderas en el Mundial). Sin mapeo usa 🏳️. Agregá el tuyo en `LITERAL_FLAGS` de [`src/core/flags.ts`](../src/core/flags.ts).
- **Nombres de láminas** — completar `stickers[].name` con los personajes/jugadores hace que el buscador encuentre por nombre.

## Preguntas frecuentes

**¿Puedo mezclar numeración con letras?** Sí. `code` es texto libre: podés tener láminas `"1".."180"` y especiales `"A".."T"` en el mismo álbum, siempre que cada `code` sea único y los `index` sean contiguos.

**¿Y si no tengo el álbum físico?** Se puede armar desde un checklist confiable, pero marcá el PR como "pendiente de confirmar contra el álbum físico" para revisarlo cuando alguien lo tenga en mano.

**¿Necesito imágenes?** No, y no las aceptamos. La app es un rastreador de colección, no un visor de láminas.
