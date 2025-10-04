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
- [ ] Step 0.1: Backup Current State
- [ ] Step 0.2: Audit Infrastructure Files
- [ ] Step 0.3: Preserve Critical Files
- [ ] Step 0.4: Update Database Schema
- [ ] Step 0.5: Remove Outdated Files

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
cp DEPLOYMENT_SETUP.md /tmp/swissai-preserve/
cp README.md /tmp/swissai-preserve/
```

**Step 0.4: Remove Current Code**
```bash
# Remove frontend source
rm -rf src/
rm -rf public/*  # Will restore logo

# Remove backend
rm -rf backend/

# Remove build artifacts
rm -rf build/
rm -rf node_modules/

# Remove outdated docs
rm -f UI_IMPLEMENTATION_PLAN.md
rm -f IMPLEMENTATION_PLAN.md
rm -f SWISSAI_TAX_TRANSFORMATION_PLAN.md
rm -f lambda-deployment.zip

# Keep package.json for now (will merge with HomeAI version)
```

---

### Phase 1: Backend Migration

**Step 1.1: Copy HomeAI Backend Core**
```bash
# Create backend directory
mkdir backend

# Copy main application files
cp /home/cn/Desktop/HomeAiCode/BE/main.py backend/
cp /home/cn/Desktop/HomeAiCode/BE/config.py backend/
cp /home/cn/Desktop/HomeAiCode/BE/requirements.txt backend/

# Copy database setup
cp -r /home/cn/Desktop/HomeAiCode/BE/alembic backend/
cp /home/cn/Desktop/HomeAiCode/BE/alembic.ini backend/
```

**Step 1.2: Copy & Adapt Models**
```bash
# Copy models directory
cp -r /home/cn/Desktop/HomeAiCode/BE/models backend/

# Review copied models:
# - user.py (keep as-is)
# - subscription.py (keep, adapt pricing)
# - [others] (analyze and decide)
```

**Manual Work**:
- Create new tax-specific models:
  - `backend/models/tax_filing.py`
  - `backend/models/questionnaire_response.py`
  - `backend/models/tax_document.py`
  - `backend/models/deduction.py`
  - `backend/models/canton_config.py`

**Step 1.3: Copy Services**
```bash
# Copy services
mkdir backend/services
cp -r /home/cn/Desktop/HomeAiCode/BE/services/* backend/services/

# Key services to adapt:
# - auth_service.py (keep as-is)
# - ai_service.py (adapt prompts for tax)
# - document_processor.py (adapt for tax documents)
```

**Manual Work**:
- Create new services:
  - `backend/services/questionnaire_service.py`
  - `backend/services/profile_service.py` (Q&A → document checklist)
  - `backend/services/deduction_service.py` (calculate deductions)
  - `backend/services/ocr_service.py` (extract from tax documents)
  - `backend/services/filing_service.py` (generate final PDF)

**Step 1.4: Copy & Adapt API Routes**
```bash
# Copy routes/api directory
mkdir backend/api
cp -r /home/cn/Desktop/HomeAiCode/BE/routes/* backend/api/ || \
cp -r /home/cn/Desktop/HomeAiCode/BE/api/* backend/api/

# Review and keep:
# - auth.py (authentication endpoints)
# - users.py (user management)
# - subscriptions.py (payment/plans)
```

**Manual Work**:
- Create new API routes:
  - `backend/api/tax_filings.py` - CRUD for tax filings
  - `backend/api/questionnaire.py` - Submit Q&A
  - `backend/api/documents.py` - Upload & OCR
  - `backend/api/deductions.py` - Calculate deductions
  - `backend/api/cantons.py` - Canton info

**Step 1.5: Update Configuration**
```bash
# Edit backend/config.py
```

**Changes Needed**:
```python
# Update database connection (use existing homeai_db or create new)
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://webscrapinguser:IXq3IC0Uw6StMkBhb4mb@webscraping-database.cluster-c9y2u088elix.us-east-1.rds.amazonaws.com:5432/homeai_db"
)

# Add tax-specific config
TAX_FILING_COST = 49.00  # CHF
CURRENT_TAX_YEAR = 2024
SUPPORTED_CANTONS = ['ZH', 'BE', 'VD', 'GE', ...]  # All 26
```

**Step 1.6: Update main.py**
```python
# Edit backend/main.py

# Import new routes
from api import tax_filings, questionnaire, documents, deductions, cantons

# Register routes
app.include_router(tax_filings.router, prefix="/api/tax-filings", tags=["Tax Filings"])
app.include_router(questionnaire.router, prefix="/api/questionnaire", tags=["Questionnaire"])
app.include_router(documents.router, prefix="/api/documents", tags=["Documents"])
app.include_router(deductions.router, prefix="/api/deductions", tags=["Deductions"])
app.include_router(cantons.router, prefix="/api/cantons", tags=["Cantons"])
```

**Step 1.7: Database Migrations**
```bash
# Initialize Alembic (if not already)
cd backend
alembic init alembic  # Skip if already copied

# Create migration for tax tables
alembic revision --autogenerate -m "Add tax filing tables"

# Review generated migration, then apply
alembic upgrade head
```

**Step 1.8: Test Backend Locally**
```bash
# Install dependencies
cd backend
pip install -r requirements.txt

# Run locally
uvicorn main:app --reload --port 8000

# Test endpoints
curl http://localhost:8000/docs  # Swagger UI
```

---

### Phase 2: Frontend Migration

**Step 2.1: Setup React App Structure**
```bash
# Copy package.json from HomeAI and merge dependencies
cp /home/cn/Desktop/HomeAiCode/FE/package.json package.json.homeai

# Merge dependencies manually (keep all from HomeAI + any new ones)
# Result: package.json with combined deps
```

**Step 2.2: Copy Source Directory Structure**
```bash
# Create src directory
mkdir src

# Copy core files
cp /home/cn/Desktop/HomeAiCode/FE/src/index.js src/
cp /home/cn/Desktop/HomeAiCode/FE/src/App.js src/
cp /home/cn/Desktop/HomeAiCode/FE/src/index.css src/
cp /home/cn/Desktop/HomeAiCode/FE/src/i18n.js src/

# Copy contexts (auth, user, language)
cp -r /home/cn/Desktop/HomeAiCode/FE/src/contexts src/

# Copy API client setup
cp -r /home/cn/Desktop/HomeAiCode/FE/src/api src/

# Copy hooks
cp -r /home/cn/Desktop/HomeAiCode/FE/src/hooks src/

# Copy theme
cp -r /home/cn/Desktop/HomeAiCode/FE/src/theme src/
```

**Step 2.3: Copy Reusable Components**
```bash
mkdir src/components

# Copy essential components
cp -r /home/cn/Desktop/HomeAiCode/FE/src/components/header src/components/
cp -r /home/cn/Desktop/HomeAiCode/FE/src/components/footer src/components/
cp -r /home/cn/Desktop/HomeAiCode/FE/src/components/LanguageSelector src/components/
cp -r /home/cn/Desktop/HomeAiCode/FE/src/components/LanguageWrapper src/components/
cp -r /home/cn/Desktop/HomeAiCode/FE/src/components/ErrorBoundary src/components/
cp -r /home/cn/Desktop/HomeAiCode/FE/src/components/button src/components/
cp -r /home/cn/Desktop/HomeAiCode/FE/src/components/common src/components/
cp -r /home/cn/Desktop/HomeAiCode/FE/src/components/contactForm src/components/

# Copy others as needed (review FE/src/components for useful ones)
```

**Step 2.4: Copy & Adapt Page Templates**
```bash
mkdir src/pages

# Copy authentication pages (keep as-is)
cp -r /home/cn/Desktop/HomeAiCode/FE/src/pages/ForgotPassword src/pages/
cp -r /home/cn/Desktop/HomeAiCode/FE/src/pages/ResetPassword src/pages/
cp -r /home/cn/Desktop/HomeAiCode/FE/src/pages/GoogleCallback src/pages/

# Copy account pages
cp -r /home/cn/Desktop/HomeAiCode/FE/src/pages/MyAccount src/pages/
cp -r /home/cn/Desktop/HomeAiCode/FE/src/pages/EditProfile src/pages/

# Copy layout pages
cp -r /home/cn/Desktop/HomeAiCode/FE/src/pages/Layout src/pages/
cp -r /home/cn/Desktop/HomeAiCode/FE/src/pages/LoggedInLayout src/pages/

# Copy public pages (will adapt content)
cp -r /home/cn/Desktop/HomeAiCode/FE/src/pages/Home src/pages/Homepage
cp -r /home/cn/Desktop/HomeAiCode/FE/src/pages/About src/pages/
cp -r /home/cn/Desktop/HomeAiCode/FE/src/pages/Contact src/pages/
cp -r /home/cn/Desktop/HomeAiCode/FE/src/pages/FAQ src/pages/
cp -r /home/cn/Desktop/HomeAiCode/FE/src/pages/Features src/pages/
cp -r /home/cn/Desktop/HomeAiCode/FE/src/pages/HowItWork src/pages/
```

**Manual Work** (Step 2.4 continued):
- Create new tax-specific pages:
  ```bash
  mkdir -p src/pages/TaxFiling
  ```
  - `src/pages/TaxFiling/TaxQuestionnaire.jsx`
  - `src/pages/TaxFiling/ProfileSummary.jsx`
  - `src/pages/TaxFiling/DocumentChecklist.jsx`
  - `src/pages/TaxFiling/DocumentUpload.jsx`
  - `src/pages/TaxFiling/ReviewFiling.jsx`
  - `src/pages/TaxFiling/FilingConfirmation.jsx`

**Step 2.5: Copy Localization**
```bash
# Copy locales structure
cp -r /home/cn/Desktop/HomeAiCode/FE/src/locales src/
```

**Manual Work**:
- Replace all translation strings with tax-specific content
- Add new translation keys for:
  - All Q01-Q14 questions (EN, DE, FR, IT)
  - Document types
  - Tax terminology
  - Canton names

**Step 2.6: Copy & Adapt Theme**
```bash
# Theme already copied in Step 2.2
# Edit src/theme/theme.js
```

**Changes**:
```javascript
// Update color palette
export const colors = {
  primary: '#DC0018',      // Swiss Red
  secondary: '#003DA5',    // Federal Blue
  success: '#00A651',      // Swiss Green
  warning: '#FFB81C',      // Gold
  // ... rest
};

// Update typography for professional tax service
export const typography = {
  fontFamily: "'Inter', 'SF Pro Display', -apple-system, sans-serif",
  h1: {
    fontSize: '2.5rem',
    fontWeight: 700,
    // ...
  },
  // ...
};
```

**Step 2.7: Update App.js Routing**
```javascript
// Edit src/App.js

import TaxQuestionnaire from './pages/TaxFiling/TaxQuestionnaire';
import ProfileSummary from './pages/TaxFiling/ProfileSummary';
import DocumentChecklist from './pages/TaxFiling/DocumentChecklist';
// ... other tax pages

// Add routes
<Route path="/tax-filing/start" element={<TaxQuestionnaire />} />
<Route path="/tax-filing/summary" element={<ProfileSummary />} />
<Route path="/tax-filing/documents" element={<DocumentChecklist />} />
// ... etc
```

**Step 2.8: Create Tax-Specific API Client**
```javascript
// Create src/api/taxFilingApi.js

import axios from './client';

export const taxFilingApi = {
  // Create new filing
  createFiling: (year, canton) =>
    axios.post('/api/tax-filings', { filing_year: year, canton }),

  // Get user's filings
  getFilings: () =>
    axios.get('/api/tax-filings'),

  // Submit questionnaire
  submitQuestionnaire: (filingId, responses) =>
    axios.post(`/api/tax-filings/${filingId}/questionnaire`, responses),

  // Generate document checklist
  generateChecklist: (filingId) =>
    axios.post(`/api/tax-filings/${filingId}/generate-checklist`),

  // Upload document
  uploadDocument: (filingId, file, documentType) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    return axios.post(`/api/tax-filings/${filingId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },

  // Get extracted data
  getExtractedData: (filingId, documentId) =>
    axios.get(`/api/tax-filings/${filingId}/documents/${documentId}/extracted`),

  // Calculate deductions
  calculateDeductions: (filingId) =>
    axios.post(`/api/tax-filings/${filingId}/deductions/calculate`),

  // Generate final filing
  generateFiling: (filingId) =>
    axios.post(`/api/tax-filings/${filingId}/generate`),
};
```

**Step 2.9: Install Dependencies & Test**
```bash
# Install packages
npm install --legacy-peer-deps

# Run development server
npm start

# Should open http://localhost:3000
```

**Manual Work**:
- Fix any import errors
- Ensure all copied components render
- Test routing

---

### Phase 3: Content Adaptation

**Step 3.1: Update Public Pages Content**

For each public page:
1. **Homepage** (`src/pages/Homepage/Homepage.js`)
   - Replace hero headline with tax-specific copy
   - Update features to tax benefits
   - Replace CTA buttons (e.g., "Start Tax Filing")

2. **How It Works** (`src/pages/HowItWork/HowItWork.jsx`)
   - Replace steps with:
     1. Answer Questions
     2. Upload Documents
     3. AI Reviews & Optimizes
     4. File Your Taxes

3. **Features** (`src/pages/Features/Features.jsx`)
   - Replace feature list:
     - AI-Powered Deduction Detection
     - All 26 Cantons Supported
     - Document OCR
     - Multilingual (DE/FR/IT/EN)
     - Maximum Refund Guarantee
     - Secure & Encrypted

4. **FAQ** (`src/pages/FAQ/FAQ.jsx`)
   - Replace FAQs with tax-specific:
     - "How much does it cost?" → CHF 49
     - "Which cantons are supported?" → All 26
     - "What documents do I need?" → Depends on your profile
     - "Is my data secure?" → Yes, encrypted
     - "How long does it take?" → 20 minutes

5. **About** (`src/pages/About/About.jsx`)
   - Replace company story with SwissAI Tax mission

6. **Contact** (`src/pages/Contact/Contact.jsx`)
   - Update contact form intro text
   - Change subject options to tax-related (Technical Support, Tax Questions, etc.)

**Step 3.2: Update Header & Footer**
```javascript
// Edit src/components/header/Header.jsx

// Update logo
<img src="/logo-swissai.svg" alt="SwissAI Tax" />

// Update nav links
const publicLinks = [
  { label: 'How It Works', path: '/how-it-works' },
  { label: 'Features', path: '/features' },
  { label: 'Pricing', path: '/pricing' },  // Simple page: CHF 49 flat fee
  { label: 'FAQ', path: '/faq' },
  { label: 'Blog', path: '/blog' },
];

const authenticatedLinks = [
  { label: 'My Filings', path: '/tax-filings' },
  { label: 'Start New Filing', path: '/tax-filing/start' },
  { label: 'Account', path: '/account' },
];
```

```javascript
// Edit src/components/footer/Footer.jsx

// Update footer links
<Link to="/how-it-works">How It Works</Link>
<Link to="/features">Features</Link>
<Link to="/pricing">Pricing</Link>
<Link to="/about">About Us</Link>
<Link to="/contact">Contact</Link>
<Link to="/terms">Terms of Service</Link>
<Link to="/privacy">Privacy Policy</Link>

// Update social links, copyright
© 2025 SwissAI Tax. All rights reserved.
```

**Step 3.3: Update Localization Files**
```bash
# Edit src/locales/de/translation.json
# Edit src/locales/en/translation.json
# Edit src/locales/fr/translation.json
# Edit src/locales/it/translation.json
```

**Example** (German):
```json
{
  "nav": {
    "howItWorks": "Wie es funktioniert",
    "features": "Funktionen",
    "pricing": "Preise",
    "faq": "FAQ",
    "myFilings": "Meine Steuererklärungen",
    "startFiling": "Neue Erklärung starten"
  },
  "homepage": {
    "hero": {
      "title": "Steuererklärung in 20 Minuten",
      "subtitle": "KI-gestützt für alle 26 Kantone der Schweiz",
      "cta": "Jetzt starten - CHF 49"
    }
  },
  "questionnaire": {
    "Q01": {
      "question": "Welchen Zivilstand hatten Sie am 31.12.2024?",
      "choices": {
        "single": "Ledig",
        "married": "Verheiratet",
        "separated": "Getrennt",
        "divorced": "Geschieden",
        "widowed": "Verwitwet"
      }
    },
    // ... Q02-Q14
  },
  "documents": {
    "salaryCertificate": "Lohnausweis",
    "pillar3a": "Säule 3a Bescheinigung",
    "unemploymentStatement": "Arbeitslosengeld-Bescheinigung",
    // ... all document types
  }
}
```

**Step 3.4: Update Assets**
```bash
# Restore logo
cp /tmp/swissai-preserve/logo-swissai.svg public/

# Add other assets
mkdir -p public/images
mkdir -p public/videos

# Add stock images for:
# - Tax filing illustrations
# - Swiss canton maps
# - Document examples
# - Success testimonials

# Add explainer videos (or placeholders)
# public/videos/how-it-works.mp4
# public/videos/tutorial-upload.mp4
```

---

### Phase 4: Tax-Specific Feature Implementation

**Step 4.1: Implement Questionnaire (Q01-Q14)**

Create `src/pages/TaxFiling/questionConfig.js`:
```javascript
export const questions = [
  {
    id: 'Q01',
    type: 'button',
    question: {
      en: 'What is your civil status on 31 Dec 2024?',
      de: 'Welchen Zivilstand hatten Sie am 31.12.2024?',
      fr: 'Quel était votre état civil au 31.12.2024?',
      it: 'Qual era il suo stato civile al 31.12.2024?'
    },
    choices: {
      en: ['Single', 'Married', 'Separated', 'Divorced', 'Widowed'],
      de: ['Ledig', 'Verheiratet', 'Getrennt', 'Geschieden', 'Verwitwet'],
      // ... fr, it
    },
    nextQuestion: (answer) => {
      if (answer === 'Married' || answer === 'Verheiratet') {
        return 'Q01a';
      }
      return 'Q02';
    }
  },
  {
    id: 'Q01a',
    condition: (answers) => answers.Q01?.includes('Married') || answers.Q01?.includes('Verheiratet'),
    type: 'text',
    question: {
      en: "Spouse's first name?",
      de: "Vorname des Ehepartners?",
      // ... fr, it
    },
    nextQuestion: 'Q01b'
  },
  // ... Q01b, Q01c, Q01d
  {
    id: 'Q02',
    type: 'multifield',
    question: {
      en: 'Your residential address in 2024',
      de: 'Ihre Wohnadresse 2024',
      // ...
    },
    fields: [
      { name: 'street', label: { en: 'Street', de: 'Strasse' }, type: 'text' },
      { name: 'zip', label: { en: 'ZIP', de: 'PLZ' }, type: 'text' },
      { name: 'city', label: { en: 'City', de: 'Ort' }, type: 'text' },
      { name: 'canton', label: { en: 'Canton', de: 'Kanton' }, type: 'select', options: CANTONS }
    ],
    nextQuestion: 'Q03'
  },
  // ... Q03-Q14
];

export const CANTONS = [
  { value: 'ZH', label: { de: 'Zürich', en: 'Zurich', fr: 'Zurich', it: 'Zurigo' } },
  { value: 'BE', label: { de: 'Bern', en: 'Bern', fr: 'Berne', it: 'Berna' } },
  // ... all 26 cantons
];
```

Create `src/pages/TaxFiling/TaxQuestionnaire.jsx`:
```jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { questions } from './questionConfig';
import QuestionStep from './QuestionStep';
import ProgressBar from './ProgressBar';
import { taxFilingApi } from '../../api/taxFilingApi';

export default function TaxQuestionnaire() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [currentQuestionId, setCurrentQuestionId] = useState('Q01');
  const [answers, setAnswers] = useState({});
  const [filingId, setFilingId] = useState(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Create or resume filing
    initializeFiling();
  }, []);

  const initializeFiling = async () => {
    // Try to get existing filing for current year
    const filings = await taxFilingApi.getFilings();
    const currentYearFiling = filings.find(f => f.filing_year === 2024 && f.status === 'draft');

    if (currentYearFiling) {
      setFilingId(currentYearFiling.id);
      // Load existing answers if any
      if (currentYearFiling.questionnaire_response) {
        setAnswers(currentYearFiling.questionnaire_response);
        // Calculate where to resume
        const lastAnsweredQuestion = findLastAnsweredQuestion(currentYearFiling.questionnaire_response);
        setCurrentQuestionId(lastAnsweredQuestion);
      }
    } else {
      // Create new filing
      const newFiling = await taxFilingApi.createFiling(2024, null);  // Canton selected in Q02
      setFilingId(newFiling.id);
    }
  };

  const handleAnswer = async (questionId, answer) => {
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);

    // Auto-save to backend
    await taxFilingApi.submitQuestionnaire(filingId, newAnswers);

    // Determine next question
    const currentQuestion = questions.find(q => q.id === questionId);
    const nextQuestionId = typeof currentQuestion.nextQuestion === 'function'
      ? currentQuestion.nextQuestion(answer)
      : currentQuestion.nextQuestion;

    if (nextQuestionId) {
      // Check if next question has a condition
      const nextQuestion = questions.find(q => q.id === nextQuestionId);
      if (nextQuestion.condition && !nextQuestion.condition(newAnswers)) {
        // Skip this question, move to next
        handleAnswer(nextQuestionId, null);  // Recursive
      } else {
        setCurrentQuestionId(nextQuestionId);
      }
    } else {
      // All questions answered
      navigate('/tax-filing/summary');
    }

    // Update progress
    const totalQuestions = questions.length;
    const answeredCount = Object.keys(newAnswers).length;
    setProgress((answeredCount / totalQuestions) * 100);
  };

  const handleBack = () => {
    // Find previous question
    const currentIndex = questions.findIndex(q => q.id === currentQuestionId);
    if (currentIndex > 0) {
      setCurrentQuestionId(questions[currentIndex - 1].id);
    }
  };

  const currentQuestion = questions.find(q => q.id === currentQuestionId);

  if (!currentQuestion) return <div>Loading...</div>;

  return (
    <div className="tax-questionnaire-container">
      <ProgressBar
        current={Object.keys(answers).length}
        total={questions.length}
        percentage={progress}
      />

      <QuestionStep
        question={currentQuestion}
        answer={answers[currentQuestionId]}
        onAnswer={(answer) => handleAnswer(currentQuestionId, answer)}
        onBack={handleBack}
        canGoBack={questions.findIndex(q => q.id === currentQuestionId) > 0}
        language={i18n.language}
      />
    </div>
  );
}
```

**Step 4.2: Implement Profile Summary**

Create `src/pages/TaxFiling/ProfileSummary.jsx`:
```jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { taxFilingApi } from '../../api/taxFilingApi';
import { Card, Button } from '@mui/material';

export default function ProfileSummary() {
  const navigate = useNavigate();
  const [filing, setFiling] = useState(null);
  const [questionnaire, setQuestionnaire] = useState(null);

  useEffect(() => {
    loadFiling();
  }, []);

  const loadFiling = async () => {
    const filings = await taxFilingApi.getFilings();
    const currentFiling = filings.find(f => f.filing_year === 2024);
    setFiling(currentFiling);
    setQuestionnaire(currentFiling.questionnaire_response);
  };

  const handleGenerateChecklist = async () => {
    await taxFilingApi.generateChecklist(filing.id);
    navigate('/tax-filing/documents');
  };

  if (!questionnaire) return <div>Loading...</div>;

  return (
    <div className="profile-summary-container">
      <h1>Your Tax Profile Summary</h1>

      <Card>
        <h3>Personal Information <Button onClick={() => navigate('/tax-filing/start')}>Edit</Button></h3>
        <p><strong>Civil Status:</strong> {questionnaire.civil_status}</p>
        {questionnaire.has_children && (
          <p><strong>Children:</strong> {questionnaire.children_count}</p>
        )}
        <p><strong>Canton:</strong> {questionnaire.canton}</p>
      </Card>

      <Card>
        <h3>Employment</h3>
        {questionnaire.employers?.map((emp, idx) => (
          <div key={idx}>
            <p>{emp.name} ({emp.workload}%, {emp.period})</p>
          </div>
        ))}
      </Card>

      <Card>
        <h3>Deductions to Claim</h3>
        <ul>
          {questionnaire.commute_days_per_week > 0 && (
            <li>Commute: CHF {questionnaire.public_transport_cost || 'calculated'} ({questionnaire.commute_mode})</li>
          )}
          {questionnaire.pillar3a_amount > 0 && (
            <li>Pillar 3a: CHF {questionnaire.pillar3a_amount}</li>
          )}
          {questionnaire.education_cost > 0 && (
            <li>Education: CHF {questionnaire.education_cost}</li>
          )}
          {questionnaire.donations_amount > 0 && (
            <li>Donations: CHF {questionnaire.donations_amount}</li>
          )}
          {questionnaire.childcare_cost > 0 && (
            <li>Childcare: CHF {questionnaire.childcare_cost}</li>
          )}
        </ul>
      </Card>

      <div className="actions">
        <Button variant="outlined" onClick={() => navigate('/tax-filing/start')}>
          ← Back to Questions
        </Button>
        <Button variant="contained" onClick={handleGenerateChecklist}>
          Generate Document Checklist →
        </Button>
      </div>
    </div>
  );
}
```

**Step 4.3: Implement Document Checklist & Upload**

Create `src/pages/TaxFiling/DocumentChecklist.jsx`:
```jsx
import React, { useEffect, useState } from 'react';
import { taxFilingApi } from '../../api/taxFilingApi';
import DocumentUploadItem from './DocumentUploadItem';

export default function DocumentChecklist() {
  const [filing, setFiling] = useState(null);
  const [checklist, setChecklist] = useState([]);
  const [uploadedDocs, setUploadedDocs] = useState([]);

  useEffect(() => {
    loadChecklist();
  }, []);

  const loadChecklist = async () => {
    const filings = await taxFilingApi.getFilings();
    const currentFiling = filings.find(f => f.filing_year === 2024);
    setFiling(currentFiling);

    // Checklist was generated in previous step
    setChecklist(currentFiling.document_checklist);
    setUploadedDocs(currentFiling.documents || []);
  };

  const handleUpload = async (checklistItem, file) => {
    await taxFilingApi.uploadDocument(filing.id, file, checklistItem.type);
    // Reload to see new status
    loadChecklist();
  };

  const allDocumentsUploaded = checklist.every(item =>
    uploadedDocs.some(doc => doc.document_type === item.type && doc.upload_status === 'verified')
  );

  return (
    <div className="document-checklist-container">
      <h1>Required Documents</h1>
      <p>Upload the following documents. Our AI will extract the information automatically.</p>

      {checklist.map((item, idx) => {
        const uploadedDoc = uploadedDocs.find(doc => doc.document_type === item.type);
        return (
          <DocumentUploadItem
            key={idx}
            checklistItem={item}
            uploadedDocument={uploadedDoc}
            onUpload={(file) => handleUpload(item, file)}
          />
        );
      })}

      <div className="actions">
        <Button variant="outlined">Save & Continue Later</Button>
        <Button
          variant="contained"
          disabled={!allDocumentsUploaded}
          onClick={() => navigate('/tax-filing/review')}
        >
          Continue to Review →
        </Button>
      </div>
    </div>
  );
}
```

**Step 4.4: Backend - Document OCR Service**

Create `backend/services/ocr_service.py`:
```python
import litellm
import json
import base64
from pathlib import Path

async def extract_salary_certificate(document_path: str):
    """Extract data from Swiss Lohnausweis using GPT-4 Vision"""

    with open(document_path, 'rb') as f:
        image_bytes = f.read()
        image_base64 = base64.b64encode(image_bytes).decode('utf-8')

    prompt = """
    Extract the following information from this Swiss salary certificate (Lohnausweis):

    Required fields:
    - employee_name: Full name of employee
    - employer_name: Full name of employer
    - employer_address: Full address
    - gross_salary: Bruttolohn (total gross salary for the year)
    - ahv_contributions: AHV/IV/EO contributions (employee portion)
    - pension_contributions: BVG/Pensionskasse contributions
    - withholding_tax: Quellensteuer (if applicable, otherwise 0)
    - year: Tax year (e.g. 2024)

    Return ONLY a JSON object with these fields. Amounts should be numbers without CHF symbol.
    Example: {"employee_name": "Max Muster", "gross_salary": 80000, ...}
    """

    response = await litellm.acompletion(
        model="gpt-4-vision-preview",
        messages=[{
            "role": "user",
            "content": [
                {"type": "text", "text": prompt},
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:image/jpeg;base64,{image_base64}"
                    }
                }
            ]
        }],
        temperature=0,  # Deterministic for data extraction
        max_tokens=500
    )

    # Parse JSON from response
    content = response.choices[0].message.content
    # Clean up markdown code blocks if present
    if '```json' in content:
        content = content.split('```json')[1].split('```')[0].strip()
    elif '```' in content:
        content = content.split('```')[1].split('```')[0].strip()

    extracted_data = json.loads(content)
    return extracted_data

async def extract_pillar3a_statement(document_path: str):
    """Extract from Pillar 3a statement"""
    # Similar to above, different prompt
    pass

async def extract_unemployment_statement(document_path: str):
    """Extract from unemployment statement"""
    pass

# ... other document types
```

**Step 4.5: Backend - Deduction Calculation**

Create `backend/services/deduction_service.py`:
```python
from models.canton_config import CANTON_CONFIGS
from decimal import Decimal

def calculate_all_deductions(questionnaire_response, canton: str):
    """
    Calculate all deductions based on questionnaire and canton rules
    """
    config = CANTON_CONFIGS[canton]
    deductions = {}

    # 1. Commute deduction
    if questionnaire_response.commute_days_per_week > 0:
        if questionnaire_response.commute_mode == 'Public':
            deductions['commute'] = min(
                Decimal(questionnaire_response.public_transport_cost or 0),
                Decimal(config['deductions']['commute_max'])
            )
        elif questionnaire_response.commute_mode == 'Car':
            # CHF 0.70 per km, both ways, number of days
            annual_km = (
                questionnaire_response.commute_distance_km * 2 *
                questionnaire_response.commute_days_per_week * 48  # 48 work weeks
            )
            calculated_cost = annual_km * Decimal('0.70')
            deductions['commute'] = min(
                calculated_cost,
                Decimal(config['deductions']['commute_max'])
            )

    # 2. Pillar 3a
    if questionnaire_response.pillar3a_amount:
        deductions['pillar3a'] = min(
            Decimal(questionnaire_response.pillar3a_amount),
            Decimal(config['deductions']['pillar3a_max'])
        )

    # 3. Education costs
    if questionnaire_response.education_cost:
        deductions['education'] = min(
            Decimal(questionnaire_response.education_cost),
            Decimal(config['deductions'].get('education_max', 12000))
        )

    # 4. Donations
    if questionnaire_response.donations_amount:
        # Most cantons allow up to 20% of net income
        # Simplified: Allow full amount up to CHF 20,000
        deductions['donations'] = min(
            Decimal(questionnaire_response.donations_amount),
            Decimal(20000)
        )

    # 5. Childcare
    if questionnaire_response.childcare_cost:
        deductions['childcare'] = min(
            Decimal(questionnaire_response.childcare_cost),
            Decimal(config['deductions'].get('childcare_max', 10000))
        )

    # 6. Meal deductions
    meal_deduction = calculate_meal_deduction(
        questionnaire_response.meal_option,
        questionnaire_response.commute_days_per_week,
        canton
    )
    if meal_deduction > 0:
        deductions['meals'] = meal_deduction

    # 7. Standard personal deductions (automatic)
    if questionnaire_response.civil_status == 'Married':
        deductions['personal_allowance'] = Decimal(config['deductions'].get('married_allowance', 26000))
    else:
        deductions['personal_allowance'] = Decimal(config['deductions'].get('single_allowance', 13000))

    # 8. Child allowances
    if questionnaire_response.children_count:
        deductions['child_allowance'] = (
            Decimal(questionnaire_response.children_count) *
            Decimal(config['deductions'].get('per_child', 6500))
        )

    # Total
    total_deductions = sum(deductions.values())

    return {
        'deductions': deductions,
        'total': float(total_deductions),
        'canton': canton,
        'canton_max_limits': config['deductions']
    }

def calculate_meal_deduction(meal_option: str, days_per_week: int, canton: str):
    """Calculate meal deduction based on option"""
    if meal_option == 'No (pay myself)':
        # CHF 15 per day, limited to work days
        daily_rate = Decimal('15.00')
        work_days_per_year = days_per_week * 48  # 48 work weeks
        return daily_rate * work_days_per_year
    return Decimal('0.00')
```

**Step 4.6: Backend - Canton Configuration**

Create `backend/models/canton_config.py`:
```python
# All 26 Swiss cantons with their tax rules
CANTON_CONFIGS = {
    'ZH': {
        'name_de': 'Zürich',
        'name_en': 'Zurich',
        'name_fr': 'Zurich',
        'name_it': 'Zurigo',
        'tax_rates': {
            'cantonal': 0.08,
            'communal': 0.12
        },
        'deductions': {
            'commute_max': 3000,
            'pillar3a_max': 7056,
            'childcare_max': 10000,
            'education_max': 12000,
            'married_allowance': 26000,
            'single_allowance': 13000,
            'per_child': 6500
        },
        'filing_deadline': '2025-03-31',
        'online_portal_url': 'https://www.zh.ch/steuererklaerung'
    },
    'BE': {
        'name_de': 'Bern',
        'name_en': 'Bern',
        'name_fr': 'Berne',
        'name_it': 'Berna',
        'tax_rates': {
            'cantonal': 0.075,
            'communal': 0.14
        },
        'deductions': {
            'commute_max': 3200,
            'pillar3a_max': 7056,
            'childcare_max': 8000,
            'education_max': 10000,
            'married_allowance': 24000,
            'single_allowance': 12000,
            'per_child': 6000
        },
        'filing_deadline': '2025-03-15',
        'online_portal_url': 'https://www.taxme.ch'
    },
    'VD': {
        'name_de': 'Waadt',
        'name_en': 'Vaud',
        'name_fr': 'Vaud',
        'name_it': 'Vaud',
        'tax_rates': {
            'cantonal': 0.09,
            'communal': 0.13
        },
        'deductions': {
            'commute_max': 3000,
            'pillar3a_max': 7056,
            'childcare_max': 9000,
            'education_max': 12000,
            'married_allowance': 25000,
            'single_allowance': 13000,
            'per_child': 7000
        },
        'filing_deadline': '2025-03-31',
        'online_portal_url': 'https://www.vd.ch/impots'
    },
    # ... Add all 26 cantons
    # AG, AI, AR, BL, BS, FR, GE, GL, GR, JU, LU, NE, NW, OW, SG, SH, SO, SZ, TG, TI, UR, VD, VS, ZG, ZH
}

def get_canton_info(canton_code: str):
    """Get canton configuration by code"""
    return CANTON_CONFIGS.get(canton_code)

def get_all_cantons():
    """Get list of all cantons"""
    return [
        {
            'code': code,
            'name_de': config['name_de'],
            'name_en': config['name_en'],
            'name_fr': config['name_fr'],
            'name_it': config['name_it']
        }
        for code, config in CANTON_CONFIGS.items()
    ]
```

---

### Phase 5: Testing & Quality Assurance

**Step 5.1: Backend Unit Tests**
```bash
# Create backend/tests/
mkdir backend/tests

# Test files:
# - test_ocr_service.py
# - test_deduction_service.py
# - test_profile_service.py
# - test_api_routes.py
```

**Step 5.2: Frontend Unit Tests**
```bash
# Test files:
# - src/pages/TaxFiling/__tests__/TaxQuestionnaire.test.jsx
# - src/pages/TaxFiling/__tests__/ProfileSummary.test.jsx
# - src/pages/TaxFiling/__tests__/DocumentChecklist.test.jsx
```

**Step 5.3: Integration Tests**
```bash
# Test full user flow:
# 1. Register → 2. Start Filing → 3. Complete Q&A → 4. Upload Docs → 5. Review → 6. Submit
```

**Step 5.4: Run CI Pipeline Locally**
```bash
# Frontend build
npm run build

# Backend tests
cd backend
pytest

# Code quality
black --check .
flake8 .
```

---

### Phase 6: Deployment

**Step 6.1: Update Environment Variables**
```bash
# Update .env for production
DATABASE_URL=postgresql://webscrapinguser:IXq3IC0Uw6StMkBhb4mb@...
OPENAI_API_KEY=sk-...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_S3_BUCKET=swissai-tax-documents
STRIPE_SECRET_KEY=sk_live_...
FRONTEND_URL=https://swissai.tax
BACKEND_URL=https://api.swissai.tax
```

**Step 6.2: Database Migration on Production**
```bash
# SSH to backend (or use App Runner console)
# Run migrations
alembic upgrade head
```

**Step 6.3: Deploy Backend**
```bash
# Commit all changes
git add .
git commit -m "Complete SwissAI Tax rebuild - backend ready"
git push origin main

# GitHub Actions will:
# 1. Run backend CI
# 2. Build Docker image
# 3. Push to ECR
# 4. Deploy to App Runner
```

**Step 6.4: Deploy Frontend**
```bash
# GitHub Actions will:
# 1. Run frontend CI
# 2. Build React app
# 3. Deploy to Amplify (auto-triggered on push to main)
```

**Step 6.5: Verify Deployment**
```bash
# Check backend
curl https://api.swissai.tax/docs

# Check frontend
open https://swissai.tax

# Monitor logs
aws apprunner list-operations --service-arn ...
aws logs tail /aws/apprunner/swissai-tax-api --follow
```

---

## Part 9: Impact Analysis

### Positive Impacts

1. **Faster Development**
   - **Before**: Build everything from scratch (~3-4 months)
   - **After**: Reuse HomeAI components (~3-4 weeks)
   - **Impact**: 75% time savings

2. **Production-Ready Architecture**
   - Proven auth system (social login, JWT, password reset)
   - Battle-tested payment integration (Stripe)
   - Multilingual support (4 languages)
   - **Impact**: Fewer bugs, faster launch

3. **Consistent User Experience**
   - Users familiar with HomeAI will recognize patterns
   - Professional UI from day 1
   - **Impact**: Lower bounce rate, higher conversion

4. **Maintainability**
   - Single codebase patterns across products
   - Shared components can be extracted to library
   - **Impact**: Easier to hire devs, faster feature additions

5. **Scalability**
   - AWS infrastructure ready for high load
   - Database optimized (HomeAI handles 1000s of users)
   - **Impact**: Can handle tax season spikes

### Risks & Mitigation

1. **Risk: Breaking HomeAI**
   - **Mitigation**: Never modify HomeAI codebase directly; only copy files

2. **Risk: Missing Tax-Specific Features**
   - **Mitigation**: This plan identifies all gaps (questionnaire, documents, cantons)

3. **Risk: Complex Migration**
   - **Mitigation**: Phase-by-phase approach; can pause/rollback at any phase

4. **Risk: Database Schema Conflicts**
   - **Mitigation**: Use same DB with separate tables; no foreign keys between products initially

5. **Risk: CI/CD Failures**
   - **Mitigation**: Test locally first; infrastructure preserved from current setup

---

## Part 10: Success Criteria

### Phase 1 Complete (Backend)
- ✅ Backend runs locally (`uvicorn main:app --reload`)
- ✅ Database migrations applied
- ✅ Auth endpoints work (register, login, reset password)
- ✅ Tax filing CRUD endpoints work

### Phase 2 Complete (Frontend)
- ✅ Frontend runs locally (`npm start`)
- ✅ User can register/login
- ✅ Language switcher works
- ✅ Protected routes work

### Phase 3 Complete (Content)
- ✅ All public pages have tax-specific content
- ✅ Translations complete (DE, EN, FR, IT)
- ✅ Branding updated (logo, colors, copy)

### Phase 4 Complete (Tax Features)
- ✅ Q01-Q14 questionnaire works end-to-end
- ✅ Profile summary displays correctly
- ✅ Document checklist generates correctly
- ✅ Document upload + OCR works
- ✅ Deduction calculation works for all 26 cantons

### Phase 5 Complete (Testing)
- ✅ All unit tests pass
- ✅ Integration test passes (full user flow)
- ✅ CI pipeline passes locally

### Phase 6 Complete (Deployment)
- ✅ Backend deployed to App Runner
- ✅ Frontend deployed to Amplify
- ✅ Production URLs work (api.swissai.tax, swissai.tax)
- ✅ At least 1 complete test filing submitted successfully

---

## Part 11: Timeline Estimate

| Phase | Duration | Notes |
|-------|----------|-------|
| Phase 0: Preparation | 2 hours | Backup, preserve files, cleanup |
| Phase 1: Backend Migration | 3 days | Copy BE, adapt models, routes, services |
| Phase 2: Frontend Migration | 3 days | Copy FE, setup routing, contexts |
| Phase 3: Content Adaptation | 2 days | Update pages, translations, theme |
| Phase 4: Tax Features | 5 days | Questionnaire, documents, OCR, deductions |
| Phase 5: Testing | 2 days | Unit, integration, QA |
| Phase 6: Deployment | 1 day | Deploy, verify, monitor |
| **TOTAL** | **~3 weeks** | With 1 full-time developer |

---

## Part 12: Post-Launch Roadmap

### V1.1 (Month 2)
- Payment integration (Stripe Checkout for CHF 49)
- Email notifications (filing status updates)
- PDF generation for final tax declaration

### V1.2 (Month 3)
- AI-powered chat assistant (reuse HomeAI chat component)
- Document auto-fetch from employers (API integrations)
- Canton-specific video tutorials

### V2.0 (Month 6)
- Multiple filing years support
- Family filing (multiple members)
- Tax optimization recommendations (AI suggests strategies)
- Mobile app (React Native)

---

## Appendices

### A. File Preservation Checklist
- [ ] `.github/workflows/cicd.yml`
- [ ] `.github/workflows/frontend-build.yml`
- [ ] `infrastructure/amplify.yml`
- [ ] `infrastructure/buildspec.yml`
- [ ] `.env` + `.env.example`
- [ ] `apprunner.yaml`
- [ ] `.apprunnerignore`
- [ ] `.gitignore`
- [ ] `.nvmrc`
- [ ] `start.sh`
- [ ] `public/logo-swissai.svg`

### B. HomeAI Components to Copy
**Backend**:
- `main.py`, `config.py`, `requirements.txt`
- `models/user.py`, `models/subscription.py`
- `services/auth_service.py`, `services/ai_service.py`, `services/document_processor.py`
- `api/auth.py`, `api/users.py`, `api/subscriptions.py`
- `alembic/` directory

**Frontend**:
- `src/index.js`, `src/App.js`, `src/i18n.js`, `src/index.css`
- `src/contexts/` (AuthContext, UserContext, LanguageContext)
- `src/api/` (client setup)
- `src/components/header`, `src/components/footer`, `src/components/LanguageSelector`
- `src/pages/MyAccount`, `src/pages/ForgotPassword`, `src/pages/Layout`
- `src/theme/`
- `src/locales/`

### C. New Tax-Specific Files to Create

**Backend**:
- `backend/models/tax_filing.py`
- `backend/models/questionnaire_response.py`
- `backend/models/tax_document.py`
- `backend/models/deduction.py`
- `backend/models/canton_config.py`
- `backend/services/questionnaire_service.py`
- `backend/services/profile_service.py`
- `backend/services/deduction_service.py`
- `backend/services/ocr_service.py`
- `backend/services/filing_service.py`
- `backend/api/tax_filings.py`
- `backend/api/questionnaire.py`
- `backend/api/documents.py`
- `backend/api/deductions.py`
- `backend/api/cantons.py`

**Frontend**:
- `src/pages/TaxFiling/TaxQuestionnaire.jsx`
- `src/pages/TaxFiling/QuestionStep.jsx`
- `src/pages/TaxFiling/questionConfig.js`
- `src/pages/TaxFiling/ProgressBar.jsx`
- `src/pages/TaxFiling/ProfileSummary.jsx`
- `src/pages/TaxFiling/DocumentChecklist.jsx`
- `src/pages/TaxFiling/DocumentUploadItem.jsx`
- `src/pages/TaxFiling/ReviewFiling.jsx`
- `src/pages/TaxFiling/FilingConfirmation.jsx`
- `src/api/taxFilingApi.js`

### D. Database Connection Details
```
Host: webscraping-database.cluster-c9y2u088elix.us-east-1.rds.amazonaws.com
Port: 5432
Database: homeai_db
User: webscrapinguser
Password: IXq3IC0Uw6StMkBhb4mb
SSH Tunnel: 3.221.26.92 (ubuntu user, key: Desktop/HomeAiCode/id_rsa)
```

### E. AWS Resource Inventory
- **App Runner Service**: `swissai-tax-api` (ARN in cicd.yml)
- **ECR Repository**: `swisstax-ai-backend`
- **Amplify App**: Auto-configured for `swissai.tax`
- **S3 Bucket**: Create `swissai-tax-documents` for file uploads
- **RDS**: Shared `homeai_db` database

---

## Questions to Address Before Starting

1. **Database Strategy**:
   - ✅ **Decision**: Use existing `homeai_db` with new tables (tax_filings, questionnaire_responses, etc.)
   - **Reason**: Simplifies deployment, shared user table

2. **Branding Assets**:
   - Do we have video content for the carousel? (Explainer videos, tutorials)
   - **Action**: If not, use placeholders or stock footage initially

3. **Payment Integration**:
   - Is Stripe account ready for Swiss CHF payments?
   - **Action**: Test in sandbox first

4. **Legal/Compliance**:
   - Do we have Terms of Service and Privacy Policy for tax service?
   - **Action**: Adapt from HomeAI, add tax-specific clauses

5. **Canton Rules**:
   - Do we have accurate deduction limits for all 26 cantons?
   - **Action**: Research & validate canton configurations (Part 4, Step 4.6)

6. **OCR Accuracy**:
   - GPT-4 Vision is good but not perfect. Fallback?
   - **Action**: Always require user verification of extracted data

---

## Final Notes

- **This is a living document**: Update as implementation progresses
- **Preserve flexibility**: If HomeAI structure changes, adapt
- **Prioritize MVP**: Focus on core flow (Q&A → Docs → Filing) before bells & whistles
- **Test with real documents**: Get sample Lohnausweis, 3a statements, etc. for OCR testing
- **Iterate on UX**: User test questionnaire flow for clarity and speed

---

**Document Status**: ✅ Ready for Review & Approval
**Next Step**: Get user approval, then begin Phase 0 (Preparation)
