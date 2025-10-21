# Integration Strategy Guide: Swiss Standards Import

**Document Version:** 1.0
**Date:** 2025-10-21
**Purpose:** Explain how eCH-0196/Swissdec imports integrate with existing Q&A and PDF upload systems

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Current User Journey](#current-user-journey)
3. [Enhanced User Journey (With Standards)](#enhanced-user-journey-with-standards)
4. [Integration Points](#integration-points)
5. [Homepage Trust Badges](#homepage-trust-badges)
6. [Document Flow Unification](#document-flow-unification)
7. [User Experience Best Practices](#user-experience-best-practices)
8. [Technical Implementation](#technical-implementation)

---

## 1. System Overview

### Current System Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    CURRENT FLOW                            │
└────────────────────────────────────────────────────────────┘

User Journey:
1. Homepage → Start Tax Filing
2. Interview (Q&A) → Answer questions one by one
3. Document Upload → Upload PDFs for AI extraction
4. Review → Verify extracted data
5. Calculate → Get tax results
6. Submit → File taxes

Document Handling:
├── Manual Entry: User types answers
├── PDF Upload: User uploads document → AI OCR extracts data
└── Review: User confirms/corrects AI extraction
```

### New System Architecture (With Standards)

```
┌────────────────────────────────────────────────────────────┐
│                  ENHANCED FLOW                             │
└────────────────────────────────────────────────────────────┘

User Journey (3 paths merge into one):

PATH A: Standard Import First (NEW - Fastest)
├── User uploads eCH-0196/Swissdec BEFORE interview
├── System parses structured data (100% accurate)
├── Interview shows pre-filled answers
└── User confirms and completes remaining questions

PATH B: During Interview (NEW - Most flexible)
├── User answers questions normally
├── At relevant questions, sees "Import" button
├── Uploads standard document mid-interview
└── Questions auto-fill, user continues

PATH C: Legacy Flow (Existing - Still supported)
├── User answers all questions manually
├── Optionally uploads regular PDFs
├── AI extracts data (85% accurate)
└── User reviews and confirms

ALL PATHS MERGE at Review → Calculate → Submit
```

---

## 2. Current User Journey

### Step-by-Step (Before Standards Import)

**1. Homepage → Get Started**
```
User clicks "Start Tax Filing"
↓
[If not authenticated] → Login/Signup
↓
[If authenticated] → Interview Page
```

**2. Interview Page - Question by Question**
```
QuestionCard displays:
├── Question text
├── Input field (text, number, date, dropdown)
├── Help text
├── [Back] [Next] buttons

User Flow:
Q00_name: "What is your full name?" → User types
Q00: "What is your AHV number?" → User types
Q04b: "Upload employment certificate" → User uploads PDF
  ↓
  System calls AI OCR to extract data
  ↓
  Extracted: Gross salary ≈ CHF 85,000 (85% confidence)
  ↓
Q04b_amount: "Gross income?" → Pre-filled with CHF 85,000
  ↓
  User confirms or corrects
```

**3. Document Checklist Page - Bulk Upload**
```
After interview complete:
↓
DocumentChecklistPage shows required documents:
├── ☐ Salary certificate (Lohnausweis)
├── ☐ Bank statements
├── ☐ Property tax statement
└── ☐ Investment statements

User uploads each PDF:
├── File → S3
├── S3 → AI OCR (Textract)
├── OCR → Extracted data
└── Data → Review page
```

**4. Current Pain Points**
- **Manual entry**: 43 minutes average
- **AI accuracy**: 85% → user must verify/correct
- **Tedious**: User types same info multiple times
- **Error-prone**: Typos, wrong numbers
- **Drop-off**: 20% abandon due to length

---

## 3. Enhanced User Journey (With Standards)

### Path A: Import-First Experience 🚀 **NEW - RECOMMENDED**

```
┌─────────────────────────────────────────────────────────────┐
│  Homepage → "Get Started" → Interview Start Page           │
└─────────────────────────────────────────────────────────────┘

[NEW] Pre-Interview Import Screen
┌────────────────────────────────────────────────────────────┐
│ 🎯 Speed up your tax filing!                               │
│                                                             │
│ Upload your standard documents now to auto-fill most       │
│ questions. Or skip and answer manually.                    │
│                                                             │
│ ┌──────────────────────────┐  ┌─────────────────────────┐│
││ 💼 Salary Certificate      │  │ 🏦 Bank Statement       ││
││ (Swissdec ELM)            │  │ (eCH-0196)              ││
││                            │  │                         ││
││ Get from your employer    │  │ Get from your bank      ││
││ Auto-fills 9 questions    │  │ Auto-fills 12 questions ││
││                            │  │                         ││
││ [Upload XML/PDF]          │  │ [Upload PDF/XML]        ││
│└──────────────────────────┘  └─────────────────────────┘│
│                                                             │
│ Already have these? Great! Upload now and save 30 minutes. │
│ Don't have them? No problem, we'll guide you later.        │
│                                                             │
│ [Skip for Now] [Upload Documents]                          │
└────────────────────────────────────────────────────────────┘
                            ↓
                  [If user uploads]
                            ↓
┌────────────────────────────────────────────────────────────┐
│ ⏳ Processing UBS_eTax_2024.pdf...                         │
│ [████████████████████████░░] 90%                          │
│                                                             │
│ ✅ Extracted barcode                                       │
│ ✅ Parsed XML data                                         │
│ ✅ Validated against schema                                │
│ ⏳ Mapping to your tax return...                           │
└────────────────────────────────────────────────────────────┘
                            ↓
┌────────────────────────────────────────────────────────────┐
│ ✅ Import Successful!                                      │
│                                                             │
│ We found from your UBS Bank Statement:                     │
│ • 3 bank accounts (Total: CHF 80,000)                      │
│ • Interest income: CHF 1,500                               │
│ • 5 securities holdings (Total: CHF 120,000)               │
│ • 1 mortgage (Interest paid: CHF 8,750)                    │
│                                                             │
│ These questions will be automatically filled:              │
│ ✓ Q10a - Interest/dividend income                         │
│ ✓ Q10b - Securities holdings                              │
│ ✓ Q18_bank_statements - Bank accounts                     │
│ ✓ Q18_wealth_total - Net wealth                           │
│ ✓ Q_mortgage_interest_details - Mortgage interest         │
│ ... +7 more questions                                      │
│                                                             │
│ [Review Details] [Start Interview]                         │
└────────────────────────────────────────────────────────────┘
                            ↓
                Interview with Pre-filled Answers
                            ↓
Q01: "Civil status?" → User answers (can't import)
Q04b: "Upload employment cert?" → Auto-filled ✅ (Skip)
Q04b_amount: "Gross salary?" → CHF 85,000 ✅ (Skip)
Q10a: "Interest income?" → CHF 1,500 ✅ (Skip)
  Shows badge: "✓ From UBS Bank Statement"
Q18_wealth_total: "Net wealth?" → CHF -420,000 ✅ (Skip)
  Shows badge: "✓ Calculated from UBS data"
                            ↓
Interview completes in 10 minutes instead of 43 minutes!
```

**Benefits:**
- **Visual**: User sees immediate value (12 questions auto-filled)
- **Trust**: System shows what it found before applying
- **Flexible**: Can still skip and import later
- **Fast**: Best-case scenario (both imports) = 5 minutes total

---

### Path B: Mid-Interview Import 🎯 **NEW - FLEXIBLE**

```
┌─────────────────────────────────────────────────────────────┐
│  User starts interview without importing                   │
└─────────────────────────────────────────────────────────────┘

Q01: "Civil status?" → User answers "Married"
Q03: "Children?" → User answers "2"
                ↓
Q04b: "Upload employment certificate (Lohnausweis)"
                ↓
┌────────────────────────────────────────────────────────────┐
│ [NEW] Smart Import Suggestion                              │
│ ┌──────────────────────────────────────────────────────┐  │
││ 💡 Did you know?                                        │  │
││                                                          │  │
││ If your employer provides a Swissdec salary certificate,│  │
││ you can auto-fill all employment and deduction questions│  │
││ with 100% accuracy.                                     │  │
││                                                          │  │
││ Choose how to provide your employment info:             │  │
││                                                          │  │
││ ⚪ Upload Swissdec XML (Auto-fills 9 questions) 🚀      │  │
││ ⚪ Upload regular PDF (AI extracts, ~85% accurate)      │  │
││ ⚪ Enter manually                                        │  │
││                                                          │  │
││ [Learn More] [Continue]                                 │  │
│└──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
                ↓
        [User selects Swissdec]
                ↓
        ImportDialog opens (modal)
                ↓
┌────────────────────────────────────────────────────────────┐
│ Import Salary Certificate                                  │
├────────────────────────────────────────────────────────────┤
│                                                             │
│ Step 1 of 3: Upload File                                   │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐  │
││  📄 Drag & drop your Swissdec XML file here          │  │
││     or click to browse                                │  │
││                                                        │  │
││     Accepted: .xml, .pdf (with embedded XML)          │  │
││     Max size: 10 MB                                   │  │
│└─────────────────────────────────────────────────────┘  │
│                                                             │
│ Where to get this:                                         │
│ Ask your HR department for "Swissdec ELM format" or        │
│ "Lohnausweis XML-Datei"                                    │
│                                                             │
│ [Cancel] [Back]                                            │
└────────────────────────────────────────────────────────────┘
                ↓
        User drops ACME_Lohnausweis_2024.xml
                ↓
┌────────────────────────────────────────────────────────────┐
│ Step 2 of 3: Review Extracted Data                        │
│                                                             │
│ ✅ Successfully extracted from ACME Corporation AG         │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐  │
││ Income Summary                                        │  │
││ Gross Salary:         CHF 85,000                     │  │
││ Bonus:                CHF 5,000                      │  │
││ 13th Month:           CHF 7,083                      │  │
││ Benefits:             CHF 1,200                      │  │
││ ───────────────────────────────────────────────────  │  │
││ Total Taxable Income: CHF 98,283                     │  │
│└─────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─────────────────────────────────────────────────────┐  │
││ Deductions Paid                                       │  │
││ AHV/IV/EO:           CHF 5,209                       │  │
││ ALV:                 CHF 1,081                       │  │
││ BVG (Pension):       CHF 5,460                       │  │
││ ───────────────────────────────────────────────────  │  │
││ Total Deductions:    CHF 11,750                      │  │
│└─────────────────────────────────────────────────────┘  │
│                                                             │
│ This will auto-fill questions: Q04b, Q04b_amount,          │
│ Q04a_employer, Q07, and more                               │
│                                                             │
│ [Cancel] [Back] [Apply to Tax Return]                     │
└────────────────────────────────────────────────────────────┘
                ↓
        User clicks "Apply to Tax Return"
                ↓
┌────────────────────────────────────────────────────────────┐
│ ✅ Data Applied!                                           │
│                                                             │
│ 9 questions have been automatically filled with data from  │
│ your salary certificate.                                   │
│                                                             │
│ You can review and modify any values as you go through     │
│ the interview.                                             │
│                                                             │
│ [Continue Interview]                                        │
└────────────────────────────────────────────────────────────┘
                ↓
        Modal closes, back to interview
                ↓
Q04b: [Skipped - already uploaded via import]
Q04b_amount: "Gross income?"
  Pre-filled: CHF 98,283
  Badge: "✓ From ACME Corp Swissdec"
  [User sees but doesn't need to type - just clicks Next]
                ↓
Q04a_employer: "Employer info?"
  Pre-filled: ACME Corporation AG, CHE-123.456.789
  Badge: "✓ From Swissdec"
  [Skip]
                ↓
Q07: "Pension fund (2nd pillar)?"
  Pre-filled: CHF 5,460
  Badge: "✓ From Swissdec"
  [Skip]
                ↓
Q10: "Securities/investments?"
  User answers "Yes" (can't auto-fill yet)
                ↓
Q10a: "Dividend/interest income?"
  User sees:
  ┌──────────────────────────────────────────────────┐
  │ 💡 Import Suggestion                              │
  │ Upload your bank's e-tax statement (eCH-0196)    │
  │ to auto-fill this and 11 other questions.        │
  │ [Import Bank Statement]                           │
  └──────────────────────────────────────────────────┘

  User clicks "Import Bank Statement"
  → Same import flow as above
  → Bank data auto-fills Q10a, Q10b, Q18_*, etc.
```

**Benefits:**
- **Contextual**: Import suggested exactly when needed
- **Progressive**: Can import multiple times throughout interview
- **Flexible**: Mix of auto-fill + manual entry
- **Educational**: User learns about standards as they go

---

### Path C: Legacy Flow (Existing - Unchanged)

```
User completes entire interview manually
↓
Optionally uploads regular PDFs for AI extraction
↓
Reviews AI-extracted data
↓
Continues to Calculate/Submit
```

**Still supported for:**
- Users without standard documents
- Non-standard file formats
- Users who prefer manual entry
- Fallback when standard parsing fails

---

## 4. Integration Points

### 4.1 Homepage Integration

**Add to Homepage.js - "How It Works" Section (Line 94-113)**

#### Current (3 steps):
```javascript
const steps = [
  {
    number: "1",
    icon: <QuestionAnswerIcon />,
    title: "Answer Questions",
    description: "Simple interview about your finances"
  },
  {
    number: "2",
    icon: <UploadFileIcon />,
    title: "Upload Documents",
    description: "AI extracts data from your PDFs"
  },
  {
    number: "3",
    icon: <SendIcon />,
    title: "Submit",
    description: "We file your taxes electronically"
  }
];
```

#### Enhanced (4 steps with standards):
```javascript
const steps = [
  {
    number: "1",
    icon: <SwissStandardsIcon />, // NEW custom icon
    title: t('homepage.howItWorks.step1_new.title'),
    // "Import Standard Documents (Optional)"
    description: t('homepage.howItWorks.step1_new.description'),
    // "Upload eCH-0196 or Swissdec files to auto-fill 20+ questions"
    badges: ['eCH-0196', 'Swissdec'], // NEW
    highlight: true // NEW - make this step stand out
  },
  {
    number: "2",
    icon: <QuestionAnswerIcon />,
    title: t('homepage.howItWorks.step2.title'),
    // "Answer Remaining Questions"
    description: t('homepage.howItWorks.step2.description'),
    // "10 minutes if you imported, or answer all manually"
    estimatedTime: "10-15 min" // NEW
  },
  {
    number: "3",
    icon: <UploadFileIcon />,
    title: t('homepage.howItWorks.step3.title'),
    // "Upload Additional Documents"
    description: t('homepage.howItWorks.step3.description')
    // "Add any other PDFs - our AI will extract the data"
  },
  {
    number: "4",
    icon: <SendIcon />,
    title: t('homepage.howItWorks.step4.title'),
    // "Review & Submit"
    description: t('homepage.howItWorks.step4.description')
    // "We file your taxes electronically with tax authorities"
  }
];
```

---

### 4.2 Trust Badges Section (NEW)

**Add after features section on Homepage**

```jsx
// Add to Homepage.js after features Grid (around line 300)

{/* NEW: Supported Standards Section */}
<Box sx={{ py: 8, bgcolor: 'background.paper' }}>
  <Container>
    <Typography
      variant="h3"
      textAlign="center"
      gutterBottom
      sx={{ fontWeight: 700, mb: 1 }}
    >
      {t('homepage.standards.title')}
      {/* "Supported Swiss E-Government Standards" */}
    </Typography>

    <Typography
      variant="h6"
      textAlign="center"
      color="text.secondary"
      sx={{ mb: 6, maxWidth: 800, mx: 'auto' }}
    >
      {t('homepage.standards.subtitle')}
      {/* "We support official Swiss standards for fast, accurate tax filing" */}
    </Typography>

    <Grid container spacing={4} justifyContent="center">
      {/* eCH-0196 Badge */}
      <Grid item xs={12} md={4}>
        <Card
          elevation={3}
          sx={{
            p: 4,
            textAlign: 'center',
            height: '100%',
            borderTop: '4px solid',
            borderColor: 'primary.main',
            transition: 'transform 0.3s',
            '&:hover': { transform: 'translateY(-8px)' }
          }}
        >
          <Box
            component="img"
            src="/assets/logos/ech-0196-logo.svg" {/* You'll need to add these */}
            alt="eCH-0196 Logo"
            sx={{ height: 80, mb: 2 }}
          />

          <Typography variant="h5" gutterBottom fontWeight={600}>
            eCH-0196
          </Typography>

          <Chip
            label="Bank Statements"
            color="primary"
            size="small"
            sx={{ mb: 2 }}
          />

          <Typography variant="body2" color="text.secondary" paragraph>
            {t('homepage.standards.ech0196.description')}
            {/* "Official Swiss standard for electronic tax statements from banks" */}
          </Typography>

          <Typography variant="body2" fontWeight={600} color="primary">
            ✓ Auto-fills 12 questions
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="caption" color="text.secondary">
            {t('homepage.standards.ech0196.supported_banks')}
            {/* "Supported by UBS, Credit Suisse, PostFinance, Raiffeisen, ZKB, and more" */}
          </Typography>
        </Card>
      </Grid>

      {/* Swissdec ELM Badge */}
      <Grid item xs={12} md={4}>
        <Card
          elevation={3}
          sx={{
            p: 4,
            textAlign: 'center',
            height: '100%',
            borderTop: '4px solid',
            borderColor: 'secondary.main',
            transition: 'transform 0.3s',
            '&:hover': { transform: 'translateY(-8px)' }
          }}
        >
          <Box
            component="img"
            src="/assets/logos/swissdec-logo.svg"
            alt="Swissdec Logo"
            sx={{ height: 80, mb: 2 }}
          />

          <Typography variant="h5" gutterBottom fontWeight={600}>
            Swissdec ELM
          </Typography>

          <Chip
            label="Salary Certificates"
            color="secondary"
            size="small"
            sx={{ mb: 2 }}
          />

          <Typography variant="body2" color="text.secondary" paragraph>
            {t('homepage.standards.swissdec.description')}
            {/* "Swiss standard for electronic salary certificate transmission" */}
          </Typography>

          <Typography variant="body2" fontWeight={600} color="secondary">
            ✓ Auto-fills 9 questions
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="caption" color="text.secondary">
            {t('homepage.standards.swissdec.supported')}
            {/* "Supported by most Swiss payroll systems (Abacus, SwissSalary, SAP, etc.)" */}
          </Typography>
        </Card>
      </Grid>

      {/* AI OCR Badge (existing capability) */}
      <Grid item xs={12} md={4}>
        <Card
          elevation={3}
          sx={{
            p: 4,
            textAlign: 'center',
            height: '100%',
            borderTop: '4px solid',
            borderColor: 'info.main'
          }}
        >
          <AutoAwesomeIcon sx={{ fontSize: 80, color: 'info.main', mb: 2 }} />

          <Typography variant="h5" gutterBottom fontWeight={600}>
            AI Document Extraction
          </Typography>

          <Chip
            label="Any PDF"
            color="info"
            size="small"
            sx={{ mb: 2 }}
          />

          <Typography variant="body2" color="text.secondary" paragraph>
            {t('homepage.standards.ai_ocr.description')}
            {/* "Don't have standard formats? Our AI extracts data from any tax document" */}
          </Typography>

          <Typography variant="body2" fontWeight={600} color="info.main">
            ✓ Fallback for all documents
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="caption" color="text.secondary">
            {t('homepage.standards.ai_ocr.note')}
            {/* "~85% accuracy - you review before submitting" */}
          </Typography>
        </Card>
      </Grid>
    </Grid>

    {/* Comparison Table */}
    <Box sx={{ mt: 6 }}>
      <Typography variant="h6" textAlign="center" gutterBottom>
        {t('homepage.standards.comparison.title')}
        {/* "Why use standard formats?" */}
      </Typography>

      <Grid container spacing={2} sx={{ mt: 2, maxWidth: 800, mx: 'auto' }}>
        <Grid item xs={6}>
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'success.light' }}>
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              ✅ Standard Formats (eCH-0196, Swissdec)
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
              <li>100% parsing accuracy</li>
              <li>Auto-fills 20+ questions</li>
              <li>Instant processing (&lt;5 seconds)</li>
              <li>No data verification needed</li>
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={6}>
          <Paper elevation={0} sx={{ p: 2, bgcolor: 'grey.100' }}>
            <Typography variant="subtitle2" gutterBottom fontWeight={600}>
              Regular PDF + AI
            </Typography>
            <Typography variant="body2" component="ul" sx={{ pl: 2 }}>
              <li>~85% accuracy (needs review)</li>
              <li>Helps with some questions</li>
              <li>Processing: 10-30 seconds</li>
              <li>Must verify extracted data</li>
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>

    {/* CTA */}
    <Box sx={{ textAlign: 'center', mt: 4 }}>
      <Button
        variant="contained"
        size="large"
        endIcon={<ArrowForwardIcon />}
        onClick={handleGetStarted}
      >
        {t('homepage.standards.cta')}
        {/* "Start Filing with Standard Import" */}
      </Button>
    </Box>
  </Container>
</Box>
```

---

### 4.3 InterviewPage Integration

**File:** `src/pages/TaxFiling/InterviewPage.js`

**Add Pre-Interview Import Step:**

```javascript
// Add new state
const [showPreImport, setShowPreImport] = useState(true);
const [importedDocuments, setImportedDocuments] = useState([]);

// Before first question, show import screen
const renderPreImportScreen = () => (
  <Container maxWidth="md" sx={{ py: 4 }}>
    <Paper elevation={3} sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        🚀 {t('interview.pre_import.title')}
        {/* "Speed Up Your Tax Filing" */}
      </Typography>

      <Typography variant="body1" color="text.secondary" paragraph>
        {t('interview.pre_import.description')}
        {/* "Upload your standard documents now to auto-fill most questions..." */}
      </Typography>

      <Grid container spacing={3} sx={{ my: 3 }}>
        {/* Swissdec Card */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              💼 Salary Certificate (Swissdec)
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Get from your employer. Auto-fills 9 questions about employment and deductions.
            </Typography>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<UploadFileIcon />}
              onClick={() => handleOpenImportDialog('swissdec')}
            >
              Upload Swissdec
            </Button>
          </Card>
        </Grid>

        {/* eCH-0196 Card */}
        <Grid item xs={12} md={6}>
          <Card variant="outlined" sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              🏦 Bank Statement (eCH-0196)
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Get from your bank's e-banking. Auto-fills 12 questions about income and wealth.
            </Typography>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<UploadFileIcon />}
              onClick={() => handleOpenImportDialog('ech0196')}
            >
              Upload eCH-0196
            </Button>
          </Card>
        </Grid>
      </Grid>

      {/* Show imported documents if any */}
      {importedDocuments.length > 0 && (
        <Alert severity="success" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight={600}>
            ✅ {importedDocuments.length} document(s) imported
          </Typography>
          {importedDocuments.map((doc, i) => (
            <Typography key={i} variant="caption" display="block">
              • {doc.source_institution} ({doc.standard}) - {doc.fields_count} fields
            </Typography>
          ))}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="text"
          onClick={() => setShowPreImport(false)}
        >
          {t('interview.pre_import.skip')}
          {/* "Skip for Now" */}
        </Button>

        <Button
          variant="contained"
          onClick={() => setShowPreImport(false)}
          disabled={importedDocuments.length === 0}
        >
          {t('interview.pre_import.continue')}
          {/* "Continue to Interview" */}
        </Button>
      </Box>
    </Paper>

    {/* Import Dialog */}
    <ImportDialog
      open={importDialogOpen}
      onClose={() => setImportDialogOpen(false)}
      importType={selectedImportType}
      sessionId={session}
      onImportComplete={handleImportComplete}
    />
  </Container>
);

// Modify main render to show pre-import first
return (
  <Box>
    <Header />
    {showPreImport ? (
      renderPreImportScreen()
    ) : (
      // Existing interview flow
      <Container>
        <ProgressBar ... />
        <QuestionCard ... />
        ...
      </Container>
    )}
    <Footer />
  </Box>
);
```

---

### 4.4 QuestionCard Integration

**File:** `src/components/TaxFiling/QuestionCard.jsx`

**Add Import Button to Relevant Questions:**

```javascript
const QuestionCard = ({ question, currentAnswer, onAnswer, sessionId }) => {
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importType, setImportType] = useState(null);

  // Determine if this question supports import
  const getQuestionImportType = () => {
    const importMapping = {
      'Q04b': 'swissdec',
      'Q04b_amount': 'swissdec',
      'Q10a': 'ech0196',
      'Q10b': 'ech0196',
      'Q18_bank_statements': 'ech0196',
      'Q18_wealth_total': 'ech0196',
      'Q_mortgage_interest_details': 'ech0196'
    };
    return importMapping[question.id] || null;
  };

  const questionImportType = getQuestionImportType();
  const hasImportedData = currentAnswer?._dataSource;

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      {/* Question Text */}
      <Typography variant="h5" gutterBottom>
        {question.text[language]}
      </Typography>

      {/* EXISTING: Help text */}
      {question.help_text && (
        <Typography variant="body2" color="text.secondary" paragraph>
          {question.help_text[language]}
        </Typography>
      )}

      {/* NEW: Import Suggestion (show if question supports import and no data imported yet) */}
      {questionImportType && !hasImportedData && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          icon={<UploadFileIcon />}
          action={
            <Button
              size="small"
              variant="outlined"
              onClick={() => {
                setImportType(questionImportType);
                setShowImportDialog(true);
              }}
            >
              Import
            </Button>
          }
        >
          <Typography variant="body2">
            💡 <strong>Save time:</strong> Upload your{' '}
            {questionImportType === 'ech0196' ? 'bank e-tax statement' : 'salary certificate'}
            {' '}to auto-fill this and related questions.
          </Typography>
        </Alert>
      )}

      {/* EXISTING: Input Field */}
      <TextField
        fullWidth
        value={currentAnswer || ''}
        onChange={(e) => onAnswer(e.target.value)}
        placeholder={question.placeholder?.[language]}
        // ... other props
      />

      {/* NEW: Data Source Badge (show if answer came from import) */}
      {hasImportedData && (
        <Box sx={{ mt: 1 }}>
          <Chip
            label={`✓ From ${currentAnswer._dataSource.source_institution || 'imported document'}`}
            size="small"
            color="success"
            clickable
            onClick={() => {/* Show import details modal */}}
            sx={{ mr: 1 }}
          />
          <Chip
            label={currentAnswer._dataSource.source === 'ech0196' ? 'eCH-0196' : 'Swissdec'}
            size="small"
            variant="outlined"
          />
        </Box>
      )}

      {/* EXISTING: Navigation Buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button onClick={onBack}>Back</Button>
        <Button onClick={onNext} variant="contained">Next</Button>
      </Box>

      {/* NEW: Import Dialog */}
      <ImportDialog
        open={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        importType={importType}
        sessionId={sessionId}
        questionId={question.id}
        onImportComplete={(extractedData) => {
          // Auto-fill current question if it has a mapped field
          const mappedValue = extractedData.mapped_fields[question.field_name];
          if (mappedValue !== undefined) {
            onAnswer(mappedValue);
          }
          setShowImportDialog(false);
        }}
      />
    </Paper>
  );
};
```

---

### 4.5 Document Unification Strategy

**Goal:** Merge all 3 document flows into one unified system

```
┌────────────────────────────────────────────────────────────┐
│          UNIFIED DOCUMENT MANAGEMENT                       │
└────────────────────────────────────────────────────────────┘

User's Documents View (in Dashboard):

┌──────────────────────────────────────────────────────────┐
│ 📄 My Documents (Tax Year 2024)                          │
├──────────────────────────────────────────────────────────┤
│                                                           │
│ ✅ UBS Bank Statement (eCH-0196)                         │
│    Uploaded: Oct 21, 2025                                │
│    Status: Processed                                     │
│    Auto-filled: 12 questions                             │
│    [View Details] [Download] [Remove]                    │
│                                                           │
│ ✅ ACME Corp Salary Certificate (Swissdec)               │
│    Uploaded: Oct 21, 2025                                │
│    Status: Processed                                     │
│    Auto-filled: 9 questions                              │
│    [View Details] [Download] [Remove]                    │
│                                                           │
│ ⏳ Property Tax Statement (PDF)                          │
│    Uploaded: Oct 21, 2025                                │
│    Status: AI Extracting... 75%                          │
│    [View Progress]                                       │
│                                                           │
│ ☐ Health Insurance Premium (Required)                    │
│    Not uploaded yet                                      │
│    [Upload Document]                                     │
│                                                           │
│ [+ Upload Another Document]                              │
└──────────────────────────────────────────────────────────┘
```

**Implementation:**

```javascript
// Unified document type categorization
const classifyDocument = (document) => {
  if (document.import_standard === 'ech0196') {
    return {
      type: 'standard',
      standard: 'eCH-0196',
      icon: <BankIcon />,
      badge: 'Bank Statement',
      accuracy: '100%',
      processing: 'Structured Parser'
    };
  } else if (document.import_standard === 'swissdec') {
    return {
      type: 'standard',
      standard: 'Swissdec ELM',
      icon: <WorkIcon />,
      badge: 'Salary Certificate',
      accuracy: '100%',
      processing: 'Structured Parser'
    };
  } else {
    return {
      type: 'regular',
      standard: null,
      icon: <DocumentIcon />,
      badge: 'PDF Document',
      accuracy: '~85%',
      processing: 'AI OCR'
    };
  }
};
```

---

## 5. Homepage Trust Badges

### Logo Assets Needed

**Create these image files:**

```
/public/assets/logos/
├── ech-0196-logo.svg          # eCH association logo with "0196" badge
├── swissdec-logo.svg          # Swissdec logo
├── ech-association.svg        # General eCH logo (link to ech.ch)
├── swiss-government-seal.svg  # Swiss Confederation seal (optional)
└── supported-banks/
    ├── ubs-logo.svg
    ├── credit-suisse-logo.svg
    ├── postfinance-logo.svg
    ├── raiffeisen-logo.svg
    └── zkb-logo.svg
```

**Where to get:**
- eCH logos: https://www.ech.ch → Media/Downloads
- Swissdec: https://www.swissdec.ch → About/Media
- Bank logos: Use official brand assets (request permission)

---

### Trust Badge Component

**File:** `src/components/TrustBadges/StandardsBadges.jsx` (NEW)

```jsx
import React from 'react';
import { Box, Grid, Tooltip, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const StandardsBadges = ({ variant = 'full' }) => {
  const { t } = useTranslation();

  const badges = [
    {
      id: 'ech0196',
      logo: '/assets/logos/ech-0196-logo.svg',
      name: 'eCH-0196',
      tooltip: t('standards.ech0196.tooltip'),
      link: 'https://www.ech.ch/de/ech/ech-0196/2.2.0'
    },
    {
      id: 'swissdec',
      logo: '/assets/logos/swissdec-logo.svg',
      name: 'Swissdec ELM',
      tooltip: t('standards.swissdec.tooltip'),
      link: 'https://www.swissdec.ch/elm'
    }
  ];

  if (variant === 'minimal') {
    return (
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        {badges.map(badge => (
          <Tooltip key={badge.id} title={badge.tooltip}>
            <Box
              component="a"
              href={badge.link}
              target="_blank"
              rel="noopener"
              sx={{ opacity: 0.7, '&:hover': { opacity: 1 } }}
            >
              <Box
                component="img"
                src={badge.logo}
                alt={badge.name}
                sx={{ height: 40 }}
              />
            </Box>
          </Tooltip>
        ))}
      </Box>
    );
  }

  return (
    <Grid container spacing={2} justifyContent="center">
      {badges.map(badge => (
        <Grid item key={badge.id}>
          <Tooltip title={badge.tooltip}>
            <Box
              component="a"
              href={badge.link}
              target="_blank"
              rel="noopener"
              sx={{
                display: 'block',
                p: 2,
                border: '1px solid',
                borderColor: 'divider',
                borderRadius: 2,
                transition: 'all 0.3s',
                '&:hover': {
                  borderColor: 'primary.main',
                  transform: 'translateY(-4px)',
                  boxShadow: 2
                }
              }}
            >
              <Box
                component="img"
                src={badge.logo}
                alt={badge.name}
                sx={{ height: 60, display: 'block', mx: 'auto' }}
              />
              <Typography
                variant="caption"
                textAlign="center"
                display="block"
                sx={{ mt: 1 }}
              >
                {badge.name}
              </Typography>
            </Box>
          </Tooltip>
        </Grid>
      ))}
    </Grid>
  );
};

export default StandardsBadges;
```

**Usage in Homepage:**

```jsx
import StandardsBadges from '../../components/TrustBadges/StandardsBadges';

// In Homepage, after SwissDataBanner
<StandardsBadges variant="full" />

// In Footer
<StandardsBadges variant="minimal" />
```

---

## 6. Document Flow Unification

### All Paths Lead to Same Result

```
Path A: eCH-0196/Swissdec Import
  ├── Upload standard file
  ├── Parse with 100% accuracy
  ├── Map to profile fields
  └── Store in interview_sessions.profile

Path B: Regular PDF + AI OCR
  ├── Upload PDF
  ├── Extract with AI (~85% accuracy)
  ├── User reviews/corrects
  └── Store in interview_sessions.profile

Path C: Manual Entry
  ├── User types answer
  ├── Validation
  └── Store in interview_sessions.profile

ALL PATHS converge at:
  interview_sessions.profile = {
    capital_income: 1500,
    gross_salary: 85000,
    _data_sources: {
      capital_income: { source: 'ech0196', ... },
      gross_salary: { source: 'swissdec', ... }
    }
  }
```

**Key Principle:** Regardless of HOW data enters the system (standard import, AI OCR, manual), it all ends up in the SAME profile structure.

---

## 7. User Experience Best Practices

### 7.1 Progressive Disclosure

**Don't overwhelm users** - show import options when relevant:

```
❌ BAD: Show all import options upfront
┌──────────────────────────────────────────┐
│ Upload: eCH-0196, Swissdec, PDF, XML,   │
│ Scan, Manual Entry, API Import...        │
└──────────────────────────────────────────┘
User thinks: "Too complicated, I'll just answer manually"

✅ GOOD: Progressive options
┌──────────────────────────────────────────┐
│ Q04b: Upload employment certificate      │
│                                           │
│ 💡 Do you have a Swissdec file? → Yes/No │
│   If Yes: Show Swissdec upload           │
│   If No: Show regular PDF upload         │
└──────────────────────────────────────────┘
User thinks: "Oh, this is tailored to what I have!"
```

---

### 7.2 Smart Defaults

**Recommend the best option** based on context:

```jsx
// Example: Question-specific default
<ImportDialog
  importType="swissdec"
  suggestedSource="employer" // "Ask your employer's HR department"
  fallbackOption="pdf"       // If user doesn't have Swissdec
/>

// VS

<ImportDialog
  importType="ech0196"
  suggestedSource="bank"     // "Download from your bank's e-banking"
  fallbackOption="manual"    // If bank doesn't support eCH-0196
/>
```

---

### 7.3 Graceful Degradation

**Always provide fallback:**

```
Attempt 1: Parse eCH-0196 barcode from PDF
  ↓ (fails - barcode corrupted)
Attempt 2: Prompt user to upload XML directly
  ↓ (user doesn't have XML)
Attempt 3: Offer AI OCR extraction from PDF
  ↓ (AI extracts with 85% confidence)
Attempt 4: User reviews and corrects
  ↓ (success)
Result: Data entered, user not blocked
```

**Never show a dead end:**
```
❌ BAD:
"Error: eCH-0196 parsing failed. Cannot proceed."

✅ GOOD:
"We couldn't read the barcode. Try:
 1. Upload the XML file directly
 2. Use regular PDF upload (we'll extract with AI)
 3. Enter manually (fastest for you)"
```

---

### 7.4 Transparency

**Show users what's happening:**

```jsx
<Alert severity="info">
  <Typography variant="body2">
    We extracted this data from your UBS Bank Statement:
    • Interest income: CHF 1,500
    • From 3 accounts

    You can review and modify any values before submitting.
  </Typography>
</Alert>
```

**vs. silently auto-filling** (user doesn't know where data came from)

---

### 7.5 Confidence Indicators

**Show parsing confidence:**

```jsx
// High confidence (standard format)
<Chip
  label="✓ From eCH-0196 - 100% accuracy"
  color="success"
/>

// Medium confidence (AI OCR)
<Chip
  label="~ From AI extraction - 85% confidence"
  color="warning"
  icon={<InfoIcon />}
/>
// Show "Please verify" tooltip

// Manual entry (no confidence)
<Chip
  label="Manually entered"
  color="default"
/>
```

---

## 8. Technical Implementation

### 8.1 Backend: Unified Document Processing Pipeline

```python
# backend/services/document_processor.py (NEW)

class DocumentProcessor:
    """
    Unified document processing - handles ALL document types
    """

    def process_document(self, document_id: str, user_hint: str = None):
        """
        Auto-detect document type and process accordingly

        Args:
            document_id: Document UUID
            user_hint: Optional hint ('ech0196', 'swissdec', 'pdf', 'auto')
        """
        document = db.query(Document).get(document_id)

        # Download from S3
        file_bytes = s3_client.get_object(
            Bucket=settings.S3_BUCKET,
            Key=document.s3_key
        )['Body'].read()

        # Determine processing strategy
        if user_hint == 'ech0196' or self._is_ech0196(file_bytes):
            return self._process_ech0196(document, file_bytes)

        elif user_hint == 'swissdec' or self._is_swissdec(file_bytes):
            return self._process_swissdec(document, file_bytes)

        else:
            # Fallback to AI OCR
            return self._process_ai_ocr(document, file_bytes)

    def _is_ech0196(self, file_bytes: bytes) -> bool:
        """Auto-detect if file is eCH-0196 format"""
        if file_bytes[:4] == b'%PDF':
            # Check for eCH-0196 barcode or XML namespace
            return b'eCH-0196' in file_bytes or b'eTaxStatement' in file_bytes
        elif file_bytes[:5] == b'<?xml':
            return b'eCH-0196' in file_bytes or b'eTaxStatement' in file_bytes
        return False

    def _is_swissdec(self, file_bytes: bytes) -> bool:
        """Auto-detect if file is Swissdec ELM format"""
        if file_bytes[:5] == b'<?xml':
            return b'swissdec' in file_bytes.lower() or b'SalaryDeclaration' in file_bytes
        return False

    def _process_ech0196(self, document, file_bytes):
        """Process eCH-0196 with structured parser"""
        from services.ech0196_parser import ECH0196Parser

        parser = ECH0196Parser()

        # Determine if PDF or XML
        if document.file_name.endswith('.pdf'):
            parsed_data = parser.parse_pdf(file_bytes)
        else:
            parsed_data = parser.parse_xml(file_bytes.decode('utf-8'))

        # Update document
        document.import_standard = 'ech0196'
        document.standard_data = parsed_data
        document.auto_populated_fields = list(parser.map_to_tax_profile(parsed_data).keys())
        db.commit()

        return {
            'success': True,
            'method': 'ech0196_structured_parser',
            'accuracy': 1.0,
            'data': parsed_data
        }

    def _process_swissdec(self, document, file_bytes):
        """Process Swissdec with structured parser"""
        from services.swissdec_parser import SwissdecParser

        parser = SwissdecParser()
        parsed_data = parser.parse_xml(file_bytes.decode('utf-8'))

        document.import_standard = 'swissdec'
        document.standard_data = parsed_data
        document.auto_populated_fields = list(parser.map_to_tax_profile(parsed_data).keys())
        db.commit()

        return {
            'success': True,
            'method': 'swissdec_structured_parser',
            'accuracy': 1.0,
            'data': parsed_data
        }

    def _process_ai_ocr(self, document, file_bytes):
        """Process with AI OCR (existing flow)"""
        from services.ai_document_intelligence_service import AIDocumentIntelligenceService

        ai_service = AIDocumentIntelligenceService()
        extracted_data = ai_service.extract_document_data(
            file_bytes,
            document.document_type
        )

        document.import_standard = 'ai_ocr'
        document.standard_data = extracted_data
        document.auto_populated_fields = extracted_data.get('mapped_fields', [])
        db.commit()

        return {
            'success': True,
            'method': 'ai_ocr',
            'accuracy': extracted_data.get('confidence', 0.85),
            'data': extracted_data
        }
```

---

### 8.2 Frontend: Unified Document Upload Component

```jsx
// src/components/Documents/UnifiedDocumentUpload.jsx (NEW)

const UnifiedDocumentUpload = ({
  sessionId,
  documentType,
  suggestedStandard = null, // 'ech0196' | 'swissdec' | null
  onUploadComplete
}) => {
  const [selectedFormat, setSelectedFormat] = useState(suggestedStandard || 'auto');

  return (
    <Box>
      {/* Format Selection */}
      {suggestedStandard ? (
        // Show smart suggestion
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="body2">
            💡 For this question, we recommend uploading{' '}
            <strong>
              {suggestedStandard === 'ech0196' ? 'eCH-0196 bank statement' : 'Swissdec salary certificate'}
            </strong>
            {' '}for 100% accurate auto-fill.
          </Typography>

          <RadioGroup value={selectedFormat} onChange={(e) => setSelectedFormat(e.target.value)}>
            <FormControlLabel
              value={suggestedStandard}
              control={<Radio />}
              label={`Use ${suggestedStandard.toUpperCase()} format (recommended)`}
            />
            <FormControlLabel
              value="pdf"
              control={<Radio />}
              label="Upload regular PDF (AI will extract)"
            />
            <FormControlLabel
              value="manual"
              control={<Radio />}
              label="Enter manually"
            />
          </RadioGroup>
        </Alert>
      ) : (
        // Auto-detect
        <Typography variant="body2" color="text.secondary">
          Upload any format - we'll automatically detect and process it
        </Typography>
      )}

      {/* Upload Zone */}
      {selectedFormat !== 'manual' && (
        <DocumentUploadZone
          acceptedTypes={
            selectedFormat === 'ech0196' ? '.pdf,.xml' :
            selectedFormat === 'swissdec' ? '.xml' :
            '.pdf,.xml' // auto-detect
          }
          onFileSelect={async (file) => {
            // Upload to S3 (existing flow)
            const docId = await uploadToS3(file, sessionId);

            // Process with unified processor
            const result = await api.post(`/api/documents/${docId}/process`, {
              user_hint: selectedFormat
            });

            onUploadComplete(result.data);
          }}
        />
      )}

      {/* Manual Entry Option */}
      {selectedFormat === 'manual' && (
        <Typography variant="body2">
          You can enter the information manually in the next step.
        </Typography>
      )}
    </Box>
  );
};
```

---

## Summary: Best User Experience Strategy

### ✅ **DO:**

1. **Pre-Interview Import Screen** - Let users upload standards BEFORE interview starts
2. **Contextual Suggestions** - Show import button at relevant questions
3. **Progressive Disclosure** - Don't show all options upfront, reveal as needed
4. **Clear Labels** - "eCH-0196 (Bank)" vs. "Swissdec (Salary)" not technical jargon
5. **Fallback Always** - Standard → AI OCR → Manual (never block user)
6. **Show Data Sources** - Badge indicating "✓ From UBS Bank Statement"
7. **Allow Edits** - User can modify imported values
8. **Unified Document List** - One place to see all uploads (standard + regular)

### ❌ **DON'T:**

1. Force standard import - some users won't have these files
2. Hide existing PDF upload - keep it as fallback
3. Auto-apply without preview - always show what was extracted
4. Use technical terms - say "Bank Statement" not "eCH-0196 E-Steuerauszug"
5. Make it complicated - 3 clicks max to import
6. Forget mobile - import dialog must work on phones
7. Remove manual entry - always allow typing

---

**The key:** Standards import is a **shortcut**, not a replacement. Users can:
- Use ONLY standards = 10 min completion
- Use standards + manual = 20 min completion
- Use AI OCR + manual = 35 min completion
- Use ONLY manual = 43 min completion (current)

All paths work, standards just make it faster! 🚀
