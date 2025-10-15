# Swiss E-Government Standards Implementation Requirements

**Document Version:** 1.0
**Date:** 2025-10-15
**Author:** Claude Code Analysis
**Project:** SwissAI Tax Platform

---

## Executive Summary

This document outlines the **database schema changes** and **frontend UI updates** required to implement Swiss e-government standards (eCH-0196, Swissdec ELM 5.0, eCH-0058) for import/export functionality.

**Current State:**
- ✅ Can **EXPORT** eCH-0196 PDFs (already implemented)
- ❌ Cannot **IMPORT** eCH-0196, Swissdec, or other standards

**Goal:**
Enable users to upload standardized documents from banks and employers to auto-populate their tax returns.

---

## Phase 1: eCH-0196 Import (Bank Data)

### Database Schema Changes

#### 1.1 New Table: `swisstax.imported_documents`

**Purpose:** Track all imported standard-format documents and their processing status

```sql
CREATE TABLE swisstax.imported_documents (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign Keys
    session_id UUID NOT NULL REFERENCES swisstax.interview_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES swisstax.users(id) ON DELETE CASCADE,

    -- Document Metadata
    document_standard VARCHAR(50) NOT NULL,  -- 'ech0196', 'swissdec_elm', 'ech0217', 'xbrl_ch'
    document_type VARCHAR(50) NOT NULL,      -- 'e_tax_statement', 'salary_certificate', 'vat_declaration'
    standard_version VARCHAR(20),            -- '2.2.0', '5.0', '5.3', etc.

    -- Source Information
    source_institution VARCHAR(255),         -- 'UBS', 'Credit Suisse', 'PostFinance', 'Employer XYZ'
    source_reference VARCHAR(100),           -- Bank's document reference number

    -- File Storage
    original_filename VARCHAR(255),
    file_type VARCHAR(20),                   -- 'pdf', 'xml', 'zip'
    file_size_bytes INTEGER,
    s3_file_url TEXT,                        -- S3 URL for original file

    -- Extracted Data
    raw_data JSONB,                          -- Encrypted: Raw parsed data from standard
    extracted_fields JSONB,                  -- Encrypted: Normalized fields extracted
    mapped_to_profile JSONB,                 -- Fields that were mapped to interview_session.profile

    -- Processing Status
    import_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- Status values: 'pending', 'processing', 'completed', 'failed', 'partial'

    validation_status VARCHAR(20),           -- 'valid', 'invalid', 'warnings'
    validation_errors JSONB,                 -- Array of validation error messages
    confidence_score DECIMAL(3,2),           -- 0.00 to 1.00 (how confident in extraction)

    -- User Actions
    applied_to_session BOOLEAN DEFAULT false,
    applied_at TIMESTAMPTZ,
    user_reviewed BOOLEAN DEFAULT false,
    user_reviewed_at TIMESTAMPTZ,
    user_notes TEXT,

    -- Conflict Resolution
    conflicted_fields JSONB,                 -- Fields where imported data conflicts with existing
    conflict_resolution JSONB,               -- User's choices on conflicts

    -- Audit Trail
    imported_by UUID REFERENCES swisstax.users(id),
    imported_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    last_updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Indexes
    INDEX idx_imported_docs_session (session_id),
    INDEX idx_imported_docs_user (user_id),
    INDEX idx_imported_docs_standard (document_standard),
    INDEX idx_imported_docs_status (import_status),
    INDEX idx_imported_docs_applied (applied_to_session)
);

-- Enable encryption for sensitive fields
ALTER TABLE swisstax.imported_documents
    ALTER COLUMN raw_data TYPE encrypted_jsonb,
    ALTER COLUMN extracted_fields TYPE encrypted_jsonb;
```

---

#### 1.2 New Table: `swisstax.ech0196_bank_data`

**Purpose:** Store structured bank data from eCH-0196 imports

```sql
CREATE TABLE swisstax.ech0196_bank_data (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign Keys
    imported_document_id UUID NOT NULL REFERENCES swisstax.imported_documents(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES swisstax.interview_sessions(id) ON DELETE CASCADE,

    -- Tax Year & Institution
    tax_year INTEGER NOT NULL,
    bank_name VARCHAR(255),
    bank_code VARCHAR(50),                   -- Swiss bank identifier (BC number)
    statement_date DATE,
    statement_reference VARCHAR(100),

    -- Account Information
    accounts JSONB,                          -- Encrypted: Array of accounts
    /*
    Structure:
    [
        {
            "account_number": "CH93 0000 0000 0000 0000 0",
            "account_type": "checking|savings|investment",
            "currency": "CHF",
            "balance_start": 50000.00,
            "balance_end": 55000.00,
            "interest_earned": 100.50,
            "account_holder": "primary|joint|spouse"
        }
    ]
    */

    -- Securities & Investments
    securities JSONB,                        -- Encrypted: Array of securities holdings
    /*
    Structure:
    [
        {
            "isin": "CH0012345678",
            "security_name": "Nestle SA",
            "quantity": 100,
            "market_value_chf": 10500.00,
            "dividends_received": 250.00,
            "capital_gains": 500.00,
            "acquisition_cost": 10000.00
        }
    ]
    */

    -- Income Summary
    total_interest_income DECIMAL(12,2),     -- Total interest from all accounts
    total_dividend_income DECIMAL(12,2),     -- Total dividends from securities
    total_capital_gains DECIMAL(12,2),       -- Realized capital gains
    other_income DECIMAL(12,2),              -- Other investment income

    -- Liabilities
    mortgages JSONB,                         -- Encrypted: Array of mortgages
    /*
    Structure:
    [
        {
            "mortgage_id": "MTG-123456",
            "property_address": "Bahnhofstrasse 1, 8001 Zurich",
            "outstanding_balance": 500000.00,
            "interest_rate": 1.75,
            "interest_paid_year": 8750.00,
            "lender": "UBS Mortgages",
            "mortgage_type": "fixed|variable"
        }
    ]
    */

    loans JSONB,                             -- Encrypted: Other loans
    total_mortgage_interest DECIMAL(12,2),   -- Sum of mortgage interest paid
    total_loan_interest DECIMAL(12,2),       -- Sum of other loan interest

    -- Wealth Summary (for wealth tax)
    total_assets_value DECIMAL(15,2),        -- Sum of all asset values
    total_liabilities DECIMAL(15,2),         -- Sum of all debts
    net_wealth DECIMAL(15,2),                -- Assets - Liabilities

    -- Foreign Assets (requires special declaration)
    has_foreign_assets BOOLEAN DEFAULT false,
    foreign_assets JSONB,                    -- Encrypted: Details of foreign holdings

    -- Data Quality
    data_completeness DECIMAL(3,2),          -- 0.00 to 1.00 (how complete is the data)
    missing_fields JSONB,                    -- Array of fields that couldn't be extracted

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Indexes
    INDEX idx_ech0196_bank_session (session_id),
    INDEX idx_ech0196_bank_year (tax_year)
);

-- Enable encryption
ALTER TABLE swisstax.ech0196_bank_data
    ALTER COLUMN accounts TYPE encrypted_jsonb,
    ALTER COLUMN securities TYPE encrypted_jsonb,
    ALTER COLUMN mortgages TYPE encrypted_jsonb,
    ALTER COLUMN loans TYPE encrypted_jsonb,
    ALTER COLUMN foreign_assets TYPE encrypted_jsonb;
```

---

#### 1.3 Update Existing Table: `swisstax.interview_sessions`

**New Fields to Add:**

```sql
ALTER TABLE swisstax.interview_sessions
    -- Data Source Tracking
    ADD COLUMN data_sources JSONB DEFAULT '[]',
    /*
    Structure:
    [
        {
            "source_type": "manual|ech0196|swissdec|ai_ocr",
            "source_name": "UBS Bank e-Tax Statement",
            "imported_at": "2025-03-15T10:30:00Z",
            "fields_populated": ["bank_accounts", "interest_income", "mortgage_interest"],
            "document_id": "uuid-of-imported-document"
        }
    ]
    */

    -- Import Status
    ADD COLUMN has_imported_data BOOLEAN DEFAULT false,
    ADD COLUMN last_import_date TIMESTAMPTZ,
    ADD COLUMN import_conflicts JSONB,
    /*
    Structure:
    {
        "field_name": {
            "manual_value": 50000,
            "imported_value": 55000,
            "source": "ech0196",
            "conflict_resolved": false,
            "user_choice": null  // "manual" | "imported" | "custom"
        }
    }
    */

    -- Completeness Tracking
    ADD COLUMN data_completeness_score DECIMAL(3,2),  -- 0.00 to 1.00
    ADD COLUMN missing_data_fields JSONB;             -- Array of fields still needed
```

---

#### 1.4 New Table: `swisstax.field_mapping_rules`

**Purpose:** Store mapping rules between standard formats and interview fields

```sql
CREATE TABLE swisstax.field_mapping_rules (
    id SERIAL PRIMARY KEY,

    -- Standard Information
    document_standard VARCHAR(50) NOT NULL,   -- 'ech0196', 'swissdec_elm'
    standard_version VARCHAR(20),

    -- Field Mapping
    standard_field_path VARCHAR(255) NOT NULL, -- XPath or JSON path in standard
    /*
    Examples:
    - eCH-0196: '/eTaxStatement/income/capital'
    - Swissdec: '/SalaryDeclaration/Salary/GrossIncome'
    */

    interview_field_name VARCHAR(100) NOT NULL, -- Field name in interview_sessions.profile
    /*
    Examples: 'capital_income', 'employment_income', 'mortgage_interest'
    */

    -- Transformation Rules
    data_type VARCHAR(20),                    -- 'decimal', 'integer', 'string', 'boolean', 'date'
    transformation_function VARCHAR(100),     -- Name of function to apply
    /*
    Examples: 'sum_array', 'convert_currency', 'parse_date', 'aggregate_accounts'
    */

    validation_rules JSONB,
    /*
    Structure:
    {
        "required": true,
        "min_value": 0,
        "max_value": 999999999,
        "format": "decimal(12,2)",
        "custom_validator": "validate_ahv_number"
    }
    */

    -- Canton-Specific Overrides
    canton_specific BOOLEAN DEFAULT false,
    canton_code VARCHAR(2),                   -- 'ZH', 'GE', etc. (if canton-specific)

    -- Conflict Resolution Strategy
    conflict_resolution_strategy VARCHAR(50), -- 'prefer_imported', 'prefer_manual', 'ask_user', 'sum', 'average'

    -- Priority & Status
    priority INTEGER DEFAULT 100,             -- Higher priority mappings applied first
    is_active BOOLEAN DEFAULT true,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Indexes
    UNIQUE INDEX idx_field_mapping_unique (document_standard, standard_field_path, interview_field_name),
    INDEX idx_field_mapping_standard (document_standard),
    INDEX idx_field_mapping_canton (canton_code)
);
```

---

#### 1.5 New Table: `swisstax.import_audit_log`

**Purpose:** Audit trail for all import operations (compliance/debugging)

```sql
CREATE TABLE swisstax.import_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Event Information
    event_type VARCHAR(50) NOT NULL,
    /*
    Values:
    'document_uploaded', 'parsing_started', 'parsing_completed', 'parsing_failed',
    'data_mapped', 'conflicts_detected', 'user_reviewed', 'applied_to_session'
    */

    -- Context
    user_id UUID REFERENCES swisstax.users(id),
    session_id UUID REFERENCES swisstax.interview_sessions(id),
    imported_document_id UUID REFERENCES swisstax.imported_documents(id),

    -- Event Details
    event_data JSONB,
    /*
    Structure varies by event_type:
    {
        "fields_updated": ["capital_income", "mortgage_interest"],
        "old_values": {"capital_income": 1000},
        "new_values": {"capital_income": 1500},
        "conflicts_resolved": 3
    }
    */

    -- Technical Details
    ip_address INET,
    user_agent TEXT,
    processing_time_ms INTEGER,
    error_message TEXT,
    stack_trace TEXT,

    -- Timestamps
    occurred_at TIMESTAMPTZ DEFAULT NOW(),

    -- Indexes
    INDEX idx_audit_log_user (user_id),
    INDEX idx_audit_log_session (session_id),
    INDEX idx_audit_log_document (imported_document_id),
    INDEX idx_audit_log_event_type (event_type),
    INDEX idx_audit_log_occurred_at (occurred_at)
);
```

---

### Frontend Changes - eCH-0196 Import

#### 1.6 New Page: Import Dashboard

**Location:** `/src/pages/TaxFiling/ImportDashboard.jsx`

**Purpose:** Central hub for all document imports

**UI Components:**

1. **Import Status Card**
   - Shows count of imported documents by type
   - Visual indicators: ✅ Applied, ⏳ Pending Review, ⚠️ Conflicts, ❌ Failed
   - Progress bar: "Your tax return is 75% complete"

2. **Quick Import Buttons**
   - "Import Bank Statement (eCH-0196)" → File upload modal
   - "Import Salary Certificate (Swissdec)" → File upload modal
   - "Scan Document with AI" → Camera/upload for non-standard docs

3. **Imported Documents List**
   - Table showing all imported documents:
     - Column: Document Type (icon + name)
     - Column: Source (bank/employer logo + name)
     - Column: Status (badge with color coding)
     - Column: Data Completeness (progress bar)
     - Column: Actions (View, Review Conflicts, Remove)

4. **Data Completeness Widget**
   - Shows which sections are complete vs. incomplete
   - "You're missing: Investment income details, Property information"
   - Suggests: "Upload your bank statement to auto-fill these fields"

**Mock Data Flow:**
```
User clicks "Import Bank Statement"
→ File upload modal appears
→ User selects PDF/XML file
→ File uploads to /api/import/ech0196/upload
→ Backend parses and extracts data
→ Shows preview modal: "We found 3 accounts, CHF 1,500 interest income"
→ User clicks "Apply to My Tax Return"
→ POST /api/import/ech0196/apply/{session_id}
→ Dashboard updates with ✅ Applied status
```

---

#### 1.7 New Modal: Import Preview & Conflict Resolution

**Component:** `/src/components/Import/ImportPreviewModal.jsx`

**Purpose:** Show extracted data before applying to tax return

**UI Sections:**

1. **Header**
   - Document icon (bank logo)
   - Title: "UBS e-Tax Statement 2024"
   - Subtitle: "Extracted on Oct 15, 2025 • Confidence: 95%"
   - Close button (X)

2. **Tabs:**

   **Tab 1: Extracted Data**
   - Grouped by category:
     - **Bank Accounts (3)**
       - Table: Account Number | Type | Balance | Interest
       - Expandable rows for details
     - **Securities (5)**
       - Table: Name | ISIN | Quantity | Market Value | Dividends
     - **Mortgages (1)**
       - Table: Property Address | Balance | Interest Paid

   **Tab 2: Tax Impact**
   - Shows how imported data affects tax calculation:
     - "Your capital income will increase by CHF 1,500"
     - "Your mortgage interest deduction will increase by CHF 8,750"
     - "Estimated tax change: +CHF 300"
   - Visual: Before/After comparison bar chart

   **Tab 3: Conflicts (if any)**
   - Table of conflicted fields:
     - Field Name | Your Previous Value | Imported Value | Action
     - Example row:
       - Interest Income | CHF 1,000 | CHF 1,500 |
         - Radio buttons: ⚪ Keep Mine ⚪ Use Imported ⚪ Enter Custom
   - Conflict count badge: "3 conflicts need your attention"

   **Tab 4: Raw Data (Advanced)**
   - Collapsible JSON view of extracted data
   - "View eCH-0196 XML" button
   - Download original file button

3. **Footer Actions**
   - "Cancel" button (gray)
   - "Save for Later" button (outline)
   - "Apply to Tax Return" button (primary, disabled if unresolved conflicts)

---

#### 1.8 Update Existing: Interview Question Steps

**Location:** `/src/pages/TaxFiling/InterviewFlow.jsx`

**Changes for EACH Relevant Step:**

**Example: Q08 - Capital Income Step**

**Before (Current):**
```
[ Question: "What was your capital income in 2024?" ]
[ Input field: CHF _______ ]
[ Next Button ]
```

**After (With Import):**
```
[ Question: "What was your capital income in 2024?" ]

┌─────────────────────────────────────────────────┐
│  💡 Import Tip                                  │
│  Upload your bank's e-tax statement to         │
│  auto-fill this section                         │
│  [ Import Bank Statement ] button               │
└─────────────────────────────────────────────────┘

[ Input field: CHF _______ ]
  ↑ Shows imported value with source badge if imported:
    "CHF 1,500 (from UBS e-Tax Statement ✓)"

[ Next Button ]
```

**New UI Elements Per Step:**

1. **Import Suggestion Card** (conditional display)
   - Shows if: User hasn't imported data for this category yet
   - Content: Explains what document to upload
   - CTA button: Opens import modal for relevant document type

2. **Data Source Badge** (on input fields)
   - Shows if: Field value came from import
   - Format: Small badge below input
   - Example: "✓ From UBS Bank Statement (95% confidence)"
   - Clickable: Opens details modal about that import

3. **Conflict Warning Banner** (if applicable)
   - Shows if: Imported data conflicts with manual entry
   - Format: Yellow banner above input
   - Content: "We found different information in your uploaded document"
   - CTA: "Review Conflict" button → Opens conflict resolution

4. **Completeness Indicator**
   - Shows progress: "This section is 80% complete"
   - Missing data chip: "Missing: Dividend income"
   - Suggestion: Link to upload relevant document

---

#### 1.9 New Component: Conflict Resolution Widget

**Component:** `/src/components/Import/ConflictResolver.jsx`

**Purpose:** Inline conflict resolution in interview flow

**UI Layout:**

```
┌───────────────────────────────────────────────────────┐
│ ⚠️ Data Conflict Detected                             │
├───────────────────────────────────────────────────────┤
│                                                        │
│ Field: Interest Income                                │
│                                                        │
│ ┌─────────────────┐  ┌─────────────────┐            │
│ │ Your Entry      │  │ Imported Data   │            │
│ │ CHF 1,000       │  │ CHF 1,500       │            │
│ │ (Manual entry)  │  │ (UBS Statement) │            │
│ │ [Select This] ◯ │  │ [Select This] ◉ │            │
│ └─────────────────┘  └─────────────────┘            │
│                                                        │
│ Or enter custom amount: CHF [________]               │
│                                                        │
│ Why might these differ?                               │
│ • You may have entered an estimate earlier           │
│ • The bank statement is more accurate                │
│ • Imported data includes all accounts                │
│                                                        │
│ [ Keep My Value ]  [ Use Imported ]  [ Enter Custom ] │
└───────────────────────────────────────────────────────┘
```

**Behavior:**
- User selects one option
- Choice is saved to `interview_sessions.import_conflicts`
- Selected value is applied to `interview_sessions.profile`
- Widget dismisses, shows success toast

---

#### 1.10 Update: Settings Page - Import Preferences

**Location:** `/src/pages/Settings/ImportSettings.jsx`

**New Section: Import Preferences**

**Options:**

1. **Auto-Apply Imported Data**
   - Toggle: ON/OFF
   - Description: "Automatically apply imported data without preview"
   - Default: OFF (user must review first)

2. **Conflict Resolution Strategy**
   - Dropdown:
     - "Always ask me" (default)
     - "Always prefer imported data"
     - "Always keep my manual entries"

3. **Data Sources Priority**
   - Ranked list (drag to reorder):
     1. Bank e-Tax Statements (eCH-0196)
     2. Salary Certificates (Swissdec)
     3. Manual Entry
     4. AI Document Scan

4. **Supported Banks**
   - List of banks with eCH-0196 support:
     - ✅ UBS
     - ✅ Credit Suisse
     - ✅ PostFinance
     - ✅ Raiffeisen
     - ✅ ZKB (Zürcher Kantonalbank)
     - [+ 15 more banks...]
   - Link: "How to download e-tax statement from your bank"

5. **Import History**
   - Table showing past imports:
     - Date | Document Type | Source | Status | Actions
   - Actions: Re-import, Delete, Download Original

---

#### 1.11 New Component: File Upload Widget

**Component:** `/src/components/Import/FileUploadWidget.jsx`

**Purpose:** Drag-and-drop file upload with validation

**UI Features:**

1. **Drag-and-Drop Zone**
   ```
   ┌─────────────────────────────────────────┐
   │                                          │
   │    📄  Drag & drop your file here       │
   │        or click to browse                │
   │                                          │
   │    Supported: PDF, XML                   │
   │    Max size: 10 MB                       │
   │                                          │
   └─────────────────────────────────────────┘
   ```

2. **File Validation**
   - Check file type (PDF or XML only)
   - Check file size (max 10 MB)
   - Show error if invalid: "This file type is not supported"

3. **Upload Progress**
   ```
   Uploading: UBS_eTax_2024.pdf
   [████████████████░░░░] 80%

   [ Cancel Upload ]
   ```

4. **Processing Status**
   ```
   ⏳ Analyzing document...
   ⏳ Extracting data...
   ⏳ Validating information...
   ✅ Extraction complete!
   ```

5. **Error Handling**
   - If extraction fails:
     ```
     ❌ We couldn't read this document

     Possible reasons:
     • File is password-protected
     • Barcode is damaged/unreadable
     • Not a valid eCH-0196 format

     [ Try Another File ]  [ Get Help ]
     ```

---

#### 1.12 Update: Dashboard - Import Summary Widget

**Location:** `/src/pages/Dashboard/Dashboard.jsx`

**New Widget on Main Dashboard:**

**Import Status Widget**

```
┌─────────────────────────────────────────────────┐
│ 📊 Data Sources                                 │
├─────────────────────────────────────────────────┤
│                                                  │
│ ✅ Bank Statement Imported                      │
│    UBS e-Tax Statement 2024                     │
│    Imported: Oct 15, 2025                       │
│                                                  │
│ ⏳ Salary Certificate Needed                    │
│    Upload your Lohnausweis to complete          │
│    income section                                │
│    [ Import Now ]                                │
│                                                  │
│ ℹ️ Manual Entry                                  │
│    Deductions and other income                  │
│    Last updated: Oct 10, 2025                   │
│                                                  │
│ [ View All Imports ]                             │
└─────────────────────────────────────────────────┘
```

**Shows:**
- List of imported documents (max 3, then "View All")
- Status of each import (✅ Applied, ⏳ Pending, ⚠️ Conflicts)
- Suggestions for missing data
- Quick action buttons

---

#### 1.13 New Page: Help & Tutorials

**Location:** `/src/pages/Help/ImportGuide.jsx`

**Purpose:** User guide for importing documents

**Content Sections:**

1. **What is eCH-0196?**
   - Explanation: "Swiss e-government standard for electronic tax statements"
   - Video: "How to download your e-tax statement from your bank"

2. **Step-by-Step Guides by Bank**
   - UBS: Screenshots showing menu path to download
   - Credit Suisse: Instructions for e-banking portal
   - PostFinance: Step-by-step for PostFinance app
   - Generic: "If your bank isn't listed..."

3. **Troubleshooting**
   - "File upload failed" → Solutions
   - "Barcode unreadable" → Try scanning tips
   - "Data doesn't match" → When to contact support

4. **Video Tutorials**
   - "Complete your tax return in 5 minutes"
   - "How to resolve data conflicts"
   - "What to do if your bank doesn't support eCH-0196"

5. **FAQ**
   - "Is my data secure?" → Encryption explanation
   - "Can I import multiple years?" → Yes/No answer
   - "What if I have multiple bank accounts?" → Explanation

---

### API Endpoints - Frontend Integration

#### 1.14 Required API Endpoints for Frontend

**Upload & Parse:**
```
POST /api/import/ech0196/upload
Body: multipart/form-data
  - file: File (PDF or XML)
  - session_id: UUID (optional)
Response: {
  document_id: UUID,
  status: "processing",
  preview_data: {...}  // If parsing is instant
}
```

**Check Processing Status:**
```
GET /api/import/ech0196/status/{document_id}
Response: {
  status: "completed|processing|failed",
  progress: 75,
  extracted_data: {...},
  confidence: 0.95,
  errors: []
}
```

**Get Import Preview:**
```
GET /api/import/ech0196/preview/{document_id}
Response: {
  document_id: UUID,
  source_institution: "UBS",
  tax_year: 2024,
  accounts: [...],
  securities: [...],
  mortgages: [...],
  mapped_fields: {...},
  conflicts: {...}
}
```

**Apply to Session:**
```
POST /api/import/ech0196/apply/{session_id}
Body: {
  document_id: UUID,
  conflict_resolutions: {
    "interest_income": {
      "choice": "imported|manual|custom",
      "custom_value": 1250.00
    }
  }
}
Response: {
  success: true,
  applied_fields: [...],
  updated_profile: {...}
}
```

**List Imports for Session:**
```
GET /api/import/list/{session_id}
Response: {
  imports: [
    {
      document_id: UUID,
      standard: "ech0196",
      source: "UBS",
      imported_at: "2025-10-15T10:30:00Z",
      status: "applied",
      fields_count: 12
    }
  ]
}
```

**Delete Import:**
```
DELETE /api/import/{document_id}
Response: {
  success: true,
  message: "Import removed and data rolled back"
}
```

---

## Phase 2: Swissdec ELM 5.0 Import (Salary Certificate)

### Database Schema Changes

#### 2.1 New Table: `swisstax.swissdec_salary_data`

**Purpose:** Store structured salary data from Swissdec ELM imports

```sql
CREATE TABLE swisstax.swissdec_salary_data (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign Keys
    imported_document_id UUID NOT NULL REFERENCES swisstax.imported_documents(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES swisstax.interview_sessions(id) ON DELETE CASCADE,

    -- Employer Information
    employer_name VARCHAR(255) NOT NULL,
    employer_uid VARCHAR(50),                -- Swiss company UID (CHE-123.456.789)
    employer_address TEXT,

    -- Employee Information
    employee_ssn VARCHAR(16),                -- AHV number (encrypted)
    employment_start_date DATE,
    employment_end_date DATE,                -- NULL if still employed
    employment_type VARCHAR(50),             -- 'full_time', 'part_time', 'temporary', 'contract'
    employment_percentage DECIMAL(5,2),      -- 100.00 = full-time

    -- Salary Information
    tax_year INTEGER NOT NULL,
    gross_salary DECIMAL(12,2) NOT NULL,     -- Total gross income
    net_salary DECIMAL(12,2),                -- After deductions

    -- Salary Components
    base_salary DECIMAL(12,2),
    overtime_pay DECIMAL(12,2),
    bonus DECIMAL(12,2),
    commission DECIMAL(12,2),
    thirteenth_month DECIMAL(12,2),          -- 13th month salary (common in Switzerland)
    vacation_compensation DECIMAL(12,2),
    severance_pay DECIMAL(12,2),

    -- Benefits (Taxable)
    company_car_value DECIMAL(12,2),         -- Private use of company car
    housing_benefit DECIMAL(12,2),
    meal_allowance DECIMAL(12,2),
    stock_options_value DECIMAL(12,2),
    other_benefits DECIMAL(12,2),
    total_benefits DECIMAL(12,2),

    -- Social Security Contributions (AHV/IV/EO)
    ahv_contribution_employee DECIMAL(10,2), -- Old-age/survivors insurance (employee share)
    ahv_contribution_employer DECIMAL(10,2), -- Employer share
    ahv_rate_percentage DECIMAL(5,2),        -- Usually 5.3%

    iv_contribution_employee DECIMAL(10,2),  -- Disability insurance
    iv_contribution_employer DECIMAL(10,2),

    eo_contribution_employee DECIMAL(10,2),  -- Loss of earnings insurance
    eo_contribution_employer DECIMAL(10,2),

    -- Unemployment Insurance (ALV)
    alv_contribution_employee DECIMAL(10,2),
    alv_contribution_employer DECIMAL(10,2),
    alv_rate_percentage DECIMAL(5,2),        -- Usually 1.1% (2.2% above CHF 148,200)

    -- Accident Insurance (UVG)
    uvg_contribution_employee DECIMAL(10,2), -- Non-occupational accidents
    uvg_contribution_employer DECIMAL(10,2), -- Occupational accidents

    uvgz_contribution DECIMAL(10,2),         -- Additional accident insurance

    -- Daily Sickness Allowance (KTG)
    ktg_contribution_employee DECIMAL(10,2),
    ktg_contribution_employer DECIMAL(10,2),

    -- Pension Fund (BVG/2nd Pillar)
    bvg_contribution_employee DECIMAL(10,2), -- Mandatory pension
    bvg_contribution_employer DECIMAL(10,2),
    bvg_insured_salary DECIMAL(12,2),        -- Salary amount insured
    bvg_purchase_amount DECIMAL(10,2),       -- Voluntary pension purchases

    -- Pillar 3a (if deducted at source by employer)
    pillar_3a_contribution DECIMAL(10,2),

    -- Deductions Summary
    total_social_security DECIMAL(12,2),     -- Sum of all social security
    total_pension DECIMAL(12,2),             -- BVG + any extra
    total_insurance DECIMAL(12,2),           -- UVG + KTG
    total_deductions DECIMAL(12,2),          -- All deductions

    -- Withholding Tax (for foreign workers)
    withholding_tax_applied BOOLEAN DEFAULT false,
    withholding_tax_amount DECIMAL(12,2),
    withholding_tax_rate DECIMAL(5,2),
    withholding_tax_canton VARCHAR(2),

    -- Expenses & Allowances
    professional_expenses_deducted DECIMAL(10,2),
    business_expenses_reimbursed DECIMAL(10,2),

    -- Working Days/Hours
    working_days_per_year INTEGER,
    working_hours_per_week DECIMAL(5,2),
    vacation_days INTEGER,
    sick_days INTEGER,
    unpaid_leave_days INTEGER,

    -- ELM Metadata
    elm_version VARCHAR(20),                 -- '5.0', '5.3', etc.
    elm_message_id VARCHAR(100),             -- Unique message ID from ELM

    -- Multiple Employment
    is_main_employment BOOLEAN DEFAULT true, -- If user has multiple jobs
    employment_sequence INTEGER,             -- 1 = main, 2 = secondary, etc.

    -- Data Quality
    data_completeness DECIMAL(3,2),
    validation_warnings JSONB,

    -- Timestamps
    salary_period_start DATE,                -- Usually Jan 1
    salary_period_end DATE,                  -- Usually Dec 31
    certificate_issue_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Indexes
    INDEX idx_swissdec_salary_session (session_id),
    INDEX idx_swissdec_salary_year (tax_year),
    INDEX idx_swissdec_salary_employer (employer_uid)
);

-- Enable encryption for sensitive fields
ALTER TABLE swisstax.swissdec_salary_data
    ALTER COLUMN employee_ssn TYPE encrypted_varchar;
```

---

#### 2.2 New Table: `swisstax.employment_aggregation`

**Purpose:** Aggregate data when user has multiple employers in one year

```sql
CREATE TABLE swisstax.employment_aggregation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    session_id UUID NOT NULL REFERENCES swisstax.interview_sessions(id) ON DELETE CASCADE,
    tax_year INTEGER NOT NULL,

    -- Aggregated Totals
    number_of_employers INTEGER,
    total_gross_income DECIMAL(12,2),
    total_net_income DECIMAL(12,2),

    -- Aggregated Deductions
    total_ahv_paid DECIMAL(12,2),
    total_alv_paid DECIMAL(12,2),
    total_bvg_paid DECIMAL(12,2),
    total_insurance_paid DECIMAL(12,2),

    -- Aggregated Benefits
    total_benefits_value DECIMAL(12,2),

    -- Source Documents
    salary_certificate_ids JSONB,            -- Array of swissdec_salary_data IDs

    -- Calculations
    average_employment_percentage DECIMAL(5,2),
    total_working_days INTEGER,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE INDEX idx_employment_agg_session_year (session_id, tax_year)
);
```

---

### Frontend Changes - Swissdec ELM Import

#### 2.3 New Section: Salary Import Wizard

**Location:** `/src/pages/TaxFiling/SalaryImportWizard.jsx`

**Purpose:** Step-by-step wizard for importing salary certificate(s)

**Step 1: Introduction**
```
┌─────────────────────────────────────────────────┐
│ 📄 Import Salary Certificate (Lohnausweis)     │
├─────────────────────────────────────────────────┤
│                                                  │
│ Your Lohnausweis contains important income and  │
│ deduction information needed for your tax return│
│                                                  │
│ What you'll need:                               │
│ • Your Lohnausweis (PDF or XML file)           │
│ • From your employer's HR department            │
│ • For tax year 2024                             │
│                                                  │
│ 💡 Tip: Most Swiss employers provide electronic │
│ Lohnausweis in Swissdec format. Ask your HR for │
│ the "Lohnausweis XML-Datei"                     │
│                                                  │
│ Did you work for multiple employers in 2024?   │
│ ⚪ No, just one employer                        │
│ ⚪ Yes, I had 2 or more jobs                    │
│                                                  │
│ [ Cancel ]                [ Next: Upload File ] │
└─────────────────────────────────────────────────┘
```

**Step 2: Upload File(s)**
```
┌─────────────────────────────────────────────────┐
│ Upload Your Lohnausweis                         │
├─────────────────────────────────────────────────┤
│                                                  │
│ Employer 1 (Main Employment)                    │
│ ┌─────────────────────────────────────────┐   │
│ │  📄 Drag & drop or click to browse      │   │
│ │     Supported: PDF (with XML), XML       │   │
│ └─────────────────────────────────────────┘   │
│                                                  │
│ [ + Add Another Employer ]                      │
│                                                  │
│ Uploaded:                                       │
│ ✅ ACME_Corp_Lohnausweis_2024.xml              │
│    Processing... [████████░░] 80%              │
│                                                  │
│ [ Back ]              [ Next: Review Data ]     │
└─────────────────────────────────────────────────┘
```

**Step 3: Review Extracted Data**
```
┌─────────────────────────────────────────────────┐
│ Verify Your Salary Information                  │
├─────────────────────────────────────────────────┤
│                                                  │
│ Employer: ACME Corporation AG                   │
│ UID: CHE-123.456.789                            │
│                                                  │
│ ┌─────────────────────────────────────────────┐│
│ │ Income Summary                              ││
│ │ Gross Salary:          CHF 85,000.00       ││
│ │ Bonus:                 CHF 5,000.00        ││
│ │ Benefits:              CHF 1,200.00        ││
│ │ ────────────────────────────────────────── ││
│ │ Total Taxable Income:  CHF 91,200.00       ││
│ └─────────────────────────────────────────────┘│
│                                                  │
│ ┌─────────────────────────────────────────────┐│
│ │ Deductions Already Paid                     ││
│ │ AHV/IV/EO:            CHF 4,833.60         ││
│ │ ALV:                  CHF 1,003.20         ││
│ │ BVG (Pension):        CHF 5,460.00         ││
│ │ Accident Insurance:   CHF 520.00           ││
│ │ ────────────────────────────────────────── ││
│ │ Total Deductions:     CHF 11,816.80        ││
│ └─────────────────────────────────────────────┘│
│                                                  │
│ ✓ This data looks correct                      │
│ ⚠️ Something doesn't match? [Report Issue]     │
│                                                  │
│ [ Back ]        [ Apply to Tax Return ]         │
└─────────────────────────────────────────────────┘
```

**Step 4: Confirmation**
```
┌─────────────────────────────────────────────────┐
│ ✅ Salary Data Imported Successfully            │
├─────────────────────────────────────────────────┤
│                                                  │
│ We've applied the following to your tax return: │
│                                                  │
│ ✓ Employment income: CHF 91,200                │
│ ✓ Social security contributions: CHF 4,833     │
│ ✓ Pension contributions (BVG): CHF 5,460       │
│ ✓ Professional expenses: CHF 2,000 (standard)  │
│                                                  │
│ What's next?                                    │
│ Continue with the interview to add:             │
│ • Other income sources                          │
│ • Additional deductions                         │
│ • Family information                            │
│                                                  │
│ [ View Updated Tax Return ]  [ Continue Interview]│
└─────────────────────────────────────────────────┘
```

---

#### 2.4 Update: Income Question Step (Q05)

**Location:** `/src/pages/TaxFiling/questions/Q05_EmploymentIncome.jsx`

**Enhanced UI with Import Integration:**

```
┌─────────────────────────────────────────────────┐
│ Q05: Employment Income                          │
├─────────────────────────────────────────────────┤
│                                                  │
│ What was your total employment income in 2024? │
│                                                  │
│ ┌─────────────────────────────────────────────┐│
│ │ 💡 Save Time: Import Your Lohnausweis      ││
│ │                                             ││
│ │ Upload your salary certificate to auto-fill││
│ │ income, deductions, and pension info.      ││
│ │                                             ││
│ │ [ 📄 Import Lohnausweis ]                  ││
│ └─────────────────────────────────────────────┘│
│                                                  │
│ Or enter manually:                              │
│                                                  │
│ Gross Salary:                                   │
│ CHF [_91,200.00_________] ✓ From ACME Corp     │
│                                                  │
│ Additional Income:                              │
│ ☐ Bonus or Commission                          │
│ ☐ Stock Options/RSUs                           │
│ ☐ Company Car (private use)                    │
│ ☐ Other Benefits                                │
│                                                  │
│ ┌─────────────────────────────────────────────┐│
│ │ Data Source: ACME Corporation AG            ││
│ │ Imported: Oct 15, 2025                      ││
│ │ Swissdec ELM 5.0                            ││
│ │ [View Details] [Remove Import]              ││
│ └─────────────────────────────────────────────┘│
│                                                  │
│ [ Back ]                            [ Next: Q06 ]│
└─────────────────────────────────────────────────┘
```

---

#### 2.5 New Component: Multi-Employer Manager

**Component:** `/src/components/Import/MultiEmployerManager.jsx`

**Purpose:** Handle users with multiple jobs in same year

**UI:**

```
┌─────────────────────────────────────────────────┐
│ Multiple Employers (2024)                       │
├─────────────────────────────────────────────────┤
│                                                  │
│ ┌─────────────────────────────────────────────┐│
│ │ 1️⃣ ACME Corporation AG (Main)              ││
│ │    Jan 1 - Dec 31, 2024                     ││
│ │    Gross Income: CHF 85,000                 ││
│ │    [View Details] [Edit] [Remove]           ││
│ └─────────────────────────────────────────────┘│
│                                                  │
│ ┌─────────────────────────────────────────────┐│
│ │ 2️⃣ Tech Startup GmbH (Part-Time)           ││
│ │    Mar 15 - Dec 31, 2024                    ││
│ │    Gross Income: CHF 25,000                 ││
│ │    [View Details] [Edit] [Remove]           ││
│ └─────────────────────────────────────────────┘│
│                                                  │
│ Total Employment Income: CHF 110,000            │
│ Total Deductions Paid: CHF 15,230               │
│                                                  │
│ [ + Add Another Employer ]                      │
│                                                  │
│ ⚠️ Note: We'll automatically combine deductions │
│ from both employers to avoid double-counting.   │
│                                                  │
│ [ Done ]                                        │
└─────────────────────────────────────────────────┘
```

---

#### 2.6 Update: Deductions Step (Q10)

**Location:** `/src/pages/TaxFiling/questions/Q10_Deductions.jsx`

**Auto-Populated from Swissdec Import:**

```
┌─────────────────────────────────────────────────┐
│ Q10: Deductions                                 │
├─────────────────────────────────────────────────┤
│                                                  │
│ These deductions were found in your imports:    │
│                                                  │
│ ✅ Pension (BVG) Contributions                  │
│    CHF 5,460.00 (from ACME Corp Lohnausweis)   │
│                                                  │
│ ✅ Social Security (AHV/IV)                     │
│    CHF 4,833.60 (automatically calculated)      │
│                                                  │
│ ✅ Unemployment Insurance (ALV)                 │
│    CHF 1,003.20 (from salary certificate)       │
│                                                  │
│ Additional Deductions to Add:                   │
│                                                  │
│ Pillar 3a Contributions:                        │
│ CHF [___________]                               │
│ (Max: CHF 7,056 for employees)                  │
│                                                  │
│ Health Insurance Premiums:                      │
│ CHF [___________]                               │
│                                                  │
│ Medical Expenses:                               │
│ CHF [___________]                               │
│                                                  │
│ [ Back ]                            [ Next: Q11 ]│
└─────────────────────────────────────────────────┘
```

---

### API Endpoints - Swissdec Import

#### 2.7 Required API Endpoints

```
POST /api/import/swissdec/upload
Body: multipart/form-data
  - file: File (XML or PDF with embedded XML)
  - session_id: UUID
  - is_main_employment: boolean
Response: {
  document_id: UUID,
  employer_name: string,
  gross_salary: decimal,
  preview_data: {...}
}

POST /api/import/swissdec/apply/{session_id}
Body: {
  document_ids: [UUID, UUID],  // Can apply multiple employers at once
  aggregation_strategy: "sum|average|custom"
}
Response: {
  success: true,
  aggregated_income: decimal,
  applied_fields: [...]
}

GET /api/import/swissdec/employers/{session_id}
Response: {
  employers: [
    {
      document_id: UUID,
      employer_name: string,
      employment_period: {start: date, end: date},
      gross_income: decimal,
      is_main: boolean
    }
  ]
}

DELETE /api/import/swissdec/employer/{document_id}
Response: {success: true, message: "Employer data removed"}
```

---

## Phase 3: eCH-0058 E-Filing Integration

### Database Schema Changes

#### 3.1 New Table: `swisstax.canton_efiling_config`

**Purpose:** Store canton-specific e-filing API configurations

```sql
CREATE TABLE swisstax.canton_efiling_config (
    id SERIAL PRIMARY KEY,

    -- Canton Information
    canton_code VARCHAR(2) UNIQUE NOT NULL,  -- 'ZH', 'GE', 'VD', etc.
    canton_name_de VARCHAR(100),
    canton_name_fr VARCHAR(100),
    canton_name_en VARCHAR(100),

    -- E-Filing Availability
    efiling_enabled BOOLEAN DEFAULT false,
    efiling_available_since DATE,            -- When canton started supporting e-filing

    -- API Configuration
    api_base_url TEXT,                       -- Canton's e-filing API endpoint
    api_version VARCHAR(20),                 -- API version (e.g., 'v2.1')
    ech0058_version VARCHAR(20),             -- eCH-0058 standard version supported

    -- Authentication
    auth_method VARCHAR(50),                 -- 'oauth2', 'certificate', 'api_key', 'swissid'
    oauth_authorization_url TEXT,
    oauth_token_url TEXT,
    oauth_client_id VARCHAR(255),            -- Encrypted
    oauth_scopes TEXT,                       -- Space-separated scopes

    -- SwissID Integration
    supports_swissid BOOLEAN DEFAULT false,
    swissid_app_id VARCHAR(100),

    -- Certificate-Based Auth
    requires_client_certificate BOOLEAN DEFAULT false,
    certificate_issuer VARCHAR(255),

    -- Submission Configuration
    max_file_size_mb INTEGER,                -- Max PDF/XML size
    supported_formats TEXT[],                -- ['ech0196', 'canton_xml', 'pdf']
    requires_digital_signature BOOLEAN DEFAULT false,

    -- Processing
    async_processing BOOLEAN DEFAULT true,   -- If true, submission returns immediately
    average_processing_time_hours INTEGER,   -- Typical time to get confirmation
    status_check_url TEXT,
    webhook_support BOOLEAN DEFAULT false,

    -- Confirmation
    provides_pdf_confirmation BOOLEAN DEFAULT true,
    confirmation_download_url TEXT,

    -- Testing
    sandbox_url TEXT,                        -- Sandbox environment for testing
    sandbox_enabled BOOLEAN DEFAULT false,

    -- Rate Limiting
    rate_limit_requests_per_hour INTEGER,
    rate_limit_requests_per_day INTEGER,

    -- Support
    support_email VARCHAR(255),
    support_phone VARCHAR(50),
    documentation_url TEXT,

    -- Status
    is_active BOOLEAN DEFAULT true,
    maintenance_mode BOOLEAN DEFAULT false,
    maintenance_message TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable encryption for sensitive fields
ALTER TABLE swisstax.canton_efiling_config
    ALTER COLUMN oauth_client_id TYPE encrypted_varchar;
```

---

#### 3.2 New Table: `swisstax.canton_submissions`

**Purpose:** Track all e-filing submissions to canton authorities

```sql
CREATE TABLE swisstax.canton_submissions (
    -- Primary Key
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Foreign Keys
    filing_id UUID NOT NULL REFERENCES swisstax.filings(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES swisstax.users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES swisstax.interview_sessions(id),

    -- Canton Information
    canton_code VARCHAR(2) NOT NULL,
    tax_year INTEGER NOT NULL,

    -- Submission Details
    submission_method VARCHAR(50),           -- 'ech0058_api', 'manual_pdf', 'postal'
    submission_format VARCHAR(50),           -- 'ech0196_xml', 'canton_xml', 'pdf'

    -- Tracking
    internal_submission_id UUID DEFAULT gen_random_uuid(),  -- Our tracking ID
    canton_submission_id VARCHAR(255),       -- Canton's tracking/reference ID
    canton_tracking_url TEXT,                -- URL to check status on canton website

    -- Status Tracking
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    /*
    Status flow:
    'pending' → 'submitting' → 'submitted' → 'accepted' → 'confirmed'
                             ↘ 'failed'
                             ↘ 'rejected' → 'corrected' → 'resubmitted'
    */

    status_last_checked_at TIMESTAMPTZ,
    status_check_count INTEGER DEFAULT 0,

    -- Submission Content
    ech0058_message_xml TEXT,                -- Full eCH-0058 wrapped message (encrypted)
    submitted_pdf_url TEXT,                  -- S3 URL of submitted PDF
    submitted_data_snapshot JSONB,           -- Snapshot of data at time of submission (encrypted)

    -- Timestamps
    prepared_at TIMESTAMPTZ,                 -- When message was prepared
    submitted_at TIMESTAMPTZ,                -- When sent to canton
    accepted_at TIMESTAMPTZ,                 -- When canton accepted
    confirmed_at TIMESTAMPTZ,                -- When canton confirmed processing
    rejected_at TIMESTAMPTZ,                 -- If rejected

    -- Response from Canton
    canton_response JSONB,                   -- Raw API response
    canton_confirmation_pdf_url TEXT,        -- S3 URL of canton's confirmation PDF
    canton_confirmation_number VARCHAR(100), -- Official confirmation number

    -- Errors & Rejection
    error_code VARCHAR(50),
    error_message TEXT,
    rejection_reason TEXT,
    rejection_details JSONB,
    correction_required BOOLEAN DEFAULT false,

    -- Resubmission
    is_resubmission BOOLEAN DEFAULT false,
    original_submission_id UUID REFERENCES swisstax.canton_submissions(id),
    resubmission_count INTEGER DEFAULT 0,

    -- User Communication
    user_notified BOOLEAN DEFAULT false,
    user_notified_at TIMESTAMPTZ,
    notification_type VARCHAR(50),           -- 'email', 'sms', 'push', 'in_app'

    -- API Logs
    api_request_log JSONB,                   -- Request sent to canton API
    api_response_log JSONB,                  -- Response received
    http_status_code INTEGER,
    api_latency_ms INTEGER,

    -- Audit
    submitted_by_user BOOLEAN DEFAULT true,  -- false if submitted by system/admin
    submitted_by_admin UUID REFERENCES swisstax.users(id),
    ip_address INET,
    user_agent TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Indexes
    INDEX idx_canton_sub_filing (filing_id),
    INDEX idx_canton_sub_user (user_id),
    INDEX idx_canton_sub_canton (canton_code),
    INDEX idx_canton_sub_status (status),
    INDEX idx_canton_sub_year (tax_year),
    INDEX idx_canton_sub_canton_id (canton_submission_id),
    INDEX idx_canton_sub_submitted_at (submitted_at)
);

-- Enable encryption
ALTER TABLE swisstax.canton_submissions
    ALTER COLUMN ech0058_message_xml TYPE encrypted_text,
    ALTER COLUMN submitted_data_snapshot TYPE encrypted_jsonb;
```

---

#### 3.3 New Table: `swisstax.user_canton_authorizations`

**Purpose:** Store OAuth tokens for canton e-filing APIs

```sql
CREATE TABLE swisstax.user_canton_authorizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User & Canton
    user_id UUID NOT NULL REFERENCES swisstax.users(id) ON DELETE CASCADE,
    canton_code VARCHAR(2) NOT NULL,

    -- OAuth Tokens
    access_token TEXT,                       -- Encrypted
    refresh_token TEXT,                      -- Encrypted
    token_type VARCHAR(50),                  -- 'Bearer'
    expires_at TIMESTAMPTZ,

    -- Scope
    scopes TEXT,                             -- Space-separated granted scopes

    -- SwissID Integration
    swissid_connected BOOLEAN DEFAULT false,
    swissid_user_id VARCHAR(255),            -- SwissID unique identifier

    -- Status
    is_valid BOOLEAN DEFAULT true,
    revoked BOOLEAN DEFAULT false,
    revoked_at TIMESTAMPTZ,
    revoke_reason TEXT,

    -- Last Used
    last_used_at TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0,

    -- Timestamps
    authorized_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE INDEX idx_user_canton_auth_unique (user_id, canton_code),
    INDEX idx_user_canton_auth_user (user_id),
    INDEX idx_user_canton_auth_canton (canton_code),
    INDEX idx_user_canton_auth_expires (expires_at)
);

-- Enable encryption
ALTER TABLE swisstax.user_canton_authorizations
    ALTER COLUMN access_token TYPE encrypted_text,
    ALTER COLUMN refresh_token TYPE encrypted_text;
```

---

#### 3.4 New Table: `swisstax.submission_status_history`

**Purpose:** Track status changes over time (audit trail)

```sql
CREATE TABLE swisstax.submission_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    submission_id UUID NOT NULL REFERENCES swisstax.canton_submissions(id) ON DELETE CASCADE,

    -- Status Change
    previous_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    status_message TEXT,

    -- Canton Response
    canton_response JSONB,

    -- System Info
    checked_by VARCHAR(50),                  -- 'user', 'system_cron', 'webhook', 'manual'

    -- Timestamp
    changed_at TIMESTAMPTZ DEFAULT NOW(),

    INDEX idx_submission_history_submission (submission_id),
    INDEX idx_submission_history_changed_at (changed_at)
);
```

---

### Frontend Changes - E-Filing Integration

#### 3.5 New Page: E-Filing Dashboard

**Location:** `/src/pages/TaxFiling/EFilingDashboard.jsx`

**Purpose:** Central hub for electronic submissions to cantons

**UI Layout:**

```
┌─────────────────────────────────────────────────┐
│ 🚀 Electronic Filing (E-Filing)                 │
├─────────────────────────────────────────────────┤
│                                                  │
│ ┌─────────────────────────────────────────────┐│
│ │ Primary Filing: Zurich (ZH)                 ││
│ │                                             ││
│ │ Status: ✅ Ready to Submit                  ││
│ │                                             ││
│ │ Tax Year: 2024                              ││
│ │ Total Tax: CHF 12,450                       ││
│ │                                             ││
│ │ Submission Method:                          ││
│ │ ⚪ Electronic (Recommended) - Instant      ││
│ │ ⚪ PDF Download & Upload to Canton Portal  ││
│ │ ⚪ Print & Mail                             ││
│ │                                             ││
│ │ [ 🔐 Connect to Zurich Tax Portal ]        ││
│ └─────────────────────────────────────────────┘│
│                                                  │
│ ┌─────────────────────────────────────────────┐│
│ │ Secondary Filing: Geneva (GE)               ││
│ │ Status: ⏳ Awaiting Primary Filing          ││
│ │ (Submit Zurich first, then Geneva)          ││
│ └─────────────────────────────────────────────┘│
│                                                  │
│ 💡 E-Filing Benefits:                           │
│ • Instant confirmation                          │
│ • No printing or mailing                        │
│ • Faster processing (2-3 weeks vs. 6-8 weeks)  │
│ • Automatic error checking                      │
│                                                  │
│ ⚠️ Requirements:                                 │
│ • SwissID account (or canton credentials)      │
│ • Authorization to submit electronically        │
│                                                  │
│ [ Learn More About E-Filing ]                   │
└─────────────────────────────────────────────────┘
```

---

#### 3.6 New Flow: Canton Authorization (OAuth)

**Component:** `/src/components/EFiling/CantonAuthorizationFlow.jsx`

**Step 1: Initiate Authorization**

```
┌─────────────────────────────────────────────────┐
│ Connect to Zurich Tax Portal                    │
├─────────────────────────────────────────────────┤
│                                                  │
│ To submit electronically, you need to authorize │
│ SwissAI Tax to submit on your behalf.           │
│                                                  │
│ Choose authentication method:                   │
│                                                  │
│ ┌─────────────────────────────────────────────┐│
│ │ 🔐 SwissID (Recommended)                    ││
│ │ Secure, government-approved identity        ││
│ │ [ Login with SwissID ]                      ││
│ └─────────────────────────────────────────────┘│
│                                                  │
│ ┌─────────────────────────────────────────────┐│
│ │ 🏛️ Zurich Canton Credentials                ││
│ │ Use your existing canton portal account     ││
│ │ [ Login with Canton Account ]               ││
│ └─────────────────────────────────────────────┘│
│                                                  │
│ 🔒 Your credentials are securely handled by the │
│ canton's system. We never see your password.    │
│                                                  │
│ [ Cancel ]                                      │
└─────────────────────────────────────────────────┘
```

**Step 2: External OAuth (SwissID or Canton)**

```
User clicks "Login with SwissID"
↓
Redirect to: https://login.swissid.ch/authorize?...
↓
User logs in with SwissID
↓
User grants permissions: "Allow SwissAI Tax to submit tax returns?"
↓
Redirect back to: https://swissai.tax/efiling/callback?code=...
↓
Frontend exchanges code for tokens
↓
Tokens stored in user_canton_authorizations table
```

**Step 3: Authorization Success**

```
┌─────────────────────────────────────────────────┐
│ ✅ Authorization Successful                     │
├─────────────────────────────────────────────────┤
│                                                  │
│ You're now connected to Zurich Tax Portal       │
│                                                  │
│ Authorized Account:                             │
│ • Name: Hans Müller                             │
│ • AHV: 756.1234.5678.90                         │
│ • Canton: Zurich (ZH)                           │
│                                                  │
│ Permissions Granted:                            │
│ ✓ Submit tax declarations                       │
│ ✓ Check submission status                       │
│ ✓ Download confirmations                        │
│                                                  │
│ This authorization is valid until: Dec 31, 2025 │
│                                                  │
│ [ Proceed to Submit Tax Return ]                │
└─────────────────────────────────────────────────┘
```

---

#### 3.7 New Modal: Pre-Submission Review

**Component:** `/src/components/EFiling/PreSubmissionReview.jsx`

**Purpose:** Final review before submitting to canton

```
┌─────────────────────────────────────────────────┐
│ Review Before Submitting                        │
├─────────────────────────────────────────────────┤
│                                                  │
│ You're about to submit your 2024 tax return to: │
│ 🏛️ Canton of Zurich Tax Administration         │
│                                                  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                  │
│ Personal Information:                           │
│ • Name: Hans Müller                             │
│ • AHV: 756.****.****.90                         │
│ • Address: Bahnhofstrasse 1, 8001 Zürich        │
│                                                  │
│ Tax Summary:                                    │
│ • Taxable Income: CHF 85,000                    │
│ • Total Tax: CHF 12,450                         │
│ • Federal: CHF 3,200                            │
│ • Cantonal: CHF 6,800                           │
│ • Municipal: CHF 2,450                          │
│                                                  │
│ Documents Included:                             │
│ ✓ Tax declaration (eCH-0196 format)            │
│ ✓ Salary certificate (Lohnausweis)             │
│ ✓ Bank statement summary                        │
│                                                  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                  │
│ ☐ I confirm that all information is correct and │
│   complete to the best of my knowledge          │
│                                                  │
│ ☐ I understand that submitting false information│
│   may result in penalties                        │
│                                                  │
│ ⚠️ Once submitted, you cannot undo this action. │
│ You may submit corrections later if needed.     │
│                                                  │
│ [ Cancel ]          [ Submit to Canton ]        │
└─────────────────────────────────────────────────┘
```

---

#### 3.8 New Component: Submission Progress Tracker

**Component:** `/src/components/EFiling/SubmissionProgressTracker.jsx`

**Purpose:** Real-time status of submission process

```
┌─────────────────────────────────────────────────┐
│ Submitting Your Tax Return...                   │
├─────────────────────────────────────────────────┤
│                                                  │
│ ✅ Preparing eCH-0058 message                   │
│ ✅ Encrypting sensitive data                    │
│ ✅ Connecting to Zurich Tax API                 │
│ ⏳ Sending data to canton...                    │
│ ⏸️ Waiting for confirmation                     │
│ ⏸️ Processing complete                          │
│                                                  │
│ [████████████████████░░░░░░] 75%                │
│                                                  │
│ This may take 30-60 seconds...                  │
│                                                  │
│ Technical Details (Advanced):                   │
│ • Submission ID: a3b5c7d9-...                   │
│ • API Endpoint: api.zh.ch/tax/submit            │
│ • Request Size: 2.4 MB                          │
│                                                  │
└─────────────────────────────────────────────────┘
```

---

#### 3.9 New Page: Submission Confirmation

**Location:** `/src/pages/TaxFiling/SubmissionConfirmation.jsx`

**Success State:**

```
┌─────────────────────────────────────────────────┐
│ ✅ Tax Return Submitted Successfully!           │
├─────────────────────────────────────────────────┤
│                                                  │
│ Your 2024 tax return has been submitted to:     │
│ Canton of Zurich Tax Administration             │
│                                                  │
│ Confirmation Details:                           │
│ • Submission ID: ZH-2024-12345678              │
│ • Submitted: Oct 15, 2025 at 14:32             │
│ • Status: Accepted                              │
│                                                  │
│ 📧 A confirmation email has been sent to:       │
│ hans.mueller@example.com                        │
│                                                  │
│ What happens next?                              │
│ 1. The canton will process your return          │
│    (Usually 2-3 weeks)                          │
│ 2. You'll receive an assessment notice          │
│ 3. Payment instructions will follow             │
│                                                  │
│ Track Your Submission:                          │
│ [ View Status ] [ Download Confirmation PDF ]   │
│                                                  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                  │
│ 💡 Next Steps:                                  │
│ • Complete secondary filing for Geneva property │
│ • Set up payment plan (optional)                │
│ • Download tax return PDF for your records      │
│                                                  │
│ [ Go to Dashboard ]        [ Submit Geneva ]    │
└─────────────────────────────────────────────────┘
```

---

#### 3.10 New Component: Submission Status Tracker

**Component:** `/src/components/EFiling/SubmissionStatusTracker.jsx`

**Purpose:** Track submission progress over days/weeks

```
┌─────────────────────────────────────────────────┐
│ Submission Status: Zurich Tax Return 2024      │
├─────────────────────────────────────────────────┤
│                                                  │
│ Confirmation #: ZH-2024-12345678                │
│                                                  │
│ Timeline:                                       │
│                                                  │
│ ✅ Oct 15, 14:32  Submitted                     │
│ ✅ Oct 15, 14:33  Accepted by canton            │
│ ✅ Oct 18, 09:15  Initial review completed      │
│ ⏳ Oct 22, --:--  In-depth review (current)     │
│ ⏸️ TBD           Assessment issued               │
│ ⏸️ TBD           Payment due                     │
│                                                  │
│ Estimated completion: Oct 30, 2025              │
│                                                  │
│ Current Status: In Review                       │
│ The canton is reviewing your tax return.        │
│ No action needed from you at this time.         │
│                                                  │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                  │
│ Actions:                                        │
│ [ 🔄 Refresh Status ]                           │
│ [ 📄 Download Submission PDF ]                  │
│ [ 📧 Request Status Update ]                    │
│                                                  │
│ Last checked: 2 minutes ago                     │
│ Next automatic check: in 58 minutes             │
│                                                  │
│ Need help? [ Contact Canton Support ]           │
└─────────────────────────────────────────────────┘
```

---

#### 3.11 Update: Settings - Authorized Cantons

**Location:** `/src/pages/Settings/EFilingSettings.jsx`

**New Section:**

```
┌─────────────────────────────────────────────────┐
│ E-Filing Authorizations                         │
├─────────────────────────────────────────────────┤
│                                                  │
│ Connected Cantons:                              │
│                                                  │
│ ┌─────────────────────────────────────────────┐│
│ │ 🏛️ Zurich (ZH)                              ││
│ │    Connected via SwissID                    ││
│ │    Authorized: Oct 15, 2025                 ││
│ │    Expires: Dec 31, 2025                    ││
│ │    [ Disconnect ] [ Renew ]                 ││
│ └─────────────────────────────────────────────┘│
│                                                  │
│ ┌─────────────────────────────────────────────┐│
│ │ 🏛️ Geneva (GE)                              ││
│ │    Not Connected                            ││
│ │    [ Connect Now ]                          ││
│ └─────────────────────────────────────────────┘│
│                                                  │
│ E-Filing Preferences:                           │
│                                                  │
│ ☑️ Automatically refresh submission status      │
│ ☑️ Email me when status changes                 │
│ ☐ SMS notifications for important updates       │
│                                                  │
│ Default Submission Method:                      │
│ ⚪ Electronic (recommended)                     │
│ ⚪ PDF download                                  │
│ ⚪ Ask me each time                              │
│                                                  │
│ Privacy & Security:                             │
│ • All communications are encrypted              │
│ • Tokens are securely stored                    │
│ • You can revoke access anytime                 │
│                                                  │
│ [ Manage SwissID Account ]                      │
└─────────────────────────────────────────────────┘
```

---

### API Endpoints - E-Filing Integration

#### 3.12 Required API Endpoints

```
GET /api/efiling/cantons
Response: {
  cantons: [
    {
      code: "ZH",
      name: "Zurich",
      efiling_enabled: true,
      requires_authorization: true,
      auth_method: "swissid"
    }
  ]
}

POST /api/efiling/authorize/{canton_code}
Body: {
  return_url: string
}
Response: {
  authorization_url: string  // Redirect user here
}

POST /api/efiling/authorize/callback
Body: {
  canton_code: string,
  code: string,
  state: string
}
Response: {
  success: true,
  authorization_id: UUID,
  expires_at: timestamp
}

POST /api/efiling/submit/{filing_id}
Body: {
  canton_code: string,
  submission_format: "ech0196"|"pdf",
  user_confirmation: boolean
}
Response: {
  submission_id: UUID,
  canton_submission_id: string,
  status: "submitted",
  tracking_url: string
}

GET /api/efiling/status/{submission_id}
Response: {
  submission_id: UUID,
  status: "submitted"|"accepted"|"processing"|"confirmed",
  status_message: string,
  last_updated: timestamp,
  estimated_completion: timestamp,
  timeline: [...]
}

GET /api/efiling/confirmation/{submission_id}
Response: PDF file (canton's official confirmation)

DELETE /api/efiling/authorization/{canton_code}
Response: {
  success: true,
  message: "Authorization revoked"
}
```

---

## Summary of All Database Changes

### New Tables Created

1. **Phase 1 (eCH-0196 Import):**
   - `swisstax.imported_documents` - Track all imports
   - `swisstax.ech0196_bank_data` - Bank account data
   - `swisstax.field_mapping_rules` - Mapping configuration
   - `swisstax.import_audit_log` - Audit trail

2. **Phase 2 (Swissdec ELM):**
   - `swisstax.swissdec_salary_data` - Salary certificate data
   - `swisstax.employment_aggregation` - Multi-employer totals

3. **Phase 3 (eCH-0058 E-Filing):**
   - `swisstax.canton_efiling_config` - Canton API configs
   - `swisstax.canton_submissions` - Submission tracking
   - `swisstax.user_canton_authorizations` - OAuth tokens
   - `swisstax.submission_status_history` - Status audit trail

### Existing Tables Modified

1. **`swisstax.interview_sessions`:**
   - Add: `data_sources` (JSONB)
   - Add: `has_imported_data` (BOOLEAN)
   - Add: `last_import_date` (TIMESTAMPTZ)
   - Add: `import_conflicts` (JSONB)
   - Add: `data_completeness_score` (DECIMAL)
   - Add: `missing_data_fields` (JSONB)

---

## Summary of All Frontend Changes

### New Pages

1. `/src/pages/TaxFiling/ImportDashboard.jsx` - Import central hub
2. `/src/pages/TaxFiling/SalaryImportWizard.jsx` - Swissdec import wizard
3. `/src/pages/TaxFiling/EFilingDashboard.jsx` - E-filing hub
4. `/src/pages/TaxFiling/SubmissionConfirmation.jsx` - Submission success
5. `/src/pages/Help/ImportGuide.jsx` - User tutorials

### New Components

1. `/src/components/Import/ImportPreviewModal.jsx` - Preview extracted data
2. `/src/components/Import/ConflictResolver.jsx` - Resolve data conflicts
3. `/src/components/Import/FileUploadWidget.jsx` - Drag-and-drop upload
4. `/src/components/Import/MultiEmployerManager.jsx` - Multiple jobs
5. `/src/components/EFiling/CantonAuthorizationFlow.jsx` - OAuth flow
6. `/src/components/EFiling/PreSubmissionReview.jsx` - Final review
7. `/src/components/EFiling/SubmissionProgressTracker.jsx` - Live progress
8. `/src/components/EFiling/SubmissionStatusTracker.jsx` - Long-term status

### Updated Pages

1. **Interview Flow** - Add import buttons to relevant questions
2. **Dashboard** - Add import summary widget
3. **Settings** - Add import preferences + canton authorizations
4. **Tax Results** - Add e-filing options

---

## Implementation Priority

**Recommended Order:**

1. **Phase 1 Focus:** Implement eCH-0196 import first (biggest UX impact)
2. **Phase 2 Follow-Up:** Add Swissdec ELM (critical for employees)
3. **Phase 3 Optional:** E-Filing integration (nice-to-have, high complexity)

**Quick Wins:**
- Phase 1 database + basic upload/parse → 1-2 weeks
- Phase 1 frontend + conflict resolution → 2-3 weeks
- Phase 2 Swissdec (similar to Phase 1) → 3-4 weeks

**High Effort:**
- Phase 3 E-Filing: Requires canton partnerships, OAuth setup, compliance → 2-3 months

---

**End of Document**
