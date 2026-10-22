import { expect, test } from '@playwright/test';

test('six stages fit desktop with full rating colours and readable names', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('/heatmaps/custom');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'desktop.csv', mimeType: 'text/csv',
    buffer: Buffer.from([
      'festival,date,stage,stage_order,artist,start,end,rating',
      'Desktop Check,2026-10-24,Main,1,Long set,12:00,14:00,blazing',
      'Desktop Check,2026-10-24,Main,1,Short set,14:00,15:00,hot',
      'Desktop Check,2026-10-24,Two,2,Artist Two,12:00,14:00,ok',
      'Desktop Check,2026-10-24,Three,3,Artist Three,12:00,14:00,nahh',
      'Desktop Check,2026-10-24,Four,4,Artist Four,12:00,14:00,',
      'Desktop Check,2026-10-24,Five,5,Artist Five,12:00,14:00,hot',
      'Desktop Check,2026-10-24,Six,6,Artist Six,12:00,14:00,blazing',
    ].join('\n')),
  });
  const timetable = page.getByRole('region', { name: 'Desktop Check timetable' });
  const long = timetable.getByTestId('desktop-set').filter({ hasText: 'Long set' });
  const short = timetable.getByTestId('desktop-set').filter({ hasText: 'Short set' });
  await expect(long).toBeVisible();
  const longBox = await long.boundingBox();
  const shortBox = await short.boundingBox();
  expect(longBox!.height / shortBox!.height).toBeCloseTo(2, 1);
  expect(await long.locator('[data-artist]').evaluate(el => parseFloat(getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(14);
  const colour = await long.evaluate(el => getComputedStyle(el).backgroundColor);
  const hotColour = await short.evaluate(el => getComputedStyle(el).backgroundColor);
  expect(colour).not.toBe(hotColour);
  const cards = timetable.getByTestId('desktop-set');
  const colours = await cards.evaluateAll(els => els.map(el => getComputedStyle(el).backgroundColor));
  expect(new Set(colours).size).toBe(5); // Four ratings plus neutral unrated.
  await expect(cards.getByTestId('heat-level')).toHaveCount(0);
  await expect(timetable.getByText('blazing', { exact: true })).toHaveCount(0);
  const sheet = page.locator('section').filter({ has: page.getByRole('heading', { name: 'Desktop Check', exact: true }) });
  await expect(sheet.getByLabel('Rating legend')).toHaveCount(1);
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileSet = page.getByTestId('mobile-set').filter({ hasText: 'Long set' });
  expect(await mobileSet.evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe(colour);
  await expect(mobileSet.getByTestId('heat-level')).toHaveCount(1);
});

test('six stages fit the full-width desktop detail view without horizontal scrolling', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const rows = ['One','Two','Three','Four','Five','Six'].map((stage, index) => ({festival:'Six Stage Check', date:'2026-10-24',stage,stage_order:index+1,artist:`Artist ${stage}`,start:'12:00',end:'14:00',rating:'hot'}));
  await page.route('**/api/festival-sets', route => route.fulfill({ json: { ok:true, data:rows } }));
  await page.goto('/heatmaps/six-stage-check-2026-10-24');
  const timetable = page.getByRole('region',{name:'Six Stage Check timetable'});
  await expect(timetable.getByTestId('heatmap-stage-header')).toHaveCount(6);
  expect(await timetable.evaluate(el=>el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
});

test('short overnight sets remain separate while overlapping artists use distinct lanes', async ({ page }) => {
  await page.setViewportSize({ width: 900, height: 700 });
  const rows = [
    { artist: 'First short set', start: '23:30', end: '23:45', rating: '' },
    { artist: 'Overlapping artist', start: '23:35', end: '23:50', rating: 'hot' },
    { artist: 'Next short set', start: '23:45', end: '00:00', rating: 'ok' },
  ].map(row => ({ ...row, festival: 'Night Check', date: '2026-10-24', stage: 'Main', stage_order: 1 }));
  await page.route('**/api/festival-sets', route => route.fulfill({ json: { ok: true, data: rows } }));
  await page.goto('/heatmaps/night-check-2026-10-24');
  const cards = page.getByTestId('desktop-set');
  await expect(cards).toHaveCount(3);
  const first = cards.filter({hasText:'First short set'});
  const overlap = cards.filter({hasText:'Overlapping artist'});
  const next = cards.filter({hasText:'Next short set'});
  const [a,b,c] = await Promise.all([first.boundingBox(), overlap.boundingBox(), next.boundingBox()]);
  expect(a!.y + a!.height).toBeLessThanOrEqual(c!.y);
  expect(a!.x + a!.width).toBeLessThanOrEqual(b!.x);
  await expect(first.getByTestId('heat-level')).toHaveCount(0);
});

test('short sets in narrow stage columns keep the label inside its available height', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const rows = Array.from({length:6}, (_, index) => ({
    festival:'Label Fit Check', date:'2026-10-24', stage:`Stage ${index+1}`, stage_order:index+1,
    artist:index===0 ? 'A very long artist name with a back to back partner' : `Artist ${index+1}`,
    start:'12:00',end:index===0 ? '12:15' : '14:00',rating:'hot',
  }));
  await page.route('**/api/festival-sets', route=>route.fulfill({json:{ok:true,data:rows}}));
  await page.goto('/heatmaps/label-fit-check-2026-10-24');
  const card=page.getByTestId('desktop-set').first();
  await expect(card).toBeVisible();
  const height=await card.evaluate(el=>{
    const style=getComputedStyle(el);
    return {artist:el.querySelector('[data-artist]')!.getBoundingClientRect().height,available:el.clientHeight-parseFloat(style.paddingTop)-parseFloat(style.paddingBottom)};
  });
  expect(height.artist).toBeLessThanOrEqual(height.available+1);
});
