import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import '@testing-library/jest-dom';
import Header from './Header';
import authService from '../../services/authService';

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
  useLocation: () => ({ pathname: '/' }),
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
jest.mock('../login/Login', () => {
  return function LoginSignupModal({ open, onClose }) {
    return open ? <div data-testid="login-modal">Login Modal</div> : null;
  };
});

jest.mock('../LanguageSelector/LanguageSelector', () => {
  return function LanguageSelector() {
    return <div data-testid="language-selector">Language Selector</div>;
  };
});

jest.mock('../personalAccountIcon/personalAccountIcon', () => ({
  PersonalAccountIcon: function PersonalAccountIcon() {
    return <div data-testid="account-icon">Account Icon</div>;
  }
}));

const theme = createTheme();

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  const renderHeader = (isMobile = false) => {
    // Mock useMediaQuery
    jest.spyOn(require('@mui/material'), 'useMediaQuery').mockReturnValue(isMobile);

    return render(
      <BrowserRouter>
        <ThemeProvider theme={theme}>
          <Header />
        </ThemeProvider>
      </BrowserRouter>
    );
  };

  describe('Desktop View', () => {
    it('should render header with login button when user is not authenticated', () => {
      authService.isAuthenticated.mockReturnValue(false);

      renderHeader(false);

      expect(screen.getByText('Log In')).toBeInTheDocument();
      expect(screen.queryByTestId('account-icon')).not.toBeInTheDocument();
    });

    it('should render account icon when user is authenticated', () => {
      authService.isAuthenticated.mockReturnValue(true);

      renderHeader(false);

      expect(screen.getByTestId('account-icon')).toBeInTheDocument();
      expect(screen.queryByText('Log In')).not.toBeInTheDocument();
    });

    it('should open login modal when clicking Log In button', () => {
      authService.isAuthenticated.mockReturnValue(false);

      renderHeader(false);

      const loginButton = screen.getByRole('button', { name: 'Log In' });
      fireEvent.click(loginButton);

      expect(screen.getByTestId('login-modal')).toBeInTheDocument();
    });

    it('should clear localStorage except input when opening login modal', () => {
      authService.isAuthenticated.mockReturnValue(false);
      localStorage.setItem('input', 'test%20input');
      localStorage.setItem('otherData', 'should be removed');

      renderHeader(false);

      const loginButton = screen.getByRole('button', { name: 'Log In' });
      fireEvent.click(loginButton);

      expect(localStorage.getItem('input')).toBe('test input');
      expect(localStorage.getItem('otherData')).toBeNull();
    });
  });

  describe('Mobile View', () => {
    it('should render mobile menu button', () => {
      authService.isAuthenticated.mockReturnValue(false);

      renderHeader(true);

      const menuButton = screen.getByLabelText('menu');
      expect(menuButton).toBeInTheDocument();
    });

    it('should open drawer when clicking menu button', () => {
      authService.isAuthenticated.mockReturnValue(false);

      renderHeader(true);

      const menuButton = screen.getByLabelText('menu');
      fireEvent.click(menuButton);

      // Drawer content should be visible
      expect(screen.getByText('Get Started')).toBeInTheDocument();
    });

    it('should show login button in mobile drawer when not authenticated', () => {
      authService.isAuthenticated.mockReturnValue(false);

      renderHeader(true);

      const menuButton = screen.getByLabelText('menu');
      fireEvent.click(menuButton);

      // Should have login button in drawer
      const loginButtons = screen.getAllByText('Log In');
      expect(loginButtons.length).toBeGreaterThan(0);
    });

    it('should open login modal when clicking Log In in mobile drawer', () => {
      authService.isAuthenticated.mockReturnValue(false);

      renderHeader(true);

      // Open drawer
      const menuButton = screen.getByLabelText('menu');
      fireEvent.click(menuButton);

      // Click login button in drawer
      const loginButtons = screen.getAllByRole('button', { name: 'Log In' });
      const drawerLoginButton = loginButtons[loginButtons.length - 1]; // Get the one in the drawer
      fireEvent.click(drawerLoginButton);

      // Modal should open
      expect(screen.getByTestId('login-modal')).toBeInTheDocument();
    });

    it('should not show login button in mobile drawer when authenticated', () => {
      authService.isAuthenticated.mockReturnValue(true);

      renderHeader(true);

      const menuButton = screen.getByLabelText('menu');
      fireEvent.click(menuButton);

      // Should not have login button
      expect(screen.queryByText('Log In')).not.toBeInTheDocument();
    });
  });

  describe('Get Started Button', () => {
    it('should navigate to /chat when user is authenticated', () => {
      authService.isAuthenticated.mockReturnValue(true);

      renderHeader(true);

      const menuButton = screen.getByLabelText('menu');
      fireEvent.click(menuButton);

      const getStartedButton = screen.getByRole('button', { name: 'Get Started' });
      fireEvent.click(getStartedButton);

      expect(mockNavigate).toHaveBeenCalledWith('/chat');
    });

    it('should open login modal when user is not authenticated', () => {
      authService.isAuthenticated.mockReturnValue(false);

      renderHeader(true);

      const menuButton = screen.getByLabelText('menu');
      fireEvent.click(menuButton);

      const getStartedButton = screen.getByRole('button', { name: 'Get Started' });
      fireEvent.click(getStartedButton);

      expect(screen.getByTestId('login-modal')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Login Modal Management', () => {
    it('should close modal when onClose is called', () => {
      authService.isAuthenticated.mockReturnValue(false);

      const { rerender } = renderHeader(false);

      const loginButton = screen.getByRole('button', { name: 'Log In' });
      fireEvent.click(loginButton);

      expect(screen.getByTestId('login-modal')).toBeInTheDocument();

      // Simulate modal close by re-rendering
      rerender(
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <Header />
          </ThemeProvider>
        </BrowserRouter>
      );
    });
  });

  describe('Navigation Menu', () => {
    it('should render all navigation links on desktop', () => {
      authService.isAuthenticated.mockReturnValue(false);

      renderHeader(false);

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Features')).toBeInTheDocument();
      expect(screen.getByText('Pricing')).toBeInTheDocument();
      expect(screen.getByText('FAQ')).toBeInTheDocument();
      expect(screen.getByText('Contact Us')).toBeInTheDocument();
    });

    it('should navigate when clicking menu items', () => {
      authService.isAuthenticated.mockReturnValue(false);

      renderHeader(true);

      const menuButton = screen.getByLabelText('menu');
      fireEvent.click(menuButton);

      const featuresLink = screen.getByText('Features').closest('a');
      expect(featuresLink).toHaveAttribute('href', '/features');
    });
  });

  describe('Logo', () => {
    it('should render SwissTax logo', () => {
      authService.isAuthenticated.mockReturnValue(false);

      renderHeader(false);

      // Logo should be a link to home
      const logoLinks = screen.getAllByRole('link');
      const homeLink = logoLinks.find(link => link.getAttribute('href') === '/');
      expect(homeLink).toBeInTheDocument();
    });
  });
});
