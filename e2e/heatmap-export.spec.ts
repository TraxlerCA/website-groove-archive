import { expect, test } from '@playwright/test';

const csv = `festival,date,stage,artist,start,end,rating,stage_order
Quality Check Fest,2026-03-30,Main,Artist A,13:00,14:00,blazing,1
Quality Check Fest,2026-03-30,Main,Artist B,14:00,15:15,hot,1
Quality Check Fest,2026-03-30,Arena,Artist C,13:30,14:45,ok,2
Quality Check Fest,2026-03-30,Arena,Artist D,15:00,16:30,nahh,2
Quality Check Fest,2026-03-30,Lounge,Artist E,13:15,13:55,hot,3
Quality Check Fest,2026-03-30,Lounge,Artist F,14:10,15:40,blazing,3
`;

test('custom heatmap exports PNG and PDF', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Downloads are verified in Chromium');

  await page.goto('/heatmaps/custom');

  await page.locator('input[type="file"]').setInputFiles({
    name: 'quality-check.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from(csv, 'utf8'),
  });

  await expect(page.getByRole('heading', { name: 'Quality Check Fest' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'PNG' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'PDF' })).toBeVisible();

  const exportSurface = page.getByTestId('heatmap-export-surface');
  const bounds = await exportSurface.boundingBox();
  expect(bounds?.width ?? 0).toBeGreaterThan(700);
  expect(bounds?.height ?? 0).toBeGreaterThan(500);

  const pngDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PNG' }).click();
  const png = await pngDownload;
  expect(png.suggestedFilename()).toBe('quality-check-fest-heatmap.png');

  const pdfDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'PDF' }).click();
  const pdf = await pdfDownload;
  expect(pdf.suggestedFilename()).toBe('quality-check-fest-heatmap.pdf');
});
