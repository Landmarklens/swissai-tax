import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import ApplicationCard from '../ApplicationCard';
import tenantSelectionReducer from '../../../../../store/slices/tenantSelectionSlice';

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => {
      const translations = {
        'Viewing Requested': 'Viewing Requested',
        'Anonymous': 'Anonymous',
      };
      return translations[key] || key;
    }
  }),
}));

// Mock MUI components
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  Tooltip: ({ children, title }) => <div title={title}>{children}</div>,
}));

// Mock icons
jest.mock('@mui/icons-material', () => ({
  Email: () => <div>Email</div>,
  Phone: () => <div>Phone</div>,
  CalendarToday: () => <div>Calendar</div>,
  LocationOn: () => <div>Location</div>,
  Home: () => <div>Home</div>,
  Work: () => <div>Work</div>,
  AccountBalance: () => <div>AccountBalance</div>,
  FamilyRestroom: () => <div>Family</div>,
  Pets: () => <div>Pets</div>,
  Smoking: () => <div>Smoking</div>,
  Schedule: () => <div>Schedule</div>,
  CheckCircle: () => <div>CheckCircle</div>,
  Cancel: () => <div>Cancel</div>,
  Visibility: () => <div>Visibility</div>,
  VisibilityOff: () => <div>VisibilityOff</div>,
  Star: () => <div>Star</div>,
}));

describe('ApplicationCard Component', () => {
  let store;
  
  const mockApplication = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+41791234567',
    status: 'viewing_requested',
    source_portal: 'homegate',
    score: 85,  // Changed from soft_score to score
    hard_filter_passed: true,
    created_at: '2024-08-23T10:00:00Z',
    viewing_scheduled_at: '2024-08-25T14:00:00Z',
    dossier_submitted_at: '2024-08-22T15:00:00Z',
    ai_extracted_data: {
      household_size: 2,
      has_pets: false,
      is_smoker: false,
      employment_status: 'employed',
      move_in_date: '2024-09-01',
      income: 120000,
      credit_score: 750,
    },
  };

  beforeEach(() => {
    store = configureStore({
      reducer: {
        tenantSelection: tenantSelectionReducer,
      },
      preloadedState: {
        tenantSelection: {
          leads: [mockApplication],
          filters: {},
          selectedLeads: [],
          loading: false,
          error: null,
        },
      },
    });
  });

  test('renders application card with basic information', () => {
    render(
      <Provider store={store}>
        <ApplicationCard lead={mockApplication} />
      </Provider>
    );

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
    expect(screen.getByText('+41791234567')).toBeInTheDocument();
    expect(screen.getByText('85')).toBeInTheDocument(); // score
  });

  test('displays correct status badge', () => {
    render(
      <Provider store={store}>
        <ApplicationCard lead={mockApplication} />
      </Provider>
    );

    expect(screen.getByText('Viewing Requested')).toBeInTheDocument();
  });

  test('shows source portal icon', () => {
    render(
      <Provider store={store}>
        <ApplicationCard lead={mockApplication} />
      </Provider>
    );

    // The component shows an emoji icon, not text
    expect(screen.getByText('🏠')).toBeInTheDocument();
  });

  test('handles selection toggle', () => {
    const onSelect = jest.fn();
    
    render(
      <Provider store={store}>
        <ApplicationCard 
          lead={mockApplication} 
          onSelect={onSelect}
          selected={false}
        />
      </Provider>
    );

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);
    
    expect(onSelect).toHaveBeenCalled();
  });

  test('handles missing data gracefully', () => {
    const minimalApp = {
      id: '123',
      name: 'Jane Doe',
      email: 'jane@example.com',
      status: 'viewing_requested',
      created_at: '2024-08-23T10:00:00Z',
    };

    render(
      <Provider store={store}>
        <ApplicationCard lead={minimalApp} />
      </Provider>
    );

    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('jane@example.com')).toBeInTheDocument();
    // Component doesn't show "N/A" for missing score, it just doesn't render the score
  });

  test('displays anonymous when name is missing', () => {
    const anonymousApp = {
      id: '456',
      email: 'anon@example.com',
      status: 'viewing_requested',
      score: 70,
      created_at: '2024-08-23T10:00:00Z',
    };

    render(
      <Provider store={store}>
        <ApplicationCard lead={anonymousApp} />
      </Provider>
    );

    expect(screen.getByText('Anonymous')).toBeInTheDocument();
    expect(screen.getByText('anon@example.com')).toBeInTheDocument();
  });
});