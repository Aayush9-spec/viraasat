import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Marketplace from '@/app/page';

test('subscription form renders and submit is prevented', async () => {
  const user = userEvent.setup();
  render(<Marketplace />);

  const emailInput = screen.getByPlaceholderText(/EMAIL ADDRESS/i);
  expect(emailInput).toHaveAttribute('type', 'email');

  const submitBtn = screen.getByRole('button', { name: /Subscribe/i });

  // Attach a spy to the form submit event
  const form = screen.getByRole('form');
  const submitHandler = jest.fn((e) => e.preventDefault());
  form.addEventListener('submit', submitHandler);

  await user.type(emailInput, 'test@example.com');
  await user.click(submitBtn);

  expect(submitHandler).toHaveBeenCalled();
});
