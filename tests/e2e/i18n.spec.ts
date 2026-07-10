import { test, expect } from '@playwright/test';

test('cambia de idioma, se propaga a la pantalla de intercambio y la elección persiste', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('button', { name: '🔄 Intercambiar' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Todas' })).toBeVisible();

  // Los nombres de país vienen del JSON en español.
  await expect(page.getByRole('heading', { name: /^Alemania/ })).toBeVisible();

  const langGroup = page.getByRole('group', { name: 'Idioma / Language' });
  await langGroup.getByRole('button', { name: 'en' }).click();

  await expect(page.getByRole('button', { name: '🔄 Trade' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'All' })).toBeVisible();

  // En inglés, los países y los grupos se traducen (core/section-names.ts).
  await expect(page.getByRole('heading', { name: /^Germany/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Alemania/ })).not.toBeVisible();
  await expect(page.getByText('Group E').first()).toBeVisible();

  await page.getByRole('button', { name: '🔄 Trade' }).click();
  await expect(page.getByRole('heading', { name: '🔄 Trade' })).toBeVisible();
  await expect(page.getByRole('button', { name: '📤 Show my code' })).toBeVisible();
  await expect(page.getByRole('button', { name: "📷 Scan a friend's code" })).toBeVisible();

  // La elección de idioma sobrevive a un reload (persiste en Dexie).
  await page.reload();
  await expect(page.getByRole('button', { name: '🔄 Trade' })).toBeVisible();
});
