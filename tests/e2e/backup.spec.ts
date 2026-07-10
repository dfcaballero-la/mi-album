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

test('importar un respaldo JSON restaura la colección', async ({ page }) => {
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
