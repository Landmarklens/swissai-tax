import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ResetPassword } from './ResetPassword';
import authService from '../../services/authService';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
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

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

const renderWithRouter = (component, { route = '/?token=valid_token_123' } = {}) => {
  return render(
    <HelmetProvider>
      <MemoryRouter initialEntries={[route]}>
        {component}
      </MemoryRouter>
    </HelmetProvider>
  );
};

describe('ResetPassword Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('With valid token in URL', () => {
    it('should render the reset password form', () => {
      renderWithRouter(<ResetPassword />);

      expect(screen.getByText('Set up a new password.')).toBeInTheDocument();
      expect(screen.getAllByPlaceholderText('Enter your Password')[0]).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Confirm your Password')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Reset Password/i })).toBeInTheDocument();
    });

    it('should allow entering passwords', () => {
      renderWithRouter(<ResetPassword />);

      const passwordInput = screen.getAllByPlaceholderText('Enter your Password')[0];
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your Password');

      fireEvent.change(passwordInput, { target: { value: 'NewPassword123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'NewPassword123!' } });

      expect(passwordInput.value).toBe('NewPassword123!');
      expect(confirmPasswordInput.value).toBe('NewPassword123!');
    });

    it('should validate password requirements', async () => {
      renderWithRouter(<ResetPassword />);

      const passwordInput = screen.getAllByPlaceholderText('Enter your Password')[0];
      const submitButton = screen.getByRole('button', { name: /Reset Password/i });

      // Enter weak password
      fireEvent.change(passwordInput, { target: { value: 'weak' } });
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('should validate that passwords match', async () => {
      renderWithRouter(<ResetPassword />);

      const passwordInput = screen.getAllByPlaceholderText('Enter your Password')[0];
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your Password');

      fireEvent.change(passwordInput, { target: { value: 'StrongPassword123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword123!' } });
      fireEvent.blur(confirmPasswordInput);

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /Reset Password/i });
        expect(submitButton).toBeDisabled();
      });
    });

    it('should submit form with valid passwords', async () => {
      authService.confirmResetPassword.mockResolvedValue({
        message: 'Password reset',
        status: 200
      });

      renderWithRouter(<ResetPassword />);

      const passwordInput = screen.getAllByPlaceholderText('Enter your Password')[0];
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your Password');
      const submitButton = screen.getByRole('button', { name: /Reset Password/i });

      fireEvent.change(passwordInput, { target: { value: 'StrongPassword123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'StrongPassword123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(authService.confirmResetPassword).toHaveBeenCalledWith({
          token: 'valid_token_123',
          new_password: 'StrongPassword123!'
        });
      });
    });

    it('should display success screen after successful password reset', async () => {
      authService.confirmResetPassword.mockResolvedValue({
        message: 'Password reset',
        status: 200
      });

      renderWithRouter(<ResetPassword />);

      const passwordInput = screen.getAllByPlaceholderText('Enter your Password')[0];
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your Password');
      const submitButton = screen.getByRole('button', { name: /Reset Password/i });

      fireEvent.change(passwordInput, { target: { value: 'StrongPassword123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'StrongPassword123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Password Reset Successful')).toBeInTheDocument();
        expect(screen.getByText('Your password has been updated. You can now log in.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Go to Login/i })).toBeInTheDocument();
      });
    });

    it('should navigate to login page when "Go to Login" is clicked', async () => {
      authService.confirmResetPassword.mockResolvedValue({
        message: 'Password reset',
        status: 200
      });

      renderWithRouter(<ResetPassword />);

      const passwordInput = screen.getAllByPlaceholderText('Enter your Password')[0];
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your Password');
      const submitButton = screen.getByRole('button', { name: /Reset Password/i });

      fireEvent.change(passwordInput, { target: { value: 'StrongPassword123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'StrongPassword123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Go to Login/i })).toBeInTheDocument();
      });

      const goToLoginButton = screen.getByRole('button', { name: /Go to Login/i });
      fireEvent.click(goToLoginButton);

      expect(mockNavigate).toHaveBeenCalledWith('/?passwordChanged=true', { replace: true });
    });

    it('should display error message when password reset fails', async () => {
      const { toast } = require('react-toastify');
      authService.confirmResetPassword.mockResolvedValue({
        error: 'Invalid or expired token'
      });

      renderWithRouter(<ResetPassword />);

      const passwordInput = screen.getAllByPlaceholderText('Enter your Password')[0];
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your Password');
      const submitButton = screen.getByRole('button', { name: /Reset Password/i });

      fireEvent.change(passwordInput, { target: { value: 'StrongPassword123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'StrongPassword123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Invalid or expired token');
      });
    });

    it('should have submit button initially disabled', async () => {
      renderWithRouter(<ResetPassword />);

      const submitButton = screen.getByRole('button', { name: /Reset Password/i });
      // Button is disabled initially because formik.isValid is false
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });
    });

    it('should enable submit button when valid passwords are entered', async () => {
      renderWithRouter(<ResetPassword />);

      const passwordInput = screen.getAllByPlaceholderText('Enter your Password')[0];
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your Password');
      const submitButton = screen.getByRole('button', { name: /Reset Password/i });

      fireEvent.change(passwordInput, { target: { value: 'StrongPassword123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'StrongPassword123!' } });

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled();
      });
    });

    it('should show loading state during submission', async () => {
      // Create a promise we can control
      let resolveReset;
      const resetPromise = new Promise((resolve) => {
        resolveReset = resolve;
      });
      authService.confirmResetPassword.mockReturnValue(resetPromise);

      renderWithRouter(<ResetPassword />);

      const passwordInput = screen.getAllByPlaceholderText('Enter your Password')[0];
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your Password');
      const submitButton = screen.getByRole('button', { name: /Reset Password/i });

      fireEvent.change(passwordInput, { target: { value: 'StrongPassword123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'StrongPassword123!' } });
      fireEvent.click(submitButton);

      // Button should be disabled during submission
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      // Resolve the request
      resolveReset({ message: 'Password reset', status: 200 });

      await waitFor(() => {
        expect(screen.getByText('Password Reset Successful')).toBeInTheDocument();
      });
    });
  });

  describe('Without token in URL', () => {
    it('should display error message when token is missing', () => {
      renderWithRouter(<ResetPassword />, { route: '/' });

      expect(screen.getByText('Invalid or Expired Link')).toBeInTheDocument();
      expect(screen.getByText('The password reset link is invalid or has expired. Please request a new one.')).toBeInTheDocument();
      expect(screen.queryByLabelText('New Password')).not.toBeInTheDocument();
    });

    it('should not render the form when token is missing', () => {
      renderWithRouter(<ResetPassword />, { route: '/' });

      expect(screen.queryByPlaceholderText('Enter your Password')).not.toBeInTheDocument();
      expect(screen.queryByPlaceholderText('Confirm your Password')).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /Reset Password/i })).not.toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('should handle missing token error', async () => {
      const { toast } = require('react-toastify');
      renderWithRouter(<ResetPassword />);

      const passwordInput = screen.getAllByPlaceholderText('Enter your Password')[0];
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your Password');
      const submitButton = screen.getByRole('button', { name: /Reset Password/i });

      // Mock the scenario where token is somehow null despite being in URL
      authService.confirmResetPassword.mockResolvedValue({
        error: 'Token is required'
      });

      fireEvent.change(passwordInput, { target: { value: 'StrongPassword123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'StrongPassword123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalled();
      });
    });

    it('should handle expired token error gracefully', async () => {
      const { toast } = require('react-toastify');
      authService.confirmResetPassword.mockResolvedValue({
        error: 'Failed to reset password. The link may have expired.'
      });

      renderWithRouter(<ResetPassword />);

      const passwordInput = screen.getAllByPlaceholderText('Enter your Password')[0];
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your Password');
      const submitButton = screen.getByRole('button', { name: /Reset Password/i });

      fireEvent.change(passwordInput, { target: { value: 'StrongPassword123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'StrongPassword123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to reset password. The link may have expired.');
      });
    });

    it('should handle network errors', async () => {
      const { toast } = require('react-toastify');
      authService.confirmResetPassword.mockRejectedValue(new Error('Network error'));

      renderWithRouter(<ResetPassword />);

      const passwordInput = screen.getAllByPlaceholderText('Enter your Password')[0];
      const confirmPasswordInput = screen.getByPlaceholderText('Confirm your Password');
      const submitButton = screen.getByRole('button', { name: /Reset Password/i });

      fireEvent.change(passwordInput, { target: { value: 'StrongPassword123!' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'StrongPassword123!' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to reset password. The link may have expired.');
      });
    });
  });

  it('should render with SEO helmet', () => {
    const { container } = renderWithRouter(<ResetPassword />);
    expect(container).toBeTruthy();
  });

  it('should not submit form when passwords do not match', async () => {
    renderWithRouter(<ResetPassword />);

    const passwordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');

    fireEvent.change(passwordInput, { target: { value: 'StrongPassword123!' } });
    fireEvent.change(confirmPasswordInput, { target: { value: 'DifferentPassword123!' } });

    const submitButton = screen.getByRole('button', { name: /Reset Password/i });

    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });

    fireEvent.click(submitButton);
    expect(authService.confirmResetPassword).not.toHaveBeenCalled();
  });
});
