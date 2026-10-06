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
  const signUpSso = jest.fn();
  const push = jest.fn();
  const toast = jest.fn();
  const appUrl = window.location.origin;

  beforeEach(() => {
    jest.clearAllMocks();
    sso.mockResolvedValue({ error: null });
    signUpSso.mockResolvedValue({ error: null });
    (useClerk as jest.Mock).mockReturnValue({ setActive: jest.fn() });
    (useSignIn as jest.Mock).mockReturnValue({ signIn: { sso } });
    (useSignUp as jest.Mock).mockReturnValue({ signUp: { sso: signUpSso } });
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
        redirectUrl: `${appUrl}/shop`,
        redirectCallbackUrl: `${appUrl}/sso-callback`,
      });
    });
    expect(window.localStorage.getItem('viraasat_session_role')).toBe('buyer');
    expect(toast).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it('starts social sign-up with Clerk’s sign-up SSO resource', async () => {
    render(<LoginForm userType="Customer" />);

    fireEvent.click(screen.getByRole('button', { name: 'SIGN UP' }));
    fireEvent.click(screen.getByRole('button', { name: 'Google' }));

    await waitFor(() => {
      expect(signUpSso).toHaveBeenCalledWith({
        strategy: 'oauth_google',
        redirectUrl: `${appUrl}/shop`,
        redirectCallbackUrl: `${appUrl}/sso-callback`,
      });
    });
    expect(sso).not.toHaveBeenCalled();
  });

  it('offers Google SSO to artisans and redirects to their dashboard', async () => {
    render(<LoginForm userType="Artisan" />);

    fireEvent.click(screen.getByRole('button', { name: 'Google' }));

    await waitFor(() => {
      expect(sso).toHaveBeenCalledWith({
        strategy: 'oauth_google',
        redirectUrl: `${appUrl}/artisan/dashboard`,
        redirectCallbackUrl: `${appUrl}/sso-callback`,
      });
    });
    expect(window.localStorage.getItem('viraasat_session_role')).toBe('artisan');
    expect(screen.queryByRole('button', { name: 'Facebook' })).not.toBeInTheDocument();
  });

  it('renders Clerk’s CAPTCHA placeholder for custom OAuth flows', () => {
    render(<LoginForm userType="Customer" />);

    expect(document.querySelector('#clerk-captcha')).toHaveAttribute('data-cl-size', 'flexible');
  });

  it('shows Clerk SSO errors without navigating as authenticated', async () => {
    sso.mockRejectedValue(new Error('Google connection is unavailable'));
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
