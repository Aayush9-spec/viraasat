import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePathname } from 'next/navigation';
import { AppShell } from '../app-shell';
import ArtisanLayout from '@/app/artisan/layout';
jest.mock('next/navigation', () => ({ usePathname: jest.fn() }));
jest.mock('next/dynamic', () => () => () => null);
jest.mock('../header', () => ({ Header: () => <header>Storefront header</header> }));
jest.mock('../footer', () => ({ Footer: () => <footer>Storefront footer</footer> }));
jest.mock('@/features/cart/components/cart-sidebar', () => () => null);
jest.mock('@/components/shared/navigation/mobile-nav', () => ({ MobileNav: () => <nav>Storefront mobile nav</nav> }));
jest.mock('@/components/ui/toaster', () => ({ Toaster: () => <div data-testid="toaster" /> }));
jest.mock('@/features/auth/components/protected-route', () => ({ ProtectedRoute: ({ children }: { children: React.ReactNode }) => <>{children}</> }));
jest.mock('@/core/hooks/use-translation', () => ({ useTranslation: () => ({ t: () => '' }) }));
jest.mock('@/components/shared/navigation/language-switcher', () => function MockLanguageSwitcher() { return <button>Language</button>; });
jest.mock('@/components/shared/navigation/user-nav', () => ({ UserNav: () => <button>Account</button> }));

beforeEach(() => (usePathname as jest.Mock).mockReturnValue('/artisan/orders'));
test('studio has one header, account control and customer shop link without storefront chrome', () => {
  render(<AppShell><ArtisanLayout><h1>Orders</h1></ArtisanLayout></AppShell>);
  expect(screen.getAllByRole('banner')).toHaveLength(1); expect(screen.queryByText('Storefront header')).not.toBeInTheDocument();
  expect(screen.queryByText('Storefront footer')).not.toBeInTheDocument(); expect(screen.queryByText('Storefront mobile nav')).not.toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: 'Account' })).toHaveLength(1);
  expect(screen.getByRole('link', { name: /Customer shop/ })).toHaveAttribute('href', '/shop');
  expect(screen.getByRole('link', { name: 'Orders' })).toHaveAttribute('aria-current', 'page');
  expect(screen.getAllByTestId('toaster')).toHaveLength(1);
});
test.each(['/artisans', '/shop', '/login'])('public route %s retains the storefront navigation', pathname => {
  (usePathname as jest.Mock).mockReturnValue(pathname); render(<AppShell>Content</AppShell>);
  expect(screen.getByText('Storefront header')).toBeInTheDocument(); expect(screen.getByText('Storefront footer')).toBeInTheDocument();
});
test('mobile studio menu closes when a navigation item is selected', async () => {
  const user = userEvent.setup(); render(<ArtisanLayout><h1>Orders</h1></ArtisanLayout>);
  await user.click(screen.getByRole('button', { name: 'Open studio menu' }));
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  await user.click(screen.getAllByRole('link', { name: 'Analytics' }).at(-1)!);
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
});
