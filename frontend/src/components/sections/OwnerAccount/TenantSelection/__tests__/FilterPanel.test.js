import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import FilterPanel from '../FilterPanel';

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key
  })
}));

describe('FilterPanel', () => {
  const mockFilters = {
    propertyId: 1,
    status: 'all',
    dateRange: {
      start: null,
      end: null
    },
    scoreRange: {
      min: 0,
      max: 100
    },
    sourcePortal: 'all'
  };

  const mockHandlers = {
    onFilterChange: jest.fn(),
    onClose: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render filter panel with all filter options', () => {
    render(
      <FilterPanel
        filters={mockFilters}
        onFilterChange={mockHandlers.onFilterChange}
        onClose={mockHandlers.onClose}
      />
    );

    expect(screen.getByText('Advanced Filters')).toBeInTheDocument();
    expect(screen.getByText('Score Range')).toBeInTheDocument();
    expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
    expect(screen.getByLabelText('End Date')).toBeInTheDocument();
  });

  it('should display current score range values', () => {
    const filtersWithScore = {
      ...mockFilters,
      scoreRange: { min: 20, max: 80 }
    };

    render(
      <FilterPanel
        filters={filtersWithScore}
        onFilterChange={mockHandlers.onFilterChange}
        onClose={mockHandlers.onClose}
      />
    );

    const sliders = screen.getAllByRole('slider');
    expect(sliders[0]).toHaveAttribute('aria-valuenow', '20');
    expect(sliders[1]).toHaveAttribute('aria-valuenow', '80');
  });

  it('should handle score range change', () => {
    render(
      <FilterPanel
        filters={mockFilters}
        onFilterChange={mockHandlers.onFilterChange}
        onClose={mockHandlers.onClose}
      />
    );

    const sliders = screen.getAllByRole('slider');
    fireEvent.change(sliders[0], { target: { value: 30 } });

    expect(mockHandlers.onFilterChange).toHaveBeenCalledWith({
      scoreRange: { min: 30, max: 100 }
    });
  });

  it('should handle start date change', () => {
    render(
      <FilterPanel
        filters={mockFilters}
        onFilterChange={mockHandlers.onFilterChange}
        onClose={mockHandlers.onClose}
      />
    );

    const startDateInput = screen.getByLabelText('Start Date');
    fireEvent.change(startDateInput, { target: { value: '2024-01-01' } });

    expect(mockHandlers.onFilterChange).toHaveBeenCalledWith({
      dateRange: { start: '2024-01-01', end: null }
    });
  });

  it('should handle end date change', () => {
    render(
      <FilterPanel
        filters={mockFilters}
        onFilterChange={mockHandlers.onFilterChange}
        onClose={mockHandlers.onClose}
      />
    );

    const endDateInput = screen.getByLabelText('End Date');
    fireEvent.change(endDateInput, { target: { value: '2024-12-31' } });

    expect(mockHandlers.onFilterChange).toHaveBeenCalledWith({
      dateRange: { start: null, end: '2024-12-31' }
    });
  });

  it('should display existing date values', () => {
    const filtersWithDates = {
      ...mockFilters,
      dateRange: {
        start: '2024-01-01',
        end: '2024-12-31'
      }
    };

    render(
      <FilterPanel
        filters={filtersWithDates}
        onFilterChange={mockHandlers.onFilterChange}
        onClose={mockHandlers.onClose}
      />
    );

    const startDateInput = screen.getByLabelText('Start Date');
    const endDateInput = screen.getByLabelText('End Date');

    expect(startDateInput).toHaveValue('2024-01-01');
    expect(endDateInput).toHaveValue('2024-12-31');
  });

  it('should handle reset filters button click', () => {
    render(
      <FilterPanel
        filters={mockFilters}
        onFilterChange={mockHandlers.onFilterChange}
        onClose={mockHandlers.onClose}
      />
    );

    const resetButton = screen.getByText('Reset Filters');
    fireEvent.click(resetButton);

    expect(mockHandlers.onFilterChange).toHaveBeenCalledWith({
      status: 'all',
      sourcePortal: 'all',
      scoreRange: { min: 0, max: 100 },
      dateRange: { start: null, end: null }
    });
  });

  it('should handle apply filters button click', () => {
    render(
      <FilterPanel
        filters={mockFilters}
        onFilterChange={mockHandlers.onFilterChange}
        onClose={mockHandlers.onClose}
      />
    );

    const applyButton = screen.getByText('Apply Filters');
    fireEvent.click(applyButton);

    expect(mockHandlers.onClose).toHaveBeenCalled();
  });

  it('should handle close button click', () => {
    render(
      <FilterPanel
        filters={mockFilters}
        onFilterChange={mockHandlers.onFilterChange}
        onClose={mockHandlers.onClose}
      />
    );

    const closeButton = screen.getByLabelText('close');
    fireEvent.click(closeButton);

    expect(mockHandlers.onClose).toHaveBeenCalled();
  });

  it('should display score range tooltip text', () => {
    render(
      <FilterPanel
        filters={mockFilters}
        onFilterChange={mockHandlers.onFilterChange}
        onClose={mockHandlers.onClose}
      />
    );

    expect(screen.getByText('0 - 100')).toBeInTheDocument();
  });

  it('should not allow invalid score range', () => {
    render(
      <FilterPanel
        filters={mockFilters}
        onFilterChange={mockHandlers.onFilterChange}
        onClose={mockHandlers.onClose}
      />
    );

    const sliders = screen.getAllByRole('slider');
    
    // Try to set min higher than max
    fireEvent.change(sliders[0], { target: { value: 110 } });
    
    // Should be clamped to max value
    expect(mockHandlers.onFilterChange).toHaveBeenCalledWith({
      scoreRange: { min: 100, max: 100 }
    });
  });

  it('should render portal-specific filters section', () => {
    render(
      <FilterPanel
        filters={mockFilters}
        onFilterChange={mockHandlers.onFilterChange}
        onClose={mockHandlers.onClose}
      />
    );

    expect(screen.getByText('Portal-Specific Filters')).toBeInTheDocument();
  });

  it('should render AI analysis filters section', () => {
    render(
      <FilterPanel
        filters={mockFilters}
        onFilterChange={mockHandlers.onFilterChange}
        onClose={mockHandlers.onClose}
      />
    );

    expect(screen.getByText('AI Analysis Filters')).toBeInTheDocument();
  });

  it('should handle portal checkboxes', () => {
    render(
      <FilterPanel
        filters={mockFilters}
        onFilterChange={mockHandlers.onFilterChange}
        onClose={mockHandlers.onClose}
      />
    );

    const homegateCheckbox = screen.getByLabelText('Homegate');
    fireEvent.click(homegateCheckbox);

    // Should trigger filter change for portal selection
    expect(mockHandlers.onFilterChange).toHaveBeenCalled();
  });

  it('should handle AI flag checkboxes', () => {
    render(
      <FilterPanel
        filters={mockFilters}
        onFilterChange={mockHandlers.onFilterChange}
        onClose={mockHandlers.onClose}
      />
    );

    const greenFlagsCheckbox = screen.getByLabelText('Only Green Flags');
    fireEvent.click(greenFlagsCheckbox);

    expect(mockHandlers.onFilterChange).toHaveBeenCalled();
  });

  it('should display clear dates button when dates are set', () => {
    const filtersWithDates = {
      ...mockFilters,
      dateRange: {
        start: '2024-01-01',
        end: '2024-12-31'
      }
    };

    render(
      <FilterPanel
        filters={filtersWithDates}
        onFilterChange={mockHandlers.onFilterChange}
        onClose={mockHandlers.onClose}
      />
    );

    const clearDatesButton = screen.getByText('Clear Dates');
    expect(clearDatesButton).toBeInTheDocument();

    fireEvent.click(clearDatesButton);

    expect(mockHandlers.onFilterChange).toHaveBeenCalledWith({
      dateRange: { start: null, end: null }
    });
  });

  it('should not display clear dates button when no dates are set', () => {
    render(
      <FilterPanel
        filters={mockFilters}
        onFilterChange={mockHandlers.onFilterChange}
        onClose={mockHandlers.onClose}
      />
    );

    const clearDatesButton = screen.queryByText('Clear Dates');
    expect(clearDatesButton).not.toBeInTheDocument();
  });
});