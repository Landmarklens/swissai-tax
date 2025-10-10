import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import '@testing-library/jest-dom';
import LoginSignupModal from './Login';
import authService from '../../services/authService';
import twoFactorService from '../../services/twoFactorService';

// Mock services
jest.mock('../../services/authService');
jest.mock('../../services/twoFactorService');

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

// Mock child components that aren't being integration tested
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

// Mock Redux slice with proper action creator
const mockFetchUserProfile = jest.fn();
jest.mock('../../store/slices/accountSlice', () => ({
  fetchUserProfile: () => mockFetchUserProfile()
}));

const theme = createTheme();

describe('Signup with 2FA - Integration Tests', () => {
  let store;

  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockClear();

    // Create a mock Redux store
    store = configureStore({
      reducer: {
        account: (state = { user: null, loading: false }, action) => {
          if (action.type === 'account/fetchUserProfile/fulfilled') {
            return { ...state, user: action.payload, loading: false };
          }
          return state;
        }
      }
    });

    // Mock fetchUserProfile to return fulfilled action
    mockFetchUserProfile.mockReturnValue({
      type: 'account/fetchUserProfile/fulfilled',
      payload: { id: 1, email: 'test@example.com', has_2fa_enabled: true }
    });
  });

  const renderLoginModal = (open = true) => {
    const mockOnClose = jest.fn();
    return {
      ...render(
        <Provider store={store}>
          <BrowserRouter>
            <ThemeProvider theme={theme}>
              <LoginSignupModal open={open} onClose={mockOnClose} />
            </ThemeProvider>
          </BrowserRouter>
        </Provider>
      ),
      mockOnClose
    };
  };

  const fillSignupForm = async (enable2FA = false) => {
    // Fill email
    const emailInput = screen.getByPlaceholderText('Enter your Email');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    // Fill password
    const passwordInputs = screen.getAllByPlaceholderText('Enter your Password');
    fireEvent.change(passwordInputs[0], { target: { value: 'ValidPassword123!' } });

    // Fill confirm password
    const confirmPasswordInput = screen.getByPlaceholderText('Confirm your Password');
    fireEvent.change(confirmPasswordInput, { target: { value: 'ValidPassword123!' } });

    // Fill first name
    const firstNameInput = screen.getByPlaceholderText('Enter your First Name');
    fireEvent.change(firstNameInput, { target: { value: 'John' } });

    // Fill last name
    const lastNameInput = screen.getByPlaceholderText('Enter your Last Name');
    fireEvent.change(lastNameInput, { target: { value: 'Doe' } });

    // Accept terms
    const termsCheckbox = screen.getByRole('checkbox', { name: /I accept the/i });
    fireEvent.click(termsCheckbox);

    // Enable 2FA if requested
    if (enable2FA) {
      const twoFactorCheckbox = screen.getByRole('checkbox', { name: /Enable Two-Factor Authentication/i });
      fireEvent.click(twoFactorCheckbox);
    }
  };

  describe('Complete Signup Flow with 2FA Enabled', () => {
    it('should send enable_2fa:true when user checks 2FA checkbox', async () => {
      // Mock successful registration
      authService.register.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe'
      });

      authService.login.mockResolvedValue({
        success: true,
        user: { id: 1, email: 'test@example.com' }
      });

      renderLoginModal();

      // Navigate to signup form
      const signupButton = screen.getByRole('button', { name: /Sign Up/i });
      fireEvent.click(signupButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter your Email')).toBeInTheDocument();
      });

      // Fill and submit form with 2FA enabled
      await fillSignupForm(true);

      const submitButton = screen.getByRole('button', { name: /Sign Up/i });
      fireEvent.click(submitButton);

      // Verify registration was called with enable_2fa: true
      await waitFor(() => {
        expect(authService.register).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'test@example.com',
            enable_2fa: true
          })
        );
      }, { timeout: 5000 });
    });
  });

  describe('Complete Signup Flow with 2FA Disabled', () => {
    it('should send enable_2fa:false when user does not check 2FA checkbox', async () => {
      // Mock successful registration
      authService.register.mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        first_name: 'John',
        last_name: 'Doe'
      });

      authService.login.mockResolvedValue({
        success: true,
        user: { id: 1, email: 'test@example.com' }
      });

      renderLoginModal();

      // Navigate to signup form
      const signupButton = screen.getByRole('button', { name: /Sign Up/i });
      fireEvent.click(signupButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter your Email')).toBeInTheDocument();
      });

      // Fill and submit form with 2FA disabled (default)
      await fillSignupForm(false);

      const submitButton = screen.getByRole('button', { name: /Sign Up/i });
      fireEvent.click(submitButton);

      // Verify registration was called with enable_2fa: false
      await waitFor(() => {
        expect(authService.register).toHaveBeenCalledWith(
          expect.objectContaining({
            email: 'test@example.com',
            enable_2fa: false
          })
        );
      }, { timeout: 5000 });
    });
  });

  describe('2FA Checkbox Behavior', () => {
    it('should properly track 2FA checkbox state in signup form', async () => {
      authService.register.mockResolvedValue({
        id: 1,
        email: 'test@example.com'
      });

      authService.login.mockResolvedValue({
        success: true,
        user: { id: 1, email: 'test@example.com' }
      });

      renderLoginModal();

      // Navigate to signup form
      const signupButton = screen.getByRole('button', { name: /Sign Up/i });
      fireEvent.click(signupButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter your Email')).toBeInTheDocument();
      });

      // Check 2FA checkbox state
      const twoFactorCheckbox = screen.getByRole('checkbox', { name: /Enable Two-Factor Authentication/i });
      expect(twoFactorCheckbox).not.toBeChecked();

      // Toggle 2FA checkbox
      fireEvent.click(twoFactorCheckbox);
      expect(twoFactorCheckbox).toBeChecked();

      // Toggle again
      fireEvent.click(twoFactorCheckbox);
      expect(twoFactorCheckbox).not.toBeChecked();
    });
  });

  describe('Error Handling', () => {
    it('should handle registration errors gracefully', async () => {
      // Mock registration failure
      authService.register.mockResolvedValue({
        error: 'Email already exists'
      });

      renderLoginModal();

      // Navigate to signup form
      const signupButton = screen.getByRole('button', { name: /Sign Up/i });
      fireEvent.click(signupButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter your Email')).toBeInTheDocument();
      });

      // Fill and submit form
      await fillSignupForm(true);

      const submitButton = screen.getByRole('button', { name: /Sign Up/i });
      fireEvent.click(submitButton);

      // Verify error was handled
      await waitFor(() => {
        expect(authService.register).toHaveBeenCalled();
      });

      // User should not be navigated away
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
