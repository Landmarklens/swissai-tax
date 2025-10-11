/**
 * Unit tests for PromotionalCodeCreator component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import PromotionalCodeCreator from './PromotionalCodeCreator';
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

// Mock DateTimePicker
jest.mock('@mui/x-date-pickers/DateTimePicker', () => ({
  DateTimePicker: ({ label, value, onChange }) => (
    <div>
      <label>{label}</label>
      <input
        data-testid={`date-picker-${label}`}
        type="datetime-local"
        value={value ? value.toISOString().slice(0, 16) : ''}
        onChange={(e) => onChange(new Date(e.target.value))}
      />
    </div>
  )
}));

jest.mock('@mui/x-date-pickers/LocalizationProvider', () => ({
  LocalizationProvider: ({ children }) => <div>{children}</div>
}));

jest.mock('@mui/x-date-pickers/AdapterDateFns', () => ({
  AdapterDateFns: jest.fn()
}));

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(
    <ThemeProvider theme={theme}>
      {component}
    </ThemeProvider>
  );
};

describe('PromotionalCodeCreator', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    referralService.createPromotionalCode.mockResolvedValue({
      success: true,
      data: {
        referral_code: 'TESTCODE',
        id: 1
      }
    });
  });

  describe('Page Rendering', () => {
    it('should render page with header and footer', () => {
      renderWithTheme(<PromotionalCodeCreator />);

      expect(screen.getByTestId('header')).toBeInTheDocument();
      expect(screen.getByTestId('footer')).toBeInTheDocument();
      expect(screen.getAllByText('Create Promotional Code').length).toBeGreaterThan(0);
      expect(screen.getByText('Create discount codes for marketing campaigns and promotions')).toBeInTheDocument();
    });

    it('should render all form sections', () => {
      renderWithTheme(<PromotionalCodeCreator />);

      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      expect(screen.getByText('Discount Configuration')).toBeInTheDocument();
      expect(screen.getByText('Applicability')).toBeInTheDocument();
      expect(screen.getByText('Usage Limits')).toBeInTheDocument();
      expect(screen.getByText('Validity Period')).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('should render code input field', () => {
      renderWithTheme(<PromotionalCodeCreator />);

      const codeInput = screen.getByPlaceholderText('SPRING2024');
      expect(codeInput).toBeInTheDocument();
      expect(codeInput).toHaveValue('');
    });

    it('should render code type select with default value', () => {
      renderWithTheme(<PromotionalCodeCreator />);

      // The select will have promotional as default - check that Code Type label exists
      expect(screen.getAllByText('Code Type').length).toBeGreaterThan(0);
      expect(screen.getByText('Promotional')).toBeInTheDocument();
    });

    it('should render discount type select', () => {
      renderWithTheme(<PromotionalCodeCreator />);

      expect(screen.getByText('Discount Type')).toBeInTheDocument();
    });

    it('should render campaign name field', () => {
      renderWithTheme(<PromotionalCodeCreator />);

      expect(screen.getByLabelText(/Campaign Name/)).toBeInTheDocument();
    });

    it('should render all switches', () => {
      renderWithTheme(<PromotionalCodeCreator />);

      expect(screen.getByText('First-time subscribers only')).toBeInTheDocument();
      expect(screen.getByText('Stackable with other codes')).toBeInTheDocument();
      expect(screen.getByText('Active (users can use this code immediately)')).toBeInTheDocument();
    });

    it('should render submit button', () => {
      renderWithTheme(<PromotionalCodeCreator />);

      expect(screen.getByRole('button', { name: /Create Promotional Code/i })).toBeInTheDocument();
    });
  });

  describe('Form Input Changes', () => {
    it('should update code field on input', () => {
      renderWithTheme(<PromotionalCodeCreator />);

      const codeInput = screen.getByPlaceholderText('SPRING2024');
      fireEvent.change(codeInput, { target: { value: 'NEWCODE' } });

      expect(codeInput).toHaveValue('NEWCODE');
    });

    it('should update discount value field', () => {
      renderWithTheme(<PromotionalCodeCreator />);

      const discountInput = screen.getByRole('spinbutton', { name: /Discount Percentage/i });
      fireEvent.change(discountInput, { target: { value: '15' } });

      expect(discountInput).toHaveValue(15);
    });

    it('should update campaign name field', () => {
      renderWithTheme(<PromotionalCodeCreator />);

      const campaignInput = screen.getByLabelText(/Campaign Name/);
      fireEvent.change(campaignInput, { target: { value: 'Spring Campaign' } });

      expect(campaignInput).toHaveValue('Spring Campaign');
    });

    it('should toggle switches', () => {
      renderWithTheme(<PromotionalCodeCreator />);

      const firstTimeSwitch = screen.getByRole('checkbox', { name: /First-time subscribers only/ });
      expect(firstTimeSwitch).toBeChecked();

      fireEvent.click(firstTimeSwitch);
      expect(firstTimeSwitch).not.toBeChecked();
    });

    it('should update max discount amount', () => {
      renderWithTheme(<PromotionalCodeCreator />);

      const maxDiscountInput = screen.getByLabelText(/Max Discount Amount/);
      fireEvent.change(maxDiscountInput, { target: { value: '50' } });

      expect(maxDiscountInput).toHaveValue(50);
    });
  });

  describe('Form Validation', () => {
    it('should show error when code is empty', async () => {
      renderWithTheme(<PromotionalCodeCreator />);

      const submitButton = screen.getByRole('button', { name: /Create Promotional Code/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Code is required')).toBeInTheDocument();
      });

      expect(referralService.createPromotionalCode).not.toHaveBeenCalled();
    });

    it('should show error when discount value is zero', async () => {
      renderWithTheme(<PromotionalCodeCreator />);

      const codeInput = screen.getByPlaceholderText('SPRING2024');
      fireEvent.change(codeInput, { target: { value: 'TESTCODE' } });

      const discountInput = screen.getByRole('spinbutton', { name: /Discount Percentage/i });
      fireEvent.change(discountInput, { target: { value: '0' } });

      const submitButton = screen.getByRole('button', { name: /Create Promotional Code/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Discount value must be greater than 0')).toBeInTheDocument();
      });

      expect(referralService.createPromotionalCode).not.toHaveBeenCalled();
    });

    it('should show error when discount value is negative', async () => {
      renderWithTheme(<PromotionalCodeCreator />);

      const codeInput = screen.getByPlaceholderText('SPRING2024');
      fireEvent.change(codeInput, { target: { value: 'TESTCODE' } });

      const discountInput = screen.getByRole('spinbutton', { name: /Discount Percentage/i });
      fireEvent.change(discountInput, { target: { value: '-10' } });

      const submitButton = screen.getByRole('button', { name: /Create Promotional Code/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Discount value must be greater than 0')).toBeInTheDocument();
      });
    });

    it('should show error when percentage exceeds 100', async () => {
      renderWithTheme(<PromotionalCodeCreator />);

      const codeInput = screen.getByPlaceholderText('SPRING2024');
      fireEvent.change(codeInput, { target: { value: 'TESTCODE' } });

      const discountInput = screen.getByRole('spinbutton', { name: /Discount Percentage/i });
      fireEvent.change(discountInput, { target: { value: '150' } });

      const submitButton = screen.getByRole('button', { name: /Create Promotional Code/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Percentage discount cannot exceed 100%')).toBeInTheDocument();
      });
    });

    it('should clear error when user fixes input', async () => {
      renderWithTheme(<PromotionalCodeCreator />);

      const submitButton = screen.getByRole('button', { name: /Create Promotional Code/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Code is required')).toBeInTheDocument();
      });

      // Fix the error by entering code
      const codeInput = screen.getByPlaceholderText('SPRING2024');
      fireEvent.change(codeInput, { target: { value: 'TESTCODE' } });

      await waitFor(() => {
        expect(screen.queryByText('Code is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit form with valid data', async () => {
      renderWithTheme(<PromotionalCodeCreator />);

      // Fill in required fields
      const codeInput = screen.getByPlaceholderText('SPRING2024');
      fireEvent.change(codeInput, { target: { value: 'testcode' } });

      const discountInput = screen.getByRole('spinbutton', { name: /Discount Percentage/i });
      fireEvent.change(discountInput, { target: { value: '15' } });

      const submitButton = screen.getByRole('button', { name: /Create Promotional Code/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(referralService.createPromotionalCode).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 'TESTCODE', // Should be uppercase and trimmed
            discount_value: 15,
            discount_type: 'percentage'
          })
        );
      });
    });

    it('should convert code to uppercase on submit', async () => {
      renderWithTheme(<PromotionalCodeCreator />);

      const codeInput = screen.getByPlaceholderText('SPRING2024');
      fireEvent.change(codeInput, { target: { value: 'lowercase' } });

      const discountInput = screen.getByRole('spinbutton', { name: /Discount Percentage/i });
      fireEvent.change(discountInput, { target: { value: '10' } });

      const submitButton = screen.getByRole('button', { name: /Create Promotional Code/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(referralService.createPromotionalCode).toHaveBeenCalledWith(
          expect.objectContaining({
            code: 'LOWERCASE'
          })
        );
      });
    });

    it('should show success message after successful creation', async () => {
      renderWithTheme(<PromotionalCodeCreator />);

      const codeInput = screen.getByPlaceholderText('SPRING2024');
      fireEvent.change(codeInput, { target: { value: 'TESTCODE' } });

      const discountInput = screen.getByRole('spinbutton', { name: /Discount Percentage/i });
      fireEvent.change(discountInput, { target: { value: '10' } });

      const submitButton = screen.getByRole('button', { name: /Create Promotional Code/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Promotional code created successfully!')).toBeInTheDocument();
        expect(screen.getByText('TESTCODE')).toBeInTheDocument();
      });
    });

    it('should reset form after successful creation', async () => {
      renderWithTheme(<PromotionalCodeCreator />);

      const codeInput = screen.getByPlaceholderText('SPRING2024');
      fireEvent.change(codeInput, { target: { value: 'TESTCODE' } });

      const discountInput = screen.getByRole('spinbutton', { name: /Discount Percentage/i });
      fireEvent.change(discountInput, { target: { value: '10' } });

      const submitButton = screen.getByRole('button', { name: /Create Promotional Code/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Promotional code created successfully!')).toBeInTheDocument();
      });

      // Check that form is reset
      expect(codeInput).toHaveValue('');
      expect(discountInput).toHaveValue(null);
    });

    it('should show error message on API failure', async () => {
      referralService.createPromotionalCode.mockResolvedValue({
        success: false,
        error: 'Code already exists'
      });

      renderWithTheme(<PromotionalCodeCreator />);

      const codeInput = screen.getByPlaceholderText('SPRING2024');
      fireEvent.change(codeInput, { target: { value: 'TESTCODE' } });

      const discountInput = screen.getByRole('spinbutton', { name: /Discount Percentage/i });
      fireEvent.change(discountInput, { target: { value: '10' } });

      const submitButton = screen.getByRole('button', { name: /Create Promotional Code/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Code already exists')).toBeInTheDocument();
      });
    });

    it('should handle exception during submission', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      referralService.createPromotionalCode.mockRejectedValue(new Error('Network error'));

      renderWithTheme(<PromotionalCodeCreator />);

      const codeInput = screen.getByPlaceholderText('SPRING2024');
      fireEvent.change(codeInput, { target: { value: 'TESTCODE' } });

      const discountInput = screen.getByRole('spinbutton', { name: /Discount Percentage/i });
      fireEvent.change(discountInput, { target: { value: '10' } });

      const submitButton = screen.getByRole('button', { name: /Create Promotional Code/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('An error occurred while creating the code')).toBeInTheDocument();
      });

      consoleError.mockRestore();
    });

    it('should close error alert when close button is clicked', async () => {
      referralService.createPromotionalCode.mockResolvedValue({
        success: false,
        error: 'Test error'
      });

      renderWithTheme(<PromotionalCodeCreator />);

      const codeInput = screen.getByPlaceholderText('SPRING2024');
      fireEvent.change(codeInput, { target: { value: 'TESTCODE' } });

      const discountInput = screen.getByRole('spinbutton', { name: /Discount Percentage/i });
      fireEvent.change(discountInput, { target: { value: '10' } });

      const submitButton = screen.getByRole('button', { name: /Create Promotional Code/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });

      // Find and click close button
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('Test error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state during submission', async () => {
      let resolveSubmit;
      const submitPromise = new Promise((resolve) => {
        resolveSubmit = resolve;
      });

      referralService.createPromotionalCode.mockReturnValue(submitPromise);

      renderWithTheme(<PromotionalCodeCreator />);

      const codeInput = screen.getByPlaceholderText('SPRING2024');
      fireEvent.change(codeInput, { target: { value: 'TESTCODE' } });

      const discountInput = screen.getByRole('spinbutton', { name: /Discount Percentage/i });
      fireEvent.change(discountInput, { target: { value: '10' } });

      const submitButton = screen.getByRole('button', { name: /Create Promotional Code/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Creating...')).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });

      // Resolve the promise
      resolveSubmit({ success: true, data: { referral_code: 'TESTCODE', id: 1 } });

      await waitFor(() => {
        expect(screen.queryByText('Creating...')).not.toBeInTheDocument();
      });
    });
  });

  describe('API Data Preparation', () => {
    it('should send null for empty optional fields', async () => {
      renderWithTheme(<PromotionalCodeCreator />);

      const codeInput = screen.getByPlaceholderText('SPRING2024');
      fireEvent.change(codeInput, { target: { value: 'TESTCODE' } });

      const discountInput = screen.getByRole('spinbutton', { name: /Discount Percentage/i });
      fireEvent.change(discountInput, { target: { value: '10' } });

      const submitButton = screen.getByRole('button', { name: /Create Promotional Code/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(referralService.createPromotionalCode).toHaveBeenCalledWith(
          expect.objectContaining({
            max_discount_amount: null,
            campaign_name: null,
            description: null,
            internal_notes: null,
            applicable_plans: null
          })
        );
      });
    });

    it('should parse numeric fields correctly', async () => {
      renderWithTheme(<PromotionalCodeCreator />);

      const codeInput = screen.getByPlaceholderText('SPRING2024');
      fireEvent.change(codeInput, { target: { value: 'TESTCODE' } });

      const discountInput = screen.getByRole('spinbutton', { name: /Discount Percentage/i });
      fireEvent.change(discountInput, { target: { value: '15.5' } });

      const maxDiscountInput = screen.getByLabelText(/Max Discount Amount/);
      fireEvent.change(maxDiscountInput, { target: { value: '50.25' } });

      const submitButton = screen.getByRole('button', { name: /Create Promotional Code/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(referralService.createPromotionalCode).toHaveBeenCalledWith(
          expect.objectContaining({
            discount_value: 15.5,
            max_discount_amount: 50.25
          })
        );
      });
    });

    it('should include date fields in ISO format', async () => {
      renderWithTheme(<PromotionalCodeCreator />);

      const codeInput = screen.getByPlaceholderText('SPRING2024');
      fireEvent.change(codeInput, { target: { value: 'TESTCODE' } });

      const discountInput = screen.getByRole('spinbutton', { name: /Discount Percentage/i });
      fireEvent.change(discountInput, { target: { value: '10' } });

      const submitButton = screen.getByRole('button', { name: /Create Promotional Code/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const callArgs = referralService.createPromotionalCode.mock.calls[0][0];
        expect(callArgs.valid_from).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      });
    });
  });

  describe('Discount Type Changes', () => {
    it('should change label based on discount type', async () => {
      renderWithTheme(<PromotionalCodeCreator />);

      // Initially percentage
      await waitFor(() => {
        expect(screen.getByText('Discount Percentage')).toBeInTheDocument();
      });

      // Change to fixed amount - find the select by its current value
      const discountTypeLabel = screen.getByText('Discount Type');
      const discountTypeSelect = discountTypeLabel.parentElement.querySelector('[role="combobox"]');
      fireEvent.mouseDown(discountTypeSelect);

      const fixedAmountOption = await screen.findByText('Fixed Amount (CHF)');
      fireEvent.click(fixedAmountOption);

      await waitFor(() => {
        expect(screen.getByText('Amount (CHF)')).toBeInTheDocument();
      });
    });
  });

  describe('Switch Defaults', () => {
    it('should have correct default switch values', () => {
      renderWithTheme(<PromotionalCodeCreator />);

      const firstTimeSwitch = screen.getByRole('checkbox', { name: /First-time subscribers only/ });
      const stackableSwitch = screen.getByRole('checkbox', { name: /Stackable with other codes/ });
      const activeSwitch = screen.getByRole('checkbox', { name: /Active/ });

      expect(firstTimeSwitch).toBeChecked(); // Default true
      expect(stackableSwitch).not.toBeChecked(); // Default false
      expect(activeSwitch).toBeChecked(); // Default true
    });
  });
});
