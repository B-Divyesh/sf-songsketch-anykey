import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('creates, saves, restores, and exports a sketch at 390px', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Catch the tune');
  await page.locator('#project-title').fill('Pocket orbit');

  const roll = page.locator('#roll');
  await roll.focus();
  await roll.press('Enter');
  await roll.press('ArrowRight');
  await roll.press('ArrowUp');
  await roll.press('Enter');
  await page.getByRole('button', { name: /Kick, bar 1, step 1, off$/ }).click();
  await expect(roll).toHaveAttribute('aria-label', /2 notes/);
  await expect(page.locator('#empty-callout')).toBeHidden();
  await expect(page.locator('#save-state')).toContainText(/Saved|saving/i);

  const midiDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export MIDI' }).click();
  expect((await midiDownload).suggestedFilename()).toBe('pocket-orbit.mid');

  const htmlDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Share as HTML' }).click();
  expect((await htmlDownload).suggestedFilename()).toBe('pocket-orbit-player.html');

  await page.reload();
  await expect(page.locator('#project-title')).toHaveValue('Pocket orbit');
  await expect(page.locator('#roll')).toHaveAttribute('aria-label', /2 notes/);
  expect(consoleErrors).toEqual([]);
});

test('has no serious accessibility violations', async ({ page }) => {
  await page.goto('/');
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  expect(results.violations.filter((violation) => ['serious', 'critical'].includes(violation.impact ?? ''))).toEqual([]);
});

test('reopens the full composer offline after installation', async ({ page, context }) => {
  await page.goto('/');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  await context.setOffline(true);
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Catch the tune');
  await page.evaluate(() => {
    Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => false });
    window.dispatchEvent(new Event('offline'));
  });
  await expect(page.locator('#connection-status')).toContainText('Offline');
  await page.locator('#roll').focus();
  await page.locator('#roll').press('Enter');
  await expect(page.locator('#roll')).toHaveAttribute('aria-label', /1 note/);
});
