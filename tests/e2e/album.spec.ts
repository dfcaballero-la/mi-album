import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'USA México Canadá 26' })).toBeVisible();
});

test('marcar una lámina cicla los estados y actualiza las stats', async ({ page }) => {
  const sticker = page.getByRole('button', { name: /^FWC-1:/ });

  await expect(page.getByText('0/980', { exact: false })).toBeVisible();

  await sticker.click();
  await expect(sticker).toHaveAttribute('aria-label', 'FWC-1: la tengo');
  await expect(page.getByText('1/980', { exact: false })).toBeVisible();

  await sticker.click();
  await expect(sticker).toHaveAttribute('aria-label', 'FWC-1: repetida ×1');
  await expect(page.getByText('1 repetidas', { exact: false })).toBeVisible();

  // Ctrl/Cmd+clic resta una copia en vez de sumar. Se usa 'Meta' (Cmd) porque
  // en macOS, Ctrl+clic con mouse dispara "contextmenu" en vez de "click"
  // (convención del SO) — Cmd+clic sí produce un click normal en cualquier
  // plataforma, así que es el modificador portable para testear esto.
  await sticker.click({ modifiers: ['Meta'] });
  await expect(sticker).toHaveAttribute('aria-label', 'FWC-1: la tengo');
  await expect(page.getByText('0 repetidas', { exact: false })).toBeVisible();
});

test('el filtro "solo repetidas" y el buscador acotan la grilla', async ({ page }) => {
  const fwc1 = page.getByRole('button', { name: /^FWC-1:/ });
  await fwc1.click();
  await fwc1.click(); // repetida ×1

  await page.getByRole('button', { name: /Solo repetidas/ }).click();
  await expect(fwc1).toBeVisible();
  await expect(page.getByRole('button', { name: /^FWC-2:/ })).not.toBeVisible();

  await page.getByRole('button', { name: 'Todas' }).click();
  await page.getByPlaceholder('Buscar por código o nombre…').fill('mex-3');
  await expect(page.getByRole('button', { name: /^MEX-3:/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^MEX-1:/ })).not.toBeVisible();
});
