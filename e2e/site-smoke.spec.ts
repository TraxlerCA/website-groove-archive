import { test, expect } from '@playwright/test';

test('primary routes render their key UI', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByLabel('Amsterdam map with interactive music zones')).toBeVisible();

  await page.goto('/cabra');
  await expect(page.getByTestId('cabra-primary-value')).toBeVisible();

  await page.goto('/crate');
  await expect(page.getByText('Crate Digger mode')).toBeVisible();

  await page.goto('/list');
  await expect(page.getByPlaceholder('Type to filter')).toBeVisible();

  await page.goto('/artists');
  await expect(page.locator('main')).toBeVisible();

  await page.goto('/heatmaps');
  await expect(page.getByRole('heading', { name: 'Heatmaps.' })).toBeVisible();

  await page.goto('/suggest');
  await expect(page.getByRole('heading', { name: 'Suggest a set' })).toBeVisible();
});

test('header navigation updates active route state', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('link', { name: 'List' }).click();
  await expect(page).toHaveURL(/\/list$/);
  await expect(page.getByRole('link', { name: 'List' })).toHaveAttribute('aria-current', 'page');

  await page.getByRole('link', { name: 'Artists' }).click();
  await expect(page).toHaveURL(/\/artists$/);
  await expect(page.getByRole('link', { name: 'Artists' })).toHaveAttribute('aria-current', 'page');

  await page.getByRole('link', { name: 'Heatmaps' }).click();
  await expect(page).toHaveURL(/\/heatmaps$/);
  await expect(page.getByRole('link', { name: 'Heatmaps' })).toHaveAttribute('aria-current', 'page');

  await page.getByRole('link', { name: 'Suggest' }).first().click();
  await expect(page).toHaveURL(/\/suggest$/);
});
