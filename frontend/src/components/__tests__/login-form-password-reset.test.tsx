import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useClerk, useSignIn, useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useToast } from '@/core/hooks/use-toast';
import { LoginForm } from '@/components/login-form';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/core/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: () => null,
}));

describe('LoginForm password reset flow', () => {
  const createMock = jest.fn();
  const attemptFirstFactorMock = jest.fn();
  const setActiveMock = jest.fn();
  const push = jest.fn();
  const toast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({ push });
    (useToast as jest.Mock).mockReturnValue({ toast });
    (useSignUp as jest.Mock).mockReturnValue({ signUp: null });
    setActiveMock.mockResolvedValue({});

    createMock.mockResolvedValue({
      status: 'needs_first_factor',
      attemptFirstFactor: attemptFirstFactorMock,
    });

    attemptFirstFactorMock.mockResolvedValue({
      status: 'complete',
      createdSessionId: 'sess_reset_123',
      createdUserId: 'user_reset_123',
    });

    (useClerk as jest.Mock).mockReturnValue({
      setActive: setActiveMock,
      client: {
        signIn: {
          create: createMock,
          attemptFirstFactor: attemptFirstFactorMock,
        },
      },
    });

    (useSignIn as jest.Mock).mockReturnValue({
      signIn: {
        create: createMock,
        attemptFirstFactor: attemptFirstFactorMock,
      },
      setActive: setActiveMock,
    });
  });

  it('triggers password reset code creation when Forgot Password is clicked', async () => {
    render(<LoginForm userType="Customer" />);

    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const forgotBtn = screen.getByRole('button', { name: /Forgot Password\?/i });
    fireEvent.click(forgotBtn);

    await waitFor(() => {
      expect(createMock).toHaveBeenCalledWith({
        strategy: 'reset_password_email_code',
        identifier: 'test@example.com',
      });
    });

    expect(screen.getByText(/Reset Your Password/i)).toBeInTheDocument();
  });

  it('completes password reset and signs in when valid code and new password are provided', async () => {
    render(<LoginForm userType="Customer" />);

    // Step 1: Request reset code
    const emailInput = screen.getByPlaceholderText(/you@example.com/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Forgot Password\?/i }));

    await waitFor(() => {
      expect(screen.getByText(/Reset Your Password/i)).toBeInTheDocument();
    });

    // Step 2: Fill code and new password
    const codeInput = screen.getByPlaceholderText('424242');
    fireEvent.change(codeInput, { target: { value: '926194' } });

    const newPasswordInput = screen.getByPlaceholderText(/Minimum 8 characters/i);
    fireEvent.change(newPasswordInput, { target: { value: 'SecureNewPass123!' } });

    // Step 3: Submit reset
    const submitBtn = screen.getByRole('button', { name: /UPDATE PASSWORD & SIGN IN/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(attemptFirstFactorMock).toHaveBeenCalledWith({
        strategy: 'reset_password_email_code',
        code: '926194',
        password: 'SecureNewPass123!',
      });
      expect(setActiveMock).toHaveBeenCalledWith({ session: 'sess_reset_123' });
      expect(push).toHaveBeenCalledWith('/shop');
    });
  });
});
