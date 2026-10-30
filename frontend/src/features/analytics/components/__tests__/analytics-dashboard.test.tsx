import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ArtisanAnalyticsDashboard } from '../artisan-analytics-dashboard';
const mockBackend = { get: jest.fn() };
jest.mock('@/hooks/use-backend', () => ({ useBackend: () => mockBackend }));
jest.mock('../studio-chart', () => ({
  formatINR: (value: number) => `INR ${value}`, formatNumber: (value: number) => String(value),
  StudioChart: ({ label, data, empty }: { label: string; data: unknown[]; empty: string }) => <figure aria-label={label}><figcaption>{data.length ? `${data.length} chart points` : empty}</figcaption></figure>,
}));
beforeEach(() => { jest.clearAllMocks(); global.fetch = jest.fn(async (url) => ({ ok: true, json: async () => String(url).includes('/orders') ? [] : { data: { products: [] } } })) as jest.Mock; });
test('every sales card has a chart and refresh reloads both authoritative sources', async () => {
  const user = userEvent.setup(); render(<ArtisanAnalyticsDashboard />);
  await waitFor(() => expect(screen.getByRole('button', { name: 'Refresh' })).toBeEnabled());
  expect(screen.getAllByRole('figure')).toHaveLength(8);
  expect(within(screen.getByRole('figure', { name: 'Gross product sales' })).getByText('10 chart points')).toBeInTheDocument();
  expect(screen.queryByText(/76,400|2.15x|100% Direct Payout/)).not.toBeInTheDocument();
  expect(mockBackend.get).not.toHaveBeenCalled();
  await user.click(screen.getByRole('button', { name: '7D' }));
  expect(within(screen.getByRole('figure', { name: 'Gross product sales' })).getByText('7 chart points')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Refresh' }));
  await waitFor(() => expect(fetch).toHaveBeenCalledTimes(4));
});
test('failed requests show unavailable charts and cannot export a fabricated statement', async () => {
  (global.fetch as jest.Mock).mockResolvedValue({ ok: false }); render(<ArtisanAnalyticsDashboard />);
  await screen.findByRole('alert');
  expect(screen.getByRole('button', { name: 'Export orders' })).toBeDisabled();
  expect(within(screen.getByRole('figure', { name: 'Gross product sales' })).getByText('Data unavailable — try again')).toBeInTheDocument();
});
test('seasonal errors are visible and impact cards do not invent measured values', async () => {
  mockBackend.get.mockRejectedValue(new Error('Unavailable'));
  const user = userEvent.setup(); render(<ArtisanAnalyticsDashboard />);
  await user.click(screen.getByRole('tab', { name: 'Seasonal demand' }));
  await screen.findByText('Seasonal predictions could not be loaded. Please retry.');
  expect(screen.getAllByRole('figure')).toHaveLength(6);
  expect(screen.queryByText(/81.12|147.8/)).not.toBeInTheDocument();
  await user.click(screen.getByRole('tab', { name: 'Community impact' }));
  expect(screen.getAllByText('Not measured')).toHaveLength(4);
  expect(screen.getAllByRole('figure')).toHaveLength(9);
});
