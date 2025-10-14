import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import '@testing-library/jest-dom';
import LoginSignupModal from './Login';
import authService from '../../services/authService';
import { toast } from 'react-toastify';
import { fetchUserProfile } from '../../store/slices/accountSlice';

// Mock authService
jest.mock('../../services/authService');

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: jest.fn(),
      language: 'en'
    }
  })
}));

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useLocation: () => ({ pathname: '/', search: '' }),
  useSearchParams: () => [new URLSearchParams(), jest.fn()]
}));

// Mock react-toastify
jest.mock('react-toastify', () => ({
  toast: {
    error: jest.fn(),
    success: jest.fn()
  }
}));

// Mock child components
jest.mock('./LoginForm', () => {
  return function LoginForm({ onSubmit }) {
    return (
      <div data-testid="login-form">
        <button
          onClick={() => onSubmit({ email: 'test@example.com', password: 'password123' })}
          data-testid="login-submit">
          Submit Login
        </button>
      </div>
    );
  };
});

jest.mock('./SignupForm', () => {
  return function SignupForm({ onSubmit }) {
    return (
      <div data-testid="signup-form">
        <button
          onClick={() => onSubmit({
            email: 'test@example.com',
            password: 'password123',
            first_name: 'John',
            last_name: 'Doe',
            preferred_language: 'en',
            enable_2fa: false
          })}
          data-testid="signup-submit-no-2fa">
          Submit Signup (No 2FA)
        </button>
        <button
          onClick={() => onSubmit({
            email: 'test@example.com',
            password: 'password123',
            first_name: 'John',
            last_name: 'Doe',
            preferred_language: 'en',
            enable_2fa: true
          })}
          data-testid="signup-submit-with-2fa">
          Submit Signup (With 2FA)
        </button>
      </div>
    );
  };
});

jest.mock('./ImageBox', () => {
  return function ImageBox() {
    return <div data-testid="image-box">Image Box</div>;
  };
});

jest.mock('../Image/Image', () => {
  return function ImageComponent() {
    return <div data-testid="image-component">Image</div>;
  };
});

jest.mock('../ErrorBoundary', () => {
  return function ErrorBoundary({ children }) {
    return <>{children}</>;
  };
});

jest.mock('../TwoFactor', () => ({
  TwoFactorVerifyModal: ({ open, onSuccess, tempToken }) => {
    if (!open) return null;
    return (
      <div data-testid="2fa-verify-modal">
        <button onClick={() => onSuccess({ success: true })} data-testid="2fa-verify-success">
          Verify 2FA
        </button>
      </div>
    );
  },
  TwoFactorSetup: ({ onComplete, onCancel }) => {
    return (
      <div data-testid="2fa-setup-component">
        <button onClick={onComplete} data-testid="2fa-setup-complete">
          Complete Setup
        </button>
        <button onClick={onCancel} data-testid="2fa-setup-cancel">
          Cancel Setup
        </button>
      </div>
    );
  }
}));

// Mock Redux slice with proper async thunk structure
jest.mock('../../store/slices/accountSlice', () => {
  const mockThunk = jest.fn();
  mockThunk.fulfilled = {
    match: (action) => action?.type === 'account/fetchUserProfile/fulfilled'
  };
  mockThunk.rejected = {
    match: (action) => action?.type === 'account/fetchUserProfile/rejected'
  };

  return {
    fetchUserProfile: mockThunk
  };
});

const theme = createTheme();

describe('LoginSignupModal Component - 2FA Signup Flow', () => {
  let store;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();
    toast.error.mockClear();
    toast.success.mockClear();

    // Create a mock Redux store
    store = configureStore({
      reducer: {
        account: (state = { user: null, loading: false }, action) => state
      }
    });

    // Mock fetchUserProfile to return fulfilled action
    fetchUserProfile.mockReturnValue({
      type: 'account/fetchUserProfile/fulfilled',
      payload: { id: 1, email: 'test@example.com' }
    });
  });

  const renderLoginModal = (open = true) => {
    const mockOnClose = jest.fn();
    return render(
      <Provider store={store}>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <LoginSignupModal open={open} onClose={mockOnClose} />
          </ThemeProvider>
        </BrowserRouter>
      </Provider>
    );
  };

  describe('2FA Setup Modal Display', () => {
    it('should show 2FA setup modal when user opts for 2FA during signup', async () => {
      authService.register.mockResolvedValue({ id: 1, email: 'test@example.com' });
      authService.login.mockResolvedValue({
        success: true,
        user: { id: 1, email: 'test@example.com' }
      });

      renderLoginModal();

      // Navigate to signup form
      const signupButton = screen.getByRole('button', { name: /Sign Up/i });
      fireEvent.click(signupButton);

      // Wait for signup form
      await waitFor(() => {
        expect(screen.getByTestId('signup-form')).toBeInTheDocument();
      });

      // Submit signup with 2FA enabled
      const submitWith2FA = screen.getByTestId('signup-submit-with-2fa');
      fireEvent.click(submitWith2FA);

      // Wait for 2FA setup modal to appear
      await waitFor(() => {
        expect(screen.getByTestId('2fa-setup-component')).toBeInTheDocument();
      });
    });

    it('should NOT show 2FA setup modal when user does not opt for 2FA', async () => {
      authService.register.mockResolvedValue({ id: 1, email: 'test@example.com' });
      authService.login.mockResolvedValue({
        success: true,
        user: { id: 1, email: 'test@example.com' }
      });

      renderLoginModal();

      // Navigate to signup form
      const signupButton = screen.getByRole('button', { name: /Sign Up/i });
      fireEvent.click(signupButton);

      // Wait for signup form
      await waitFor(() => {
        expect(screen.getByTestId('signup-form')).toBeInTheDocument();
      });

      // Submit signup without 2FA
      const submitNo2FA = screen.getByTestId('signup-submit-no-2fa');
      fireEvent.click(submitNo2FA);

      // Wait for navigation (should not show 2FA setup modal)
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/filings');
      });

      // 2FA setup modal should not appear
      expect(screen.queryByTestId('2fa-setup-component')).not.toBeInTheDocument();
    });

    it('should render TwoFactorSetup component in 2FA setup modal', async () => {
      authService.register.mockResolvedValue({ id: 1, email: 'test@example.com' });
      authService.login.mockResolvedValue({
        success: true,
        user: { id: 1, email: 'test@example.com' }
      });

      renderLoginModal();

      // Navigate to signup and submit with 2FA
      const signupButton = screen.getByRole('button', { name: /Sign Up/i });
      fireEvent.click(signupButton);

      await waitFor(() => {
        expect(screen.getByTestId('signup-form')).toBeInTheDocument();
      });

      const submitWith2FA = screen.getByTestId('signup-submit-with-2fa');
      fireEvent.click(submitWith2FA);

      // Verify TwoFactorSetup component is rendered
      await waitFor(() => {
        expect(screen.getByTestId('2fa-setup-component')).toBeInTheDocument();
        expect(screen.getByTestId('2fa-setup-complete')).toBeInTheDocument();
        expect(screen.getByTestId('2fa-setup-cancel')).toBeInTheDocument();
      });
    });
  });

  describe('2FA Setup Completion', () => {
    it('should handle 2FA setup completion successfully', async () => {
      authService.register.mockResolvedValue({ id: 1, email: 'test@example.com' });
      authService.login.mockResolvedValue({
        success: true,
        user: { id: 1, email: 'test@example.com' }
      });

      renderLoginModal();

      // Navigate to signup and enable 2FA
      const signupButton = screen.getByRole('button', { name: /Sign Up/i });
      fireEvent.click(signupButton);

      await waitFor(() => {
        expect(screen.getByTestId('signup-form')).toBeInTheDocument();
      });

      const submitWith2FA = screen.getByTestId('signup-submit-with-2fa');
      fireEvent.click(submitWith2FA);

      // Wait for 2FA setup modal
      await waitFor(() => {
        expect(screen.getByTestId('2fa-setup-component')).toBeInTheDocument();
      });

      // Complete 2FA setup
      const completeButton = screen.getByTestId('2fa-setup-complete');
      fireEvent.click(completeButton);

      // Verify success toast
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Two-factor authentication enabled successfully!');
      });

      // Verify navigation to filings
      expect(mockNavigate).toHaveBeenCalledWith('/filings');
    });

    it('should navigate to filings after 2FA setup complete', async () => {
      authService.register.mockResolvedValue({ id: 1, email: 'test@example.com' });
      authService.login.mockResolvedValue({
        success: true,
        user: { id: 1, email: 'test@example.com' }
      });

      renderLoginModal();

      // Navigate to signup and enable 2FA
      const signupButton = screen.getByRole('button', { name: /Sign Up/i });
      fireEvent.click(signupButton);

      await waitFor(() => {
        expect(screen.getByTestId('signup-form')).toBeInTheDocument();
      });

      const submitWith2FA = screen.getByTestId('signup-submit-with-2fa');
      fireEvent.click(submitWith2FA);

      await waitFor(() => {
        expect(screen.getByTestId('2fa-setup-component')).toBeInTheDocument();
      });

      // Complete setup
      const completeButton = screen.getByTestId('2fa-setup-complete');
      fireEvent.click(completeButton);

      // Verify navigation
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/filings');
      });
    });

    it('should close 2FA setup modal after completion', async () => {
      authService.register.mockResolvedValue({ id: 1, email: 'test@example.com' });
      authService.login.mockResolvedValue({
        success: true,
        user: { id: 1, email: 'test@example.com' }
      });

      renderLoginModal();

      // Navigate to signup and enable 2FA
      const signupButton = screen.getByRole('button', { name: /Sign Up/i });
      fireEvent.click(signupButton);

      await waitFor(() => {
        expect(screen.getByTestId('signup-form')).toBeInTheDocument();
      });

      const submitWith2FA = screen.getByTestId('signup-submit-with-2fa');
      fireEvent.click(submitWith2FA);

      await waitFor(() => {
        expect(screen.getByTestId('2fa-setup-component')).toBeInTheDocument();
      });

      // Complete setup
      const completeButton = screen.getByTestId('2fa-setup-complete');
      fireEvent.click(completeButton);

      // Modal should close (component should not be in document after completion)
      await waitFor(() => {
        expect(toast.success).toHaveBeenCalled();
      });
    });
  });

  describe('2FA Setup Cancellation', () => {
    it('should handle 2FA setup cancellation', async () => {
      authService.register.mockResolvedValue({ id: 1, email: 'test@example.com' });
      authService.login.mockResolvedValue({
        success: true,
        user: { id: 1, email: 'test@example.com' }
      });

      renderLoginModal();

      // Navigate to signup and enable 2FA
      const signupButton = screen.getByRole('button', { name: /Sign Up/i });
      fireEvent.click(signupButton);

      await waitFor(() => {
        expect(screen.getByTestId('signup-form')).toBeInTheDocument();
      });

      const submitWith2FA = screen.getByTestId('signup-submit-with-2fa');
      fireEvent.click(submitWith2FA);

      await waitFor(() => {
        expect(screen.getByTestId('2fa-setup-component')).toBeInTheDocument();
      });

      // Cancel 2FA setup
      const cancelButton = screen.getByTestId('2fa-setup-cancel');
      fireEvent.click(cancelButton);

      // Should still navigate to filings
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/filings');
      });

      // Should not show success toast
      expect(toast.success).not.toHaveBeenCalledWith('Two-factor authentication enabled successfully!');
    });

    it('should navigate to filings after 2FA setup cancel', async () => {
      authService.register.mockResolvedValue({ id: 1, email: 'test@example.com' });
      authService.login.mockResolvedValue({
        success: true,
        user: { id: 1, email: 'test@example.com' }
      });

      renderLoginModal();

      // Navigate to signup and enable 2FA
      const signupButton = screen.getByRole('button', { name: /Sign Up/i });
      fireEvent.click(signupButton);

      await waitFor(() => {
        expect(screen.getByTestId('signup-form')).toBeInTheDocument();
      });

      const submitWith2FA = screen.getByTestId('signup-submit-with-2fa');
      fireEvent.click(submitWith2FA);

      await waitFor(() => {
        expect(screen.getByTestId('2fa-setup-component')).toBeInTheDocument();
      });

      // Cancel setup
      const cancelButton = screen.getByTestId('2fa-setup-cancel');
      fireEvent.click(cancelButton);

      // Verify navigation
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/filings');
      });
    });
  });

  describe('Signup Flow Integration', () => {
    it('should auto-login after successful registration', async () => {
      authService.register.mockResolvedValue({ id: 1, email: 'test@example.com' });
      authService.login.mockResolvedValue({
        success: true,
        user: { id: 1, email: 'test@example.com' }
      });

      renderLoginModal();

      // Navigate to signup
      const signupButton = screen.getByRole('button', { name: /Sign Up/i });
      fireEvent.click(signupButton);

      await waitFor(() => {
        expect(screen.getByTestId('signup-form')).toBeInTheDocument();
      });

      // Submit signup without 2FA
      const submitNo2FA = screen.getByTestId('signup-submit-no-2fa');
      fireEvent.click(submitNo2FA);

      // Verify registration and login were called
      await waitFor(() => {
        expect(authService.register).toHaveBeenCalled();
        expect(authService.login).toHaveBeenCalled();
      });
    });
  });
});
