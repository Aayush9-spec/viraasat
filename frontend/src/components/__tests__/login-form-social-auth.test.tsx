import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useClerk, useSignIn, useSignUp } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { LoginForm } from '@/components/login-form';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
}));

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: () => null,
}));

describe('LoginForm social authentication', () => {
  const sso = jest.fn();
  const push = jest.fn();
  const toast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    sso.mockResolvedValue({ error: null });
    (useClerk as jest.Mock).mockReturnValue({ setActive: jest.fn() });
    (useSignIn as jest.Mock).mockReturnValue({ signIn: { sso } });
    (useSignUp as jest.Mock).mockReturnValue({ signUp: null });
    (useRouter as jest.Mock).mockReturnValue({ push });
    (useToast as jest.Mock).mockReturnValue({ toast });
  });

  it.each([
    ['Google', 'oauth_google'],
    ['Facebook', 'oauth_facebook'],
  ])('starts %s sign-in using Clerk SSO', async (provider, strategy) => {
    render(<LoginForm userType="Customer" />);

    fireEvent.click(screen.getByRole('button', { name: provider }));

    await waitFor(() => {
      expect(sso).toHaveBeenCalledWith({
        strategy,
        redirectCallbackUrl: '/sso-callback',
        redirectUrl: '/shop',
      });
    });
    expect(window.localStorage.getItem('viraasat_session_role')).toBe('buyer');
    expect(toast).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it('shows Clerk SSO errors without navigating as authenticated', async () => {
    sso.mockResolvedValue({ error: { message: 'Google connection is unavailable' } });
    render(<LoginForm userType="Customer" />);

    fireEvent.click(screen.getByRole('button', { name: 'Google' }));

    await waitFor(() => {
      expect(toast).toHaveBeenCalledWith({
        title: 'Authentication Failed',
        description: 'Google connection is unavailable',
        variant: 'destructive',
      });
    });
    expect(push).not.toHaveBeenCalled();
  });
});