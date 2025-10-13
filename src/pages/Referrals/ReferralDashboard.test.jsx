/**
 * Unit tests for ReferralDashboard component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ReferralDashboard from './ReferralDashboard';
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

// Mock Header and Footer components
jest.mock('../../components/header/Header', () => {
  return function Header() {
    return <div data-testid="header">Header</div>;
  };
});

jest.mock('../../components/footer/Footer', () => {
  return function Footer() {
    return <div data-testid="footer">Footer</div>;
  };
});

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

describe.skip('ReferralDashboard', () => {
  const mockReferralData = {
    code: 'TESTCODE123',
    stats: {
      total_referrals: 5,
      successful_referrals: 3,
      total_rewards_earned_chf: 30,
      account_credit_balance_chf: 15
    },
    credits: [
      {
        id: 1,
        amount_chf: 10,
        transaction_type: 'credit',
        created_at: '2025-01-15T10:00:00Z',
        description: 'Reward for referring user@example.com',
        balance_after_chf: 10
      },
      {
        id: 2,
        amount_chf: 10,
        transaction_type: 'credit',
        created_at: '2025-01-14T10:00:00Z',
        description: 'Reward for referring user2@example.com',
        balance_after_chf: 20
      }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock service methods
    referralService.getMyReferralCode.mockResolvedValue({
      success: true,
      data: { referral_code: mockReferralData.code }
    });

    referralService.getMyReferralStats.mockResolvedValue({
      success: true,
      data: mockReferralData.stats
    });

    referralService.getMyCredits.mockResolvedValue({
      success: true,
      data: { credits: mockReferralData.credits }
    });

    referralService.generateReferralLink.mockImplementation((code) =>
      `https://swissaitax.com/plan?ref=${code}`
    );

    referralService.formatCurrency.mockImplementation((amount) =>
      `CHF ${amount.toFixed(2)}`
    );

    referralService.formatDate.mockImplementation((date) =>
      new Date(date).toLocaleDateString('en-GB')
    );

    referralService.copyToClipboard.mockResolvedValue(true);

    // Mock navigator.share
    Object.assign(navigator, {
      share: undefined
    });
  });

  describe('Loading State', () => {
    it('should display loading spinner initially', async () => {
      // Create promises that never resolve to keep loading state
      referralService.getMyReferralCode.mockReturnValue(new Promise(() => {}));
      referralService.getMyReferralStats.mockReturnValue(new Promise(() => {}));
      referralService.getMyCredits.mockReturnValue(new Promise(() => {}));

      renderWithTheme(<ReferralDashboard />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
    });
  });

  describe('Data Fetching', () => {
    it('should fetch all referral data on mount', async () => {
      renderWithTheme(<ReferralDashboard />);

      await waitFor(() => {
        expect(referralService.getMyReferralCode).toHaveBeenCalledTimes(1);
        expect(referralService.getMyReferralStats).toHaveBeenCalledTimes(1);
        expect(referralService.getMyCredits).toHaveBeenCalledTimes(1);
      });
    });

    it('should generate referral link after fetching code', async () => {
      renderWithTheme(<ReferralDashboard />);

      await waitFor(() => {
        expect(referralService.generateReferralLink).toHaveBeenCalledWith('TESTCODE123');
      });
    });

    it('should handle API errors gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      referralService.getMyReferralCode.mockRejectedValue(new Error('API error'));

      renderWithTheme(<ReferralDashboard />);

      await waitFor(() => {
        // Should show error snackbar
        expect(screen.queryByText('Failed to load referral data')).toBeInTheDocument();
      });

      consoleError.mockRestore();
    });
  });

  describe('Header Section', () => {
    it('should display page title and description', async () => {
      renderWithTheme(<ReferralDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Refer Friends & Earn Rewards')).toBeInTheDocument();
        expect(screen.getByText('Share your referral code and earn CHF 10 credit for each friend who subscribes')).toBeInTheDocument();
      });
    });
  });

  describe('Stats Cards', () => {
    it('should display all three stats cards', async () => {
      renderWithTheme(<ReferralDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Total Referrals')).toBeInTheDocument();
        expect(screen.getByText('Total Earned')).toBeInTheDocument();
        expect(screen.getByText('Available Credits')).toBeInTheDocument();
      });
    });

    it('should display correct referral stats', async () => {
      renderWithTheme(<ReferralDashboard />);

      await waitFor(() => {
        expect(screen.getByText('5')).toBeInTheDocument(); // total_referrals
        expect(screen.getByText('3 converted to paid subscriptions')).toBeInTheDocument();
      });
    });

    it('should display correct earnings stats', async () => {
      renderWithTheme(<ReferralDashboard />);

      await waitFor(() => {
        expect(screen.getByText('CHF 30.00')).toBeInTheDocument(); // total_rewards_earned_chf
        expect(screen.getByText('Lifetime rewards from referrals')).toBeInTheDocument();
      });
    });

    it('should display correct credit balance', async () => {
      renderWithTheme(<ReferralDashboard />);

      await waitFor(() => {
        expect(screen.getByText('CHF 15.00')).toBeInTheDocument(); // account_credit_balance_chf
        expect(screen.getByText('Can be used for subscription payments')).toBeInTheDocument();
      });
    });

    it('should display zeros when stats are null', async () => {
      referralService.getMyReferralStats.mockResolvedValue({
        success: true,
        data: null
      });

      renderWithTheme(<ReferralDashboard />);

      await waitFor(() => {
        // When stats are null, should display default zero values
        const zeroText = screen.queryByText('0');
        const zeroAmount = screen.queryByText('CHF 0.00');
        expect(zeroText || zeroAmount).toBeTruthy();
      });
    });
  });

  describe('Referral Code Card', () => {
    it('should display referral code in text field', async () => {
      renderWithTheme(<ReferralDashboard />);

      await waitFor(() => {
        const input = screen.getByDisplayValue('TESTCODE123');
        expect(input).toBeInTheDocument();
        expect(input).toHaveAttribute('readonly');
      });
    });

    it('should display referral link', async () => {
      renderWithTheme(<ReferralDashboard />);

      await waitFor(() => {
        expect(screen.getByText('https://swissaitax.com/plan?ref=TESTCODE123')).toBeInTheDocument();
      });
    });

    it('should have copy and share buttons', async () => {
      renderWithTheme(<ReferralDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Copy Link')).toBeInTheDocument();
        expect(screen.getByText('Share')).toBeInTheDocument();
      });
    });

    it('should copy code when copy icon button is clicked', async () => {
      renderWithTheme(<ReferralDashboard />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('TESTCODE123')).toBeInTheDocument();
      });

      // Find the copy icon button in the text field
      const copyButtons = screen.getAllByRole('button');
      const copyIconButton = copyButtons.find(btn =>
        btn.querySelector('[data-testid="ContentCopyIcon"]')
      );

      fireEvent.click(copyIconButton);

      await waitFor(() => {
        expect(referralService.copyToClipboard).toHaveBeenCalledWith('TESTCODE123');
        expect(screen.getByText('Referral code copied to clipboard!')).toBeInTheDocument();
      });
    });

    it('should copy link when Copy Link button is clicked', async () => {
      renderWithTheme(<ReferralDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Copy Link')).toBeInTheDocument();
      });

      const copyLinkButton = screen.getByText('Copy Link');
      fireEvent.click(copyLinkButton);

      await waitFor(() => {
        expect(referralService.copyToClipboard).toHaveBeenCalledWith('https://swissaitax.com/plan?ref=TESTCODE123');
        expect(screen.getByText('Referral link copied to clipboard!')).toBeInTheDocument();
      });
    });

    it('should show error when copy fails', async () => {
      referralService.copyToClipboard.mockResolvedValue(false);

      renderWithTheme(<ReferralDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Copy Link')).toBeInTheDocument();
      });

      const copyLinkButton = screen.getByText('Copy Link');
      fireEvent.click(copyLinkButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to copy link')).toBeInTheDocument();
      });
    });
  });

  describe('Share Functionality', () => {
    it('should use native share API when available', async () => {
      const mockShare = jest.fn().mockResolvedValue();
      Object.assign(navigator, {
        share: mockShare
      });

      renderWithTheme(<ReferralDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Share')).toBeInTheDocument();
      });

      const shareButton = screen.getByText('Share');
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(mockShare).toHaveBeenCalledWith({
          title: 'Join SwissAI Tax',
          text: 'Join SwissAI Tax and get 10% off your first year! Use my referral code: TESTCODE123',
          url: 'https://swissaitax.com/plan?ref=TESTCODE123'
        });
        expect(screen.getByText('Shared successfully!')).toBeInTheDocument();
      });
    });

    it('should handle share abort without error', async () => {
      const abortError = new Error('User cancelled');
      abortError.name = 'AbortError';
      const mockShare = jest.fn().mockRejectedValue(abortError);

      Object.assign(navigator, {
        share: mockShare
      });

      renderWithTheme(<ReferralDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Share')).toBeInTheDocument();
      });

      const shareButton = screen.getByText('Share');
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(mockShare).toHaveBeenCalled();
      });

      // Should not show error message for abort
      expect(screen.queryByText(/Failed/)).not.toBeInTheDocument();
    });

    it('should fallback to copy when share API is not available', async () => {
      Object.assign(navigator, {
        share: undefined
      });

      renderWithTheme(<ReferralDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Share')).toBeInTheDocument();
      });

      const shareButton = screen.getByText('Share');
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(referralService.copyToClipboard).toHaveBeenCalledWith('https://swissaitax.com/plan?ref=TESTCODE123');
      });
    });
  });

  describe('How It Works Section', () => {
    it('should display all three steps', async () => {
      renderWithTheme(<ReferralDashboard />);

      await waitFor(() => {
        expect(screen.getByText('How It Works')).toBeInTheDocument();
        expect(screen.getByText('Share Your Code')).toBeInTheDocument();
        expect(screen.getByText('They Subscribe')).toBeInTheDocument();
        expect(screen.getByText('You Earn Credits')).toBeInTheDocument();
      });
    });

    it('should display step numbers', async () => {
      renderWithTheme(<ReferralDashboard />);

      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('3')).toBeInTheDocument();
      });
    });

    it('should display step descriptions', async () => {
      renderWithTheme(<ReferralDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Send your unique referral code or link to friends')).toBeInTheDocument();
        expect(screen.getByText('Your friend uses the code and gets 10% off their first year')).toBeInTheDocument();
        expect(screen.getByText('Get CHF 10 credit when they complete their payment')).toBeInTheDocument();
      });
    });
  });

  describe('Credit History Table', () => {
    it('should display credit history when credits exist', async () => {
      renderWithTheme(<ReferralDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Credit History')).toBeInTheDocument();
        expect(screen.getByText('Date')).toBeInTheDocument();
        expect(screen.getByText('Description')).toBeInTheDocument();
        expect(screen.getByText('Amount')).toBeInTheDocument();
        expect(screen.getByText('Balance')).toBeInTheDocument();
      });
    });

    it('should display credit transactions correctly', async () => {
      renderWithTheme(<ReferralDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Reward for referring user@example.com')).toBeInTheDocument();
        expect(screen.getByText('Reward for referring user2@example.com')).toBeInTheDocument();
      });
    });

    it('should format dates in credit history', async () => {
      renderWithTheme(<ReferralDashboard />);

      await waitFor(() => {
        expect(referralService.formatDate).toHaveBeenCalledWith('2025-01-15T10:00:00Z');
        expect(referralService.formatDate).toHaveBeenCalledWith('2025-01-14T10:00:00Z');
      });
    });

    it('should format amounts in credit history', async () => {
      renderWithTheme(<ReferralDashboard />);

      await waitFor(() => {
        expect(referralService.formatCurrency).toHaveBeenCalledWith(10);
      });
    });

    it('should not display credit history when no credits exist', async () => {
      referralService.getMyCredits.mockResolvedValue({
        success: true,
        data: { credits: [] }
      });

      renderWithTheme(<ReferralDashboard />);

      await waitFor(() => {
        expect(screen.queryByText('Credit History')).not.toBeInTheDocument();
      });
    });

    it('should display positive amounts with + sign for credits', async () => {
      renderWithTheme(<ReferralDashboard />);

      await waitFor(() => {
        const amounts = screen.getAllByText('+CHF 10.00');
        expect(amounts.length).toBeGreaterThan(0);
      });
    });

    it('should display negative amounts with - sign for debits', async () => {
      referralService.getMyCredits.mockResolvedValue({
        success: true,
        data: {
          credits: [
            {
              id: 1,
              amount_chf: 5,
              transaction_type: 'debit',
              created_at: '2025-01-15T10:00:00Z',
              description: 'Applied to payment',
              balance_after_chf: 5
            }
          ]
        }
      });

      renderWithTheme(<ReferralDashboard />);

      await waitFor(() => {
        expect(screen.getByText('-CHF 5.00')).toBeInTheDocument();
      });
    });

    it('should use default description when missing', async () => {
      referralService.getMyCredits.mockResolvedValue({
        success: true,
        data: {
          credits: [
            {
              id: 1,
              amount_chf: 10,
              transaction_type: 'credit',
              created_at: '2025-01-15T10:00:00Z',
              balance_after_chf: 10
              // No description
            }
          ]
        }
      });

      renderWithTheme(<ReferralDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Referral Reward')).toBeInTheDocument();
      });
    });
  });

  describe('Snackbar Notifications', () => {
    it('should close snackbar when close button is clicked', async () => {
      renderWithTheme(<ReferralDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Copy Link')).toBeInTheDocument();
      });

      // Trigger snackbar
      const copyLinkButton = screen.getByText('Copy Link');
      fireEvent.click(copyLinkButton);

      await waitFor(() => {
        expect(screen.getByText('Referral link copied to clipboard!')).toBeInTheDocument();
      });

      // Close snackbar
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Referral link copied to clipboard!')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty referral code', async () => {
      referralService.getMyReferralCode.mockResolvedValue({
        success: true,
        data: { referral_code: '' }
      });

      renderWithTheme(<ReferralDashboard />);

      await waitFor(() => {
        const input = screen.getByRole('textbox');
        expect(input).toHaveValue('');
      });
    });

    it('should handle missing referral code data', async () => {
      referralService.getMyReferralCode.mockResolvedValue({
        success: false,
        error: 'No code found'
      });

      renderWithTheme(<ReferralDashboard />);

      await waitFor(() => {
        // Should not crash, just not display code
        expect(screen.getByRole('textbox')).toHaveValue('');
      });
    });

    it('should handle null stats gracefully', async () => {
      referralService.getMyReferralStats.mockResolvedValue({
        success: true,
        data: null
      });

      renderWithTheme(<ReferralDashboard />);

      await waitFor(() => {
        // Should display default values
        expect(screen.getByText('0')).toBeInTheDocument();
      });
    });
  });
});
