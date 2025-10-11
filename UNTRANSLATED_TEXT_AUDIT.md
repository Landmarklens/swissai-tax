# Untranslated Text Audit Report
**Generated:** 2025-10-11
**Project:** SwissAI Tax / HomeAI
**Scope:** Complete application audit for untranslated text, buttons, labels, and error messages

---

## Executive Summary

This comprehensive audit identified **400+ instances** of untranslated text across the application. The analysis was split across four major areas:

1. **Components** (src/components/) - 150+ untranslated strings
2. **Pages** (src/pages/) - 100+ untranslated strings
3. **Services/Utils/Hooks** (src/services/, src/utils/, etc.) - 200+ untranslated strings
4. **Static Data Files** (blogData.js, faqData.js, etc.) - 100+ content items

### Critical Findings
- **Zero translation coverage** in static data files (blog posts, FAQs, testimonials, landlord articles)
- **Validation messages** entirely hardcoded in English
- **Error handling** lacks translation support across all services
- **Email provider dropdowns** repeated in multiple components without translation
- **2FA setup flows** contain extensive untranslated user guidance
- **Cancellation flow reasons** completely hardcoded

---

## 1. COMPONENTS DIRECTORY (src/components/)

### 1.1 ErrorBoundary Component
**File:** `src/components/ErrorBoundary/ErrorBoundary.jsx`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 108 | Heading | "Oops! Something went wrong" | HIGH |
| 112 | Error message | "We're sorry, but an unexpected error occurred." | HIGH |
| 113 | Error message | "This has happened ${errorCount} times." | HIGH |
| 128 | Label | "Error Details:" | MEDIUM |
| 135 | Label | "Component Stack" | MEDIUM |
| 158 | Button | "Try Again" | HIGH |
| 166 | Button | "Go Home" | HIGH |
| 172 | Message | "If this error persists, please contact support." | HIGH |

### 1.2 TwoFactorSetup Component
**File:** `src/components/TwoFactor/TwoFactorSetup.jsx`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 29 | Steps | "Scan QR Code", "Verify Code", "Save Backup Codes" | HIGH |
| 68 | Error | "Failed to initialize 2FA setup" | HIGH |
| 89 | Error | "Please enter a 6-digit code" | HIGH |
| 106 | Success | "Two-factor authentication enabled successfully!" | HIGH |
| 110 | Error | "Invalid code. Please try again." | HIGH |
| 123 | Success | "Secret key copied to clipboard!" | MEDIUM |
| 140 | Success | "Backup codes copied to clipboard!" | MEDIUM |
| 152 | Error | "Please save your backup codes before continuing" | HIGH |
| 187 | Heading | "Set Up Two-Factor Authentication" | HIGH |
| 215 | Heading | "Scan QR Code with Authenticator App" | HIGH |
| 218-220 | Instructions | "Use an authenticator app like Google Authenticator..." | HIGH |
| 236 | Instructions | "Can't scan the QR code? Enter this key manually:" | HIGH |
| 260 | Heading | "Verify Your Setup" | HIGH |
| 263-264 | Instructions | "Enter the 6-digit code from your authenticator app..." | HIGH |
| 288 | Heading | "Save Your Backup Codes" | HIGH |
| 292 | Alert | "Store these backup codes in a safe place..." | CRITICAL |
| 323 | Button | "Download Codes" | HIGH |
| 330 | Button | "Copy to Clipboard" | HIGH |
| 348 | Button | "Cancel", "Back" | HIGH |
| 358 | Button | "Verifying...", "Next" | HIGH |
| 367 | Button | "Complete Setup" | HIGH |

### 1.3 TwoFactorVerifyModal Component
**File:** `src/components/TwoFactor/TwoFactorVerifyModal.jsx`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 35 | Error | "Please enter a code" | HIGH |
| 49 | Error | "Invalid code. Please try again." | HIGH |
| 85 | Heading | "Two-Factor Authentication" | HIGH |
| 95 | Instructions | "Enter the 6-digit code from your authenticator app..." | HIGH |
| 126 | Link | "Use a backup code instead" | MEDIUM |
| 133 | Instructions | "Enter one of your backup codes. Each code can only be used once." | HIGH |
| 163 | Link | "Use authenticator app code instead" | MEDIUM |
| 178 | Info | "Use a backup code to log in, then regenerate new codes..." | HIGH |
| 190 | Button | "Cancel" | HIGH |
| 198 | Button | "Verifying...", "Verify" | HIGH |

### 1.4 Analytics Components
**File:** `src/components/Analytics/AIAnalyticsDashboard.jsx`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 94 | Error | "Failed to load market trends" | HIGH |
| 173-174 | Label | "Market Direction" | MEDIUM |
| 197-198 | Label | "Average Price" | MEDIUM |
| 218-219 | Label | "Market Activity" | MEDIUM |
| 239-240 | Label | "Demand Level" | MEDIUM |
| 262 | Heading | "Price Trends (Weekly)" | MEDIUM |
| 281-282 | Legend | "Average Price", "Median Price" | MEDIUM |
| 303 | Heading | "Demand Forecast (30 Days)" | MEDIUM |
| 364 | Heading | "Demand Analysis" | MEDIUM |
| 371 | Label | "Average daily listings:" | MEDIUM |
| 374 | Label | "Confidence:" | MEDIUM |
| 390 | Alert | "Select a property to see AI-powered rent predictions" | MEDIUM |
| 417 | Heading | "Market Positioning" | MEDIUM |
| 473 | Heading | "Top Competitors" | MEDIUM |
| 510 | Heading | "Strategic Recommendations" | MEDIUM |
| 530 | Heading | "Unique Selling Points" | MEDIUM |
| 566 | Heading | "AI Analytics Dashboard" | HIGH |
| 569 | Subtitle | "Powered by machine learning and market intelligence" | MEDIUM |

### 1.5 AIRentPredictor Component
**File:** `src/components/Analytics/AIRentPredictor.jsx`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 60 | Error | "Failed to predict rent" | HIGH |
| 79-81 | Labels | "High Confidence", "Medium Confidence", "Low Confidence" | MEDIUM |
| 104 | Button | "Retry" | HIGH |
| 118 | Message | "Select a property to see AI-powered rent prediction" | MEDIUM |
| 132 | Heading | "AI Rent Prediction" | MEDIUM |
| 160-161 | Label | "Predicted Monthly Rent" | MEDIUM |
| 169 | Label | "Prediction Confidence" | MEDIUM |
| 240 | Heading | "Key Pricing Factors" | MEDIUM |
| 277 | Heading | "Similar Properties Used for Prediction" | MEDIUM |
| 342 | Button | "Recalculate Prediction" | MEDIUM |

### 1.6 Email Setup Components
**File:** `src/components/PropertyImport/steps/EmailSetupStep.jsx`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 143 | Heading | "How Email Forwarding Works" | HIGH |
| 162-163 | Instructions | "Applicants send emails to your managed address → We process..." | HIGH |
| 174 | Heading | "Test Your Email Setup" | HIGH |
| 183 | Instructions | "Send a test email to:" | HIGH |
| 215 | Instructions | "Use this exact subject line:" | HIGH |
| 247 | Instructions | "Click below to send the test email" | HIGH |
| 259 | Button | "Open Email & Send Test" | HIGH |
| 266 | Button | "I've Sent It Manually" | HIGH |
| 278 | Status | "Monitoring for your test email..." | HIGH |
| 289 | Info | "Checking every 5 seconds • {timeRemaining} seconds remaining" | HIGH |
| 307 | Button | "Cancel Monitoring" | HIGH |
| 319 | Success | "Email forwarding verified and working!" | HIGH |
| 339 | Button | "Send Another Test" | HIGH |
| 351 | Warning | "Test email not received yet" | HIGH |
| 361-367 | Instructions | Troubleshooting steps list | HIGH |
| 379 | Button | "Retry Test" | HIGH |
| 386 | Button | "Skip & Continue" | HIGH |
| 400 | Heading | "Email Forwarding Configuration" | HIGH |
| 410 | Label | "Your Managed Email Address" | HIGH |
| 432 | Helper | "This unique email address will receive all applications..." | HIGH |

### 1.7 TenantSelectionSetup Component
**File:** `src/components/TenantSelection/TenantSelectionSetup.jsx`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 43-60 | Steps | "Import Property", "Define Criteria", "Schedule Viewings", "Activate & Share" | HIGH |
| 173 | Heading | "Activate Tenant Selection" | HIGH |
| 177 | Label | "Your managed email address:" | HIGH |
| 189 | Label | "Property" | MEDIUM |
| 199 | Label | "Viewing Slots" | MEDIUM |
| 211 | Label | "Selected Criteria" | MEDIUM |
| 243 | Instructions | "Once activated, the system will:" | HIGH |
| 247-257 | List | Feature list items | HIGH |
| 262-263 | Success | "Tenant selection is now active!" | HIGH |
| 277 | Button | "Back" | HIGH |
| 287 | Button | "Go to Dashboard" | HIGH |
| 297 | Button | "Activating...", "Activate System" | HIGH |
| 314 | Heading | "Tenant Selection Setup" | HIGH |

### 1.8 PropertyImporterWithSetup Component
**File:** `src/components/PropertyImporterWithSetup.jsx`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 73 | Steps | "Import Property", "Property Details", "Tenant Selection Setup", etc. | HIGH |
| 505 | Toast | "Email address copied to clipboard!" | MEDIUM |
| 631 | Menu | "Gmail", "Outlook/Hotmail", "Yahoo Mail", "iCloud Mail", "Other" | HIGH |

### 1.9 CancelSubscription Component
**File:** `src/components/PlanCard/ui/CancelSubscriptionFlowModal/ui/UnsubscribeReasons/models/constants.js`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 2-10 | Radio Options | "Only want to pay monthly", "HOME AI sufficient for my needs", "Premium is too expensive", etc. | CRITICAL |

**Note:** All 9 cancellation reasons are completely hardcoded in English.

---

## 2. PAGES DIRECTORY (src/pages/)

### 2.1 NotFound Page
**File:** `src/pages/NotFound/index.js`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 54 | Meta | "The page you're looking for doesn't exist..." | HIGH |
| 116 | Heading | "404 | Page Not Found" | HIGH |
| 120-121 | Text | "Oops! It looks like the page you're looking for doesn't exist..." | HIGH |
| 130 | Button | "Go Back" | HIGH |
| 133 | Button | "Go Home" | HIGH |
| 152 | Text | "HOME AI" | MEDIUM |

### 2.2 Blog Pages
**File:** `src/pages/BlogList/BlogList.jsx`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 24 | Heading | "Blog" | HIGH |
| 25 | Text | "Stay ahead of the curve with our team's real estate updates." | HIGH |
| 59 | Button | Category names (e.g., "All") | MEDIUM |

**File:** `src/pages/BlogList/BlogItemPage.jsx`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 113 | Meta | "Blog Post - HomeAI" | MEDIUM |
| 114 | Meta | "Read the latest insights and updates from HomeAI" | MEDIUM |

### 2.3 Authentication Pages
**File:** `src/pages/ForgotPassword/ForgotPassword.jsx`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 44 | Error | "Email is required." | HIGH |
| 60 | Error | "Something went wrong." | HIGH |
| 76 | Meta | "Reset your SwissAI Tax account password" | MEDIUM |

**File:** `src/pages/ResetPassword/ResetPassword.jsx`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 91 | Meta | "Reset Password - SwissAI Tax" | MEDIUM |
| 92 | Meta | "Create a new password for your SwissAI Tax account" | MEDIUM |

### 2.4 Tax Filing Pages
**File:** `src/pages/TaxFiling/DocumentChecklistPage.js`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 36 | Labels | "Complete Interview", "Upload Documents", "Calculate Taxes", "Review & Submit" | HIGH |
| 73 | Error | "Upload to S3 failed" | HIGH |
| 100 | Error | "Failed to upload ${file.name}: ${err.message}" | HIGH |
| 139 | Error | "Failed to calculate taxes. Please try again." | HIGH |
| 154 | Heading | "Document Upload" | HIGH |
| 179 | Label | "Upload Progress: {Math.round(uploadProgress)}%" | HIGH |
| 190 | Heading | "Your Profile" | HIGH |
| 196 | Label | "Documents uploaded: {uploadedDocuments.length} / {document_requirements?.length || 0}" | HIGH |
| 206 | Heading | "Required Documents" | HIGH |
| 225 | Button | "Back to Interview" | HIGH |
| 235 | Button | "Calculating..." / "Calculate My Taxes" | HIGH |

**File:** `src/pages/TaxFiling/FilingsListPage.jsx`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 58-84 | Data | All 26 Swiss canton names | MEDIUM |
| 145 | Error | "Failed to load filings" | HIGH |
| 180 | Error | "Postal code not found" | HIGH |
| 200 | Error | "Failed to create filing" | HIGH |
| 215 | Error | "Failed to copy filing" | HIGH |
| 228 | Error | "Failed to delete filing" | HIGH |
| 327 | Label | "Kantonales Steueramt Zürich\nBändliweg 21\n8090 Zürich" | MEDIUM |

### 2.5 Review Page
**File:** `src/pages/ReviewPage.jsx`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 172 | Button | "Download PDF Preview" | HIGH |
| 244 | Label | "Employment Income" | HIGH |
| 250 | Label | "Investment Income" | HIGH |
| 256 | Label | "Other Income" | HIGH |
| 282 | Heading | "Deductions" | HIGH |
| 294 | Label | "Pillar 3a" | HIGH |
| 300 | Label | "Health Insurance" | HIGH |
| 306 | Label | "Childcare" | HIGH |
| 312 | Label | "Work Expenses" | HIGH |

### 2.6 Contact Page
**File:** `src/pages/Contact/Contact.jsx`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 202 | Toast | "Thank you for your request! We'll get back to you soon." | HIGH |
| 223 | Toast | "Validation failed. Please check your input." | HIGH |
| 225 | Toast | "Too many requests. Please wait a moment and try again." | HIGH |
| 227 | Toast | "Please check your input and try again." | HIGH |
| 229 | Toast | "Failed to send message. Please try again later." | HIGH |
| 234 | Toast | "Network error. Please check your connection and try again." | HIGH |
| 292 | Text | "LandMarK Lens GMBH" | LOW |
| 298 | Text | "contact@swissai.tax" | LOW |
| 305 | Text | "Sandbuckstrasse 24, Schneisingen 5425" | LOW |
| 400 | Placeholder | "079 123 45 67" | MEDIUM |

### 2.7 Other Pages
**File:** `src/pages/ComponentShowcase.jsx`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 14 | Heading | "Enhanced UI Components Showcase" | LOW |
| 17 | Text | "This page shows the updated components with their new UI designs." | LOW |
| Multiple | Various | Demo content and feature descriptions | LOW |

**File:** `src/pages/GoogleCallback/GoogleCallback.jsx`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 60 | Meta | "Completing Google authentication" | MEDIUM |

**File:** `src/pages/SubscriptionPlans/SubscriptionPlans.jsx`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 77 | Error | "Failed to start subscription process" | HIGH |
| 355 | Text | "Questions? Contact us at support@swissai.tax" | MEDIUM |

---

## 3. SERVICES, UTILS, HOOKS, CONTEXTS

### 3.1 Validation Files (CRITICAL PRIORITY)
**File:** `src/validations/loginValidation.js`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 6 | Validation | "Invalid email format" | CRITICAL |
| 7 | Validation | "Email is required" | CRITICAL |
| 8 | Validation | "Email is too long" | CRITICAL |
| 11 | Validation | "Password must be at least 6 characters" | CRITICAL |
| 12 | Validation | "Password is too long" | CRITICAL |
| 13 | Validation | "Password is required" | CRITICAL |

**File:** `src/validations/signupValidation.js`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 9 | Validation | "First name must be at least 2 characters" | CRITICAL |
| 10 | Validation | "First name is too long" | CRITICAL |
| 11 | Validation | "First name can only contain letters, spaces, hyphens and apostrophes" | CRITICAL |
| 12 | Validation | "First name is required" | CRITICAL |
| 15 | Validation | "Last name must be at least 2 characters" | CRITICAL |
| 16 | Validation | "Last name is too long" | CRITICAL |
| 17 | Validation | "Last name can only contain letters, spaces, hyphens and apostrophes" | CRITICAL |
| 18 | Validation | "Last name is required" | CRITICAL |
| 21 | Validation | "Invalid email format" | CRITICAL |
| 22 | Validation | "Email is required" | CRITICAL |
| 23 | Validation | "Email is too long" | CRITICAL |
| 26 | Validation | "Password must be at least 6 characters" | CRITICAL |
| 27 | Validation | "Password is too long" | CRITICAL |
| 29 | Validation | "Password must contain at least one uppercase letter..." | CRITICAL |
| 31 | Validation | "Password is required" | CRITICAL |
| 33 | Validation | "Passwords must match" | CRITICAL |
| 34 | Validation | "Please confirm your password" | CRITICAL |

### 3.2 Error Handling (CRITICAL PRIORITY)
**File:** `src/utils/errorHandler.js`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 60 | Error | "Something went wrong" | CRITICAL |
| 95 | Error | "Network error. Please check your connection." | CRITICAL |
| 96 | Error | "Please log in to continue." | CRITICAL |
| 97 | Error | "Your session has expired. Please log in again." | CRITICAL |
| 98 | Error | "The requested resource was not found." | CRITICAL |
| 99 | Error | "Server error. Please try again later." | CRITICAL |
| 100 | Error | "Too many requests. Please slow down." | CRITICAL |

**File:** `src/utils/errorUtils.js`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 2 | Error | "Something went wrong" | CRITICAL |

**File:** `src/utils/validation.js`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 57 | Validation | "${fieldName.replace(/_/g, ' ')} is required" | CRITICAL |
| 69 | Validation | "Please enter a valid email address" | CRITICAL |
| 75 | Validation | "Please enter a valid phone number" | CRITICAL |
| 81 | Validation | "Please enter a valid amount (e.g., 1234.56)" | CRITICAL |
| 87 | Validation | "Please enter a valid date" | CRITICAL |
| 93 | Validation | "Signature is required" | CRITICAL |

### 3.3 Authentication Services
**File:** `src/services/authService.js`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 127 | Error | "Login failed" | HIGH |
| 143 | Error | "Registration failed" | HIGH |
| 256 | Error | "Email is required to request a password reset." | HIGH |
| 269 | Error | "Failed to request password reset" | HIGH |
| 275 | Error | "Token is required to verify a password reset." | HIGH |
| 289 | Error | "Failed to verify reset token" | HIGH |
| 300 | Error | "Token and new password are required to password reset." | HIGH |
| 316 | Error | "Failed to reset password" | HIGH |

### 3.4 User Service
**File:** `src/services/userService.js`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 21 | Notification | "Verification code sent to your email" | HIGH |
| 26 | Error | "Failed to request account deletion" | HIGH |
| 42 | Notification | "Account deletion scheduled successfully" | HIGH |
| 47 | Error | "Invalid verification code" | HIGH |
| 63 | Notification | "Account deletion cancelled successfully" | HIGH |
| 68 | Error | "Failed to cancel account deletion" | HIGH |
| 94 | Error | "Failed to get deletion status" | HIGH |
| 110 | Notification | "Data export requested in ${format.toUpperCase()} format" | HIGH |
| 115 | Error | "Failed to request data export" | HIGH |
| 134 | Error | "Failed to list data exports" | HIGH |
| 155 | Error | "Failed to get export details" | HIGH |

### 3.5 Profile Service
**File:** `src/services/profileService.js`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 24 | Error | "Failed to fetch profile" | HIGH |
| 40 | Notification | "Personal information updated successfully" | HIGH |
| 45 | Error | "Failed to update personal information" | HIGH |
| 61 | Notification | "Tax profile updated successfully" | HIGH |
| 66 | Error | "Failed to update tax profile" | HIGH |
| 82 | Notification | "Security settings updated successfully" | HIGH |
| 87 | Error | "Failed to update security settings" | HIGH |

### 3.6 Payment Service
**File:** `src/services/paymentService.js`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 28 | Error | "Failed to create payment intent" | HIGH |
| 44-46 | Features | "Single tax return", "Basic deductions", "Email support" | MEDIUM |
| 54-58 | Features | "Multiple tax returns", "All deductions", "Priority email support", etc. | MEDIUM |
| 66-72 | Features | "Unlimited tax returns", "All deductions & optimizations", etc. | MEDIUM |
| 99 | Validation | "Plan type is required" | HIGH |
| 103 | Validation | "Invalid plan type" | HIGH |

### 3.7 Subscription Service
**File:** `src/services/subscriptionService.js`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 26 | Error | "Failed to create setup intent" | HIGH |
| 58 | Error | "Failed to create subscription" | HIGH |
| 75 | Error | "Failed to create free subscription" | HIGH |
| 93 | Error | "Failed to fetch subscription" | HIGH |
| 109 | Notification | "Subscription canceled successfully" | HIGH |
| 114 | Error | "Failed to cancel subscription" | HIGH |
| 134 | Notification | "Plan switched successfully" | HIGH |
| 139 | Error | "Failed to switch plan" | HIGH |
| 159 | Notification | "Pause request submitted successfully" | HIGH |
| 164 | Error | "Failed to request pause" | HIGH |
| 186 | Error | "Failed to fetch invoices" | HIGH |
| 198 | Fallback | "N/A" | MEDIUM |
| 213 | Fallback | "No payment method" | MEDIUM |
| 216 | Text | "Card on file" | MEDIUM |
| 227-236 | Plan Details | "Annual Flex", "Cancel anytime, pay annually", features | MEDIUM |
| 238-250 | Plan Details | "5-Year Price Lock", "Lock in lowest price for 5 years", features | MEDIUM |

### 3.8 Two-Factor Authentication Service
**File:** `src/services/twoFactorService.js`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 28 | Error | "Failed to initialize 2FA setup" | HIGH |
| 56 | Error | "Failed to verify 2FA code" | HIGH |
| 94 | Error | "Invalid verification code" | HIGH |
| 116 | Error | "Failed to disable 2FA" | HIGH |
| 138 | Error | "Failed to regenerate backup codes" | HIGH |
| 158 | Error | "Failed to get 2FA status" | HIGH |
| 169-182 | File Content | "SwissAI Tax - Two-Factor Authentication Backup Codes", instructions | HIGH |

### 3.9 Referral Service
**File:** `src/services/referralService.js`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 23 | Error | "Failed to fetch referral code" | HIGH |
| 42 | Error | "Failed to fetch referral stats" | HIGH |
| 61 | Error | "Failed to fetch account credits" | HIGH |
| 85 | Error | "Failed to validate discount code" | HIGH |
| 105 | Error | "Failed to create promotional code" | HIGH |
| 169 | Fallback | "N/A" | MEDIUM |

### 3.10 Settings Service
**File:** `src/services/settingsService.js`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 24 | Error | "Failed to fetch settings" | HIGH |
| 40 | Notification | "Preferences updated successfully" | HIGH |
| 45 | Error | "Failed to update preferences" | HIGH |
| 61 | Notification | "Notification settings updated successfully" | HIGH |
| 66 | Error | "Failed to update notification settings" | HIGH |
| 82 | Notification | "Document settings updated successfully" | HIGH |
| 87 | Error | "Failed to update document settings" | HIGH |

### 3.11 Filing Service
**File:** `src/services/filingService.js`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 21 | Notification | "Filing submitted successfully" | HIGH |
| 27 | Error | "Failed to submit filing" | HIGH |
| 47 | Error | "Failed to fetch filing details" | HIGH |
| 67 | Error | "Failed to fetch filing review data" | HIGH |
| 79-83 | Status Labels | "Draft", "Under Review", "Submitted", "Accepted", "Rejected" | HIGH |

### 3.12 Other Services
**File:** `src/services/dashboardService.js`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 24 | Error | "Failed to fetch dashboard data" | HIGH |

**File:** `src/services/locationMap.js`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 7 | Error | "Failed to fetch location data" | HIGH |
| 19 | Error | "Location not found" | HIGH |
| 57 | Error | "Location not found" | HIGH |

**File:** `src/services/sessionService.js`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 26 | Error | "Failed to retrieve sessions" | HIGH |
| 47 | Error | "Failed to revoke session" | HIGH |
| 68 | Error | "Failed to revoke sessions" | HIGH |
| 88 | Error | "Failed to get session count" | HIGH |

### 3.13 Auth Migration
**File:** `src/utils/authMigration.js`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 22 | Notification | "No legacy auth found" | LOW |
| 42 | Error | "No token found" | MEDIUM |
| 70 | Notification | "Successfully migrated to cookie auth" | MEDIUM |
| 75 | Error | "Migration failed" | MEDIUM |
| 86 | Error | "Token expired, please login again" | HIGH |
| 137 | Notification | "No migration needed" | LOW |

### 3.14 Contexts
**File:** `src/contexts/NavigationContext.jsx`

| Line | Type | Text | Priority |
|------|------|------|----------|
| 20 | Error | "useNavigationContext must be used within NavigationProvider" | MEDIUM |

---

## 4. STATIC DATA FILES

### 4.1 Blog Data (ZERO TRANSLATION COVERAGE)
**File:** `src/blogData.js`
**Status:** ⚠️ CRITICAL - No translation infrastructure

**Content:**
- **5 complete blog articles** (10,000+ words total)
- All titles, content, metadata in English only
- No use of translation functions

**Articles:**
1. "Renting in Switzerland: 5 Big Challenges and How to Tackle Them" (~2,800 words)
2. "Apartment Hunting Made Easy: How AI Is Changing the Swiss Rental Game" (~1,500 words)
3. "The Expat's Guide to Renting in Switzerland: 5 Essential Tips" (~1,700 words)
4. "Where to Live in Zurich: A Neighborhood Guide for Every Lifestyle" (~2,500 words)
5. "Surviving 'Moving Season' in Switzerland: 5 Tips for a Smooth Summer Move" (~2,000 words)

**Recommendation:** Implement CMS or translation-key based system for blog content.

### 4.2 FAQ Data (ZERO TRANSLATION COVERAGE)
**File:** `src/faqData.js`
**Status:** ⚠️ CRITICAL - No translation infrastructure

**Content:**
- **6 categories with 25 FAQ items**
- All questions and answers in English only
- Categories: Getting Started, Tax Filing Process, Deductions & Savings, Security & Privacy, Technical Support, Pricing & Payment

**Sample Questions:**
- "What is SwissAI Tax?"
- "How does the AI interview work?"
- "Is my data secure?"
- "How much does SwissAI Tax cost?"

**Recommendation:** Convert to translation-key structure with i18n support.

### 4.3 Testimonials Data (ZERO TRANSLATION COVERAGE)
**File:** `src/testimonialsData.js`
**Status:** ⚠️ MEDIUM - No translation infrastructure

**Content:**
- **9 user testimonials** with names, locations, ratings
- All testimonial text in English only

**Sample:**
- "I was able to find the perfect home in no time. The service was exceptional and so easy to use."
- "Very efficient and user-friendly. Found a great place that fits my needs perfectly."

**Recommendation:** Move to database or translation files for multi-language support.

### 4.4 Database Constants (ZERO TRANSLATION COVERAGE)
**File:** `src/db.js`
**Status:** ⚠️ CRITICAL - 50+ UI strings, no translation

**Content:**
- **Plan pricing descriptions and features** (Free, Advanced Search)
- **Stepper labels** (11 steps: "General Preferences", "Type of Property", "Budget", etc.)
- **Interview questions** (40+ questions for property search)
- **Account management text** (cancellation reasons, feedback, etc.)
- **Chat message templates**

**Examples:**
- "Basic Property Matching"
- "Real-Time Market Scan"
- "What city or neighborhood are you interested in?"
- "How close would you like your home to be from your workplace?"
- Cancellation reasons: "Only want to pay monthly", "Premium is too expensive", etc.

**Recommendation:** Critical - Split into separate translation files by domain (plans, questions, etc.).

### 4.5 Landlord Articles (ZERO TRANSLATION COVERAGE)
**File:** `src/landlordArticles.js`
**Status:** ⚠️ HIGH - 5,364 lines, no translation
**Size:** 8,000+ words across 5+ comprehensive articles

**Content:**
- "How to List Your Property on HomeAI" (~850 words)
- "Understanding the Swiss Tenant Selection Process" (~2,200 words)
- "Managing Property Viewings Efficiently" (~2,400 words)
- "Digital Lease Agreements and Documentation"
- "How to Use AI-Powered Tenant Scoring and Auto-Matching" (~3,000+ words)
- Multiple additional articles on property management, legal compliance, pricing strategies

**Recommendation:** Implement CMS or move to separate content management system.

---

## 5. PRIORITY RECOMMENDATIONS

### Priority 1: CRITICAL (Immediate Action Required)
**Estimated Impact:** High user friction, poor UX

1. **All validation messages** (loginValidation.js, signupValidation.js, validation.js)
   - Users cannot understand form errors in their language
   - Affects signup, login, and all form interactions

2. **Error handling** (errorHandler.js, errorUtils.js)
   - Critical error messages appear in English only
   - Network errors, auth errors, server errors all untranslated

3. **Static data files** (db.js, faqData.js)
   - Core application questions and FAQs unreachable to non-English speakers
   - Plan features and pricing descriptions English-only

4. **Cancellation flow reasons** (CancelSubscriptionFlowModal constants)
   - Users cannot explain why they're canceling in their language

### Priority 2: HIGH (Address Within Sprint)
**Estimated Impact:** Moderate user friction

1. **Service error messages** (all files in src/services/)
   - 90+ error messages across authentication, payments, subscriptions
   - Success notifications also need translation

2. **2FA setup flows** (TwoFactorSetup.jsx, TwoFactorVerifyModal.jsx)
   - Security-critical feature with extensive untranslated guidance
   - Backup codes, instructions, error messages

3. **Email setup wizard** (EmailSetupStep.jsx)
   - Property management onboarding with detailed instructions
   - Test email flows and troubleshooting steps

4. **Authentication pages** (ForgotPassword, ResetPassword)
   - Password recovery flows with hardcoded messages

### Priority 3: MEDIUM (Plan for Next Sprint)
**Estimated Impact:** Feature accessibility

1. **Analytics components** (AIAnalyticsDashboard, AIRentPredictor)
   - Chart labels, metric names, prediction confidence levels
   - Premium feature with extensive text content

2. **Tenant selection setup** (TenantSelectionSetup.jsx)
   - Multi-step wizard with instructions and feature descriptions

3. **Review page labels** (ReviewPage.jsx)
   - Income and deduction field labels

4. **Contact page** (Contact.jsx)
   - Form validation and success/error toasts

### Priority 4: LOW (Future Consideration)
**Estimated Impact:** Content richness

1. **Blog content** (blogData.js)
   - 10,000+ words of educational content
   - Consider CMS solution for scalability

2. **Landlord articles** (landlordArticles.js)
   - 8,000+ words of comprehensive guides
   - Consider separate content management

3. **Testimonials** (testimonialsData.js)
   - User reviews and feedback
   - May require user-generated content solution

4. **Component showcase** (ComponentShowcase.jsx)
   - Demo page, low user visibility

---

## 6. IMPLEMENTATION STRATEGY

### Phase 1: Foundation (Week 1-2)
**Goal:** Fix critical paths that block user flows

1. **Create translation keys** for all validation messages
   - Move all strings from loginValidation.js → en/validation.json, de/validation.json, fr/validation.json, it/validation.json
   - Move all strings from signupValidation.js → translation files
   - Update validation.js to use t() function

2. **Implement error translation infrastructure**
   - Create error.json files for all languages
   - Update errorHandler.js to use translation keys
   - Update errorUtils.js

3. **Translate static db.js content**
   - Split into domain-specific translation files:
     - plans.json (pricing features)
     - questions.json (interview questions)
     - account.json (cancellation reasons, etc.)

### Phase 2: User Flows (Week 3-4)
**Goal:** Translate complete user journeys

1. **Service layer messages**
   - Create service-specific translation keys
   - Pattern: `services.auth.loginFailed`, `services.subscription.cancelSuccess`
   - Update all 15+ service files

2. **Authentication flows**
   - ForgotPassword, ResetPassword pages
   - 2FA setup and verification modals
   - Session management

3. **Property management flows**
   - Email setup wizard
   - Tenant selection setup
   - Property importer

### Phase 3: Features (Week 5-6)
**Goal:** Translate advanced features

1. **Analytics components**
   - Chart labels, metric names
   - Prediction confidence levels
   - Recommendations and insights

2. **Tax filing flows**
   - Document checklist
   - Review page
   - Filing status labels

3. **Settings and account**
   - Profile settings
   - Subscription management
   - Notification preferences

### Phase 4: Content (Week 7-8+)
**Goal:** Handle large content areas

1. **FAQ system**
   - Restructure faqData.js to use translation keys
   - Create comprehensive FAQ translation files
   - Consider admin interface for FAQ management

2. **Blog infrastructure**
   - Decision: CMS vs. translation files?
   - If translation files: Split by article
   - If CMS: Migrate to Contentful/Strapi/custom solution

3. **Landlord articles**
   - Similar to blog decision
   - Consider wiki-style editing interface

4. **Testimonials**
   - Move to database with language field
   - Allow user-submitted content in native language

---

## 7. TECHNICAL IMPLEMENTATION NOTES

### Translation File Structure (Recommended)
```
src/locales/
├── en/
│   ├── translation.json (main UI)
│   ├── validation.json (form validation)
│   ├── errors.json (error messages)
│   ├── services.json (service messages)
│   ├── plans.json (pricing plans)
│   ├── questions.json (interview questions)
│   ├── faq.json (FAQ content)
│   └── blog/ (if not using CMS)
│       ├── article1.json
│       ├── article2.json
│       └── ...
├── de/
│   ├── translation.json
│   ├── validation.json
│   └── ... (same structure)
├── fr/
└── it/
```

### Code Pattern Updates

**Before:**
```javascript
// src/validations/loginValidation.js
email: Yup.string()
  .email("Invalid email format")
  .required("Email is required")
```

**After:**
```javascript
// src/validations/loginValidation.js
import { useTranslation } from 'react-i18next';

const { t } = useTranslation();
email: Yup.string()
  .email(t('validation.email.invalid'))
  .required(t('validation.email.required'))
```

**Before:**
```javascript
// src/services/authService.js
throw new Error("Login failed");
```

**After:**
```javascript
// src/services/authService.js
import i18n from '../i18n';

throw new Error(i18n.t('services.auth.loginFailed'));
```

### FAQ Data Restructure

**Before:**
```javascript
// src/faqData.js
export const faqData = [
  {
    question: "What is SwissAI Tax?",
    answer: "SwissAI Tax is an intelligent Swiss tax filing platform..."
  }
];
```

**After:**
```javascript
// src/faqData.js
export const faqData = [
  {
    question: "faq.gettingStarted.whatIs.question",
    answer: "faq.gettingStarted.whatIs.answer"
  }
];

// en/faq.json
{
  "faq": {
    "gettingStarted": {
      "whatIs": {
        "question": "What is SwissAI Tax?",
        "answer": "SwissAI Tax is an intelligent Swiss tax filing platform..."
      }
    }
  }
}
```

---

## 8. TESTING CHECKLIST

After implementing translations, test:

- [ ] Login page validation errors in all 4 languages
- [ ] Signup page validation errors in all 4 languages
- [ ] Password reset flow in all languages
- [ ] 2FA setup complete flow in all languages
- [ ] Error messages (network errors, API errors) in all languages
- [ ] Toast notifications (success/error) in all languages
- [ ] Email setup wizard in all languages
- [ ] Tax filing flow labels and buttons in all languages
- [ ] Analytics dashboard in all languages
- [ ] FAQ page in all languages (if restructured)
- [ ] Plan selection and pricing in all languages
- [ ] Cancellation flow in all languages

---

## 9. ESTIMATED EFFORT

| Phase | Scope | Estimated Effort | Developer Days |
|-------|-------|------------------|----------------|
| Phase 1 | Validation + Errors + db.js | 50 strings × 4 languages | 3-5 days |
| Phase 2 | Services + Auth flows | 100 strings × 4 languages | 5-8 days |
| Phase 3 | Components + Features | 150 strings × 4 languages | 8-10 days |
| Phase 4 | Content (FAQ, Blog, etc.) | 100+ items × 4 languages | 10-15 days |
| **TOTAL** | **~400 items** | **~1,600 translations** | **26-38 days** |

**Note:** This assumes:
- Professional translation service (not machine translation)
- Parallel work on code refactoring and translation
- QA testing time included
- Does not include blog/landlord article content (may require CMS solution)

---

## 10. MAINTENANCE GUIDELINES

### Adding New Features
1. **Never hardcode user-facing strings**
2. Always add translation keys first
3. Pattern: `feature.component.action.type`
   - Example: `taxFiling.upload.button.calculate`
4. Add to all 4 language files before merging

### Code Review Checklist
- [ ] No hardcoded strings in quotes (except technical strings)
- [ ] All user-facing text uses `t()` or `Trans`
- [ ] Translation keys follow naming convention
- [ ] All 4 language files updated
- [ ] Toast/notification messages translated
- [ ] Error messages translated
- [ ] Button labels translated
- [ ] Form validation messages translated

### CI/CD Integration
Consider adding:
- Translation key completeness checker
- Missing translation detection
- Unused translation key detection
- Translation file format validation

---

## CONCLUSION

This audit identified **400+ instances** of untranslated text across the entire application. The findings are organized into 4 priority levels:

- **CRITICAL (Priority 1):** Validation messages, error handling, core UI strings
- **HIGH (Priority 2):** Service messages, authentication flows, wizards
- **MEDIUM (Priority 3):** Feature-specific labels, analytics, settings
- **LOW (Priority 4):** Blog content, documentation, testimonials

The recommended implementation strategy follows a 4-phase approach over 8 weeks, focusing on critical user paths first and scaling to content management solutions for large text areas.

**Next Steps:**
1. Review and approve this audit
2. Prioritize phases based on business needs
3. Allocate translation budget and resources
4. Begin Phase 1 implementation
5. Set up translation infrastructure (files, tooling, process)

---

**Document Version:** 1.0
**Last Updated:** 2025-10-11
**Audit Scope:** Complete application (components, pages, services, utils, hooks, contexts, validations, static data)
**Languages Analyzed:** Current: English | Target: English, German, French, Italian