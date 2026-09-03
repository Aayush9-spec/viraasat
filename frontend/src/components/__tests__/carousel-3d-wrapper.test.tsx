import { render, screen, waitFor } from '@testing-library/react';
import dynamic from 'next/dynamic';
import React from 'react';

// Mock the heavy carousel component
jest.mock('@/components/carousel-3d-wrapper', () => ({
  __esModule: true,
  default: () => <div data-testid="carousel">Carousel Mock</div>,
}));

const Carousel = dynamic(
  () => import('@/components/carousel-3d-wrapper'),
  { ssr: false, loading: () => <div>Loading…</div> }
);

test('shows loading placeholder then renders carousel', async () => {
  render(<Carousel />);
  expect(screen.getByText(/Loading…/i)).toBeInTheDocument();
  await waitFor(() => expect(screen.getByTestId('carousel')).toBeInTheDocument());
});
