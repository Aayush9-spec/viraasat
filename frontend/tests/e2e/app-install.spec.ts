import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { createHash } from 'node:crypto';
import releaseData from '../../src/config/android-release.json';

const release: { available: boolean; url?: string; sha256?: string; bytes?: number } = releaseData;

test('app page is truthful, branded and usable on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/download');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/one tap away/);
  const logo = page.getByAltText('Viraasat logo');
  await expect(logo).toBeVisible();
  await expect.poll(() => logo.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
  if (release.available) {
    await expect(page.getByRole('link', { name: /Download Android APK/ })).toHaveAttribute('href', release.url!);
  } else {
    await expect(page.getByText(/An Android APK release is not available yet/)).toBeVisible();
    await expect(page.getByRole('link', { name: /Download Android APK/ })).toHaveCount(0);
  }
  await expect(page.getByText(/Safe & Verified|AI Camera GI Scanner|Instant UPI Direct Settlements|Offline Guild Caching|2.9 MB/)).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2)).toBe(true);
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(axe.violations.filter(violation => ['serious', 'critical'].includes(violation.impact || ''))).toEqual([]);
});

test('a captured install prompt survives navigation and does not claim completion early', async ({ page }) => {
  await page.goto('/'); await page.waitForLoadState('networkidle').catch(() => {});
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    Object.assign(event, { prompt: async () => { document.documentElement.dataset.installCalls = '1'; }, userChoice: Promise.resolve({ outcome: 'accepted' }) });
    window.dispatchEvent(event);
  });
  await page.locator('footer a[href="/download"]').click();
  await page.getByRole('button', { name: 'Add to home screen' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-install-calls', '1');
  await expect(page.getByRole('button', { name: 'Installation requested' })).toBeDisabled();
  await page.evaluate(() => window.dispatchEvent(new Event('appinstalled')));
  await expect(page.getByRole('button', { name: 'Viraasat is installed' })).toBeDisabled();
});

test('offline navigation shows the cached help screen without private pages or queued payments', async ({ page, context }) => {
  await page.goto('/download');
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
  const cached = await page.evaluate(async () => {
    const names = await caches.keys();
    return (await Promise.all(names.filter(name => name.startsWith('viraasat-')).map(async name => (await (await caches.open(name)).keys()).map(request => new URL(request.url).pathname)))).flat().sort();
  });
  expect(cached).toEqual(['/icons/viraasat-192.png', '/offline-retry.js', '/offline.html']);
  await context.setOffline(true);
  await page.goto('/orders');
  await expect(page.getByRole('heading', { name: 'Reconnect to Viraasat' })).toBeVisible();
  await expect(page.getByText('Orders and payments cannot be submitted offline.')).toBeVisible();
  expect(await page.getByAltText('Viraasat logo').evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth === 192)).toBe(true);
  await context.setOffline(false); await page.goto('/download');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/one tap away/);
});

test('stable APK links resolve to the available release or installation help', async ({ request }) => {
  for (const url of ['/viraasat.apk', '/download/viraasat.apk']) {
    const response = await request.get(url, { maxRedirects: 0 });
    expect(response.status()).toBe(307); expect(response.headers().location).toBe(release.available ? release.url : '/download');
  }
});

test('the public APK download delivers the exact signed release without login', async ({ page, request }) => {
  test.skip(!release.available, 'Private release signing is required before publishing an APK.');
  const response = await request.get(release.url!);
  expect(response.status()).toBe(200);
  expect(response.headers()['content-type']).toContain('application/vnd.android.package-archive');
  expect(response.headers()['content-disposition']).toContain('attachment');
  const bytes = await response.body();
  expect(bytes.length).toBe(release.bytes);
  expect(bytes.subarray(0, 4).toString('hex')).toBe('504b0304');
  expect(createHash('sha256').update(bytes).digest('hex')).toBe(release.sha256);
  await page.goto('/download');
  const pendingDownload = page.waitForEvent('download');
  await page.getByRole('link', { name: /Download Android APK/ }).click();
  const download = await pendingDownload;
  expect(download.suggestedFilename()).toBe(release.url!.split('/').pop());
  expect(await download.failure()).toBeNull();
});

test('manifest, icons and Apple home-screen branding are valid', async ({ page, request }) => {
  const response = await request.get('/manifest.json'); expect(response.ok()).toBe(true);
  const manifest = await response.json(); expect(manifest.name).toBe('Viraasat');
  for (const icon of manifest.icons) {
    const image = await request.get(icon.src); expect(image.headers()['content-type']).toContain('image/png');
    const data = await image.body(); expect(`${data.readUInt32BE(16)}x${data.readUInt32BE(20)}`).toBe(icon.sizes);
  }
  await page.goto('/download'); await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute('href', '/icons/viraasat-180.png');
  const session = await page.context().newCDPSession(page);
  const appManifest = await session.send('Page.getAppManifest'); expect(appManifest.errors).toEqual([]);
});
