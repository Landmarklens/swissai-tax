# Implementation Plan: Multiple Tax Filings with Insights & Multilingual Support

## Document Version
- **Version**: 1.0
- **Date**: 2025-10-06
- **Project**: SwissAI Tax
- **Based on**: HomeAI Multiple Property Searches Architecture

---

## Table of Contents
1. [Overview](#overview)
2. [Architecture Analysis](#architecture-analysis)
3. [Database Schema](#database-schema)
4. [Backend Implementation](#backend-implementation)
5. [Frontend Implementation](#frontend-implementation)
6. [Multilingual Support](#multilingual-support)
7. [Implementation Timeline](#implementation-timeline)
8. [Testing Strategy](#testing-strategy)

---

## 1. Overview

### 1.1 Goal
Transform SwissAI Tax to support multiple tax filing sessions per user, with real-time insights generation during the interview process, similar to HomeAI's multiple property searches.

### 1.2 Key Features
- Multiple tax filing sessions per user
- Real-time insight generation during interview
- Dynamic tax calculations
- Session management (create, archive, duplicate, delete)
- Multilingual support (EN, DE, FR, IT)
- Profile data persistence
- Progress tracking

### 1.3 Success Criteria
✅ User can create multiple tax filing sessions
✅ Insights are generated in real-time during interview
✅ Insights are displayed in user's selected language
✅ Tax calculations update dynamically
✅ User can switch between different filing sessions
✅ Session progress is saved and restorable
✅ All data is stored in user profile
✅ UI matches HomeAI quality and patterns

---

## 2. Architecture Analysis

### 2.1 HomeAI Pattern (Reference)

**Data Structure:**
```
User
  ├── ConversationProfile (search session)
  │   ├── Insights (extracted preferences)
  │   ├── Messages (conversation history)
  │   └── Recommendations (property matches)
  └── Multiple profiles per user
```

**Key Concepts:**
- One profile = one search session
- Profiles are persistent in database
- Insights generated during conversation
- Progress tracked per profile
- Sidebar shows all past searches

### 2.2 SwissAI Tax Adaptation

**Data Structure:**
```
User
  ├── TaxFilingSession (filing attempt)
  │   ├── TaxInsights (extracted tax info)
  │   ├── TaxAnswers (question responses)
  │   └── TaxCalculation (tax estimates)
  └── Multiple sessions per user
```

**Mapping:**
| HomeAI | SwissAI Tax |
|--------|-------------|
| ConversationProfile | TaxFilingSession |
| Insight | TaxInsight |
| Message | TaxAnswer |
| Recommendation | TaxCalculation |

---

## 3. Database Schema

### 3.1 TaxFilingSession Model

**Table:** `tax_filing_sessions`

**Fields:**
```python
# Core
id (UUID, PK)
user_id (UUID, FK -> users.id)
name (String(255))  # "2024 Tax Return - Main"
tax_year (Integer)

# Profile & State
profile (JSON)  # Complete tax profile data
summarized_description (Text)  # AI summary
status (ENUM: draft, in_progress, completed, submitted, archived)

# Progress
completion_percentage (Integer, 0-100)
current_question_id (String(50))
completed_questions (JSON Array)

# UI Enhancement
is_pinned (Boolean)
is_archived (Boolean)
last_activity (DateTime)
question_count (Integer)

# Metadata
language (String(2))  # en, de, fr, it
canton (String(2))  # ZH, BE, etc.

# Timestamps
created_at (DateTime)
updated_at (DateTime)

# Relationships
user -> User
insights -> List[TaxInsight]
answers -> List[TaxAnswer]
calculations -> List[TaxCalculation]
```

### 3.2 TaxInsight Model

**Table:** `tax_insights`

**Fields:**
```python
id (UUID, PK)
filing_session_id (UUID, FK -> tax_filing_sessions.id)

# Content
category (String(50))  # income, deductions, family_status, property
key (String(100))  # employment_income, rental_property
value (JSON)  # Actual data
display_text (Text)  # Human-readable in user's language

# Classification
priority (ENUM: MUST, IMPORTANT, NICE_TO_HAVE)
origin (ENUM: USER, AI)
confidence (Float)

# Context
question_id (String(50))
step (String(100))  # Personal Info, Income, Deductions

# Timestamp
created_at (DateTime)

# Relationships
filing_session -> TaxFilingSession
```

### 3.3 TaxAnswer Model

**Table:** `tax_answers`

**Fields:**
```python
id (UUID, PK)
filing_session_id (UUID, FK -> tax_filing_sessions.id)
question_id (String(50))
answer_value (JSON)
answered_at (DateTime)

# Relationships
filing_session -> TaxFilingSession
```

### 3.4 TaxCalculation Model

**Table:** `tax_calculations`

**Fields:**
```python
id (UUID, PK)
filing_session_id (UUID, FK -> tax_filing_sessions.id)

# Results
estimated_tax (Numeric(10, 2))
federal_tax (Numeric(10, 2))
cantonal_tax (Numeric(10, 2))
municipal_tax (Numeric(10, 2))
church_tax (Numeric(10, 2))

# Breakdown
calculation_breakdown (JSON)
deductions_applied (JSON)

# Metadata
calculated_at (DateTime)
calculation_version (String(20))

# Relationships
filing_session -> TaxFilingSession
```

### 3.5 Database Indexes

```sql
-- Performance indexes
CREATE INDEX idx_tax_filing_sessions_user_id ON tax_filing_sessions(user_id);
CREATE INDEX idx_tax_filing_sessions_last_activity ON tax_filing_sessions(last_activity DESC);
CREATE INDEX idx_tax_insights_filing_session_id ON tax_insights(filing_session_id);
CREATE INDEX idx_tax_insights_category ON tax_insights(category);
CREATE INDEX idx_tax_answers_filing_session_id ON tax_answers(filing_session_id);
CREATE INDEX idx_tax_calculations_filing_session_id ON tax_calculations(filing_session_id);
```

---

## 4. Backend Implementation

### 4.1 Phase 1: Database Models

**Files to Create:**
1. `backend/models/tax_filing_session.py`
2. `backend/models/tax_insight.py`
3. `backend/models/tax_answer.py`
4. `backend/models/tax_calculation.py`

**Files to Update:**
1. `backend/models/user.py` - Add relationship

**Migration:**
1. Create: `backend/alembic/versions/XXXXXX_add_tax_filing_sessions.py`

### 4.2 Phase 2: Services

**Files to Create:**
1. `backend/services/tax_filing_service.py`
   - `create_filing_session()`
   - `list_filing_sessions()`
   - `get_filing_session()`
   - `submit_answer()`
   - `generate_insights()`
   - `update_tax_calculation()`
   - `archive_session()`
   - `duplicate_session()`

2. `backend/services/insight_service.py`
   - `create_insight()`
   - `get_insights_for_session()`
   - `format_insight_text()`
   - `update_insight()`
   - `delete_insight()`

3. `backend/services/calculation_service.py`
   - `calculate_taxes()`
   - `get_canton_rates()`
   - `apply_deductions()`
   - `generate_breakdown()`

### 4.3 Phase 3: API Endpoints

**File to Update:**
1. `backend/routers/tax_filing.py` (rename from interview.py)

**New Endpoints:**
```python
# Session Management
POST   /api/tax-filing/sessions              # Create new
GET    /api/tax-filing/sessions              # List all
GET    /api/tax-filing/sessions/{id}         # Get specific
PUT    /api/tax-filing/sessions/{id}         # Update
DELETE /api/tax-filing/sessions/{id}         # Delete
POST   /api/tax-filing/sessions/{id}/archive # Archive
POST   /api/tax-filing/sessions/{id}/duplicate # Duplicate

# Interview
POST   /api/tax-filing/sessions/{id}/answer  # Submit answer
GET    /api/tax-filing/sessions/{id}/question # Current question
POST   /api/tax-filing/sessions/{id}/save    # Save draft

# Insights
GET    /api/tax-filing/sessions/{id}/insights # Get insights
PUT    /api/tax-filing/insights/{id}          # Update
DELETE /api/tax-filing/insights/{id}          # Delete

# Calculations
GET    /api/tax-filing/sessions/{id}/calculation # Get calc
POST   /api/tax-filing/sessions/{id}/recalculate # Recalc

# Completion
POST   /api/tax-filing/sessions/{id}/complete # Mark complete
POST   /api/tax-filing/sessions/{id}/submit   # Submit
```

### 4.4 Insight Generation Rules

**Question → Insight Mapping:**

```python
INSIGHT_RULES = {
    'Q01': {  # Civil status
        'category': 'family_status',
        'insights': {
            'married': {
                'key': 'joint_taxation',
                'priority': 'MUST',
                'text_key': 'insight.married_joint_taxation'
            },
            'single': {
                'key': 'single_taxation',
                'priority': 'IMPORTANT',
                'text_key': 'insight.single_taxation'
            }
        }
    },
    'Q02': {  # Canton
        'category': 'location',
        'insights': {
            'dynamic': lambda answer: {
                'key': f'canton_{answer}',
                'priority': 'MUST',
                'text_key': 'insight.canton_tax_rate',
                'params': {'canton': answer, 'rate': get_canton_rate(answer)}
            }
        }
    },
    'Q04': {  # Number of employers
        'category': 'income',
        'insights': {
            'multiple': lambda answer: {
                'key': 'multiple_employers',
                'priority': 'IMPORTANT',
                'text_key': 'insight.multiple_income_sources',
                'params': {'count': answer}
            } if int(answer) > 1 else None
        }
    },
    'Q08': {  # Pillar 3a
        'category': 'deductions',
        'insights': {
            'yes': {
                'key': 'pillar_3a_deduction',
                'priority': 'IMPORTANT',
                'text_key': 'insight.pension_deduction_available'
            }
        }
    },
    'Q09': {  # Property ownership
        'category': 'property',
        'insights': {
            'yes': {
                'key': 'property_owner',
                'priority': 'MUST',
                'text_key': 'insight.property_deductions'
            }
        }
    }
}
```

---

## 5. Frontend Implementation

### 5.1 Phase 1: State Management

**File to Create:**
1. `src/store/slices/taxFilingSlice.js`

**State Structure:**
```javascript
{
  filingSessions: [],
  activeSession: {
    id: null,
    name: '',
    taxYear: null,
    status: '',
    completionPercentage: 0,
    currentQuestion: null,
    answers: {},
    insights: [],
    calculation: null,
    profile: {},
    language: 'en'
  },
  loading: false,
  saving: false,
  error: null
}
```

**Actions:**
- Session: create, list, get, update, delete, archive, duplicate
- Answer: submit, update
- Insight: add, update, delete
- Calculation: update, recalculate

**Async Thunks:**
- `getFilingSessions()`
- `createFilingSession({ taxYear, language })`
- `submitAnswerAsync({ sessionId, questionId, answer })`
- `duplicateSession({ sessionId, newTaxYear })`

### 5.2 Phase 2: UI Components

**Files to Create:**

1. `src/components/TaxFilingList/TaxFilingList.jsx`
   - Lists all filing sessions
   - Grouped by status (pinned, recent, archived)
   - Cards showing progress and metadata

2. `src/components/TaxFilingCard/TaxFilingCard.jsx`
   - Individual filing session card
   - Shows: name, year, progress, status, actions
   - Actions: continue, duplicate, archive, delete

3. `src/components/TaxInsights/TaxInsights.jsx`
   - Sidebar showing insights
   - Grouped by category (income, deductions, etc.)
   - Tax calculation summary
   - Expandable sections

4. `src/components/TaxInsights/InsightCard.jsx`
   - Individual insight display
   - Priority indicator
   - Edit/delete actions

5. `src/components/TaxCalculationBreakdown/TaxCalculationBreakdown.jsx`
   - Modal showing detailed tax breakdown
   - Federal, cantonal, municipal breakdown
   - Deductions applied
   - Charts/visualizations

**Files to Update:**

1. `src/pages/Dashboard/Dashboard.jsx`
   - Add "My Tax Filings" section
   - Show TaxFilingList component

2. `src/pages/TaxFiling/InterviewPage.js`
   - Add TaxInsights to right sidebar
   - Update to use session-based state
   - Handle session switching

3. `src/pages/Profile/Profile.jsx`
   - Add tax filing history section
   - Show aggregated stats

### 5.3 Phase 3: Navigation & Routing

**Update:** `src/routes/AppRoutes.js`

```javascript
// Add routes
/tax-filing/sessions              // List all sessions
/tax-filing/sessions/new          // Create new session
/tax-filing/sessions/:id          // Session details
/tax-filing/sessions/:id/interview // Interview page
/tax-filing/sessions/:id/review   // Review completed filing
/tax-filing/archived              // Archived sessions
```

---

## 6. Multilingual Support

### 6.1 Translation Keys

**Add to:** `src/locales/{en,de,fr,it}/translation.json`

```json
{
  "taxFiling": {
    "title": "My Tax Filings",
    "startNew": "Start New Tax Filing",
    "continue": "Continue",
    "duplicate": "Duplicate",
    "archive": "Archive",
    "delete": "Delete",
    "unarchive": "Unarchive",
    "rename": "Rename",

    "status": {
      "draft": "Draft",
      "in_progress": "In Progress",
      "completed": "Completed",
      "submitted": "Submitted",
      "archived": "Archived"
    },

    "sections": {
      "pinned": "Pinned",
      "recent": "Recent Tax Filings",
      "archived": "Archived Filings"
    },

    "insights": {
      "title": "Your Tax Profile",
      "empty": "Answer questions to see your tax insights here",
      "estimatedTax": "Estimated Tax",
      "viewBreakdown": "View Breakdown",

      "categories": {
        "family_status": "Family Status",
        "location": "Location & Canton",
        "income": "Income Sources",
        "deductions": "Deductions",
        "property": "Property & Assets",
        "other": "Other Information"
      },

      "priorities": {
        "MUST": "Required",
        "IMPORTANT": "Important",
        "NICE_TO_HAVE": "Optional"
      }
    },

    "calculation": {
      "title": "Tax Calculation Breakdown",
      "federal": "Federal Tax",
      "cantonal": "Cantonal Tax",
      "municipal": "Municipal Tax",
      "church": "Church Tax",
      "total": "Total Tax",
      "deductions": "Deductions Applied",
      "grossIncome": "Gross Income",
      "taxableIncome": "Taxable Income"
    },

    "messages": {
      "sessionCreated": "New tax filing session created",
      "sessionDeleted": "Tax filing session deleted",
      "sessionArchived": "Tax filing session archived",
      "sessionDuplicated": "Tax filing session duplicated",
      "confirmDelete": "Are you sure you want to delete this tax filing?",
      "confirmArchive": "Archive this tax filing?"
    }
  },

  "insight": {
    "married_joint_taxation": "Married - joint taxation available, may reduce overall tax burden",
    "single_taxation": "Single - individual taxation applies",
    "canton_tax_rate": "Canton {{canton}}: {{rate}}% tax rate",
    "multiple_income_sources": "{{count}} employers - ensure all income is declared",
    "pension_deduction_available": "Pillar 3a contributions - up to CHF 7,056 deductible (2024)",
    "property_deductions": "Property owner - mortgage interest and maintenance costs deductible",
    "rental_income": "Rental income - must be declared, associated costs deductible",
    "children_tax_benefits": "{{count}} children - eligible for child deductions (CHF 6,700 per child)",
    "unemployment_benefits": "Unemployment benefits received - taxable as income",
    "charitable_donations": "Charitable donations - deductible up to 20% of net income"
  }
}
```

### 6.2 Backend Translation Support

**Create:** `backend/utils/translations.py`

```python
INSIGHT_TRANSLATIONS = {
    'en': {
        'insight.married_joint_taxation': 'Married - joint taxation available...',
        'insight.canton_tax_rate': 'Canton {canton}: {rate}% tax rate',
        # ... all insights
    },
    'de': {
        'insight.married_joint_taxation': 'Verheiratet - gemeinsame Besteuerung möglich...',
        'insight.canton_tax_rate': 'Kanton {canton}: {rate}% Steuersatz',
        # ... all insights
    },
    'fr': {
        'insight.married_joint_taxation': 'Marié(e) - imposition commune disponible...',
        'insight.canton_tax_rate': 'Canton {canton}: taux d\'imposition {rate}%',
        # ... all insights
    },
    'it': {
        'insight.married_joint_taxation': 'Sposato/a - tassazione congiunta disponibile...',
        'insight.canton_tax_rate': 'Cantone {canton}: aliquota fiscale {rate}%',
        # ... all insights
    }
}

def get_translated_insight(key: str, language: str, params: dict = None) -> str:
    """Get translated insight text"""
    template = INSIGHT_TRANSLATIONS.get(language, INSIGHT_TRANSLATIONS['en']).get(key)
    if params:
        return template.format(**params)
    return template
```

---

## 7. Implementation Timeline

### Week 1: Database & Core Backend

**Days 1-2: Database Models**
- [ ] Create TaxFilingSession model
- [ ] Create TaxInsight model
- [ ] Create TaxAnswer model
- [ ] Create TaxCalculation model
- [ ] Update User model with relationships
- [ ] Write Alembic migration
- [ ] Run migration on dev database
- [ ] Test model relationships

**Days 3-5: Backend Services**
- [ ] Create TaxFilingService
  - [ ] create_filing_session()
  - [ ] list_filing_sessions()
  - [ ] get_filing_session()
  - [ ] archive_session()
  - [ ] duplicate_session()
- [ ] Create InsightService
  - [ ] create_insight()
  - [ ] get_insights_for_session()
  - [ ] format_insight_text()
- [ ] Create CalculationService (basic)
  - [ ] calculate_taxes()
  - [ ] generate_breakdown()
- [ ] Write unit tests

### Week 2: Backend APIs & Insight Generation

**Days 1-3: API Endpoints**
- [ ] Update router structure
- [ ] Implement session management endpoints
- [ ] Implement insight endpoints
- [ ] Implement calculation endpoints
- [ ] Test all endpoints with Postman/Swagger

**Days 4-5: Insight Generation Logic**
- [ ] Define insight rules for each question
- [ ] Implement insight extraction logic
- [ ] Add multilingual insight formatting
- [ ] Test insight generation for all question types

### Week 3: Frontend State Management

**Days 1-2: Redux Slice**
- [ ] Create taxFilingSlice
- [ ] Define initial state
- [ ] Implement reducers
- [ ] Create async thunks
- [ ] Test state updates

**Days 3-5: API Integration**
- [ ] Connect slice to API endpoints
- [ ] Handle loading states
- [ ] Handle error states
- [ ] Add optimistic updates
- [ ] Test end-to-end data flow

### Week 4: UI Components - Core

**Days 1-2: Filing List**
- [ ] Create TaxFilingList component
- [ ] Create TaxFilingCard component
- [ ] Implement session grouping logic
- [ ] Add action handlers (continue, duplicate, archive, delete)
- [ ] Style components

**Days 3-5: Insights Sidebar**
- [ ] Create TaxInsights component
- [ ] Create InsightCard component
- [ ] Implement category grouping
- [ ] Add tax calculation summary
- [ ] Create calculation breakdown modal
- [ ] Style components

### Week 5: UI Integration

**Days 1-3: Dashboard Integration**
- [ ] Update Dashboard with TaxFilingList
- [ ] Add "Start New Filing" button
- [ ] Implement navigation to interview
- [ ] Test user flow

**Days 4-5: Interview Page Update**
- [ ] Add TaxInsights sidebar
- [ ] Update to use session-based state
- [ ] Handle real-time insight updates
- [ ] Test insight generation during interview

### Week 6: Multilingual Support

**Days 1-2: Translation Files**
- [ ] Add English translations
- [ ] Add German translations
- [ ] Add French translations
- [ ] Add Italian translations

**Days 3-4: Backend Translation**
- [ ] Create translation utility
- [ ] Update insight generation to use translations
- [ ] Test all languages

**Day 5: Frontend Translation**
- [ ] Update all components to use i18n
- [ ] Test language switching
- [ ] Verify insight text in all languages

### Week 7: Advanced Features

**Days 1-2: Session Duplication**
- [ ] Implement backend duplication logic
- [ ] Add frontend UI for duplication
- [ ] Test duplication flow

**Days 3-4: Profile Integration**
- [ ] Add tax history to profile page
- [ ] Implement data aggregation service
- [ ] Display user statistics

**Day 5: Polish & Refinements**
- [ ] UI/UX improvements
- [ ] Loading states
- [ ] Error handling
- [ ] Responsive design

### Week 8: Testing & Bug Fixes

**Days 1-2: Unit Testing**
- [ ] Backend service tests
- [ ] Frontend component tests
- [ ] Redux slice tests

**Days 3-4: Integration Testing**
- [ ] End-to-end flow tests
- [ ] Multi-session scenarios
- [ ] Language switching tests

**Day 5: Bug Fixes**
- [ ] Fix identified issues
- [ ] Performance optimization

### Week 9: Documentation & Deployment Prep

**Days 1-2: Documentation**
- [ ] API documentation
- [ ] User guide
- [ ] Developer documentation

**Days 3-5: Deployment Preparation**
- [ ] Production migration scripts
- [ ] Environment configuration
- [ ] Backup procedures
- [ ] Rollback plan

### Week 10: Deployment & Monitoring

**Days 1-2: Staging Deployment**
- [ ] Deploy to staging
- [ ] Run smoke tests
- [ ] UAT with stakeholders

**Days 3-4: Production Deployment**
- [ ] Run database migrations
- [ ] Deploy backend
- [ ] Deploy frontend
- [ ] Verify deployment

**Day 5: Monitoring & Support**
- [ ] Monitor error logs
- [ ] Monitor performance metrics
- [ ] Address any immediate issues
- [ ] User feedback collection

---

## 8. Testing Strategy

### 8.1 Unit Tests

**Backend:**
- Test each service method
- Test model relationships
- Test insight generation rules
- Test tax calculation logic

**Frontend:**
- Test Redux actions and reducers
- Test component rendering
- Test user interactions
- Test translation keys

### 8.2 Integration Tests

- Test API endpoints end-to-end
- Test session creation flow
- Test insight generation during interview
- Test session switching
- Test multilingual flows

### 8.3 User Acceptance Tests

- Create multiple tax filings
- Complete an interview and verify insights
- Switch between sessions
- Duplicate a session
- Archive a session
- Test in all 4 languages

### 8.4 Performance Tests

- Load test with multiple sessions
- Test insight generation performance
- Test calculation speed
- Test database query performance

---

## 9. Risk Mitigation

### 9.1 Data Migration Risk
**Risk:** Existing interview sessions lost
**Mitigation:** Migrate existing sessions to new structure, provide fallback

### 9.2 Performance Risk
**Risk:** Slow insight generation
**Mitigation:** Cache insights, optimize queries, async processing

### 9.3 Translation Risk
**Risk:** Missing or incorrect translations
**Mitigation:** Professional translation review, fallback to English

### 9.4 User Confusion Risk
**Risk:** Users confused by multiple sessions
**Mitigation:** Clear UI, onboarding tutorial, help documentation

---

## 10. Success Metrics

### 10.1 Technical Metrics
- API response time < 200ms
- Insight generation < 100ms
- Page load time < 2s
- Zero data loss during migration

### 10.2 User Metrics
- Users create multiple sessions
- Insights viewed during interview
- Session completion rate
- User satisfaction score

---

## 11. Future Enhancements

### Phase 2 (Post-Launch)
- Export filing to PDF
- Share filing with tax advisor
- Import from previous year
- AI-powered tax optimization suggestions
- Integration with Swiss tax authorities
- Mobile app support

---

## 12. Appendix

### 12.1 File Structure

```
backend/
├── models/
│   ├── tax_filing_session.py (NEW)
│   ├── tax_insight.py (NEW)
│   ├── tax_answer.py (NEW)
│   ├── tax_calculation.py (NEW)
│   └── user.py (UPDATED)
├── services/
│   ├── tax_filing_service.py (NEW)
│   ├── insight_service.py (NEW)
│   └── calculation_service.py (NEW)
├── routers/
│   └── tax_filing.py (UPDATED)
├── utils/
│   └── translations.py (NEW)
└── alembic/versions/
    └── XXXX_add_tax_filing_sessions.py (NEW)

frontend/
├── src/
│   ├── store/slices/
│   │   └── taxFilingSlice.js (NEW)
│   ├── components/
│   │   ├── TaxFilingList/ (NEW)
│   │   ├── TaxFilingCard/ (NEW)
│   │   ├── TaxInsights/ (NEW)
│   │   └── TaxCalculationBreakdown/ (NEW)
│   ├── pages/
│   │   ├── Dashboard/Dashboard.jsx (UPDATED)
│   │   ├── TaxFiling/InterviewPage.js (UPDATED)
│   │   └── Profile/Profile.jsx (UPDATED)
│   └── locales/
│       ├── en/translation.json (UPDATED)
│       ├── de/translation.json (UPDATED)
│       ├── fr/translation.json (UPDATED)
│       └── it/translation.json (UPDATED)
```

### 12.2 Key Dependencies

**Backend:**
- SQLAlchemy (ORM)
- Alembic (Migrations)
- FastAPI (API Framework)
- Pydantic (Validation)

**Frontend:**
- React 18
- Redux Toolkit
- Material-UI
- react-i18next
- framer-motion

---

## Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-06 | Initial document | Claude |

---

**END OF DOCUMENT**
