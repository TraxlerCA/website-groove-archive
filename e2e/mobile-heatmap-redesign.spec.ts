import { expect, test } from '@playwright/test';

test.use({ timezoneId: 'UTC' });

for (const width of [320, 390]) {
  test(`full day is readable without scrolling at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/heatmaps/custom');
    await page.locator('input[type="file"]').setInputFiles({
      name: 'dgtl.csv', mimeType: 'text/csv',
      buffer: Buffer.from([
        'festival,date,stage,stage_order,artist,start,end,rating',
        'DGTL Amsterdam 2026 - Saturday,2026-04-04,Modular,1,Kyra Khaldi,12:00,14:00,',
        'DGTL Amsterdam 2026 - Saturday,2026-04-04,Modular,1,M-High,14:00,15:00,',
        'DGTL Amsterdam 2026 - Saturday,2026-04-04,Modular,1,BELLA (NL),15:00,17:00,blazing',
        'DGTL Amsterdam 2026 - Saturday,2026-04-04,Modular,1,Gotu Jim,17:15,18:00,hot',
        'DGTL Amsterdam 2026 - Saturday,2026-04-04,Modular,1,horsegirL,18:15,19:00,ok',
        'DGTL Amsterdam 2026 - Saturday,2026-04-04,Modular,1,Young Marco,19:15,21:00,hot',
        'DGTL Amsterdam 2026 - Saturday,2026-04-04,Modular,1,DJ Heartstring,21:00,23:00,blazing',
        'DGTL Amsterdam 2026 - Saturday,2026-04-04,Generator,2,A very long artist name with a B2B partner,12:00,13:00,nahh',
      ].join('\n')),
    });
    const timetable = page.getByRole('region', { name: 'DGTL Amsterdam 2026 - Saturday timetable' });
    const cards = timetable.getByTestId('mobile-set');
    await expect(cards).toHaveCount(7);
    await timetable.scrollIntoViewIfNeeded();
    const boxes = await cards.evaluateAll(elements => elements.map(el => {
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, height: r.height, font: parseFloat(getComputedStyle(el.querySelector('[data-artist]')!).fontSize) };
    }));
    expect(boxes[6].bottom - boxes[0].top).toBeLessThan(500);
    for (let i = 0; i < boxes.length; i++) {
      expect(boxes[i].font).toBeGreaterThanOrEqual(14);
      if (i) expect(boxes[i].top).toBeGreaterThanOrEqual(boxes[i - 1].bottom);
    }
    // Two hours should occupy roughly twice the space of one hour.
    expect(boxes[0].height / boxes[1].height).toBeGreaterThan(1.7);
    expect(boxes[2].height / boxes[1].height).toBeGreaterThan(1.7);
    await expect(timetable.getByText('17:15', { exact: true })).toBeVisible();
    await expect(timetable.getByText(/Swipe to explore|7 sets/)).toHaveCount(0);
    await expect(timetable.getByRole('button', { name: /^(Day|Detail)$/ })).toHaveCount(0);
    await expect(cards.getByText(/^(nahh|ok|hot|blazing)$/)).toHaveCount(0);
    await page.getByLabel('Stage', { exact: true }).selectOption('Generator');
    await expect(timetable.getByText('A very long artist name with a B2B partner', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}

test('mobile keeps the current set visible and tolerates an invalid imported date', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.clock.install({ time: new Date('2026-10-21T13:00:00Z') });
  await page.goto('/heatmaps/custom');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'today.csv', mimeType: 'text/csv',
    buffer: Buffer.from('festival,date,stage,artist,start,end,rating\nToday,2026-10-21,Main,Current artist,12:00,14:00,hot'),
  });
  await expect(page.getByTestId('mobile-set')).toHaveAttribute('aria-current', 'time');
  await expect(page.getByText('Now', { exact: true })).toBeVisible();
  await page.reload();
  await page.locator('input[type="file"]').setInputFiles({
    name: 'invalid-date.csv', mimeType: 'text/csv',
    buffer: Buffer.from('festival,date,stage,artist,start,end,rating\nImported,2026-13-01,Main,Imported artist,12:00,14:00,hot'),
  });
  await expect(page.getByTestId('mobile-set')).toContainText('Imported artist');

});
