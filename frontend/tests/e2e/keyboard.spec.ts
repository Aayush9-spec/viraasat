import { test, expect } from '@playwright/test';

// Smoke test: can a keyboard-only user reach every primary action on the
// home page? This is a coarse check; it does not replace a real keyboard
// audit. The intent is to catch regressions where someone adds a click-only
// control that can't be reached with Tab + Enter.

test('keyboard: home page primary nav is keyboard accessible', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('domcontentloaded');

  // Tab a few times and check that the focused element is interactive.
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    const tag = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return 'NONE';
      if (el === document.body) return 'BODY';
      return `${el.tagName}${(el as HTMLAnchorElement).href ? `[href="${(el as HTMLAnchorElement).href}"]` : ''}`;
    });
    expect(tag).not.toBe('NONE');
    expect(tag).not.toBe('BODY');
  }
});

test('keyboard: legal pages have a skip link or focusable back nav', async ({ page }) => {
  await page.goto('/terms');
  // The legal page itself is content; we just want to ensure the user is
  // not trapped (no focus-trap bug).
  await page.keyboard.press('Tab');
  const firstFocus = await page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    return el?.tagName ?? 'NONE';
  });
  expect(firstFocus).not.toBe('NONE');
  expect(firstFocus).not.toBe('BODY');
});
