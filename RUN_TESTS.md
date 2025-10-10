# Quick Test Runner Guide

## Backend Tests

### Run All Subscription Tests
```bash
cd backend
pytest tests/test_subscription_models.py tests/test_stripe_service.py tests/test_subscription_router.py tests/test_webhook_handler.py -v
```

### Run Individual Test Files
```bash
# Model tests
pytest tests/test_subscription_models.py -v

# Stripe service tests
pytest tests/test_stripe_service.py -v

# API endpoint tests (NEW)
pytest tests/test_subscription_router.py -v

# Webhook handler tests (NEW)
pytest tests/test_webhook_handler.py -v
```

### Run Specific Test Class
```bash
pytest tests/test_subscription_router.py::TestSetupIntentEndpoint -v
pytest tests/test_webhook_handler.py::TestSubscriptionCreatedEvent -v
```

### Run With Coverage
```bash
pytest --cov=models/swisstax --cov=services --cov=routers/swisstax --cov-report=html tests/
```

View coverage report: `open htmlcov/index.html`

---

## Frontend Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Files
```bash
# SubscriptionPlans component tests (UPDATED)
npm test SubscriptionPlans.test.jsx

# PaymentForm component tests
npm test PaymentForm.test.jsx

# Subscription service tests (NEW)
npm test subscriptionService.test.js
```

### Run With Coverage
```bash
npm test -- --coverage --watchAll=false
```

### Watch Mode (for development)
```bash
npm test -- --watch
```

---

## Quick Verification

### Backend (should show 100+ tests passing)
```bash
cd backend
pytest tests/ -k "subscription or stripe or webhook" --tb=short -q
```

### Frontend (should show 120+ tests passing)
```bash
npm test -- --watchAll=false --passWithNoTests=false
```

---

## Debugging Failed Tests

### Backend
```bash
# Run with verbose output
pytest tests/test_subscription_router.py -vv

# Run with print statements visible
pytest tests/test_subscription_router.py -s

# Run and drop into debugger on failure
pytest tests/test_subscription_router.py --pdb
```

### Frontend
```bash
# Run in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand SubscriptionPlans.test.jsx

# Run single test
npm test -- -t "should render all 4 subscription plans"
```

---

## Common Issues

### Backend

**Issue**: `ModuleNotFoundError: No module named 'stripe'`
```bash
cd backend
pip install -r requirements.txt
```

**Issue**: Database errors
```bash
# Make sure migrations are up to date
alembic upgrade head
```

### Frontend

**Issue**: `Cannot find module 'react-testing-library'`
```bash
npm install
```

**Issue**: Mock not working
- Ensure mocks are at the top of the test file
- Clear mocks in `beforeEach()`: `jest.clearAllMocks()`

---

## Pre-Deployment Checklist

Run this before deploying:

```bash
# Backend tests
cd backend
pytest tests/ --cov=. --cov-report=term-missing

# Frontend tests
cd ..
npm test -- --coverage --watchAll=false

# Verify all tests pass
echo "✅ All tests passed! Ready to deploy."
```

---

## CI/CD Integration

Tests will run automatically on:
- Every push to `main` branch
- Every pull request
- Before deployment

Monitor test results in GitHub Actions or your CI/CD platform.
