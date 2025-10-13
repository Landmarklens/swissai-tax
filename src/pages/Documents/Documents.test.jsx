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

const renderWithRouter = async (component) => {
  let result;
  await act(async () => {
    result = render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    );
  });
  return result;
};

describe('Documents Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('Initial Load', () => {
    test('renders loading state initially', async () => {
      documentAPI.getAllUserDocuments = jest.fn(() => new Promise(() => {})); // Never resolves

      await renderWithRouter(<Documents />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });

    test('fetches and displays documents successfully', async () => {
      documentAPI.getAllUserDocuments = jest.fn(() =>
        Promise.resolve({ data: mockDocuments })
      );

      await renderWithRouter(<Documents />);

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

      await renderWithRouter(<Documents />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load documents. Please try again.')).toBeInTheDocument();
      });
    });

    test('displays empty state when no documents', async () => {
      documentAPI.getAllUserDocuments = jest.fn(() =>
        Promise.resolve({ data: [] })
      );

      await renderWithRouter(<Documents />);

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

      await renderWithRouter(<Documents />);

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

      await renderWithRouter(<Documents />);

      await waitFor(() => {
        expect(screen.getByText(/1.*documents/)).toBeInTheDocument(); // 1 document in each year
      });
    });

    test('sorts years in descending order', async () => {
      documentAPI.getAllUserDocuments = jest.fn(() =>
        Promise.resolve({ data: mockDocuments })
      );

      await renderWithRouter(<Documents />);

      await waitFor(() => {
        const yearElements = screen.getAllByRole('button', { expanded: false }).map(el => el.textContent);
        const years = yearElements.filter(text => /^\d{4}/.test(text));
        expect(years[0]).toContain('2024');
        expect(years[1]).toContain('2023');
      });
    });
  });

  describe('Document Download', () => {
    test('downloads document successfully', async () => {
      documentAPI.getAllUserDocuments = jest.fn(() =>
        Promise.resolve({ data: mockDocuments })
      );
      documentAPI.getDownloadUrl = jest.fn(() =>
        Promise.resolve({ data: { download_url: 'https://example.com/download' } })
      );

      // Mock DOM methods
      const createElementSpy = jest.spyOn(document, 'createElement');
      const appendChildSpy = jest.spyOn(document.body, 'appendChild').mockImplementation(() => {});
      const removeChildSpy = jest.spyOn(document.body, 'removeChild').mockImplementation(() => {});

      await renderWithRouter(<Documents />);

      await waitFor(() => {
        expect(screen.getByText('tax_2024.pdf')).toBeInTheDocument();
      });

      // Click download button
      const downloadButtons = screen.getAllByRole('button', { name: '' });

      await act(async () => {
        fireEvent.click(downloadButtons[0]);
        jest.advanceTimersByTime(150);
      });

      await waitFor(() => {
        expect(documentAPI.getDownloadUrl).toHaveBeenCalledWith('doc-1');
        expect(createElementSpy).toHaveBeenCalledWith('a');
      });

      // Cleanup
      createElementSpy.mockRestore();
      appendChildSpy.mockRestore();
      removeChildSpy.mockRestore();
    });

    test('shows loading state during download', async () => {
      documentAPI.getAllUserDocuments = jest.fn(() =>
        Promise.resolve({ data: mockDocuments })
      );
      documentAPI.getDownloadUrl = jest.fn(() => new Promise(() => {})); // Never resolves

      await renderWithRouter(<Documents />);

      await waitFor(() => {
        expect(screen.getByText('tax_2024.pdf')).toBeInTheDocument();
      });

      // Click download button
      const downloadButtons = screen.getAllByRole('button', { name: '' });

      await act(async () => {
        fireEvent.click(downloadButtons[0]);
      });

      // Should show loading spinner
      await waitFor(() => {
        const progressBars = screen.getAllByRole('progressbar');
        expect(progressBars.length).toBeGreaterThan(0);
      });
    });

    test('shows error when download fails', async () => {
      documentAPI.getAllUserDocuments = jest.fn(() =>
        Promise.resolve({ data: mockDocuments })
      );
      documentAPI.getDownloadUrl = jest.fn(() =>
        Promise.reject(new Error('Download failed'))
      );

      await renderWithRouter(<Documents />);

      await waitFor(() => {
        expect(screen.getByText('tax_2024.pdf')).toBeInTheDocument();
      });

      // Click download button
      const downloadButtons = screen.getAllByRole('button', { name: '' });

      await act(async () => {
        fireEvent.click(downloadButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to download document. Please try again.')).toBeInTheDocument();
      });
    });

    test('handles missing download URL', async () => {
      documentAPI.getAllUserDocuments = jest.fn(() =>
        Promise.resolve({ data: mockDocuments })
      );
      documentAPI.getDownloadUrl = jest.fn(() =>
        Promise.resolve({ data: {} }) // No URL
      );

      await renderWithRouter(<Documents />);

      await waitFor(() => {
        expect(screen.getByText('tax_2024.pdf')).toBeInTheDocument();
      });

      // Click download button
      const downloadButtons = screen.getAllByRole('button', { name: '' });

      await act(async () => {
        fireEvent.click(downloadButtons[0]);
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to download document. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Formatting Utilities', () => {
    test('formats file sizes correctly', async () => {
      documentAPI.getAllUserDocuments = jest.fn(() =>
        Promise.resolve({ data: mockDocuments })
      );

      await renderWithRouter(<Documents />);

      await waitFor(() => {
        expect(screen.getByText(/1\.00 MB/)).toBeInTheDocument(); // 1048576 bytes
        expect(screen.getByText(/2\.00 MB/)).toBeInTheDocument(); // 2097152 bytes
      });
    });

    test('formats dates correctly', async () => {
      documentAPI.getAllUserDocuments = jest.fn(() =>
        Promise.resolve({ data: mockDocuments })
      );

      await renderWithRouter(<Documents />);

      await waitFor(() => {
        // Should display localized dates
        const dateElements = screen.getAllByText(/\d+\/\d+\/\d+/);
        expect(dateElements.length).toBeGreaterThan(0);
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

      await renderWithRouter(<Documents />);

      await waitFor(() => {
        expect(screen.getByText('N/A')).toBeInTheDocument();
      });
    });
  });

  describe('Component Structure', () => {
    test('renders header and footer', async () => {
      documentAPI.getAllUserDocuments = jest.fn(() =>
        Promise.resolve({ data: [] })
      );

      await renderWithRouter(<Documents />);

      await waitFor(() => {
        expect(screen.getByTestId('header')).toBeInTheDocument();
        expect(screen.getByTestId('footer')).toBeInTheDocument();
      });
    });

    test('renders document management section', async () => {
      documentAPI.getAllUserDocuments = jest.fn(() =>
        Promise.resolve({ data: [] })
      );

      await renderWithRouter(<Documents />);

      await waitFor(() => {
        expect(screen.getByTestId('document-management')).toBeInTheDocument();
      });
    });

    test('renders breadcrumbs correctly', async () => {
      documentAPI.getAllUserDocuments = jest.fn(() =>
        Promise.resolve({ data: [] })
      );

      await renderWithRouter(<Documents />);

      await waitFor(() => {
        expect(screen.getByText('home')).toBeInTheDocument();
        expect(screen.getByText('Documents')).toBeInTheDocument();
      });
    });
  });

  describe('Error Snackbar', () => {
    test('closes error snackbar when close button clicked', async () => {
      documentAPI.getAllUserDocuments = jest.fn(() =>
        Promise.reject(new Error('Network error'))
      );

      await renderWithRouter(<Documents />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load documents. Please try again.')).toBeInTheDocument();
      });

      // Click close button on snackbar
      const closeButton = screen.getByRole('button', { name: /close/i });

      await act(async () => {
        fireEvent.click(closeButton);
      });

      await waitFor(() => {
        expect(screen.queryByText('Failed to load documents. Please try again.')).not.toBeInTheDocument();
      });
    });
  });
});
