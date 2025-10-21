# Questions Impact Analysis - Swiss Standards Import

**Document Version:** 1.0
**Date:** 2025-10-21
**Related Plan:** IMPLEMENTATION_PLAN_SWISS_STANDARDS.md

---

## Executive Summary

This document maps which interview questions will be **automatically filled** or **assisted** by importing eCH-0196 (Bank Statements) and Swissdec ELM (Salary Certificates).

**Total Questions Impacted:**
- **eCH-0196 (Bank):** 12 questions
- **Swissdec ELM (Salary):** 9 questions
- **Combined:** 21 questions (some overlap possible)

**User Benefit:**
- Users can skip/auto-fill **~30%** of interview questions by uploading 1-2 standard documents
- Time savings: **45 minutes → 10 minutes**

---

## 📊 Impact Overview by Category

| Category | Total Questions | eCH-0196 Impact | Swissdec Impact |
|----------|----------------|-----------------|-----------------|
| **Personal Info** | 8 | 0 | 1 (AHV number) |
| **Employment** | 10 | 0 | 9 (all) |
| **Income** | 6 | 3 | 1 |
| **Investments** | 8 | 8 | 0 |
| **Real Estate** | 7 | 4 | 0 |
| **Deductions** | 15 | 2 | 4 |
| **Other** | 10 | 0 | 0 |
| **TOTAL** | 64 | **17** | **15** |

---

## 🏦 eCH-0196 (Bank Statement Import) - Detailed Impact

### What Data is Extracted?

From a bank's e-tax statement (eCH-0196), we extract:
- ✅ Bank accounts (IBAN, balances, interest earned)
- ✅ Securities portfolio (stocks, bonds, dividends, capital gains)
- ✅ Mortgage information (outstanding balance, interest paid)
- ✅ Loans and other liabilities
- ✅ Total wealth summary

---

### Questions Auto-Filled by eCH-0196

#### 🟢 **FULLY AUTO-FILLED** (User only needs to confirm)

**Q18_bank_statements** - Upload ALL your bank statements
- **Current:** User manually uploads PDF and we AI-extract data
- **New:** User uploads eCH-0196 PDF → Barcode extracted → Data parsed automatically
- **Auto-filled fields:**
  - All bank account IBANs
  - Year-end balances for each account
  - Account types (checking, savings, investment)
- **User Action:** Confirm accuracy
- **Time Saved:** ~5 minutes

---

**Q10_bank_accounts** - Upload your year-end bank statement(s) for AI extraction
- **Current:** User uploads regular PDF, we use AI OCR to extract
- **New:** Standard eCH-0196 parser extracts structured data (100% accuracy vs. ~85% AI)
- **Auto-filled fields:**
  - Account balances
  - Interest earned per account
- **User Action:** None (auto-filled)
- **Time Saved:** ~3 minutes

---

**Q10a** - Did you receive dividend or interest income?
- **Current:** User manually enters "Yes/No" and amount
- **New:** Auto-answered "Yes" if total > 0, with exact amount
- **Auto-filled fields:**
  - Interest income total (sum from all accounts)
  - Dividend income total (sum from all securities)
- **User Action:** Confirm amount
- **Time Saved:** ~2 minutes
- **Display:** "CHF 1,500 (✓ From UBS Bank Statement)"

---

**Q10b** - Upload your year-end securities statement for AI extraction
- **Current:** User uploads PDF, AI extracts (if format supported)
- **New:** eCH-0196 contains securities data with ISIN codes
- **Auto-filled fields:**
  - List of all securities (name, ISIN, quantity)
  - Market value per security
  - Total portfolio value
  - Dividends received per security
- **User Action:** Review list, confirm
- **Time Saved:** ~5 minutes

---

**Q18_wealth_total** - What is your total net wealth on December 31, 2024?
- **Current:** User manually calculates (assets - liabilities)
- **New:** Auto-calculated from eCH-0196 data
- **Auto-filled fields:**
  - Total bank account balances
  - Total securities value
  - Total liabilities (mortgages, loans)
  - **Net wealth = Assets - Liabilities**
- **User Action:** Verify calculation
- **Time Saved:** ~3 minutes
- **Display:**
  ```
  Total Assets: CHF 350,000
  Total Liabilities: CHF 500,000
  Net Wealth: CHF -150,000

  ✓ Calculated from UBS Bank Statement
  ```

---

#### 🟡 **PARTIALLY AUTO-FILLED** (User adds additional info)

**Q09** - Do you own real estate?
- **Current:** User answers Yes/No
- **New:** Auto-answered "Yes" if mortgage found in eCH-0196
- **Auto-filled:** Detection of property ownership via mortgage
- **User Still Needs:** Property address (if not in mortgage details), property value
- **Time Saved:** ~1 minute (detection only)

---

**Q09a** - Number of properties
- **Current:** User enters number
- **New:** Auto-filled with count of mortgages in eCH-0196
- **Auto-filled:** Property count
- **User Needs to Add:** Additional properties without mortgages
- **Time Saved:** ~30 seconds

---

**Q09b** - Property details
- **Current:** User enters all details manually
- **New:** Pre-filled with data from mortgage records
- **Auto-filled fields per property:**
  - Property address (if included in eCH-0196)
  - Purchase price (if available)
  - Current mortgage debt
- **User Still Needs:**
  - Current market value
  - Rental income (if applicable)
  - Renovation costs
- **Time Saved:** ~2 minutes per property

---

**Q09b_upload** - Upload property documents
- **Current:** User uploads separate mortgage statement
- **New:** Mortgage data already in eCH-0196 bank statement
- **Auto-filled:** Mortgage details
- **User Action:** Optional - upload if wants to override
- **Time Saved:** ~2 minutes

---

**Q_mortgage_interest** - Do you pay mortgage interest on your primary residence?
- **Current:** User answers Yes/No
- **New:** Auto-answered "Yes" if mortgage found
- **Auto-filled:** Yes/No detection
- **Time Saved:** ~10 seconds

---

**Q_mortgage_interest_details** - Mortgage interest details
- **Current:** User manually enters interest paid
- **New:** Auto-filled from eCH-0196 mortgage section
- **Auto-filled fields:**
  - Annual interest paid (per mortgage)
  - Outstanding mortgage balance
  - Lender name (if available)
- **User Still Needs:** Confirm it's for primary residence vs. investment property
- **Time Saved:** ~2 minutes
- **Display:**
  ```
  Mortgage #1
  Property: Bahnhofstrasse 1, 8001 Zürich
  Outstanding Balance: CHF 500,000
  Interest Paid (2024): CHF 8,750

  ✓ From UBS Bank Statement
  ```

---

**Q_capital_gains** - Capital gains and losses (professional traders)
- **Current:** User manually calculates from buy/sell transactions
- **New:** Partially auto-filled if eCH-0196 includes transaction history
- **Auto-filled fields:**
  - Realized capital gains (if reported by bank)
  - Cost basis (if available)
- **User Still Needs:**
  - Confirm if professional trader
  - Add transactions not in bank statement
- **Time Saved:** ~5 minutes (if professional trader)

---

#### ℹ️ **CONTEXT PROVIDED** (Helps user answer more accurately)

**Q15** - Do you have foreign income or assets?
- **Current:** User might forget foreign accounts
- **New:** System detects foreign securities (ISIN codes) or foreign bank accounts
- **Alert Shown:**
  ```
  ⚠️ We detected foreign securities in your portfolio:
  - Apple Inc. (US0378331005) - USA
  - Nestlé SA (CH0038863350) - Switzerland

  You may need to declare foreign holdings >CHF 50,000
  ```
- **User Action:** Answer Yes, provide details
- **Benefit:** Prevents accidental non-disclosure

---

**Q_pension_buyback** - Pension fund buybacks
- **Current:** User might forget buyback
- **New:** System detects large withdrawals to pension institutions
- **Alert Shown:** "We detected a CHF 20,000 payment to pension fund. Was this a buyback?"
- **User Action:** Confirm and provide details
- **Benefit:** Ensures deduction is claimed

---

### Summary: eCH-0196 Impact

| Question ID | Question Text | Impact Level | Time Saved |
|-------------|---------------|--------------|------------|
| Q18_bank_statements | Upload bank statements | 🟢 Full | 5 min |
| Q10_bank_accounts | Upload bank statement for AI | 🟢 Full | 3 min |
| Q10a | Dividend/interest income | 🟢 Full | 2 min |
| Q10b | Upload securities statement | 🟢 Full | 5 min |
| Q18_wealth_total | Total net wealth | 🟢 Full | 3 min |
| Q09 | Own real estate? | 🟡 Partial | 1 min |
| Q09a | Number of properties | 🟡 Partial | 0.5 min |
| Q09b | Property details | 🟡 Partial | 2 min |
| Q09b_upload | Upload property docs | 🟡 Partial | 2 min |
| Q_mortgage_interest | Pay mortgage interest? | 🟡 Partial | 0.2 min |
| Q_mortgage_interest_details | Mortgage interest details | 🟡 Partial | 2 min |
| Q_capital_gains | Capital gains/losses | 🟡 Partial | 5 min |
| Q15 | Foreign income/assets | ℹ️ Context | 1 min |
| Q_pension_buyback | Pension buybacks | ℹ️ Context | 1 min |
| **TOTAL** | | | **~32 minutes** |

---

## 💼 Swissdec ELM (Salary Certificate Import) - Detailed Impact

### What Data is Extracted?

From an employer's salary certificate (Swissdec ELM), we extract:
- ✅ Employer information (name, UID)
- ✅ Employee information (AHV number, name)
- ✅ Gross salary and bonuses
- ✅ Benefits (company car, housing, etc.)
- ✅ Social security contributions (AHV, IV, EO)
- ✅ Unemployment insurance (ALV)
- ✅ Pension contributions (BVG/2nd pillar)
- ✅ Other insurance (UVG, KTG)
- ✅ Employment dates and percentage

---

### Questions Auto-Filled by Swissdec ELM

#### 🟢 **FULLY AUTO-FILLED**

**Q00** - What is your AHV number?
- **Current:** User manually enters
- **New:** Auto-filled from Swissdec employee section
- **Auto-filled:** AHV number (validated format)
- **User Action:** Confirm accuracy
- **Time Saved:** ~30 seconds
- **Note:** Only if user hasn't already entered it

---

**Q04** - Number of employers (including yourself if self-employed)
- **Current:** User enters number
- **New:** Auto-calculated from number of Swissdec uploads
- **Auto-filled:** Employer count
- **User Action:** Confirm if had additional employers
- **Time Saved:** ~10 seconds

---

**Q04b** - Upload your employment certificate (Lohnausweis)
- **Current:** User uploads PDF Lohnausweis for AI extraction
- **New:** User uploads Swissdec XML → structured parsing (100% accuracy)
- **Auto-filled:** All salary certificate data
- **User Action:** Review and confirm
- **Time Saved:** ~3 minutes

---

**Q04b_amount** - What was your total gross employment income in 2024?
- **Current:** User manually enters amount
- **New:** Auto-filled from Swissdec salary components
- **Auto-filled fields:**
  - Gross salary
  - Bonuses
  - 13th month salary
  - Commission
  - **Total gross income**
- **User Action:** None
- **Time Saved:** ~1 minute
- **Display:**
  ```
  Gross Salary: CHF 85,000
  Bonus: CHF 5,000
  13th Month: CHF 7,083
  Total: CHF 97,083

  ✓ From ACME Corporation AG (Swissdec)
  ```

---

**Q04a_employer** - Employer information
- **Current:** User manually enters employer name, address
- **New:** Auto-filled from Swissdec employer section
- **Auto-filled fields:**
  - Employer name
  - Employer UID (CHE number)
  - Employer address
  - Employment start/end dates
  - Employment percentage (full-time, part-time)
- **User Action:** None
- **Time Saved:** ~2 minutes

---

**Q07** - Do you have a pension fund (2nd pillar)?
- **Current:** User answers Yes/No
- **New:** Auto-answered "Yes" if BVG contributions found
- **Auto-filled fields:**
  - BVG employee contributions
  - BVG employer contributions (for info)
  - Total pension contributions
- **User Action:** Confirm amount
- **Time Saved:** ~2 minutes
- **Display:**
  ```
  BVG Employee Contributions: CHF 5,460
  BVG Employer Contributions: CHF 7,280 (info only)

  ✓ From ACME Corporation AG Lohnausweis
  ```

---

**Q08** - Did you contribute to Pillar 3a?
- **Current:** User answers Yes/No and enters amount
- **New:** Auto-answered if Pillar 3a deducted at source (rare)
- **Auto-filled:** Pillar 3a amount (if in Swissdec)
- **User Still Needs:** Add private Pillar 3a (most common case)
- **Time Saved:** ~1 minute (if applicable)
- **Note:** Most Pillar 3a is NOT in salary certificate, so limited impact

---

#### 🟡 **PARTIALLY AUTO-FILLED**

**Q04c** - Did you have professional expenses?
- **Current:** User answers Yes/No and provides details
- **New:** Auto-answered "Yes" if professional expenses deducted in Swissdec
- **Auto-filled:** Amount already deducted (shown for info)
- **User Still Needs:** Add additional professional expenses not in certificate
- **Time Saved:** ~1 minute

---

**Q04b1** - Did you have meal expenses while working away from home?
- **Current:** User answers Yes/No
- **New:** Auto-filled if meal allowance shown in Swissdec
- **Auto-filled:** Meal allowance amount
- **User Still Needs:** Confirm accuracy
- **Time Saved:** ~1 minute

---

**Q04d** - Do you work from home regularly?
- **Current:** User answers Yes/No
- **New:** Potentially auto-answered if home office deduction in Swissdec
- **Auto-filled:** Home office deduction (if present)
- **User Still Needs:** Provide details (days per week, space %)
- **Time Saved:** ~30 seconds

---

#### ℹ️ **CONTEXT PROVIDED**

**Social Security Info (AHV/IV/EO)**
- **Current:** User might wonder if they paid AHV
- **New:** System shows: "Your AHV contributions were CHF 4,834 (already paid via salary)"
- **User Action:** No action needed (info only)
- **Benefit:** User understands they don't need to pay extra AHV

---

**Unemployment Insurance (ALV)**
- **Current:** User might be confused about ALV
- **New:** System shows: "Your ALV contributions were CHF 935 (already paid)"
- **User Action:** No action needed
- **Benefit:** Clarity on what was already paid

---

**Benefits (Company Car, etc.)**
- **Current:** User might forget to declare company car
- **New:** System detects: "Company car benefit: CHF 1,200 (already included in taxable income)"
- **User Action:** Confirm it's correct
- **Benefit:** Ensures all benefits are declared

---

#### 👥 **MULTIPLE EMPLOYERS SUPPORT**

**Q04** - Number of employers + individual employer questions
- **Current:** User manually enters all employer data
- **New:** Import multiple Swissdec files (one per employer)
- **Auto-aggregation:**
  - Total gross income = Sum of all employers
  - Total AHV paid = Sum of all contributions
  - Total BVG paid = Sum of all contributions
  - Show breakdown by employer
- **User Action:** Upload each employer's certificate, review total
- **Time Saved:** ~5 minutes (for multi-job scenarios)
- **Display:**
  ```
  Employer 1: ACME Corp AG
  Period: Jan 1 - Dec 31, 2024
  Gross Income: CHF 85,000

  Employer 2: Tech Startup GmbH
  Period: Mar 15 - Dec 31, 2024
  Gross Income: CHF 25,000

  TOTAL GROSS INCOME: CHF 110,000
  ✓ From 2 Swissdec imports
  ```

---

### Summary: Swissdec ELM Impact

| Question ID | Question Text | Impact Level | Time Saved |
|-------------|---------------|--------------|------------|
| Q00 | AHV number | 🟢 Full | 0.5 min |
| Q04 | Number of employers | 🟢 Full | 0.2 min |
| Q04b | Upload employment certificate | 🟢 Full | 3 min |
| Q04b_amount | Total gross employment income | 🟢 Full | 1 min |
| Q04a_employer | Employer information | 🟢 Full | 2 min |
| Q07 | Pension fund (2nd pillar) | 🟢 Full | 2 min |
| Q08 | Pillar 3a contributions | 🟡 Partial | 1 min |
| Q04c | Professional expenses | 🟡 Partial | 1 min |
| Q04b1 | Meal expenses | 🟡 Partial | 1 min |
| Q04d | Work from home | 🟡 Partial | 0.5 min |
| Social Security (info) | AHV/IV/EO info | ℹ️ Context | 1 min |
| Unemployment (info) | ALV info | ℹ️ Context | 0.5 min |
| Benefits (info) | Company car, etc. | ℹ️ Context | 1 min |
| **TOTAL** | | | **~14.7 minutes** |

---

## 🎯 Combined Impact: eCH-0196 + Swissdec

### Typical User Journey

**Scenario:** Hans, a married employee with one employer, owns apartment with mortgage, has bank account + small stock portfolio

**Without Import:**
1. Q04b - Manually enter gross salary: **2 min**
2. Q04a_employer - Enter employer info: **2 min**
3. Q07 - Enter BVG contributions: **2 min**
4. Q10a - Enter interest income: **2 min**
5. Q10b - Enter securities holdings: **5 min**
6. Q18_bank_statements - Manually upload bank PDF: **5 min**
7. Q_mortgage_interest_details - Enter mortgage interest: **2 min**
8. Q18_wealth_total - Calculate net wealth: **3 min**
9. Other questions: **20 min**

**TOTAL TIME: ~43 minutes**

---

**With Import:**
1. Upload Swissdec salary certificate: **1 min**
   - Auto-fills: Q04b, Q04a_employer, Q07 ✅
2. Upload eCH-0196 bank statement: **1 min**
   - Auto-fills: Q10a, Q10b, Q18_bank_statements, mortgage, wealth ✅
3. Review auto-filled data: **3 min**
4. Other questions (not auto-fillable): **20 min**

**TOTAL TIME: ~25 minutes**

**TIME SAVED: 18 minutes (42% reduction)**

---

### Questions That Still Require Manual Entry

These questions **cannot** be auto-filled by standard imports:

**Personal/Family (8 questions)**
- Q00_name - Full name
- Q00b - Date of birth
- Q01 - Civil status
- Q01a_name - Spouse's name
- Q03 - Children
- Q03a - Number of children
- Q03c - Childcare costs
- Q03d - Child support

**Deductions (10 questions)**
- Q08_amount - Pillar 3a (if not in salary cert)
- Q11 - Charitable donations
- Q12 - Alimony paid
- Q13 - Medical expenses
- Q13b - Health insurance premiums
- Q_professional_dev - Professional development
- Q_commute_costs - Commuting costs
- Q_house_maintenance - Property maintenance

**Special Situations (5 questions)**
- Q05 - Unemployment benefits (separate from salary)
- Q06 - Disability/accident insurance
- Q09c - Rental income (separate from property value)
- Q15 - Foreign income (beyond bank accounts)
- Q16 - Cryptocurrency

**Other (6 questions)**
- Q02a - Income in other cantons
- Q14 - Pension/annuity income
- Q17 - Church membership
- Q_complexity_screen - Special situations
- Q_energy_renovation - Energy renovations
- Q_trust_foundation - Trust/foundation income

**Total Manual: ~29 questions (45% of interview)**

---

## 📈 Expected Adoption & Impact

### User Segments

**Segment 1: Simple Employee (40% of users)**
- Has: 1 employer, 1 bank account, rents apartment
- Can import: Swissdec salary certificate
- Questions auto-filled: 9 questions
- Time saved: **~15 minutes**
- **Adoption likelihood: 70%** (most employers provide Swissdec)

**Segment 2: Employee + Homeowner (35% of users)**
- Has: 1 employer, 1 bank account, owns home with mortgage
- Can import: Swissdec + eCH-0196
- Questions auto-filled: 18 questions
- Time saved: **~30 minutes**
- **Adoption likelihood: 60%** (depends on bank support)

**Segment 3: Investor (15% of users)**
- Has: 1+ employers, multiple bank accounts, securities portfolio
- Can import: Multiple eCH-0196 + Swissdec
- Questions auto-filled: 21 questions
- Time saved: **~40 minutes**
- **Adoption likelihood: 80%** (power users, high motivation)

**Segment 4: Complex (10% of users)**
- Has: Multiple income sources, real estate, foreign assets
- Can import: Standards help but still need manual entry
- Questions auto-filled: 15-20 questions
- Time saved: **~25 minutes**
- **Adoption likelihood: 50%** (have accountants, may not DIY)

---

### Overall Impact Projection

**Assumptions:**
- 50% of users will have access to at least one standard document
- 70% of those will successfully import it

**Projected Metrics (Year 1):**
- **Users attempting import:** 50% × 70% = **35% of user base**
- **Average time saved:** 25 minutes per import
- **Total time saved:** 35% × 25 min = **8.75 minutes per user on average**
- **Completion rate increase:** +15% (fewer drop-offs due to frustration)
- **Data accuracy improvement:** +10% (structured data vs. manual entry)

---

## 🔄 Question Flow Changes

### Current Flow (Without Import)

```
Q04b: Upload employment certificate
  ↓
User uploads PDF Lohnausweis
  ↓
AI extracts data (85% accuracy)
  ↓
Q04b_amount: What was your gross income?
  ↓
User enters amount manually (or confirms AI extraction)
  ↓
Q04a_employer: Employer information
  ↓
User enters employer details manually
```

**Issues:**
- AI extraction can fail or be inaccurate
- User must verify and correct AI results
- Still requires manual entry as backup

---

### New Flow (With Swissdec Import)

```
Q04b: Upload employment certificate
  ↓
User sees choice:
  ┌─────────────────────────────────────┐
  │ ⚪ Salary Certificate (Swissdec)   │ ← NEW
  │    Auto-fills all employment data   │
  │                                     │
  │ ⚪ Regular PDF (AI extraction)      │ ← Existing
  │    We'll extract what we can        │
  │                                     │
  │ ⚪ Manual entry                      │
  │    Enter details yourself           │
  └─────────────────────────────────────┘
  ↓
[If user selects Swissdec]
  ↓
User uploads Swissdec XML
  ↓
System parses XML (100% accuracy)
  ↓
Preview shown:
  "We found:
   - Employer: ACME Corp AG
   - Gross Salary: CHF 85,000
   - BVG Contributions: CHF 5,460
   - AHV Contributions: CHF 4,834"
  ↓
User clicks "Apply to Tax Return"
  ↓
Q04b_amount: Auto-filled ✓ (skipped)
Q04a_employer: Auto-filled ✓ (skipped)
Q07: Auto-filled ✓ (skipped)
  ↓
Next question (Q05: Unemployment benefits)
```

**Benefits:**
- 100% parsing accuracy (vs. 85% AI)
- 3 questions automatically filled
- User sees clear preview before applying
- Can still use old method if needed

---

## 🛡️ Validation & Conflict Handling

### Scenario 1: User Already Entered Data Manually

**Situation:** User manually entered gross salary = CHF 80,000, then uploads Swissdec showing CHF 85,000

**System Behavior:**
```
⚠️ Data Conflict Detected

Field: Gross Salary (Q04b_amount)

Your Entry:     CHF 80,000
Imported Data:  CHF 85,000 (from ACME Corp Swissdec)

Which value is correct?
⚪ Keep my entry (CHF 80,000)
⚪ Use imported data (CHF 85,000) ← Recommended
⚪ Enter different amount: CHF [_______]

[Cancel] [Apply Selected Value]
```

**User Action:** Select correct value
**Result:** Chosen value applied, conflict logged for audit

---

### Scenario 2: Imported Data Missing Fields

**Situation:** eCH-0196 contains bank accounts but no securities

**System Behavior:**
- Auto-fill: Bank account balances ✅
- Auto-fill: Interest income ✅
- Skip: Securities section (not present)
- Ask user: "Do you have securities?"
  - If Yes → Show securities questions
  - If No → Skip

**Result:** Partial auto-fill, user completes missing sections

---

### Scenario 3: Multiple Imports for Same Category

**Situation:** User has accounts at UBS and PostFinance

**System Behavior:**
```
Import #1: UBS eCH-0196
  - Account 1: CHF 50,000 balance
  - Interest: CHF 100

Import #2: PostFinance eCH-0196
  - Account 2: CHF 30,000 balance
  - Interest: CHF 50

Aggregated Result:
  - Total Accounts: 2
  - Total Balance: CHF 80,000
  - Total Interest: CHF 150

✓ Data from 2 bank imports combined
```

**User Action:** Review combined totals
**Result:** All imports merged correctly

---

## 📝 UI Indicators for Imported Data

### Question Display with Import Badge

**Example: Q10a (Interest Income)**

```
┌──────────────────────────────────────────────────┐
│ Q10a: Did you receive dividend or interest      │
│       income?                                    │
│                                                  │
│ ● Yes   ○ No                                     │
│                                                  │
│ Interest Income:                                 │
│ CHF 1,500.00                                     │
│                                                  │
│ ┌──────────────────────────────────────────────┐│
││ ✓ From UBS Bank Statement (eCH-0196)          ││
││ Imported: Oct 21, 2025                         ││
││ Confidence: 100%                                ││
││ [View Details] [Remove Import]                  ││
│└──────────────────────────────────────────────┘│
│                                                  │
│ [Back] [Next]                                    │
└──────────────────────────────────────────────────┘
```

---

### Import Summary Widget (Dashboard)

```
┌──────────────────────────────────────────────────┐
│ 📄 Imported Documents                            │
├──────────────────────────────────────────────────┤
│                                                  │
│ ✅ UBS Bank Statement (eCH-0196)                │
│    Imported: Oct 21, 2025                        │
│    Auto-filled: 12 questions                     │
│    [View] [Remove]                               │
│                                                  │
│ ✅ ACME Corp Salary Certificate (Swissdec)      │
│    Imported: Oct 21, 2025                        │
│    Auto-filled: 9 questions                      │
│    [View] [Remove]                               │
│                                                  │
│ 💡 You can still import:                        │
│    • Securities statement (if separate)          │
│    • Additional bank accounts                    │
│                                                  │
│ [Import Another Document]                        │
└──────────────────────────────────────────────────┘
```

---

## 🎓 User Education

### Import Hints at Relevant Questions

**At Q04b (Employment Certificate):**
```
💡 Tip: If your employer provides a Swissdec salary
certificate (Lohnausweis XML), you can auto-fill all
employment-related questions.

Ask your HR department for "Swissdec ELM format" or
"Lohnausweis XML".

[Learn More] [Import Now]
```

**At Q18_bank_statements:**
```
💡 Tip: Most Swiss banks provide eCH-0196 e-tax
statements that can auto-fill all your bank, securities,
and mortgage data.

Download from your e-banking portal under "Documents"
or "Tax Statements".

Banks supporting this: UBS, PostFinance, Credit Suisse,
Raiffeisen, ZKB, and more.

[Learn More] [Import Now]
```

---

## 📊 Analytics & Tracking

### Metrics to Track

**Import Funnel:**
```
Total Users Starting Interview: 100%
├─ Saw Import Suggestion: 80%
├─ Clicked "Import": 40%
│  ├─ Uploaded File: 35%
│  │  ├─ Parse Success: 30%
│  │  │  ├─ Applied to Profile: 28%
│  │  │  └─ Abandoned After Preview: 2%
│  │  └─ Parse Failed: 5%
│  └─ Canceled Upload: 5%
└─ Ignored Import Suggestion: 40%
```

**Success Metrics:**
- Import success rate: Target >85%
- Time saved per import: Target >20 minutes
- User satisfaction: Target >4.5/5 stars
- Data accuracy: Target >98%

**Failure Analysis:**
- Parse errors by standard type
- Common file format issues
- User drop-off points

---

## ✅ Recommendations

### For Product Team

1. **Prioritize eCH-0196** - Higher impact (12 questions) and more complex implementation
2. **Launch Swissdec simultaneously** - Many users have both, want complete experience
3. **Add bank-specific help** - Screenshots for UBS, PostFinance, etc. on how to download
4. **Create video tutorial** - 2-minute demo showing import flow
5. **In-app tooltips** - Guide users step-by-step first time they import

### For Engineering Team

1. **Build parser library tests first** - Ensure 100% parsing accuracy before UI
2. **Test with real files** - Get actual eCH-0196 PDFs from major banks
3. **Graceful degradation** - If barcode fails, allow XML upload
4. **Conflict resolution UI** - Make it crystal clear which value to choose
5. **Audit trail** - Log all imports for debugging and compliance

### For Support Team

1. **FAQ section** - "How do I get my e-tax statement from UBS?"
2. **Bank compatibility list** - Which banks support eCH-0196
3. **Employer compatibility** - Which payroll systems export Swissdec
4. **Error message guide** - Common import errors and solutions
5. **Fallback options** - "Import failed? Try these alternatives"

---

## 🔮 Future Enhancements

### Phase 2 (After Launch)

**Smart Detection:**
- Auto-detect document type from file content (don't ask user to choose)
- Suggest which questions can be skipped based on imports

**Bulk Import:**
- Upload 10 documents at once (bank + salary + property, etc.)
- System auto-categorizes and processes all

**Bank API Integration:**
- Direct connection to bank e-banking (OAuth)
- One-click import without downloading file

**Employer Portal:**
- Employers send Swissdec directly to SwissAI Tax
- Users authorize and import with 1 click

---

## 📄 Appendix: Field Mapping Reference

### eCH-0196 XML → Question Fields

| eCH-0196 Path | Tax Profile Field | Question ID |
|---------------|-------------------|-------------|
| `/eTaxStatement/accounts/account/balance/closingBalance` | bank_account_balance | Q18_bank_statements |
| `/eTaxStatement/accounts/account/interest/amount` | interest_income | Q10a |
| `/eTaxStatement/securities/position/dividends` | dividend_income | Q10a |
| `/eTaxStatement/securities/position/marketValue` | securities_value | Q10b |
| `/eTaxStatement/mortgages/mortgage/outstandingBalance` | mortgage_debt | Q09b |
| `/eTaxStatement/mortgages/mortgage/interestPaid` | mortgage_interest_paid | Q_mortgage_interest_details |

### Swissdec ELM XML → Question Fields

| Swissdec Path | Tax Profile Field | Question ID |
|---------------|-------------------|-------------|
| `/SalaryDeclaration/Employee/SocialSecurityNumber` | ahv_number | Q00 |
| `/SalaryDeclaration/SalaryComponents/GrossSalary` | gross_salary | Q04b_amount |
| `/SalaryDeclaration/Employer/Name` | employer_name | Q04a_employer |
| `/SalaryDeclaration/Deductions/BVG/EmployeeShare` | bvg_contribution | Q07 |
| `/SalaryDeclaration/Deductions/AHV/EmployeeShare` | ahv_contribution | (Info only) |
| `/SalaryDeclaration/Deductions/ALV/EmployeeShare` | alv_contribution | (Info only) |

---

**END OF DOCUMENT**

For implementation details, see: `IMPLEMENTATION_PLAN_SWISS_STANDARDS.md`
