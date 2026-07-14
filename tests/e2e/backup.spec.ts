import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('exportar respaldo descarga un JSON válido con la colección actual', async ({ page }) => {
  await page.getByRole('button', { name: /^FWC-1:/ }).click();

  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: '⬇️ Guardar respaldo' }).click(),
  ]);

  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  const backup = JSON.parse(Buffer.concat(chunks).toString('utf-8'));

  expect(backup.app).toBe('mi-album');
  expect(backup.collections).toHaveLength(1);
  expect(backup.collections[0].albumId).toBe('mundial-2026');
});

test('importar un respaldo en una colección vacía trae sus láminas', async ({ page }) => {
  await expect(page.getByText('0/980', { exact: false })).toBeVisible();

  page.once('dialog', (dialog) => void dialog.accept());

  const backup = {
    app: 'mi-album',
    version: 1,
    exportedAt: new Date().toISOString(),
    collections: [
      {
        albumId: 'mundial-2026',
        ownedCounts: { 0: 1, 1: 2 },
        updatedAt: new Date().toISOString(),
      },
    ],
  };

  await page.locator('input[type="file"]').setInputFiles({
    name: 'respaldo.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });

  await expect(page.getByText('2/980', { exact: false })).toBeVisible();
  await expect(page.getByText('1 repetidas', { exact: false })).toBeVisible();
});

test('importar un respaldo se fusiona con lo local (no lo sobrescribe)', async ({ page }) => {
  // Marco FWC-1 (índice 1) en este dispositivo.
  await page.getByRole('button', { name: /^FWC-1:/ }).click();
  await expect(page.getByText('1/980', { exact: false })).toBeVisible();

  page.once('dialog', (dialog) => void dialog.accept());

  const now = new Date().toISOString();
  const backup = {
    app: 'mi-album',
    version: 1,
    exportedAt: now,
    // El respaldo trae OTRA lámina (FWC-2, índice 2) repetida — como si
    // viniera del otro dispositivo. La fusión debe conservar ambas.
    collections: [
      {
        albumId: 'mundial-2026',
        ownedCounts: { 2: 2 },
        updatedAt: now,
        stickerUpdatedAt: { 2: now },
      },
    ],
  };

  await page.locator('input[type="file"]').setInputFiles({
    name: 'respaldo.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(backup)),
  });

  // FWC-1 local sigue estando Y FWC-2 del respaldo se sumó.
  await expect(page.getByRole('button', { name: 'FWC-1: la tengo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'FWC-2: repetida ×1' })).toBeVisible();
  await expect(page.getByText('2/980', { exact: false })).toBeVisible();
  await expect(page.getByText('1 repetidas', { exact: false })).toBeVisible();
});
