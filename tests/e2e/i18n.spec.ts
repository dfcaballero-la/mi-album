import { test, expect } from '@playwright/test';

test('cambia de idioma, se propaga a la pantalla de intercambio y la elección persiste', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('button', { name: '🔄 Intercambiar' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Todas' })).toBeVisible();

  const langGroup = page.getByRole('group', { name: 'Idioma / Language' });
  await langGroup.getByRole('button', { name: 'en' }).click();

  await expect(page.getByRole('button', { name: '🔄 Trade' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'All' })).toBeVisible();

  await page.getByRole('button', { name: '🔄 Trade' }).click();
  await expect(page.getByRole('heading', { name: '🔄 Trade' })).toBeVisible();
  await expect(page.getByRole('button', { name: '📤 Show my code' })).toBeVisible();
  await expect(page.getByRole('button', { name: "📷 Scan a friend's code" })).toBeVisible();

  // La elección de idioma sobrevive a un reload (persiste en Dexie).
  await page.reload();
  await expect(page.getByRole('button', { name: '🔄 Trade' })).toBeVisible();
});
