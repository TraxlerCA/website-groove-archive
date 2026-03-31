import path from 'node:path';
import { expect, test } from '@playwright/test';

test('labs record bin loads and responds to desktop controls', async ({ page }) => {
  const consoleErrors: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push(message.text());
    }
  });

  await page.goto('/labs');
  await expect(page.getByText('Unlinked experiments')).toBeVisible();

  await page.goto('/labs/record-bin');
  await expect(page.getByRole('region', { name: 'Record Bin' })).toBeVisible();
  await expect(page.locator('[data-nextjs-dialog]')).toHaveCount(0);
  const filter = page.getByLabel('Filter by genre');
  await expect(filter).toBeVisible();
  await expect(filter).toHaveValue('All');
  await expect(page.getByRole('button', { name: 'Show previous record' })).toBeVisible();
  await expect(page.locator('ol button[tabindex="0"]')).toHaveCount(5);

  const status = page.locator('#record-bin-status');
  const initialStatus = await status.textContent();

  const activeSleeve = page.locator('button[aria-label$=", active sleeve"]').first();
  await activeSleeve.focus();
  await page.keyboard.press('ArrowRight');

  await expect(status).not.toHaveText(initialStatus ?? '', { timeout: 5_000 });

  const movedStatus = await status.textContent();
  await page.getByRole('button', { name: 'Show previous record' }).click();
  await expect(status).toHaveText(initialStatus ?? '', { timeout: 5_000 });
  expect(movedStatus).not.toBe(initialStatus);

  const genreOptions = await filter.locator('option').allTextContents();
  const firstGenre = genreOptions.find((option) => option !== 'All');
  if (firstGenre) {
    await filter.selectOption(firstGenre);
    await expect(filter).toHaveValue(firstGenre);

    const firstGenreStatus = await status.textContent();
    const totalMatch = firstGenreStatus?.match(/Item \d+ of (\d+):/);
    const total = Number(totalMatch?.[1] ?? '1');

    for (let index = 0; index < total; index += 1) {
      await page.getByRole('button', { name: 'Show next record' }).click();
    }

    await expect(status).toHaveText(firstGenreStatus ?? '', { timeout: 5_000 });
  }

  await page.screenshot({
    path: path.join(process.cwd(), 'tmp-labs-record-bin-browser.png'),
    fullPage: true,
  });

  expect(consoleErrors).toEqual([]);
});

test('labs record bin collapses to three visible sleeves on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });

  await page.goto('/labs/record-bin');
  await expect(page.getByLabel('Filter by genre')).toHaveValue('All');
  await expect(page.locator('ol button[tabindex="0"]')).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'Show next record' })).toBeVisible();
});
