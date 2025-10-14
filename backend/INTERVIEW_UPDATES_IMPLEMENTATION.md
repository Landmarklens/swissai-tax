# Swiss Tax Interview - Updates Implementation Plan

## Overview
This document outlines the comprehensive updates to the tax interview questionnaire based on user requirements. The main focus is shifting from manual data entry to document-driven data extraction using AI.

---

## Key Changes Summary

### Philosophy Shift
- **OLD**: Users manually enter financial data (amounts, details)
- **NEW**: Users answer Yes/No and upload documents; AI extracts data automatically
- **Benefit**: More accurate data, less user error, better audit trail

---

## Detailed Question Updates

### Q01: Spouse Information (if married)

#### Current Implementation
```yaml
Q01a:
  text: "Spouse's first name"
  type: "text"

Q01b:
  text: "Spouse's last name"
  type: "text"
```

#### New Implementation
```yaml
Q01a:
  id: "Q01a"
  text:
    en: "Spouse's AHV number (Swiss social security number)"
    de: "AHV-Nummer des Ehepartners"
    fr: "Numéro AVS du conjoint"
  type: "ahv_number"
  validation:
    pattern: "^756\\.\\d{4}\\.\\d{4}\\.\\d{2}$"
    checksum: true  # EAN-13 check digit validation
  help_text:
    en: "Format: 756.XXXX.XXXX.XX (e.g., 756.1234.5678.90)"
    de: "Format: 756.XXXX.XXXX.XX (z.B. 756.1234.5678.90)"
    fr: "Format: 756.XXXX.XXXX.XX (ex: 756.1234.5678.90)"
  placeholder: "756.1234.5678.90"
  required: true
  parent: "Q01"

# Remove Q01b (last name) - not needed with AHV
```

**AHV Validation Logic**:
- Format: 756.XXXX.XXXX.XX (13 digits with dots)
- Country code: 756 (Switzerland)
- Check digit: EAN-13 algorithm on 13th digit
- Allow input with or without dots, format on display

**Implementation File**: `backend/utils/ahv_validator.py`

---

### Q01c: Spouse Date of Birth

#### Update
```yaml
Q01c:
  id: "Q01c"
  text:
    en: "Spouse's date of birth"
  type: "date"
  widget: "calendar"  # NEW: Specify calendar picker
  validation:
    minDate: "1920-01-01"
    maxDate: "2006-12-31"
  required: true
  parent: "Q01"
```

**Frontend**: Use date picker with calendar dropdown (e.g., react-datepicker, MUI DatePicker)

---

### Q02b: Multiple Canton Assets

#### Current Implementation
```yaml
Q02b:
  text: "Postal code of the other canton"
  type: "text"
  format: "postal_code"
```

#### New Implementation
```yaml
Q02b:
  id: "Q02b"
  text:
    en: "Postal code of the other canton"
  type: "text"
  format: "postal_code"
  validation:
    pattern: "^\\d{4}$"
    min: 1000
    max: 9999
  auto_lookup: true  # Auto-lookup canton/municipality
  allow_multiple: true  # NEW: Allow adding multiple cantons
  next: "Q02c"
  required: true
  parent: "Q02a"

Q02c:  # NEW QUESTION
  id: "Q02c"
  text:
    en: "Do you have assets in another canton?"
    de: "Haben Sie Vermögen in einem weiteren Kanton?"
    fr: "Avez-vous des actifs dans un autre canton?"
  type: "yes_no"
  branching:
    yes: "Q02b"  # Loop back to add another postal code
    no: "Q03"
  required: true
  parent: "Q02b"
```

**Data Structure**:
```json
{
  "Q02b": ["8001", "1200", "6900"],  // Array of postal codes
  "Q02b_cantons": ["ZH", "GE", "TI"]  // Auto-looked-up cantons
}
```

---

### Q03a: Number of Children

#### Update
```yaml
Q03a:
  id: "Q03a"
  text:
    en: "Number of children"
  type: "dropdown"  # Changed from "number"
  options:
    - value: 1
    - value: 2
    - value: 3
    - value: 4
    - value: 5
    - value: 6
    - value: 7
    - value: 8
    - value: 9
    - value: 10
    - value: "more"
      label:
        en: "More than 10"
  validation:
    min: 1
    max: 20
  triggers_loop: "Q03b"
  next: "Q03c"
  required: true
  parent: "Q03"
```

---

### Q03b: Child Information

#### Update
```yaml
Q03b:
  id: "Q03b"
  text:
    en: "Child information"
  type: "group"
  loop: true
  explanation:  # NEW
    en: "We need your children's details to calculate child deductions (CHF 6,600 per child federal) and verify eligibility for childcare cost deductions."
    de: "Wir benötigen die Angaben zu Ihren Kindern, um Kinderabzüge (CHF 6'600 pro Kind Bund) zu berechnen und die Berechtigung für Kinderbetreuungskostenabzüge zu prüfen."
    fr: "Nous avons besoin des informations sur vos enfants pour calculer les déductions pour enfants (CHF 6'600 par enfant fédéral) et vérifier l'admissibilité aux déductions pour frais de garde."
  fields:
    - id: "child_name"
      text:
        en: "Child's name"
      type: "text"
      required: true
    - id: "child_dob"
      text:
        en: "Date of birth"
      type: "date"
      widget: "calendar"  # NEW
      required: true
    - id: "child_in_education"
      text:
        en: "In education/training?"
      type: "yes_no"
      required: true
  parent: "Q03a"
```

---

### Q03c: Childcare Costs

#### Current Implementation
```yaml
Q03c:
  text: "Annual childcare costs (daycare, nanny, etc.)"
  type: "currency"
  validation:
    min: 0
    max: 25500
```

#### New Implementation
```yaml
Q03c:
  id: "Q03c"
  text:
    en: "Do you have childcare costs (daycare, nanny, etc.)?"
    de: "Haben Sie Kinderbetreuungskosten (Kita, Tagesmutter, etc.)?"
    fr: "Avez-vous des frais de garde d'enfants (crèche, nourrice, etc.)?"
  type: "yes_no"
  branching:
    yes: "Q03c_upload"
    no: "Q04"
  required: true
  parent: "Q03a"

Q03c_upload:  # NEW
  id: "Q03c_upload"
  text:
    en: "Upload childcare cost documents"
  type: "document_upload"
  document_type: "childcare_costs"
  accepted_formats: ["pdf", "jpg", "jpeg", "png"]
  max_size_mb: 10
  help_text:
    en: "Upload invoices, receipts, or statements showing childcare costs. Maximum deduction: CHF 25,500 (2024)"
  bring_later: true  # NEW: Allow "I'll bring this later"
  next: "Q04"
  required: false  # Can skip with "bring later"
  parent: "Q03c"
```

---

### Q04: Number of Employers

#### Update
```yaml
Q04:
  id: "Q04"
  text:
    en: "Number of employers (including yourself if self-employed)"
  type: "dropdown"  # Changed from "number"
  options:
    - value: 0
      label:
        en: "Not employed"
    - value: 1
    - value: 2
    - value: 3
    - value: 4
    - value: 5
    - value: 6
    - value: 7
    - value: 8
    - value: 9
    - value: 10
  branching:
    "0": "Q05"
    default: "Q04a"
  required: true
```

---

### Q04b: Commuting Expenses

#### Current Implementation
```yaml
Q04b:
  text: "Annual commuting expenses (public transport passes/tickets)"
  type: "currency"
```

#### New Implementation
```yaml
Q04b:
  id: "Q04b"
  text:
    en: "Do you have commuting expenses (public transport)?"
    de: "Haben Sie Pendlerkosten (öffentliche Verkehrsmittel)?"
    fr: "Avez-vous des frais de déplacement (transports publics)?"
  type: "yes_no"
  branching:
    yes: "Q04b_upload"
    no: "Q04c"
  required: true
  parent: "Q04"

Q04b_upload:  # NEW
  id: "Q04b_upload"
  text:
    en: "Upload commuting cost documents"
  type: "document_upload"
  document_type: "commuting_costs"
  accepted_formats: ["pdf", "jpg", "jpeg", "png"]
  help_text:
    en: "Upload public transport passes, GA/Halbtax cards, or receipts. Maximum deduction: CHF 3,200 (2024)"
  bring_later: true
  next: "Q04c"
  required: false
  parent: "Q04b"
```

---

### Q04c: Professional Expenses

#### New Implementation
```yaml
Q04c:
  id: "Q04c"
  text:
    en: "Do you have professional expenses (tools, training, work materials)?"
  type: "yes_no"
  branching:
    yes: "Q04c_upload"
    no: "Q05"
  required: true
  parent: "Q04"

Q04c_upload:  # NEW
  id: "Q04c_upload"
  text:
    en: "Upload professional expense documents"
  type: "document_upload"
  document_type: "professional_expenses"
  accepted_formats: ["pdf", "jpg", "jpeg", "png"]
  help_text:
    en: "Upload receipts for work-related expenses: professional tools, continuing education, work clothing, etc."
  bring_later: true
  next: "Q05"
  required: false
  parent: "Q04c"
```

---

### Q08: Pillar 3a Contributions

#### Current Implementation
```yaml
Q08:
  text: "Did you contribute to Pillar 3a?"
  type: "yes_no"
  branching:
    yes: "Q08a"
    no: "Q09"

Q08a:
  text: "Total Pillar 3a contributions (CHF)"
  type: "currency"
  validation:
    max: 7056
```

#### New Implementation
```yaml
Q08:
  id: "Q08"
  text:
    en: "Did you contribute to Pillar 3a?"
  type: "yes_no"
  branching:
    yes: "Q08_upload"
    no: "Q09"
  required: true

Q08_upload:  # NEW (replaces Q08a)
  id: "Q08_upload"
  text:
    en: "Upload Pillar 3a certificates"
  type: "document_upload"
  document_type: "pillar_3a_certificate"
  accepted_formats: ["pdf", "jpg", "jpeg", "png"]
  help_text:
    en: "Upload your annual Pillar 3a contribution certificate from your bank or insurance. Maximum deduction: CHF 7,056 (2024)"
  bring_later: true
  next: "Q09"
  required: false
  parent: "Q08"

# REMOVE Q08a (manual amount input)
```

---

### Q09a: Number of Properties

#### Update
```yaml
Q09a:
  id: "Q09a"
  text:
    en: "Number of properties"
  type: "dropdown"  # Changed from "number"
  options:
    - value: 1
    - value: 2
    - value: 3
    - value: 4
    - value: 5
    - value: 6
    - value: 7
    - value: 8
    - value: 9
    - value: 10
    - value: "more"
      label:
        en: "More than 10"
  validation:
    min: 1
    max: 20
  triggers_loop: "Q09b"
  next: "Q10"
  required: true
  parent: "Q09"
```

---

### Q09b: Property Details

#### Current Implementation
```yaml
Q09b:
  type: "group"
  loop: true
  fields:
    - id: "property_type"
      type: "single_choice"
    - id: "property_value"
      type: "currency"
    - id: "mortgage_amount"
      type: "currency"
    - id: "mortgage_interest"
      type: "currency"
```

#### New Implementation
```yaml
Q09b:
  id: "Q09b"
  text:
    en: "Property details"
  type: "group"
  loop: true
  fields:
    - id: "property_postal_code"  # NEW
      text:
        en: "Property postal code"
        de: "Postleitzahl der Immobilie"
        fr: "Code postal de la propriété"
      type: "text"
      format: "postal_code"
      validation:
        pattern: "^\\d{4}$"
      auto_lookup: true
      required: true

    - id: "property_type"
      text:
        en: "Property type"
      type: "single_choice"
      options:
        - value: "primary_residence"
          label:
            en: "Primary residence"
        - value: "secondary_residence"
          label:
            en: "Secondary residence"
        - value: "rental_property"
          label:
            en: "Rental property"
      required: true

    - id: "property_documents"  # NEW
      text:
        en: "Upload property documents"
      type: "document_upload"
      document_type: "property_documents"
      accepted_formats: ["pdf", "jpg", "jpeg", "png"]
      help_text:
        en: "Upload property tax statement, mortgage statement, and any related documents. We'll extract property value, mortgage amount, and interest payments."
      bring_later: true
      required: false

  parent: "Q09a"

# REMOVE manual fields: property_value, mortgage_amount, mortgage_interest
```

---

### Q10: Securities/Investments

#### New Implementation
```yaml
Q10:
  id: "Q10"
  text:
    en: "Do you have securities/investments?"
  type: "yes_no"
  branching:
    yes: "Q10_upload"
    no: "Q11"
  required: true

Q10_upload:  # NEW
  id: "Q10_upload"
  text:
    en: "Upload securities/investment account statements"
  type: "document_upload"
  document_type: "securities_statement"
  accepted_formats: ["pdf", "jpg", "jpeg", "png"]
  help_text:
    en: "Upload your annual securities account statement showing holdings, dividends, and capital gains"
  bring_later: true
  next: "Q11"
  required: false
  parent: "Q10"
```

---

### Q11: Charitable Donations

#### New Implementation
```yaml
Q11:
  id: "Q11"
  text:
    en: "Did you make charitable donations over CHF 100?"
  type: "yes_no"
  branching:
    yes: "Q11_upload"
    no: "Q12"
  required: true

Q11_upload:  # NEW (replaces Q11a)
  id: "Q11_upload"
  text:
    en: "Upload donation receipts"
  type: "document_upload"
  document_type: "donation_receipts"
  accepted_formats: ["pdf", "jpg", "jpeg", "png"]
  help_text:
    en: "Upload receipts from registered charitable organizations. Donations must be over CHF 100 to be deductible."
  bring_later: true
  next: "Q12"
  required: false
  parent: "Q11"

# REMOVE Q11a (manual amount input)
```

---

### Q12: Alimony Payments

#### New Implementation
```yaml
Q12:
  id: "Q12"
  text:
    en: "Did you pay alimony?"
  type: "yes_no"
  branching:
    yes: "Q12_upload"
    no: "Q13"
  required: true

Q12_upload:  # NEW (replaces Q12a)
  id: "Q12_upload"
  text:
    en: "Upload alimony payment documents"
  type: "document_upload"
  document_type: "alimony_documents"
  accepted_formats: ["pdf", "jpg", "jpeg", "png"]
  help_text:
    en: "Upload court orders, divorce settlements, or payment receipts showing alimony payments"
  bring_later: true
  next: "Q13"
  required: false
  parent: "Q12"

# REMOVE Q12a (manual amount input)
```

---

### Q13: Medical Expenses

#### New Implementation
```yaml
Q13:
  id: "Q13"
  text:
    en: "Did you have medical expenses over CHF 2000?"
  type: "yes_no"
  branching:
    yes: "Q13_upload"
    no: "Q13b"
  required: true

Q13_upload:  # NEW (replaces Q13a)
  id: "Q13_upload"
  text:
    en: "Upload medical expense receipts"
  type: "document_upload"
  document_type: "medical_receipts"
  accepted_formats: ["pdf", "jpg", "jpeg", "png"]
  help_text:
    en: "Upload medical bills, receipts, and statements. Only expenses exceeding 5% of your income are deductible."
  bring_later: true
  next: "Q13b"
  required: false
  parent: "Q13"

# REMOVE Q13a (manual amount input)

Q13b:
  id: "Q13b"
  text:
    en: "Upload health insurance premium documents"
    de: "Krankenkassenprämien-Dokumente hochladen"
    fr: "Télécharger les documents de primes d'assurance maladie"
  type: "document_upload"  # Changed from "currency"
  document_type: "health_insurance_premiums"
  accepted_formats: ["pdf", "jpg", "jpeg", "png"]
  help_text:
    en: "Upload your annual health insurance premium statement. This is mandatory in Switzerland and fully deductible."
  bring_later: true
  next: "Q14"
  required: true  # Mandatory - but can mark "bring later"
```

---

### Q14: Church Tax

#### Update
```yaml
Q14:
  id: "Q14"
  text:
    en: "Do you pay church tax?"
    de: "Zahlen Sie Kirchensteuer?"
    fr: "Payez-vous l'impôt ecclésiastique?"
  type: "yes_no"
  branching:
    yes: "Q14a"
    no: "complete"
  required: true

Q14a:  # NEW
  id: "Q14a"
  text:
    en: "Which religion?"
  type: "single_choice"
  options:
    - value: "protestant"
      label:
        en: "Protestant"
        de: "Evangelisch"
        fr: "Protestant"
    - value: "catholic"
      label:
        en: "Catholic"
        de: "Katholisch"
        fr: "Catholique"
  next: "Q14b"
  required: true
  parent: "Q14"

Q14b:  # NEW
  id: "Q14b"
  text:
    en: "Upload church tax documents (optional)"
  type: "document_upload"
  document_type: "church_tax_documents"
  accepted_formats: ["pdf", "jpg", "jpeg", "png"]
  help_text:
    en: "Upload church tax statements if available"
  bring_later: true
  next: "complete"
  required: false
  parent: "Q14a"
```

---

## New Document Types

Add to existing document types:

```python
DOCUMENT_TYPES = {
    # Existing
    "lohnausweis": "Wage Statement (Lohnausweis)",
    "pillar_3a_certificate": "Pillar 3a Certificate",
    "property_tax_statement": "Property Tax Statement",
    "mortgage_statement": "Mortgage Statement",
    "securities_statement": "Securities Account Statement",

    # NEW document types
    "childcare_costs": "Childcare Cost Documents",
    "commuting_costs": "Commuting Expense Documents",
    "professional_expenses": "Professional Expense Documents",
    "property_documents": "Property Documents (Tax/Mortgage)",
    "donation_receipts": "Charitable Donation Receipts",
    "alimony_documents": "Alimony Payment Documents",
    "medical_receipts": "Medical Expense Receipts",
    "health_insurance_premiums": "Health Insurance Premium Statement",
    "church_tax_documents": "Church Tax Documents",
    "unemployment_statement": "Unemployment Benefits Statement",
    "insurance_benefits": "Disability/Accident Insurance Benefits",
    "pension_certificate": "Pension Fund Certificate",
}
```

---

## Document Upload Feature Specifications

### "Bring Later" Checkbox

Every document upload question includes:

```yaml
bring_later: true  # Enables "I'll bring this later" option
```

**UI Implementation**:
```jsx
<DocumentUploadField>
  <DropZone />
  <Checkbox>
    I'll bring this later
  </Checkbox>
</DocumentUploadField>
```

**Behavior**:
- If user checks "bring later": Document marked as "pending" in database
- User can proceed to next question
- Document added to "Pending Documents Checklist"

---

### Pending Documents Checklist

**Database Structure**:
```sql
CREATE TABLE swisstax.pending_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filing_session_id VARCHAR(36) REFERENCES swisstax.tax_filing_sessions(id),
    question_id VARCHAR(50) NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending',  -- pending, uploaded, verified
    created_at TIMESTAMP DEFAULT NOW(),
    uploaded_at TIMESTAMP,
    INDEX idx_filing_pending (filing_session_id, status)
);
```

**API Endpoint**:
```python
@router.get("/filings/{filing_id}/pending-documents")
async def get_pending_documents(filing_id: str):
    """
    Get list of documents marked as "bring later"

    Returns:
    {
        "filing_id": "...",
        "total_pending": 5,
        "documents": [
            {
                "question_id": "Q03c_upload",
                "document_type": "childcare_costs",
                "label": "Childcare Cost Documents",
                "status": "pending",
                "marked_at": "2024-10-14T10:30:00Z"
            },
            ...
        ]
    }
    """
```

**UI Display**:
- Show checklist at end of interview
- Show persistent badge/counter in sidebar during interview
- Dedicated "Pending Documents" page in dashboard

---

### Tax Calculation Validation

**Cannot calculate taxes without ALL required documents uploaded**

```python
@router.post("/interview/{session_id}/calculate")
async def calculate_taxes_for_session(session_id: str):
    # Check for pending documents
    pending = db.query(PendingDocument).filter(
        PendingDocument.filing_session_id == filing_session_id,
        PendingDocument.status == 'pending'
    ).all()

    if pending:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": "cannot_calculate_with_pending_documents",
                "message": "Please upload all required documents before calculating taxes",
                "pending_count": len(pending),
                "pending_documents": [
                    {
                        "type": doc.document_type,
                        "question": doc.question_id
                    }
                    for doc in pending
                ]
            }
        )

    # Proceed with calculation if all documents uploaded
    calculation = tax_service.calculate_single_filing(filing_session)
    return {"success": True, "calculation": calculation}
```

**Error Response**:
```json
{
  "error": "cannot_calculate_with_pending_documents",
  "message": "Please upload all required documents before calculating taxes",
  "pending_count": 3,
  "pending_documents": [
    {
      "type": "childcare_costs",
      "question": "Q03c_upload"
    },
    {
      "type": "pillar_3a_certificate",
      "question": "Q08_upload"
    },
    {
      "type": "property_documents",
      "question": "Q09b.property_documents"
    }
  ]
}
```

---

## Frontend UI Layout

### Inline Document Upload (Right Side)

```
┌─────────────────────────────────────────────────────────────┐
│                     Interview Page                          │
├──────────────────────────┬──────────────────────────────────┤
│                          │                                  │
│  QUESTION (Left 60%)     │  DOCUMENT UPLOAD (Right 40%)     │
│                          │                                  │
│  Q03c: Do you have      │  ┌────────────────────────────┐  │
│  childcare costs?       │  │   Upload Documents         │  │
│                          │  │                            │  │
│  ○ Yes                   │  │   [Drag & Drop Area]      │  │
│  ○ No                    │  │                            │  │
│                          │  │   or click to browse       │  │
│  [Help: Childcare costs │  │                            │  │
│   up to CHF 25,500...]  │  │   Accepted: PDF, JPG, PNG  │  │
│                          │  │   Max size: 10 MB          │  │
│                          │  └────────────────────────────┘  │
│                          │                                  │
│                          │  ☐ I'll bring this later         │
│                          │                                  │
│  [Previous] [Next]       │  Uploaded: 0 files               │
│                          │                                  │
└──────────────────────────┴──────────────────────────────────┘
```

**Responsive Behavior**:
- Desktop: Side-by-side (60/40 split)
- Tablet: Side-by-side (50/50 split)
- Mobile: Stacked (question on top, upload below)

---

## Implementation Files

### Backend Files to Create/Update

1. **`backend/utils/ahv_validator.py`** (NEW)
   - AHV number format validation
   - EAN-13 check digit algorithm

2. **`backend/config/questions.yaml`** (UPDATE)
   - All question changes outlined above

3. **`backend/models/pending_document.py`** (NEW)
   - PendingDocument model

4. **`backend/models/question.py`** (UPDATE)
   - Add support for new question types: `ahv_number`, `document_upload`, `dropdown`
   - Add `bring_later`, `widget`, `explanation` fields

5. **`backend/services/interview_service.py`** (UPDATE)
   - Handle document upload questions
   - Track pending documents
   - Validate document completeness

6. **`backend/routers/interview.py`** (UPDATE)
   - Add pending documents endpoint
   - Update calculate endpoint validation

7. **`backend/alembic/versions/XXXX_add_pending_documents_table.py`** (NEW)
   - Migration for pending_documents table

### Frontend Files to Create/Update

1. **`frontend/src/components/Interview/DocumentUploadField.jsx`** (NEW)
   - Document upload with drag-drop
   - "Bring later" checkbox
   - File preview/list

2. **`frontend/src/components/Interview/AHVNumberInput.jsx`** (NEW)
   - Formatted AHV input (auto-format with dots)
   - Real-time validation with check digit

3. **`frontend/src/components/Interview/InterviewPage.jsx`** (UPDATE)
   - Two-column layout
   - Conditional document upload panel

4. **`frontend/src/components/Dashboard/PendingDocumentsChecklist.jsx`** (NEW)
   - Display pending documents list
   - Upload from checklist
   - Track completion

5. **`frontend/src/components/Interview/QuestionTypes/`** (UPDATE)
   - Add handlers for new question types

---

## Implementation Phases

### Phase 1: Backend Foundation (Week 1)
- [ ] Create AHV validator utility
- [ ] Update questions.yaml with all changes
- [ ] Create PendingDocument model
- [ ] Create migration for pending_documents table
- [ ] Update Question model for new types

### Phase 2: Backend Services (Week 1-2)
- [ ] Update InterviewService for document handling
- [ ] Add pending documents endpoints
- [ ] Update calculate endpoint validation
- [ ] Add document tracking logic

### Phase 3: Frontend Components (Week 2)
- [ ] Create DocumentUploadField component
- [ ] Create AHVNumberInput component
- [ ] Update InterviewPage layout
- [ ] Add dropdown question types

### Phase 4: Frontend Integration (Week 2-3)
- [ ] Integrate document uploads with questions
- [ ] Add "bring later" functionality
- [ ] Create PendingDocumentsChecklist
- [ ] Add validation UI for calculate button

### Phase 5: Testing (Week 3)
- [ ] Unit tests for AHV validation
- [ ] Integration tests for document flow
- [ ] E2E tests for complete interview
- [ ] Test calculation validation

### Phase 6: Deployment (Week 3-4)
- [ ] Run migrations on staging
- [ ] Deploy backend changes
- [ ] Deploy frontend changes
- [ ] User acceptance testing

---

## Testing Checklist

### AHV Number Validation
- [ ] Valid format: 756.1234.5678.90
- [ ] Invalid format: 755.1234.5678.90 (wrong country code)
- [ ] Invalid checksum
- [ ] Format with/without dots
- [ ] Empty input
- [ ] Special characters

### Multiple Canton Support
- [ ] Add 1 canton
- [ ] Add 3 cantons
- [ ] Add 10 cantons
- [ ] Remove canton
- [ ] Auto-lookup validation

### Document Upload
- [ ] Upload PDF
- [ ] Upload JPG/PNG
- [ ] Upload invalid format
- [ ] Upload file > 10MB
- [ ] Multiple files per question
- [ ] "Bring later" checkbox
- [ ] View uploaded files

### Pending Documents
- [ ] Mark document as "bring later"
- [ ] View pending documents list
- [ ] Upload from pending list
- [ ] Remove from pending after upload
- [ ] Block calculation with pending docs

### Calendar Widget
- [ ] Date selection
- [ ] Min/max date validation
- [ ] Keyboard navigation
- [ ] Mobile responsiveness

### Dropdown Questions
- [ ] Number of children (1-10+)
- [ ] Number of employers (0-10)
- [ ] Number of properties (1-10+)

---

## Migration Strategy

### Data Migration
For existing interviews in progress:
1. Keep old questions functional
2. Add new questions as optional
3. Allow users to "upgrade" interview
4. Provide migration script for partial data

### Backward Compatibility
- Keep old question IDs
- Map old currency inputs to document upload
- Preserve existing answers in database

---

## Success Metrics

1. **User Experience**
   - Reduced average interview completion time
   - Fewer user errors in data entry
   - Higher completion rate

2. **Data Quality**
   - More accurate financial data
   - Better audit trail with documents
   - Reduced manual corrections needed

3. **Technical**
   - Document upload success rate > 95%
   - AI extraction accuracy > 90%
   - Zero calculation errors with pending docs

---

## Questions Answered

1. ✅ **AHV Number format**: 756.XXXX.XXXX.XX with EAN-13 check digit
2. ✅ **Multiple cantons**: Iterative "Add another canton?" after each entry
3. ✅ **Document upload UI**: Inline on right side of screen (60/40 split)
4. ✅ **"Bring later" option**: Checkbox on each document question
5. ✅ **Mandatory documents**: Cannot calculate without all documents
6. ✅ **Property details**: Ask postal code manually, documents for values
7. ✅ **Church tax**: Yes/No, then ask religion type (Protestant/Catholic)
8. ✅ **Calendar widget**: Any standard date picker (no preference)

---

## Next Steps

1. Review this implementation plan
2. Confirm all changes are correct
3. Start Phase 1: Backend Foundation
4. Set up project board with tasks from todo list

---

**Document Version**: 1.0
**Last Updated**: 2024-10-14
**Author**: Claude (AI Assistant)
**Status**: Ready for Implementation
