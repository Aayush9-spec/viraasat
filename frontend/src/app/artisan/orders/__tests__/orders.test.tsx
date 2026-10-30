import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import OrdersPage from '../page';
const order = { id: 'order_test', internalId: 'order-id', status: 'Ready to Ship', paymentStatus: 'Paid', orderDate: '2026-10-29T12:00:00Z', totalAmount: 1200, shippingAddress: { fullName: 'Test Buyer', addressLine1: 'Test address', city: 'Jaipur', state: 'Rajasthan', zipCode: '302001' }, items: [{ productName: 'Pottery vase', quantity: 1 }], fulfillment: { status: 'Ready to Ship' } };
test('shipment changes require tracking, persist through the API and reload the order', async () => {
  let saved = false;
  global.fetch = jest.fn(async (_url, init) => {
    if (init?.method === 'PATCH') { saved = true; return { ok: true, json: async () => ({ success: true }) }; }
    return { ok: true, json: async () => [{ ...order, ...(saved ? { status: 'Shipped', fulfillment: { status: 'Shipped', trackingId: 'TRACK123' } } : {}) }] };
  }) as jest.Mock;
  const user = userEvent.setup(); render(<OrdersPage />);
  await user.click((await screen.findAllByRole('button', { name: 'Manage order order_test' }))[0]);
  const dialog = screen.getByRole('dialog');
  expect(within(dialog).getByRole('button', { name: 'Mark Shipped' })).toBeDisabled();
  await user.type(within(dialog).getByLabelText(/Tracking ID/), 'TRACK123');
  await user.click(within(dialog).getByRole('button', { name: 'Mark Shipped' }));
  await within(dialog).findByText('Tracking:');
  expect(within(dialog).getByRole('button', { name: 'Mark Delivered' })).toBeEnabled();
  expect(fetch).toHaveBeenCalledWith('/api/orders', expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ action: 'fulfill', id: 'order-id', status: 'Shipped', trackingId: 'TRACK123' }) }));
});
test('failed order loading does not show sample customer orders or totals', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false }); render(<OrdersPage />);
  await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Orders could not be loaded'));
  expect(screen.queryByRole('button', { name: /Manage order/ })).not.toBeInTheDocument();
  expect(screen.getAllByText('—')).toHaveLength(3);
});
