import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import BillingTab from '../BillingTab';
import subscriptionService from '../../../../services/subscriptionService';

jest.mock('../../../../services/subscriptionService');

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'Current Plan': 'Current Plan',
        'You do not have an active subscription': 'You do not have an active subscription',
        'Subscribe to SwissAI Tax to access premium features and file your Swiss taxes easily.': 'Subscribe to SwissAI Tax to access premium features and file your Swiss taxes easily.',
        'View Plans': 'View Plans',
        'Active': 'Active',
        'Inactive': 'Inactive',
        'Canceling': 'Canceling',
        'Your subscription will be canceled on': 'Your subscription will be canceled on',
        'Current Period': 'Current Period',
        'Cancel Plan': 'Cancel Plan',
        'Payment Method': 'Payment Method',
        'Card on file': 'Card on file',
        'Managed by Stripe': 'Managed by Stripe',
        'Billing History': 'Billing History',
        'No billing history available': 'No billing history available',
        'Paid': 'Paid',
        'Pending': 'Pending',
        'Download': 'Download',
        'View All Invoices': 'View All Invoices',
        'Are you sure you want to cancel your plan?': 'Are you sure you want to cancel your plan?',
        'Your subscription will remain active until': 'Your subscription will remain active until',
        'After that, you will lose access to premium features.': 'After that, you will lose access to premium features.',
        'Keep Plan': 'Keep Plan'
      };
      return translations[key] || key;
    }
  })
}));

describe('BillingTab', () => {
  const mockSubscription = {
    plan_type: 'premium',
    price_chf: 99.00,
    status: 'active',
    cancel_at_period_end: false,
    current_period_start: '2024-01-01T00:00:00Z',
    current_period_end: '2024-12-31T23:59:59Z',
    stripe_customer_id: 'cus_123456'
  };

  const mockInvoices = [
    {
      id: 'inv_1',
      created_at: '2024-01-01T00:00:00Z',
      description: 'Annual Premium Subscription',
      amount_chf: 99.00,
      status: 'succeeded',
      card_brand: 'visa',
      card_last4: '4242'
    },
    {
      id: 'inv_2',
      created_at: '2023-01-01T00:00:00Z',
      description: 'Annual Premium Subscription',
      amount_chf: 99.00,
      status: 'succeeded',
      card_brand: 'mastercard',
      card_last4: '1234'
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    subscriptionService.formatDate = jest.fn((date) => new Date(date).toLocaleDateString());
  });

  // ========================================================================
  // LOADING STATE
  // ========================================================================

  it('should show loading spinner initially', () => {
    subscriptionService.getCurrentSubscription.mockImplementation(() => new Promise(() => {}));
    subscriptionService.getInvoices.mockImplementation(() => new Promise(() => {}));

    render(<BillingTab />);

    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  // ========================================================================
  // ERROR HANDLING
  // ========================================================================

  it('should display error message when fetching fails', async () => {
    subscriptionService.getCurrentSubscription.mockRejectedValue(new Error('Network error'));
    subscriptionService.getInvoices.mockRejectedValue(new Error('Network error'));

    render(<BillingTab />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load billing information')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // BUG FIX TEST: Data extraction from service response
  // ========================================================================

  it('should correctly extract subscription data from service response wrapper', async () => {
    // This is the bug we fixed - service returns {success: true, data: {...}}
    // but we were setting the whole response instead of extracting .data
    subscriptionService.getCurrentSubscription.mockResolvedValue({
      success: true,
      data: mockSubscription
    });
    subscriptionService.getInvoices.mockResolvedValue({
      success: true,
      data: mockInvoices
    });

    render(<BillingTab />);

    await waitFor(() => {
      expect(screen.getByText('Current Plan')).toBeInTheDocument();
      expect(screen.getByText('premium')).toBeInTheDocument();
    });
  });

  it('should handle null data in service response', async () => {
    subscriptionService.getCurrentSubscription.mockResolvedValue({
      success: true,
      data: null
    });
    subscriptionService.getInvoices.mockResolvedValue({
      success: true,
      data: null
    });

    render(<BillingTab />);

    await waitFor(() => {
      expect(screen.getByText('You do not have an active subscription')).toBeInTheDocument();
    });
  });

  it('should handle undefined data in service response', async () => {
    subscriptionService.getCurrentSubscription.mockResolvedValue({
      success: true,
      data: undefined
    });
    subscriptionService.getInvoices.mockResolvedValue({
      success: true,
      data: undefined
    });

    render(<BillingTab />);

    await waitFor(() => {
      expect(screen.getByText('You do not have an active subscription')).toBeInTheDocument();
    });
  });

  it('should handle missing data property in response', async () => {
    // Service returns {success: true} without data property
    subscriptionService.getCurrentSubscription.mockResolvedValue({
      success: true
    });
    subscriptionService.getInvoices.mockResolvedValue({
      success: true
    });

    render(<BillingTab />);

    await waitFor(() => {
      expect(screen.getByText('You do not have an active subscription')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // NO SUBSCRIPTION STATE
  // ========================================================================

  it('should show no subscription message when user has no subscription', async () => {
    subscriptionService.getCurrentSubscription.mockResolvedValue({
      success: true,
      data: null
    });
    subscriptionService.getInvoices.mockResolvedValue({
      success: true,
      data: []
    });

    render(<BillingTab />);

    await waitFor(() => {
      expect(screen.getByText('You do not have an active subscription')).toBeInTheDocument();
      expect(screen.getByText('Subscribe to SwissAI Tax to access premium features and file your Swiss taxes easily.')).toBeInTheDocument();
      expect(screen.getByText('View Plans')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // ACTIVE SUBSCRIPTION DISPLAY
  // ========================================================================

  it('should display active subscription details correctly', async () => {
    subscriptionService.getCurrentSubscription.mockResolvedValue({
      success: true,
      data: mockSubscription
    });
    subscriptionService.getInvoices.mockResolvedValue({
      success: true,
      data: mockInvoices
    });

    render(<BillingTab />);

    await waitFor(() => {
      expect(screen.getByText('Current Plan')).toBeInTheDocument();
      expect(screen.getByText('premium')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
      expect(screen.getByText(/Current Period/)).toBeInTheDocument();
    });
  });

  it('should show canceling status when subscription is set to cancel', async () => {
    const cancelingSubscription = {
      ...mockSubscription,
      cancel_at_period_end: true
    };

    subscriptionService.getCurrentSubscription.mockResolvedValue({
      success: true,
      data: cancelingSubscription
    });
    subscriptionService.getInvoices.mockResolvedValue({
      success: true,
      data: []
    });

    render(<BillingTab />);

    await waitFor(() => {
      expect(screen.getByText('Canceling')).toBeInTheDocument();
      expect(screen.getByText(/Your subscription will be canceled on/)).toBeInTheDocument();
    });
  });

  it('should show inactive status for inactive subscription', async () => {
    const inactiveSubscription = {
      ...mockSubscription,
      status: 'inactive'
    };

    subscriptionService.getCurrentSubscription.mockResolvedValue({
      success: true,
      data: inactiveSubscription
    });
    subscriptionService.getInvoices.mockResolvedValue({
      success: true,
      data: []
    });

    render(<BillingTab />);

    await waitFor(() => {
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // PAYMENT METHOD
  // ========================================================================

  it('should display payment method section when stripe customer exists', async () => {
    subscriptionService.getCurrentSubscription.mockResolvedValue({
      success: true,
      data: mockSubscription
    });
    subscriptionService.getInvoices.mockResolvedValue({
      success: true,
      data: []
    });

    render(<BillingTab />);

    await waitFor(() => {
      expect(screen.getByText('Payment Method')).toBeInTheDocument();
      expect(screen.getByText('Card on file')).toBeInTheDocument();
      expect(screen.getByText('Managed by Stripe')).toBeInTheDocument();
    });
  });

  it('should not display payment method when no stripe customer', async () => {
    const subscriptionWithoutStripe = {
      ...mockSubscription,
      stripe_customer_id: null
    };

    subscriptionService.getCurrentSubscription.mockResolvedValue({
      success: true,
      data: subscriptionWithoutStripe
    });
    subscriptionService.getInvoices.mockResolvedValue({
      success: true,
      data: []
    });

    render(<BillingTab />);

    await waitFor(() => {
      expect(screen.queryByText('Payment Method')).not.toBeInTheDocument();
    });
  });

  // ========================================================================
  // BILLING HISTORY / INVOICES
  // ========================================================================

  it('should display invoice list correctly', async () => {
    subscriptionService.getCurrentSubscription.mockResolvedValue({
      success: true,
      data: mockSubscription
    });
    subscriptionService.getInvoices.mockResolvedValue({
      success: true,
      data: mockInvoices
    });

    render(<BillingTab />);

    await waitFor(() => {
      expect(screen.getByText('Billing History')).toBeInTheDocument();
      expect(screen.getAllByText('Paid')).toHaveLength(2);
      expect(screen.getByText('visa •••• 4242')).toBeInTheDocument();
      expect(screen.getByText('mastercard •••• 1234')).toBeInTheDocument();
    });
  });

  it('should show no billing history message when invoices array is empty', async () => {
    subscriptionService.getCurrentSubscription.mockResolvedValue({
      success: true,
      data: mockSubscription
    });
    subscriptionService.getInvoices.mockResolvedValue({
      success: true,
      data: []
    });

    render(<BillingTab />);

    await waitFor(() => {
      expect(screen.getByText('No billing history available')).toBeInTheDocument();
    });
  });

  it('should handle invoices without card information', async () => {
    const invoiceWithoutCard = {
      id: 'inv_3',
      created_at: '2024-01-01T00:00:00Z',
      description: 'Test Invoice',
      amount_chf: 50.00,
      status: 'succeeded'
      // No card_brand or card_last4
    };

    subscriptionService.getCurrentSubscription.mockResolvedValue({
      success: true,
      data: mockSubscription
    });
    subscriptionService.getInvoices.mockResolvedValue({
      success: true,
      data: [invoiceWithoutCard]
    });

    render(<BillingTab />);

    await waitFor(() => {
      expect(screen.getByText('Test Invoice')).toBeInTheDocument();
      expect(screen.queryByText(/visa/)).not.toBeInTheDocument();
    });
  });

  it('should display pending invoice status correctly', async () => {
    const pendingInvoice = {
      ...mockInvoices[0],
      status: 'pending'
    };

    subscriptionService.getCurrentSubscription.mockResolvedValue({
      success: true,
      data: mockSubscription
    });
    subscriptionService.getInvoices.mockResolvedValue({
      success: true,
      data: [pendingInvoice]
    });

    render(<BillingTab />);

    await waitFor(() => {
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // CANCEL SUBSCRIPTION FLOW
  // ========================================================================

  it('should show cancel plan button for active subscription', async () => {
    subscriptionService.getCurrentSubscription.mockResolvedValue({
      success: true,
      data: mockSubscription
    });
    subscriptionService.getInvoices.mockResolvedValue({
      success: true,
      data: []
    });

    render(<BillingTab />);

    await waitFor(() => {
      const cancelButtons = screen.getAllByText('Cancel Plan');
      expect(cancelButtons.length).toBeGreaterThan(0);
    });
  });

  it('should not show cancel plan button when subscription is already canceling', async () => {
    const cancelingSubscription = {
      ...mockSubscription,
      cancel_at_period_end: true
    };

    subscriptionService.getCurrentSubscription.mockResolvedValue({
      success: true,
      data: cancelingSubscription
    });
    subscriptionService.getInvoices.mockResolvedValue({
      success: true,
      data: []
    });

    render(<BillingTab />);

    await waitFor(() => {
      // Should have the dialog title "Cancel Plan" but not the button
      const buttons = screen.queryAllByRole('button', { name: 'Cancel Plan' });
      expect(buttons).toHaveLength(0);
    });
  });

  it('should open cancel dialog when cancel button is clicked', async () => {
    subscriptionService.getCurrentSubscription.mockResolvedValue({
      success: true,
      data: mockSubscription
    });
    subscriptionService.getInvoices.mockResolvedValue({
      success: true,
      data: []
    });

    render(<BillingTab />);

    await waitFor(() => {
      expect(screen.getByText('Current Plan')).toBeInTheDocument();
    });

    const cancelButton = screen.getAllByText('Cancel Plan')[0];
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText('Are you sure you want to cancel your plan?')).toBeInTheDocument();
      expect(screen.getByText('Keep Plan')).toBeInTheDocument();
    });
  });

  it('should close cancel dialog when keep plan is clicked', async () => {
    subscriptionService.getCurrentSubscription.mockResolvedValue({
      success: true,
      data: mockSubscription
    });
    subscriptionService.getInvoices.mockResolvedValue({
      success: true,
      data: []
    });

    render(<BillingTab />);

    await waitFor(() => {
      expect(screen.getByText('Current Plan')).toBeInTheDocument();
    });

    // Open dialog
    const cancelButton = screen.getAllByText('Cancel Plan')[0];
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText('Keep Plan')).toBeInTheDocument();
    });

    // Click keep plan
    const keepPlanButton = screen.getByText('Keep Plan');
    fireEvent.click(keepPlanButton);

    await waitFor(() => {
      expect(screen.queryByText('Are you sure you want to cancel your plan?')).not.toBeInTheDocument();
    });
  });

  it.skip('should cancel subscription successfully', async () => {
    jest.setTimeout(10000);
    const updatedSubscription = {
      ...mockSubscription,
      cancel_at_period_end: true
    };

    subscriptionService.getCurrentSubscription
      .mockResolvedValueOnce({
        success: true,
        data: mockSubscription
      })
      .mockResolvedValueOnce({
        success: true,
        data: updatedSubscription
      });
    subscriptionService.getInvoices
      .mockResolvedValueOnce({
        success: true,
        data: []
      })
      .mockResolvedValueOnce({
        success: true,
        data: []
      });
    subscriptionService.cancelSubscription.mockResolvedValue({
      success: true
    });

    render(<BillingTab />);

    await waitFor(() => {
      expect(screen.getByText('Current Plan')).toBeInTheDocument();
    });

    // Open cancel dialog
    const cancelButton = screen.getAllByText('Cancel Plan')[0];
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText('Are you sure you want to cancel your plan?')).toBeInTheDocument();
    });

    // Confirm cancellation
    const confirmButtons = screen.getAllByText('Cancel Plan');
    // The second "Cancel Plan" button is the confirm button in the dialog
    const confirmButton = confirmButtons[1];

    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(subscriptionService.cancelSubscription).toHaveBeenCalledWith('User requested cancellation from billing page');
    });

    await waitFor(() => {
      expect(screen.getByText('Canceling')).toBeInTheDocument();
    });
  });

  it.skip('should handle cancel subscription error', async () => {
    jest.setTimeout(10000);
    subscriptionService.getCurrentSubscription.mockResolvedValue({
      success: true,
      data: mockSubscription
    });
    subscriptionService.getInvoices.mockResolvedValue({
      success: true,
      data: []
    });
    subscriptionService.cancelSubscription.mockRejectedValue(new Error('Failed to cancel'));

    render(<BillingTab />);

    await waitFor(() => {
      expect(screen.getByText('Current Plan')).toBeInTheDocument();
    });

    // Open and confirm cancel
    const cancelButton = screen.getAllByText('Cancel Plan')[0];
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.getByText('Are you sure you want to cancel your plan?')).toBeInTheDocument();
    });

    const confirmButtons = screen.getAllByText('Cancel Plan');
    // The second "Cancel Plan" button is the confirm button in the dialog
    const confirmButton = confirmButtons[1];

    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to cancel subscription')).toBeInTheDocument();
    });
  });

  // ========================================================================
  // CURRENCY FORMATTING
  // ========================================================================

  it('should format currency correctly', async () => {
    subscriptionService.getCurrentSubscription.mockResolvedValue({
      success: true,
      data: mockSubscription
    });
    subscriptionService.getInvoices.mockResolvedValue({
      success: true,
      data: mockInvoices
    });

    render(<BillingTab />);

    await waitFor(() => {
      // Should format as Swiss Francs
      const amountElements = screen.getAllByText(/CHF/);
      expect(amountElements.length).toBeGreaterThan(0);
    });
  });

  // ========================================================================
  // DOWNLOAD INVOICE (Currently disabled)
  // ========================================================================

  it('should have download invoice buttons that are disabled', async () => {
    subscriptionService.getCurrentSubscription.mockResolvedValue({
      success: true,
      data: mockSubscription
    });
    subscriptionService.getInvoices.mockResolvedValue({
      success: true,
      data: mockInvoices
    });

    render(<BillingTab />);

    await waitFor(() => {
      const downloadButtons = screen.getAllByText('Download');
      downloadButtons.forEach(button => {
        expect(button).toBeDisabled();
      });
    });
  });
});
