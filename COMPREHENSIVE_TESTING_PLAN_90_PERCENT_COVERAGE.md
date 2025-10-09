# Comprehensive Testing Plan to Achieve 90% Coverage
## SwissAI Tax Application - Backend & Frontend

**Document Version:** 1.0
**Created:** 2025-10-08
**Target Coverage:** 90% for Backend and Frontend
**Estimated Timeline:** 8 weeks

---

## Executive Summary

### Current State
- **Backend Coverage:** 62.78% (Target: 90%)
  - 47 failing tests to fix
  - 46 files with <50% coverage
  - Critical gaps in AI services, tax calculation, PDF generation

- **Frontend Coverage:** 5.87% (Target: 90%)
  - 333 files (89%) with 0% coverage
  - Test configuration issues (tests exist but don't execute)
  - Critical gaps in services, store slices, pages

### Success Criteria
- ✅ Backend: 90%+ coverage with 0 failing tests
- ✅ Frontend: 90%+ coverage across all categories
- ✅ CI/CD pipeline with coverage gates
- ✅ All critical business paths tested
- ✅ Integration and E2E tests for major flows

---

## Table of Contents

1. [Phase 1: Foundation & Configuration](#phase-1-foundation--configuration)
2. [Phase 2: Backend Critical Coverage](#phase-2-backend-critical-coverage)
3. [Phase 3: Frontend Critical Coverage](#phase-3-frontend-critical-coverage)
4. [Phase 4: Integration & Edge Cases](#phase-4-integration--edge-cases)
5. [Testing Infrastructure Setup](#testing-infrastructure-setup)
6. [File-by-File Testing Checklist](#file-by-file-testing-checklist)
7. [CI/CD Integration](#cicd-integration)
8. [Maintenance & Best Practices](#maintenance--best-practices)

---

## Phase 1: Foundation & Configuration
**Timeline:** Week 1
**Goal:** Fix infrastructure, setup, and failing tests

### 1.1 Backend Foundation (Days 1-3)

#### Fix Failing Tests (47 tests)
```bash
Priority Order:
1. test_two_factor_router.py (11 failures) - Security critical
2. test_tax_filing_router.py (14 failures) - Core functionality
3. test_auth_2fa.py (5 failures) - Authentication
4. utils/test_encryption_bugs.py (5 failures) - Data security
5. test_tax_insight_service.py (3 failures)
6. test_two_factor_service.py (3 failures)
7. test_validators.py (1 failure)
```

**Actions:**
- [ ] Run each failing test suite individually
- [ ] Identify root causes (dependencies, mocking, async issues)
- [ ] Fix or update tests to match current implementation
- [ ] Ensure all tests pass before proceeding

#### Setup Coverage Reporting
```bash
# backend/pytest.ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts =
    --cov=.
    --cov-report=html
    --cov-report=term-missing
    --cov-report=json
    --cov-fail-under=90
    -v
```

- [ ] Create pytest.ini configuration
- [ ] Setup HTML coverage reports
- [ ] Configure coverage thresholds per module
- [ ] Document how to run coverage locally

### 1.2 Frontend Foundation (Days 4-7)

#### Fix Test Configuration Issues
**Problem:** Test files exist but show 0% coverage

**Root Cause Investigation:**
```javascript
Potential Issues:
1. Tests not running (skipped/disabled)
2. Import paths incorrect
3. Over-mocking (tests run but don't execute actual code)
4. Coverage tool not tracking properly
```

**Actions:**
- [ ] Audit existing test files (34 tests)
- [ ] Verify imports in test files match source files
- [ ] Check for `.skip()` or disabled tests
- [ ] Review mocking strategy (reduce aggressive mocking)
- [ ] Run tests with `--verbose --coverage` to see execution

#### Update Jest Configuration
```javascript
// package.json or jest.config.js
{
  "jest": {
    "collectCoverageFrom": [
      "src/**/*.{js,jsx,ts,tsx}",
      "!src/**/*.test.{js,jsx,ts,tsx}",
      "!src/index.js",
      "!src/reportWebVitals.js"
    ],
    "coverageThreshold": {
      "global": {
        "statements": 90,
        "branches": 90,
        "functions": 90,
        "lines": 90
      }
    },
    "coverageReporters": ["text", "lcov", "html"],
    "setupFilesAfterEnv": ["<rootDir>/src/setupTests.js"]
  }
}
```

- [ ] Create/update Jest configuration
- [ ] Setup coverage thresholds (start at 20%, increase weekly)
- [ ] Configure coverage reporters (HTML + terminal)
- [ ] Setup test utilities and helpers

#### Create Testing Utilities
```javascript
// src/testUtils/index.js
- Mock Redux store helper
- Mock React Router helper
- Mock API responses helper
- Render component with providers helper
- Mock localStorage/sessionStorage
- Mock window.location, window.navigator
```

- [ ] Create `src/testUtils/` directory
- [ ] Build reusable test helpers
- [ ] Document testing patterns and examples

---

## Phase 2: Backend Critical Coverage
**Timeline:** Weeks 2-4
**Goal:** Bring backend from 63% to 90%

### 2.1 Services Layer (Week 2)

#### Priority 1: AI Services (0% coverage → 90%)

**File:** `services/ai_document_intelligence_service.py` (206 lines)
- [ ] Test document upload and parsing
- [ ] Test AI extraction of tax-relevant data
- [ ] Test error handling for malformed documents
- [ ] Test integration with OpenAI/LLM service
- [ ] Mock external API calls
- [ ] Test different document types (PDF, images, etc.)

**File:** `services/ai_tax_optimization_service.py` (153 lines)
- [ ] Test optimization suggestions generation
- [ ] Test canton-specific optimization logic
- [ ] Test deduction recommendations
- [ ] Test risk scoring algorithms
- [ ] Mock AI service responses
- [ ] Test edge cases (no optimizations available)

#### Priority 2: Core Tax Services (8-15% → 90%)

**File:** `services/tax_calculation_service.py` (193 lines, 8.81%)
- [ ] Test federal tax calculation
- [ ] Test cantonal tax calculation
- [ ] Test municipal tax calculation
- [ ] Test progressive tax brackets
- [ ] Test deduction calculations
- [ ] Test married vs single filing
- [ ] Test edge cases (zero income, negative values)
- [ ] Test rounding and precision

**File:** `services/interview_service.py` (201 lines, 13.93%)
- [ ] Test session creation and initialization
- [ ] Test question flow logic
- [ ] Test answer validation and storage
- [ ] Test conditional question branching
- [ ] Test session save/restore
- [ ] Test interview completion logic
- [ ] Test data transformation for filing

**File:** `services/enhanced_tax_calculation_service.py`
- [ ] Test enhanced calculation algorithms
- [ ] Test multi-canton scenarios
- [ ] Test comparison and optimization
- [ ] Test integration with base tax service

#### Priority 3: PDF Generation (15-25% → 90%)

**File:** `services/pdf_generators/ech0196_pdf_generator.py` (218 lines, 15.14%)
- [ ] Test ECH-0196 XML generation
- [ ] Test PDF rendering from XML
- [ ] Test field mapping and validation
- [ ] Test Swiss tax form standards compliance
- [ ] Test multi-page documents
- [ ] Test special characters and encoding
- [ ] Mock PDF library calls

**File:** `services/pdf_generators/unified_pdf_generator.py`
- [ ] Test unified PDF creation
- [ ] Test template selection
- [ ] Test data population
- [ ] Test signature and watermark handling

**File:** `services/pdf_generators/traditional_pdf_filler.py`
- [ ] Test traditional form filling
- [ ] Test canton-specific forms
- [ ] Test field positioning and formatting

### 2.2 Routers Layer (Week 3)

#### Priority 1: Tax Filing Endpoints (39% → 90%)

**File:** `routers/tax_filing.py` (166 lines, 39.16%)
- [ ] Test POST /filings - create new filing
- [ ] Test GET /filings - list user filings
- [ ] Test GET /filings/{id} - get specific filing
- [ ] Test PUT /filings/{id} - update filing
- [ ] Test DELETE /filings/{id} - delete filing
- [ ] Test POST /filings/{id}/submit - submit filing
- [ ] Test authentication requirements
- [ ] Test authorization (user can only access own filings)
- [ ] Test validation errors
- [ ] Test database constraints

#### Priority 2: PDF Generation Endpoints (25% → 90%)

**File:** `routers/pdf_generation.py` (177 lines, 25.42%)
- [ ] Test POST /pdf/generate - generate PDF
- [ ] Test GET /pdf/{id} - retrieve PDF
- [ ] Test POST /pdf/preview - preview PDF
- [ ] Test PDF download endpoint
- [ ] Test error handling (invalid data, generation failure)
- [ ] Test file size limits
- [ ] Test concurrent generation requests

#### Priority 3: User Data & Settings (31-26% → 90%)

**File:** `routers/user_data.py` (85 lines, 31.76%)
- [ ] Test GET /user/data - get user data
- [ ] Test PUT /user/data - update user data
- [ ] Test POST /user/data/export - export data (GDPR)
- [ ] Test DELETE /user/data - delete account
- [ ] Test data encryption in transit
- [ ] Test authorization checks

**File:** `routers/swisstax/settings.py` (50 lines, 26%)
- [ ] Test GET /settings - get user settings
- [ ] Test PUT /settings - update settings
- [ ] Test settings validation
- [ ] Test default settings creation

#### Priority 4: Security Endpoints (34% → 90%)

**File:** `routers/two_factor.py` (100 lines, 34%)
- [ ] Test POST /2fa/enable - enable 2FA
- [ ] Test POST /2fa/disable - disable 2FA
- [ ] Test POST /2fa/verify - verify 2FA code
- [ ] Test QR code generation
- [ ] Test backup codes generation
- [ ] Test rate limiting on verification
- [ ] Test invalid code handling

**File:** `routers/auth.py` (authentication endpoints)
- [ ] Test POST /auth/register
- [ ] Test POST /auth/login
- [ ] Test POST /auth/logout
- [ ] Test POST /auth/refresh-token
- [ ] Test POST /auth/forgot-password
- [ ] Test POST /auth/reset-password
- [ ] Test password validation
- [ ] Test email verification flow

### 2.3 Additional Services (Week 4)

**Files to test:**
- [ ] `services/data_export_service.py` (155 lines, 17.42%)
- [ ] `services/background_jobs.py` (113 lines, 20.35%)
- [ ] `services/postal_code_service.py` (83 lines, 20.48%)
- [ ] `services/s3_storage_service.py` (128 lines, 21.88%)
- [ ] `services/document_service.py` (122 lines, 22.95%)
- [ ] `services/filing_orchestration_service.py`
- [ ] `services/gdpr_email_service.py`
- [ ] `services/ses_emailjs_replacement.py`

---

## Phase 3: Frontend Critical Coverage
**Timeline:** Weeks 5-7
**Goal:** Bring frontend from 6% to 90%

### 3.1 Services Layer (Week 5)

#### Priority 1: API Service (0% → 90%)

**File:** `src/services/api.js` (Core API client)
```javascript
Test Coverage:
- [ ] API request/response interceptors
- [ ] Authentication token injection
- [ ] Error handling and retry logic
- [ ] Request cancellation
- [ ] Base URL configuration
- [ ] Timeout handling
- [ ] Mock axios for all tests
```

#### Priority 2: Business Logic Services (0% → 90%)

**File:** `src/services/filingService.js`
```javascript
- [ ] createFiling()
- [ ] updateFiling()
- [ ] submitFiling()
- [ ] getFilingStatus()
- [ ] listFilings()
- [ ] deleteFiling()
- [ ] Error handling for each method
- [ ] API integration (mocked)
```

**File:** `src/services/profileService.js`
```javascript
- [ ] getUserProfile()
- [ ] updateProfile()
- [ ] uploadAvatar()
- [ ] Validation logic
- [ ] Data transformation
```

**File:** `src/services/dashboardService.js`
```javascript
- [ ] getDashboardData()
- [ ] getFilingStatistics()
- [ ] getRecentActivity()
- [ ] Data aggregation logic
```

**File:** `src/services/paymentService.js`
```javascript
- [ ] initiatePayment()
- [ ] processPayment()
- [ ] getPaymentHistory()
- [ ] Stripe integration (mocked)
- [ ] Error handling
```

**File:** `src/services/subscriptionService.js`
```javascript
- [ ] getSubscriptionPlans()
- [ ] subscribe()
- [ ] cancelSubscription()
- [ ] updateSubscription()
- [ ] Check subscription status
```

**File:** `src/services/documentStorageService.js`
```javascript
- [ ] uploadDocument()
- [ ] downloadDocument()
- [ ] deleteDocument()
- [ ] listDocuments()
- [ ] S3 integration (mocked)
```

**File:** `src/services/userService.js`
```javascript
- [ ] getUserData()
- [ ] updateUserData()
- [ ] exportUserData()
- [ ] deleteUserAccount()
```

### 3.2 Store/State Management (Week 5-6)

#### Fix Existing Tests (0% coverage despite having test files)

**Investigation Required:**
1. Why do these show 0% coverage when tests exist?
   - `authSlice.test.js` exists but `authSlice.js` shows 0%
   - `counterSlice.test.js` exists but `counterSlice.js` shows 0%
   - `planSlice.test.js`, `profileSlice.test.js`, etc.

**Action Plan:**
- [ ] Run tests individually: `npm test -- authSlice.test.js --coverage`
- [ ] Check if tests are actually executing code or just mocking
- [ ] Verify imports are correct
- [ ] Ensure coverage tool is tracking the slice files

#### Priority Slices to Test/Fix

**File:** `src/store/slices/authSlice.js` (0% → 90%)
```javascript
Test Coverage:
- [ ] Initial state
- [ ] login action + reducer
- [ ] logout action + reducer
- [ ] register action + reducer
- [ ] updateUser action + reducer
- [ ] Async thunks (login, register, etc.)
- [ ] Error handling in thunks
- [ ] Selectors (selectUser, selectIsAuthenticated, etc.)
- [ ] Token storage/retrieval
```

**File:** `src/store/slices/taxFilingSlice.js` (0% → 90%)
```javascript
- [ ] Initial state
- [ ] createFiling thunk
- [ ] updateFiling thunk
- [ ] submitFiling thunk
- [ ] getFiling thunk
- [ ] Reducers for all actions
- [ ] Loading states
- [ ] Error states
- [ ] Selectors
```

**File:** `src/store/slices/profileSlice.js` (0% → 90%)
```javascript
- [ ] getProfile thunk
- [ ] updateProfile thunk
- [ ] Upload avatar thunk
- [ ] State updates
- [ ] Error handling
```

**File:** `src/store/slices/dashboardSlice.js` (0% → 90%)
```javascript
- [ ] getDashboardData thunk
- [ ] State management
- [ ] Data transformation
- [ ] Selectors
```

**File:** `src/store/slices/documentsSlice.js` (0% → 90%)
```javascript
- [ ] uploadDocument thunk
- [ ] listDocuments thunk
- [ ] deleteDocument thunk
- [ ] State updates
- [ ] File management logic
```

**Additional Slices:**
- [ ] `analyticsSlice.js`
- [ ] `notesSlice.js`
- [ ] `stepper.js`
- [ ] `userSlice.js`
- [ ] `counterSlice.js` (fix existing test)
- [ ] `planSlice.js` (fix existing test)
- [ ] `teamSlice.js` (fix existing test)
- [ ] `testimonialSlice.js` (fix existing test)
- [ ] `conversationsSlice.js`
- [ ] `chatSlice.js`
- [ ] `viewingSlice.js`

### 3.3 Pages & Components (Week 6-7)

#### Critical Pages (0% → 90%)

**File:** `src/pages/Dashboard/Dashboard.jsx`
```javascript
Test Coverage:
- [ ] Renders without crashing
- [ ] Displays user statistics
- [ ] Shows filing status cards
- [ ] Displays recent activity
- [ ] Navigation to tax filing
- [ ] Loading states
- [ ] Error states
- [ ] User interactions (button clicks, navigation)
- [ ] Mock Redux store with test data
```

**File:** `src/pages/TaxFiling/TaxFilingPage.jsx`
```javascript
- [ ] Renders interview questions
- [ ] Handles user input
- [ ] Navigation between questions
- [ ] Progress indicator
- [ ] Save draft functionality
- [ ] Submit filing functionality
- [ ] Validation errors display
- [ ] Loading states
```

**File:** `src/pages/Documents/Documents.jsx`
```javascript
- [ ] Renders document list
- [ ] Upload document functionality
- [ ] Download document
- [ ] Delete document
- [ ] Empty state
- [ ] Loading state
- [ ] Error handling
```

**File:** `src/pages/Billing/Billing.jsx`
```javascript
- [ ] Displays subscription info
- [ ] Payment history
- [ ] Upgrade/downgrade subscription
- [ ] Payment method management
- [ ] Invoice download
```

**File:** `src/pages/Profile/Profile.jsx`
```javascript
- [ ] Displays user information
- [ ] Edit profile form
- [ ] Avatar upload
- [ ] Form validation
- [ ] Save changes
- [ ] Success/error messages
```

**File:** `src/pages/Settings/Settings.jsx`
```javascript
- [ ] Displays settings sections
- [ ] Toggle 2FA
- [ ] Change password
- [ ] Email preferences
- [ ] Delete account
- [ ] Confirmation modals
```

**Additional Pages:**
- [ ] `Homepage/Homepage.js`
- [ ] `FAQ/FAQ.jsx`
- [ ] `Features/Features.jsx`
- [ ] `HowItWork/HowItWork.jsx`
- [ ] `About/About.jsx`
- [ ] `Contact/Contact.jsx`
- [ ] `Layout/Layout.jsx`

#### Critical Components

**Tax Filing Components:**
- [ ] `components/TaxFiling/QuestionCard.js`
- [ ] `components/Interview/QuestionCard.js`
- [ ] `components/Interview/ProfileSummary.js`
- [ ] `components/Interview/DocumentChecklist.js`

**Dashboard Components:**
- [ ] `components/MultiCantonDashboard/MultiCantonDashboard.js`
- [ ] `components/MultiCantonDashboard/FilingCard.js`
- [ ] `components/MultiCantonDashboard/TaxSummaryCard.js`
- [ ] `components/MultiCantonDashboard/DocumentUploadPanel.js`
- [ ] `components/MultiCantonDashboard/OptimizationPanel.js`

**Authentication Components:**
- [ ] `components/Auth/TaxLoginModal.js`
- [ ] `components/TwoFactor/TwoFactorSettings.jsx` (test exists, needs fix)
- [ ] `components/TwoFactor/TwoFactorVerifyModal.test.jsx` (test exists)

**Payment Components:**
- [ ] `components/paymentForm/PaymentForm.jsx`

**Analytics Components:**
- [ ] `components/Analytics/AIAnalyticsDashboard.jsx`
- [ ] `components/Analytics/EnhancedAIAnalyticsDashboard.jsx`

**Header/Navigation:**
- [ ] `components/loggedInHeader/ProfileDropdown.jsx`

### 3.4 Hooks (Week 7)

**Existing Hooks with Tests (verify they work):**
- [x] `useChatStorage.js` (100% - verify)
- [x] `useSteps.js` (100% - verify)
- [x] `useTokenFromQuery.js` (100% - verify)
- [x] `useAuth.js` (has test - verify coverage)

**Hooks Needing Tests:**
- [ ] `useAnalytics.js`
- [ ] `useHover.js`
- [ ] `useOptimized.js`
- [ ] `useUserType.js`
- [ ] `useValidation.js`
- [ ] `useWebVitals.js`
- [ ] `useUserCounter/index.js`
- [ ] `useLandlordCounter/index.js`
- [ ] `useRandomUserCounter/index.js`
- [ ] `useHideSearchedProperty/index.js`
- [ ] `useWindowSize/index.js`

---

## Phase 4: Integration & Edge Cases
**Timeline:** Week 8
**Goal:** End-to-end testing and edge case coverage

### 4.1 Backend Integration Tests

#### Multi-Service Integration
```python
# tests/integration/test_tax_filing_flow.py
- [ ] Complete tax filing flow
  - User login
  - Create filing session
  - Answer interview questions
  - Calculate taxes
  - Generate PDF
  - Submit filing
  - Verify data persistence
```

#### Database Integration
```python
# tests/integration/test_database_operations.py
- [ ] CRUD operations for all models
- [ ] Transaction rollback scenarios
- [ ] Concurrent access handling
- [ ] Foreign key constraints
- [ ] Data encryption/decryption
```

#### External Service Integration
```python
# tests/integration/test_external_services.py
- [ ] S3 storage operations (use LocalStack or mocks)
- [ ] Email sending (SES/SendGrid with mocks)
- [ ] Stripe payment processing (test mode)
- [ ] OpenAI API calls (mocked)
```

### 4.2 Frontend Integration Tests

#### User Flow Tests (React Testing Library)
```javascript
// src/__tests__/integration/TaxFilingFlow.test.js
- [ ] Complete tax filing user journey
  - Login
  - Navigate to new filing
  - Fill interview questions
  - Review summary
  - Submit filing
  - View confirmation
```

#### Authentication Flow
```javascript
// src/__tests__/integration/AuthFlow.test.js
- [ ] Register new user
- [ ] Login
- [ ] Enable 2FA
- [ ] Logout and login with 2FA
- [ ] Password reset flow
```

#### Payment Flow
```javascript
// src/__tests__/integration/PaymentFlow.test.js
- [ ] Select subscription plan
- [ ] Enter payment details
- [ ] Process payment
- [ ] Confirmation and receipt
```

### 4.3 E2E Tests (Cypress - Optional but Recommended)

#### Setup Cypress
```bash
npm install --save-dev cypress @testing-library/cypress
```

#### Critical E2E Scenarios
```javascript
// cypress/e2e/tax-filing.cy.js
- [ ] Complete tax filing from login to submission
- [ ] Document upload and PDF generation
- [ ] Multi-canton filing scenario

// cypress/e2e/authentication.cy.js
- [ ] Registration and email verification
- [ ] Login with 2FA
- [ ] Password reset

// cypress/e2e/payment.cy.js
- [ ] Subscription purchase (test mode)
- [ ] Plan upgrade/downgrade
```

---

## Testing Infrastructure Setup

### Backend Testing Infrastructure

#### 1. Test Database Setup
```python
# backend/tests/conftest.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from database.base import Base

@pytest.fixture(scope="session")
def test_db():
    # Use in-memory SQLite or test PostgreSQL
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    yield engine
    Base.metadata.drop_all(engine)

@pytest.fixture(scope="function")
def db_session(test_db):
    Session = sessionmaker(bind=test_db)
    session = Session()
    yield session
    session.rollback()
    session.close()
```

#### 2. Mock External Services
```python
# backend/tests/mocks/
- aws_mock.py (S3, SES, Secrets Manager)
- stripe_mock.py
- openai_mock.py
- pdf_generator_mock.py
```

#### 3. Test Data Fixtures
```python
# backend/tests/fixtures/
- user_fixtures.py (test users, accounts)
- filing_fixtures.py (sample tax filings)
- document_fixtures.py (test PDFs, images)
```

### Frontend Testing Infrastructure

#### 1. Test Utilities
```javascript
// src/testUtils/renderWithProviders.js
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';

export function renderWithProviders(
  ui,
  {
    preloadedState = {},
    store = configureStore({ reducer: rootReducer, preloadedState }),
    ...renderOptions
  } = {}
) {
  function Wrapper({ children }) {
    return (
      <Provider store={store}>
        <BrowserRouter>
          {children}
        </BrowserRouter>
      </Provider>
    );
  }
  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
```

#### 2. Mock Services
```javascript
// src/__mocks__/
- api.js (mock axios)
- firebase.js (mock Firebase auth)
- stripe.js (mock Stripe)
- localStorage.js
```

#### 3. Test Data Factories
```javascript
// src/testUtils/factories/
- userFactory.js (create test users)
- filingFactory.js (create test filings)
- documentFactory.js (create test documents)
```

#### 4. Setup File
```javascript
// src/setupTests.js
import '@testing-library/jest-dom';
import { server } from './mocks/server';

// MSW (Mock Service Worker) for API mocking
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});
```

---

## File-by-File Testing Checklist

### Backend Files Requiring Tests

#### Services (Priority Order)

**0% Coverage - CRITICAL:**
- [ ] `services/ai_document_intelligence_service.py` (206 lines)
- [ ] `services/ai_tax_optimization_service.py` (153 lines)

**<25% Coverage - HIGH PRIORITY:**
- [ ] `services/tax_calculation_service.py` (193 lines, 8.81%)
- [ ] `services/interview_service.py` (201 lines, 13.93%)
- [ ] `services/pdf_generators/ech0196_pdf_generator.py` (218 lines, 15.14%)
- [ ] `services/data_export_service.py` (155 lines, 17.42%)
- [ ] `services/background_jobs.py` (113 lines, 20.35%)
- [ ] `services/postal_code_service.py` (83 lines, 20.48%)
- [ ] `services/s3_storage_service.py` (128 lines, 21.88%)
- [ ] `services/document_service.py` (122 lines, 22.95%)

**25-50% Coverage - MEDIUM PRIORITY:**
- [ ] `services/tax_filing_service.py`
- [ ] `services/filing_orchestration_service.py`
- [ ] `services/user_service.py`
- [ ] `services/pdf_generators/unified_pdf_generator.py`
- [ ] `services/pdf_generators/traditional_pdf_filler.py`
- [ ] `services/enhanced_tax_calculation_service.py`
- [ ] `services/tax_insight_service.py`
- [ ] `services/ech0196_service.py`
- [ ] `services/user_deletion_service.py`
- [ ] `services/gdpr_email_service.py`
- [ ] `services/ses_emailjs_replacement.py`
- [ ] `services/stripe_mock_service.py`

**Canton Tax Calculators:**
- [ ] `services/canton_tax_calculators/zurich.py`
- [ ] `services/canton_tax_calculators/geneva.py`
- [ ] `services/canton_tax_calculators/vaud.py`
- [ ] `services/canton_tax_calculators/bern.py`
- [ ] `services/canton_tax_calculators/basel_stadt.py`
- [ ] `services/canton_tax_calculators/base.py`

#### Routers (Priority Order)

**<40% Coverage - HIGH PRIORITY:**
- [ ] `routers/pdf_generation.py` (177 lines, 25.42%)
- [ ] `routers/swisstax/settings.py` (50 lines, 26%)
- [ ] `routers/user_data.py` (85 lines, 31.76%)
- [ ] `routers/two_factor.py` (100 lines, 34%)
- [ ] `routers/tax_filing.py` (166 lines, 39.16%)

**50-70% Coverage - MEDIUM PRIORITY:**
- [ ] `routers/auth.py`
- [ ] `routers/interview.py`
- [ ] `routers/documents.py`
- [ ] `routers/document_intelligence.py`
- [ ] `routers/insights.py`
- [ ] `routers/multi_canton_filing.py`
- [ ] `routers/tax_calculation.py`
- [ ] `routers/tax_optimization.py`
- [ ] `routers/user_counter.py`
- [ ] `routers/user.py`
- [ ] `routers/audit_logs.py`
- [ ] `routers/swisstax/profile.py`
- [ ] `routers/swisstax/dashboard.py`
- [ ] `api/documents.py`

#### Utils (Priority Order)

**<40% Coverage:**
- [ ] `utils/token.py` (20 lines, 0%)
- [ ] `utils/password.py` (17 lines, 17.65%)
- [ ] `utils/validators.py` (147 lines, 36.73%)
- [ ] `utils/aws_secrets.py` (103 lines, 39.81%)

**40-70% Coverage:**
- [ ] `utils/encryption.py`
- [ ] `utils/json_encryption.py`
- [ ] `utils/config.py`
- [ ] `utils/auth.py`
- [ ] `utils/pdf_helpers.py`

### Frontend Files Requiring Tests

#### Services (All 0% except authService and twoFactorService)

**CRITICAL - Core Business Logic:**
- [ ] `services/api.js` (0%)
- [ ] `services/filingService.js` (0%)
- [ ] `services/profileService.js` (0%)
- [ ] `services/dashboardService.js` (0%)
- [ ] `services/paymentService.js` (0%)
- [ ] `services/subscriptionService.js` (0%)
- [ ] `services/documentStorageService.js` (0%)
- [ ] `services/userService.js` (0%)

**Infrastructure:**
- [ ] `services/awsParameterStore.js` (0%)
- [ ] `services/configService.js` (0%)
- [ ] `services/enhancedLoggingService.js` (0%)
- [ ] `services/loggingService.js` (0%)
- [ ] `services/settingsService.js` (0%)

**Supporting:**
- [ ] `services/faqService.js` (0%)
- [ ] `services/googleMapsLoader.js` (0%)
- [ ] `services/locationMap.js` (0%)
- [ ] `services/transformToArray.js` (0%)

**Already Tested:**
- [x] `services/authService.js` (72.26%)
- [x] `services/twoFactorService.js` (98.18%)

#### Store Slices (Nearly all 0%)

**CRITICAL - Fix existing tests showing 0% coverage:**
- [ ] `store/slices/authSlice.js` (0% - TEST EXISTS!)
- [ ] `store/slices/counterSlice.js` (0% - TEST EXISTS!)
- [ ] `store/slices/planSlice.js` (0% - TEST EXISTS!)
- [ ] `store/slices/profileSlice.js` (0% - TEST EXISTS!)
- [ ] `store/slices/teamSlice.js` (0% - TEST EXISTS!)
- [ ] `store/slices/testimonialSlice.js` (0% - TEST EXISTS!)
- [ ] `store/slices/chatSlice.js` (0% - TEST EXISTS!)
- [ ] `store/slices/conversationsSlice.js` (0% - TEST EXISTS!)
- [ ] `store/slices/viewingSlice.js` (0% - TEST EXISTS!)
- [ ] `store/slices/tenantSelectionSlice.js` (0% - TEST EXISTS!)

**Create new tests:**
- [ ] `store/index.js` (0%)
- [ ] `store/reducer.js` (0%)
- [ ] `store/slices/analyticsSlice.js` (0%)
- [ ] `store/slices/dashboardSlice.js` (0%)
- [ ] `store/slices/documentsSlice.js` (0%)
- [ ] `store/slices/notesSlice.js` (0%)
- [ ] `store/slices/stepper.js` (0%)
- [ ] `store/slices/taxFilingSlice.js` (0%)
- [ ] `store/slices/userSlice.js` (0%)

**Already Tested:**
- [x] `store/slices/accountSlice.js` (100%)

#### Pages (92% with 0% coverage)

**CRITICAL User Flows:**
- [ ] `pages/Dashboard/Dashboard.jsx` (0%)
- [ ] `pages/TaxFiling/TaxFilingPage.jsx` (0%)
- [ ] `pages/Documents/Documents.jsx` (0%)
- [ ] `pages/Billing/Billing.jsx` (0%)
- [ ] `pages/Profile/Profile.jsx` (0%)
- [ ] `pages/Settings/Settings.jsx` (0%)

**Already Tested:**
- [x] `pages/ForgotPassword/ForgotPassword.jsx` (82.14%)
- [x] `pages/ResetPassword/ResetPassword.jsx` (95.65%)
- [x] `pages/TaxFiling/InterviewPage.js` (74.38%)

**Marketing/Public Pages (Lower Priority):**
- [ ] `pages/Homepage/Homepage.js` (0%)
- [ ] `pages/FAQ/FAQ.jsx` (0%)
- [ ] `pages/Features/Features.jsx` (0%)
- [ ] `pages/HowItWork/HowItWork.jsx` (0%)
- [ ] `pages/About/About.jsx` (0%)
- [ ] `pages/Contact/Contact.jsx` (0%)
- [ ] `pages/Layout/Layout.jsx` (0%)
- [ ] `pages/BlogList/BlogList.jsx` (0%)
- [ ] `pages/GoogleCallback/GoogleCallback.jsx` (0%)
- [ ] `pages/NotFound/NotFound.jsx` (0%)

#### Components (94% with 0% coverage)

**Tax Filing Components - CRITICAL:**
- [ ] `components/TaxFiling/QuestionCard.js`
- [ ] `components/Interview/QuestionCard.js`
- [ ] `components/Interview/ProfileSummary.js`
- [ ] `components/Interview/DocumentChecklist.js`

**Dashboard Components - HIGH PRIORITY:**
- [ ] `components/MultiCantonDashboard/MultiCantonDashboard.js`
- [ ] `components/MultiCantonDashboard/FilingCard.js`
- [ ] `components/MultiCantonDashboard/TaxSummaryCard.js`
- [ ] `components/MultiCantonDashboard/DocumentUploadPanel.js`
- [ ] `components/MultiCantonDashboard/OptimizationPanel.js`

**Authentication - HIGH PRIORITY:**
- [ ] `components/Auth/TaxLoginModal.js`
- [ ] `components/TwoFactor/TwoFactorSettings.jsx` (has test)
- [ ] `components/TwoFactor/TwoFactorVerifyModal.test.jsx` (has test)

**Payment - HIGH PRIORITY:**
- [ ] `components/paymentForm/PaymentForm.jsx`

**Analytics:**
- [ ] `components/Analytics/AIAnalyticsDashboard.jsx`
- [ ] `components/Analytics/EnhancedAIAnalyticsDashboard.jsx`

**Navigation:**
- [ ] `components/loggedInHeader/ProfileDropdown.jsx`

**UI Components (157 total - lower priority, focus on complex/critical ones)**

#### Hooks

**Already Tested (verify coverage):**
- [x] `hooks/useChatStorage.js` (100%)
- [x] `hooks/useSteps.js` (100%)
- [x] `hooks/useTokenFromQuery.js` (100%)
- [x] `hooks/useAuth.js` (test exists)

**Need Tests:**
- [ ] `hooks/useAnalytics.js`
- [ ] `hooks/useHover.js`
- [ ] `hooks/useOptimized.js`
- [ ] `hooks/useUserType.js`
- [ ] `hooks/useValidation.js`
- [ ] `hooks/useWebVitals.js`
- [ ] `hooks/useUserCounter/index.js`
- [ ] `hooks/useLandlordCounter/index.js`
- [ ] `hooks/useRandomUserCounter/index.js`
- [ ] `hooks/useHideSearchedProperty/index.js`
- [ ] `hooks/useWindowSize/index.js`

#### Utils (65% with <50% coverage)

**Need Tests:**
- [ ] `utils/capitalizeFirstLetter.js` (has test - verify)
- [ ] `utils/createIdFromAddress.js` (has test - verify)
- [ ] `utils/numberFormatter.js` (has test - verify)
- [ ] `utils/queryParamValue.js` (has test - verify)
- [ ] `utils/localStorage/getLocalStorageUser.js` (has test - verify)
- [ ] `utils/groupByStepAndInsights.js` (has test - verify)
- [ ] `utils/date/formatToAmPm.js` (has test - verify)
- [ ] `utils/removeWhitespace.js` (has test - verify)
- [ ] `utils/string/truncateText.js` (has test - verify)

---

## CI/CD Integration

### GitHub Actions Workflow

Create `.github/workflows/test-coverage.yml`:

```yaml
name: Test Coverage

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  backend-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_DB: test_swissai_tax
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Set up Python 3.11
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt

      - name: Run tests with coverage
        env:
          DATABASE_URL: postgresql://test_user:test_password@localhost/test_swissai_tax
        run: |
          cd backend
          pytest --cov=. --cov-report=xml --cov-report=term-missing --cov-fail-under=90

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage.xml
          flags: backend
          name: backend-coverage

  frontend-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests with coverage
        run: npm test -- --coverage --watchAll=false --coverageThreshold='{"global":{"statements":90,"branches":90,"functions":90,"lines":90}}'

      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
          flags: frontend
          name: frontend-coverage

  coverage-report:
    needs: [backend-tests, frontend-tests]
    runs-on: ubuntu-latest

    steps:
      - name: Comment PR with coverage
        uses: codecov/codecov-action@v3
        with:
          token: ${{ secrets.CODECOV_TOKEN }}
```

### Pre-commit Hook

Create `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run backend tests
echo "Running backend tests..."
cd backend && pytest --cov=. --cov-fail-under=90 || exit 1

# Run frontend tests
echo "Running frontend tests..."
cd .. && npm test -- --coverage --watchAll=false --passWithNoTests || exit 1

echo "All tests passed! ✅"
```

### Coverage Badges

Add to `README.md`:

```markdown
[![Backend Coverage](https://codecov.io/gh/your-org/swissai-tax/branch/main/graph/badge.svg?flag=backend)](https://codecov.io/gh/your-org/swissai-tax)
[![Frontend Coverage](https://codecov.io/gh/your-org/swissai-tax/branch/main/graph/badge.svg?flag=frontend)](https://codecov.io/gh/your-org/swissai-tax)
```

---

## Maintenance & Best Practices

### Testing Guidelines

#### Backend Testing Best Practices

1. **Follow AAA Pattern (Arrange-Act-Assert)**
```python
def test_tax_calculation():
    # Arrange
    user = create_test_user()
    filing_data = get_test_filing_data()

    # Act
    result = calculate_tax(user, filing_data)

    # Assert
    assert result.federal_tax == 5000
    assert result.cantonal_tax == 3000
```

2. **Use Fixtures for Common Setup**
```python
@pytest.fixture
def authenticated_user(db_session):
    user = User(email="test@example.com")
    db_session.add(user)
    db_session.commit()
    return user
```

3. **Mock External Dependencies**
```python
@patch('services.ai_service.openai_client')
def test_ai_optimization(mock_openai):
    mock_openai.return_value = {"optimization": "max_deductions"}
    result = get_tax_optimization()
    assert result == "max_deductions"
```

4. **Test Edge Cases and Error Paths**
```python
def test_negative_income_raises_error():
    with pytest.raises(ValidationError):
        calculate_tax(income=-1000)
```

#### Frontend Testing Best Practices

1. **Test User Interactions, Not Implementation**
```javascript
test('submits form when valid data entered', async () => {
  const { getByLabelText, getByRole } = render(<LoginForm />);

  await userEvent.type(getByLabelText(/email/i), 'user@test.com');
  await userEvent.type(getByLabelText(/password/i), 'password123');
  await userEvent.click(getByRole('button', { name: /login/i }));

  expect(screen.getByText(/welcome/i)).toBeInTheDocument();
});
```

2. **Use Testing Library Queries Properly**
```javascript
// Prefer accessible queries
✅ getByRole('button', { name: /submit/i })
✅ getByLabelText(/email/i)
❌ getByTestId('submit-button')
```

3. **Mock API Calls with MSW**
```javascript
import { rest } from 'msw';
import { server } from './mocks/server';

server.use(
  rest.post('/api/filings', (req, res, ctx) => {
    return res(ctx.json({ id: 1, status: 'submitted' }));
  })
);
```

4. **Test Loading and Error States**
```javascript
test('shows loading spinner while fetching data', () => {
  render(<Dashboard />);
  expect(screen.getByRole('progressbar')).toBeInTheDocument();
});

test('shows error message when API fails', async () => {
  server.use(
    rest.get('/api/dashboard', (req, res, ctx) => {
      return res(ctx.status(500));
    })
  );

  render(<Dashboard />);
  expect(await screen.findByText(/error loading/i)).toBeInTheDocument();
});
```

### Code Coverage Thresholds

**Global Minimum (enforced in CI):**
- Statements: 90%
- Branches: 90%
- Functions: 90%
- Lines: 90%

**Per-Module Thresholds:**
```json
{
  "coverageThreshold": {
    "global": {
      "statements": 90,
      "branches": 90,
      "functions": 90,
      "lines": 90
    },
    "./src/services/": {
      "statements": 95,
      "branches": 95
    },
    "./src/store/slices/": {
      "statements": 95
    },
    "./backend/services/": {
      "statements": 95
    },
    "./backend/routers/": {
      "statements": 90
    }
  }
}
```

### Documentation Requirements

For each tested module, include:
1. **Purpose:** What the code does
2. **Test Coverage:** What scenarios are tested
3. **Known Limitations:** What's not tested and why
4. **Examples:** How to use the module

---

## Progress Tracking

### Week 1 Checklist

**Backend:**
- [ ] Fix all 47 failing tests
- [ ] Setup pytest.ini with coverage config
- [ ] Create conftest.py with fixtures
- [ ] Document test running process

**Frontend:**
- [ ] Investigate 0% coverage issue
- [ ] Update Jest configuration
- [ ] Create testUtils helpers
- [ ] Fix or update existing 34 tests

### Week 2 Checklist (Backend Services)

- [ ] AI Document Intelligence Service (0% → 90%)
- [ ] AI Tax Optimization Service (0% → 90%)
- [ ] Tax Calculation Service (9% → 90%)
- [ ] Interview Service (14% → 90%)
- [ ] Enhanced Tax Calculation Service

### Week 3 Checklist (Backend Routers)

- [ ] Tax Filing Router (39% → 90%)
- [ ] PDF Generation Router (25% → 90%)
- [ ] User Data Router (32% → 90%)
- [ ] Two Factor Router (34% → 90%)
- [ ] Settings Router (26% → 90%)
- [ ] Auth Router

### Week 4 Checklist (Backend Additional)

- [ ] Data Export Service (17% → 90%)
- [ ] Background Jobs (20% → 90%)
- [ ] Postal Code Service (20% → 90%)
- [ ] S3 Storage Service (22% → 90%)
- [ ] Document Service (23% → 90%)
- [ ] Canton Tax Calculators
- [ ] Utils modules

### Week 5 Checklist (Frontend Services & Store)

**Services:**
- [ ] api.js (0% → 90%)
- [ ] filingService.js (0% → 90%)
- [ ] profileService.js (0% → 90%)
- [ ] dashboardService.js (0% → 90%)
- [ ] paymentService.js (0% → 90%)
- [ ] subscriptionService.js (0% → 90%)
- [ ] documentStorageService.js (0% → 90%)
- [ ] userService.js (0% → 90%)

**Store Slices (Fix Existing Tests):**
- [ ] authSlice.js
- [ ] taxFilingSlice.js
- [ ] profileSlice.js
- [ ] dashboardSlice.js
- [ ] documentsSlice.js

### Week 6 Checklist (Frontend Pages)

- [ ] Dashboard.jsx (0% → 90%)
- [ ] TaxFilingPage.jsx (0% → 90%)
- [ ] Documents.jsx (0% → 90%)
- [ ] Billing.jsx (0% → 90%)
- [ ] Profile.jsx (0% → 90%)
- [ ] Settings.jsx (0% → 90%)

### Week 7 Checklist (Frontend Components & Hooks)

**Components:**
- [ ] TaxFiling/QuestionCard.js
- [ ] Interview components (3 files)
- [ ] MultiCantonDashboard components (5 files)
- [ ] Auth/TaxLoginModal.js
- [ ] PaymentForm.jsx
- [ ] Analytics dashboards (2 files)

**Hooks:**
- [ ] Fix/verify existing hook tests (4 files)
- [ ] Add tests for remaining hooks (7 files)

### Week 8 Checklist (Integration & E2E)

**Backend Integration:**
- [ ] Tax filing flow test
- [ ] Database operations test
- [ ] External services test

**Frontend Integration:**
- [ ] Tax filing user journey
- [ ] Authentication flow
- [ ] Payment flow

**E2E (Optional):**
- [ ] Setup Cypress
- [ ] Critical user flows (3 scenarios)

---

## Success Metrics

### Coverage Targets

**By End of Week 4 (Backend):**
- Overall: 90%+
- Services: 95%+
- Routers: 90%+
- Models: Maintain 79%+
- Utils: 90%+

**By End of Week 7 (Frontend):**
- Overall: 90%+
- Services: 95%+
- Store Slices: 95%+
- Pages: 85%+
- Components: 85%+
- Hooks: 90%+
- Utils: 90%+

### Quality Metrics

- [ ] Zero failing tests
- [ ] All critical paths tested
- [ ] All edge cases covered
- [ ] Integration tests for major flows
- [ ] CI/CD pipeline with coverage gates
- [ ] Coverage reports generated automatically
- [ ] Documentation for running tests

---

## Resources & Training

### Recommended Reading

**Backend (Python/FastAPI):**
- pytest documentation
- FastAPI testing guide
- SQLAlchemy testing patterns
- Mock and patch best practices

**Frontend (React/Jest):**
- React Testing Library docs
- Jest documentation
- Testing Redux toolkit
- MSW (Mock Service Worker) guide
- Cypress documentation

### Team Training Sessions

**Week 1:**
- Testing fundamentals
- AAA pattern
- Mocking strategies

**Week 3:**
- Integration testing
- Test data management
- Debugging tests

**Week 5:**
- React component testing
- Redux testing patterns
- Async testing

**Week 7:**
- E2E testing with Cypress
- Coverage analysis
- Test maintenance

---

## Appendix: Testing Templates

### Backend Service Test Template

```python
# tests/test_example_service.py
import pytest
from services.example_service import ExampleService

class TestExampleService:
    """Tests for ExampleService"""

    @pytest.fixture
    def service(self):
        return ExampleService()

    @pytest.fixture
    def sample_data(self):
        return {"key": "value"}

    def test_success_scenario(self, service, sample_data):
        """Test successful operation"""
        result = service.process(sample_data)
        assert result.success is True
        assert result.data == expected_data

    def test_validation_error(self, service):
        """Test validation error handling"""
        with pytest.raises(ValidationError):
            service.process(invalid_data)

    @patch('services.example_service.external_api')
    def test_external_api_call(self, mock_api, service):
        """Test external API integration"""
        mock_api.return_value = {"status": "ok"}
        result = service.fetch_data()
        assert result == {"status": "ok"}
        mock_api.assert_called_once()
```

### Backend Router Test Template

```python
# tests/test_example_router.py
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

class TestExampleRouter:
    """Tests for example router endpoints"""

    def test_get_endpoint_success(self, authenticated_user):
        """Test GET endpoint with valid auth"""
        response = client.get(
            "/api/resource",
            headers={"Authorization": f"Bearer {authenticated_user.token}"}
        )
        assert response.status_code == 200
        assert response.json()["data"] is not None

    def test_post_endpoint_validation_error(self):
        """Test POST endpoint with invalid data"""
        response = client.post("/api/resource", json={"invalid": "data"})
        assert response.status_code == 422
        assert "validation" in response.json()["detail"]

    def test_unauthorized_access(self):
        """Test endpoint requires authentication"""
        response = client.get("/api/resource")
        assert response.status_code == 401
```

### Frontend Component Test Template

```javascript
// src/components/Example/Example.test.js
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '../../testUtils/renderWithProviders';
import Example from './Example';

describe('Example Component', () => {
  it('renders without crashing', () => {
    renderWithProviders(<Example />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('handles user interaction', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Example />);

    const button = screen.getByRole('button', { name: /click me/i });
    await user.click(button);

    expect(screen.getByText(/clicked/i)).toBeInTheDocument();
  });

  it('displays loading state', () => {
    renderWithProviders(<Example loading={true} />);
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('displays error state', () => {
    const error = 'Something went wrong';
    renderWithProviders(<Example error={error} />);
    expect(screen.getByText(error)).toBeInTheDocument();
  });
});
```

### Frontend Service Test Template

```javascript
// src/services/exampleService.test.js
import exampleService from './exampleService';
import api from './api';

jest.mock('./api');

describe('exampleService', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getData', () => {
    it('fetches data successfully', async () => {
      const mockData = { id: 1, name: 'Test' };
      api.get.mockResolvedValue({ data: mockData });

      const result = await exampleService.getData(1);

      expect(api.get).toHaveBeenCalledWith('/api/data/1');
      expect(result).toEqual(mockData);
    });

    it('handles API errors', async () => {
      api.get.mockRejectedValue(new Error('API Error'));

      await expect(exampleService.getData(1)).rejects.toThrow('API Error');
    });
  });

  describe('createData', () => {
    it('creates data successfully', async () => {
      const newData = { name: 'New Item' };
      const createdData = { id: 1, ...newData };
      api.post.mockResolvedValue({ data: createdData });

      const result = await exampleService.createData(newData);

      expect(api.post).toHaveBeenCalledWith('/api/data', newData);
      expect(result).toEqual(createdData);
    });
  });
});
```

### Frontend Store Slice Test Template

```javascript
// src/store/slices/exampleSlice.test.js
import exampleReducer, {
  fetchData,
  updateData,
  selectData,
  selectLoading,
} from './exampleSlice';
import { configureStore } from '@reduxjs/toolkit';

describe('exampleSlice', () => {
  let store;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        example: exampleReducer,
      },
    });
  });

  it('should handle initial state', () => {
    const state = store.getState().example;
    expect(state.data).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should handle fetchData pending', () => {
    store.dispatch(fetchData.pending());
    const state = store.getState().example;
    expect(state.loading).toBe(true);
  });

  it('should handle fetchData fulfilled', () => {
    const mockData = [{ id: 1, name: 'Test' }];
    store.dispatch(fetchData.fulfilled(mockData));

    const state = store.getState().example;
    expect(state.loading).toBe(false);
    expect(state.data).toEqual(mockData);
  });

  it('should handle fetchData rejected', () => {
    const error = 'Failed to fetch';
    store.dispatch(fetchData.rejected(new Error(error)));

    const state = store.getState().example;
    expect(state.loading).toBe(false);
    expect(state.error).toBe(error);
  });

  describe('selectors', () => {
    it('selectData returns data', () => {
      const mockData = [{ id: 1 }];
      const state = { example: { data: mockData, loading: false, error: null } };
      expect(selectData(state)).toEqual(mockData);
    });

    it('selectLoading returns loading state', () => {
      const state = { example: { data: [], loading: true, error: null } };
      expect(selectLoading(state)).toBe(true);
    });
  });
});
```

---

## Conclusion

This comprehensive testing plan provides a structured approach to achieving 90% test coverage for both the backend and frontend of the SwissAI Tax application. By following this plan over 8 weeks, the development team will:

1. **Establish a solid testing foundation** with proper configuration and infrastructure
2. **Systematically increase coverage** across all critical components
3. **Implement CI/CD quality gates** to maintain coverage standards
4. **Build confidence** in code quality and deployment reliability
5. **Reduce production bugs** through comprehensive test coverage
6. **Improve code maintainability** with tests serving as living documentation

Remember: **Coverage is a metric, not a goal**. Focus on writing meaningful tests that validate business logic, edge cases, and user flows. Quality over quantity.

---

**Next Steps:**
1. Review this plan with the development team
2. Adjust timelines based on team capacity
3. Assign ownership for each phase
4. Begin Week 1 foundation work
5. Track progress using the weekly checklists
6. Hold weekly review meetings to address blockers

Good luck! 🚀
