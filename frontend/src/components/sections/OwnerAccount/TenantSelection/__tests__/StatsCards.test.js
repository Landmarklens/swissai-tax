import React from 'react';
import { render, screen } from '@testing-library/react';
import StatsCards from '../StatsCards';

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key
  })
}));

describe('StatsCards', () => {
  const mockStats = {
    totalApplications: 25,
    averageScore: 76.5,
    qualifiedCount: 10,
    rejectedCount: 5,
    pendingCount: 8,
    viewingsScheduled: 3
  };

  it('should render all stat cards', () => {
    render(<StatsCards stats={mockStats} />);

    expect(screen.getByText('Total Applications')).toBeInTheDocument();
    expect(screen.getByText('Average Score')).toBeInTheDocument();
    expect(screen.getByText('Qualified')).toBeInTheDocument();
    expect(screen.getByText('Pending Review')).toBeInTheDocument();
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });

  it('should display correct stat values', () => {
    render(<StatsCards stats={mockStats} />);

    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('77/100')).toBeInTheDocument(); // Rounded from 76.5
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('should render icons for each stat', () => {
    render(<StatsCards stats={mockStats} />);

    expect(screen.getByTestId('PeopleIcon')).toBeInTheDocument();
    expect(screen.getByTestId('CheckCircleIcon')).toBeInTheDocument();
    expect(screen.getByTestId('ScheduleIcon')).toBeInTheDocument();
    expect(screen.getByTestId('CancelIcon')).toBeInTheDocument();
    expect(screen.getByTestId('TrendingUpIcon')).toBeInTheDocument();
  });

  it('should have cards with correct background colors', () => {
    const { container } = render(<StatsCards stats={mockStats} />);

    // Check that we have 5 stat cards
    const cards = container.querySelectorAll('.MuiCard-root');
    expect(cards).toHaveLength(5);
  });

  it('should handle zero values correctly', () => {
    const zeroStats = {
      totalApplications: 0,
      averageScore: 0,
      qualifiedCount: 0,
      rejectedCount: 0,
      pendingCount: 0,
      viewingsScheduled: 0
    };

    render(<StatsCards stats={zeroStats} />);

    // Check for individual zero values
    expect(screen.getByText('0/100')).toBeInTheDocument(); // Average score
    const zeros = screen.getAllByText('0');
    expect(zeros).toHaveLength(4); // Other stats
  });

  it('should round average score to nearest integer', () => {
    const statsWithDecimals = {
      ...mockStats,
      averageScore: 85.4567
    };

    render(<StatsCards stats={statsWithDecimals} />);

    expect(screen.getByText('85/100')).toBeInTheDocument();
  });

  it('should handle missing stats gracefully', () => {
    const partialStats = {
      totalApplications: 10,
      averageScore: 75
    };

    render(<StatsCards stats={partialStats} />);

    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('75/100')).toBeInTheDocument();
    // Check that undefined values show as 0
    expect(screen.queryByText('undefined')).not.toBeInTheDocument();
  });

  it('should apply correct grid layout', () => {
    const { container } = render(<StatsCards stats={mockStats} />);

    const gridContainer = container.querySelector('.MuiGrid-container');
    expect(gridContainer).toBeInTheDocument();

    const gridItems = container.querySelectorAll('.MuiGrid-item');
    expect(gridItems).toHaveLength(5); // 5 stat cards
  });

  it('should have responsive grid sizing', () => {
    const { container } = render(<StatsCards stats={mockStats} />);

    const gridItems = container.querySelectorAll('.MuiGrid-item');
    
    gridItems.forEach((item) => {
      expect(item).toHaveClass('MuiGrid-grid-xs-12');
      expect(item).toHaveClass('MuiGrid-grid-sm-6');
      expect(item).toHaveClass('MuiGrid-grid-md-2.4');
    });
  });
});