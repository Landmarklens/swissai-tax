import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { act } from 'react-dom/test-utils';
import ManageSubscription from '../ManageSubscription';
import subscriptionService from '../../../services/subscriptionService';

// Mock services
jest.mock('../../../services/subscriptionService');
jest.mock('../../../pages/Settings/components/BillingTab', () => {
  return function MockBillingTab() {
    return <div data-testid="billing-tab">Billing Tab</div>;
  };
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key
  })
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('ManageSubscription', () => {
  const mockActiveSubscription = {
    id: 'sub_123',
    plan_type: 'annual_flex',
    status: 'active',
    price_chf: 129,
    plan_commitment_years: 1,
    current_period_end: '2025-12-31T00:00:00Z',
    cancel_at_period_end: false
  };

  const mockTrialSubscription = {
    id: 'sub_456',
    plan_type: '5_year_lock',
    status: 'trialing',
    price_chf: 89,
    plan_commitment_years: 5,
    trial_end: '2025-11-09T00:00:00Z',
    cancel_at_period_end: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching subscription', () => {
      subscriptionService.getCurrentSubscription.mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      renderWithRouter(<ManageSubscription />);

      expect(screen.getByRole('progressbar')).toBeInTheDocument();
    });
  });

  describe('No Subscription State', () => {
    it('should show no subscription message when user has no subscription', async () => {
      subscriptionService.getCurrentSubscription.mockResolvedValue(null);

      await act(async () => {
        renderWithRouter(<ManageSubscription />);
      });

      await waitFor(() => {
        expect(screen.getByText('No Active Subscription')).toBeInTheDocument();
        expect(screen.getByText(/don't have an active subscription/)).toBeInTheDocument();
      });
    });

    it('should show "View Plans" button when no subscription', async () => {
      subscriptionService.getCurrentSubscription.mockResolvedValue(null);

      await act(async () => {
        renderWithRouter(<ManageSubscription />);
      });

      await waitFor(() => {
        const viewPlansButton = screen.getByText('View Plans');
        expect(viewPlansButton).toBeInTheDocument();

        fireEvent.click(viewPlansButton);
        expect(mockNavigate).toHaveBeenCalledWith('/subscription/plans');
      });
    });
  });

  describe('Active Subscription Display', () => {
    it('should display subscription details', async () => {
      subscriptionService.getCurrentSubscription.mockResolvedValue(mockActiveSubscription);

      await act(async () => {
        renderWithRouter(<ManageSubscription />);
      });

      await waitFor(() => {
        expect(screen.getByText('Manage Subscription')).toBeInTheDocument();
        expect(screen.getByText('Annual Flex')).toBeInTheDocument();
        expect(screen.getByText('CHF 129 / year')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
      });
    });

    it('should show commitment years for 5-year plan', async () => {
      const fiveYearSub = { ...mockActiveSubscription, plan_commitment_years: 5 };
      subscriptionService.getCurrentSubscription.mockResolvedValue(fiveYearSub);

      await act(async () => {
        renderWithRouter(<ManageSubscription />);
      });

      await waitFor(() => {
        expect(screen.getByText(/5.*years/)).toBeInTheDocument();
      });
    });

    it('should display billing history component', async () => {
      subscriptionService.getCurrentSubscription.mockResolvedValue(mockActiveSubscription);

      await act(async () => {
        renderWithRouter(<ManageSubscription />);
      });

      await waitFor(() => {
        expect(screen.getByTestId('billing-tab')).toBeInTheDocument();
      });
    });
  });

  describe('Trial Period', () => {
    it('should show trial notice during trial', async () => {
      subscriptionService.getCurrentSubscription.mockResolvedValue(mockTrialSubscription);

      await act(async () => {
        renderWithRouter(<ManageSubscription />);
      });

      await waitFor(() => {
        expect(screen.getByText(/You are in your free trial period/)).toBeInTheDocument();
        expect(screen.getByText('Trial')).toBeInTheDocument();
      });
    });

    it('should show switch plan button during trial', async () => {
      subscriptionService.getCurrentSubscription.mockResolvedValue(mockTrialSubscription);

      await act(async () => {
        renderWithRouter(<ManageSubscription />);
      });

      await waitFor(() => {
        expect(screen.getByText('Switch Plan')).toBeInTheDocument();
      });
    });

    it('should allow immediate cancellation during trial', async () => {
      subscriptionService.getCurrentSubscription.mockResolvedValue(mockTrialSubscription);

      await act(async () => {
        renderWithRouter(<ManageSubscription />);
      });

      await waitFor(() => {
        expect(screen.getByText('Cancel Subscription')).toBeInTheDocument();
      });
    });
  });

  describe('Cancellation', () => {
    it('should open cancel dialog when cancel button clicked', async () => {
      subscriptionService.getCurrentSubscription.mockResolvedValue(mockActiveSubscription);

      await act(async () => {
        renderWithRouter(<ManageSubscription />);
      });

      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel at Period End');
        fireEvent.click(cancelButton);

        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText(/Keep Subscription/)).toBeInTheDocument();
      });
    });

    it('should call cancelSubscription when confirmed', async () => {
      subscriptionService.getCurrentSubscription.mockResolvedValue(mockActiveSubscription);
      subscriptionService.cancelSubscription.mockResolvedValue({ success: true });

      await act(async () => {
        renderWithRouter(<ManageSubscription />);
      });

      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel at Period End');
        fireEvent.click(cancelButton);
      });

      const confirmButton = screen.getByText('Confirm Cancel');
      await act(async () => {
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(subscriptionService.cancelSubscription).toHaveBeenCalled();
      });
    });

    it('should include cancellation reason when provided', async () => {
      subscriptionService.getCurrentSubscription.mockResolvedValue(mockActiveSubscription);
      subscriptionService.cancelSubscription.mockResolvedValue({ success: true });

      await act(async () => {
        renderWithRouter(<ManageSubscription />);
      });

      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel at Period End');
        fireEvent.click(cancelButton);
      });

      const reasonInput = screen.getByLabelText(/Reason for canceling/);
      fireEvent.change(reasonInput, { target: { value: 'Too expensive' } });

      const confirmButton = screen.getByText('Confirm Cancel');
      await act(async () => {
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(subscriptionService.cancelSubscription).toHaveBeenCalledWith('Too expensive');
      });
    });

    it('should show canceled notice when cancel_at_period_end is true', async () => {
      const canceledSub = { ...mockActiveSubscription, cancel_at_period_end: true };
      subscriptionService.getCurrentSubscription.mockResolvedValue(canceledSub);

      await act(async () => {
        renderWithRouter(<ManageSubscription />);
      });

      await waitFor(() => {
        expect(screen.getByText(/Your subscription will end on/)).toBeInTheDocument();
      });
    });

    it('should not show cancel button if already canceled', async () => {
      const canceledSub = { ...mockActiveSubscription, status: 'canceled' };
      subscriptionService.getCurrentSubscription.mockResolvedValue(canceledSub);

      await act(async () => {
        renderWithRouter(<ManageSubscription />);
      });

      await waitFor(() => {
        expect(screen.queryByText('Cancel Subscription')).not.toBeInTheDocument();
      });
    });
  });

  describe('Plan Switching', () => {
    it('should open switch dialog when switch button clicked', async () => {
      subscriptionService.getCurrentSubscription.mockResolvedValue(mockTrialSubscription);

      await act(async () => {
        renderWithRouter(<ManageSubscription />);
      });

      await waitFor(() => {
        const switchButton = screen.getByText('Switch Plan');
        fireEvent.click(switchButton);

        expect(screen.getByText('Switch Plan')).toBeInTheDocument();
        expect(screen.getByText(/Switch to Annual Flex/)).toBeInTheDocument();
      });
    });

    it('should call switchPlan when confirmed', async () => {
      subscriptionService.getCurrentSubscription.mockResolvedValue(mockTrialSubscription);
      subscriptionService.switchPlan.mockResolvedValue({ success: true });

      await act(async () => {
        renderWithRouter(<ManageSubscription />);
      });

      await waitFor(() => {
        const switchButton = screen.getByText('Switch Plan');
        fireEvent.click(switchButton);
      });

      const confirmButton = screen.getByText('Confirm Switch');
      await act(async () => {
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(subscriptionService.switchPlan).toHaveBeenCalledWith(
          'annual_flex',
          'User requested plan switch'
        );
      });
    });

    it('should not show switch plan button after trial', async () => {
      subscriptionService.getCurrentSubscription.mockResolvedValue(mockActiveSubscription);

      await act(async () => {
        renderWithRouter(<ManageSubscription />);
      });

      await waitFor(() => {
        expect(screen.queryByText('Switch Plan')).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error when fetching subscription fails', async () => {
      subscriptionService.getCurrentSubscription.mockRejectedValue(
        new Error('Network error')
      );

      await act(async () => {
        renderWithRouter(<ManageSubscription />);
      });

      await waitFor(() => {
        expect(screen.getByText(/Failed to load subscription/)).toBeInTheDocument();
      });
    });

    it('should show error when cancellation fails', async () => {
      subscriptionService.getCurrentSubscription.mockResolvedValue(mockActiveSubscription);
      subscriptionService.cancelSubscription.mockRejectedValue(
        { response: { data: { detail: 'Cancellation failed' } } }
      );

      await act(async () => {
        renderWithRouter(<ManageSubscription />);
      });

      await waitFor(() => {
        const cancelButton = screen.getByText('Cancel at Period End');
        fireEvent.click(cancelButton);
      });

      const confirmButton = screen.getByText('Confirm Cancel');
      await act(async () => {
        fireEvent.click(confirmButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Cancellation failed')).toBeInTheDocument();
      });
    });
  });

  describe('Commitment Warning', () => {
    it('should show commitment notice for 5-year plan after trial', async () => {
      const committedSub = { ...mockActiveSubscription, plan_commitment_years: 5 };
      subscriptionService.getCurrentSubscription.mockResolvedValue(committedSub);

      await act(async () => {
        renderWithRouter(<ManageSubscription />);
      });

      await waitFor(() => {
        expect(screen.getByText('Commitment Notice')).toBeInTheDocument();
        expect(screen.getByText(/5-year commitment/)).toBeInTheDocument();
      });
    });
  });

  describe('Actions', () => {
    it('should scroll to billing history when view invoices clicked', async () => {
      const scrollIntoViewMock = jest.fn();
      Element.prototype.scrollIntoView = scrollIntoViewMock;

      subscriptionService.getCurrentSubscription.mockResolvedValue(mockActiveSubscription);

      await act(async () => {
        renderWithRouter(<ManageSubscription />);
      });

      await waitFor(() => {
        const viewInvoicesButton = screen.getByText('View Invoices');
        fireEvent.click(viewInvoicesButton);

        expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: 'smooth' });
      });
    });
  });
});
