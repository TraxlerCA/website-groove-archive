import { test, expect } from '@playwright/test';

test('renders the map stage on home', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByLabel('Amsterdam map with interactive music zones')).toBeVisible();
});

test('selects a zone by click and opens the active set card', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Open Melodic House & Techno zone' }).click();
  await expect(page.getByRole('article').getByText('Melodic House & Techno')).toBeVisible();
});

test('selects a zone with keyboard enter', async ({ page }) => {
  await page.goto('/');
  const target = page.getByRole('button', { name: 'Open Festival Anthems & Big Room zone' });
  await target.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('article').getByText('Festival Anthems & Big Room')).toBeVisible();
});
