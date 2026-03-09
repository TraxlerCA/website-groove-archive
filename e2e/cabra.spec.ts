import { expect, test } from '@playwright/test';

test('cabra renders as a standalone countdown board', async ({ page }) => {
  await page.goto('/cabra');

  await expect(page.getByTestId('cabra-title')).toContainText('Total days remaining');
  await expect(page.getByTestId('cabra-primary-value')).toBeVisible();
  await expect(page.getByRole('navigation')).toHaveCount(0);
  await expect(page.getByText('The Groove Archive')).toHaveCount(0);
});

test('cabra mode switch cascades the support strip by active unit', async ({ page }) => {
  await page.goto('/cabra');

  await expect(page.getByTestId('cabra-hours')).toBeVisible();
  await expect(page.getByTestId('cabra-minutes')).toBeVisible();
  await expect(page.getByTestId('cabra-seconds')).toBeVisible();

  await page.getByRole('button', { name: /hours/i }).click();
  await expect(page.getByTestId('cabra-title')).toContainText('Total hours remaining');
  await expect(page.getByTestId('cabra-hours')).toHaveCount(0);
  await expect(page.getByTestId('cabra-minutes')).toBeVisible();
  await expect(page.getByTestId('cabra-seconds')).toBeVisible();

  await page.getByRole('button', { name: /minutes/i }).click();
  await expect(page.getByTestId('cabra-title')).toContainText('Total minutes remaining');
  await expect(page.getByTestId('cabra-minutes')).toHaveCount(0);
  await expect(page.getByTestId('cabra-seconds')).toBeVisible();

  await page.getByRole('button', { name: /seconds/i }).click();
  await expect(page.getByTestId('cabra-title')).toContainText('Total seconds remaining');
  await expect(page.getByTestId('cabra-hours')).toHaveCount(0);
  await expect(page.getByTestId('cabra-minutes')).toHaveCount(0);
  await expect(page.getByTestId('cabra-seconds')).toHaveCount(0);
});

test('cabra updates the countdown every second', async ({ page }) => {
  await page.goto('/cabra');
  await page.getByRole('button', { name: /seconds/i }).click();

  const primaryValue = page.getByTestId('cabra-primary-value');
  const before = (await primaryValue.innerText()).trim();

  await page.waitForTimeout(1500);

  const after = (await primaryValue.innerText()).trim();
  expect(after).not.toBe(before);
});
