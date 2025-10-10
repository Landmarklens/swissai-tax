import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GoogleCallback from './GoogleCallback';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import accountReducer, { fetchUserProfile } from '../../store/slices/accountSlice';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      language: 'en'
    }
  })
}));

// Mock axios for fetchUserProfile
import axios from 'axios';
jest.mock('axios');

const mockNavigate = jest.fn();
const mockSearchParams = new URLSearchParams();

jest.mock('react-router-dom', () => {
  const actual = jest.requireActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams]
  };
});

const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      account: accountReducer
    },
    preloadedState: {
      account: {
        isLoading: false,
        isSuccess: false,
        error: null,
        data: null,
        profile: null,
        ...initialState
      }
    }
  });
};

const renderWithProviders = (component, { route = '/', store = createMockStore() } = {}) => {
  return render(
    <Provider store={store}>
      <HelmetProvider>
        <MemoryRouter initialEntries={[route]}>
          {component}
        </MemoryRouter>
      </HelmetProvider>
    </Provider>
  );
};

describe('GoogleCallback Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    mockSearchParams.delete('error');
    mockSearchParams.delete('error_description');
    mockSearchParams.delete('requires_subscription');

    // Setup default axios mock for successful profile fetch
    axios.get.mockResolvedValue({
      data: {
        id: 1,
        email: 'test@example.com',
        name: 'Test User'
      }
    });
  });

  it('should render loading spinner initially', () => {
    renderWithProviders(<GoogleCallback />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should handle successful OAuth callback and redirect to filings', async () => {
    const store = createMockStore();

    renderWithProviders(<GoogleCallback />, {
      route: '/google-redirect',
      store
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/filings');
    }, { timeout: 3000 });
  });

  it('should redirect to home on OAuth error', async () => {
    mockSearchParams.set('error', 'access_denied');
    mockSearchParams.set('error_description', 'User denied access');

    renderWithProviders(<GoogleCallback />, {
      route: '/google-redirect?error=access_denied&error_description=User+denied+access'
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('should handle profile fetch failure and redirect to home', async () => {
    // Mock failed axios call
    axios.get.mockRejectedValue(new Error('Profile fetch failed'));

    const store = createMockStore();

    renderWithProviders(<GoogleCallback />, {
      route: '/google-redirect'
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    }, { timeout: 3000 });
  });

  it('should redirect to billing when subscription is required', async () => {
    mockSearchParams.set('requires_subscription', 'true');

    const store = createMockStore();

    renderWithProviders(<GoogleCallback />, {
      route: '/google-redirect?requires_subscription=true',
      store
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/billing');
    }, { timeout: 3000 });
  });

  it('should render SEO helmet with correct title', () => {
    const { container } = renderWithProviders(<GoogleCallback />);

    expect(container).toBeTruthy();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should handle both /google-redirect and /auth/google/callback routes', async () => {
    // Test /google-redirect route
    const store1 = createMockStore();

    const { unmount } = renderWithProviders(<GoogleCallback />, {
      route: '/google-redirect',
      store: store1
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/filings');
    }, { timeout: 3000 });

    unmount();
    mockNavigate.mockClear();

    // Test /auth/google/callback route
    const store2 = createMockStore();

    renderWithProviders(<GoogleCallback />, {
      route: '/auth/google/callback',
      store: store2
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/filings');
    }, { timeout: 3000 });
  });

  it('should handle OAuth error with description', async () => {
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockSearchParams.set('error', 'invalid_request');
    mockSearchParams.set('error_description', 'Missing parameter');

    renderWithProviders(<GoogleCallback />, {
      route: '/google-redirect?error=invalid_request&error_description=Missing+parameter'
    });

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        '[GoogleCallback] OAuth error:',
        'invalid_request',
        'Missing parameter'
      );
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    consoleError.mockRestore();
  });
});
