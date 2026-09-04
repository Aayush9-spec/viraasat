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

function renderMarketplace() {
  return render(
    <LanguageProvider>
      <CartProvider>
        <Marketplace />
      </CartProvider>
    </LanguageProvider>
  );
}

test('renders hero section title and button', async () => {
  renderMarketplace();
  // The page shows skeleton loaders while products fetch (1.2s fallback timeout).
  expect(await screen.findByText(/Enter The Viraasat/i, {}, { timeout: 5000 })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Enter The Viraasat/i })).toBeInTheDocument();
});

test('renders hero description', async () => {
  renderMarketplace();
  expect(
    await screen.findByText(/Discover authentic Indian handicrafts/i, {}, { timeout: 8000 })
  ).toBeInTheDocument();
});