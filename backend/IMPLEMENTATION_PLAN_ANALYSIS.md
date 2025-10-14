# Interview Updates - Implementation Plan Analysis

## Executive Summary

After analyzing the existing codebase, I've identified what's already implemented and what needs to be built on top. This document provides a strategic implementation plan that leverages existing infrastructure.

---

## What Already Exists (Strong Foundation)

### ✅ Document Management Infrastructure
**Location**: `services/document_service.py`, `routers/documents.py`

**Capabilities**:
- S3 presigned URL generation for uploads
- Document metadata storage in `swisstax.documents` table
- AWS Textract integration for OCR
- Document listing, downloading, and deletion
- User storage management (quota tracking)
- ZIP export of all documents
- Old document cleanup (7-year retention)

**Database Schema** (`swisstax.documents`):
```sql
- id (uuid)
- session_id (uuid)
- user_id (uuid)
- document_type (varchar)
- file_name, file_size, mime_type
- s3_key, s3_bucket
- ocr_status, ocr_data, ocr_result
- extracted_fields, metadata
- created_at, updated_at
```

### ✅ Interview Service
**Location**: `services/interview_service.py`

**Capabilities**:
- Session management (in-memory storage)
- Question flow control with branching
- Answer validation
- Sensitive data encryption
- Postal code auto-lookup
- Multi-canton filing support (Q06a property cantons)
- Profile generation from answers
- Document requirement calculation
- Progress tracking

**Key Features**:
- Handles conditional branching (married → spouse questions)
- Loops for children and employers
- Encrypts sensitive answers (names, DOB, financial amounts)
- Multi-threading safe with locks

### ✅ Question System
**Location**: `models/question.py`, `config/questions.yaml`

**Capabilities**:
- YAML-based question configuration
- Question types: text, number, currency, date, yes_no, single_choice, dropdown, group
- Validation rules (min/max, pattern, required)
- Branching logic
- Looping for children, employers
- Auto-lookup for postal codes
- Document requirement rules

**Current Questions**: Q01-Q14 fully defined

### ✅ AI Document Intelligence
**Location**: `services/ai_document_intelligence_service.py`

**Capabilities**:
- Multi-provider AI (Anthropic Claude, OpenAI)
- Document classification (identifies Lohnausweis, 3a certificates, etc.)
- Data extraction from documents
- JSON response parsing
- Field validation (currency, dates, SSN)
- Mapping extracted data to tax profile
- Supports 14 document types

### ✅ New Components (Just Created)
1. **AHV Validator** (`utils/ahv_validator.py`)
   - Format: 756.XXXX.XXXX.XX
   - EAN-13 check digit validation
   - Formatting and generation helpers

2. **PendingDocument Model** (`models/pending_document.py`)
   - Tracks "bring later" documents
   - Status: pending → uploaded → verified
   - Links to filing sessions

3. **Migration** (f492ec67b656)
   - `swisstax.pending_documents` table
   - `document_status_enum` type
   - Indexes for performance

---

## What Needs to Be Built

### Phase 1: Backend Updates (4-6 hours)

#### 1.1 Update Question Model ⏱️ 30 min
**File**: `models/question.py`

**Changes**:
```python
class QuestionType(Enum):
    # Existing...
    AHV_NUMBER = "ahv_number"  # NEW
    DOCUMENT_UPLOAD = "document_upload"  # NEW

class Question:
    def __init__(self, data):
        # Existing attributes...
        # NEW attributes:
        self.document_type = data.get('document_type')
        self.bring_later = data.get('bring_later', False)
        self.widget = data.get('widget')  # 'calendar' for dates
        self.explanation = data.get('explanation', {})
        self.allow_multiple = data.get('allow_multiple', False)
```

**Status**: PARTIALLY DONE (QuestionType updated, need to finalize Question init)

---

#### 1.2 Update questions.yaml ⏱️ 2 hours
**File**: `config/questions.yaml`

**Scope**: 600+ lines of changes

**Key Updates**:
- Q01a: Change to AHV number (remove Q01b)
- Q01c: Add `widget: calendar`
- Q02b/Q02c: Add multiple canton support
- Q03a: Change to dropdown
- Q03b: Add explanation
- Q03c → Q03c_upload: Convert to document upload
- Q04: Change to dropdown
- Q04b, Q04c, Q08, Q10, Q11, Q12, Q13: Convert to document upload pattern
- Q09a: Change to dropdown
- Q09b: Add postal code, convert to document upload
- Q14: Split into Q14/Q14a/Q14b

**Strategy**: Update incrementally, test after each major section

---

#### 1.3 Extend Interview Service ⏱️ 2 hours
**File**: `services/interview_service.py`

**New Methods**:
```python
def handle_document_upload(self, session_id, question_id, bring_later=False):
    """Handle document upload question"""
    if bring_later:
        # Create pending document record
        self._create_pending_document(session_id, question_id)
    return next_question

def _create_pending_document(self, session_id, question_id):
    """Create pending document record in DB"""
    # Implementation uses PendingDocument model

def validate_ahv_number(self, answer):
    """Validate AHV using ahv_validator"""
    from utils.ahv_validator import validate_ahv_number
    return validate_ahv_number(answer, strict=False)

def handle_multiple_values(self, session_id, question_id, values):
    """Handle questions that allow multiple values (e.g., multiple cantons)"""
    # Store as list in answers
    # Ask "Add another?" iteratively
```

**Modifications to Existing Methods**:
- `submit_answer()`: Add handling for AHV_NUMBER and DOCUMENT_UPLOAD types
- `_format_question()`: Include new question attributes (explanation, widget, document_type)
- `_is_question_sensitive()`: Update for new Q01a (AHV number)

---

#### 1.4 Add Pending Documents Endpoints ⏱️ 1 hour
**File**: `routers/interview.py`

**New Endpoints**:
```python
@router.get("/filings/{filing_id}/pending-documents")
async def get_pending_documents(filing_id: str, db: Session):
    """Get list of pending documents for a filing"""

@router.post("/filings/{filing_id}/pending-documents/{doc_id}/upload")
async def upload_pending_document(filing_id: str, doc_id: str, db: Session):
    """Upload a previously pending document"""

@router.delete("/filings/{filing_id}/pending-documents/{doc_id}")
async def remove_pending_document(filing_id: str, doc_id: str, db: Session):
    """Remove from pending list (mark as not needed)"""
```

---

#### 1.5 Update Calculate Endpoint Validation ⏱️ 30 min
**File**: `routers/interview.py`

**Modification**:
```python
@router.post("/{session_id}/calculate")
async def calculate_taxes_for_session(...):
    # BEFORE calculation, check for pending documents
    pending_docs = db.query(PendingDocument).filter(
        PendingDocument.filing_session_id == filing_session_id,
        PendingDocument.status == DocumentStatus.PENDING
    ).all()

    if pending_docs:
        raise HTTPException(
            status_code=400,
            detail={
                "error": "cannot_calculate_with_pending_documents",
                "pending_count": len(pending_docs),
                "pending_documents": [doc.to_dict() for doc in pending_docs]
            }
        )

    # Proceed with calculation...
```

---

### Phase 2: Frontend Components (6-8 hours)

#### 2.1 AHV Number Input Component ⏱️ 1.5 hours
**File**: `frontend/src/components/Interview/AHVNumberInput.jsx`

**Features**:
- Auto-format as user types (add dots)
- Real-time validation with check digit
- Error messages in multiple languages
- Visual feedback (green checkmark for valid, red X for invalid)

**Dependencies**: React, regex, validation logic

---

#### 2.2 Document Upload Field Component ⏱️ 2 hours
**File**: `frontend/src/components/Interview/DocumentUploadField.jsx`

**Features**:
- Drag-and-drop zone
- File type validation (PDF, JPG, PNG)
- File size limit (10MB)
- Upload progress bar
- File preview/thumbnail
- "Bring later" checkbox
- Multiple file support
- Integration with existing DocumentService

**UI Structure**:
```jsx
<DocumentUploadField
  questionId="Q08_upload"
  documentType="pillar_3a_certificate"
  acceptedFormats={['pdf', 'jpg', 'png']}
  maxSizeMB={10}
  allowBringLater={true}
  onUploadComplete={handleUpload}
  onBringLater={handleBringLater}
/>
```

---

#### 2.3 Interview Page Layout Update ⏱️ 2 hours
**File**: `frontend/src/pages/Interview/InterviewPage.jsx`

**Changes**:
- Split into two-column layout (60/40)
- Left: Question display
- Right: Conditional document upload panel (shows only for document upload questions)
- Responsive: Stack vertically on mobile
- Smooth transitions when document panel appears/disappears

**CSS Grid**:
```css
.interview-container {
  display: grid;
  grid-template-columns: 60% 40%;
  gap: 2rem;
}

@media (max-width: 768px) {
  .interview-container {
    grid-template-columns: 1fr;
  }
}
```

---

#### 2.4 Pending Documents Checklist ⏱️ 2 hours
**File**: `frontend/src/components/Dashboard/PendingDocumentsChecklist.jsx`

**Features**:
- Display list of pending documents
- Grouped by question/section
- Upload directly from checklist
- Mark as "not needed" option
- Progress indicator (X of Y documents uploaded)
- Shows on dashboard and at end of interview

**Data Structure**:
```jsx
const pendingDocs = [
  {
    id: "...",
    questionId: "Q08_upload",
    documentType: "pillar_3a_certificate",
    label: "Pillar 3a Contribution Certificate",
    status: "pending",
    markedAt: "2024-10-14T..."
  },
  // ...
]
```

---

#### 2.5 Update Question Renderers ⏱️ 1 hour
**File**: `frontend/src/components/Interview/QuestionTypes/`

**New Renderers**:
- `AHVNumberQuestion.jsx` - Uses AHVNumberInput component
- `DocumentUploadQuestion.jsx` - Uses DocumentUploadField component
- `DropdownQuestion.jsx` - Enhanced dropdown with search for large lists

**Modifications**:
- `DateQuestion.jsx` - Add calendar widget option
- `GroupQuestion.jsx` - Add explanation display

---

### Phase 3: Testing (3-4 hours)

#### 3.1 Backend Unit Tests ⏱️ 1.5 hours

**New Test Files**:
1. `tests/test_ahv_validator.py` - AHV validation logic
2. `tests/test_pending_documents.py` - Pending document model and endpoints
3. `tests/test_interview_service_documents.py` - Document handling in interview

**Test Coverage**:
- Valid/invalid AHV numbers
- Check digit calculation
- Document upload flow
- Bring later functionality
- Calculation blocking with pending documents
- Multiple canton support
- Dropdown questions

---

#### 3.2 Frontend Component Tests ⏱️ 1 hour

**Test Files**:
1. `AHVNumberInput.test.jsx`
2. `DocumentUploadField.test.jsx`
3. `PendingDocumentsChecklist.test.jsx`

**Test Scenarios**:
- AHV number formatting
- File upload validation
- Drag-and-drop
- Bring later checkbox
- Pending documents list rendering

---

#### 3.3 Integration Tests ⏱️ 1.5 hours

**End-to-End Flows**:
1. Complete interview with document uploads
2. Mark documents as "bring later"
3. View pending documents checklist
4. Try to calculate without all documents (should block)
5. Upload pending documents
6. Calculate successfully
7. Multiple canton scenario

---

### Phase 4: Deployment (1 hour)

#### 4.1 Database Migration ⏱️ 15 min
```bash
# Already created: f492ec67b656_add_pending_documents_table.py
./run_migration.sh --auto
```

#### 4.2 Backend Deployment ⏱️ 20 min
```bash
git add .
git commit -m "Implement interview document upload updates"
git push
# AWS App Runner auto-deploys
```

#### 4.3 Frontend Deployment ⏱️ 15 min
```bash
cd frontend
npm run build
# Deploy to hosting (Vercel/Netlify)
```

#### 4.4 Smoke Testing ⏱️ 10 min
- Test one complete interview flow
- Verify document uploads work
- Check pending documents list
- Confirm calculation validation

---

## Implementation Strategy

### Option A: Incremental (Recommended)
**Duration**: 2-3 weeks, 2-3 hours/day

**Week 1**: Backend foundation
- Day 1-2: Update Question model and questions.yaml (Q01-Q07)
- Day 3-4: Update questions.yaml (Q08-Q14)
- Day 5: Extend Interview Service

**Week 2**: Backend completion + Frontend start
- Day 1: Add pending documents endpoints
- Day 2: Update calculate validation + testing
- Day 3-4: Build AHV Input and Document Upload components
- Day 5: Update Interview Page layout

**Week 3**: Frontend completion + Testing
- Day 1-2: Build Pending Documents Checklist
- Day 3: Integration testing
- Day 4: Bug fixes
- Day 5: Deployment

### Option B: Sprint (Aggressive)
**Duration**: 3-4 days, 8-10 hours/day

**Day 1**: Backend (8 hours)
- Morning: Question model + questions.yaml
- Afternoon: Interview Service + endpoints

**Day 2**: Frontend components (8 hours)
- Morning: AHV Input + Document Upload
- Afternoon: Interview layout + Pending checklist

**Day 3**: Integration + Testing (8 hours)
- Morning: Wire everything together
- Afternoon: Testing and bug fixes

**Day 4**: Polish + Deploy (4 hours)
- Morning: Final testing
- Afternoon: Deployment

---

## Risk Assessment

### High Risk
- **questions.yaml complexity**: 600+ lines, easy to make syntax errors
  - **Mitigation**: Update in small chunks, validate YAML after each change

### Medium Risk
- **Interview Service complexity**: Many conditional paths
  - **Mitigation**: Write tests first, update incrementally

- **Frontend layout shifts**: May break existing UI
  - **Mitigation**: Use feature flags, test on staging first

### Low Risk
- **AHV validation**: Well-defined algorithm
- **Document upload**: Reuses existing infrastructure
- **Pending documents**: New table, no conflicts

---

## Dependencies

### External
- ✅ AWS S3 (already configured)
- ✅ AWS Textract (already integrated)
- ✅ Anthropic/OpenAI APIs (already integrated)
- ❌ Date picker library (need to choose: react-datepicker, MUI DatePicker, etc.)

### Internal
- ✅ Document service
- ✅ Interview service
- ✅ Encryption service
- ✅ Postal code service
- ✅ Filing orchestration service

---

## Breaking Changes

### Database
- **None**: New table only, no modifications to existing tables

### API
- **Backward compatible**: New endpoints only, existing endpoints unchanged
- **Response format changes**:
  - Question responses include new fields (widget, explanation, document_type)
  - Clients should ignore unknown fields (forward compatible)

### Frontend
- **UI changes**: Users will see new document upload flow
- **Behavior changes**: Must upload documents to calculate taxes
- **Migration**: Existing in-progress interviews continue with old flow

---

## Success Metrics

### User Experience
- Interview completion time: Target < 15 minutes
- Document upload success rate: Target > 95%
- Fewer manual data entry errors
- Higher completion rate

### Technical
- AHV validation accuracy: 100% (algorithm-based)
- Document upload success: > 95%
- Pending documents tracking: 100%
- Calculation blocking: 100% (no calculations with pending docs)

### Business
- Better audit trail with document storage
- Reduced manual verification needed
- Compliance with data protection (encrypted sensitive fields)
- Support for complex scenarios (multiple cantons, multiple properties)

---

## Rollback Plan

### If Issues Arise

**Backend**:
```sql
-- Revert migration
ALTER TABLE swisstax.pending_documents ...
-- Or simply don't use new features
```

**Frontend**:
- Keep old interview flow as fallback
- Feature flag to switch between old/new
- Users can complete old-style if new fails

**Data**:
- No data loss: New features are additive
- Existing interviews remain functional
- Can complete without documents if needed

---

## Next Steps

1. **Review this plan** - Confirm approach
2. **Choose implementation strategy** - Incremental vs Sprint
3. **Start with Phase 1** - Backend updates
4. **Test incrementally** - Don't wait until end
5. **Get user feedback** - Test with real users early

---

## Questions for Clarification

1. **Date picker preference**: Which library? (react-datepicker, MUI, native HTML5?)
no pref
2. **Document upload limits**: 10MB per file OK? Max files per question?
100mb in total per submition. no limit per file 
3. **Multiple cantons**: How many max? (Currently allowing unlimited)
26 unlimited

4. **Pending documents**: Can user proceed to next question without uploading OR marking "bring later"?
yes
5. **AHV number storage**: Store formatted (with dots) or unformatted?
store formatter
6. **Migration timeline**: Need it done by specific date?



---

**Document Version**: 1.0
**Created**: 2024-10-14
**Status**: Ready for Review
