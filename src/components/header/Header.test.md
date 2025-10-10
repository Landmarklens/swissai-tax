# Header Component Test Documentation

## Overview
Comprehensive unit tests for the Header component, specifically covering the bug fix for mobile login functionality.

## Test File Location
`src/components/header/Header.test.jsx`

## What Was Fixed
**Bug**: Mobile login button was calling `handleClickOpen` (undefined prop) instead of `handleLoginClick` (local function)
**Fix**: Updated mobile login button to use `handleLoginClick`

## Test Coverage

### Desktop View Tests
1. ✓ Renders login button when user is not authenticated
2. ✓ Renders account icon when user is authenticated
3. ✓ Opens login modal when clicking Log In button
4. ✓ Clears localStorage (except input) when opening login modal

### Mobile View Tests (PRIMARY FIX VALIDATION)
1. ✓ Renders mobile menu button
2. ✓ Opens drawer when clicking menu button
3. ✓ Shows login button in mobile drawer when not authenticated
4. ✓ **Opens login modal when clicking Log In in mobile drawer** ← KEY TEST
5. ✓ Does not show login button in mobile drawer when authenticated

### Get Started Button Tests
1. ✓ Navigates to /chat when user is authenticated
2. ✓ Opens login modal when user is not authenticated

### Login Modal Management Tests
1. ✓ Closes modal properly when onClose is called

### Navigation Menu Tests
1. ✓ Renders all navigation links on desktop
2. ✓ Navigation links have correct href attributes

### Logo Tests
1. ✓ Renders SwissTax logo with link to home

## Running the Tests

```bash
# Run all tests
npm test

# Run only Header tests
npm test Header.test.jsx

# Run with coverage
npm test -- --coverage --collectCoverageFrom="src/components/header/Header.jsx"
```

## Dependencies Mocked
- `authService` - Authentication service
- `react-i18next` - Translation hooks
- `react-router-dom` - Navigation hooks (useNavigate, useLocation, useSearchParams)
- `react-toastify` - Toast notifications
- `LoginSignupModal` - Login modal component
- `LanguageSelector` - Language selection component
- `PersonalAccountIcon` - User account icon component

## Key Assertions

### Mobile Login Button Test (Line 160-176)
```javascript
it('should open login modal when clicking Log In in mobile drawer', () => {
  authService.isAuthenticated.mockReturnValue(false);
  renderHeader(true);

  // Open drawer
  const menuButton = screen.getByLabelText('menu');
  fireEvent.click(menuButton);

  // Click login button in drawer
  const loginButtons = screen.getAllByRole('button', { name: 'Log In' });
  const drawerLoginButton = loginButtons[loginButtons.length - 1];
  fireEvent.click(drawerLoginButton);

  // Modal should open - THIS VALIDATES THE FIX
  expect(screen.getByTestId('login-modal')).toBeInTheDocument();
});
```

## Test Statistics
- **Total Test Suites**: 7 (Desktop, Mobile, Get Started, Modal Management, Navigation, Logo)
- **Total Tests**: 15
- **Lines of Code**: 282

## Notes
- Tests use React Testing Library for component rendering and user interactions
- Tests follow existing project patterns (see TwoFactorVerifyModal.test.jsx)
- Mobile view is simulated using mocked `useMediaQuery` hook
- All tests are isolated with proper cleanup in `beforeEach`
