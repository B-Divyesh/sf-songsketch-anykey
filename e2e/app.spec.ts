import { expect, test } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

async function openComposer(page: import('@playwright/test').Page): Promise<void> {
  await page.getByRole('link', { name: /Start a 16-bar sketch/ }).click();
  await expect(page.locator('#composer')).toHaveAttribute('aria-busy', 'false');
}

test('creates, saves, restores, and exports a sketch at 390px', async ({ page }) => {
  const consoleErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Catch the tune');
  await openComposer(page);
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

test('normalizes invalid bar counts so the visible input matches the project grid', async ({ page }) => {
  await page.goto('/');
  await openComposer(page);
  const bars = page.locator('#bars');
  await bars.fill('0');
  await bars.blur();
  await expect(bars).toHaveValue('1');
  await expect(page.locator('.drum-step')).toHaveCount(64);
  await expect(page.locator('#toast')).toContainText('Bars must be from 1 to 64. Using 1.');

  await bars.fill('65');
  await bars.blur();
  await expect(bars).toHaveValue('64');
  await expect(page.locator('.drum-step')).toHaveCount(4096);
});

test('keeps every composer layout rule CSP-safe and adjacent drum pads independently clickable', async ({ page }) => {
  const consoleErrors: string[] = [];
  const headers = JSON.parse(readFileSync(join(process.cwd(), 'public', 'staticwebapp.config.json'), 'utf8')).globalHeaders as Record<string, string>;
  const csp = headers['Content-Security-Policy'];
  expect(csp).toContain("style-src 'self'");
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.route('**/*', async (route) => {
    if (!route.request().isNavigationRequest()) return route.continue();
    const response = await route.fetch();
    await route.fulfill({
      response,
      headers: {
        ...response.headers(),
        'content-security-policy': csp,
      },
    });
  });
  await page.goto('/');
  await openComposer(page);

  const adjacentPads = page.locator('.drum-step[data-row="0"][data-step="0"], .drum-step[data-row="0"][data-step="1"]');
  await expect(adjacentPads).toHaveCount(2);
  const positions = await adjacentPads.evaluateAll((pads) => pads.map((pad) => Math.round(pad.getBoundingClientRect().x)));
  expect(positions[1]).toBeGreaterThan(positions[0]!);
  expect(positions[1]! - positions[0]!).toBe(44);
  await page.getByRole('button', { name: /Kick, bar 1, step 1, off$/ }).click();
  await expect(page.getByRole('button', { name: /Kick, bar 1, step 1, on$/ })).toBeVisible();
  await expect(page.locator('#app [style]')).toHaveCount(0);
  expect(consoleErrors.filter((message) => /content security policy|inline style/i.test(message))).toEqual([]);
});

test('loads privacy, terms, and the offline fallback with the deployment CSP', async ({ page }) => {
  const consoleErrors: string[] = [];
  const headers = JSON.parse(readFileSync(join(process.cwd(), 'public', 'staticwebapp.config.json'), 'utf8')).globalHeaders as Record<string, string>;
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await page.route('**/*', async (route) => {
    if (!route.request().isNavigationRequest()) return route.continue();
    const response = await route.fetch();
    await route.fulfill({ response, headers: { ...response.headers(), 'content-security-policy': headers['Content-Security-Policy'] } });
  });
  await page.goto('/privacy/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Privacy');
  await page.goto('/terms/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Terms');
  await page.goto('/offline.html');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('The network went quiet.');
  expect(consoleErrors.filter((message) => /content security policy|inline style/i.test(message))).toEqual([]);
});

test('shows the update toast when a changed worker is waiting', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);

  const serviceWorker = join(process.cwd(), 'dist', 'sw.js');
  const original = readFileSync(serviceWorker, 'utf8');
  try {
    writeFileSync(serviceWorker, `${original}\n// regression: changed worker waits\n`);
    await page.evaluate(async () => { await (await navigator.serviceWorker.getRegistration())?.update(); });
    await expect(page.locator('#update-toast')).toHaveClass(/visible/);
  } finally {
    writeFileSync(serviceWorker, original);
  }
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
  await openComposer(page);
  await page.locator('#roll').focus();
  await page.locator('#roll').press('Enter');
  await expect(page.locator('#roll')).toHaveAttribute('aria-label', /1 note/);
});
