# SwissTax.ai Implementation Plan

## Executive Summary
SwissTax.ai is a tax filing assistant for Swiss residents that guides users through an interview-based questionnaire and collects necessary documents. The system will leverage the existing HomeAI infrastructure, particularly its document processing, AI response handling, and authentication systems.

## Product Overview

### Core Functionality
1. **Interview Process**: Step-by-step questionnaire covering civil status, income, deductions
2. **Document Collection**: Smart document checklist based on user profile
3. **Tax Calculation**: Automated calculation of Swiss taxes
4. **E-Filing**: Digital submission to tax authorities

### Key User Flow
1. User completes Q&A interview (Q01-Q14)
2. System generates profile snapshot
3. Tailored document checklist appears
4. User uploads required documents
5. System processes and validates documents
6. Tax calculation and review
7. E-signature and submission

---

## Reusable Components from Current Implementation

### Backend Components (BE Folder)

#### 1. Document Processing Infrastructure
- **File**: `BE/lambdas/document_processor_gpt.py`
- **Reusable**: GPT-based document extraction and processing logic
- **Modification**: Adapt for Swiss tax documents (Lohnausweis, 3a statements)

#### 2. AI Response Handler
- **File**: `BE/lambdas/ai_response_handler.py`
- **Reusable**: LLM integration for intelligent responses
- **Modification**: Train on Swiss tax law and questionnaire logic

#### 3. Lambda Functions Architecture
- **Files**: `BE/lambdas/lambda_function.py`, `BE/lambdas/response_processor_lambda.py`
- **Reusable**: Serverless processing pattern
- **Modification**: Create tax-specific Lambda functions

#### 4. Database Connection & ORM
- **File**: `BE/config.py`
- **Reusable**: PostgreSQL connection management
- **Modification**: Extend schema for tax data

#### 5. Authentication & User Management
- **Pattern**: Firebase Auth integration
- **Reusable**: Complete auth flow
- **No modification needed**

### Frontend Components (FE Folder)

#### 1. React Application Structure
- **Framework**: React 18.3.1 with Material-UI
- **Reusable**: Complete project setup, routing, state management
- **Modification**: None needed for base structure

#### 2. Form Components
- **Location**: `FE/src/components/`
- **Reusable**: Form validation (Formik), date pickers, input components
- **Modification**: Create tax-specific form fields

#### 3. Multi-language Support
- **Files**: `FE/src/i18n.js`, `FE/src/locales/`
- **Reusable**: i18next setup for DE/FR/EN
- **Modification**: Add tax-specific translations

#### 4. Document Upload
- **Pattern**: S3 integration for document storage
- **Reusable**: Upload components and progress tracking
- **Modification**: Add tax document validation

#### 5. State Management
- **Files**: `FE/src/store/`, Redux Toolkit
- **Reusable**: Complete Redux setup
- **Modification**: Add tax interview state slices

### AWS Infrastructure

#### 1. S3 Buckets
- **Existing**: `homeai-tenant-documents`
- **New**: Create `swisstax-user-documents` bucket

#### 2. Lambda Functions
- **Pattern**: Python 3.11 runtime
- **Reusable**: Deployment pipeline via SAM/CodePipeline

#### 3. RDS Database
- **Existing**: Aurora PostgreSQL
- **Strategy**: Create new schema `swisstax` in existing instance

#### 4. API Gateway
- **Reusable**: REST API pattern
- **New endpoints**: `/tax-interview`, `/document-checklist`, `/tax-calculation`

---

## Components to Modify and Adapt

### 1. Interview Engine (New with Modifications)
**Base on**: `BE/lambdas/ai_response_handler.py`
**Modifications**:
- Implement question branching logic (Q01 → Q01a-d for married)
- State machine for interview progress
- Profile object generation from answers

### 2. Document Mapping Engine (New)
**Base on**: `BE/lambdas/document_processor_gpt.py`
**Features**:
- Rule engine (R1-R9 from requirements)
- Dynamic checklist generation
- Document validation per type

### 3. Tax Calculation Module (New)
**Components**:
- Swiss federal tax tables
- Cantonal tax variations
- Deduction calculations
- Church tax logic

### 4. User Dashboard (Modified)
**Base on**: Existing dashboard components
**Modifications**:
- Interview progress tracker
- Document status grid
- Tax summary cards

---

## Completely New Components

### 1. Interview State Machine

#### Question Flow Logic
```python
question_flow = {
    "Q01": {
        "type": "single_choice",
        "next": lambda answer: "Q01a" if answer == "married" else "Q02"
    },
    "Q01a-d": {
        "type": "group",
        "questions": ["Q01a", "Q01b", "Q01c", "Q01d"],
        "next": "Q02"
    },
    "Q03": {
        "type": "yes_no",
        "next": lambda answer: "Q03a" if answer == "yes" else "Q04"
    },
    "Q03a": {
        "type": "number",
        "triggers_loop": "Q03b",
        "next": "Q04"
    }
}
```

#### State Management
```javascript
interviewState = {
    currentQuestion: "Q01",
    answers: {},
    progress: 0,
    completedSections: [],
    pendingBranches: [],
    documentRequirements: []
}
```

#### Answer Validation
```
- Text fields: Required, max length 255
- Numbers: Range validation (e.g., percentage 0-100)
- Dates: Format YYYY-MM-DD, logical checks
- Currency: CHF format, positive values
```

### 2. Tax Profile Generator
```
Features:
- Converts Q&A answers to structured profile
- Applies Swiss tax rules
- Generates document requirements
```

### 3. Document Validator

#### Document Processing Pipeline
```python
document_processors = {
    "lohnausweis": {
        "ocr_fields": ["employer", "gross_salary", "net_salary", "ahv_deduction"],
        "validation": validate_lohnausweis,
        "required_confidence": 0.85
    },
    "3a_statement": {
        "ocr_fields": ["contribution_amount", "account_number", "year"],
        "validation": validate_3a_contribution,
        "max_amount": 7056  # 2024 limit
    },
    "donation_receipt": {
        "ocr_fields": ["organization", "amount", "date"],
        "validation": validate_charity_registration,
        "min_amount": 100
    }
}
```

#### AWS Textract Integration
```python
# Leverage existing document_processor_gpt.py
# Add Swiss document templates
textract_config = {
    "FeatureTypes": ["FORMS", "TABLES"],
    "Language": "de",  # German default
    "DocumentTypes": ["LOHNAUSWEIS", "BANK_STATEMENT"]
}
```

### 4. E-Filing Integration
```
Features:
- eTax interface compatibility
- Digital signature integration
- Submission tracking
- Authority response handling
```

### 5. Tax Advisor Chat
```
Features:
- Context-aware assistance
- Swiss tax law knowledge base
- Multi-language support (DE/FR/IT/EN)
```

---

## Technical Architecture

### Backend Architecture
```
├── api/
│   ├── interview/          # Interview endpoints
│   ├── documents/          # Document handling
│   ├── calculation/        # Tax calculation
│   └── submission/         # E-filing
├── lambdas/
│   ├── interview_processor/
│   ├── document_validator/
│   ├── tax_calculator/
│   └── submission_handler/
├── models/
│   ├── user_profile.py
│   ├── tax_interview.py
│   ├── document.py
│   └── tax_submission.py
└── services/
    ├── ocr_service.py
    ├── tax_rules_engine.py
    └── efiling_service.py
```

### API Endpoint Specifications

#### Interview Endpoints
```
POST /api/interview/start
  Body: { userId, taxYear, language }
  Response: { interviewId, firstQuestion }

POST /api/interview/answer
  Body: { interviewId, questionId, answer }
  Response: { nextQuestion, progress, isComplete }

GET /api/interview/resume/{interviewId}
  Response: { currentQuestion, progress, answers }

POST /api/interview/complete
  Body: { interviewId }
  Response: { profile, documentRequirements }
```

#### Document Endpoints
```
POST /api/documents/upload
  Body: FormData with file
  Response: { documentId, processingStatus }

GET /api/documents/checklist/{interviewId}
  Response: { requiredDocuments[], uploadedDocuments[] }

POST /api/documents/validate/{documentId}
  Response: { isValid, extractedData, errors[] }

GET /api/documents/status/{interviewId}
  Response: { documents[], overallStatus }
```

#### Calculation Endpoints
```
POST /api/calculation/compute
  Body: { interviewId }
  Response: { federalTax, cantonalTax, municipalTax, total }

GET /api/calculation/details/{calculationId}
  Response: { breakdown, deductions, taxableIncome }

POST /api/calculation/simulate
  Body: { profile, modifications }
  Response: { comparison, suggestions }
```

### Frontend Architecture
```
├── src/
│   ├── features/
│   │   ├── interview/      # Q&A components
│   │   ├── documents/      # Upload & checklist
│   │   ├── calculation/    # Tax results
│   │   └── submission/     # E-sign & submit
│   ├── components/
│   │   ├── QuestionCard/
│   │   ├── DocumentUploader/
│   │   ├── ProgressTracker/
│   │   └── TaxSummary/
│   └── services/
│       ├── interviewAPI.ts
│       ├── documentAPI.ts
│       └── taxAPI.ts
```

### Database Schema
```sql
-- New tables for swisstax schema
CREATE SCHEMA swisstax;

CREATE TABLE swisstax.users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP
);

CREATE TABLE swisstax.interviews (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    tax_year INTEGER,
    status VARCHAR(50),
    answers JSONB,
    profile JSONB,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

CREATE TABLE swisstax.documents (
    id UUID PRIMARY KEY,
    interview_id UUID REFERENCES interviews(id),
    document_type VARCHAR(100),
    s3_key VARCHAR(500),
    extracted_data JSONB,
    validation_status VARCHAR(50),
    uploaded_at TIMESTAMP
);

CREATE TABLE swisstax.tax_calculations (
    id UUID PRIMARY KEY,
    interview_id UUID REFERENCES interviews(id),
    federal_tax DECIMAL(10,2),
    cantonal_tax DECIMAL(10,2),
    municipal_tax DECIMAL(10,2),
    church_tax DECIMAL(10,2),
    total_tax DECIMAL(10,2),
    calculation_details JSONB,
    calculated_at TIMESTAMP
);

CREATE TABLE swisstax.submissions (
    id UUID PRIMARY KEY,
    interview_id UUID REFERENCES interviews(id),
    submission_reference VARCHAR(255),
    status VARCHAR(50),
    submitted_at TIMESTAMP,
    response JSONB
);
```

---

## Incremental Implementation Parts

### Part 1: Foundation & Infrastructure Setup
**Duration**: 3 days | **Dependencies**: None

#### Deliverables:
1. Project structure creation
2. Database schema setup (swisstax schema)
3. Basic Lambda function templates
4. Development environment configuration
5. Git repository with CI/CD skeleton

#### Implementation:
```bash
swisstax-ai/
├── backend/
│   ├── lambdas/
│   ├── models/
│   ├── services/
│   └── requirements.txt
├── frontend/
│   ├── package.json (copy from FE/)
│   └── src/
├── infrastructure/
│   ├── cloudformation/
│   └── scripts/
└── tests/
```

#### Acceptance Criteria:
- [ ] Database connects successfully
- [ ] Basic Lambda deploys to AWS
- [ ] Frontend runs locally
- [ ] Git repo with main/dev branches

#### Testing:
```bash
# Test database connection
python -c "import psycopg2; conn = psycopg2.connect(host='aurora-postgresql-db', dbname='swisstax')"

# Test Lambda deployment
aws lambda invoke --function-name swisstax-health test-output.json
```

---

### Part 2: Interview Questions Data Model
**Duration**: 2 days | **Dependencies**: Part 1

#### Deliverables:
1. Questions JSON/YAML configuration
2. Question model classes
3. Answer validation functions
4. Branching logic engine

#### Implementation:
```python
# backend/models/questions.py
class Question:
    id: str
    text: Dict[str, str]  # {en, de, fr}
    type: QuestionType
    validation: ValidationRule
    next_logic: Callable

# backend/config/questions.yaml
questions:
  Q01:
    text:
      en: "What is your civil status on 31 Dec 20XX?"
      de: "Welchen Zivilstand hatten Sie am 31.12.20XX?"
    type: single_choice
    options: [single, married, divorced, widowed]
    branching:
      married: Q01a
      default: Q02
```

#### Acceptance Criteria:
- [ ] All 14 questions defined
- [ ] Branching logic works correctly
- [ ] Validation rules enforced
- [ ] Multi-language support

#### Testing:
```python
def test_question_flow():
    engine = QuestionEngine()
    next_q = engine.get_next_question('Q01', 'married')
    assert next_q == 'Q01a'
```

---

### Part 3: Interview State Machine (Backend)
**Duration**: 3 days | **Dependencies**: Part 2

#### Deliverables:
1. Interview session management
2. State persistence in database
3. Resume capability
4. Progress tracking

#### Implementation:
```python
# backend/services/interview_service.py
class InterviewService:
    def start_interview(user_id, tax_year)
    def save_answer(interview_id, question_id, answer)
    def get_next_question(interview_id)
    def calculate_progress(interview_id)
    def resume_interview(interview_id)
```

#### Acceptance Criteria:
- [ ] Interview state persists between sessions
- [ ] Progress calculation accurate
- [ ] Can resume from any point
- [ ] Handles branching correctly

#### Testing:
```python
def test_interview_persistence():
    interview_id = start_interview(user_id, 2024)
    save_answer(interview_id, 'Q01', 'married')
    # Simulate disconnect
    resumed = resume_interview(interview_id)
    assert resumed.current_question == 'Q01a'
```

---

### Part 4: Basic Interview API Endpoints
**Duration**: 2 days | **Dependencies**: Part 3

#### Deliverables:
1. REST API for interview operations
2. Lambda function handlers
3. API Gateway configuration
4. Error handling

#### Implementation:
```python
# backend/lambdas/interview_handler.py
def handle_start_interview(event, context)
def handle_submit_answer(event, context)
def handle_get_progress(event, context)
```

#### Acceptance Criteria:
- [ ] All endpoints return correct status codes
- [ ] Proper error messages
- [ ] JWT authentication works
- [ ] CORS configured

#### Testing:
```bash
# Test API endpoints
curl -X POST https://api.swisstax.ai/interview/start \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"taxYear": 2024}'
```

---

### Part 5: Simple Interview UI (Frontend)
**Duration**: 3 days | **Dependencies**: Part 4

#### Deliverables:
1. Question display component
2. Answer input components (text, select, date)
3. Navigation (next/previous)
4. Progress bar

#### Implementation:
```jsx
// frontend/src/features/interview/QuestionCard.jsx
const QuestionCard = ({ question, onAnswer }) => {
  return (
    <Card>
      <Typography>{question.text}</Typography>
      <AnswerInput type={question.type} onSubmit={onAnswer} />
    </Card>
  )
}
```

#### Acceptance Criteria:
- [ ] Questions display correctly
- [ ] All input types work
- [ ] Navigation functional
- [ ] Progress updates real-time

#### Testing:
```javascript
describe('Interview Flow', () => {
  it('displays question and accepts answer', () => {
    render(<QuestionCard question={mockQ01} />)
    fireEvent.click(screen.getByText('Married'))
    expect(onAnswer).toHaveBeenCalledWith('married')
  })
})
```

---

### Part 6: Profile Generation from Answers
**Duration**: 2 days | **Dependencies**: Part 5

#### Deliverables:
1. Profile generator service
2. Profile data model
3. Summary view component
4. Profile validation

#### Implementation:
```python
# backend/services/profile_service.py
def generate_profile(answers: Dict) -> TaxProfile:
    return TaxProfile(
        civil_status=answers['Q01'],
        dependents=extract_children(answers),
        income_sources=extract_employers(answers),
        deductions=calculate_deductions(answers)
    )
```

#### Acceptance Criteria:
- [ ] Profile accurately reflects answers
- [ ] All deductions calculated
- [ ] Summary view readable
- [ ] Can edit profile if needed

---

### Part 7: Document Requirements Engine
**Duration**: 2 days | **Dependencies**: Part 6

#### Deliverables:
1. Document rules engine (R1-R9)
2. Checklist generator
3. Document type definitions
4. Requirements API endpoint

#### Implementation:
```python
# backend/services/document_rules.py
RULES = {
    'R1': lambda p: ['lohnausweis'] * len(p.employers) if p.employers else [],
    'R2': lambda p: ['unemployment_statement'] if 'unemployment' in p.other_income else [],
    # ... R3-R9
}

def get_required_documents(profile):
    required = []
    for rule_id, rule_func in RULES.items():
        required.extend(rule_func(profile))
    return required
```

#### Acceptance Criteria:
- [ ] All rules (R1-R9) implemented
- [ ] Correct documents requested
- [ ] No duplicate requirements
- [ ] Clear document descriptions

---

### Part 8: Document Upload Interface
**Duration**: 3 days | **Dependencies**: Part 7

#### Deliverables:
1. Upload component with drag-drop
2. S3 integration
3. Upload progress tracking
4. Document list view

#### Implementation:
```jsx
// frontend/src/features/documents/DocumentUploader.jsx
const DocumentUploader = ({ documentType, onUpload }) => {
  const { getRootProps, getInputProps } = useDropzone({
    onDrop: files => uploadToS3(files, documentType)
  })
  // ...
}
```

#### Acceptance Criteria:
- [ ] Files upload to S3
- [ ] Progress bar accurate
- [ ] Error handling for failed uploads
- [ ] File type validation

---

### Part 9: OCR Integration for Documents
**Duration**: 4 days | **Dependencies**: Part 8

#### Deliverables:
1. Textract integration
2. Document processors for each type
3. Data extraction pipelines
4. Validation logic

#### Implementation:
```python
# backend/services/ocr_service.py
class LohnausweisProcessor:
    def extract(self, s3_key):
        textract_response = textract.analyze_document(s3_key)
        return {
            'employer': extract_employer(textract_response),
            'gross_salary': extract_salary(textract_response),
            'deductions': extract_deductions(textract_response)
        }
```

#### Acceptance Criteria:
- [ ] Lohnausweis extraction >85% accurate
- [ ] 3a statements processed correctly
- [ ] Validation catches errors
- [ ] Manual override possible

---

### Part 10: Basic Tax Calculation
**Duration**: 3 days | **Dependencies**: Part 9

#### Deliverables:
1. Federal tax tables
2. Basic calculation engine
3. Deduction processing
4. Results model

#### Implementation:
```python
# backend/services/tax_calculator.py
class TaxCalculator:
    def calculate_federal_tax(self, taxable_income, status):
        # Use Swiss federal tax tables
        return self.federal_tables.lookup(taxable_income, status)

    def apply_deductions(self, gross_income, deductions):
        return gross_income - sum(deductions.values())
```

#### Acceptance Criteria:
- [ ] Calculations match official tables
- [ ] Deductions applied correctly
- [ ] Results breakdown clear
- [ ] Edge cases handled

---

### Part 11: Tax Results Display
**Duration**: 2 days | **Dependencies**: Part 10

#### Deliverables:
1. Results summary component
2. Breakdown visualization
3. PDF generation
4. Comparison view

#### Implementation:
```jsx
// frontend/src/features/calculation/TaxSummary.jsx
const TaxSummary = ({ calculation }) => (
  <Grid container>
    <TaxBreakdownChart data={calculation} />
    <DeductionsList deductions={calculation.deductions} />
    <TotalTaxAmount amount={calculation.total} />
  </Grid>
)
```

#### Acceptance Criteria:
- [ ] Clear visualization
- [ ] PDF exports correctly
- [ ] Mobile responsive
- [ ] Print-friendly

---

### Part 12: Cantonal Tax Support
**Duration**: 4 days | **Dependencies**: Part 11

#### Deliverables:
1. Cantonal tax tables (5 cantons initially)
2. Canton selection in profile
3. Municipal tax calculation
4. Church tax logic

#### Implementation:
```python
# backend/services/cantonal_calculator.py
CANTONAL_RATES = {
    'ZH': ZurichTaxTable(),
    'BE': BernTaxTable(),
    # ...
}

def calculate_cantonal_tax(canton, taxable_income, municipality):
    base_tax = CANTONAL_RATES[canton].calculate(taxable_income)
    municipal_multiplier = get_municipal_rate(canton, municipality)
    return base_tax * municipal_multiplier
```

#### Acceptance Criteria:
- [ ] 5 cantons fully supported
- [ ] Municipal rates accurate
- [ ] Church tax optional
- [ ] Canton comparison tool

---

### Part 13: End-to-End Testing & Polish
**Duration**: 3 days | **Dependencies**: Part 12

#### Deliverables:
1. Complete E2E test suite
2. Performance optimization
3. UI/UX improvements
4. Bug fixes

#### Acceptance Criteria:
- [ ] All E2E tests pass
- [ ] <2s response times
- [ ] No critical bugs
- [ ] Smooth user experience

---

### Part 14: Security & Compliance
**Duration**: 2 days | **Dependencies**: Part 13

#### Deliverables:
1. Security audit
2. Data encryption
3. GDPR compliance
4. Audit logging

#### Acceptance Criteria:
- [ ] Passes security scan
- [ ] Data encrypted at rest
- [ ] Audit trail complete
- [ ] Privacy policy implemented

---

### Part 15: Production Deployment
**Duration**: 2 days | **Dependencies**: Part 14

#### Deliverables:
1. Production environment setup
2. Monitoring dashboards
3. Backup procedures
4. Documentation

#### Acceptance Criteria:
- [ ] Deploys without errors
- [ ] Monitoring active
- [ ] Backups tested
- [ ] Runbooks complete

## Testing Strategy

### Unit Testing
```javascript
// Frontend - Jest + React Testing Library
describe('InterviewFlow', () => {
  test('Q01 married branching', () => {
    const { getNextQuestion } = useInterviewFlow();
    expect(getNextQuestion('Q01', 'married')).toBe('Q01a');
    expect(getNextQuestion('Q01', 'single')).toBe('Q02');
  });
});
```

### Integration Testing
```python
# Backend - Pytest
def test_document_processing_pipeline():
    # Upload document
    response = upload_document(lohnausweis_file)
    assert response.status_code == 200

    # Check OCR extraction
    extracted = get_extracted_data(response.document_id)
    assert extracted['gross_salary'] > 0

    # Validate against profile
    validation = validate_document(response.document_id)
    assert validation['is_valid'] == True
```

### E2E Testing
```javascript
// Cypress
describe('Complete Tax Filing Flow', () => {
  it('completes interview and uploads documents', () => {
    cy.visit('/interview');
    cy.answerQuestion('Q01', 'married');
    cy.answerQuestion('Q01a', 'John');
    // ... complete interview
    cy.get('[data-testid="profile-summary"]').should('be.visible');
    cy.uploadDocument('lohnausweis.pdf');
    cy.get('[data-testid="calculation-result"]').should('contain', 'CHF');
  });
});
```

### Performance Testing
```yaml
# K6 Load Testing
scenarios:
  interview_load:
    executor: 'ramping-vus'
    stages:
      - duration: '2m', target: 100
      - duration: '5m', target: 100
      - duration: '2m', target: 0
  document_upload:
    executor: 'constant-arrival-rate'
    rate: 10
    timeUnit: '1s'
    duration: '5m'
```

---

## Key Differentiators from Existing Codebase

### 1. Interview-First Approach
Unlike the property-focused HomeAI, SwissTax.ai uses a guided interview before any document collection.

### 2. Deterministic Document Requirements
Document requests are rule-based (R1-R9) rather than property-specific.

### 3. Calculation Engine
New component for Swiss tax calculations with federal/cantonal rules.

### 4. Compliance Focus
Built-in validation for Swiss tax law compliance and eTax compatibility.

### 5. Multi-Canton Support
Handles tax variations across Swiss cantons.

---

## Security Considerations

### Data Protection
- End-to-end encryption for sensitive tax data
- GDPR/Swiss data protection compliance
- Secure document storage with encryption at rest

### Authentication
- Reuse Firebase Auth with 2FA requirement
- Session management for interview continuity
- Role-based access for tax advisors (future)

### Audit Trail
- Complete logging of all user actions
- Document upload tracking
- Calculation history

---

## Deployment Strategy

### Infrastructure as Code
- AWS CDK for infrastructure
- Separate environments: dev, staging, prod
- Blue-green deployment for zero downtime

### CI/CD Pipeline
- GitHub Actions for testing
- AWS CodePipeline for deployment
- Automated testing at each stage

### Monitoring
- CloudWatch for logs and metrics
- Custom dashboards for business metrics
- Alerting for critical errors

---

## Cost Optimization

### Reused Infrastructure
- Shared RDS instance (new schema only)
- Existing Lambda architecture
- Common authentication system
- Shared monitoring/logging

### New Costs
- Additional S3 storage for tax documents
- Increased Lambda executions
- OCR API usage (Textract)
- Domain and SSL certificate

### Estimated Monthly Costs
- Lambda: $50-100
- S3: $20-40
- RDS (additional load): $30-50
- API Gateway: $10-20
- Total: ~$150-250/month for MVP

---

## Risk Mitigation

### Technical Risks
- **OCR accuracy**: Implement manual override options
- **Tax law changes**: Modular rule engine for easy updates
- **Scale**: Serverless architecture handles spikes

### Compliance Risks
- **Data privacy**: Regular security audits
- **Tax accuracy**: Partner with tax professionals for validation
- **Legal requirements**: Consult with Swiss tax authorities

### Business Risks
- **User adoption**: Simple UX and clear value proposition
- **Competition**: Focus on interview experience and accuracy

---

## Success Metrics

### Technical KPIs
- Interview completion rate > 80%
- Document processing accuracy > 95%
- System uptime > 99.9%
- Response time < 2 seconds

### Business KPIs
- User acquisition cost < CHF 50
- Customer lifetime value > CHF 500
- Monthly active users growth > 20%
- NPS score > 50

---

## Implementation Milestones & Checkpoints

### Milestone 1: Interview Core (Parts 1-5)
**Target**: Week 2 | **Deliverable**: Working interview flow
- Checkpoint: Can complete full interview Q01-Q14
- Checkpoint: State persists across sessions
- Checkpoint: Multi-language support working
- Demo: Complete interview flow walkthrough

### Milestone 2: Profile & Documents (Parts 6-8)
**Target**: Week 4 | **Deliverable**: Profile generation with document checklist
- Checkpoint: Profile accurately reflects all answers
- Checkpoint: Document requirements match rules R1-R9
- Checkpoint: Files upload successfully to S3
- Demo: End-to-end from interview to document upload

### Milestone 3: Document Processing (Part 9)
**Target**: Week 5 | **Deliverable**: OCR extraction working
- Checkpoint: Lohnausweis data extraction >85% accurate
- Checkpoint: Validation catches invalid documents
- Demo: Upload document and see extracted data

### Milestone 4: Tax Calculation (Parts 10-12)
**Target**: Week 7 | **Deliverable**: Complete tax calculation
- Checkpoint: Federal tax matches official calculator
- Checkpoint: 5 cantons fully supported
- Checkpoint: Results PDF generation working
- Demo: Full tax calculation with breakdown

### Milestone 5: Production Ready (Parts 13-15)
**Target**: Week 9 | **Deliverable**: Deployed MVP
- Checkpoint: All tests passing
- Checkpoint: Security audit complete
- Checkpoint: Production deployment successful
- Demo: Live system with real users

## Development Workflow

### For Each Part:
1. **Start**: Create feature branch from dev
2. **Implement**: Follow acceptance criteria
3. **Test**: Run unit tests locally
4. **Review**: Code review + merge to dev
5. **Deploy**: Auto-deploy to staging
6. **Validate**: Acceptance testing
7. **Document**: Update API docs/README

### Daily Routine:
```bash
# Morning
git pull origin dev
npm test / pytest

# During development
git commit -m "feat: implement [Part X] - specific feature"

# Before EOD
git push origin feature/part-X
# Create PR for review
```

## Next Steps

1. **Day 1-3 (Part 1)**:
   - Set up project structure
   - Configure AWS resources
   - Create database schema
   - Initialize repositories

2. **Day 4-5 (Part 2)**:
   - Define all questions in YAML
   - Implement question models
   - Build branching logic

3. **Day 6-8 (Part 3)**:
   - Create interview service
   - Implement state persistence
   - Build resume capability

4. **First Demo (End of Week 2)**:
   - Show working interview flow
   - Demonstrate state persistence
   - Get stakeholder feedback

---

## Environment Variables & Configuration

### Required Environment Variables
```bash
# AWS
AWS_REGION=eu-central-1  # Swiss region for compliance
AWS_S3_BUCKET=swisstax-user-documents
AWS_TEXTRACT_ENDPOINT=https://textract.eu-central-1.amazonaws.com

# Database
DB_HOST=aurora-postgresql-db-webscraping
DB_SCHEMA=swisstax
DB_PORT=5432

# Firebase (reused)
FIREBASE_API_KEY=existing_key
FIREBASE_AUTH_DOMAIN=existing_domain
FIREBASE_PROJECT_ID=existing_project

# Tax API
ETAX_API_ENDPOINT=https://api.estv.admin.ch/v1
ETAX_API_KEY=to_be_obtained

# Feature Flags
ENABLE_OCR=true
ENABLE_EFILING=false  # Phase 2
SUPPORTED_CANTONS=ZH,BE,LU,UR,SZ  # Start with 5 cantons
```

## Monitoring & Observability

### Key Metrics to Track
```yaml
business_metrics:
  - interview_completion_rate
  - document_upload_success_rate
  - average_time_to_complete
  - calculation_accuracy

technical_metrics:
  - lambda_cold_starts
  - api_response_times
  - ocr_processing_duration
  - database_query_performance

error_tracking:
  - document_validation_failures
  - calculation_errors
  - api_timeout_rates
  - user_session_drops
```

### CloudWatch Dashboards
```json
{
  "InterviewFlow": {
    "widgets": [
      "QuestionResponseTimes",
      "BranchingAccuracy",
      "SessionDuration",
      "CompletionFunnel"
    ]
  },
  "DocumentProcessing": {
    "widgets": [
      "UploadVolume",
      "OCRAccuracy",
      "ValidationRate",
      "ProcessingQueue"
    ]
  }
}
```

## Conclusion

SwissTax.ai can be efficiently built by leveraging 60-70% of the existing HomeAI infrastructure while adding tax-specific components. The modular architecture allows for incremental development and easy maintenance. The interview-first approach differentiates it from competitors while the reuse of proven components reduces development time and risk.

### Updated Estimates
**Estimated Time to MVP**: 12 weeks
**Team Size**: 2 Backend, 2 Frontend, 1 DevOps
**Estimated Development Cost**: CHF 50,000-75,000
**Estimated Running Cost**: CHF 150-250/month (Year 1)
**Break-even**: ~500 paying users at CHF 29/filing