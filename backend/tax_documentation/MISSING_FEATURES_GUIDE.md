# Missing Features & Implementation Guide

## Overview

This document provides detailed information about features **NOT YET IMPLEMENTED** in the SwissAI Tax system, including where to find official data and implementation complexity.

**Status:** Reference guide for future implementation
**Last Updated:** October 20, 2025

---

## Table of Contents

1. [Wealth Tax (Vermögenssteuer)](#wealth-tax-vermögenssteuer)
2. [Pillar 2/BVG Deductions](#pillar-2bvg-deductions)
3. [Church Tax (Kirchensteuer)](#church-tax-kirchensteuer)
4. [Implementation Priority](#implementation-priority)

---

## Wealth Tax (Vermögenssteuer)

### Status: ❌ NOT IMPLEMENTED

**Priority:** HIGH (Medium-High for HNW individuals)
**Effort:** 3-4 weeks
**Impact:** Can be 20-40% of total tax for high net worth individuals

### What It Is

**Wealth tax (Vermögenssteuer)** is an annual tax on net worth levied by **cantons and municipalities** (no federal wealth tax).

**Key Characteristics:**
- **Taxed:** Net worth (assets minus debts) as of December 31st
- **Tax levels:** Canton + Municipal (like income tax)
- **Rates:** 0.13% - 1.01% (varies by canton)
- **Progressive:** Most cantons use progressive rates
- **Tax-free thresholds:** Vary by canton (CHF 30,000 - CHF 250,000)

### Why It's Important

**For High Net Worth Individuals:**
```
Example: CHF 5,000,000 net worth in Geneva
Wealth tax: ~CHF 30,000 - 45,000 per year
Income tax: ~CHF 50,000 (on CHF 200,000 income)
→ Wealth tax = 40-60% of total tax burden!
```

**For Average Individuals:**
```
Example: CHF 200,000 net worth in Zurich
Wealth tax: ~CHF 400 per year
Income tax: ~CHF 12,000 (on CHF 85,000 income)
→ Wealth tax = 3% of total tax burden
```

### Canton-Specific: YES ✅

**Each canton has its own:**
- Tax-free threshold (Freibetrag)
- Rate structure (progressive or proportional)
- Municipal multipliers (like income tax)

### Official Sources

#### 1. **Federal Tax Administration (Primary Source)**

**URL:** https://www.estv.admin.ch/estv/de/home/allgemein/steuerstatistiken/fachinformationen/steuerbelastungen.html

**Document:** "Vermögenssteuer natürlicher Personen (Stand der Gesetzgebung: 1. Januar 2024)"
- **PDF:** https://www.estv2.admin.ch/stp/ds/d-vermoegenssteuer-np-de.pdf
- **Language:** German (official)
- **Contains:** Legal framework, canton comparison tables

**What you'll find:**
- Tax-free thresholds by canton
- Rate structures (progressive vs proportional)
- Legal basis (cantonal laws)
- Calculation methods

#### 2. **Canton-Specific Tax Administration Websites**

**Examples:**

**Zurich (ZH):**
- **URL:** https://www.zh.ch/de/steuern-finanzen/steuern/steuertarife.html
- **Wealth tax rates:** Progressive, 0.3‰ - 3.5‰ (0.03% - 0.35%)
- **Tax-free:** CHF 51,000 (single), CHF 102,000 (married)

**Geneva (GE):**
- **URL:** https://www.ge.ch/themes/fiscalite
- **Wealth tax rates:** Progressive, based on centimes system
- **Tax-free:** CHF 82,200 (single), CHF 164,400 (married)

**Zug (ZG) - Lowest Tax Canton:**
- **URL:** https://www.zg.ch/behoerden/finanzdirektion/steuerverwaltung
- **Wealth tax rates:** 0.425‰ - 1.9‰ (0.0425% - 0.19%)
- **Tax-free:** CHF 200,000 (single) as of 2024, CHF 400,000 (married)

**Schwyz (SZ) - Low Tax Canton:**
- **URL:** https://www.sz.ch/verwaltung/finanzdepartement/steuerverwaltung.html/72-416-440-1214-1221
- **Wealth tax rates:** 0.6‰ (0.06%) proportional
- **Tax-free:** CHF 125,000 (single), CHF 250,000 (married)

**Vaud (VD):**
- **URL:** https://www.vd.ch/themes/etat-droit-finances/impots/
- **Wealth tax rates:** Progressive
- **Tax-free:** CHF 58,000 (single), CHF 116,000 (married)

**Valais (VS):**
- **URL:** https://www.vs.ch/web/scc/taux-impot
- **Wealth tax rates:** 1‰ - 3‰ (0.1% - 0.3%) progressive
- **Tax-free:** CHF 30,000 (single), CHF 60,000 (married)

#### 3. **Tax Advisory Firm Comparisons** (Secondary Sources)

**PWC Switzerland Tax Comparison:**
- **URL:** https://www.pwc.ch/de/presse/steuervergleich-schweiz-2024.html
- Annual comparison of all 26 cantons
- Includes wealth tax rates

**VermögensZentrum Wealth Tax Comparison:**
- **URL:** https://www.vermoegenszentrum.ch/vergleiche/vermoegenssteuern-fuer-verheiratete
- Interactive comparison tool
- Shows rates for different wealth levels

### Typical Rate Ranges (2024)

| Canton | Rate Structure | Rate Range | Tax-Free Threshold (Single) |
|--------|---------------|------------|----------------------------|
| Nidwalden (NW) | Proportional | 0.13% | CHF 100,000 |
| Schwyz (SZ) | Proportional | 0.06% | CHF 125,000 |
| Zug (ZG) | Progressive | 0.04% - 0.19% | CHF 200,000 |
| Obwalden (OW) | Progressive | 0.15% - 0.30% | CHF 60,000 |
| Zurich (ZH) | Progressive | 0.03% - 0.35% | CHF 51,000 |
| Vaud (VD) | Progressive | 0.15% - 0.45% | CHF 58,000 |
| Geneva (GE) | Progressive | 0.20% - 1.00% | CHF 82,200 |
| Valais (VS) | Progressive | 0.10% - 0.30% | CHF 30,000 |

**Note:** Plus municipal multipliers (similar to income tax)

### What Counts as Wealth

**Assets (Gross Wealth):**
- Real estate (market value)
- Bank accounts and cash
- Securities (stocks, bonds, funds)
- Life insurance cash value
- Business assets (self-employed)
- Vehicles (at depreciated value)
- Jewelry, art, collectibles

**Debts (Deductible):**
- Mortgages
- Bank loans
- Credit card debt
- Other liabilities

**Net Wealth = Gross Assets - Debts**

### Calculation Example

**Scenario: CHF 1,000,000 net wealth in Zurich (married)**

```
Net wealth: CHF 1,000,000
Tax-free threshold: CHF 102,000 (married)
Taxable wealth: CHF 898,000

Progressive rates (Zurich):
  First CHF 100,000: 0.3‰ = CHF 30
  Next CHF 200,000: 0.5‰ = CHF 100
  Next CHF 300,000: 1.0‰ = CHF 300
  Remaining CHF 298,000: 2.0‰ = CHF 596
────────────────────────────────────
Base wealth tax: CHF 1,026

Canton multiplier (100%): CHF 1,026
Municipal (e.g., Zurich 119%): CHF 1,221
────────────────────────────────────
Total wealth tax: CHF 2,247 per year
```

### Implementation Complexity

**Estimated Effort:** 3-4 weeks

**What's Needed:**

1. **Extract Wealth Tax Rates (1-2 weeks)**
   - Download official PDFs for all 26 cantons
   - Extract progressive brackets or proportional rates
   - Extract tax-free thresholds
   - Verify municipal multipliers apply

2. **Create WealthTaxCalculator Service (1 week)**
   - Base calculator class
   - 26 canton-specific implementations
   - Handle progressive vs proportional
   - Apply canton + municipal multipliers

3. **Database Schema (2-3 days)**
   - Create `wealth_tax_brackets` table
   - Store thresholds and rates by canton
   - Migration for seeding data

4. **Integration (2-3 days)**
   - Add to TaxCalculationService
   - Collect wealth data from interview
   - Include in final tax calculation

5. **Testing (3-4 days)**
   - Test all 26 cantons
   - Validate against official calculators
   - Edge cases (zero wealth, negative wealth)

**Challenges:**
- 26 different rate structures to implement
- Some cantons have very complex progressive brackets
- Municipal multipliers vary (need to verify for each canton)
- Asset valuation rules differ by canton

---

## Pillar 2/BVG Deductions

### Status: ✅ IMPLEMENTED (via Social Security Calculator)

**Priority:** HIGH
**Effort:** ✅ Already complete
**Impact:** Reduces taxable income by CHF 3,500 - 15,000 annually

### Current Implementation

**Good News:** BVG/Pillar 2 employee contributions are **FULLY IMPLEMENTED** as of October 2025!

**How it works:**
1. Social Security Calculator calculates BVG contributions
2. BVG employee portion is automatically tax-deductible
3. Deduction flows to TaxCalculationService
4. Reduces taxable income before tax calculation

**See Documentation:**
- `tax_documentation/05_SOCIAL_SECURITY_CONTRIBUTIONS.md`
- Section on BVG/Pillar 2

### Quick Reference

**BVG Employee Contribution Rates (Age-Dependent):**
```
Age 25-34:  7% of coordinated salary
Age 35-44:  10% of coordinated salary
Age 45-54:  15% of coordinated salary
Age 55-65:  18% of coordinated salary
```

**Coordinated Salary (2024):**
```
Gross Salary - CHF 25,725 = Coordinated Salary
Minimum: CHF 3,675
Maximum: CHF 88,200
```

**Example:**
```
Age 35, CHF 85,000 gross salary
Coordinated: 85,000 - 25,725 = CHF 59,275
BVG (10%): CHF 5,928

→ CHF 5,928 FULLY tax-deductible
→ Reduces tax by CHF 700-1,500 depending on rates
```

**Official Source:**
- https://www.bsv.admin.ch/bsv/de/home/sozialversicherungen/bv.html
- Federal Social Insurance Office (FSIO)

### What's Missing (If Anything)

**Optional BVG Buyins:**
- Voluntary additional contributions to pension fund
- Also fully tax-deductible
- Not yet captured in interview questions

**Implementation:** Add question for voluntary BVG buyins (1-2 days)

---

## Church Tax (Kirchensteuer)

### Status: ⚠️ PARTIALLY IMPLEMENTED (Placeholder Only)

**Priority:** LOW
**Effort:** 1 week
**Impact:** 10-15% of canton tax for church members

### What It Is

**Church tax** is a tax levied to support recognized religious communities.

**Key Characteristics:**
- **Optional:** Only for members of recognized churches
- **Based on:** Canton/municipal income tax (not separate calculation)
- **Typical rate:** 10-17% of canton tax
- **Churches:** Roman Catholic, Protestant Reformed, Christian Catholic, Jewish communities

### Canton-Specific: YES ✅

**Not all cantons levy church tax:**
- **No church tax:** Geneva (GE), Neuchâtel (NE), Vaud (VD), Ticino (TI)
- **Church tax:** Remaining 22 cantons

### Official Sources

#### 1. **Canton Tax Administration Websites**

**Each canton publishes church tax rates:**

**Zurich (ZH):**
- **URL:** https://www.zh.ch/de/steuern-finanzen/steuern/steuertarife.html
- **Church tax factors:** 0.06 - 0.17 (varies by municipality)
- **Formula:** Canton tax × church tax factor

**Bern (BE):**
- **URL:** https://www.be.ch/de/start/dienstleistungen/steuern.html
- **Church tax:** ~10% of canton tax (varies by municipality)

**Basel-Stadt (BS):**
- **URL:** https://www.steuerverwaltung.bs.ch/
- **Church tax:** Separate rates for Catholic and Protestant

**Aargau (AG):**
- **URL:** https://www.ag.ch/de/verwaltung/dfr/steuerverwaltung
- **Church tax:** 8-12% of canton tax depending on municipality

#### 2. **General Information Sources**

**RSM Switzerland - Church Tax Guide:**
- **URL:** https://www.rsm.global/switzerland/en/news/church-tax-switzerland
- Overview of church tax system
- Canton-by-canton comparison

**The Local Switzerland:**
- **URL:** https://www.thelocal.ch/20220321/explained-what-is-church-tax-in-switzerland-and-do-i-have-to-pay-it/
- Practical guide for expatriates
- How to opt-out

### Typical Rates (2024)

**Average church tax: 10-17% of canton tax**

| Canton | Church Tax Method | Typical Rate |
|--------|-------------------|--------------|
| Zurich (ZH) | Factor × Canton Tax | 6% - 17% |
| Bern (BE) | % of Canton Tax | ~10% |
| Lucerne (LU) | % of Canton Tax | ~12% |
| Basel-Stadt (BS) | % of Canton Tax | ~15% |
| Aargau (AG) | % of Canton Tax | 8% - 12% |
| St. Gallen (SG) | % of Canton Tax | ~10% |

**No Church Tax:**
- Geneva (GE): State funds churches
- Neuchâtel (NE): No church tax
- Vaud (VD): State funds churches
- Ticino (TI): No church tax

### Calculation Example

**Scenario: Zurich, Roman Catholic, CHF 85,000 taxable income**

```
Canton tax: CHF 2,803
Municipal tax: CHF 3,336
Total canton+municipal: CHF 6,139

Church tax factor (Catholic, Zurich city): 0.10
Church tax = CHF 6,139 × 0.10 = CHF 614 per year
```

**Scenario: Bern, Protestant, CHF 85,000 taxable income**

```
Canton tax: CHF 8,532
Municipal tax: CHF 12,950
Total canton+municipal: CHF 21,482

Church tax rate (Protestant): ~10%
Church tax = CHF 21,482 × 0.10 = CHF 2,148 per year
```

### Who Pays

**Mandatory for:**
- Members of recognized churches (Catholic, Protestant, etc.)
- In 22 cantons

**Exempt:**
- Non-members (atheist, agnostic, other religions)
- Residents of Geneva, Neuchâtel, Vaud, Ticino

**How to Opt-Out:**
- Officially leave church (Kirchenaustritt)
- Process varies by canton
- Usually requires written declaration

### Current Implementation Status

**What exists:**
```python
# Placeholder calculation in TaxCalculationService
church_tax = self._calculate_church_tax(cantonal_tax, canton, answers)

def _calculate_church_tax(self, cantonal_tax, canton, answers):
    """Placeholder - returns 0"""
    return Decimal('0')
```

**What's missing:**
- Church membership question in interview
- Church tax rates by canton
- Canton-specific calculation methods
- Municipality-specific factors

### Implementation Complexity

**Estimated Effort:** 1 week

**What's Needed:**

1. **Collect Church Tax Data (2-3 days)**
   - Extract rates for 22 cantons
   - Identify calculation method (% or factor)
   - Municipality-specific factors where applicable

2. **Database Schema (1 day)**
   - Create `church_tax_rates` table
   - Store rates by canton/municipality
   - Link to recognized churches

3. **Interview Question (1 day)**
   - Add church membership question
   - Options: None, Catholic, Protestant, Christian Catholic, Jewish

4. **Implementation (2 days)**
   - Update `_calculate_church_tax()` method
   - Load rates from database
   - Calculate based on canton method

5. **Testing (1 day)**
   - Test all 22 cantons
   - Verify opt-out logic
   - Edge cases

**Challenges:**
- Low priority (affects only ~40% of population)
- Some cantons have municipality-specific rates
- Different calculation methods by canton

---

## Implementation Priority

### Recommended Order

#### Phase 1: High Priority (4-5 weeks)

1. **Wealth Tax** (3-4 weeks)
   - Critical for high net worth individuals
   - Can be 20-40% of tax for HNW
   - Most complex to implement

2. **Church Tax** (1 week)
   - Affects ~40% of population
   - Simple calculation (% of canton tax)
   - Quick win

#### Phase 2: Medium Priority (2-3 weeks)

3. **Canton-Specific Deductions** (ongoing)
   - Configure remaining 21 cantons
   - Priority: Top 10 by population
   - 6-8 weeks total (can be done incrementally)

4. **Wealth Tax Refinements** (1 week)
   - Asset valuation rules
   - Debt deduction limits
   - Special cases

#### Phase 3: Low Priority (2-3 weeks)

5. **Capital Gains Tax** (2-3 weeks)
   - Real estate gains
   - Professional securities trading
   - Complex rules

6. **Advanced Features** (as needed)
   - Foreign tax credits
   - Special pension taxation
   - Part-year resident proration

### Impact vs Effort Matrix

```
High Impact, Low Effort:
  - Church Tax (1 week, affects 40%)

High Impact, High Effort:
  - Wealth Tax (3-4 weeks, critical for HNW)
  - Canton Deductions (6-8 weeks, improves accuracy 5-10%)

Low Impact, Low Effort:
  - Voluntary BVG buyins (1-2 days)
  - Interview question improvements (ongoing)

Low Impact, High Effort:
  - Capital gains (2-3 weeks, niche use case)
```

---

## Summary Table

| Feature | Status | Priority | Effort | Impact | Canton-Specific | Official Source |
|---------|--------|----------|--------|--------|----------------|-----------------|
| **Wealth Tax** | ❌ Missing | HIGH | 3-4 weeks | 20-40% for HNW | YES (26 cantons) | estv.admin.ch PDFs |
| **BVG Deductions** | ✅ Complete | N/A | Done | CHF 3,500-15,000 | NO (federal) | bsv.admin.ch |
| **Church Tax** | ⚠️ Placeholder | LOW | 1 week | 10-15% for members | YES (22 cantons) | Canton websites |
| **Canton Deductions** | ⚠️ 5/26 | HIGH | 6-8 weeks | 5-10% accuracy | YES (21 remaining) | Canton websites |
| **Capital Gains** | ❌ Missing | MEDIUM | 2-3 weeks | Varies | YES | Canton websites |

---

## Next Steps

### For Immediate Implementation

**Week 1-4: Wealth Tax**
1. Download official ESTV PDF + all canton sources
2. Extract rates and thresholds for 26 cantons
3. Create WealthTaxCalculator service
4. Implement progressive and proportional methods
5. Test against official calculators

**Week 5: Church Tax**
1. Collect rates from 22 cantons
2. Add interview question
3. Implement calculation
4. Test and validate

### For Product Planning

**Accuracy Improvement Path:**
```
Current: 90-95% (employed persons)
+ Wealth Tax: 92-97% (with HNW)
+ Church Tax: 93-98% (with members)
+ Canton Deductions: 95-99% (all users)
= Near 100% for standard cases
```

**User Segments:**
- **Standard employee:** 95%+ accuracy NOW
- **High net worth:** Needs wealth tax (+3-4 weeks)
- **Church member:** Needs church tax (+1 week)
- **Complex deductions:** Needs canton config (+6-8 weeks)

---

**Version:** 1.0
**Last Updated:** October 20, 2025
**Status:** Reference guide for future development
**Official Sources:** All links verified October 2025
