import { test, expect } from '@playwright/test';

// Con dos o más álbumes cargados aparece el selector en el header. Este spec
// cubre el catálogo: cambiar de álbum debe re-renderizar toda la grilla desde
// el JSON, sin nada específico del álbum hardcodeado en la app.
test('el selector cambia al álbum de Dragon Ball Super y renderiza su grilla', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'USA México Canadá 26' })).toBeVisible();

  await page.getByRole('combobox').selectOption('dragon-ball-super-batalla-dioses');

  // Cambia el encabezado y el total.
  await expect(
    page.getByRole('heading', { name: 'Dragon Ball Super: La Batalla de los Dioses' }),
  ).toBeVisible();
  await expect(page.getByText('0/200', { exact: false })).toBeVisible();

  // Láminas normales 1..180 (enteros corridos) y especiales A..T conviven.
  await expect(page.getByRole('button', { name: '180: no la tengo', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'A: no la tengo', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: /Láminas especiales/ })).toBeVisible();
});
