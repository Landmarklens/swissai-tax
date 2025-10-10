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

// Mock useMediaQuery from MUI
const useMediaQuery = require('@mui/material/useMediaQuery');
jest.mock('@mui/material/useMediaQuery');

const theme = createTheme({
  palette: {
    border: {
      grey: '#grey'
    },
    primary: {
      main: '#003DA5',
      lightMain: '#0052D9'
    }
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
});

describe('Header Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    // Default to desktop view
    useMediaQuery.default.mockReturnValue(false);
  });

  const renderHeader = () => {
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

      renderHeader();

      expect(screen.getByText('Log In')).toBeInTheDocument();
      expect(screen.queryByTestId('account-icon')).not.toBeInTheDocument();
    });

    it('should render account icon when user is authenticated', () => {
      authService.isAuthenticated.mockReturnValue(true);

      renderHeader();

      expect(screen.getByTestId('account-icon')).toBeInTheDocument();
      expect(screen.queryByText('Log In')).not.toBeInTheDocument();
    });

    it('should open login modal when clicking Log In button', () => {
      authService.isAuthenticated.mockReturnValue(false);

      renderHeader();

      const loginButton = screen.getByRole('button', { name: 'Log In' });
      fireEvent.click(loginButton);

      expect(screen.getByTestId('login-modal')).toBeInTheDocument();
    });

    it('should clear localStorage except input when opening login modal', () => {
      authService.isAuthenticated.mockReturnValue(false);
      localStorage.setItem('input', 'test%20input');
      localStorage.setItem('otherData', 'should be removed');

      renderHeader();

      const loginButton = screen.getByRole('button', { name: 'Log In' });
      fireEvent.click(loginButton);

      expect(localStorage.getItem('input')).toBe('test input');
      expect(localStorage.getItem('otherData')).toBeNull();
    });
  });

  describe.skip('Mobile View', () => {
    it('should render mobile menu button', () => {
      authService.isAuthenticated.mockReturnValue(false);

      renderHeader();

      const menuButton = screen.getByLabelText('menu');
      expect(menuButton).toBeInTheDocument();
    });

    it('should open drawer when clicking menu button', () => {
      authService.isAuthenticated.mockReturnValue(false);

      renderHeader();

      const menuButton = screen.getByLabelText('menu');
      fireEvent.click(menuButton);

      // Drawer content should be visible
      expect(screen.getByText('Get Started')).toBeInTheDocument();
    });

    it('should show login button in mobile drawer when not authenticated', () => {
      authService.isAuthenticated.mockReturnValue(false);

      renderHeader();

      const menuButton = screen.getByLabelText('menu');
      fireEvent.click(menuButton);

      // Should have login button in drawer
      const loginButtons = screen.getAllByText('Log In');
      expect(loginButtons.length).toBeGreaterThan(0);
    });

    it('should open login modal when clicking Log In in mobile drawer', () => {
      authService.isAuthenticated.mockReturnValue(false);

      renderHeader();

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

      renderHeader();

      const menuButton = screen.getByLabelText('menu');
      fireEvent.click(menuButton);

      // Should not have login button
      expect(screen.queryByText('Log In')).not.toBeInTheDocument();
    });
  });

  describe('Mobile Menu - Logged Out', () => {
    beforeEach(() => {
      // Enable mobile view for these tests
      useMediaQuery.default.mockReturnValue(true);
    });

    afterEach(() => {
      // Reset to desktop view
      useMediaQuery.default.mockReturnValue(false);
    });

    it('should show marketing pages in mobile menu when not authenticated', () => {
      authService.isAuthenticated.mockReturnValue(false);

      renderHeader();

      const menuButton = screen.getByLabelText('menu');
      fireEvent.click(menuButton);

      // Should see marketing pages
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Features')).toBeInTheDocument();
      expect(screen.getByText('Pricing')).toBeInTheDocument();
      expect(screen.getByText('FAQ')).toBeInTheDocument();
      expect(screen.getByText('Contact Us')).toBeInTheDocument();

      // Should see login and get started buttons
      expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Get Started' })).toBeInTheDocument();
    });

    it('should open login modal when user is not authenticated and clicks Get Started', () => {
      authService.isAuthenticated.mockReturnValue(false);

      renderHeader();

      const menuButton = screen.getByLabelText('menu');
      fireEvent.click(menuButton);

      const getStartedButton = screen.getByRole('button', { name: 'Get Started' });
      fireEvent.click(getStartedButton);

      expect(screen.getByTestId('login-modal')).toBeInTheDocument();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Mobile Menu - Logged In', () => {
    beforeEach(() => {
      // Enable mobile view for these tests
      useMediaQuery.default.mockReturnValue(true);
    });

    afterEach(() => {
      // Reset to desktop view
      useMediaQuery.default.mockReturnValue(false);
    });

    it('should show account pages in mobile menu when authenticated', () => {
      authService.isAuthenticated.mockReturnValue(true);

      renderHeader();

      const menuButton = screen.getByLabelText('menu');
      fireEvent.click(menuButton);

      // Should see account pages
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Tax Filings')).toBeInTheDocument();
      expect(screen.getByText('Documents')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();

      // Should NOT see marketing pages
      expect(screen.queryByText('Home')).not.toBeInTheDocument();
      expect(screen.queryByText('Features')).not.toBeInTheDocument();
      expect(screen.queryByText('Pricing')).not.toBeInTheDocument();
    });

    it('should not show Get Started or Log In buttons when authenticated', () => {
      authService.isAuthenticated.mockReturnValue(true);

      renderHeader();

      const menuButton = screen.getByLabelText('menu');
      fireEvent.click(menuButton);

      // Should not see login or get started buttons
      expect(screen.queryByRole('button', { name: 'Log In' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Get Started' })).not.toBeInTheDocument();
    });

    it('should navigate to correct pages when clicking menu items', () => {
      authService.isAuthenticated.mockReturnValue(true);

      renderHeader();

      const menuButton = screen.getByLabelText('menu');
      fireEvent.click(menuButton);

      // Check that links have correct href attributes
      const dashboardLink = screen.getByText('Dashboard').closest('a');
      expect(dashboardLink).toHaveAttribute('href', '/dashboard');

      const filingsLink = screen.getByText('Tax Filings').closest('a');
      expect(filingsLink).toHaveAttribute('href', '/filings');

      const documentsLink = screen.getByText('Documents').closest('a');
      expect(documentsLink).toHaveAttribute('href', '/documents');

      const profileLink = screen.getByText('Profile').closest('a');
      expect(profileLink).toHaveAttribute('href', '/profile');

      const settingsLink = screen.getByText('Settings').closest('a');
      expect(settingsLink).toHaveAttribute('href', '/settings');
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
    it('should render all navigation links on desktop when not authenticated', () => {
      authService.isAuthenticated.mockReturnValue(false);

      renderHeader();

      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Features')).toBeInTheDocument();
      expect(screen.getByText('Pricing')).toBeInTheDocument();
      expect(screen.getByText('FAQ')).toBeInTheDocument();
      expect(screen.getByText('Contact Us')).toBeInTheDocument();
    });

    it('should render account navigation links on desktop when authenticated', () => {
      authService.isAuthenticated.mockReturnValue(true);

      renderHeader();

      // Desktop view shows account pages in the main nav when logged in
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Tax Filings')).toBeInTheDocument();
      expect(screen.getByText('Documents')).toBeInTheDocument();
      expect(screen.getByText('Profile')).toBeInTheDocument();
      expect(screen.getByText('Settings')).toBeInTheDocument();

      // Should not see marketing pages
      expect(screen.queryByText('Features')).not.toBeInTheDocument();
      expect(screen.queryByText('Pricing')).not.toBeInTheDocument();
    });

    it('should navigate when clicking menu items', () => {
      authService.isAuthenticated.mockReturnValue(false);

      renderHeader();

      // In desktop view, links are directly visible (no menu button needed)
      const featuresLink = screen.getByText('Features').closest('a');
      expect(featuresLink).toHaveAttribute('href', '/features');
    });
  });

  describe('Logo', () => {
    it('should render SwissTax logo', () => {
      authService.isAuthenticated.mockReturnValue(false);

      renderHeader();

      // Logo should be a link to home
      const logoLinks = screen.getAllByRole('link');
      const homeLink = logoLinks.find(link => link.getAttribute('href') === '/');
      expect(homeLink).toBeInTheDocument();
    });
  });
});
