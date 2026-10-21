import { expect, test, type Page } from '@playwright/test';

async function openOverbruggen(page: Page) {
  await page.goto('/heatmaps');
  await page.getByRole('link', { name: /Overbruggen Kyle Starkey Invites/ }).click();
}

async function uploadSchedule(page: Page, name: string, csv: string) {
  await page.goto('/heatmaps/custom');
  await page.locator('input[type="file"]').setInputFiles({
    name: `${name}.csv`,
    mimeType: 'text/csv',
    buffer: Buffer.from(csv),
  });
}

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

test('Overbruggen shows the confirmed two-stage timetable with separate B2B artists', async ({ page }) => {
  await openOverbruggen(page);

  await expect(page.getByText('Timetable pending', { exact: false })).toHaveCount(0);
  await expect(page.getByText('Arena', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('Club', { exact: true }).first()).toBeVisible();

  for (const artist of [
    'Inafekt', 'Sensu', 'NewTone', 'WOLTERS', 'Kyle Starkey', 'CVNTS',
    'Entasia', 'Ned Bennett', 'Club Angel', 'Olive Anguz', 'STÜM',
  ]) {
    await expect(page.getByText(artist, { exact: true }).first()).toBeVisible();
  }
  await expect(page.getByText(/b2b/i)).toHaveCount(0);
  await expect(page.getByText('15:00', { exact: true }).first()).toBeVisible();
  await expect(page.getByText('23:00', { exact: true }).first()).toBeVisible();

});

test('desktop timetable stays centered and its two stage columns fill the frame', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openOverbruggen(page);

  const timetable = page.getByRole('region', { name: 'Overbruggen Kyle Starkey Invites timetable' });
  const stageGrid = timetable.getByTestId('heatmap-stage-grid');
  const stageHeaders = timetable.getByTestId('heatmap-stage-header');

  await expect(timetable).toBeVisible();
  await expect(stageGrid).toBeVisible();
  await expect(stageHeaders).toHaveCount(2);

  const [timetableBox, stageGridBox, arenaBox, clubBox] = await Promise.all([
    timetable.boundingBox(),
    stageGrid.boundingBox(),
    stageHeaders.nth(0).boundingBox(),
    stageHeaders.nth(1).boundingBox(),
  ]);

  expect(timetableBox).not.toBeNull();
  expect(stageGridBox).not.toBeNull();
  expect(arenaBox).not.toBeNull();
  expect(clubBox).not.toBeNull();

  expect(timetableBox!.width).toBeLessThanOrEqual(940);
  expect(Math.abs(timetableBox!.x + timetableBox!.width / 2 - 720)).toBeLessThanOrEqual(2);
  expect(Math.abs(arenaBox!.width - clubBox!.width)).toBeLessThanOrEqual(2);
  expect(Math.abs(stageGridBox!.x + stageGridBox!.width - (timetableBox!.x + timetableBox!.width))).toBeLessThanOrEqual(2);
});

test('mobile timetable shows one stage at a time with bold bounded navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openOverbruggen(page);

  const timetable = page.getByRole('region', { name: 'Overbruggen Kyle Starkey Invites timetable' });
  const previous = page.getByRole('button', { name: 'Previous stage' });
  const next = page.getByRole('button', { name: 'Next stage' });
  const stageViewport = page.getByTestId('heatmap-stage-viewport');

  await expect(timetable).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Arena' })).toBeVisible();
  await expect(page.getByText('1/2', { exact: true })).toBeVisible();
  await expect(previous).toBeDisabled();
  await expect(next).toBeEnabled();
  await expect(timetable.getByText('NewTone', { exact: true })).toBeVisible();
  await expect(timetable.getByText('CVNTS', { exact: true })).toHaveCount(0);

  await next.click();

  await expect(page.getByRole('heading', { name: 'Club' })).toBeVisible();
  await expect(page.getByText('2/2', { exact: true })).toBeVisible();
  await expect(previous).toBeEnabled();
  await expect(next).toBeDisabled();
  await expect(timetable.getByText('CVNTS', { exact: true })).toBeVisible();
  await expect(timetable.getByText('NewTone', { exact: true })).toHaveCount(0);

  await previous.click();
  const viewportBox = await stageViewport.boundingBox();
  expect(viewportBox).not.toBeNull();
  await stageViewport.dispatchEvent('pointerdown', {
    pointerId: 1,
    pointerType: 'touch',
    clientX: viewportBox!.x + viewportBox!.width - 20,
    clientY: viewportBox!.y + 100,
  });
  await stageViewport.dispatchEvent('pointerup', {
    pointerId: 1,
    pointerType: 'touch',
    clientX: viewportBox!.x + 20,
    clientY: viewportBox!.y + 100,
  });
  await expect(page.getByRole('heading', { name: 'Club' })).toBeVisible();

  await expect(page.getByRole('button', { name: 'Download heatmap as PNG' })).toHaveText('');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(await timetable.evaluate(element => getComputedStyle(element).overflowY)).not.toMatch(/auto|scroll/);
});

test('single-stage mobile timetable disables both stage arrows', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await uploadSchedule(page, 'one-stage', [
    'festival,date,stage,stage_order,artist,start,end,rating',
    'One Stage,2026-10-24,Main,1,Only Artist,15:00,17:00,hot',
  ].join('\n'));

  const timetable = page.getByRole('region', { name: 'One Stage timetable' });
  await expect(timetable).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Main' })).toBeVisible();
  await expect(page.getByText('1/1', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Previous stage' })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Next stage' })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('mobile timetable exposes enabled navigation at an intermediate stage', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await uploadSchedule(page, 'three-stage', [
    'festival,date,stage,stage_order,artist,start,end,rating',
    'Three Stage,2026-10-24,Alpha,1,Artist A,15:00,17:00,ok',
    'Three Stage,2026-10-24,Beta,2,Artist B,15:00,17:00,hot',
    'Three Stage,2026-10-24,Gamma,3,Artist C,15:00,17:00,blazing',
  ].join('\n'));

  const previous = page.getByRole('button', { name: 'Previous stage' });
  const next = page.getByRole('button', { name: 'Next stage' });
  await next.click();

  await expect(page.getByRole('heading', { name: 'Beta' })).toBeVisible();
  await expect(page.getByText('2/3', { exact: true })).toBeVisible();
  await expect(previous).toBeEnabled();
  await expect(next).toBeEnabled();

  await next.click();
  await expect(page.getByRole('heading', { name: 'Gamma' })).toBeVisible();
  await expect(next).toBeDisabled();
});

test('many-stage desktop timetable keeps the time rail visible while horizontally scrolled', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await uploadSchedule(page, 'five-stage', [
    'festival,date,stage,stage_order,artist,start,end,rating',
    'Five Stage,2026-10-24,One,1,Artist 1,15:00,17:00,ok',
    'Five Stage,2026-10-24,Two,2,Artist 2,15:00,17:00,hot',
    'Five Stage,2026-10-24,Three,3,Artist 3,15:00,17:00,blazing',
    'Five Stage,2026-10-24,Four,4,Artist 4,15:00,17:00,nahh',
    'Five Stage,2026-10-24,Five,5,Artist 5,15:00,17:00,ok',
  ].join('\n'));

  const timetable = page.getByRole('region', { name: 'Five Stage timetable' });
  const timeRail = timetable.getByTestId('heatmap-time-rail');
  const stageHeaders = timetable.getByTestId('heatmap-stage-header');

  await expect(timetable).toBeVisible();
  await expect(stageHeaders).toHaveCount(5);
  expect(await timetable.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(true);

  const widths = await stageHeaders.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().width));
  expect(Math.max(...widths) - Math.min(...widths)).toBeLessThanOrEqual(2);

  await timetable.evaluate(element => { element.scrollLeft = element.scrollWidth; });
  await expect.poll(() => timetable.evaluate(element => element.scrollLeft)).toBeGreaterThan(0);

  const [timetableBox, timeRailBox] = await Promise.all([timetable.boundingBox(), timeRail.boundingBox()]);
  expect(timetableBox).not.toBeNull();
  expect(timeRailBox).not.toBeNull();
  expect(Math.abs(timeRailBox!.x - timetableBox!.x)).toBeLessThanOrEqual(2);
  await expect(timeRail.getByText('15:00', { exact: true })).toBeVisible();
});
