/**
 * Unit tests for AccountCredits component
 */

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AccountCredits from './AccountCredits';
import referralService from '../../services/referralService';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, defaultValue) => defaultValue || key,
    i18n: {
      changeLanguage: jest.fn(),
      language: 'en'
    }
  })
}));

// Mock referralService
jest.mock('../../services/referralService');

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('AccountCredits', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    referralService.formatCurrency.mockImplementation((amount) => `CHF ${amount.toFixed(2)}`);
    referralService.formatDate.mockImplementation((date) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('en-GB');
    });
  });

  describe('Loading State', () => {
    it('should display loading spinner initially', () => {
      referralService.getMyCredits.mockReturnValue(new Promise(() => {})); // Never resolves

      renderWithTheme(<AccountCredits />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should display error message when fetch fails', async () => {
      referralService.getMyCredits.mockResolvedValue({
        success: false,
        error: 'Network error'
      });

      renderWithTheme(<AccountCredits />);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should display default error message when error is not provided', async () => {
      referralService.getMyCredits.mockResolvedValue({
        success: false
      });

      renderWithTheme(<AccountCredits />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load credits')).toBeInTheDocument();
      });
    });

    it('should handle exception during fetch', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      referralService.getMyCredits.mockRejectedValue(new Error('Network exception'));

      renderWithTheme(<AccountCredits />);

      await waitFor(() => {
        expect(screen.getByText('Failed to load account credits')).toBeInTheDocument();
      });

      consoleError.mockRestore();
    });
  });

  describe('Balance Display', () => {
    it('should display zero balance when no credits exist', async () => {
      referralService.getMyCredits.mockResolvedValue({
        success: true,
        data: {
          credits: [],
          total_balance_chf: 0
        }
      });

      renderWithTheme(<AccountCredits />);

      await waitFor(() => {
        expect(screen.getByText('Available Credits')).toBeInTheDocument();
        expect(screen.getByText('CHF 0.00')).toBeInTheDocument();
        expect(screen.getByText('No Credits')).toBeInTheDocument();
      });
    });

    it('should display positive balance correctly', async () => {
      referralService.getMyCredits.mockResolvedValue({
        success: true,
        data: {
          credits: [
            {
              id: 1,
              credit_type: 'referral_reward',
              amount_chf: 25.50,
              transaction_type: 'credit',
              created_at: '2025-01-15T10:00:00Z',
              description: 'Referral reward'
            }
          ],
          total_balance_chf: 25.50
        }
      });

      renderWithTheme(<AccountCredits />);

      await waitFor(() => {
        expect(screen.getByText('Available Credits')).toBeInTheDocument();
        expect(screen.getByText('CHF 25.50')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
      });
    });

    it('should show auto-apply message when balance is positive', async () => {
      referralService.getMyCredits.mockResolvedValue({
        success: true,
        data: {
          credits: [],
          total_balance_chf: 10
        }
      });

      renderWithTheme(<AccountCredits />);

      await waitFor(() => {
        expect(screen.getByText('Your credits will be automatically applied to your next subscription payment')).toBeInTheDocument();
      });
    });

    it('should not show auto-apply message when balance is zero', async () => {
      referralService.getMyCredits.mockResolvedValue({
        success: true,
        data: {
          credits: [],
          total_balance_chf: 0
        }
      });

      renderWithTheme(<AccountCredits />);

      await waitFor(() => {
        expect(screen.queryByText('Your credits will be automatically applied to your next subscription payment')).not.toBeInTheDocument();
      });
    });
  });

  describe('Transaction History', () => {
    const mockCredits = [
      {
        id: 1,
        credit_type: 'referral_reward',
        amount_chf: 10,
        transaction_type: 'credit',
        created_at: '2025-01-15T10:00:00Z',
        description: 'Reward for referring user@example.com'
      },
      {
        id: 2,
        credit_type: 'subscription_payment',
        amount_chf: 5,
        transaction_type: 'debit',
        created_at: '2025-01-14T10:00:00Z',
        description: 'Applied to subscription payment'
      },
      {
        id: 3,
        credit_type: 'promotional',
        amount_chf: 15,
        transaction_type: 'credit',
        created_at: '2025-01-13T10:00:00Z',
        description: 'Welcome bonus'
      }
    ];

    it('should display transaction history by default', async () => {
      referralService.getMyCredits.mockResolvedValue({
        success: true,
        data: {
          credits: mockCredits,
          total_balance_chf: 20
        }
      });

      renderWithTheme(<AccountCredits />);

      await waitFor(() => {
        expect(screen.getByText('Recent Transactions')).toBeInTheDocument();
        expect(screen.getByText('Reward for referring user@example.com')).toBeInTheDocument();
        expect(screen.getByText('Applied to subscription payment')).toBeInTheDocument();
        expect(screen.getByText('Welcome bonus')).toBeInTheDocument();
      });
    });

    it('should hide transaction history when showHistory is false', async () => {
      referralService.getMyCredits.mockResolvedValue({
        success: true,
        data: {
          credits: mockCredits,
          total_balance_chf: 20
        }
      });

      renderWithTheme(<AccountCredits showHistory={false} />);

      await waitFor(() => {
        expect(screen.queryByText('Recent Transactions')).not.toBeInTheDocument();
        expect(screen.queryByText('Reward for referring user@example.com')).not.toBeInTheDocument();
      });
    });

    it('should limit transactions based on limit prop', async () => {
      const manyCredits = Array.from({ length: 10 }, (_, i) => ({
        id: i + 1,
        credit_type: 'referral_reward',
        amount_chf: 10,
        transaction_type: 'credit',
        created_at: `2025-01-${15 - i}T10:00:00Z`,
        description: `Transaction ${i + 1}`
      }));

      referralService.getMyCredits.mockResolvedValue({
        success: true,
        data: {
          credits: manyCredits,
          total_balance_chf: 100
        }
      });

      renderWithTheme(<AccountCredits limit={3} />);

      await waitFor(() => {
        expect(screen.getByText('Transaction 1')).toBeInTheDocument();
        expect(screen.getByText('Transaction 2')).toBeInTheDocument();
        expect(screen.getByText('Transaction 3')).toBeInTheDocument();
        expect(screen.queryByText('Transaction 4')).not.toBeInTheDocument();
      });
    });

    it('should display credit transactions with green icon and positive sign', async () => {
      referralService.getMyCredits.mockResolvedValue({
        success: true,
        data: {
          credits: [
            {
              id: 1,
              amount_chf: 10,
              transaction_type: 'credit',
              created_at: '2025-01-15T10:00:00Z',
              description: 'Credit added'
            }
          ],
          total_balance_chf: 10
        }
      });

      renderWithTheme(<AccountCredits />);

      await waitFor(() => {
        expect(screen.getByText('+CHF 10.00')).toBeInTheDocument();
      });
    });

    it('should display debit transactions with red icon and negative sign', async () => {
      referralService.getMyCredits.mockResolvedValue({
        success: true,
        data: {
          credits: [
            {
              id: 1,
              amount_chf: 5,
              transaction_type: 'debit',
              created_at: '2025-01-15T10:00:00Z',
              description: 'Credit used'
            }
          ],
          total_balance_chf: 5
        }
      });

      renderWithTheme(<AccountCredits />);

      await waitFor(() => {
        expect(screen.getByText('-CHF 5.00')).toBeInTheDocument();
      });
    });

    it('should format transaction dates correctly', async () => {
      referralService.getMyCredits.mockResolvedValue({
        success: true,
        data: {
          credits: [
            {
              id: 1,
              amount_chf: 10,
              transaction_type: 'credit',
              created_at: '2025-01-15T10:00:00Z',
              description: 'Test transaction'
            }
          ],
          total_balance_chf: 10
        }
      });

      renderWithTheme(<AccountCredits />);

      await waitFor(() => {
        expect(referralService.formatDate).toHaveBeenCalledWith('2025-01-15T10:00:00Z');
      });
    });

    it('should use default description when description is missing', async () => {
      referralService.getMyCredits.mockResolvedValue({
        success: true,
        data: {
          credits: [
            {
              id: 1,
              amount_chf: 10,
              transaction_type: 'credit',
              created_at: '2025-01-15T10:00:00Z'
              // No description
            }
          ],
          total_balance_chf: 10
        }
      });

      renderWithTheme(<AccountCredits />);

      await waitFor(() => {
        expect(screen.getByText('Credit Added')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no transactions exist', async () => {
      referralService.getMyCredits.mockResolvedValue({
        success: true,
        data: {
          credits: [],
          total_balance_chf: 0
        }
      });

      renderWithTheme(<AccountCredits />);

      await waitFor(() => {
        expect(screen.getByText('No credit transactions yet')).toBeInTheDocument();
        expect(screen.getByText('Refer friends to earn credits!')).toBeInTheDocument();
      });
    });

    it('should not show empty state when showHistory is false', async () => {
      referralService.getMyCredits.mockResolvedValue({
        success: true,
        data: {
          credits: [],
          total_balance_chf: 0
        }
      });

      renderWithTheme(<AccountCredits showHistory={false} />);

      await waitFor(() => {
        expect(screen.queryByText('No credit transactions yet')).not.toBeInTheDocument();
      });
    });
  });

  describe('Data Handling', () => {
    it('should handle missing total_balance_chf gracefully', async () => {
      referralService.getMyCredits.mockResolvedValue({
        success: true,
        data: {
          credits: []
          // Missing total_balance_chf
        }
      });

      renderWithTheme(<AccountCredits />);

      await waitFor(() => {
        expect(screen.getByText('CHF 0.00')).toBeInTheDocument();
      });
    });

    it('should handle missing credits array gracefully', async () => {
      referralService.getMyCredits.mockResolvedValue({
        success: true,
        data: {
          total_balance_chf: 0
          // Missing credits array
        }
      });

      renderWithTheme(<AccountCredits />);

      await waitFor(() => {
        expect(screen.getByText('No credit transactions yet')).toBeInTheDocument();
      });
    });

    it('should handle null data gracefully', async () => {
      referralService.getMyCredits.mockResolvedValue({
        success: true,
        data: null
      });

      await act(async () => {
        renderWithTheme(<AccountCredits />);
      });

      await waitFor(() => {
        expect(screen.getByText('CHF 0.00')).toBeInTheDocument();
      });
    });

    it('should handle negative amounts correctly', async () => {
      referralService.getMyCredits.mockResolvedValue({
        success: true,
        data: {
          credits: [
            {
              id: 1,
              amount_chf: -10,
              transaction_type: 'debit',
              created_at: '2025-01-15T10:00:00Z',
              description: 'Debit'
            }
          ],
          total_balance_chf: 0
        }
      });

      renderWithTheme(<AccountCredits />);

      await waitFor(() => {
        // Math.abs should handle negative amounts
        expect(screen.getByText('-CHF 10.00')).toBeInTheDocument();
      });
    });
  });

  describe('Component Integration', () => {
    it('should call getMyCredits on mount', async () => {
      referralService.getMyCredits.mockResolvedValue({
        success: true,
        data: {
          credits: [],
          total_balance_chf: 0
        }
      });

      renderWithTheme(<AccountCredits />);

      await waitFor(() => {
        expect(referralService.getMyCredits).toHaveBeenCalledTimes(1);
      });
    });

    it('should format all amounts using formatCurrency', async () => {
      referralService.getMyCredits.mockResolvedValue({
        success: true,
        data: {
          credits: [
            {
              id: 1,
              amount_chf: 10.50,
              transaction_type: 'credit',
              created_at: '2025-01-15T10:00:00Z',
              description: 'Test'
            }
          ],
          total_balance_chf: 10.50
        }
      });

      renderWithTheme(<AccountCredits />);

      await waitFor(() => {
        // Should be called for balance and transaction amount
        expect(referralService.formatCurrency).toHaveBeenCalledWith(10.50);
      });
    });
  });
});
