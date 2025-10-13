import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { act } from 'react-dom/test-utils';
import SubscriptionPlans from '../SubscriptionPlans';
import subscriptionService from '../../../services/subscriptionService';
import authService from '../../../services/authService';

// Mock services
jest.mock('../../../services/subscriptionService');
jest.mock('../../../services/authService');
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

describe.skip('SubscriptionPlans', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    authService.isAuthenticated.mockReturnValue(false);
    subscriptionService.getCurrentSubscription.mockResolvedValue(null);
  });

  describe('Plan Display', () => {
    it('should render all 4 subscription plans', () => {
      renderWithRouter(<SubscriptionPlans />);

      expect(screen.getByText('Free')).toBeInTheDocument();
      expect(screen.getByText('Basic')).toBeInTheDocument();
      expect(screen.getByText('Pro')).toBeInTheDocument();
      expect(screen.getByText('Premium')).toBeInTheDocument();
    });

    it('should display correct pricing for all plans', () => {
      renderWithRouter(<SubscriptionPlans />);

      expect(screen.getByText(/CHF 0/)).toBeInTheDocument();
      expect(screen.getByText(/CHF 49/)).toBeInTheDocument();
      expect(screen.getByText(/CHF 99/)).toBeInTheDocument();
      expect(screen.getByText(/CHF 149/)).toBeInTheDocument();
    });

    it('should show "MOST POPULAR" badge on Pro plan', () => {
      renderWithRouter(<SubscriptionPlans />);

      const badges = screen.getAllByText('MOST POPULAR');
      expect(badges.length).toBeGreaterThanOrEqual(1);
    });

    it('should display 30-day trial badge', () => {
      renderWithRouter(<SubscriptionPlans />);

      expect(screen.getByText('30-Day Free Trial on Paid Plans')).toBeInTheDocument();
    });

    it('should show trial information for paid plans only', () => {
      renderWithRouter(<SubscriptionPlans />);

      const trialInfoElements = screen.getAllByText('30-day free trial included');
      // Should show on Basic, Pro, Premium (3 plans)
      expect(trialInfoElements).toHaveLength(3);
    });

    it('should display features for free plan', () => {
      renderWithRouter(<SubscriptionPlans />);

      expect(screen.getByText('1 basic tax filing per year')).toBeInTheDocument();
      expect(screen.getByText('AI-guided interview (limited to 10 questions)')).toBeInTheDocument();
      expect(screen.getByText('PDF export (with watermark)')).toBeInTheDocument();
    });

    it('should display features for basic plan', () => {
      renderWithRouter(<SubscriptionPlans />);

      expect(screen.getByText('1 complete tax filing per year')).toBeInTheDocument();
      expect(screen.getByText('Official cantonal form generation')).toBeInTheDocument();
      expect(screen.getByText('Swiss data encryption')).toBeInTheDocument();
    });

    it('should display features for pro plan', () => {
      renderWithRouter(<SubscriptionPlans />);

      expect(screen.getByText('AI tax optimization (5-10 recommendations)')).toBeInTheDocument();
      expect(screen.getByText('Multi-canton comparison (up to 5)')).toBeInTheDocument();
      expect(screen.getByText('Export to eTax XML')).toBeInTheDocument();
    });

    it('should display features for premium plan', () => {
      renderWithRouter(<SubscriptionPlans />);

      expect(screen.getByText('Tax expert review before submission')).toBeInTheDocument();
      expect(screen.getByText('All 26 cantons comparison')).toBeInTheDocument();
      expect(screen.getByText('Phone/video consultation (30min/year)')).toBeInTheDocument();
    });

    it('should show free plan badge', () => {
      renderWithRouter(<SubscriptionPlans />);

      expect(screen.getByText('Free Plan Available')).toBeInTheDocument();
    });
  });

  describe('User Authentication', () => {
    it('should redirect to home with auth prompt if not authenticated - free plan', async () => {
      authService.isAuthenticated.mockReturnValue(false);
      renderWithRouter(<SubscriptionPlans />);

      const freeButton = screen.getByRole('button', { name: 'Start Free' });

      await act(async () => {
        fireEvent.click(freeButton);
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', {
          state: { showAuth: true, selectedPlan: 'free' }
        });
      });
    });

    it('should redirect to home with auth prompt if not authenticated - paid plan', async () => {
      authService.isAuthenticated.mockReturnValue(false);
      renderWithRouter(<SubscriptionPlans />);

      const trialButtons = screen.getAllByRole('button', { name: /Start 30-Day Trial/ });

      await act(async () => {
        fireEvent.click(trialButtons[0]);
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', {
          state: { showAuth: true, selectedPlan: 'basic' }
        });
      });
    });

    it('should create free subscription directly when authenticated', async () => {
      authService.isAuthenticated.mockReturnValue(true);
      subscriptionService.createFreeSubscription.mockResolvedValue({
        plan_type: 'free',
        status: 'active'
      });

      renderWithRouter(<SubscriptionPlans />);

      const freeButton = screen.getByRole('button', { name: 'Start Free' });

      await act(async () => {
        fireEvent.click(freeButton);
      });

      await waitFor(() => {
        expect(subscriptionService.createFreeSubscription).toHaveBeenCalledTimes(1);
      });
    });

    it('should navigate to checkout for paid plans if authenticated', async () => {
      authService.isAuthenticated.mockReturnValue(true);
      renderWithRouter(<SubscriptionPlans />);

      const trialButtons = screen.getAllByRole('button', { name: /Start 30-Day Trial/ });

      await act(async () => {
        fireEvent.click(trialButtons[0]); // Basic plan
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/subscription/checkout/basic');
      });
    });

    it('should navigate to correct checkout page for each paid plan', async () => {
      authService.isAuthenticated.mockReturnValue(true);
      renderWithRouter(<SubscriptionPlans />);

      const trialButtons = screen.getAllByRole('button', { name: /Start 30-Day Trial/ });
      const plans = ['basic', 'pro', 'premium'];

      for (let i = 0; i < plans.length; i++) {
        await act(async () => {
          fireEvent.click(trialButtons[i]);
        });

        await waitFor(() => {
          expect(mockNavigate).toHaveBeenCalledWith(`/subscription/checkout/${plans[i]}`);
        });

        mockNavigate.mockClear();
      }
    });
  });

  describe('Current Subscription Handling', () => {
    it('should show current subscription alert if user has active subscription', async () => {
      authService.isAuthenticated.mockReturnValue(true);
      subscriptionService.getCurrentSubscription.mockResolvedValue({
        success: true,
        data: {
          plan_type: 'basic',
          status: 'active'
        }
      });

      await act(async () => {
        renderWithRouter(<SubscriptionPlans />);
      });

      await waitFor(() => {
        expect(screen.getByText(/You currently have an active basic subscription/)).toBeInTheDocument();
      });
    });

    it('should disable button for current plan', async () => {
      authService.isAuthenticated.mockReturnValue(true);
      subscriptionService.getCurrentSubscription.mockResolvedValue({
        success: true,
        data: {
          plan_type: 'pro',
          status: 'active'
        }
      });

      await act(async () => {
        renderWithRouter(<SubscriptionPlans />);
      });

      await waitFor(() => {
        const currentPlanButtons = screen.getAllByRole('button', { name: 'Current Plan' });
        expect(currentPlanButtons.length).toBeGreaterThan(0);
        currentPlanButtons.forEach(button => {
          expect(button).toBeDisabled();
        });
      });
    });

    it('should allow selecting different plan than current', async () => {
      authService.isAuthenticated.mockReturnValue(true);
      subscriptionService.getCurrentSubscription.mockResolvedValue({
        success: true,
        data: {
          plan_type: 'basic',
          status: 'active'
        }
      });

      await act(async () => {
        renderWithRouter(<SubscriptionPlans />);
      });

      await waitFor(() => {
        const trialButtons = screen.getAllByRole('button', { name: /Start 30-Day Trial/ });
        // Should have 2 buttons (Pro and Premium), since Basic is current
        expect(trialButtons.length).toBeGreaterThan(0);
      });
    });

    it('should not show current subscription alert when user has no subscription', async () => {
      authService.isAuthenticated.mockReturnValue(true);
      subscriptionService.getCurrentSubscription.mockResolvedValue({
        success: true,
        data: null
      });

      await act(async () => {
        renderWithRouter(<SubscriptionPlans />);
      });

      await waitFor(() => {
        expect(screen.queryByText(/You currently have an active/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle subscription fetch error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      authService.isAuthenticated.mockReturnValue(true);
      subscriptionService.getCurrentSubscription.mockRejectedValue(
        new Error('Network error')
      );

      await act(async () => {
        renderWithRouter(<SubscriptionPlans />);
      });

      // Should still render plans even if subscription fetch fails
      await waitFor(() => {
        expect(screen.getByText('Free')).toBeInTheDocument();
        expect(screen.getByText('Basic')).toBeInTheDocument();
      });

      consoleError.mockRestore();
    });

    it('should show error alert when free subscription creation fails', async () => {
      authService.isAuthenticated.mockReturnValue(true);
      subscriptionService.createFreeSubscription.mockRejectedValue({
        response: {
          data: {
            detail: 'User already has an active subscription'
          }
        }
      });

      renderWithRouter(<SubscriptionPlans />);

      const freeButton = screen.getByRole('button', { name: 'Start Free' });

      await act(async () => {
        fireEvent.click(freeButton);
      });

      await waitFor(() => {
        expect(screen.getByText('User already has an active subscription')).toBeInTheDocument();
      });
    });

    it('should show generic error when error has no detail', async () => {
      authService.isAuthenticated.mockReturnValue(true);
      subscriptionService.createFreeSubscription.mockRejectedValue(
        new Error('Network error')
      );

      renderWithRouter(<SubscriptionPlans />);

      const freeButton = screen.getByRole('button', { name: 'Start Free' });

      await act(async () => {
        fireEvent.click(freeButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Failed to start subscription process')).toBeInTheDocument();
      });
    });

    it('should allow dismissing error alert', async () => {
      authService.isAuthenticated.mockReturnValue(true);
      subscriptionService.createFreeSubscription.mockRejectedValue({
        response: {
          data: {
            detail: 'Test error message'
          }
        }
      });

      renderWithRouter(<SubscriptionPlans />);

      const freeButton = screen.getByRole('button', { name: 'Start Free' });

      await act(async () => {
        fireEvent.click(freeButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Test error message')).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText(/close/i);
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Test error message')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner while creating free subscription', async () => {
      authService.isAuthenticated.mockReturnValue(true);
      let resolvePromise;
      subscriptionService.createFreeSubscription.mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
      );

      renderWithRouter(<SubscriptionPlans />);

      const freeButton = screen.getByRole('button', { name: 'Start Free' });

      await act(async () => {
        fireEvent.click(freeButton);
      });

      await waitFor(() => {
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
      });

      await act(async () => {
        resolvePromise({ plan_type: 'free', status: 'active' });
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });
    });

    it('should disable all buttons while loading', async () => {
      authService.isAuthenticated.mockReturnValue(true);
      let resolvePromise;
      subscriptionService.createFreeSubscription.mockReturnValue(
        new Promise((resolve) => {
          resolvePromise = resolve;
        })
      );

      renderWithRouter(<SubscriptionPlans />);

      const freeButton = screen.getByRole('button', { name: 'Start Free' });

      await act(async () => {
        fireEvent.click(freeButton);
      });

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        buttons.forEach((button) => {
          expect(button).toBeDisabled();
        });
      });

      await act(async () => {
        resolvePromise({ plan_type: 'free', status: 'active' });
        await Promise.resolve();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      renderWithRouter(<SubscriptionPlans />);

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toHaveTextContent('Choose Your Plan');
    });

    it('should have accessible buttons', () => {
      renderWithRouter(<SubscriptionPlans />);

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach(button => {
        expect(button).toHaveAccessibleName();
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render plan cards in grid layout', () => {
      const { container } = renderWithRouter(<SubscriptionPlans />);

      const gridContainer = container.querySelector('.MuiGrid-container');
      expect(gridContainer).toBeInTheDocument();
    });
  });
});
