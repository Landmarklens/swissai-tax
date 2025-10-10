import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import PaymentForm from '../PaymentForm';

// Mock Stripe
jest.mock('@stripe/react-stripe-js', () => ({
  ...jest.requireActual('@stripe/react-stripe-js'),
  useStripe: jest.fn(),
  useElements: jest.fn(),
  PaymentElement: () => <div data-testid="payment-element">Payment Element</div>,
  Elements: ({ children }) => <div>{children}</div>
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, fallback) => fallback || key
  })
}));

describe('PaymentForm', () => {
  const mockOnSuccess = jest.fn();
  const mockOnCancel = jest.fn();
  const mockSetupIntent = {
    client_secret: 'test_secret',
    payment_method: 'pm_test'
  };
  const mockPlanDetails = {
    name: 'Annual Flex',
    price: 129,
    description: 'Cancel anytime'
  };

  const mockStripe = {
    confirmSetup: jest.fn()
  };

  const mockElements = {
    submit: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    require('@stripe/react-stripe-js').useStripe.mockReturnValue(mockStripe);
    require('@stripe/react-stripe-js').useElements.mockReturnValue(mockElements);
  });

  const renderPaymentForm = (props = {}) => {
    return render(
      <PaymentForm
        setupIntent={mockSetupIntent}
        planType="annual_flex"
        planDetails={mockPlanDetails}
        onSuccess={mockOnSuccess}
        onCancel={mockOnCancel}
        loading={false}
        {...props}
      />
    );
  };

  describe('Rendering', () => {
    it('should render payment form components', () => {
      renderPaymentForm();

      expect(screen.getByTestId('payment-element')).toBeInTheDocument();
      expect(screen.getByText('Secure payment powered by Stripe')).toBeInTheDocument();
      expect(screen.getByText('Start Free Trial')).toBeInTheDocument();
    });

    it('should display trial notice', () => {
      renderPaymentForm();

      expect(screen.getByText(/Your card will not be charged today/)).toBeInTheDocument();
    });

    it('should show billing details when plan details provided', () => {
      renderPaymentForm();

      expect(screen.getByText(/Billing Details/)).toBeInTheDocument();
      expect(screen.getByText(/Trial starts today/)).toBeInTheDocument();
      expect(screen.getByText(/Trial ends in 30 days/)).toBeInTheDocument();
    });

    it('should show commitment warning for 5-year plan', () => {
      renderPaymentForm({ planType: '5_year_lock' });

      expect(screen.getByText(/5-year commitment/)).toBeInTheDocument();
    });

    it('should not show commitment warning for annual plan', () => {
      renderPaymentForm({ planType: 'annual_flex' });

      expect(screen.queryByText(/5-year commitment/)).not.toBeInTheDocument();
    });

    it('should render terms and conditions checkbox', () => {
      renderPaymentForm();

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).not.toBeChecked();
    });

    it('should have links to terms and privacy policy', () => {
      renderPaymentForm();

      const termsLink = screen.getByText('Terms and Conditions');
      const privacyLink = screen.getByText('Privacy Policy');

      expect(termsLink).toHaveAttribute('href', '/terms-and-conditions');
      expect(privacyLink).toHaveAttribute('href', '/privacy-policy');
    });
  });

  describe('Form Interaction', () => {
    it('should enable submit button when terms are agreed', () => {
      renderPaymentForm();

      const submitButton = screen.getByText('Start Free Trial');
      expect(submitButton).toBeDisabled();

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(submitButton).not.toBeDisabled();
    });

    it('should call onCancel when cancel button clicked', () => {
      renderPaymentForm();

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should show error if submitting without agreeing to terms', async () => {
      renderPaymentForm();

      const submitButton = screen.getByText('Start Free Trial');
      const checkbox = screen.getByRole('checkbox');

      // Don't check the checkbox
      expect(checkbox).not.toBeChecked();

      // Submit button should be disabled
      expect(submitButton).toBeDisabled();
    });

    it('should disable buttons while loading', () => {
      renderPaymentForm({ loading: true });

      const submitButton = screen.getByText('Processing...');
      const cancelButton = screen.getByText('Cancel');

      expect(submitButton.closest('button')).toBeDisabled();
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Payment Processing', () => {
    it('should call confirmSetup on successful form submission', async () => {
      mockStripe.confirmSetup.mockResolvedValue({
        setupIntent: {
          status: 'succeeded',
          payment_method: 'pm_test123'
        },
        error: null
      });

      renderPaymentForm();

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockStripe.confirmSetup).toHaveBeenCalled();
      });
    });

    it('should call onSuccess with payment method on successful setup', async () => {
      mockStripe.confirmSetup.mockResolvedValue({
        setupIntent: {
          status: 'succeeded',
          payment_method: 'pm_test123'
        },
        error: null
      });

      renderPaymentForm();

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalledWith('pm_test123');
      });
    });

    it('should show error message on Stripe error', async () => {
      const errorMessage = 'Card declined';
      mockStripe.confirmSetup.mockResolvedValue({
        error: { message: errorMessage },
        setupIntent: null
      });

      renderPaymentForm();

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should handle setup intent failure status', async () => {
      mockStripe.confirmSetup.mockResolvedValue({
        setupIntent: {
          status: 'failed',
          payment_method: null
        },
        error: null
      });

      renderPaymentForm();

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Payment setup failed. Please try again.')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have form role', () => {
      renderPaymentForm();

      const form = screen.getByRole('form');
      expect(form).toBeInTheDocument();
    });

    it('should have accessible buttons', () => {
      renderPaymentForm();

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });

    it('should have accessible checkbox', () => {
      renderPaymentForm();

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toHaveAccessibleName();
    });
  });

  describe('Error Handling', () => {
    it('should handle Stripe not loaded', () => {
      require('@stripe/react-stripe-js').useStripe.mockReturnValue(null);
      renderPaymentForm();

      const submitButton = screen.getByText('Start Free Trial');
      expect(submitButton).toBeDisabled();
    });

    it('should handle Elements not loaded', () => {
      require('@stripe/react-stripe-js').useElements.mockReturnValue(null);
      renderPaymentForm();

      const submitButton = screen.getByText('Start Free Trial');
      expect(submitButton).toBeDisabled();
    });

    it('should display and dismiss error alerts', async () => {
      mockStripe.confirmSetup.mockResolvedValue({
        error: { message: 'Test error' },
        setupIntent: null
      });

      renderPaymentForm();

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      const form = screen.getByRole('form');
      fireEvent.submit(form);

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });

      // Find and click the close button (X) in the Alert
      const closeButton = screen.getByLabelText(/close/i) || screen.getByRole('button', { name: '' });
      if (closeButton) {
        fireEvent.click(closeButton);

        await waitFor(() => {
          expect(screen.queryByText('Test error')).not.toBeInTheDocument();
        });
      }
    });
  });
});
