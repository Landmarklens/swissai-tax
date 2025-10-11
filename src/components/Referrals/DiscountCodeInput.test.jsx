/**
 * Unit tests for DiscountCodeInput component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import DiscountCodeInput from './DiscountCodeInput';
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

describe('DiscountCodeInput', () => {
  const mockOnDiscountApplied = jest.fn();
  const mockOnDiscountRemoved = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    referralService.validateDiscountCode.mockResolvedValue({
      success: true,
      data: {
        is_valid: true,
        code: 'TESTCODE',
        discount_type: 'percentage',
        discount_value: 10,
        original_price_chf: 129,
        final_price_chf: 116.10,
        savings_chf: 12.90
      }
    });

    referralService.calculateDiscount.mockImplementation((originalPrice, discountInfo) => ({
      originalPrice,
      discountAmount: discountInfo?.savings_chf || 0,
      finalPrice: discountInfo?.final_price_chf || originalPrice,
      discountPercent: discountInfo?.discount_value || 0,
      discountText: discountInfo ? '10% off' : ''
    }));

    referralService.formatCurrency.mockImplementation((amount) => `CHF ${amount.toFixed(2)}`);
  });

  describe('Rendering', () => {
    it('should render without crashing', async () => {
      await act(async () => {
        renderWithTheme(
          <DiscountCodeInput
            planType="annual_flex"
            originalPrice={129}
            onDiscountApplied={mockOnDiscountApplied}
            onDiscountRemoved={mockOnDiscountRemoved}
          />
        );
      });

      expect(screen.getByPlaceholderText('Enter code')).toBeInTheDocument();
    });

    it('should render with initial code', async () => {
      await act(async () => {
        renderWithTheme(
          <DiscountCodeInput
            planType="annual_flex"
            originalPrice={129}
            onDiscountApplied={mockOnDiscountApplied}
            onDiscountRemoved={mockOnDiscountRemoved}
            initialCode="WELCOME10"
          />
        );
      });

      await waitFor(() => {
        const input = screen.getByPlaceholderText('Enter code');
        expect(input).toHaveValue('WELCOME10');
      });
    });

    it('should display apply button when no discount is applied', () => {
      renderWithTheme(
        <DiscountCodeInput
          planType="annual_flex"
          originalPrice={129}
          onDiscountApplied={mockOnDiscountApplied}
          onDiscountRemoved={mockOnDiscountRemoved}
        />
      );

      expect(screen.getByText('Apply')).toBeInTheDocument();
    });
  });

  describe('User Interactions', () => {
    it('should update code when user types', () => {
      renderWithTheme(
        <DiscountCodeInput
          planType="annual_flex"
          originalPrice={129}
          onDiscountApplied={mockOnDiscountApplied}
          onDiscountRemoved={mockOnDiscountRemoved}
        />
      );

      const input = screen.getByPlaceholderText('Enter code');
      fireEvent.change(input, { target: { value: 'NEWCODE' } });

      expect(input).toHaveValue('NEWCODE');
    });

    it('should convert code to uppercase when validating', async () => {
      renderWithTheme(
        <DiscountCodeInput
          planType="annual_flex"
          originalPrice={129}
          onDiscountApplied={mockOnDiscountApplied}
          onDiscountRemoved={mockOnDiscountRemoved}
        />
      );

      const input = screen.getByPlaceholderText('Enter code');
      const applyButton = screen.getByText('Apply');

      fireEvent.change(input, { target: { value: 'testcode' } });
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(referralService.validateDiscountCode).toHaveBeenCalledWith('TESTCODE', 'annual_flex');
      });
    });

    it('should not validate empty code', async () => {
      renderWithTheme(
        <DiscountCodeInput
          planType="annual_flex"
          originalPrice={129}
          onDiscountApplied={mockOnDiscountApplied}
          onDiscountRemoved={mockOnDiscountRemoved}
        />
      );

      const applyButton = screen.getByText('Apply');
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(referralService.validateDiscountCode).not.toHaveBeenCalled();
      });
    });
  });

  describe('Code Validation', () => {
    it('should validate valid discount code successfully', async () => {
      await act(async () => {
        renderWithTheme(
          <DiscountCodeInput
            planType="annual_flex"
            originalPrice={129}
            onDiscountApplied={mockOnDiscountApplied}
            onDiscountRemoved={mockOnDiscountRemoved}
          />
        );
      });

      const input = screen.getByPlaceholderText('Enter code');
      const applyButton = screen.getByText('Apply');

      fireEvent.change(input, { target: { value: 'TESTCODE' } });

      await act(async () => {
        fireEvent.click(applyButton);
      });

      await waitFor(() => {
        expect(referralService.validateDiscountCode).toHaveBeenCalledWith('TESTCODE', 'annual_flex');
        expect(mockOnDiscountApplied).toHaveBeenCalled();
      });
    });

    it('should display error for invalid code', async () => {
      referralService.validateDiscountCode.mockResolvedValue({
        success: true,
        data: {
          is_valid: false,
          error_message: 'Code not found'
        }
      });

      renderWithTheme(
        <DiscountCodeInput
          planType="annual_flex"
          originalPrice={129}
          onDiscountApplied={mockOnDiscountApplied}
          onDiscountRemoved={mockOnDiscountRemoved}
        />
      );

      const input = screen.getByPlaceholderText('Enter code');
      const applyButton = screen.getByText('Apply');

      fireEvent.change(input, { target: { value: 'INVALID' } });
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText('Code not found')).toBeInTheDocument();
      });

      expect(mockOnDiscountApplied).not.toHaveBeenCalled();
    });

    it('should handle validation API error', async () => {
      referralService.validateDiscountCode.mockResolvedValue({
        success: false,
        error: 'Network error'
      });

      renderWithTheme(
        <DiscountCodeInput
          planType="annual_flex"
          originalPrice={129}
          onDiscountApplied={mockOnDiscountApplied}
          onDiscountRemoved={mockOnDiscountRemoved}
        />
      );

      const input = screen.getByPlaceholderText('Enter code');
      const applyButton = screen.getByText('Apply');

      fireEvent.change(input, { target: { value: 'TESTCODE' } });
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should auto-validate initial code on mount', async () => {
      await act(async () => {
        renderWithTheme(
          <DiscountCodeInput
            planType="annual_flex"
            originalPrice={129}
            onDiscountApplied={mockOnDiscountApplied}
            onDiscountRemoved={mockOnDiscountRemoved}
            initialCode="AUTOCODE"
          />
        );
      });

      await waitFor(() => {
        expect(referralService.validateDiscountCode).toHaveBeenCalledWith('AUTOCODE', 'annual_flex');
        expect(mockOnDiscountApplied).toHaveBeenCalled();
      });
    });

    it('should not auto-validate if planType is missing', () => {
      renderWithTheme(
        <DiscountCodeInput
          originalPrice={129}
          onDiscountApplied={mockOnDiscountApplied}
          onDiscountRemoved={mockOnDiscountRemoved}
          initialCode="AUTOCODE"
        />
      );

      expect(referralService.validateDiscountCode).not.toHaveBeenCalled();
    });
  });

  describe('Discount Display', () => {
    it('should display discount information after validation', async () => {
      await act(async () => {
        renderWithTheme(
          <DiscountCodeInput
            planType="annual_flex"
            originalPrice={129}
            onDiscountApplied={mockOnDiscountApplied}
            onDiscountRemoved={mockOnDiscountRemoved}
          />
        );
      });

      const input = screen.getByPlaceholderText('Enter code');
      const applyButton = screen.getByText('Apply');

      fireEvent.change(input, { target: { value: 'TESTCODE' } });

      await act(async () => {
        fireEvent.click(applyButton);
      });

      await waitFor(() => {
        expect(screen.getByText(/10%/)).toBeInTheDocument();
      });
    });

    it('should display savings amount', async () => {
      await act(async () => {
        renderWithTheme(
          <DiscountCodeInput
            planType="annual_flex"
            originalPrice={129}
            onDiscountApplied={mockOnDiscountApplied}
            onDiscountRemoved={mockOnDiscountRemoved}
          />
        );
      });

      const input = screen.getByPlaceholderText('Enter code');
      const applyButton = screen.getByText('Apply');

      fireEvent.change(input, { target: { value: 'TESTCODE' } });

      await act(async () => {
        fireEvent.click(applyButton);
      });

      await waitFor(() => {
        expect(referralService.formatCurrency).toHaveBeenCalled();
      });
    });

    it('should show remove button when discount is applied', async () => {
      await act(async () => {
        renderWithTheme(
          <DiscountCodeInput
            planType="annual_flex"
            originalPrice={129}
            onDiscountApplied={mockOnDiscountApplied}
            onDiscountRemoved={mockOnDiscountRemoved}
          />
        );
      });

      const input = screen.getByPlaceholderText('Enter code');
      const applyButton = screen.getByText('Apply');

      fireEvent.change(input, { target: { value: 'TESTCODE' } });

      await act(async () => {
        fireEvent.click(applyButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Remove')).toBeInTheDocument();
      });
    });
  });

  describe('Remove Discount', () => {
    it('should remove discount when remove button is clicked', async () => {
      await act(async () => {
        renderWithTheme(
          <DiscountCodeInput
            planType="annual_flex"
            originalPrice={129}
            onDiscountApplied={mockOnDiscountApplied}
            onDiscountRemoved={mockOnDiscountRemoved}
            initialCode="TESTCODE"
          />
        );
      });

      // Wait for initial validation
      await waitFor(() => {
        expect(screen.getByText('Remove')).toBeInTheDocument();
      });

      const removeButton = screen.getByText('Remove');
      fireEvent.click(removeButton);

      await waitFor(() => {
        expect(mockOnDiscountRemoved).toHaveBeenCalled();
        expect(screen.getByText('Apply')).toBeInTheDocument();
      });
    });

    it('should clear error when removing discount', async () => {
      referralService.validateDiscountCode.mockResolvedValue({
        success: true,
        data: {
          is_valid: false,
          error_message: 'Code expired'
        }
      });

      renderWithTheme(
        <DiscountCodeInput
          planType="annual_flex"
          originalPrice={129}
          onDiscountApplied={mockOnDiscountApplied}
          onDiscountRemoved={mockOnDiscountRemoved}
        />
      );

      const input = screen.getByPlaceholderText('Enter code');
      const applyButton = screen.getByText('Apply');

      fireEvent.change(input, { target: { value: 'EXPIRED' } });
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(screen.getByText('Code expired')).toBeInTheDocument();
      });

      // Clear the input
      fireEvent.change(input, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.queryByText('Code expired')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading state during validation', async () => {
      // Create a promise that we can control
      let resolveValidation;
      const validationPromise = new Promise((resolve) => {
        resolveValidation = resolve;
      });

      referralService.validateDiscountCode.mockReturnValue(validationPromise);

      await act(async () => {
        renderWithTheme(
          <DiscountCodeInput
            planType="annual_flex"
            originalPrice={129}
            onDiscountApplied={mockOnDiscountApplied}
            onDiscountRemoved={mockOnDiscountRemoved}
          />
        );
      });

      const input = screen.getByPlaceholderText('Enter code');
      const applyButton = screen.getByText('Apply');

      fireEvent.change(input, { target: { value: 'TESTCODE' } });
      fireEvent.click(applyButton);

      // Check if button is disabled during loading
      await waitFor(() => {
        expect(applyButton).toBeDisabled();
      });

      // Resolve the promise
      await act(async () => {
        resolveValidation({
          success: true,
          data: {
            is_valid: true,
            code: 'TESTCODE',
            discount_type: 'percentage',
            discount_value: 10,
            final_price_chf: 116.10,
            savings_chf: 12.90
          }
        });
      });

      await waitFor(() => {
        expect(screen.getByText('Remove')).toBeInTheDocument();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle missing onDiscountApplied callback', async () => {
      await act(async () => {
        renderWithTheme(
          <DiscountCodeInput
            planType="annual_flex"
            originalPrice={129}
            onDiscountRemoved={mockOnDiscountRemoved}
          />
        );
      });

      const input = screen.getByPlaceholderText('Enter code');
      const applyButton = screen.getByText('Apply');

      fireEvent.change(input, { target: { value: 'TESTCODE' } });
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(referralService.validateDiscountCode).toHaveBeenCalled();
      });

      // Should not throw error
    });

    it('should handle missing onDiscountRemoved callback', async () => {
      await act(async () => {
        renderWithTheme(
          <DiscountCodeInput
            planType="annual_flex"
            originalPrice={129}
            onDiscountApplied={mockOnDiscountApplied}
            initialCode="TESTCODE"
          />
        );
      });

      await waitFor(() => {
        expect(screen.getByText('Remove')).toBeInTheDocument();
      });

      const removeButton = screen.getByText('Remove');
      fireEvent.click(removeButton);

      // Should not throw error
    });

    it('should trim whitespace from code', async () => {
      renderWithTheme(
        <DiscountCodeInput
          planType="annual_flex"
          originalPrice={129}
          onDiscountApplied={mockOnDiscountApplied}
          onDiscountRemoved={mockOnDiscountRemoved}
        />
      );

      const input = screen.getByPlaceholderText('Enter code');
      const applyButton = screen.getByText('Apply');

      fireEvent.change(input, { target: { value: '  TESTCODE  ' } });
      fireEvent.click(applyButton);

      await waitFor(() => {
        expect(referralService.validateDiscountCode).toHaveBeenCalledWith('TESTCODE', 'annual_flex');
      });
    });
  });
});
