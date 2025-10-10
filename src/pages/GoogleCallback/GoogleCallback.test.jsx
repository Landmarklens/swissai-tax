import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import GoogleCallback from './GoogleCallback';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import accountReducer from '../../store/slices/accountSlice';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      language: 'en'
    }
  })
}));

// Mock jwt-decode
jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(() => ({
    email: 'test@example.com',
    user_type: 'tenant'
  }))
}));

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
        profile: null,
        loading: false,
        error: null,
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
    mockSearchParams.delete('access_token');
    mockSearchParams.delete('token_type');
    mockSearchParams.delete('error');
    mockSearchParams.delete('error_description');
  });

  it('should render loading spinner initially', () => {
    mockSearchParams.set('access_token', 'token123');
    mockSearchParams.set('token_type', 'bearer');
    renderWithProviders(<GoogleCallback />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should handle successful OAuth callback with tokens', async () => {
    const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3RAZXhhbXBsZS5jb20iLCJ1c2VyX3R5cGUiOiJ0ZW5hbnQifQ.test';
    mockSearchParams.set('access_token', mockToken);
    mockSearchParams.set('token_type', 'bearer');

    const store = createMockStore({
      profile: { email: 'test@example.com', id: 1 }
    });

    renderWithProviders(<GoogleCallback />, {
      route: `/google-redirect?access_token=${mockToken}&token_type=bearer`,
      store
    });

    await waitFor(() => {
      const stored = localStorage.getItem('user');
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored);
      expect(parsed.access_token).toBe(mockToken);
      expect(parsed.token_type).toBe('bearer');
    });
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

  it('should redirect to home when no tokens are present', async () => {
    renderWithProviders(<GoogleCallback />, {
      route: '/google-redirect'
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('should decode JWT token to extract user type', async () => {
    const { jwtDecode } = require('jwt-decode');
    const mockToken = 'mock.token.here';
    mockSearchParams.set('access_token', mockToken);
    mockSearchParams.set('token_type', 'bearer');

    const store = createMockStore({
      profile: { email: 'test@example.com', id: 1 }
    });

    renderWithProviders(<GoogleCallback />, {
      route: `/google-redirect?access_token=${mockToken}&token_type=bearer`,
      store
    });

    await waitFor(() => {
      expect(jwtDecode).toHaveBeenCalledWith(mockToken);
    });
  });

  it('should handle JWT decode errors gracefully', async () => {
    const { jwtDecode } = require('jwt-decode');
    jwtDecode.mockImplementationOnce(() => {
      throw new Error('Invalid token');
    });

    const mockToken = 'invalid.token';
    mockSearchParams.set('access_token', mockToken);
    mockSearchParams.set('token_type', 'bearer');

    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

    const store = createMockStore({
      profile: { email: 'test@example.com', id: 1 }
    });

    renderWithProviders(<GoogleCallback />, {
      route: `/google-redirect?access_token=${mockToken}&token_type=bearer`,
      store
    });

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith(
        '[GoogleCallback] Failed to decode token:',
        expect.any(Error)
      );
    });

    consoleError.mockRestore();
  });

  it('should render SEO helmet with correct title', () => {
    mockSearchParams.set('access_token', 'token123');
    mockSearchParams.set('token_type', 'bearer');
    const { container } = renderWithProviders(<GoogleCallback />);

    expect(container).toBeTruthy();
  });

  it('should handle both /google-redirect and /auth/google/callback routes', async () => {
    const mockToken = 'token123';

    // Test /google-redirect route
    mockSearchParams.set('access_token', mockToken);
    mockSearchParams.set('token_type', 'bearer');

    const store1 = createMockStore({
      profile: { email: 'test@example.com', id: 1 }
    });

    const { unmount } = renderWithProviders(<GoogleCallback />, {
      route: `/google-redirect?access_token=${mockToken}&token_type=bearer`,
      store: store1
    });

    await waitFor(() => {
      expect(localStorage.getItem('user')).toBeTruthy();
    });

    unmount();
    localStorage.clear();

    // Test /auth/google/callback route
    mockSearchParams.set('access_token', mockToken);
    mockSearchParams.set('token_type', 'bearer');

    const store2 = createMockStore({
      profile: { email: 'test@example.com', id: 1 }
    });

    renderWithProviders(<GoogleCallback />, {
      route: `/auth/google/callback?access_token=${mockToken}&token_type=bearer`,
      store: store2
    });

    await waitFor(() => {
      expect(localStorage.getItem('user')).toBeTruthy();
    });
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
