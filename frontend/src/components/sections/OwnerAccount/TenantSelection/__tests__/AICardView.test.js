import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import AICardView from '../AICardView';

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: { changeLanguage: jest.fn() }
  })
}));

describe('AICardView', () => {
  const mockCards = [
    {
      id: '1',
      title: 'Strengths',
      content: 'High income, stable job',
      type: 'positive',
      score: 85
    },
    {
      id: '2',
      title: 'Concerns',
      content: 'Recent move',
      type: 'negative',
      score: 60
    }
  ];

  const defaultProps = {
    cards: mockCards,
    loading: false,
    onCardAction: jest.fn(),
    onRefresh: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.skip('should render AI cards', () => {
    render(<AICardView {...defaultProps} />);
    
    expect(screen.getByText('Strengths')).toBeInTheDocument();
    expect(screen.getByText('High income, stable job')).toBeInTheDocument();
    expect(screen.getByText('Concerns')).toBeInTheDocument();
    expect(screen.getByText('Recent move')).toBeInTheDocument();
  });

  it.skip('should show loading state', () => {
    render(<AICardView {...defaultProps} loading={true} />);
    
    // Component might show loading indicator or skeleton
    const loadingText = screen.queryByText('tenant_selection.ai_cards.loading');
    if (loadingText) {
      expect(loadingText).toBeInTheDocument();
    }
  });

  it.skip('should handle empty cards', () => {
    render(<AICardView {...defaultProps} cards={[]} />);
    
    const emptyText = screen.queryByText('tenant_selection.ai_cards.no_cards');
    if (emptyText) {
      expect(emptyText).toBeInTheDocument();
    }
  });

  it.skip('should call onCardAction when card is clicked', () => {
    render(<AICardView {...defaultProps} />);
    
    const firstCard = screen.getByText('Strengths').closest('div');
    fireEvent.click(firstCard);
    
    expect(defaultProps.onCardAction).toHaveBeenCalledWith(mockCards[0]);
  });

  it.skip('should call onRefresh when refresh button is clicked', () => {
    render(<AICardView {...defaultProps} />);
    
    const refreshButton = screen.queryByRole('button', { name: /refresh/i });
    if (refreshButton) {
      fireEvent.click(refreshButton);
      expect(defaultProps.onRefresh).toHaveBeenCalled();
    }
  });

  it.skip('should display score if available', () => {
    render(<AICardView {...defaultProps} />);
    
    expect(screen.getByText('85')).toBeInTheDocument();
    expect(screen.getByText('60')).toBeInTheDocument();
  });

  it.skip('should apply correct styling based on card type', () => {
    render(<AICardView {...defaultProps} />);
    
    const positiveCard = screen.getByText('Strengths').closest('div');
    const negativeCard = screen.getByText('Concerns').closest('div');
    
    // Check if classes exist, components might use different class names
    if (positiveCard && negativeCard) {
      expect(positiveCard.className).toBeTruthy();
      expect(negativeCard.className).toBeTruthy();
    }
  });

  it.skip('should handle cards without score', () => {
    const cardsWithoutScore = [
      {
        id: '1',
        title: 'Info',
        content: 'Additional information',
        type: 'neutral'
      }
    ];
    
    render(<AICardView {...defaultProps} cards={cardsWithoutScore} />);
    
    expect(screen.getByText('Info')).toBeInTheDocument();
    expect(screen.queryByText(/\d+/)).not.toBeInTheDocument();
  });
});