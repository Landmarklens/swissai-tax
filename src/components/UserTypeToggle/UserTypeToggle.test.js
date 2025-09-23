import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import UserTypeToggle from './UserTypeToggle';

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: jest.fn(),
      language: 'en'
    }
  })
}));

// Mock useMediaQuery to simulate desktop view
jest.mock('@mui/material/useMediaQuery', () => ({
  __esModule: true,
  default: jest.fn(() => false) // Return false to simulate desktop
}));

const theme = createTheme();

describe('UserTypeToggle', () => {
  const mockOnChange = jest.fn();

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders without crashing', () => {
    render(
      <ThemeProvider theme={theme}>
        <UserTypeToggle userType="tenant" onUserTypeChange={mockOnChange} />
      </ThemeProvider>
    );
  });

  it('displays translation keys for tenant and landlord options', () => {
    render(
      <ThemeProvider theme={theme}>
        <UserTypeToggle userType="tenant" onUserTypeChange={mockOnChange} />
      </ThemeProvider>
    );

    // Check for either toggle button text or switch text
    const tenantText = screen.queryByText("I'm looking to rent") || screen.queryByText("Tenant");
    const landlordText = screen.queryByText("I'm a landlord") || screen.queryByText("Landlord");

    expect(tenantText).toBeInTheDocument();
    expect(landlordText).toBeInTheDocument();
  });

  it('calls onUserTypeChange when clicking landlord option', () => {
    render(
      <ThemeProvider theme={theme}>
        <UserTypeToggle userType="tenant" onUserTypeChange={mockOnChange} />
      </ThemeProvider>
    );

    // Handle both toggle button and switch
    const landlordButton = screen.queryByText("I'm a landlord")?.closest('button');
    const switchElement = screen.queryByRole('checkbox');

    if (landlordButton) {
      fireEvent.click(landlordButton);
    } else if (switchElement) {
      fireEvent.click(switchElement);
    }

    expect(mockOnChange).toHaveBeenCalledWith('landlord');
  });

  it('calls onUserTypeChange when clicking tenant option', () => {
    render(
      <ThemeProvider theme={theme}>
        <UserTypeToggle userType="landlord" onUserTypeChange={mockOnChange} />
      </ThemeProvider>
    );

    // Handle both toggle button and switch
    const tenantButton = screen.queryByText("I'm looking to rent")?.closest('button');
    const switchElement = screen.queryByRole('checkbox');

    if (tenantButton) {
      fireEvent.click(tenantButton);
    } else if (switchElement) {
      fireEvent.click(switchElement);
    }

    expect(mockOnChange).toHaveBeenCalledWith('tenant');
  });

  it('renders null when userType is not provided', () => {
    // Suppress warning for this test since we're testing missing props
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(
      <ThemeProvider theme={theme}>
        <UserTypeToggle onUserTypeChange={mockOnChange} />
      </ThemeProvider>
    );
    expect(container.firstChild).toBeNull();
    consoleWarn.mockRestore();
  });

  it('renders null when onUserTypeChange is not provided', () => {
    // Suppress warning for this test since we're testing missing props
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(
      <ThemeProvider theme={theme}>
        <UserTypeToggle userType="tenant" />
      </ThemeProvider>
    );
    expect(container.firstChild).toBeNull();
    consoleWarn.mockRestore();
  });
});