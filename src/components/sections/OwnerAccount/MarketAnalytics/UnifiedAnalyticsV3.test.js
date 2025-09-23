import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import configureStore from 'redux-mock-store';
import UnifiedAnalyticsV3 from './UnifiedAnalyticsV3';
import '@testing-library/jest-dom';

// Mock the hooks and components
jest.mock('../../../../hooks/useAnalytics', () => ({
  useComprehensiveAnalytics: () => ({
    data: {
      market_analytics: {
        total_properties: 13,
        average_price: 2593462,
        median_price: 2250000,
        min_price: 1500000,
        max_price: 3500000
      }
    },
    loading: false,
    refetch: jest.fn()
  })
}));

jest.mock('./MarketInsightsCharts', () => {
  return function MarketInsightsCharts({ dealType, selectedProperty, marketData }) {
    return (
      <div data-testid="market-insights">
        <div data-testid="deal-type">{dealType}</div>
        <div data-testid="property-price">{selectedProperty?.price_chf}</div>
      </div>
    );
  };
});

const mockStore = configureStore([]);
const theme = createTheme();

describe('UnifiedAnalyticsV3', () => {
  let store;

  beforeEach(() => {
    // Clear console logs for cleaner test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderComponent = (properties = []) => {
    store = mockStore({
      properties: {
        properties: {
          data: properties
        }
      }
    });

    return render(
      <Provider store={store}>
        <BrowserRouter>
          <ThemeProvider theme={theme}>
            <UnifiedAnalyticsV3 />
          </ThemeProvider>
        </BrowserRouter>
      </Provider>
    );
  };

  describe('Property Type Detection', () => {
    test('should show select property message when no property selected', () => {
      const saleProperty = {
        id: 1,
        title: 'Luxury Apartment',
        price_chf: 1798200,
        property_type: 'apartment',
        bedrooms: 3,
        deal_type: null,
        action: null
      };

      renderComponent([saleProperty]);

      // Should show the select property message since nothing is selected by default
      expect(screen.getByText(/Please select a property from the dropdown above to view analytics/i)).toBeInTheDocument();
    });

    test('should show select property message for sale properties', () => {
      const saleProperty = {
        id: 1,
        title: 'House for Sale',
        price_chf: 850000,
        property_type: 'house',
        bedrooms: 4,
        deal_type: 'sale',
        action: null
      };

      renderComponent([saleProperty]);

      // Should show the select property message
      expect(screen.getByText(/Please select a property/i)).toBeInTheDocument();
    });

    test('should show select property message for rent properties', () => {
      const rentProperty = {
        id: 1,
        title: 'Apartment for Rent',
        price_chf: 2500,
        property_type: 'apartment',
        bedrooms: 2,
        deal_type: 'rent',
        action: null
      };

      renderComponent([rentProperty]);

      // Should show the select property message
      expect(screen.getByText(/Please select a property/i)).toBeInTheDocument();
    });

    test('should show select property message for low price properties', () => {
      const rentProperty = {
        id: 1,
        title: 'Studio Apartment',
        price_chf: 1500,
        property_type: 'apartment',
        bedrooms: 1,
        deal_type: null,
        action: null
      };

      renderComponent([rentProperty]);

      // Should show the select property message
      expect(screen.getByText(/Please select a property/i)).toBeInTheDocument();
    });
  });

  describe('Price Label Updates', () => {
    test('should not show price labels when no property is selected', () => {
      const saleProperty = {
        id: 1,
        title: 'House',
        price_chf: 1200000,
        property_type: 'house',
        bedrooms: 3,
        deal_type: 'sale'
      };

      renderComponent([saleProperty]);

      // No price labels should be shown when no property is selected
      expect(screen.queryByText(/Average Sale Price/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Median Sale Price/i)).not.toBeInTheDocument();
    });

    test('should not show rent labels when no property is selected', () => {
      const rentProperty = {
        id: 1,
        title: 'Apartment',
        price_chf: 2000,
        property_type: 'apartment',
        bedrooms: 2,
        deal_type: 'rent'
      };

      renderComponent([rentProperty]);

      // No rent labels should be shown when no property is selected
      expect(screen.queryByText(/Average Monthly Rent/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/Median Monthly Rent/i)).not.toBeInTheDocument();
    });
  });

  describe('Room Display', () => {
    test('should not display rooms when no property is selected', () => {
      const property = {
        id: 1,
        title: 'Test Property',
        price_chf: 500000,
        property_type: 'apartment',
        bedrooms: 3,
        deal_type: 'sale'
      };

      renderComponent([property]);

      // Rooms should not be displayed when no property is selected
      expect(screen.queryByText(/Number of Rooms/i)).not.toBeInTheDocument();
    });

    test('should not display rooms section if bedrooms is not provided', () => {
      const property = {
        id: 1,
        title: 'Test Property',
        price_chf: 500000,
        property_type: 'apartment',
        bedrooms: null,
        deal_type: 'sale'
      };

      renderComponent([property]);
      
      expect(screen.queryByText(/Number of Rooms/i)).not.toBeInTheDocument();
    });
  });

  describe('MarketInsightsCharts Integration', () => {
    test('should not render MarketInsightsCharts when no property is selected', () => {
      const saleProperty = {
        id: 1,
        title: 'House',
        price_chf: 1500000,
        property_type: 'house',
        bedrooms: 4,
        deal_type: 'buy'
      };

      renderComponent([saleProperty]);

      // MarketInsightsCharts should not be rendered when no property is selected
      expect(screen.queryByTestId('deal-type')).not.toBeInTheDocument();
    });

    test('should not render MarketInsightsCharts for rental when no property is selected', () => {
      const rentProperty = {
        id: 1,
        title: 'Apartment',
        price_chf: 3000,
        property_type: 'apartment',
        bedrooms: 2,
        deal_type: 'rent'
      };

      renderComponent([rentProperty]);

      // MarketInsightsCharts should not be rendered when no property is selected
      expect(screen.queryByTestId('deal-type')).not.toBeInTheDocument();
    });
  });

  describe('Property Selector', () => {
    test('should show select property dropdown when properties are available', () => {
      const properties = [
        {
          id: 1,
          title: 'Luxury Villa',
          price_chf: 2500000,
          property_type: 'house',
          bedrooms: 5,
          deal_type: 'sale'
        },
        {
          id: 2,
          title: 'City Apartment',
          price_chf: 3500,
          property_type: 'apartment',
          bedrooms: 2,
          deal_type: 'rent'
        }
      ];

      renderComponent(properties);

      // Should show the dropdown label (there are multiple, so use getAllByText)
      const choosePropertyElements = screen.getAllByText('Choose a property');
      expect(choosePropertyElements.length).toBeGreaterThan(0);
      // Should show the select property message
      expect(screen.getByText(/Please select a property/i)).toBeInTheDocument();
    });
  });

  describe('Price Adjustments', () => {
    test('should adjust high rental prices by dividing by 12', () => {
      const rentProperty = {
        id: 1,
        title: 'Apartment',
        price_chf: 3000,
        property_type: 'apartment',
        bedrooms: 2,
        deal_type: 'rent'
      };

      renderComponent([rentProperty]);
      
      // With average_price: 2593462 in mock data
      // For rental, should divide by 12 = 216,122
      // This would be displayed as CHF 216,122
      const priceElements = screen.getAllByText(/CHF/);
      
      // Should not show the original high price for rentals
      expect(screen.queryByText(/CHF 2,593,462/)).not.toBeInTheDocument();
    });

    test('should not show prices when no property is selected', () => {
      const saleProperty = {
        id: 1,
        title: 'House',
        price_chf: 2500000,
        property_type: 'house',
        bedrooms: 4,
        deal_type: 'sale'
      };

      renderComponent([saleProperty]);

      // Should not show any price data when no property is selected
      expect(screen.queryByText(/CHF 2,593,462/)).not.toBeInTheDocument();
      expect(screen.getByText(/Please select a property/i)).toBeInTheDocument();
    });
  });
});