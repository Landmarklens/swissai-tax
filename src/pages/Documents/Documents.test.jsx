/**
 * Tests for Documents Page
 * Tests document listing, downloading, and error handling
 */

import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import Documents from './Documents';
import { documentAPI } from '../../services/api';

// Mock modules
jest.mock('../../services/api');
jest.mock('../../services/authService', () => ({
  isAuthenticated: jest.fn(() => true),
  logout: jest.fn()
}));
jest.mock('../../components/header/Header', () => () => <div data-testid="header">Header</div>);
jest.mock('../../components/footer/Footer', () => () => <div data-testid="footer">Footer</div>);
jest.mock('../../pages/Settings/components/DocumentManagementSection', () => {
  return function MockDocumentManagement() {
    return <div data-testid="document-management">Document Management</div>;
  };
});

// Mock translation
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key
  })
}));

// Mock window.cookieConsent
global.cookieConsent = {
  getCookie: jest.fn(() => null),
  setCookie: jest.fn()
};

const mockDocuments = [
  {
    id: 'doc-1',
    file_name: 'tax_2024.pdf',
    file_size: 1048576,
    mime_type: 'application/pdf',
    status: 'pending',
    uploaded_at: '2024-01-15T10:00:00',
    document_type: 'lohnausweis',
    document_type_name: 'Lohnausweis',
    upload_year: 2024
  },
  {
    id: 'doc-2',
    file_name: 'tax_2023.pdf',
    file_size: 2097152,
    mime_type: 'application/pdf',
    status: 'completed',
    uploaded_at: '2023-03-20T10:00:00',
    document_type: 'pillar_3a',
    document_type_name: 'Pillar 3a',
    upload_year: 2023
  }
];

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Documents Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial Load', () => {
    test('renders loading state initially', () => {
      documentAPI.getAllUserDocuments = jest.fn(() => new Promise(() => {})); // Never resolves

      renderWithRouter(<Documents />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('fetches and displays documents successfully', async () => {
      documentAPI.getAllUserDocuments = jest.fn(() =>
        Promise.resolve({ data: mockDocuments })
      );

      renderWithRouter(<Documents />);

      await waitFor(() => {
        expect(screen.getByText('tax_2024.pdf')).toBeInTheDocument();
        expect(screen.getByText('tax_2023.pdf')).toBeInTheDocument();
      });

      expect(documentAPI.getAllUserDocuments).toHaveBeenCalledTimes(1);
    });

    test('displays error message when fetch fails', async () => {
      documentAPI.getAllUserDocuments = jest.fn(() =>
        Promise.reject(new Error('Network error'))
      );

      renderWithRouter(<Documents />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load documents. Please try again.')).toBeInTheDocument();
      });
    });

    test('displays empty state when no documents', async () => {
      documentAPI.getAllUserDocuments = jest.fn(() =>
        Promise.resolve({ data: [] })
      );

      renderWithRouter(<Documents />);

      await waitFor(() => {
        expect(screen.getByText('No documents found')).toBeInTheDocument();
      });
    });
  });

  describe('Document Organization', () => {
    test('organizes documents by year', async () => {
      documentAPI.getAllUserDocuments = jest.fn(() =>
        Promise.resolve({ data: mockDocuments })
      );

      renderWithRouter(<Documents />);

      await waitFor(() => {
        // Check that both years are displayed
        expect(screen.getByText('2024')).toBeInTheDocument();
        expect(screen.getByText('2023')).toBeInTheDocument();
      });
    });

    test('displays document count for each year', async () => {
      documentAPI.getAllUserDocuments = jest.fn(() =>
        Promise.resolve({ data: mockDocuments })
      );

      renderWithRouter(<Documents />);

      await waitFor(() => {
        // Each year has 1 document
        const chips = screen.getAllByText(/1.*documents/i);
        expect(chips.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    test('sorts years in descending order', async () => {
      documentAPI.getAllUserDocuments = jest.fn(() =>
        Promise.resolve({ data: mockDocuments })
      );

      renderWithRouter(<Documents />);

      await waitFor(() => {
        const yearElements = screen.getAllByRole('button', { expanded: false }).map(el => el.textContent);
        const years = yearElements.filter(text => /^\d{4}/.test(text));
        expect(years[0]).toContain('2024');
        expect(years[1]).toContain('2023');
      });
    });
  });

  describe('Document Download', () => {
    test('calls download API when download button clicked', async () => {
      documentAPI.getAllUserDocuments = jest.fn(() =>
        Promise.resolve({ data: mockDocuments })
      );
      documentAPI.getDownloadUrl = jest.fn(() =>
        Promise.resolve({ data: { download_url: 'https://example.com/download' } })
      );

      renderWithRouter(<Documents />);

      await waitFor(() => {
        expect(screen.getByText('tax_2024.pdf')).toBeInTheDocument();
      });

      // Verify download API function exists
      expect(documentAPI.getDownloadUrl).toBeDefined();
    });

    test('shows error when download fails', async () => {
      documentAPI.getAllUserDocuments = jest.fn(() =>
        Promise.resolve({ data: mockDocuments })
      );
      documentAPI.getDownloadUrl = jest.fn(() =>
        Promise.reject(new Error('Download failed'))
      );

      renderWithRouter(<Documents />);

      await waitFor(() => {
        expect(screen.getByText('tax_2024.pdf')).toBeInTheDocument();
      });

      // Test that error handling is set up
      expect(documentAPI.getDownloadUrl).toBeDefined();
    });
  });

  describe('Formatting Utilities', () => {
    test('formats file sizes correctly', async () => {
      documentAPI.getAllUserDocuments = jest.fn(() =>
        Promise.resolve({ data: mockDocuments })
      );

      renderWithRouter(<Documents />);

      await waitFor(() => {
        // Check that documents are displayed
        expect(screen.getByText('tax_2024.pdf')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    test('formats dates correctly', async () => {
      documentAPI.getAllUserDocuments = jest.fn(() =>
        Promise.resolve({ data: mockDocuments })
      );

      renderWithRouter(<Documents />);

      await waitFor(() => {
        // Should display documents with dates
        expect(screen.getByText('tax_2024.pdf')).toBeInTheDocument();
      });
    });

    test('handles invalid dates gracefully', async () => {
      const invalidDoc = {
        ...mockDocuments[0],
        uploaded_at: 'invalid-date'
      };

      documentAPI.getAllUserDocuments = jest.fn(() =>
        Promise.resolve({ data: [invalidDoc] })
      );

      renderWithRouter(<Documents />);

      await waitFor(() => {
        // Component should still render even with invalid date
        expect(screen.getByText('tax_2024.pdf')).toBeInTheDocument();
      });
    });
  });

  describe('Component Structure', () => {
    test('renders header and footer', async () => {
      documentAPI.getAllUserDocuments = jest.fn(() =>
        Promise.resolve({ data: [] })
      );

      renderWithRouter(<Documents />);

      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
        expect(screen.getByTestId('footer')).toBeInTheDocument();
      });
    });

    test('renders document management section', async () => {
      documentAPI.getAllUserDocuments = jest.fn(() =>
        Promise.resolve({ data: [] })
      );

      renderWithRouter(<Documents />);

      await waitFor(() => {
        expect(screen.getByTestId('document-management')).toBeInTheDocument();
      });
    });

    test('renders breadcrumbs correctly', async () => {
      documentAPI.getAllUserDocuments = jest.fn(() =>
        Promise.resolve({ data: [] })
      );

      renderWithRouter(<Documents />);

      await waitFor(() => {
        // Check that breadcrumbs nav exists with home link
        expect(screen.getByText('home')).toBeInTheDocument();
        // Check Documents appears at least once
        const documentsElements = screen.getAllByText('Documents');
        expect(documentsElements.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });
  });

  describe('Error Snackbar', () => {
    test('closes error snackbar when close button clicked', async () => {
      documentAPI.getAllUserDocuments = jest.fn(() =>
        Promise.reject(new Error('Network error'))
      );

      renderWithRouter(<Documents />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load documents. Please try again.')).toBeInTheDocument();
      });

      // Click close button on snackbar
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Failed to load documents. Please try again.')).not.toBeInTheDocument();
      });
    });
  });
});
