import { expect, test } from '@playwright/test';

test('lineup CSV supports individual b2b ratings, sorting, and export without times', async ({ page }) => {
  await page.goto('/heatmaps/custom');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'lineup.csv', mimeType: 'text/csv',
    buffer: Buffer.from('festival,date,artist,rating\nLineup Fest,2026-10-24,Club Angel,hot\nLineup Fest,2026-10-24,Kyle Starkey,blazing\nLineup Fest,2026-10-24,Entasia,ok\nLineup Fest,2026-10-24,Ned Bennett,hot\n'),
  });
  const grid = page.getByTestId('lineup-grid').first();
  await expect(grid).toBeVisible();
  await expect(grid.locator('[data-lineup-act]')).toHaveCount(4);
  await expect(grid.locator('[data-lineup-act]').first()).toContainText('Club Angel');
  await page.getByLabel('Artist order').selectOption('rating');
  await expect(grid.locator('[data-lineup-act]').first()).toContainText('Kyle Starkey');
  await expect(grid.locator('[data-lineup-act]').filter({ hasText: 'Entasia' })).toHaveAttribute('aria-label', 'Entasia: ok');
  await expect(grid.locator('[data-lineup-act]').filter({ hasText: 'Ned Bennett' })).toHaveAttribute('aria-label', 'Ned Bennett: hot');
  await expect(grid.locator('[data-lineup-act]').filter({ hasText: 'Entasia' })).toHaveCSS('background-color', 'rgb(254, 240, 184)');
  await expect(grid.locator('[data-lineup-act]').filter({ hasText: 'Ned Bennett' })).toHaveCSS('background-color', 'rgb(255, 157, 46)');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PNG', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('lineup-fest-lineup.png');
});

test('Overbruggen splits every b2b into individually rated artist cards', async ({ page }) => {
  await page.goto('/heatmaps');
  await page.getByRole('link', { name: /Overbruggen Kyle Starkey Invites/ }).click();
  await expect(page.getByText('Timetable pending', { exact: false }).first()).toBeVisible();
  const grid = page.getByTestId('lineup-grid').first();
  await expect(grid.locator('[data-lineup-act]')).toHaveCount(11);
  await expect(grid.getByText('unrated', { exact: true })).toHaveCount(0);
  for (const artist of ['Kyle Starkey', 'Olive Anguz']) {
    const card = grid.locator('[data-lineup-act]').filter({ hasText: artist });
    await expect(card).toHaveAttribute('aria-label', `${artist}: blazing`);
    await expect(card).toHaveCSS('background-color', 'rgb(231, 24, 11)');
  }
  for (const artist of ['Entasia', 'Ned Bennett', 'Inafekt', 'Sensu', 'Olive Anguz', 'STÜM']) {
    await expect(grid.getByText(artist, { exact: true })).toBeVisible();
  }
  await expect(grid.getByText(/b2b/)).toHaveCount(0);
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(grid.getByText('Olive Anguz', { exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
