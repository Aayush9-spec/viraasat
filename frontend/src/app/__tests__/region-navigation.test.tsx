import { render, screen } from '@testing-library/react';
import { LanguageProvider } from '@/context/language-context';
import { CartProvider } from '@/context/cart-context';

// Mock next/navigation (Marketplace calls useRouter at the top level)
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

import Marketplace from '@/app/page';

test('region links point at the correct shop URLs', async () => {
  render(
    <LanguageProvider>
      <CartProvider>
        <Marketplace />
      </CartProvider>
    </LanguageProvider>
  );

  // Region entries render after products load (1.2s fetch fallback); links carry the region query.
  // Multiple Rajasthan links can exist (static showcase + data-driven grid), so match all.
  const regionLinks = await screen.findAllByRole('link', { name: /Rajasthan/i }, { timeout: 8000 });
  expect(regionLinks.length).toBeGreaterThan(0);
  const hrefs = regionLinks.map((l) => l.getAttribute('href'));
  expect(hrefs).toContain('/shop?region=Rajasthan');
});