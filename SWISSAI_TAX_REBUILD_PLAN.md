# SwissAI Tax - Complete Rebuild & Transformation Plan

## Executive Summary

This plan outlines the complete transformation of the swissai-tax project from its current state into a functional AI-powered tax filing platform for all 26 Swiss cantons. The approach involves:

1. **Preservation** of deployment infrastructure (GitHub Actions, AWS configuration)
2. **Removal** of current UI/business logic code
3. **Migration** of proven HomeAI components (authentication, multilingual support, AI integrations)
4. **Adaptation** of HomeAI structure to tax filing use case
5. **Implementation** of tax-specific features (questionnaire, document processing, canton-specific rules)

---

## Part 1: Root Problem Analysis

### Current State Issues
1. **Fragmented Codebase**: Current swissai-tax has partial implementation with tax-specific pages but incomplete architecture
2. **Missing Core Features**: Authentication, user management, database models, and AI integration are incomplete
3. **Reinventing the Wheel**: HomeAI already has proven components (auth, i18n, payment, AI chat) that solve identical problems
4. **Deployment Confusion**: Backend references exist in CI/CD but backend folder structure is incomplete

### Why Complete Rebuild is Necessary
- **Faster Time to Market**: Reusing HomeAI's 80% common infrastructure vs building from scratch
- **Proven Architecture**: HomeAI's tech stack (React + FastAPI + PostgreSQL + AWS) is production-ready
- **Consistency**: Maintain same UX patterns users expect from professional web apps
- **Maintainability**: Single source of truth for common components

---

## Part 2: Infrastructure Preservation Analysis

### Files That MUST BE KEPT (Deployment Critical)

#### 1. GitHub Actions Workflows
```
.github/workflows/
├── cicd.yml                    # Main CI/CD pipeline
└── frontend-build.yml          # Frontend-specific builds
```

**Why Keep**:
- Configured AWS credentials and service ARNs
- Production deployment automation
- Security scanning (Trivy)
- Multi-stage pipeline (backend → frontend → deploy)

**AWS Resources Referenced**:
- App Runner Service ARN: `arn:aws:apprunner:us-east-1:445567083171:service/swissai-tax-api/24aca2fd82984653bccef22774cf1c3b`
- ECR Repository: `swisstax-ai-backend`
- Amplify: Auto-deployment for frontend
- URLs: `api.swissai.tax` and `swissai.tax`

#### 2. Infrastructure Configuration
```
infrastructure/
├── amplify.yml                 # Frontend build config for AWS Amplify
└── buildspec.yml              # Backend Docker build for ECR/App Runner
```

**Why Keep**:
- AWS-specific build instructions
- Custom headers (security, CORS)
- Cache configuration
- Multi-stage Docker builds

#### 3. Root Configuration Files
```
/
├── .env                        # Environment variables
├── .env.example               # Template for developers
├── .gitignore                 # Git exclusions
├── .nvmrc                     # Node version pinning
├── apprunner.yaml            # App Runner service config
├── .apprunnerignore          # Files to exclude from backend deployment
└── start.sh                   # Startup script
```

#### 4. Documentation (Optional Keep)
```
DEPLOYMENT.md                   # AWS deployment instructions
DEPLOYMENT_SETUP.md            # Initial setup guide
README.md                      # Project overview
```

**Action**: Update content to reflect tax platform, keep structure

---

## Part 3: Files & Folders to REMOVE

### Frontend Application Code (Replace with HomeAI)
```
src/
├── components/                 # Current tax-specific components (incomplete)
├── pages/                     # Current pages (Dashboard, Interview, Documents, etc.)
├── theme/                     # Current theme (will use HomeAI theme + adaptations)
├── locales/                   # Incomplete translations
├── hooks/                     # Custom hooks (replace with HomeAI versions)
├── contexts/                  # Auth/state management (replace with HomeAI)
└── api/                       # API clients (replace with HomeAI structure)
```

### Backend Code (Replace with HomeAI)
```
backend/
├── app.py                     # Incomplete FastAPI app
├── models/                    # Incomplete database models
├── services/                  # Incomplete services
├── api/                       # Incomplete routes
├── database/                  # Replace with HomeAI DB structure
└── alembic/                   # Replace with HomeAI migrations
```

### Public Assets (Selective Keep)
```
public/
├── logo-swissai.svg          # KEEP - brand asset
└── [other assets]            # REMOVE - replace with tax-relevant assets
```

### Root Files to Remove
```
/
├── UI_IMPLEMENTATION_PLAN.md         # DELETE (outdated)
├── lambda-deployment.zip             # DELETE (not used)
├── IMPLEMENTATION_PLAN.md            # DELETE (superseded by this plan)
├── SWISSAI_TAX_TRANSFORMATION_PLAN.md # DELETE (superseded)
└── config-overrides.js              # KEEP if needed for webpack customization
```

---

## Part 4: HomeAI Code Analysis & Migration Map

### A. Backend Structure (from /HomeAiCode/BE/)

#### Core Backend Files to Copy & Adapt

**1. FastAPI Application Core**
```
BE/main.py                          → backend/main.py
BE/config.py                        → backend/config.py
BE/requirements.txt                 → backend/requirements.txt
```
**Adaptation Needed**:
- Update `config.py`: Change DB name from `homeai_db` to `swissai_tax_db` (or reuse existing)
- Update API routes to reflect tax domain
- Keep authentication, CORS, middleware as-is

**2. Database Models**
```
BE/models/
├── user.py                         → backend/models/user.py (KEEP as-is)
├── subscription.py                 → backend/models/subscription.py (KEEP)
└── [other models]                  → Analyze and copy relevant ones
```
**New Models Needed**:
- `tax_filing.py` - Stores user's tax filing sessions
- `questionnaire_response.py` - Q&A answers (Q01-Q14)
- `tax_document.py` - Uploaded documents
- `canton_config.py` - Canton-specific rules (26 cantons)
- `deduction.py` - Tax deductions calculated by AI

**3. Database Setup**
```
BE/alembic/                         → backend/alembic/
BE/alembic.ini                      → backend/alembic.ini
BE/db/                              → backend/db/
```
**Action**:
- Copy migration framework
- Create new migrations for tax-specific tables
- **Database Connection**: Use existing `homeai_db` with new tables (as per CLAUDE.md instructions)

**4. Authentication & User Management**
```
BE/routes/auth.py (if exists)       → backend/api/auth.py
BE/services/auth_service.py         → backend/services/auth_service.py
```
**Features to Preserve**:
- Social login (Google, etc.)
- JWT token management
- Password reset flow
- Email verification

**5. AI Integration**
```
BE/services/ai_service.py           → backend/services/ai_service.py
BE/prompts_config/                  → backend/prompts_config/
```
**Adaptation**:
- Reuse LiteLLM/OpenAI integration
- Create tax-specific prompts:
  - Document OCR extraction
  - Deduction recommendation
  - Error checking
  - Filing preparation

**6. Document Processing**
```
BE/services/document_processor.py   → backend/services/document_processor.py
```
**Features**:
- AWS S3 upload handling
- OCR/text extraction (already implemented in HomeAI)
- File validation

**7. API Routes Structure**
```
BE/routes/
├── users.py                        → backend/api/users.py
├── subscriptions.py                → backend/api/subscriptions.py
└── [others]                        → Analyze and copy
```
**New Routes Needed**:
- `/api/tax-filings` - CRUD for tax filing sessions
- `/api/questionnaire` - Submit Q&A responses
- `/api/documents/upload` - Tax document upload
- `/api/documents/extract` - OCR extraction
- `/api/deductions/calculate` - AI deduction calculation
- `/api/filing/generate` - Generate final tax declaration PDF

**8. AWS/Lambda Functions**
```
BE/lambda_functions/                → backend/lambda_functions/
BE/lambda_trigger.py                → backend/lambda_trigger.py
```
**Action**: Copy if relevant for async processing (document OCR jobs)

---

### B. Frontend Structure (from /HomeAiCode/FE/)

#### Core Frontend Files to Copy & Adapt

**1. Application Entry & Config**
```
FE/src/index.js                     → src/index.js (KEEP structure)
FE/src/App.js                       → src/App.js (routing + providers)
FE/src/i18n.js                      → src/i18n.js (multilingual)
FE/package.json                     → package.json (merge dependencies)
```

**2. Authentication & User Management**
```
FE/src/contexts/
├── AuthContext.js                  → src/contexts/AuthContext.js
├── UserContext.js                  → src/contexts/UserContext.js
└── LanguageContext.js              → src/contexts/LanguageContext.js
```
**Why**: Proven auth flow with social login, token refresh, protected routes

**3. UI Components (Reusable)**
```
FE/src/components/
├── header/                         → src/components/header/ (adapt branding)
├── footer/                         → src/components/footer/ (adapt branding)
├── LanguageSelector/               → src/components/LanguageSelector/ (KEEP)
├── LanguageWrapper/                → src/components/LanguageWrapper/ (KEEP)
├── button/                         → src/components/button/
├── ErrorBoundary/                  → src/components/ErrorBoundary/
├── common/                         → src/components/common/
├── contactForm/                    → src/components/contactForm/ (adapt for tax support)
└── [Material-UI wrappers]          → Copy as needed
```

**4. Page Templates**
```
FE/src/pages/
├── Home/                           → src/pages/Homepage/ (adapt content)
├── Layout/                         → src/pages/Layout/ (KEEP structure)
├── LoggedInLayout/                 → src/pages/LoggedInLayout/ (KEEP)
├── MyAccount/                      → src/pages/MyAccount/ (KEEP)
├── ForgotPassword/                 → src/pages/ForgotPassword/ (KEEP)
├── ResetPassword/                  → src/pages/ResetPassword/ (KEEP)
├── GoogleCallback/                 → src/pages/GoogleCallback/ (KEEP)
├── FAQ/                            → src/pages/FAQ/ (adapt content)
├── Contact/                        → src/pages/Contact/ (adapt content)
├── About/                          → src/pages/About/ (NEW content)
└── Features/                       → src/pages/Features/ (NEW content)
```

**5. New Tax-Specific Pages**
```
NEW: src/pages/TaxFiling/
├── TaxQuestionnaire.jsx            # Q01-Q14 dynamic questionnaire
├── ProfileSummary.jsx              # Review Q&A answers
├── DocumentChecklist.jsx           # Upload required docs (R1-R9)
├── DocumentUpload.jsx              # File upload interface
├── ReviewFiling.jsx                # Final review before submission
└── FilingConfirmation.jsx          # Success page
```

**6. API Integration**
```
FE/src/api/
├── client.js                       → src/api/client.js (axios setup)
├── authApi.js                      → src/api/authApi.js
├── userApi.js                      → src/api/userApi.js
└── NEW: taxFilingApi.js            # Tax-specific endpoints
```

**7. Redux/State Management**
```
FE/src/store/                       → src/store/ (if using Redux)
FE/src/hooks/                       → src/hooks/ (custom hooks)
```

**8. Styling & Theme**
```
FE/src/theme/                       → src/theme/
```
**Adaptation**:
- Update color palette to Swiss Red (#DC0018) + Federal Blue (#003DA5)
- Keep Material-UI theme structure
- Professional typography (Inter/SF Pro)

**9. Localization Files**
```
FE/src/locales/
├── en/                             → src/locales/en/
├── de/                             → src/locales/de/
├── fr/                             → src/locales/fr/
└── it/                             → src/locales/it/
```
**Action**: Copy structure, replace all content with tax-specific translations

**10. Assets**
```
FE/src/assets/                      → src/assets/
```
**Action**: Replace with tax-relevant images, icons, videos

---

## Part 5: Tax-Specific Implementation Details

### A. Questionnaire System (Q01-Q14)

**Database Schema**
```sql
CREATE TABLE questionnaire_responses (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    filing_year INTEGER,

    -- Q01: Civil Status
    civil_status VARCHAR(50),
    spouse_first_name VARCHAR(100),
    spouse_last_name VARCHAR(100),
    spouse_dob DATE,
    spouse_has_income BOOLEAN,

    -- Q02: Address
    address_street VARCHAR(200),
    address_zip VARCHAR(10),
    address_city VARCHAR(100),
    canton VARCHAR(2),

    -- Q03: Children
    has_children BOOLEAN,
    children_count INTEGER,
    children_details JSONB,  -- [{firstName, birthYear}, ...]

    -- Q04: Church Tax
    user_church_tax VARCHAR(50),
    spouse_church_tax VARCHAR(50),

    -- Q05: Employment
    employer_count INTEGER,
    employers JSONB,  -- [{name, workload, period}, ...]

    -- Q06: Other Income
    other_income_types JSONB,  -- ['unemployment', 'sickness', ...]

    -- Q07-Q08: Commute
    commute_days_per_week INTEGER,
    commute_mode VARCHAR(50),
    public_transport_cost DECIMAL(10,2),
    commute_distance_km DECIMAL(10,2),

    -- Q09: Meals
    meal_option VARCHAR(100),

    -- Q10: Pillar 3a
    pillar3a_amount DECIMAL(10,2),
    spouse_pillar3a_amount DECIMAL(10,2),

    -- Q11: Education
    education_cost DECIMAL(10,2),

    -- Q12: Donations
    donations_amount DECIMAL(10,2),

    -- Q13: Childcare
    childcare_cost DECIMAL(10,2),

    -- Q14: Special Deductions
    special_deductions JSONB,  -- [{type, amount, description}, ...]

    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

**Frontend Component Structure**
```
src/pages/TaxQuestionnaire/
├── TaxQuestionnaire.jsx           # Main orchestrator
├── QuestionStep.jsx               # Individual question renderer
├── questionConfig.js              # Q01-Q14 definitions + branching logic
├── validationSchema.js            # Yup/Joi validation
└── ProgressBar.jsx                # Visual progress indicator
```

**Branching Logic Implementation**
```javascript
// Example: questionConfig.js
export const questions = [
  {
    id: 'Q01',
    type: 'button',
    question: {
      en: 'What is your civil status on 31 Dec 2024?',
      de: 'Welchen Zivilstand hatten Sie am 31.12.2024?'
    },
    choices: ['Single', 'Married', 'Separated', 'Divorced', 'Widowed'],
    nextQuestion: (answer) => answer === 'Married' ? 'Q01a' : 'Q02',
  },
  {
    id: 'Q01a',
    condition: (answers) => answers.Q01 === 'Married',
    type: 'text',
    question: {
      en: "Spouse's first name?",
      de: "Vorname des Ehepartners?"
    },
    nextQuestion: 'Q01b'
  },
  // ... etc
];
```

### B. Document-to-Profile Mapping (R1-R9)

**Profile Generation Service**
```python
# backend/services/profile_service.py

def generate_document_checklist(questionnaire_response):
    """
    Maps questionnaire answers to required documents
    """
    checklist = []

    # R1: Salary certificates
    for employer in questionnaire_response.employers:
        checklist.append({
            'type': 'salary_certificate',
            'description': f'Lohnausweis from {employer.name}',
            'mandatory': True,
            'employer_id': employer.id
        })

    # R2: Unemployment statement
    if 'unemployment' in questionnaire_response.other_income_types:
        checklist.append({
            'type': 'unemployment_statement',
            'description': 'Year-end unemployment statement',
            'mandatory': True
        })

    # R3: Sickness/accident insurance
    if 'sickness' in questionnaire_response.other_income_types:
        checklist.append({
            'type': 'daily_allowance_statement',
            'description': 'Insurer\'s daily allowance statement',
            'mandatory': True
        })

    # R4: Pillar 3a
    if questionnaire_response.pillar3a_amount > 0:
        checklist.append({
            'type': 'pillar3a_statement',
            'description': '3a contribution statement',
            'mandatory': True
        })

    # ... R5-R9 similar logic

    return checklist
```

**Document Upload & OCR**
```python
# backend/services/document_ocr_service.py

async def extract_salary_certificate(document_path: str):
    """
    Extract data from Swiss Lohnausweis using GPT-4 Vision
    """
    # Reuse HomeAI's document processor
    image_base64 = encode_image(document_path)

    prompt = """
    Extract the following information from this Swiss salary certificate (Lohnausweis):
    - Employee name
    - Employer name
    - Gross salary (Bruttolohn)
    - AHV/IV/EO contributions
    - Pension fund contributions
    - Withholding tax (if applicable)
    - Year

    Return as JSON.
    """

    response = await litellm.acompletion(
        model="gpt-4-vision-preview",
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_base64}"}}
            ]
        }]
    )

    return json.loads(response.choices[0].message.content)
```

### C. Canton-Specific Logic

**Canton Configuration**
```python
# backend/models/canton_config.py

CANTON_CONFIGS = {
    'ZH': {
        'name_de': 'Zürich',
        'name_en': 'Zurich',
        'tax_rates': {
            'cantonal': 0.08,
            'communal': 0.12
        },
        'deductions': {
            'commute_max': 3000,
            'pillar3a_max': 7056,
            'childcare_max': 10000
        },
        'filing_deadline': '2025-03-31',
        'online_portal_url': 'https://www.zh.ch/steuererklaerung'
    },
    'BE': {
        'name_de': 'Bern',
        'name_en': 'Bern',
        # ... different rules
    },
    # ... all 26 cantons
}
```

**Deduction Calculation**
```python
# backend/services/deduction_service.py

def calculate_deductions(questionnaire_response, canton):
    config = CANTON_CONFIGS[canton]
    deductions = {}

    # Commute deduction (canton-specific max)
    if questionnaire_response.commute_mode == 'Public':
        deductions['commute'] = min(
            questionnaire_response.public_transport_cost,
            config['deductions']['commute_max']
        )
    elif questionnaire_response.commute_mode == 'Car':
        # Calculate based on distance and days
        deductions['commute'] = calculate_car_commute(
            questionnaire_response.commute_distance_km,
            questionnaire_response.commute_days_per_week,
            config['deductions']['commute_max']
        )

    # Pillar 3a (canton-specific max)
    deductions['pillar3a'] = min(
        questionnaire_response.pillar3a_amount,
        config['deductions']['pillar3a_max']
    )

    # Childcare (canton-specific rules)
    if questionnaire_response.has_children:
        deductions['childcare'] = min(
            questionnaire_response.childcare_cost,
            config['deductions']['childcare_max']
        )

    return deductions
```

---

## Part 6: UI Flow Implementation

### Step 1: Chat Interview (Questionnaire)

**Component**: `src/pages/TaxQuestionnaire/TaxQuestionnaire.jsx`

**Features**:
- One question at a time (progressive disclosure)
- Animated transitions between questions
- Real-time validation
- Progress bar (e.g., "Question 8 of 14")
- Back button to edit previous answers
- Auto-save to backend after each answer

**UX Pattern** (similar to HomeAI chat):
```
┌─────────────────────────────────────────┐
│  SwissAI.Tax  [DE] [User Menu ▼]       │
├─────────────────────────────────────────┤
│                                         │
│  📋 Tax Filing 2024                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━ 57% (8/14)  │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ Wie viele Arbeitgeber hatten    │   │
│  │ Sie im 2024?                    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌───┐  ┌───┐  ┌───┐  ┌───┐  ┌───┐   │
│  │ 1 │  │ 2 │  │ 3 │  │ 4 │  │ 5 │   │
│  └───┘  └───┘  └───┘  └───┘  └───┘   │
│                                         │
│  [← Back]              [Continue →]    │
└─────────────────────────────────────────┘
```

### Step 2: Profile Summary

**Component**: `src/pages/TaxQuestionnaire/ProfileSummary.jsx`

**Features**:
- Read-only card view of all answers
- Grouped by category (Personal, Employment, Deductions)
- Edit button for each section
- CTA: "Generate Document Checklist"

**Layout**:
```
┌─────────────────────────────────────────┐
│  Your Tax Profile Summary              │
├─────────────────────────────────────────┤
│  📄 Personal Information          [Edit]│
│  ├─ Civil Status: Married               │
│  ├─ Children: 2                         │
│  └─ Canton: Zürich                      │
│                                         │
│  💼 Employment                     [Edit]│
│  ├─ ABC AG (80%, Jan-Dec)               │
│  └─ XYZ GmbH (40%, Jun-Dec)             │
│                                         │
│  💰 Deductions to Claim           [Edit]│
│  ├─ Commute: CHF 2,850 (Public)         │
│  ├─ Pillar 3a: CHF 6,500                │
│  ├─ Education: CHF 2,000                │
│  └─ Donations: CHF 600                  │
│                                         │
│  [← Back to Questions]                  │
│  [Generate Document Checklist →]       │
└─────────────────────────────────────────┘
```

### Step 3: Document Checklist & Upload

**Component**: `src/pages/TaxFiling/DocumentChecklist.jsx`

**Features**:
- Checklist generated by R1-R9 rules
- Each document has:
  - Upload button (drag & drop)
  - Status icon (☐ pending → ⟳ processing → ✓ received)
  - Help link ("Don't have this yet?")
  - Preview after upload
- AI auto-fills data from documents
- User can review/correct extracted data

**Layout**:
```
┌─────────────────────────────────────────┐
│  Required Documents                     │
├─────────────────────────────────────────┤
│  ✓ ABC AG Salary Certificate            │
│    └─ Gross: CHF 80,000 ✓  [Review]     │
│                                         │
│  ✓ XYZ GmbH Salary Certificate          │
│    └─ Gross: CHF 40,000 ✓  [Review]     │
│                                         │
│  ✓ Pillar 3a Statement                  │
│    └─ Amount: CHF 6,500 ✓  [Review]     │
│                                         │
│  ⟳ Education Invoice                    │
│    └─ Processing...                     │
│                                         │
│  ☐ Donation Receipts                    │
│    [📎 Upload or Drag & Drop]           │
│    [?] Don't have this yet?             │
│                                         │
│  [Save & Continue Later]                │
│  [Continue to Review →] (disabled)      │
└─────────────────────────────────────────┘
```

### Step 4: Filing Review & E-sign

**Component**: `src/pages/TaxFiling/ReviewFiling.jsx`

**Features**:
- Show calculated tax result
- Itemized deductions
- Estimated refund or payment due
- Final edits allowed
- E-signature capture
- Terms acceptance

---

## Part 7: Database Schema

### ✅ ACTUAL DATABASE DISCOVERED

**Database Name**: `swissai_tax_db`
**Schema**: `swisstax`
**Status**: ✅ Production-ready with 12 tables
**Connection**: `postgresql://webscrapinguser:IXq3IC0Uw6StMkBhb4mb@webscraping-database.cluster-c9y2u088elix.us-east-1.rds.amazonaws.com:5432/swissai_tax_db`
**SSH Tunnel Required**: Yes, via `ubuntu@3.221.26.92` using `/home/cn/Desktop/HomeAiCode/id_rsa`
**Local Connection**: `postgresql://webscrapinguser:IXq3IC0Uw6StMkBhb4mb@localhost:5433/swissai_tax_db` (via tunnel on port 5433)

### Existing Tables in `swisstax` Schema

1. ✅ `users` - User accounts (NEEDS AUTH FIELDS - see below)
2. ✅ `interview_sessions` - Tax filing sessions
3. ✅ `interview_answers` - Q&A responses
4. ✅ `tax_calculations` - Calculated tax amounts
5. ✅ `documents` - Uploaded documents
6. ✅ `document_types` - Document type definitions
7. ✅ `required_documents` - Document checklist per session
8. ✅ `questions` - Question definitions
9. ✅ `tax_rates` - Canton/federal tax rates
10. ✅ `standard_deductions` - Deduction limits
11. ✅ `tax_years` - Tax year configurations
12. ✅ `audit_log` - Audit trail

### 🔧 Required Schema Changes

The existing `users` table is missing authentication fields. We need to add:

```sql
-- Add authentication fields to existing users table
ALTER TABLE swisstax.users ADD COLUMN password_hash VARCHAR(255);
ALTER TABLE swisstax.users ADD COLUMN google_id VARCHAR(255) UNIQUE;
ALTER TABLE swisstax.users ADD COLUMN facebook_id VARCHAR(255) UNIQUE;
ALTER TABLE swisstax.users ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE swisstax.users ADD COLUMN verification_token VARCHAR(255);
ALTER TABLE swisstax.users ADD COLUMN reset_token VARCHAR(255);
ALTER TABLE swisstax.users ADD COLUMN reset_token_expiry TIMESTAMP;

-- Add indexes for performance
CREATE INDEX idx_users_google_id ON swisstax.users(google_id);
CREATE INDEX idx_users_facebook_id ON swisstax.users(facebook_id);
CREATE INDEX idx_users_reset_token ON swisstax.users(reset_token);
```

### Additional Tables Needed (from HomeAI)

```sql
-- Subscriptions table for payment tracking
CREATE TABLE swisstax.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES swisstax.users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL,  -- active, canceled, expired
    plan VARCHAR(50) NOT NULL,    -- basic_filing
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'CHF',
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    stripe_payment_intent_id VARCHAR(255),
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON swisstax.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer_id ON swisstax.subscriptions(stripe_customer_id);

-- Refresh tokens for JWT
CREATE TABLE swisstax.refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES swisstax.users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON swisstax.refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON swisstax.refresh_tokens(token);
```

### Core Tables (Already Exist - Reference Only)

```sql
-- Users (ALREADY EXISTS - just needs auth fields added)
-- See ALTER TABLE statements above

-- Tax Filings (NEW)
CREATE TABLE tax_filings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    filing_year INTEGER NOT NULL,
    canton VARCHAR(2) NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',  -- draft, documents_pending, review, submitted, completed
    questionnaire_completed_at TIMESTAMP,
    documents_uploaded_at TIMESTAMP,
    reviewed_at TIMESTAMP,
    submitted_at TIMESTAMP,
    estimated_refund DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, filing_year)
);

-- Questionnaire Responses (NEW)
CREATE TABLE questionnaire_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_filing_id UUID REFERENCES tax_filings(id) ON DELETE CASCADE,

    -- Personal
    civil_status VARCHAR(50),
    spouse_first_name VARCHAR(100),
    spouse_last_name VARCHAR(100),
    spouse_dob DATE,
    spouse_has_income BOOLEAN,

    address_street VARCHAR(200),
    address_zip VARCHAR(10),
    address_city VARCHAR(100),
    canton VARCHAR(2),

    -- Children
    has_children BOOLEAN,
    children_count INTEGER,
    children_details JSONB,

    -- Church tax
    user_church_tax VARCHAR(50),
    spouse_church_tax VARCHAR(50),

    -- Employment
    employer_count INTEGER,
    employers JSONB,

    -- Other income
    other_income_types JSONB,

    -- Commute
    commute_days_per_week INTEGER,
    commute_mode VARCHAR(50),
    public_transport_cost DECIMAL(10,2),
    commute_distance_km DECIMAL(10,2),

    -- Meals
    meal_option VARCHAR(100),

    -- Pillar 3a
    pillar3a_amount DECIMAL(10,2),
    spouse_pillar3a_amount DECIMAL(10,2),

    -- Education
    education_cost DECIMAL(10,2),

    -- Donations
    donations_amount DECIMAL(10,2),

    -- Childcare
    childcare_cost DECIMAL(10,2),

    -- Special
    special_deductions JSONB,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tax Documents (NEW)
CREATE TABLE tax_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_filing_id UUID REFERENCES tax_filings(id) ON DELETE CASCADE,
    document_type VARCHAR(100),  -- salary_certificate, pillar3a_statement, etc.
    file_name VARCHAR(255),
    file_path VARCHAR(500),
    file_size INTEGER,
    mime_type VARCHAR(100),
    upload_status VARCHAR(50) DEFAULT 'pending',  -- pending, processing, extracted, verified, failed
    extracted_data JSONB,  -- OCR results
    verified_data JSONB,   -- User-confirmed data
    uploaded_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Deductions (NEW)
CREATE TABLE deductions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tax_filing_id UUID REFERENCES tax_filings(id) ON DELETE CASCADE,
    deduction_type VARCHAR(100),  -- commute, pillar3a, education, childcare, etc.
    amount_claimed DECIMAL(10,2),
    amount_approved DECIMAL(10,2),
    canton_max DECIMAL(10,2),
    source VARCHAR(50),  -- 'questionnaire', 'document', 'ai_recommendation'
    ai_confidence DECIMAL(3,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Subscriptions (from HomeAI, adapt pricing)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan VARCHAR(50),  -- 'basic', 'premium', 'multiple_cantons'
    status VARCHAR(50),  -- active, canceled, expired
    amount DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'CHF',
    stripe_subscription_id VARCHAR(255),
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Part 8: Step-by-Step Implementation Plan

### Phase 0: Preparation & Cleanup

**Status Tracking:**
- [x] Step 0.1: Backup Current State ✅ (backup-before-rebuild branch)
- [x] Step 0.2: Audit Infrastructure Files ✅ (audit saved to /tmp/swissai-infra-audit.txt)
- [x] Step 0.3: Preserve Critical Files ✅ (saved to /tmp/swissai-preserve/)
- [x] Step 0.4: Update Database Schema ✅ (auth fields, subscriptions, refresh_tokens tables added)
- [x] Step 0.5: Remove Outdated Files ✅ (UI_IMPLEMENTATION_PLAN.md, lambda-deployment.zip already removed)

---

**Step 0.1: Backup Current State**
```bash
# Create backup branch
git checkout -b backup-before-rebuild
git push origin backup-before-rebuild

# Return to main
git checkout main
```

**Step 0.2: Audit Infrastructure Files**
```bash
# Use AWS CLI to verify current deployments
aws apprunner describe-service \
  --service-arn arn:aws:apprunner:us-east-1:445567083171:service/swissai-tax-api/24aca2fd82984653bccef22774cf1c3b

# Check Amplify app
aws amplify list-apps

# Verify ECR repository
aws ecr describe-repositories --repository-names swisstax-ai-backend
```
**Output**: Document current AWS state for reference

**Step 0.3: Preserve Critical Files**
```bash
# Create temp folder for files to preserve
mkdir -p /tmp/swissai-preserve

# Copy infrastructure
cp -r .github /tmp/swissai-preserve/
cp -r infrastructure /tmp/swissai-preserve/
cp .env /tmp/swissai-preserve/
cp .env.example /tmp/swissai-preserve/
cp apprunner.yaml /tmp/swissai-preserve/
cp .apprunnerignore /tmp/swissai-preserve/
cp .gitignore /tmp/swissai-preserve/
cp .nvmrc /tmp/swissai-preserve/
cp start.sh /tmp/swissai-preserve/
cp public/logo-swissai.svg /tmp/swissai-preserve/

# Copy documentation (will update content later)
cp DEPLOYMENT.md /tmp/swissai-preserve/
