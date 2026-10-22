import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const csv = `festival,date,stage,artist,start,end,rating,stage_order
Quality Check Fest,2026-03-30,Main,Artist A,13:00,14:00,blazing,1
Quality Check Fest,2026-03-30,Main,Artist B,14:00,15:15,hot,1
Quality Check Fest,2026-03-30,Arena,Artist C,13:30,14:45,ok,2
Quality Check Fest,2026-03-30,Arena,Artist D,15:00,16:30,nahh,2
Quality Check Fest,2026-03-30,Lounge,Artist E,13:15,13:55,hot,3
Quality Check Fest,2026-03-30,Lounge,Artist F,14:10,15:40,blazing,3
`;

test('custom heatmap exports PNG', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Downloads are verified in Chromium');

  await page.goto('/heatmaps/custom');

  await page.locator('input[type="file"]').setInputFiles({
    name: 'quality-check.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csv, 'utf8'),
  });

  await expect(page.getByRole('heading', { name: 'Quality Check Fest' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'PNG' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'PDF' })).toHaveCount(0);

  const exportSurface = page.getByTestId('heatmap-export-surface');
  await expect(exportSurface.getByTestId('export-set')).toHaveCount(6);
  await expect(exportSurface.getByTestId('heat-level')).toHaveCount(0);
  const liveColour = await page.getByTestId('desktop-set').first().evaluate(el => getComputedStyle(el).backgroundColor);
  await expect(exportSurface.getByTestId('export-set').first()).toHaveCSS('background-color', liveColour);
  const bounds = await exportSurface.boundingBox();
  expect(bounds?.width ?? 0).toBeGreaterThan(700);
  expect(bounds?.height ?? 0).toBeGreaterThan(500);

  const pngDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PNG' }).click();
  const png = await pngDownload;
  expect(png.suggestedFilename()).toBe('quality-check-fest-heatmap.png');
  const imageData = (await readFile((await png.path())!)).toString('base64');
  const downloaded = await page.evaluate(async encoded => {
    const image = new Image();
    image.src = `data:image/png;base64,${encoded}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 1;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0);
    return { background: Array.from(context.getImageData(0, 0, 1, 1).data).slice(0, 3), width: image.naturalWidth, height: image.naturalHeight };
  }, imageData);
  expect(downloaded.background).toEqual([246, 248, 252]);
  expect(downloaded.width).toBeGreaterThanOrEqual(Math.floor(bounds!.width * 2.9));
  expect(downloaded.height).toBeGreaterThanOrEqual(Math.floor(bounds!.height * 2.9));
});

test('PNG layout gives three simultaneous artists room for full names and exact times', async ({ page }) => {
  const names = ['A very long back to back artist name', 'Another long back to back artist name', 'The final long back to back artist name'];
  await page.goto('/heatmaps/custom');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'shared-slot.csv', mimeType: 'text/csv',
    buffer: Buffer.from(['festival,date,stage,artist,start,end,rating', ...names.map(name => `Shared Slot,2026-10-24,Main,${name},23:45,00:00,hot`), 'Shared Slot,2026-10-24,Club,Long set,23:45,02:00,'].join('\n')),
  });
  const surface = page.getByTestId('heatmap-export-surface');
  const cards = surface.getByTestId('export-set');
  await expect(cards).toHaveCount(4);
  for (let index = 0; index < names.length; index++) {
    const card = cards.nth(index);
    const text = await card.locator('[data-artist]').evaluate(el => (el as HTMLElement).innerText.replace(/\s+/g, ' ').trim());
    expect(text).toBe(names[index]);
    await expect(card).toContainText('23:45—00:00');
    const bounds = await card.evaluate(el => {
      const artist = el.querySelector('[data-artist]')!.getBoundingClientRect();
      return { artistHeight: artist.height, available: el.clientHeight - 34, textWidth: el.scrollWidth, width: el.clientWidth };
    });
    expect(bounds.artistHeight).toBeLessThanOrEqual(bounds.available + 1);
    expect(bounds.textWidth).toBeLessThanOrEqual(bounds.width);
  }
  const boxes = await cards.evaluateAll(els => els.map(el => { const b = el.getBoundingClientRect(); return { x:b.x, y:b.y, right:b.right }; }));
  expect(boxes[0].right).toBeLessThanOrEqual(boxes[1].x);
  expect(boxes[1].right).toBeLessThanOrEqual(boxes[2].x);
  expect(boxes[0].y).toBe(boxes[2].y);
});
