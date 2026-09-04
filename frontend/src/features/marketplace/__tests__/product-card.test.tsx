import { render, screen } from '@testing-library/react';
import { CartProvider } from '@/context/cart-context';
import ProductCard from '@/features/marketplace/components/product-card';
import { Product } from '@/types/product';
import userEvent from '@testing-library/user-event';

const mockProduct: Product = {
  id: 'p1',
  artisanId: 'a1',
  name: 'Test Vase',
  category: 'Ceramics',
  description: '',
  tagline: '',
  price: 12345,
  currency: 'INR',
  stock: 10,
  images: ['/img1.jpg'],
  region: 'Rajasthan',
  isActive: true,
  status: 'active',
  createdAt: '',
  updatedAt: '',
};

test('renders product information', () => {
  render(
    <CartProvider>
      <ProductCard product={mockProduct} variant="grid" />
    </CartProvider>
  );
  expect(screen.getByText(/Test Vase/i)).toBeInTheDocument();
  expect(screen.getByText(/₹12345/)).toBeInTheDocument();
});

test('clicking card navigates to product page', async () => {
  const user = userEvent.setup();
  render(
    <CartProvider>
      <ProductCard product={mockProduct} variant="grid" />
    </CartProvider>
  );
  const link = screen.getByRole('link');
  await user.click(link);
  // Check that the link has the correct href
  const linkElement = screen.getByRole('link');
  expect(linkElement.getAttribute('href')).toBe('/product/p1');
});