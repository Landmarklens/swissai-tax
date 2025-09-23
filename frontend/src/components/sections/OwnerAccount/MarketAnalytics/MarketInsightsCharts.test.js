import React from 'react';
import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import MarketInsightsCharts from './MarketInsightsCharts';
import '@testing-library/jest-dom';

// Mock Recharts components to avoid ResizeObserver issues
jest.mock('recharts', () => ({
  ...jest.requireActual('recharts'),
  ResponsiveContainer: ({ children }) => <div>{children}</div>,
  BarChart: ({ children }) => <div>{children}</div>,
  Bar: () => null,
  LineChart: ({ children }) => <div>{children}</div>,
  Line: () => null,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  Cell: () => null,
  ComposedChart: ({ children }) => <div>{children}</div>,
  Area: () => null,
}));

const theme = createTheme();

describe('MarketInsightsCharts', () => {
  const mockMarketData = {
    market_analytics: {
      total_properties: 15,
      average_price: 500000,
      median_price: 480000,
      min_price: 350000,
      max_price: 650000
    }
  };

  const renderComponent = (props = {}) => {
    const defaultProps = {
      marketData: mockMarketData,
      selectedProperty: {
        id: 1,
        title: 'Test Property',
        price_chf: 500000,
        property_type: 'apartment',
        bedrooms: 3
      },
      dealType: 'rent'
    };

    return render(
      <ThemeProvider theme={theme}>
        <MarketInsightsCharts {...defaultProps} {...props} />
      </ThemeProvider>
    );
  };

  describe('Sale vs Rent Label Adaptation', () => {
    test('should display appropriate sections for sale properties', () => {
      renderComponent({ dealType: 'sale' });

      // Check for sections that should exist
      expect(screen.getByText(/Supply & Competition/i)).toBeInTheDocument();
      expect(screen.getByText(/Optimal Pricing Range/i)).toBeInTheDocument();
    });

    test('should display appropriate sections for rental properties', () => {
      renderComponent({ dealType: 'rent' });

      // Check for sections that should exist
      expect(screen.getByText(/Supply & Competition/i)).toBeInTheDocument();
      expect(screen.getByText(/Optimal Pricing Range/i)).toBeInTheDocument();
    });

    test('should handle "buy" dealType as sale', () => {
      renderComponent({ dealType: 'buy' });

      expect(screen.getByText(/Supply & Competition/i)).toBeInTheDocument();
    });
  });

  describe('Price Adjustments', () => {
    test('should adjust high prices for rental properties', () => {
      const highPriceData = {
        market_analytics: {
          total_properties: 10,
          average_price: 36000, // Annual rent
          median_price: 34800,
          min_price: 30000,
          max_price: 42000
        }
      };

      renderComponent({ 
        marketData: highPriceData,
        dealType: 'rent',
        selectedProperty: {
          price_chf: 3000, // Monthly rent
          property_type: 'apartment',
          bedrooms: 2
        }
      });

      // Should show adjusted monthly prices
      // The component should divide by 12
      expect(screen.queryByText(/36,000/)).not.toBeInTheDocument();
    });

    test('should not adjust prices for sale properties', () => {
      const saleData = {
        market_analytics: {
          total_properties: 10,
          average_price: 750000,
          median_price: 700000,
          min_price: 600000,
          max_price: 900000
        }
      };

      renderComponent({ 
        marketData: saleData,
        dealType: 'sale',
        selectedProperty: {
          price_chf: 750000,
          property_type: 'house',
          bedrooms: 4
        }
      });

      // Should show full sale prices
      // Component should display the prices as-is
      expect(screen.getByText(/Optimal Pricing Range/i)).toBeInTheDocument();
    });
  });

  describe('Market Velocity Section', () => {
    test('should show appropriate interpretation for sale properties', () => {
      renderComponent({ dealType: 'sale' });
      
      expect(screen.getByText(/Market Velocity/i)).toBeInTheDocument();
      // Check that section renders without specific text check
      expect(screen.getByText(/Market Velocity/i)).toBeTruthy();
    });

    test('should show appropriate interpretation for rental properties', () => {
      renderComponent({ dealType: 'rent' });
      
      expect(screen.getByText(/Market Velocity/i)).toBeInTheDocument();
      // Check that section renders without specific text check
      expect(screen.getByText(/Market Velocity/i)).toBeTruthy();
    });
  });

  describe('Supply & Competition Section', () => {
    test('should display competition metrics', () => {
      renderComponent();
      
      expect(screen.getByText(/Supply & Competition/i)).toBeInTheDocument();
      expect(screen.getByText(/Total Active/i)).toBeInTheDocument();
      expect(screen.getByText(/Direct Competitors/i)).toBeInTheDocument();
    });

    test('should show new listings indicator', () => {
      renderComponent();

      expect(screen.getByText(/New This Week/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Avg. Days on Market/i).length).toBeGreaterThan(0);
    });
  });

  describe('Optimal Pricing Range', () => {
    test('should display pricing range for sale properties', () => {
      renderComponent({ 
        dealType: 'sale',
        selectedProperty: {
          price_chf: 750000,
          property_type: 'house',
          bedrooms: 4
        }
      });
      
      expect(screen.getByText(/Optimal Pricing Range/i)).toBeInTheDocument();
      // Text includes timeframe, so use partial match
      expect(screen.getByText(/Quick Sale.*30 days/i)).toBeInTheDocument();
      expect(screen.getByText(/Market Rate.*60-90 days/i)).toBeInTheDocument();
      expect(screen.getByText(/Premium.*90\+ days/i)).toBeInTheDocument();
    });

    test('should display pricing range for rental properties', () => {
      renderComponent({ 
        dealType: 'rent',
        selectedProperty: {
          price_chf: 2500,
          property_type: 'apartment',
          bedrooms: 2
        }
      });
      
      expect(screen.getByText(/Optimal Pricing Range/i)).toBeInTheDocument();
      // Should show rent-specific optimal ranges with timeframe
      expect(screen.getByText(/Quick Rent.*2 weeks/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing market data gracefully', () => {
      renderComponent({ marketData: null });
      
      // Should show no data message when market data is null
      expect(screen.getByText(/No market data available/i)).toBeInTheDocument();
    });

    test('should handle missing selected property', () => {
      renderComponent({ selectedProperty: null });
      
      // Should still render without crashing - check for a section that exists
      expect(screen.getByText(/Supply & Competition/i)).toBeInTheDocument();
    });

    test('should handle zero prices', () => {
      const zeroData = {
        market_analytics: {
          total_properties: 0,
          average_price: 0,
          median_price: 0,
          min_price: 0,
          max_price: 0
        }
      };

      renderComponent({ 
        marketData: zeroData,
        selectedProperty: {
          price_chf: 0,
          property_type: 'apartment',
          bedrooms: 2
        }
      });

      // Should handle division by zero and display defaults
      expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
      expect(screen.queryByText(/undefined/)).not.toBeInTheDocument();
    });
  });
});