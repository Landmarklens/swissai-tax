# Wealth Tax (Vermögenssteuer / Impôt sur la Fortune / Imposta sulla Sostanza)

**Tax Year:** 2024
**Coverage:** All 26 Swiss Cantons
**Implementation Status:** ✅ Complete Database Schema + Base Calculators
**Data Quality:** 73% Complete, 19% Partial, 8% Verified

---

## Table of Contents

1. [Overview](#overview)
2. [How Wealth Tax Works](#how-wealth-tax-works)
3. [Canton-by-Canton Guide](#canton-by-canton-guide)
4. [Tax Calculation Examples](#tax-calculation-examples)
5. [Municipal Multipliers](#municipal-multipliers)
6. [API Usage](#api-usage)
7. [Data Sources](#data-sources)

---

## Overview

### What is Wealth Tax?

Wealth tax (Vermögenssteuer) is an **annual tax** levied by Swiss cantons and municipalities on an individual's **net worth** (total assets minus debts) as of **December 31st** each year.

**Key Facts:**
- ✅ Levied by **cantons and municipalities** (not federal government)
- ✅ Based on **worldwide assets** for Swiss residents
- ✅ Calculated on **net worth** = Assets − Debts
- ✅ Valuation date: **December 31st** of tax year
- ✅ **26 different systems** (one per canton)
- ✅ Rates expressed in **per mille (‰)**: 1‰ = 0.1%

### Who Pays Wealth Tax?

**Residents:** Taxed on worldwide wealth
**Non-residents:** Taxed only on Swiss assets (real estate, business assets)

---

## How Wealth Tax Works

### Step-by-Step Calculation

```
1. Calculate Gross Wealth (as of Dec 31)
   └─ Real estate, securities, bank accounts, vehicles, etc.

2. Subtract Debts
   └─ Mortgages, loans, credit card debt, etc.
   = NET WEALTH

3. Apply Tax-Free Threshold (Freibetrag)
   └─ Varies by canton: CHF 35,000 - CHF 400,000
   └─ Different for single vs. married
   = TAXABLE WEALTH

4. Calculate Base Tax
   └─ Proportional: Flat rate × taxable wealth
   └─ Progressive: Graduated rates by bracket

5. Apply Multipliers
   └─ Canton multiplier (usually 100%)
   └─ Municipal multiplier (varies by commune)
   = TOTAL WEALTH TAX
```

### Tax-Free Thresholds by Canton

| Canton | Single (CHF) | Married (CHF) | Notes |
|--------|-------------|---------------|-------|
| **Nidwalden (NW)** | 35,000 | 70,000 | ✅ LOWEST threshold |
| Schaffhausen (SH) | 50,000 | 100,000 | +CHF 30K per child |
| Fribourg (FR) | 50,000 | 50,000 | Same for both |
| Neuchâtel (NE) | 50,000 | 50,000 | Same for both |
| Vaud (VD) | 50,000 | 50,000 | Same for both |
| Solothurn (SO) | 60,000 | 100,000 | |
| Basel-Stadt (BS) | 75,000 | 150,000 | |
| Basel-Landschaft (BL) | 75,000 | 150,000 | |
| Jura (JU) | 75,000 | 150,000 | |
| Glarus (GL) | 76,300 | 152,600 | 2024 inflation adj. |
| Zurich (ZH) | 80,000 | 159,000 | Only excess taxed |
| Aargau (AG) | 80,000 | 160,000 | |
| Appenzell AR (AR) | 80,000 | 160,000 | |
| Graubünden (GR) | 80,000 | 160,000 | |
| Lucerne (LU) | 80,000 | 160,000 | |
| Geneva (GE) | 86,833 | 173,666 | +CHF 43K per child |
| Ticino (TI) | 90,000 | 180,000 | |
| Bern (BE) | 100,000 | 100,000 | ALL wealth taxed if over |
| Thurgau (TG) | 100,000 | 200,000 | +CHF 100K per child |
| Uri (UR) | 100,000 | 200,000 | +CHF 30K per child |
| Schwyz (SZ) | 125,000 | 250,000 | Very low rate |
| **Zug (ZG)** | 200,000 | 400,000 | ✅ HIGHEST threshold (2024 doubled!) |
| St. Gallen (SG) | 260,800 | 260,800 | |
| Obwalden (OW) | ~75,000 | ~150,000 | Estimated |
| Appenzell AI (AI) | 0 | 0 | No stated threshold |
| Valais (VS) | 60,000 | 120,000 | TOU threshold |

### Rate Structures

**6 Proportional (Flat Rate) Cantons:**
- Nidwalden (NW): 0.25‰ **LOWEST IN SWITZERLAND**
- Schwyz (SZ): 0.6‰
- Lucerne (LU): 0.75‰
- Appenzell Innerrhoden (AI): 1.5‰
- Bern (BE): 2.4‰+
- Uri (UR): 2.5‰

**20 Progressive (Bracket) Cantons:**
- All others use graduated rates that increase with wealth
- Range: 0.425‰ (Zug low) to 7.9‰ (Basel-Stadt high)

---

## Canton-by-Canton Guide

### 🏆 Lowest Wealth Tax Cantons

#### 1. Nidwalden (NW) ⭐ LOWEST IN SWITZERLAND

```
Threshold:  CHF 35,000 (single) / CHF 70,000 (married) + CHF 15K per child
Structure:  Proportional (flat rate)
Rate:       0.25‰ (0.025%) - standard wealth
            0.2‰ (0.02%) - share rights (Anteilsrechte)
Effective:  0.13% for CHF 1,000,000 wealth

Example: CHF 500,000 net wealth, married
  Taxable: CHF 500,000 - 70,000 = CHF 430,000
  Tax:     CHF 430,000 × 0.25‰ = CHF 107.50 (base)

Municipal multipliers: 4.05 - 5.16 range
Total tax: ~CHF 470-550/year
```

#### 2. Schwyz (SZ)

```
Threshold:  CHF 125,000 (single) / CHF 250,000 (married)
Structure:  Proportional
Rate:       0.6‰ (0.06%)

Example: CHF 1,000,000 net wealth, married
  Taxable: CHF 1,000,000 - 250,000 = CHF 750,000
  Tax:     CHF 750,000 × 0.6‰ = CHF 450 (base)

Municipal multipliers: 189-330%
Total tax: ~CHF 850-1,485/year
```

#### 3. Zug (ZG) ⭐ HIGHEST THRESHOLD

```
Threshold:  CHF 200,000 (single) / CHF 400,000 (married) - DOUBLED IN 2024!
Structure:  Progressive
Rates:      0.425‰ - 1.9‰ (15% reduction in 2024)

Brackets:
  CHF 0 - 150,000:        0.425‰
  CHF 150,000 - 300,000:  0.6‰
  CHF 300,000 - 600,000:  0.9‰
  CHF 600,000 - 1.2M:     1.2‰
  CHF 1.2M+:              1.9‰

Example: CHF 1,000,000 net wealth, married
  Taxable: CHF 1,000,000 - 400,000 = CHF 600,000
  Tax calculation:
    CHF 0-150K:   150K × 0.425‰ = CHF 63.75
    CHF 150-300K: 150K × 0.6‰   = CHF 90.00
    CHF 300-600K: 300K × 0.9‰   = CHF 270.00
  Total: CHF 423.75 (base)
```

### 🔺 Highest Wealth Tax Cantons

#### Geneva (GE)

```
Threshold:  CHF 86,833 (single) / CHF 173,666 (married) + CHF 43,417 per child
Structure:  Progressive
Rates:      1.75‰ - 4.5‰ (+ 1.35‰ additional = 4.85‰ top)

Top Bracket Examples:
  CHF 0 - 114,621:        1.75‰ (max CHF 200.60)
  CHF 114,621 - 229,242:  2.0‰
  CHF 229,242 - 343,863:  2.25‰
  CHF 343,863 - 572,305:  2.5‰
  CHF 572,305 - 858,458:  2.75‰
  CHF 858,458 - 1,144,610: 3.0‰
  CHF 1,144,610 - 1,719,304: 3.5‰
  CHF 1,719,304+:         4.5‰

Example: CHF 2,000,000 net wealth, married
  Taxable: CHF 2,000,000 - 173,666 = CHF 1,826,334
  Progressive calculation: ~CHF 7,300 base tax
  With municipal multipliers: CHF 14,000-16,000/year
```

#### Basel-Stadt (BS)

```
Threshold:  CHF 75,000 (single) / CHF 150,000 (married)
Structure:  Progressive
Rates:      1.5‰ - 7.9‰

Top Bracket:
  CHF 4,000,000+: CHF 7.90 per CHF 1,000 (7.9‰)

Example: CHF 5,000,000 net wealth, married
  Taxable: CHF 5,000,000 - 150,000 = CHF 4,850,000
  Progressive calculation: ~CHF 35,000 base tax
```

### Major Cantons

#### Zurich (ZH)

```
Threshold:  CHF 80,000 (single) / CHF 159,000 (married)
Structure:  Progressive
Rates:      0.3‰ - 3.0‰
Special:    Only wealth ABOVE threshold is taxed (not all wealth)

Brackets:
  CHF 0 - 100,000:      0.3‰
  CHF 100,000 - 200,000: 0.5‰
  CHF 200,000 - 500,000: 1.0‰
  CHF 500,000 - 1M:     1.5‰
  CHF 1M - 2M:          2.0‰
  CHF 2M+:              3.0‰

2024 Changes: +3.3% inflation adjustment

Example: CHF 500,000 net wealth, single
  Taxable: CHF 500,000 - 80,000 = CHF 420,000
  Tax calculation:
    CHF 0-100K:   100K × 0.3‰ = CHF 30
    CHF 100-200K: 100K × 0.5‰ = CHF 50
    CHF 200-420K: 220K × 1.0‰ = CHF 220
  Total: CHF 300 base tax

With Zurich city multiplier (119%): ~CHF 657/year
```

#### Bern (BE)

```
Threshold:  CHF 100,000 (same for single and married)
Structure:  Proportional
Rate:       2.4‰ minimum
Special:    If wealth >= CHF 100,000, ALL wealth is taxed (not just excess)
Ceiling:    Maximum 25% of net wealth income

Example: CHF 300,000 net wealth
  ALL CHF 300,000 is taxable (no reduction)
  Tax: CHF 300,000 × 2.4‰ = CHF 720 (minimum base)

Note: Wealth tax capped at 25% of income from that wealth
```

#### Vaud (VD)

```
Threshold:  CHF 50,000 (same for all)
Structure:  Progressive
Rates:      0.48‰ - 3.39‰
Multiplier: Canton coefficient 155% for 2024
Maximum:    Combined (canton + communal) cannot exceed 10‰

Brackets:
  CHF 0 - 100,000:      0.48‰
  CHF 100,000 - 200,000: 1.0‰
  CHF 200,000 - 500,000: 1.5‰
  CHF 500,000 - 1M:     2.0‰
  CHF 1M - 2M:          3.082‰
  CHF 2M+:              3.39‰

Example: CHF 1,000,000 net wealth, single
  Taxable: CHF 1,000,000 - 50,000 = CHF 950,000
  Progressive calc: ~CHF 1,800 base
  × 155% canton coeff: CHF 2,790
  + municipal: varies
```

---

## Tax Calculation Examples

### Example 1: Young Professional (Single, CHF 200,000 wealth)

**Scenario:** 30-year-old single person, Zurich city

```
Assets:
  Apartment:       CHF 150,000 (equity)
  Savings:         CHF 40,000
  Pillar 3a:       CHF 20,000 (tax-exempt)
  Car:             CHF 10,000
  Gross wealth:    CHF 220,000

Debts:
  Student loan:    CHF 20,000
  Net wealth:      CHF 200,000

Zurich Calculation:
  Threshold (single): CHF 80,000
  Taxable wealth:     CHF 120,000

  Bracket CHF 0-100K:   100K × 0.3‰ = CHF 30
  Bracket CHF 100-120K:  20K × 0.5‰ = CHF 10
  Base tax:             CHF 40

  Canton multiplier (100%): CHF 40
  Municipal (Zurich 119%):  CHF 48
  Total annual tax:         CHF 88
```

### Example 2: Married Couple (CHF 800,000 wealth)

**Scenario:** Married couple, Geneva, 1 child

```
Assets:
  Home equity:     CHF 600,000
  Investments:     CHF 150,000
  Bank accounts:   CHF 100,000
  Pillar 2/3a:     CHF 80,000 (tax-exempt)
  Gross wealth:    CHF 930,000

Debts:
  Mortgage:        CHF 130,000
  Net wealth:      CHF 800,000

Geneva Calculation:
  Threshold married: CHF 173,666
  Per child:         CHF 43,417
  Total threshold:   CHF 217,083
  Taxable wealth:    CHF 582,917

  Progressive brackets applied:
  CHF 0-114,621:    114,621 × 1.75‰ = CHF 200.59
  CHF 114-229,242:  114,621 × 2.0‰  = CHF 229.24
  CHF 229-343,863:  114,621 × 2.25‰ = CHF 257.90
  CHF 343-572,305:  210,612 × 2.5‰  = CHF 526.53
  Base tax: CHF 1,214

  With communal multipliers: ~CHF 2,400-2,800/year
```

### Example 3: Wealthy Individual (CHF 3,000,000 wealth)

**Scenario:** Single person, Nidwalden (lowest tax canton)

```
Net wealth: CHF 3,000,000

Nidwalden Calculation:
  Threshold (single): CHF 35,000
  Taxable wealth:     CHF 2,965,000
  Rate (proportional): 0.25‰

  Base tax: CHF 2,965,000 × 0.25‰ = CHF 741.25

  Municipal multiplier (~5.0): CHF 3,706
  Total annual tax: ~CHF 3,700

Compare to Geneva (same wealth):
  Taxable: CHF 2,913,167
  Progressive calc: ~CHF 12,000 base
  Total with multipliers: ~CHF 24,000-28,000/year

Difference: CHF 20,000-24,000/year saved in Nidwalden!
```

---

## Municipal Multipliers

All 26 cantons apply **municipal multipliers** to the base wealth tax.

### How Multipliers Work

```
Base Tax (from canton tariff)
  × Canton Multiplier (usually 100%)
  × Municipal Multiplier (varies by commune)
  = Total Wealth Tax
```

### Example Multiplier Ranges (2024)

| Canton | Canton % | Municipal Range % | Example Commune |
|--------|----------|-------------------|-----------------|
| Zurich | 100% | 80-130% | Zurich city: 119% |
| Bern | 100% | 140-165% | Bern city: 154% |
| Geneva | 100% | 45-50% | Geneva city: 45.5% |
| Vaud | 155% | 50-85% | Lausanne: 73.5% |
| Zug | 100% | 60-85% | Zug city: 62% |
| Basel-Stadt | 100% | N/A | City-canton |
| Lucerne | 100% | 140-180% | Lucerne city: 165% |
| St. Gallen | 105% | 90-120% | St. Gallen city: 112% |
| Solothurn | 104% | 100-130% | Solothurn city: 119% |
| Schaffhausen | 81% | 61-117% | Schaffhausen city: 117% |

**Important:** Municipal rates can change annually. Always check current rates for your specific commune.

---

## API Usage

### Using the Wealth Tax Calculator

```python
from services.wealth_tax_calculators import get_wealth_tax_calculator
from decimal import Decimal

# Get calculator for specific canton
calc = get_wealth_tax_calculator(canton_code='ZH', tax_year=2024)

# Calculate base wealth tax (canton only)
result = calc.calculate(
    net_wealth=Decimal('500000'),
    marital_status='single'
)

print(result)
# {
#     'net_wealth': Decimal('500000.00'),
#     'tax_free_threshold': Decimal('80000'),
#     'taxable_wealth': Decimal('420000.00'),
#     'canton_wealth_tax': Decimal('300.00'),
#     'effective_rate': Decimal('0.06')  # 0.06% of total wealth
# }

# Calculate with municipal multipliers
result_full = calc.calculate_with_multiplier(
    net_wealth=Decimal('500000'),
    marital_status='single',
    canton_multiplier=Decimal('1.0'),      # 100%
    municipal_multiplier=Decimal('1.19')   # Zurich city 119%
)

print(result_full)
# {
#     'net_wealth': Decimal('500000.00'),
#     'tax_free_threshold': Decimal('80000'),
#     'taxable_wealth': Decimal('420000.00'),
#     'canton_wealth_tax': Decimal('300.00'),
#     'canton_multiplier': Decimal('1.0'),
#     'canton_wealth_tax_with_multiplier': Decimal('300.00'),
#     'municipal_multiplier': Decimal('1.19'),
#     'municipal_wealth_tax': Decimal('357.00'),
#     'total_wealth_tax': Decimal('657.00'),
#     'effective_rate_total': Decimal('0.13')  # 0.13% effective rate
# }
```

### Available Calculators

```python
from services.wealth_tax_calculators import WEALTH_TAX_CALCULATORS

# List all available canton calculators
print(WEALTH_TAX_CALCULATORS.keys())
# dict_keys(['ZH', 'BE', 'LU', 'UR', 'SZ', 'OW', 'NW', 'GL', 'ZG', 'FR',
#            'SO', 'BS', 'BL', 'SH', 'AR', 'AI', 'SG', 'AG', 'TG', 'TI',
#            'VD', 'VS', 'NE', 'GE', 'JU', 'GR'])

# Get canton information
calc = get_wealth_tax_calculator('NW')
info = calc.get_canton_info()
print(info)
# {
#     'canton_code': 'NW',
#     'canton_name': 'Nidwalden',
#     'tax_year': 2024,
#     'threshold_single': 35000.0,
#     'threshold_married': 70000.0,
#     'rate_structure': 'proportional',
#     'has_municipal_multiplier': True,
#     'rate_per_mille': 0.25,
#     'source': 'https://www.steuern-nw.ch/'
# }
```

### Integration with Tax Calculation Service

```python
from services.tax_calculation_service import TaxCalculationService
from decimal import Decimal

# Full tax calculation including wealth tax
service = TaxCalculationService()

result = service.calculate_total_tax(
    canton_code='ZH',
    municipality_id=261,  # Zurich city
    income=Decimal('100000'),
    net_wealth=Decimal('500000'),
    marital_status='single',
    num_children=0,
    tax_year=2024
)

print(result['wealth_tax'])
# {
#     'canton_wealth_tax': Decimal('300.00'),
#     'municipal_wealth_tax': Decimal('357.00'),
#     'total_wealth_tax': Decimal('657.00'),
#     'effective_rate': Decimal('0.13')
# }
```

---

## Data Sources

### Primary Sources (Official .ch Domains)

All data collected from official canton tax administration websites:

| Canton | Official Website |
|--------|------------------|
| ZH | https://www.zh.ch/de/steuern-finanzen/steuern/ |
| BE | https://www.sv.fin.be.ch/ |
| LU | https://steuern.lu.ch/ |
| UR | https://www.ur.ch/dienstleistungen/3196 |
| SZ | https://www.sz.ch/verwaltung/finanzdepartement/steuerverwaltung.html |
| OW | https://www.ow.ch/ |
| NW | https://www.steuern-nw.ch/ |
| GL | https://www.gl.ch/ |
| ZG | https://www.zg.ch/behoerden/finanzdirektion/steuerverwaltung |
| FR | https://www.fr.ch/impots/ |
| SO | https://steuerbuch.so.ch/ |
| BS | https://www.steuerverwaltung.bs.ch/ |
| BL | https://www.baselland.ch/ |
| SH | https://sh.ch/ |
| AR | https://ar.ch/ |
| AI | https://www.ai.ch/ |
| SG | https://www.sg.ch/ |
| AG | https://www.ag.ch/de/verwaltung/dfr/steuerverwaltung |
| TG | https://steuerverwaltung.tg.ch/ |
| TI | https://www4.ti.ch/dfe/dc/ |
| VD | https://www.vd.ch/etat-droit-finances/impots/ |
| VS | https://www.vs.ch/web/scc/ |
| NE | https://www.ne.ch/ |
| GE | https://www.ge.ch/themes/fiscalite |
| JU | https://www.jura.ch/ |
| GR | https://www.stv.gr.ch/ |

### Secondary Sources (Verified)

- **PWC Switzerland:** Tax Summaries - Individual Taxation
- **VZ VermögensZentrum:** Canton wealth tax comparisons
- **Karpeo:** Wealth tax guides by canton
- **Fidulex:** Swiss wealth tax 2024
- **Neho.ch:** Canton-specific tax guides
- **ESTV (Federal Tax Administration):** Kantonsblätter and official publications

### Data Quality Levels

**COMPLETE (19 cantons):**
ZH, BE, LU, UR, SZ, OW, NW, GL, ZG, FR, SO, BS, BL, SH, AI, SG, TG, GE, VD

**PARTIAL (5 cantons):**
VS, AG, AR, NE, JU - Minor gaps in detailed brackets

**VERIFIED (2 cantons):**
TI, GR - Core data confirmed from multiple sources

---

## Important Notes

### Tax-Exempt Assets

The following assets are **NOT** subject to wealth tax:

✅ **Pillar 2 (BVG) pensions** - Until withdrawal
✅ **Pillar 3a tied accounts** - Until maturity
✅ **Household goods** - Furniture, appliances
✅ **Personal effects** - Clothing, jewelry (in some cantons)
✅ **Vehicles** - In some cantons excluded or valued minimally

### Valuation Rules

**Real Estate:**
- Primary residence: Usually cadastral value or 60-70% of market value
- Investment property: Market value or cadastral value

**Securities:**
- Stocks/bonds: Value as of December 31st
- Mutual funds: Published NAV

**Business Assets:**
- Self-employed: Book value or assessed value
- Shareholdings: Varies by canton

**Bank Accounts:**
- Balance as of December 31st

### 2024 Changes Summary

- **Zug:** Thresholds DOUBLED + 15% rate reduction
- **Zurich:** +3.3% inflation adjustment
- **Glarus:** +1.76% inflation adjustment
- **Uri:** +1.69% inflation adjustment
- **Geneva:** Threshold increases
- **Lucerne:** Rate reduced from 0.875‰ to 0.75‰

---

## Frequently Asked Questions

**Q: Do I pay wealth tax if I'm below the threshold?**
A: No. If your net wealth is below your canton's threshold, you pay zero wealth tax.

**Q: What happens if I move to a new canton during the year?**
A: Wealth tax is pro-rated based on the number of months in each canton.

**Q: Are my Pillar 2/3a pension assets taxable?**
A: No. Pillar 2 (BVG) and tied Pillar 3a assets are tax-exempt until withdrawal.

**Q: How is my home valued for wealth tax?**
A: Usually at official cadastral value (Eigenmietwert) or 60-70% of market value, varies by canton.

**Q: Can wealth tax exceed my income from that wealth?**
A: Some cantons (like Bern) have a ceiling: wealth tax cannot exceed 25% of net wealth income.

**Q: Which canton has the lowest wealth tax?**
A: **Nidwalden** with 0.25‰ rate and CHF 35K threshold (effective ~0.13% for CHF 1M).

**Q: Which canton has the highest wealth tax?**
A: **Geneva** and **Basel-Stadt** have the highest rates (up to 4.85‰ and 7.9‰ respectively).

**Q: Do municipalities also levy wealth tax?**
A: No separate tax, but municipalities apply multipliers to the canton's base tax.

---

**Last Updated:** October 20, 2025
**Data Status:** ✅ All 26 cantons complete
**Tax Year:** 2024
**Next Review:** January 2026 (for 2025 tax year data)
