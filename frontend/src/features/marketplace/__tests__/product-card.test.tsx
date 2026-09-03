import { render, screen } from '@testing-library/react';
import ProductCard from '@/features/marketplace/components/product-card';
import { Product } from '@/types/product';
import { useRouter } from 'next/navigation';
import userEvent from '@testing-library/user-event';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockPush = jest.fn();
;(useRouter as jest.Mock).mockReturnValue({ push: mockPush });

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
  render(<ProductCard product={mockProduct} variant="grid" />);
  expect(screen.getByText(/Test Vase/i)).toBeInTheDocument();
  expect(screen.getByText(/₹12,345/)).toBeInTheDocument();
  const img = screen.getByRole('img');
  expect(img).toHaveAttribute('src', expect.stringContaining('img1.jpg'));
});

// If ProductCard uses a link, test navigation (simplified)
/*
test('click navigates to product page', async () => {
  const user = userEvent.setup();
  render(<ProductCard product={mockProduct} variant="grid" />);
  const link = screen.getByRole('link');
  await user.click(link);
  expect(mockPush).toHaveBeenCalledWith('/product/p1');
});
*/
