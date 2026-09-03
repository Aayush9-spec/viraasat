import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

// Pages we care about for a basic WCAG 2.1 AA scan. Extend as the app grows.
const PAGES = [
  { name: 'home', path: '/' },
  { name: 'shop', path: '/shop' },
  { name: 'cart (empty)', path: '/checkout' },
  { name: 'legal terms', path: '/terms' },
  { name: 'legal privacy', path: '/privacy' },
  { name: 'legal refund', path: '/refund' },
  { name: 'login', path: '/login' },
  { name: 'signup customer', path: '/signup/customer' },
];

for (const { name, path } of PAGES) {
  test(`a11y: ${name} (${path}) has no serious/critical violations`, async ({ page }) => {
    await page.goto(path, { waitUntil: 'domcontentloaded' });
    // Wait for client-side hydration to finish so the scan reflects the
    // rendered DOM, not the SSR shell.
    await page.waitForLoadState('networkidle').catch(() => {});

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    const blocking = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );

    if (blocking.length > 0) {
      console.log(
        `\n--- ${name} (${path}) ---\n` +
          blocking
            .map(
              (v) =>
                `[${v.impact}] ${v.id} - ${v.help}\n  Nodes: ${v.nodes
                  .map((n) => n.target.join(' '))
                  .join(' | ')}`,
            )
            .join('\n'),
      );
    }

    expect(blocking, `${name} has ${blocking.length} serious/critical a11y issues`).toHaveLength(0);
  });
}
