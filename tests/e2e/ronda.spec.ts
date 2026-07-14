import { test, expect } from '@playwright/test';
import { encodeCollection } from '../../src/core/codec';
import type { AlbumDefinition, Collection } from '../../src/core/types';
import albumData from '../../albums/mundial-2026.json' with { type: 'json' };

const album = albumData as AlbumDefinition;

const coll = (ownedCounts: Record<number, number>): Collection => ({
  albumId: album.id,
  ownedCounts,
  updatedAt: new Date().toISOString(),
});

test('la ronda encuentra un círculo de 3 y confirma mi parte', async ({ page }) => {
  await page.goto('/');

  // "Yo": FWC-00 repetida (índice 0) y FWC-1 (índice 1); me falta FWC-2 (índice 2).
  const fwc00 = page.getByRole('button', { name: /^FWC-00:/ });
  await fwc00.click();
  await fwc00.click(); // repetida ×1
  await page.getByRole('button', { name: /^FWC-1:/ }).click(); // la tengo

  // Dos amigos que cierran el triángulo:
  //  yo doy 0→Amigo1; Amigo1 da 1→Amigo2; Amigo2 da 2→yo.
  const amigo1 = await encodeCollection(album, coll({ 1: 2, 2: 1 }));
  const amigo2 = await encodeCollection(album, coll({ 2: 2, 0: 1 }));

  await page.getByRole('button', { name: '🔄 Intercambiar' }).click();
  await page.getByRole('button', { name: /Ronda de intercambio/ }).click();

  for (const code of [amigo1, amigo2]) {
    await page.getByRole('button', { name: /Sumar a alguien/ }).click();
    await page.getByPlaceholder('Pegá acá el código…').fill(code);
    await page.getByRole('button', { name: 'Usar este código' }).click();
  }

  // Aparece el círculo con mi resumen (doy FWC-00, recibo FWC-2).
  await expect(page.getByText('Vos: das FWC-00, recibís FWC-2')).toBeVisible();

  // Confirmo mi parte y el botón queda "hecho".
  await page.getByRole('button', { name: 'Confirmar mi parte' }).click();
  await expect(page.getByRole('button', { name: '✅ Hecho' })).toBeVisible();
});
