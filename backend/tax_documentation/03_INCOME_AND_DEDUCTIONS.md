# Income Calculation & Deductions System

## Overview

✅ **STATUS: COMPLETE - Income Calculation & Federal Deductions**

This document covers:
1. All income types supported by the system
2. Federal-level deductions (100% complete)
3. Canton-specific deductions (20% complete - 5/26 cantons)
4. How income and deductions flow through the tax calculation

**Tax Year:** 2024
**Last Updated:** October 20, 2025

---

## Table of Contents

1. [Income Types](#income-types)
2. [Federal Deductions](#federal-deductions)
3. [Canton-Specific Deductions](#canton-specific-deductions)
4. [Calculation Flow](#calculation-flow)
5. [Examples](#examples)

---

## Income Types

### 1. Employment Income ✅

**Description:** Gross salary from employment

**What's Included:**
- Base salary
- Bonuses and commissions
- 13th month salary
- Overtime pay
- Benefits in kind (taxable portion)

**What's NOT Included:**
- Employer BVG contributions (not taxable)
- Employer social security contributions
- Expense reimbursements (non-taxable)

**How to report:** Gross amount before any deductions

**Example:**
```
Annual salary:        CHF 80,000
Bonus:               CHF 5,000
───────────────────────────────
Employment income:    CHF 85,000
```

### 2. Self-Employment Income ✅

**Description:** Net profit from business/freelance work

**What's Included:**
- Revenue from services/products
- Minus: Business expenses (documented)
- Minus: Business-related costs

**Important:** Report NET income (after expenses), not gross revenue

**Example:**
```
Business revenue:         CHF 120,000
- Business expenses:      CHF 45,000
───────────────────────────────────
Self-employment income:   CHF 75,000
```

### 3. Capital Income ✅

**Description:** Income from investments

**What's Included:**
- Dividends from stocks
- Interest from savings/bonds
- Investment fund distributions

**Swiss Withholding Tax:**
- 35% withholding on Swiss dividends/interest
- Reclaimable via tax return
- Must declare full amount (before withholding)

**Example:**
```
Dividends received (after 35% WHT): CHF 6,500
Gross dividends (before WHT):       CHF 10,000
───────────────────────────────────────────────
Report: CHF 10,000
Tax credit: CHF 3,500 (reclaimable)
```

### 4. Rental Income ✅

**Description:** Income from rental properties

**What's Included:**
- Rental payments received
- Minus: Deductible expenses (maintenance, mortgage interest)

**Common Deductions:**
- Mortgage interest
- Maintenance and repairs
- Property management fees
- Insurance premiums
- Depreciation (for commercial properties)

**Example:**
```
Annual rent received:      CHF 24,000
- Mortgage interest:       CHF 8,000
- Maintenance:            CHF 2,500
- Insurance:              CHF 800
─────────────────────────────────
Rental income (net):      CHF 12,700
```

### 5. Pension & Annuity Income ✅

**Description:** Pension payments and annuities

**What's Included:**
- AHV/IV state pension
- BVG/Pillar 2 pension
- Private annuities (Pillar 3a/3b)
- Foreign pensions

**Special Treatment:**
- Often taxed at reduced rates
- Lump-sum withdrawals: Special one-time taxation

**Example:**
```
AHV pension:              CHF 28,000
BVG pension:              CHF 15,000
─────────────────────────────────
Pension income:           CHF 43,000
```

### 6. Foreign Income ✅

**Description:** Income from foreign sources

**What's Included:**
- Foreign employment income
- Foreign rental income
- Foreign pensions
- Foreign investment income

**Tax Treatment:**
- Switzerland taxes worldwide income for residents
- Double taxation treaties prevent duplicate taxation
- Foreign tax credits may apply

**Example:**
```
Foreign employment:       EUR 30,000 (CHF 32,400)
Foreign tax paid:         EUR 6,000 (CHF 6,480)
─────────────────────────────────────────────
Report: CHF 32,400
Credit: CHF 6,480 (per treaty)
```

### 7. Other Income ✅

**Description:** Miscellaneous taxable income

**What's Included:**
- Alimony received
- Lottery winnings (some cantons)
- Occasional income
- Royalties and licensing

**Example:**
```
Alimony received:         CHF 12,000
Royalties:               CHF 3,500
─────────────────────────────────
Other income:            CHF 15,500
```

### Total Income Calculation

**Formula:**
```
Total Gross Income = Employment Income
                   + Self-Employment Income
                   + Capital Income
                   + Rental Income
                   + Pension Income
                   + Foreign Income
                   + Other Income
```

**Example - Combined Income:**
```
Employment:              CHF 85,000
Capital (dividends):     CHF 5,000
Rental (net):           CHF 12,000
─────────────────────────────────
Total Income:           CHF 102,000
```

---

## Federal Deductions

### 1. Professional Expenses ✅

**For Employed:**
- **Standard:** 3% of gross employment income
- **Minimum:** CHF 2,000
- **Maximum:** CHF 4,000

**Examples:**
```
Salary CHF 50,000:  3% = CHF 1,500 → CHF 2,000 (minimum)
Salary CHF 85,000:  3% = CHF 2,550 → CHF 2,550
Salary CHF 200,000: 3% = CHF 6,000 → CHF 4,000 (maximum)
```

**For Self-Employed:**
- Actual business expenses (already deducted from income)
- No additional standard deduction

### 2. Pillar 3a Contributions ✅

**Employed with Pension Fund:**
- **Maximum:** CHF 7,056 per year (2024)
- **Fully deductible**

**Self-Employed without Pension Fund:**
- **Maximum:** CHF 35,280 per year (2024)
- **Or:** 20% of net self-employment income (whichever is lower)
- **Fully deductible**

**Tax Benefit Example:**
```
Single person, CHF 85,000 taxable income
Contributes CHF 7,056 to Pillar 3a

Without deduction:
  Taxable income: CHF 85,000
  Federal tax: ~CHF 1,150

With deduction:
  Taxable income: CHF 77,944
  Federal tax: ~CHF 950

Tax savings: CHF 200 federal + CHF 400-800 canton = CHF 600-1,000
```

### 3. Health Insurance Premiums ✅

**Standard Deduction:**
- **Single:** CHF 1,750 per year
- **Married:** CHF 3,500 per year

**Actual Premiums (if documented):**
- Can deduct actual basic health insurance
- Must provide receipts
- Usually higher than standard

**Example:**
```
Single pays CHF 3,600/year basic insurance
→ Deduct CHF 3,600 (vs CHF 1,750 standard)
→ Extra CHF 1,850 deduction
→ Tax savings: ~CHF 200-400
```

### 4. BVG/Pillar 2 Contributions ✅

**Amount:** Employee portion of BVG contributions

**Fully Deductible** (tax treatment):
- Usually deducted pre-tax from salary
- Or claimed as deduction if paid post-tax

**Age-Dependent Rates:**
```
Age 25-34:  7% of coordinated salary
Age 35-44:  10% of coordinated salary
Age 45-54:  15% of coordinated salary
Age 55-65:  18% of coordinated salary
```

**Example:**
```
Age 35, CHF 85,000 salary
Coordinated salary: 85,000 - 25,725 = CHF 59,275
BVG (10%): CHF 5,928
→ Deduct CHF 5,928
→ Tax savings: ~CHF 700-1,500
```

**Note:** This deduction is automatically calculated by the social security calculator and included in the tax calculation.

### 5. Child Deductions ✅

**Amount:** CHF 6,600 per child (federal level)

**Eligibility:**
- Children under 18
- Children 18+ in education/training

**Example:**
```
Family with 2 children:
→ Deduction: 2 × CHF 6,600 = CHF 13,200
→ Federal tax savings: ~CHF 1,500-3,000
→ Canton tax savings: ~CHF 2,000-5,000
→ Total savings: ~CHF 3,500-8,000
```

### 6. Alimony Payments ✅

**Deductible:**
- Alimony to former spouse
- Child support (in some cases)

**Requirements:**
- Court-ordered or official agreement
- Regular payments
- Documentation required

### 7. Medical Expenses ✅

**Deductible:** Amount exceeding 5% of net income

**Example:**
```
Net income: CHF 80,000
Threshold: 80,000 × 5% = CHF 4,000
Medical expenses: CHF 7,000
─────────────────────────────────
Deductible: 7,000 - 4,000 = CHF 3,000
```

### 8. Interest on Debts ✅

**Deductible:**
- Mortgage interest (primary residence)
- Investment loan interest

**Not Deductible:**
- Consumer loans
- Credit card interest

### Total Federal Deductions Example

**Employed Person (single, no children):**
```
Professional expenses:     CHF 3,000
Pillar 3a:                CHF 7,056
Health insurance:         CHF 3,600
BVG contributions:        CHF 5,928
───────────────────────────────────
Total deductions:         CHF 19,584
```

**Married Couple (2 children):**
```
Professional expenses:     CHF 4,000
Pillar 3a (both):         CHF 14,112
Health insurance:         CHF 7,200
BVG contributions:        CHF 11,856
Child deductions:         CHF 13,200
───────────────────────────────────
Total deductions:         CHF 50,368
```

---

## Canton-Specific Deductions

### Status: 20% Complete (5/26 Cantons)

**Configured Cantons:**
1. ✅ Zurich (ZH)
2. ✅ Bern (BE)
3. ✅ Geneva (GE)
4. ✅ Aargau (AG)
5. ✅ Basel-Stadt (BS)

**Remaining:** 21 cantons need configuration

### Common Canton-Specific Deductions

**Examples (varies by canton):**

1. **Childcare Costs:**
   - Deductible up to CHF 10,000-25,000 per child
   - Age limits vary (usually up to 14-16 years)

2. **Commuting Costs:**
   - Public transport: Actual costs
   - Private vehicle: Per-kilometer rates
   - Maximum limits vary by canton

3. **Training/Education:**
   - Professional training: CHF 12,000-20,000
   - Retraining: Higher limits

4. **Additional Health Costs:**
   - Some cantons allow higher thresholds
   - Or additional deductions beyond federal

5. **Charity Donations:**
   - Usually 10-20% of income
   - Minimum amounts vary

### Impact of Missing Canton Deductions

**Current Situation:**
- Federal deductions: 100% implemented
- Canton deductions: 5 cantons configured

**Accuracy Impact:**
- May underestimate deductions by 2-5%
- Primarily affects:
  * Families with childcare costs
  * Long commuters
  * Professionals in training
  * High charitable donors

---

## Calculation Flow

### Step-by-Step Process

```
1. Calculate Total Income
   ├─ Employment income
   ├─ Self-employment income
   ├─ Capital income
   ├─ Rental income
   ├─ Pension income
   ├─ Foreign income
   └─ Other income
   = TOTAL GROSS INCOME

2. Calculate Social Security Contributions
   ├─ AHV/IV/EO
   ├─ ALV
   ├─ UVG
   └─ BVG (employee portion)
   = SS CONTRIBUTIONS

3. Calculate Deductions
   ├─ Professional expenses
   ├─ Pillar 3a
   ├─ Health insurance
   ├─ BVG (from SS contributions) ← Automatically included
   ├─ Child deductions
   ├─ Other deductions
   = TOTAL DEDUCTIONS

4. Calculate Taxable Income
   TOTAL GROSS INCOME - TOTAL DEDUCTIONS = TAXABLE INCOME

5. Calculate Taxes
   ├─ Federal tax (on taxable income)
   ├─ Canton tax (on taxable income)
   └─ Municipal tax (on canton tax)
   = TOTAL TAX AMOUNT
```

### Data Flow Example

```python
# Step 1: Income
income = {
    'employment': 85000,
    'capital': 5000,
    'rental': 12000,
    'total_income': 102000
}

# Step 2: Social Security (automatic)
social_security = {
    'ahv_iv_eo': 4505,  # 5.3%
    'alv': 468,         # 0.55%
    'uvg_nbu': 1360,    # 1.6%
    'bvg': 5928,        # 10% age 35-44
    'total_employee': 12261,
    'bvg_deductible': 5928  # ← Flows to deductions
}

# Step 3: Deductions
deductions = {
    'professional': 3000,
    'pillar_3a': 7056,
    'health_insurance': 3600,
    'bvg': 5928,  # ← From social security
    'total_deductions': 19584
}

# Step 4: Taxable Income
taxable_income = 102000 - 19584 = 82416

# Step 5: Taxes
taxes = {
    'federal': 1050,
    'cantonal': 3200,
    'municipal': 3800,
    'total_tax': 8050
}
```

---

## Examples

### Example 1: Simple Employment Case

**Profile:**
- Single, no children
- Salary: CHF 85,000
- Age: 30
- Zurich

**Income:**
```
Employment: CHF 85,000
```

**Deductions:**
```
Professional (3%):     CHF 2,550
Pillar 3a:            CHF 7,056
Health insurance:     CHF 3,600
BVG (7%):             CHF 4,150
───────────────────────────────
Total:                CHF 17,356
```

**Taxable Income:**
```
85,000 - 17,356 = CHF 67,644
```

**Taxes:**
```
Federal:     CHF 920
Canton (ZH): CHF 2,700
Municipal:   CHF 3,200
───────────────────────
Total:       CHF 6,820
```

**Effective Tax Rate:** 8.03% on gross income

### Example 2: Self-Employed

**Profile:**
- Single, no children
- Net business income: CHF 95,000
- Age: 42

**Income:**
```
Self-employment (net): CHF 95,000
```

**Deductions:**
```
Professional:          CHF 0 (already in net)
Pillar 3a:            CHF 19,000 (20% of income)
Health insurance:     CHF 3,600
───────────────────────────────
Total:                CHF 22,600
```

**Taxable Income:**
```
95,000 - 22,600 = CHF 72,400
```

**Taxes:**
```
Federal:     CHF 1,150
Canton:      CHF 3,800
Municipal:   CHF 4,500
───────────────────────
Total:       CHF 9,450
```

**Social Security (separate):**
```
AHV (10%): CHF 9,500 (not deductible)
```

### Example 3: Multiple Income Sources

**Profile:**
- Married, 2 children
- Salary: CHF 120,000
- Rental income (net): CHF 18,000
- Dividends: CHF 8,000
- Combined age: 40/38

**Income:**
```
Employment:   CHF 120,000
Rental:       CHF 18,000
Capital:      CHF 8,000
────────────────────────
Total:        CHF 146,000
```

**Deductions:**
```
Professional:        CHF 4,000 (max)
Pillar 3a (both):   CHF 14,112
Health insurance:   CHF 7,200
BVG (both):         CHF 12,500
Child (2):          CHF 13,200
───────────────────────────────
Total:              CHF 51,012
```

**Taxable Income:**
```
146,000 - 51,012 = CHF 94,988
```

**Taxes:**
```
Federal:     CHF 2,100
Canton:      CHF 5,800
Municipal:   CHF 6,900
───────────────────────
Total:       CHF 14,800
```

**Effective Tax Rate:** 10.14% on gross income

---

## How to Use

### Via TaxCalculationService

```python
from services.tax_calculation_service import TaxCalculationService

tax_service = TaxCalculationService()

# Income and deductions calculated automatically from session answers
result = tax_service.calculate_taxes(session_id="user_123")

print(f"Total income: CHF {result['income']['total_income']}")
print(f"Total deductions: CHF {result['deductions']['total_deductions']}")
print(f"Taxable income: CHF {result['taxable_income']}")
print(f"Total tax: CHF {result['total_tax']}")
```

### Manual Income Calculation

```python
# Income components
income_data = {
    'employment': 85000,
    'self_employment': 0,
    'capital': 5000,
    'rental': 12000,
    'pension': 0,
    'foreign': 0,
    'other': 0
}

total_income = sum(income_data.values())
```

### Manual Deduction Calculation

```python
from decimal import Decimal

# Calculate deductions
gross_salary = Decimal('85000')

deductions = {
    'professional': min(gross_salary * Decimal('0.03'), Decimal('4000')),
    'pillar_3a': Decimal('7056'),
    'health_insurance': Decimal('3600'),
    'bvg': Decimal('5928'),  # From social security calc
    'children': 0 * Decimal('6600')
}

total_deductions = sum(deductions.values())
taxable_income = gross_salary - total_deductions
```

---

## Next Steps

### High Priority

1. **Canton-Specific Deductions:**
   - Configure top 10 cantons (70% of population)
   - Childcare, commuting, training costs
   - Estimated: 4-6 weeks

### Medium Priority

2. **Enhanced Income Types:**
   - Stock options taxation
   - Cryptocurrency income
   - Platform economy income

3. **Advanced Deductions:**
   - Home office expenses
   - Professional association fees
   - Work-related tools/equipment

---

**Version:** 1.0
**Last Updated:** October 20, 2025
**Status:** ✅ Income: 100% Complete, Deductions: Federal 100%, Canton 20%
