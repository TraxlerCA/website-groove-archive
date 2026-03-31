import { test, expect } from '@playwright/test';

test('renders the record-bin homepage on desktop', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Flip through the archive until one feels right.' })).toBeVisible();
  await expect(page.getByLabel('Filter by genre')).toHaveValue('All');
  await expect(
    page.getByRole('button', {
      name: 'Open Live from Lost Village - Demi Riquisimo b2b Nyra on SoundCloud, or YouTube if SoundCloud is unavailable',
    }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Show next record' })).toBeVisible();
});

test('advances the homepage deck with desktop controls', async ({ page }) => {
  await page.goto('/');
  const activeCardTitle = page.getByRole('heading', { level: 2 }).first();
  const initialTitle = (await activeCardTitle.textContent())?.trim() ?? '';

  await page.getByRole('button', { name: 'Show next record' }).click();
  await expect(activeCardTitle).not.toHaveText(initialTitle);

  const movedTitle = (await activeCardTitle.textContent())?.trim() ?? '';
  expect(movedTitle).not.toBe(initialTitle);

  await page.getByRole('button', { name: 'Show previous record' }).click();
  await expect(activeCardTitle).toHaveText(initialTitle);
});

test('filters the homepage deck by genre', async ({ page }) => {
  await page.goto('/');
  const filter = page.getByLabel('Filter by genre');
  await filter.selectOption('House');
  await expect(filter).toHaveValue('House');

  const activeCardTitle = page.getByRole('heading', { level: 2 }).first();
  const initialTitle = (await activeCardTitle.textContent())?.trim() ?? '';

  await page.getByRole('button', { name: 'Show next record' }).click();
  await expect(activeCardTitle).not.toHaveText(initialTitle);
});
