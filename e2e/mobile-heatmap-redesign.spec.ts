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
    await expect(cards.filter({ hasText: 'Kyra Khaldi' }).getByTestId('heat-level')).toHaveCount(0);
    await expect(cards.filter({ hasText: 'M-High' }).getByTestId('heat-level')).toHaveCount(0);
    await expect(cards.filter({ hasText: 'BELLA (NL)' }).getByTestId('heat-level').locator('[data-active="true"]')).toHaveCount(4);
    await expect(cards.filter({ hasText: 'Gotu Jim' }).getByTestId('heat-level').locator('[data-active="true"]')).toHaveCount(3);
    await expect(cards.filter({ hasText: 'horsegirL' }).getByTestId('heat-level').locator('[data-active="true"]')).toHaveCount(2);
    const sheet = page.locator('section').filter({ has: page.getByRole('heading', { name: 'DGTL Amsterdam 2026 - Saturday', exact: true }) });
    expect(await sheet.evaluate(el => getComputedStyle(el).backgroundColor)).toBe(await page.locator('body').evaluate(el => getComputedStyle(el).backgroundColor));
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

for (const width of [320, 390]) {
  test(`mobile aligns B2Bs and fills stage gaps on a shared timeline at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/heatmaps/custom');
    await page.locator('input[type="file"]').setInputFiles({
      name: 'b2b.csv', mimeType: 'text/csv',
      buffer: Buffer.from([
        'festival,date,stage,stage_order,artist,start,end,rating',
        'Shared timeline,2026-04-04,Arena,1,First very long artist name,22:00,23:00,hot',
        'Shared timeline,2026-04-04,Arena,1,Second very long artist name,22:00,23:00,',
        'Shared timeline,2026-04-04,Arena,1,Third very long artist name,22:00,23:00,blazing',
        'Shared timeline,2026-04-04,Arena,1,Closing artist,00:00,02:00,ok',
        'Shared timeline,2026-04-04,Club,2,Club first,23:00,00:00,nahh',
        'Shared timeline,2026-04-04,Club,2,Club second,23:00,00:00,hot',
        'Shared timeline,2026-04-04,Club,2,Club closing,00:01,01:00,',
      ].join('\n')),
    });
    const cards = page.getByTestId('mobile-set');
    // The CSV result enters with a scale animation; measure the settled layout.
    await expect.poll(() => cards.first().evaluate(el => {
      for (let parent = el.parentElement; parent; parent = parent.parentElement) {
        if (getComputedStyle(parent).transform !== 'none') return false;
      }
      return true;
    })).toBe(true);
    const box = async (index: number) => (await cards.nth(index).boundingBox())!;
    const first = await box(0), second = await box(1), third = await box(2), closing = await box(3);
    expect(Math.abs(first.y - second.y)).toBeLessThan(1);
    expect(Math.abs(first.y - third.y)).toBeLessThan(1);
    expect(second.x).toBeGreaterThanOrEqual(first.x + first.width);
    expect(third.x).toBeGreaterThanOrEqual(second.x + second.width);
    expect(closing.height / first.height).toBeGreaterThan(1.9);
    await expect(cards.nth(1).getByTestId('heat-level')).toHaveCount(0);
    const gap = page.getByTestId('mobile-empty-slot');
    await expect(gap).toHaveCount(1);
    const gapBox = (await gap.boundingBox())!;
    expect(gapBox.y).toBeGreaterThanOrEqual(first.y + first.height);
    expect(gapBox.y + gapBox.height).toBeLessThanOrEqual(closing.y);
    const arenaHeight = await page.getByTestId('mobile-timeline').evaluate(el => el.getBoundingClientRect().height);
    await page.getByLabel('Stage', { exact: true }).selectOption('Club');
    expect(await page.getByTestId('mobile-timeline').evaluate(el => el.getBoundingClientRect().height)).toBeCloseTo(arenaHeight, 1);
    await expect(gap).toHaveCount(3); // Before opening, a one-minute break, and after closing.
    expect((await gap.nth(1).boundingBox())!.height).toBeGreaterThan(0);
    const clubFirst = await box(0), clubSecond = await box(1);
    expect(Math.abs(clubFirst.y - clubSecond.y)).toBeLessThan(1);
    expect(clubSecond.x).toBeGreaterThanOrEqual(clubFirst.x + clubFirst.width);
    const timelineTop = await page.getByTestId('mobile-timeline').evaluate(el => el.getBoundingClientRect().top);
    expect(clubFirst.y - timelineTop).toBeCloseTo(arenaHeight / 4, 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  });
}
