import { test, expect } from '@playwright/test';
import { encodeCollection } from '../../src/core/codec';
import type { AlbumDefinition, Collection } from '../../src/core/types';
import albumData from '../../albums/mundial-2026.json' with { type: 'json' };

const album = albumData as AlbumDefinition;

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('mostrar mi código genera un QR', async ({ page }) => {
  await page.getByRole('button', { name: '🔄 Intercambiar' }).click();
  await page.getByRole('button', { name: '📤 Mostrar mi código' }).click();
  await expect(page.locator('canvas')).toBeVisible();
});

test('pegar el código de un amigo propone y confirma el trueque', async ({ page }) => {
  // Marco mi FWC-1 como repetida — es lo que le voy a dar al amigo.
  const fwc1 = page.getByRole('button', { name: /^FWC-1:/ });
  await fwc1.click();
  await fwc1.click();

  // El amigo tiene de más justo lo que a mí me falta (FWC-2, index 2) y
  // necesita mi repetida (FWC-1, index 1) — trueque 1:1 esperado.
  const friend: Collection = {
    albumId: album.id,
    ownedCounts: { 2: 2 },
    updatedAt: new Date().toISOString(),
  };
  const friendCode = await encodeCollection(album, friend);

  await page.getByRole('button', { name: '🔄 Intercambiar' }).click();
  await page.getByRole('button', { name: '📷 Escanear código de un amigo' }).click();
  await page.getByPlaceholder('Pegá acá el código…').fill(friendCode);
  await page.getByRole('button', { name: 'Usar este código' }).click();

  await expect(page.getByText('Vos das (1)')).toBeVisible();
  await expect(page.getByText('Vos recibís (1)')).toBeVisible();

  await page.getByRole('button', { name: '✅ Confirmar intercambio' }).click();
  await expect(page.getByText('¡Listo! Tu colección se actualizó.')).toBeVisible();

  await page.getByRole('button', { name: 'Volver al álbum' }).click();
  await expect(page.getByText('2/980', { exact: false })).toBeVisible();
  await expect(page.getByText('0 repetidas', { exact: false })).toBeVisible();
});
