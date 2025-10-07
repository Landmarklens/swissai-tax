import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ForgotPassword } from './ForgotPassword';
import authService from '../../services/authService';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

// Mock the authService
jest.mock('../../services/authService');

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      language: 'en'
    }
  })
}));

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn()
  },
  ToastContainer: () => <div data-testid="toast-container" />
}));

const renderWithRouter = (component) => {
  return render(
    <HelmetProvider>
      <BrowserRouter>{component}</BrowserRouter>
    </HelmetProvider>
  );
};

describe('ForgotPassword Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the forgot password form', () => {
    renderWithRouter(<ForgotPassword />);

    expect(screen.getByText('Forgot Password')).toBeInTheDocument();
    expect(screen.getByText('Enter your email to receive password reset instructions.')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your Email')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Send Reset Link/i })).toBeInTheDocument();
  });

  it('should allow entering an email address', () => {
    renderWithRouter(<ForgotPassword />);

    const emailInput = screen.getByPlaceholderText('Enter your Email');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    expect(emailInput.value).toBe('test@example.com');
  });

  it('should validate email format', async () => {
    renderWithRouter(<ForgotPassword />);

    const emailInput = screen.getByPlaceholderText('Enter your Email');
    const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });

    // Enter invalid email
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.blur(emailInput);

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  it('should submit form with valid email', async () => {
    authService.requestResetPassword.mockResolvedValue({
      status: 'success',
      status_code: 200
    });

    renderWithRouter(<ForgotPassword />);

    const emailInput = screen.getByPlaceholderText('Enter your Email');
    const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(authService.requestResetPassword).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('should display success message after successful submission', async () => {
    authService.requestResetPassword.mockResolvedValue({
      status: 'success',
      status_code: 200
    });

    renderWithRouter(<ForgotPassword />);

    const emailInput = screen.getByPlaceholderText('Enter your Email');
    const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Thank You')).toBeInTheDocument();
      expect(screen.getByText('If an account with that email exists, you will receive password reset instructions.')).toBeInTheDocument();
    });
  });

  it('should display error message on submission failure', async () => {
    const { toast } = require('react-toastify');
    authService.requestResetPassword.mockResolvedValue({
      error: 'Email service unavailable'
    });

    renderWithRouter(<ForgotPassword />);

    const emailInput = screen.getByPlaceholderText('Enter your Email');
    const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Email service unavailable');
    });
  });

  it('should enable submit button when valid email is entered', async () => {
    renderWithRouter(<ForgotPassword />);

    const emailInput = screen.getByPlaceholderText('Enter your Email');
    const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('should show loading state during submission', async () => {
    // Create a promise we can control
    let resolveRequest;
    const requestPromise = new Promise((resolve) => {
      resolveRequest = resolve;
    });
    authService.requestResetPassword.mockReturnValue(requestPromise);

    renderWithRouter(<ForgotPassword />);

    const emailInput = screen.getByPlaceholderText('Enter your Email');
    const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    // Button should be disabled during submission
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    // Resolve the request
    resolveRequest({ status: 'success', status_code: 200 });

    await waitFor(() => {
      expect(screen.getByText('Thank You')).toBeInTheDocument();
    });
  });

  it('should not submit form when email is invalid', async () => {
    renderWithRouter(<ForgotPassword />);

    const emailInput = screen.getByPlaceholderText('Enter your Email');
    const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });

    fireEvent.change(emailInput, { target: { value: 'invalid' } });

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    fireEvent.click(submitButton);

    expect(authService.requestResetPassword).not.toHaveBeenCalled();
  });

  it('should prevent duplicate error messages', async () => {
    const { toast } = require('react-toastify');
    authService.requestResetPassword.mockResolvedValue({
      error: 'Email service unavailable'
    });

    renderWithRouter(<ForgotPassword />);

    const emailInput = screen.getByPlaceholderText('Enter your Email');
    const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledTimes(1);
    });
  });

  it('should clear error state when email is modified', async () => {
    const { toast } = require('react-toastify');
    authService.requestResetPassword.mockResolvedValue({
      error: 'Email service unavailable'
    });

    renderWithRouter(<ForgotPassword />);

    const emailInput = screen.getByPlaceholderText('Enter your Email');
    const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });

    // Submit with error
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalled();
    });

    // Clear mocks
    toast.error.mockClear();

    // Modify email to clear error state
    fireEvent.change(emailInput, { target: { value: 'newemail@example.com' } });

    // The component should have cleared the error state
    // Next submission should be able to show error again
    authService.requestResetPassword.mockResolvedValue({
      error: 'Another error'
    });

    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Another error');
    });
  });

  it('should render success screen with correct message', async () => {
    authService.requestResetPassword.mockResolvedValue({
      status: 'success',
      status_code: 200
    });

    renderWithRouter(<ForgotPassword />);

    const emailInput = screen.getByPlaceholderText('Enter your Email');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Thank You')).toBeInTheDocument();
      expect(screen.getByText('If an account with that email exists, you will receive password reset instructions.')).toBeInTheDocument();
      // Form should be hidden
      expect(screen.queryByPlaceholderText('Enter your Email')).not.toBeInTheDocument();
    });
  });

  it('should render with SEO helmet', () => {
    const { container } = renderWithRouter(<ForgotPassword />);
    expect(container).toBeTruthy();
  });

  it('should handle network errors gracefully', async () => {
    const { toast } = require('react-toastify');
    authService.requestResetPassword.mockResolvedValue({
      error: 'Network error'
    });

    renderWithRouter(<ForgotPassword />);

    const emailInput = screen.getByPlaceholderText('Enter your Email');
    const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Network error');
    });
  });
});
