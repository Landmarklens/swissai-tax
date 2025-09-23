// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import { act } from 'react';

// Mock ResizeObserver for Recharts - MUST be before any imports
class ResizeObserverMock {
  constructor(callback) {
    this.callback = callback;
  }
  observe() {
    // Mock implementation
  }
  unobserve() {
    // Mock implementation
  }
  disconnect() {
    // Mock implementation
  }
}

global.ResizeObserver = ResizeObserverMock;

// Configure React Testing Library to use React's act
import { configure } from '@testing-library/react';
configure({ 
  asyncUtilTimeout: 5000,
  testIdAttribute: 'data-testid'
});

// Suppress React DOM act() warnings by enabling the React act environment
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Set default environment variables for tests
// This ensures that API_URL is defined in all test environments
process.env.REACT_APP_BASE_URL = process.env.REACT_APP_BASE_URL || 'http://localhost:8000';

// Mock console errors/warnings for cleaner test output
const originalError = console.error;
const originalWarn = console.warn;

beforeEach(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('ReactDOMTestUtils.act') || 
       args[0].includes('Warning: `ReactDOMTestUtils.act` is deprecated'))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };

  console.warn = (...args) => {
    if (
      typeof args[0] === 'string' &&
      (args[0].includes('ReactDOMTestUtils.act') ||
       args[0].includes('Warning: `ReactDOMTestUtils.act` is deprecated'))
    ) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterEach(() => {
  console.error = originalError;
  console.warn = originalWarn;
});

// Mock window.matchMedia
window.matchMedia = window.matchMedia || jest.fn().mockImplementation(query => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: jest.fn(), // deprecated
  removeListener: jest.fn(), // deprecated
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  dispatchEvent: jest.fn(),
}));
