# Security & Performance Improvements Implementation Guide

## Overview
This document outlines the implementation plan for four key improvements to the SwissAI Tax application:
1. Migration from localStorage to httpOnly cookies
2. Comprehensive input validation
3. Improved error messages
4. React.memo optimization for heavy components

---

## 1. Migration from localStorage to httpOnly Cookies

### Current State
- Authentication tokens stored in `localStorage`
- Vulnerable to XSS attacks
- Token accessible via JavaScript
- Files affected: 37 files using localStorage

### Implementation Plan

#### Backend Changes (Python/FastAPI)

##### 1.1 Update Authentication Router (`backend/routers/auth.py`)

**Add Cookie Configuration:**
```python
from fastapi import Response, Cookie
from datetime import datetime, timedelta

COOKIE_SETTINGS = {
    "httponly": True,
    "secure": True,  # HTTPS only in production
    "samesite": "lax",
    "max_age": 60 * 60 * 24 * 7,  # 7 days
    "domain": None  # Set to .swissai.tax in production
}
```

**Update Login Endpoint:**
```python
@router.post("/login")
async def login(credentials: LoginCredentials, response: Response):
    # ... existing authentication logic ...

    # Set httpOnly cookie instead of returning token in body
    response.set_cookie(
        key="access_token",
        value=f"Bearer {access_token}",
        **COOKIE_SETTINGS
    )

    # Return user data without token
    return {
        "user": user_data,
        "success": True
    }
```

**Add Logout Endpoint:**
```python
@router.post("/logout")
async def logout(response: Response):
    response.delete_cookie(key="access_token")
    return {"message": "Logged out successfully"}
```

**Update Token Extraction:**
```python
# backend/core/security.py
from fastapi import Cookie, HTTPException

async def get_current_user(
    access_token: str = Cookie(None, alias="access_token")
):
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    # Remove "Bearer " prefix if present
    token = access_token.replace("Bearer ", "")

    # Verify token and return user
    return verify_token(token)
```

##### 1.2 Update CORS Configuration (`backend/main.py`)

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://swissai.tax",
        "https://www.swissai.tax"
    ],
    allow_credentials=True,  # CRITICAL: Allow cookies
    allow_methods=["*"],
    allow_headers=["*"],
)
```

##### 1.3 Update All Protected Endpoints

Replace:
```python
async def endpoint(current_user: User = Depends(get_current_user_from_header)):
```

With:
```python
async def endpoint(current_user: User = Depends(get_current_user)):
```

#### Frontend Changes (React)

##### 1.4 Update Axios Configuration (`src/services/api.js`)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE_URL || 'https://api.swissai.tax',
  timeout: 30000,
  withCredentials: true, // CRITICAL: Send cookies with requests
  headers: {
    'Content-Type': 'application/json',
  },
});

// REMOVE the token interceptor - cookies are sent automatically
api.interceptors.request.use(
  (config) => {
    // No longer need to manually add Authorization header
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Update response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear any remaining localStorage
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

##### 1.5 Update Auth Service (`src/services/authService.js`)

```javascript
class AuthService {
  constructor() {
    this.user = null;
  }

  // Store only non-sensitive user data in localStorage
  setCurrentUser(user) {
    this.user = user;
    if (user) {
      // Store user profile data (no tokens)
      const { access_token, token_type, ...userData } = user;
      localStorage.setItem('user', JSON.stringify(userData));
    } else {
      localStorage.removeItem('user');
    }
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (e) {
        console.error('Failed to parse user from localStorage', e);
        return null;
      }
    }
    return null;
  }

  // Token is now in httpOnly cookie - no need to check it client-side
  async checkAuth() {
    try {
      const response = await api.get('/api/user/me');
      this.setCurrentUser(response.data);
      return true;
    } catch (error) {
      this.setCurrentUser(null);
      return false;
    }
  }

  async logout() {
    try {
      await api.post('/api/auth/logout');
      this.setCurrentUser(null);
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local state anyway
      this.setCurrentUser(null);
      throw error;
    }
  }
}

export default new AuthService();
```

##### 1.6 Migration Strategy

**Phase 1: Backend Updates**
1. Add cookie-based authentication endpoints (keep old ones)
2. Deploy backend changes
3. Test with Postman/curl

**Phase 2: Frontend Updates**
1. Update api.js with withCredentials
2. Update authService.js
3. Remove token from localStorage writes
4. Test authentication flow

**Phase 3: Cleanup**
1. Remove old token-based endpoints
2. Clear localStorage tokens for existing users
3. Update documentation

**Migration Script for Users:**
```javascript
// src/utils/migrateAuth.js
export const migrateTocookieAuth = async () => {
  const token = localStorage.getItem('authToken');
  const userStr = localStorage.getItem('user');

  if (token || userStr) {
    try {
      // Make a request to re-authenticate and set cookie
      const user = JSON.parse(userStr);
      if (user?.access_token) {
        // Call a migration endpoint that accepts token and sets cookie
        await api.post('/api/auth/migrate-to-cookie', {
          token: user.access_token
        });
      }
    } catch (error) {
      console.error('Migration failed:', error);
    } finally {
      // Clean up old tokens
      localStorage.removeItem('authToken');
      const user = JSON.parse(userStr);
      if (user) {
        delete user.access_token;
        delete user.token_type;
        localStorage.setItem('user', JSON.stringify(user));
      }
    }
  }
};
```

---

## 2. Comprehensive Input Validation

### Implementation Plan

#### 2.1 Install Validation Libraries

```bash
npm install yup
```

#### 2.2 Create Validation Schemas (`src/utils/validation/schemas.js`)

```javascript
import * as Yup from 'yup';

// Email validation
export const emailSchema = Yup.string()
  .email('validation.email.invalid')
  .required('validation.email.required')
  .max(255, 'validation.email.tooLong');

// Password validation
export const passwordSchema = Yup.string()
  .required('validation.password.required')
  .min(8, 'validation.password.tooShort')
  .matches(/[a-z]/, 'validation.password.lowercase')
  .matches(/[A-Z]/, 'validation.password.uppercase')
  .matches(/[0-9]/, 'validation.password.number')
  .matches(/[^a-zA-Z0-9]/, 'validation.password.special');

// Swiss AHV/AVS number validation (756.XXXX.XXXX.XX)
export const ahvSchema = Yup.string()
  .matches(/^756\.\d{4}\.\d{4}\.\d{2}$/, 'validation.ahv.invalid')
  .required('validation.ahv.required');

// Swiss phone number validation
export const phoneSchema = Yup.string()
  .matches(/^(\+41|0041|0)[1-9]\d{8}$/, 'validation.phone.invalid')
  .required('validation.phone.required');

// Swiss postal code validation
export const postalCodeSchema = Yup.string()
  .matches(/^\d{4}$/, 'validation.postalCode.invalid')
  .required('validation.postalCode.required');

// Tax amount validation
export const taxAmountSchema = Yup.number()
  .positive('validation.amount.positive')
  .max(10000000, 'validation.amount.tooLarge')
  .required('validation.amount.required');

// Registration form schema
export const registrationSchema = Yup.object().shape({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'validation.password.match')
    .required('validation.confirmPassword.required'),
  firstName: Yup.string()
    .required('validation.firstName.required')
    .min(2, 'validation.firstName.tooShort')
    .max(50, 'validation.firstName.tooLong'),
  lastName: Yup.string()
    .required('validation.lastName.required')
    .min(2, 'validation.lastName.tooShort')
    .max(50, 'validation.lastName.tooLong'),
  acceptTerms: Yup.boolean()
    .oneOf([true], 'validation.terms.required')
});

// Login form schema
export const loginSchema = Yup.object().shape({
  email: emailSchema,
  password: Yup.string().required('validation.password.required')
});

// Tax profile schema
export const taxProfileSchema = Yup.object().shape({
  ahv: ahvSchema,
  canton: Yup.string()
    .required('validation.canton.required')
    .oneOf(['ZH', 'BE', 'LU', 'UR', 'SZ', 'OW', 'NW', 'GL', 'ZG', 'FR', 'SO', 'BS', 'BL', 'SH', 'AR', 'AI', 'SG', 'GR', 'AG', 'TG', 'TI', 'VD', 'VS', 'NE', 'GE', 'JU']),
  municipality: Yup.string()
    .required('validation.municipality.required')
    .min(2, 'validation.municipality.tooShort'),
  postalCode: postalCodeSchema,
  annualIncome: taxAmountSchema,
  maritalStatus: Yup.string()
    .required('validation.maritalStatus.required')
    .oneOf(['single', 'married', 'divorced', 'widowed'])
});

// File upload validation
export const fileUploadSchema = Yup.object().shape({
  file: Yup.mixed()
    .required('validation.file.required')
    .test('fileSize', 'validation.file.tooLarge', (value) => {
      return value && value.size <= 10 * 1024 * 1024; // 10MB
    })
    .test('fileType', 'validation.file.invalidType', (value) => {
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      return value && allowedTypes.includes(value.type);
    })
});
```

#### 2.3 Create Validation Hook (`src/hooks/useValidation.js`)

```javascript
import { useState } from 'react';

export const useValidation = (schema) => {
  const [errors, setErrors] = useState({});

  const validate = async (data) => {
    try {
      await schema.validate(data, { abortEarly: false });
      setErrors({});
      return true;
    } catch (err) {
      const validationErrors = {};
      err.inner.forEach((error) => {
        validationErrors[error.path] = error.message;
      });
      setErrors(validationErrors);
      return false;
    }
  };

  const validateField = async (fieldName, value) => {
    try {
      await schema.validateAt(fieldName, { [fieldName]: value });
      setErrors((prev) => ({ ...prev, [fieldName]: null }));
      return true;
    } catch (err) {
      setErrors((prev) => ({ ...prev, [fieldName]: err.message }));
      return false;
    }
  };

  const clearErrors = () => setErrors({});

  return { errors, validate, validateField, clearErrors };
};
```

#### 2.4 Backend Validation (`backend/utils/validators.py`)

```python
from pydantic import BaseModel, validator, Field
from typing import Optional
import re

class EmailValidator:
    @staticmethod
    def validate(email: str) -> str:
        pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(pattern, email):
            raise ValueError("Invalid email format")
        return email.lower()

class PasswordValidator:
    @staticmethod
    def validate(password: str) -> str:
        if len(password) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r'[a-z]', password):
            raise ValueError("Password must contain lowercase letter")
        if not re.search(r'[A-Z]', password):
            raise ValueError("Password must contain uppercase letter")
        if not re.search(r'[0-9]', password):
            raise ValueError("Password must contain number")
        if not re.search(r'[^a-zA-Z0-9]', password):
            raise ValueError("Password must contain special character")
        return password

class SwissValidators:
    @staticmethod
    def validate_ahv(ahv: str) -> str:
        """Validate Swiss AHV/AVS number"""
        pattern = r'^756\.\d{4}\.\d{4}\.\d{2}$'
        if not re.match(pattern, ahv):
            raise ValueError("Invalid AHV number format")
        return ahv

    @staticmethod
    def validate_postal_code(postal_code: str) -> str:
        """Validate Swiss postal code"""
        if not re.match(r'^\d{4}$', postal_code):
            raise ValueError("Invalid postal code")
        return postal_code

    @staticmethod
    def validate_phone(phone: str) -> str:
        """Validate Swiss phone number"""
        pattern = r'^(\+41|0041|0)[1-9]\d{8}$'
        if not re.match(pattern, phone):
            raise ValueError("Invalid Swiss phone number")
        return phone

class UserRegistration(BaseModel):
    email: str
    password: str
    first_name: str = Field(..., min_length=2, max_length=50)
    last_name: str = Field(..., min_length=2, max_length=50)

    @validator('email')
    def validate_email(cls, v):
        return EmailValidator.validate(v)

    @validator('password')
    def validate_password(cls, v):
        return PasswordValidator.validate(v)
```

---

## 3. Improved Error Messages

### Implementation Plan

#### 3.1 Create Error Translation Keys (`src/locales/en/errors.json`)

```json
{
  "network": {
    "timeout": "Request timed out. Please check your connection and try again.",
    "offline": "You appear to be offline. Please check your internet connection.",
    "serverError": "Server error occurred. Our team has been notified."
  },
  "auth": {
    "invalidCredentials": "Invalid email or password. Please try again.",
    "sessionExpired": "Your session has expired. Please log in again.",
    "emailExists": "An account with this email already exists.",
    "accountLocked": "Your account has been temporarily locked. Please try again later.",
    "passwordWeak": "Password is too weak. Please use a stronger password."
  },
  "validation": {
    "email": {
      "invalid": "Please enter a valid email address",
      "required": "Email is required",
      "tooLong": "Email is too long"
    },
    "password": {
      "required": "Password is required",
      "tooShort": "Password must be at least 8 characters",
      "lowercase": "Password must contain a lowercase letter",
      "uppercase": "Password must contain an uppercase letter",
      "number": "Password must contain a number",
      "special": "Password must contain a special character (!@#$%^&*)",
      "match": "Passwords must match"
    },
    "ahv": {
      "invalid": "Please enter a valid AHV number (756.XXXX.XXXX.XX)",
      "required": "AHV number is required"
    },
    "phone": {
      "invalid": "Please enter a valid Swiss phone number",
      "required": "Phone number is required"
    },
    "file": {
      "required": "Please select a file",
      "tooLarge": "File size must be less than 10MB",
      "invalidType": "File type not supported. Please upload PDF, JPG, or PNG"
    }
  },
  "tax": {
    "calculationFailed": "Unable to calculate tax. Please check your information and try again.",
    "filingFailed": "Unable to submit tax filing. Please try again later.",
    "documentProcessingFailed": "Unable to process document. Please ensure the file is readable."
  },
  "generic": {
    "somethingWrong": "Something went wrong. Please try again.",
    "tryAgain": "Please try again",
    "contactSupport": "If the problem persists, please contact support."
  }
}
```

#### 3.2 Create Error Handler Service (`src/services/errorHandler.js`)

```javascript
import i18n from '../i18n';

class ErrorHandler {
  /**
   * Parse and format API errors
   */
  handleApiError(error) {
    // Network errors
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return {
          message: i18n.t('errors.network.timeout'),
          type: 'network',
          code: 'TIMEOUT'
        };
      }
      return {
        message: i18n.t('errors.network.offline'),
        type: 'network',
        code: 'OFFLINE'
      };
    }

    const { status, data } = error.response;

    // Authentication errors
    if (status === 401) {
      return {
        message: i18n.t('errors.auth.sessionExpired'),
        type: 'auth',
        code: 'UNAUTHORIZED'
      };
    }

    // Validation errors
    if (status === 422) {
      return this.handleValidationError(data);
    }

    // Server errors
    if (status >= 500) {
      return {
        message: i18n.t('errors.network.serverError'),
        type: 'server',
        code: 'SERVER_ERROR'
      };
    }

    // Custom error messages from backend
    if (data?.detail) {
      return {
        message: this.translateBackendError(data.detail),
        type: 'api',
        code: data.code || 'API_ERROR'
      };
    }

    // Default error
    return {
      message: i18n.t('errors.generic.somethingWrong'),
      type: 'unknown',
      code: 'UNKNOWN'
    };
  }

  /**
   * Handle validation errors
   */
  handleValidationError(data) {
    const errors = {};

    if (data.detail && Array.isArray(data.detail)) {
      data.detail.forEach((err) => {
        const field = err.loc[err.loc.length - 1];
        errors[field] = this.translateValidationError(err.msg, field);
      });
    }

    return {
      message: i18n.t('errors.generic.tryAgain'),
      type: 'validation',
      code: 'VALIDATION_ERROR',
      fields: errors
    };
  }

  /**
   * Translate backend error messages
   */
  translateBackendError(detail) {
    // Map backend error codes to translation keys
    const errorMap = {
      'EMAIL_EXISTS': 'errors.auth.emailExists',
      'INVALID_CREDENTIALS': 'errors.auth.invalidCredentials',
      'ACCOUNT_LOCKED': 'errors.auth.accountLocked',
      'WEAK_PASSWORD': 'errors.auth.passwordWeak',
      'TAX_CALCULATION_FAILED': 'errors.tax.calculationFailed',
      'FILING_FAILED': 'errors.tax.filingFailed',
      'DOCUMENT_PROCESSING_FAILED': 'errors.tax.documentProcessingFailed'
    };

    const key = errorMap[detail] || 'errors.generic.somethingWrong';
    return i18n.t(key);
  }

  /**
   * Translate validation error messages
   */
  translateValidationError(message, field) {
    // Try to find specific translation
    const specificKey = `errors.validation.${field}.${message}`;
    if (i18n.exists(specificKey)) {
      return i18n.t(specificKey);
    }

    // Fall back to generic message
    return message;
  }

  /**
   * Show user-friendly error notification
   */
  showError(error, options = {}) {
    const parsedError = this.handleApiError(error);

    // Use notification system (toast, snackbar, etc.)
    if (options.toast) {
      options.toast.error(parsedError.message, {
        duration: 5000,
        ...options.toastOptions
      });
    }

    // Log to monitoring service
    if (parsedError.type === 'server') {
      this.logToMonitoring(error, parsedError);
    }

    return parsedError;
  }

  /**
   * Log errors to monitoring service
   */
  logToMonitoring(originalError, parsedError) {
    // Send to Sentry, LogRocket, etc.
    console.error('[ErrorHandler]', {
      original: originalError,
      parsed: parsedError,
      timestamp: new Date().toISOString()
    });
  }
}

export default new ErrorHandler();
```

#### 3.3 Update API Service to Use Error Handler (`src/services/api.js`)

```javascript
import errorHandler from './errorHandler';

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const parsedError = errorHandler.handleApiError(error);

    // Attach parsed error to original error object
    error.parsedError = parsedError;

    // Handle specific cases
    if (parsedError.code === 'UNAUTHORIZED') {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);
```

---

## 4. React.memo Optimization for Heavy Components

### Implementation Plan

#### 4.1 Identify Heavy Components

**Criteria:**
- Large lists/tables
- Complex calculations
- Frequent re-renders
- Heavy child component trees
- Map/visualization components

**Target Components:**
1. `MultiCantonDashboard` - Complex state, multiple child components
2. `Map` - Heavy rendering, geographic data
3. `GalleryCard` - Repeated in lists
4. `PropertySummary` - Complex calculations
5. `ComparisonTable` - Large data sets
6. `SearchBar` - Frequent updates
7. `MessageItem` - Repeated in chat lists

#### 4.2 Create Memoization Utilities (`src/utils/memoization.js`)

```javascript
import { memo } from 'react';

/**
 * Smart memo with custom comparison
 */
export const smartMemo = (Component, propsAreEqual) => {
  return memo(Component, propsAreEqual || defaultPropsComparison);
};

/**
 * Default shallow comparison for props
 */
const defaultPropsComparison = (prevProps, nextProps) => {
  const prevKeys = Object.keys(prevProps);
  const nextKeys = Object.keys(nextProps);

  if (prevKeys.length !== nextKeys.length) {
    return false;
  }

  return prevKeys.every((key) => {
    return prevProps[key] === nextProps[key];
  });
};

/**
 * Deep comparison for complex props
 */
export const deepPropsComparison = (prevProps, nextProps) => {
  return JSON.stringify(prevProps) === JSON.stringify(nextProps);
};

/**
 * Comparison that ignores specific props
 */
export const ignorePropsComparison = (ignoreKeys = []) => {
  return (prevProps, nextProps) => {
    const prevFiltered = { ...prevProps };
    const nextFiltered = { ...nextProps };

    ignoreKeys.forEach((key) => {
      delete prevFiltered[key];
      delete nextFiltered[key];
    });

    return defaultPropsComparison(prevFiltered, nextFiltered);
  };
};
```

#### 4.3 Optimization Examples

**Example 1: GalleryCard**

Before:
```javascript
// src/components/galleryCard/GalleryCard.jsx
export default function GalleryCard({ id, title, image, onClick }) {
  return (
    <div onClick={onClick}>
      <img src={image} alt={title} />
      <h3>{title}</h3>
    </div>
  );
}
```

After:
```javascript
import { memo } from 'react';

const GalleryCard = memo(({ id, title, image, onClick }) => {
  return (
    <div onClick={onClick}>
      <img src={image} alt={title} />
      <h3>{title}</h3>
    </div>
  );
}, (prevProps, nextProps) => {
  // Only re-render if these props change
  return (
    prevProps.id === nextProps.id &&
    prevProps.title === nextProps.title &&
    prevProps.image === nextProps.image
  );
  // Ignore onClick changes
});

export default GalleryCard;
```

**Example 2: MessageItem**

```javascript
import { memo } from 'react';

const MessageItem = memo(({ message, timestamp, sender, isOwn }) => {
  return (
    <div className={`message ${isOwn ? 'own' : 'other'}`}>
      <div className="sender">{sender}</div>
      <div className="content">{message}</div>
      <div className="timestamp">{timestamp}</div>
    </div>
  );
});

export default MessageItem;
```

**Example 3: SearchBar with useCallback**

```javascript
import { memo, useCallback, useMemo } from 'react';

const SearchBar = memo(({ onSearch, placeholder, initialValue }) => {
  const [value, setValue] = useState(initialValue);

  const handleChange = useCallback((e) => {
    setValue(e.target.value);
  }, []);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    onSearch(value);
  }, [value, onSearch]);

  const inputProps = useMemo(() => ({
    type: 'text',
    value,
    onChange: handleChange,
    placeholder
  }), [value, handleChange, placeholder]);

  return (
    <form onSubmit={handleSubmit}>
      <input {...inputProps} />
      <button type="submit">Search</button>
    </form>
  );
});

export default SearchBar;
```

#### 4.4 Performance Monitoring

Add React DevTools Profiler:

```javascript
// src/utils/performanceMonitor.js
import { Profiler } from 'react';

export const ProfiledComponent = ({ id, children }) => {
  const onRenderCallback = (
    id,
    phase,
    actualDuration,
    baseDuration,
    startTime,
    commitTime
  ) => {
    if (actualDuration > 16) { // Longer than 1 frame (60fps)
      console.warn(`[Performance] ${id} took ${actualDuration}ms to render`);
    }
  };

  return (
    <Profiler id={id} onRender={onRenderCallback}>
      {children}
    </Profiler>
  );
};
```

---

## Testing Plan

### 1. Cookie Authentication Testing

```javascript
// tests/auth/cookieAuth.test.js
describe('Cookie Authentication', () => {
  test('should set httpOnly cookie on login', async () => {
    const response = await api.post('/api/auth/login', credentials);

    // Check cookie is set (in browser devtools)
    // Backend test: check Set-Cookie header
  });

  test('should send cookie with authenticated requests', async () => {
    await api.post('/api/auth/login', credentials);
    const response = await api.get('/api/user/me');

    expect(response.status).toBe(200);
  });

  test('should clear cookie on logout', async () => {
    await api.post('/api/auth/logout');

    // Verify next request fails with 401
    await expect(api.get('/api/user/me')).rejects.toThrow();
  });
});
```

### 2. Validation Testing

```javascript
// tests/validation/schemas.test.js
describe('Validation Schemas', () => {
  test('should validate correct email', async () => {
    const result = await emailSchema.isValid('test@example.com');
    expect(result).toBe(true);
  });

  test('should reject invalid AHV number', async () => {
    await expect(ahvSchema.validate('invalid')).rejects.toThrow();
  });
});
```

### 3. Error Handling Testing

```javascript
// tests/services/errorHandler.test.js
describe('Error Handler', () => {
  test('should translate network timeout error', () => {
    const error = { code: 'ECONNABORTED' };
    const result = errorHandler.handleApiError(error);

    expect(result.type).toBe('network');
    expect(result.code).toBe('TIMEOUT');
  });

  test('should handle validation errors', () => {
    const error = {
      response: {
        status: 422,
        data: {
          detail: [{ loc: ['body', 'email'], msg: 'invalid' }]
        }
      }
    };

    const result = errorHandler.handleApiError(error);
    expect(result.type).toBe('validation');
  });
});
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing
- [ ] Backend changes deployed first
- [ ] Database migrations run (if any)
- [ ] Environment variables updated
- [ ] CORS configuration verified

### Deployment Steps
1. [ ] Deploy backend with cookie support (keep token support)
2. [ ] Test backend with Postman
3. [ ] Deploy frontend with cookie authentication
4. [ ] Monitor error rates
5. [ ] Roll back if issues detected

### Post-Deployment
- [ ] Verify authentication flow works
- [ ] Check error messages display correctly
- [ ] Monitor performance metrics
- [ ] Remove deprecated code after 1 week

---

## Rollback Plan

### If Authentication Fails
1. Revert to previous frontend version
2. Users will continue with localStorage tokens
3. Debug cookie configuration
4. Redeploy when fixed

### If Performance Degrades
1. Identify problematic memoized components
2. Remove React.memo from those components
3. Investigate with React Profiler

---

## Success Metrics

### Security
- [ ] No tokens in localStorage
- [ ] XSS attacks cannot steal tokens
- [ ] All API requests authenticated via cookies

### Validation
- [ ] Form error rate reduced by 50%
- [ ] Server-side validation errors reduced
- [ ] User-reported validation issues reduced

### Error Messages
- [ ] Support tickets about error messages reduced by 70%
- [ ] User surveys show improved clarity

### Performance
- [ ] Component re-render count reduced by 40%
- [ ] Page load time improved by 20%
- [ ] Time to Interactive improved

---

## Next Steps

1. Review this document with the team
2. Get approval on approach
3. Create tickets for each section
4. Start with backend cookie authentication
5. Follow with frontend changes
6. Add validation layer
7. Implement error handling
8. Optimize with React.memo
9. Test thoroughly
10. Deploy gradually

---

**Document Version:** 1.0
**Last Updated:** 2025-10-07
**Author:** Claude Code
**Status:** Ready for Review
