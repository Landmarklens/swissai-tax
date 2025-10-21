# SwissAI Tax System - Usage Guide

## Overview

This guide provides practical examples and code samples for using the SwissAI Tax calculation system.

**For:** Developers, QA engineers, integration partners
**Level:** Beginner to Advanced
**Tax Year:** 2024

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Common Use Cases](#common-use-cases)
3. [API Integration](#api-integration)
4. [Testing & Validation](#testing--validation)
5. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Basic Tax Calculation

```python
from services.tax_calculation_service import TaxCalculationService

# Initialize service
tax_service = TaxCalculationService()

# Calculate taxes for a session
result = tax_service.calculate_taxes(session_id="user_123")

# Access results
print(f"Total tax: CHF {result['total_tax']}")
print(f"Federal tax: CHF {result['federal_tax']}")
print(f"Canton tax: CHF {result['cantonal_tax']}")
print(f"Municipal tax: CHF {result['municipal_tax']}")
```

### Canton-Specific Calculation

```python
from services.canton_tax_calculators import get_canton_calculator
from decimal import Decimal

# Get Zurich calculator
calc = get_canton_calculator('ZH', tax_year=2024)

# Calculate tax
result = calc.calculate_with_multiplier(
    taxable_income=Decimal('85000'),
    marital_status='single',
    num_children=0,
    municipal_multiplier=Decimal('1.19')  # Zurich city
)

print(f"Total canton+municipal: CHF {result['total_cantonal_and_municipal']}")
print(f"Effective rate: {result['effective_rate']}%")
```

### Social Security Calculation

```python
from services.social_security_calculators import SocialSecurityCalculator
from decimal import Decimal

# Initialize
ss_calc = SocialSecurityCalculator(tax_year=2024)

# Calculate for employed person
result = ss_calc.calculate_employed(
    gross_salary=Decimal('85000'),
    age=35,
    work_percentage=Decimal('100')
)

print(f"Employee contributions: CHF {result['total_employee_contributions']}")
print(f"Tax deductible (BVG): CHF {result['tax_deductible_employee']}")
print(f"Net after SS: CHF {result['net_salary_after_contributions']}")
```

---

## Common Use Cases

### Use Case 1: Calculate Tax for Employed Person

**Scenario:** Single employee, CHF 85,000 salary, living in Zurich

```python
# Method 1: Via session (recommended)
tax_service = TaxCalculationService()
result = tax_service.calculate_taxes(session_id="emp_single_zh")

# Method 2: Programmatic
from decimal import Decimal

# Step 1: Calculate social security
ss_calc = SocialSecurityCalculator(tax_year=2024)
ss_result = ss_calc.calculate_employed(
    gross_salary=Decimal('85000'),
    age=35,
    work_percentage=Decimal('100')
)

# Step 2: Calculate deductions
deductions = {
    'professional': Decimal('2550'),  # 3% of 85,000
    'pillar_3a': Decimal('7056'),
    'health_insurance': Decimal('3600'),
    'bvg': ss_result['tax_deductible_employee']  # From SS
}
total_deductions = sum(deductions.values())

# Step 3: Calculate taxable income
taxable_income = Decimal('85000') - total_deductions

# Step 4: Calculate taxes
from services.federal_tax_calculator import FederalTaxCalculator

federal_calc = FederalTaxCalculator(tax_year=2024)
federal_tax = federal_calc.calculate_federal_tax(
    taxable_income=taxable_income,
    marital_status='single',
    num_children=0
)

canton_calc = get_canton_calculator('ZH', 2024)
canton_result = canton_calc.calculate_with_multiplier(
    taxable_income=taxable_income,
    marital_status='single',
    municipal_multiplier=Decimal('1.19')
)

total_tax = federal_tax + canton_result['total_cantonal_and_municipal']

print(f"Total tax liability: CHF {total_tax}")
```

### Use Case 2: Calculate Tax for Self-Employed

**Scenario:** Self-employed, CHF 95,000 net income

```python
from decimal import Decimal

# Income (already net after expenses)
net_income = Decimal('95000')

# Social security (self-employed)
ss_calc = SocialSecurityCalculator(tax_year=2024)
ss_result = ss_calc.calculate_self_employed(
    net_income=net_income,
    age=42
)

# AHV/IV/EO mandatory contribution
ahv_contribution = ss_result['ahv_iv_eo']['contribution']

# Deductions
pillar_3a = min(net_income * Decimal('0.20'), Decimal('35280'))
deductions = {
    'pillar_3a': pillar_3a,
    'health_insurance': Decimal('3600')
}
total_deductions = sum(deductions.values())

# Taxable income
taxable_income = net_income - total_deductions

# Calculate taxes
federal_calc = FederalTaxCalculator(tax_year=2024)
federal_tax = federal_calc.calculate_federal_tax(
    taxable_income=taxable_income,
    marital_status='single',
    num_children=0
)

# Add canton tax similarly...

print(f"AHV contribution (not deductible): CHF {ahv_contribution}")
print(f"Taxable income: CHF {taxable_income}")
print(f"Federal tax: CHF {federal_tax}")
```

### Use Case 3: Compare Tax Across Cantons

**Scenario:** Compare tax burden for same income in different cantons

```python
from decimal import Decimal

def calculate_canton_tax(canton_code, municipality_multiplier, taxable_income):
    """Calculate total canton+municipal tax"""
    calc = get_canton_calculator(canton_code, 2024)
    result = calc.calculate_with_multiplier(
        taxable_income=taxable_income,
        marital_status='single',
        num_children=0,
        municipal_multiplier=municipality_multiplier
    )
    return result['total_cantonal_and_municipal']

# Compare major cities
taxable_income = Decimal('85000')

cities = [
    ('ZH', 'Zurich', Decimal('1.19')),
    ('BE', 'Bern', Decimal('1.54')),
    ('GE', 'Geneva', Decimal('0.455')),  # Centimes
    ('BS', 'Basel', Decimal('0.915')),
    ('VD', 'Lausanne', Decimal('0.815'))
]

print(f"Canton tax comparison for CHF {taxable_income} taxable income:\n")
for code, city, multiplier in cities:
    tax = calculate_canton_tax(code, multiplier, taxable_income)
    print(f"{city} ({code}): CHF {tax:,.2f}")

# Output:
# Zurich (ZH): CHF 6,139.00
# Bern (BE): CHF 8,450.00
# Geneva (GE): CHF 7,850.00
# Basel (BS): CHF 6,200.00
# Lausanne (VD): CHF 5,100.00
```

### Use Case 4: Calculate Tax for Married Couple

**Scenario:** Married with 2 children, combined income CHF 150,000

```python
from decimal import Decimal

# Combined income
income = Decimal('150000')

# Combined deductions
deductions = {
    'professional': Decimal('4000'),  # Max
    'pillar_3a': Decimal('14112'),    # Both contribute
    'health_insurance': Decimal('7200'),  # Both
    'bvg': Decimal('12500'),          # Combined
    'children': Decimal('13200')       # 2 × 6,600
}
total_deductions = sum(deductions.values())

# Taxable income
taxable_income = income - total_deductions  # CHF 99,088

# Federal tax (married brackets)
federal_calc = FederalTaxCalculator(tax_year=2024)
federal_tax = federal_calc.calculate_federal_tax(
    taxable_income=taxable_income,
    marital_status='married',
    num_children=2
)

print(f"Taxable income: CHF {taxable_income}")
print(f"Federal tax: CHF {federal_tax}")
```

### Use Case 5: High Income with ALV Solidarity

**Scenario:** CHF 200,000 salary (above ALV ceiling)

```python
from decimal import Decimal

# Social security includes ALV solidarity
ss_calc = SocialSecurityCalculator(tax_year=2024)
ss_result = ss_calc.calculate_employed(
    gross_salary=Decimal('200000'),
    age=45,
    work_percentage=Decimal('100')
)

# Check ALV breakdown
alv = ss_result['alv']
print(f"ALV standard (up to CHF 148,200): CHF {alv['standard_contribution_employee']}")
print(f"ALV solidarity (above CHF 148,200): CHF {alv['solidarity_contribution_employee']}")
print(f"Total ALV: CHF {alv['employee_contribution']}")

# BVG at age 45 (15% rate)
bvg = ss_result['bvg']
print(f"BVG rate category: {bvg['age_category']}")  # age_45_54
print(f"BVG contribution: CHF {bvg['employee_contribution']}")
```

---

## API Integration

### Complete Tax Calculation API

```python
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.tax_calculation_service import TaxCalculationService

router = APIRouter()

class TaxCalculationRequest(BaseModel):
    session_id: str

class TaxCalculationResponse(BaseModel):
    total_tax: float
    federal_tax: float
    cantonal_tax: float
    municipal_tax: float
    social_security: dict
    income: dict
    deductions: dict
    taxable_income: float
    effective_rate: float

@router.post("/calculate-tax", response_model=TaxCalculationResponse)
async def calculate_tax(request: TaxCalculationRequest):
    """Calculate Swiss taxes for a session"""
    try:
        tax_service = TaxCalculationService()
        result = tax_service.calculate_taxes(request.session_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### Canton Tax Calculator API

```python
from decimal import Decimal
from pydantic import BaseModel

class CantonTaxRequest(BaseModel):
    canton: str
    taxable_income: float
    marital_status: str
    num_children: int
    municipal_multiplier: float

@router.post("/canton-tax")
async def calculate_canton_tax(request: CantonTaxRequest):
    """Calculate canton and municipal tax"""
    try:
        calc = get_canton_calculator(request.canton, 2024)
        result = calc.calculate_with_multiplier(
            taxable_income=Decimal(str(request.taxable_income)),
            marital_status=request.marital_status,
            num_children=request.num_children,
            municipal_multiplier=Decimal(str(request.municipal_multiplier))
        )
        return {
            'cantonal_tax': float(result['cantonal_tax']),
            'municipal_tax': float(result['municipal_tax']),
            'total': float(result['total_cantonal_and_municipal']),
            'effective_rate': float(result['effective_rate'])
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
```

### Social Security API

```python
class SocialSecurityRequest(BaseModel):
    gross_salary: float
    age: int
    work_percentage: float = 100.0

@router.post("/social-security")
async def calculate_social_security(request: SocialSecurityRequest):
    """Calculate social security contributions"""
    try:
        ss_calc = SocialSecurityCalculator(tax_year=2024)
        result = ss_calc.calculate_employed(
            gross_salary=Decimal(str(request.gross_salary)),
            age=request.age,
            work_percentage=Decimal(str(request.work_percentage))
        )

        # Get human-readable breakdown
        summary = ss_calc.get_breakdown_summary(result)

        return {
            'contributions': summary,
            'total_employee': float(result['total_employee_contributions']),
            'total_employer': float(result['total_employer_contributions']),
            'tax_deductible': float(result['tax_deductible_employee'])
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
```

---

## Testing & Validation

### Unit Tests

```python
import pytest
from decimal import Decimal
from services.tax_calculation_service import TaxCalculationService

def test_simple_employed_case():
    """Test tax calculation for employed person"""
    # Create mock session with answers
    session_id = "test_employed"

    # Calculate
    tax_service = TaxCalculationService()
    result = tax_service.calculate_taxes(session_id)

    # Assertions
    assert result['total_tax'] > 0
    assert result['federal_tax'] > 0
    assert result['cantonal_tax'] > 0
    assert 'social_security' in result
    assert result['social_security']['summary']['total_employee_contributions'] > 0

def test_zurich_canton_calculation():
    """Test Zurich canton tax"""
    calc = get_canton_calculator('ZH', 2024)
    result = calc.calculate_with_multiplier(
        taxable_income=Decimal('85000'),
        marital_status='single',
        municipal_multiplier=Decimal('1.19')
    )

    # Zurich-specific assertions
    assert result['total_cantonal_and_municipal'] > Decimal('6000')
    assert result['total_cantonal_and_municipal'] < Decimal('7000')
    assert result['effective_rate'] > Decimal('7.0')
    assert result['effective_rate'] < Decimal('8.0')

def test_social_security_employed():
    """Test social security for employed"""
    ss_calc = SocialSecurityCalculator(tax_year=2024)
    result = ss_calc.calculate_employed(
        gross_salary=Decimal('85000'),
        age=35,
        work_percentage=Decimal('100')
    )

    # Check all components calculated
    assert 'ahv_iv_eo' in result
    assert 'alv' in result
    assert 'uvg_nbu' in result
    assert 'bvg' in result

    # Check BVG age category
    assert result['bvg']['age_category'] == 'age_35_44'

    # Check tax deductible (BVG only)
    assert result['tax_deductible_employee'] == result['bvg']['employee_contribution']
```

### Integration Tests

```python
def test_full_tax_calculation_flow():
    """Test complete tax calculation from income to final tax"""
    # Setup test data
    answers = {
        'Q01': 'single',
        'Q03': 'no',
        'Q04': '1',
        'Q04a': 'employed',
        'income_employment': 85000,
        'age': 35,
        'work_percentage': 100,
        'canton': 'ZH',
        'municipality': 'Zürich'
    }

    # Calculate
    tax_service = TaxCalculationService()
    result = tax_service.calculate_taxes(session_id="integration_test")

    # Verify complete flow
    assert result['income']['total_income'] == 85000
    assert result['social_security']['summary']['total_employee_contributions'] > 0
    assert result['deductions']['total_deductions'] > 0
    assert result['taxable_income'] < result['income']['total_income']
    assert result['total_tax'] > 0

    # Verify breakdown
    expected_total = (
        result['federal_tax'] +
        result['cantonal_tax'] +
        result['municipal_tax']
    )
    assert abs(result['total_tax'] - expected_total) < 1.0  # Rounding tolerance
```

### Validation Against Official Calculators

```python
def test_validate_against_official_zurich():
    """Validate results against Zurich official calculator"""
    # Known values from official calculator
    # https://www.zh.ch/de/steuern-finanzen/steuern/steuerrechner.html

    calc = get_canton_calculator('ZH', 2024)
    result = calc.calculate_with_multiplier(
        taxable_income=Decimal('85000'),
        marital_status='single',
        num_children=0,
        municipal_multiplier=Decimal('1.19')
    )

    # Official calculator result: CHF 6,139 (±5 CHF tolerance)
    official_result = Decimal('6139')
    tolerance = Decimal('5')

    assert abs(result['total_cantonal_and_municipal'] - official_result) <= tolerance
```

---

## Troubleshooting

### Common Issues

#### Issue 1: Canton Calculator Not Found

**Error:**
```
ValueError: No calculator available for canton XX
```

**Solution:**
```python
# Check canton code is valid (2-letter)
from services.canton_tax_calculators import CANTON_CALCULATORS

print("Available cantons:", CANTON_CALCULATORS.keys())

# Correct usage
calc = get_canton_calculator('ZH', 2024)  # Correct
calc = get_canton_calculator('Zurich', 2024)  # Wrong - use 'ZH'
```

#### Issue 2: Municipality Multiplier Not Found

**Error:**
```
Municipality 'X' not found for canton 'Y'
```

**Solution:**
```python
# Query database for correct municipality name
from database.connection import execute_query

query = """
    SELECT name, tax_multiplier
    FROM swisstax.municipalities
    WHERE canton = %s AND tax_year = 2024
    ORDER BY name
"""
municipalities = execute_query(query, ('ZH',))

for muni in municipalities:
    print(f"{muni['name']}: {muni['tax_multiplier']}")
```

#### Issue 3: Social Security Age Category

**Error:**
```
BVG not calculated - age not provided
```

**Solution:**
```python
# Ensure age is provided
result = ss_calc.calculate_employed(
    gross_salary=Decimal('85000'),
    age=35,  # Required for BVG!
    work_percentage=Decimal('100')
)

# Check if BVG applicable
if result['bvg']['is_mandatory']:
    print(f"BVG calculated: CHF {result['bvg']['employee_contribution']}")
else:
    print(f"BVG not mandatory: {result['bvg'].get('note', 'N/A')}")
```

#### Issue 4: Decimal vs Float

**Error:**
```
TypeError: unsupported operand type(s) for *: 'Decimal' and 'float'
```

**Solution:**
```python
# Always use Decimal for financial calculations
from decimal import Decimal

# Wrong
result = calc.calculate(85000, 'single', 0)  # Uses float

# Correct
result = calc.calculate(Decimal('85000'), 'single', 0)

# Or convert
salary = 85000
result = calc.calculate(Decimal(str(salary)), 'single', 0)
```

---

## Best Practices

### 1. Always Use Decimal for Money

```python
from decimal import Decimal

# Good
amount = Decimal('85000.00')
rate = Decimal('0.053')
result = amount * rate

# Bad
amount = 85000.0  # Float precision issues
rate = 0.053
result = amount * rate
```

### 2. Handle Canton-Specific Logic

```python
# Check canton type before calculation
canton_code = 'VD'

if canton_code == 'VD':
    # Vaud uses family quotient
    calc = get_canton_calculator('VD', 2024)
    # Must provide num_children for accurate calculation
    result = calc.calculate(
        taxable_income=Decimal('90000'),
        marital_status='married',
        num_children=2  # Important for VD!
    )
```

### 3. Cache Calculator Instances

```python
# Good - reuse calculator
calc = get_canton_calculator('ZH', 2024)
for income in [50000, 75000, 100000]:
    result = calc.calculate_with_multiplier(
        taxable_income=Decimal(str(income)),
        marital_status='single',
        municipal_multiplier=Decimal('1.19')
    )

# Bad - recreate every time
for income in [50000, 75000, 100000]:
    calc = get_canton_calculator('ZH', 2024)  # Wasteful
    result = calc.calculate_with_multiplier(...)
```

### 4. Validate Input Data

```python
def validate_tax_inputs(canton, income, marital_status):
    """Validate inputs before calculation"""
    # Canton exists
    if canton not in CANTON_CALCULATORS:
        raise ValueError(f"Invalid canton: {canton}")

    # Income positive
    if income <= 0:
        raise ValueError("Income must be positive")

    # Marital status valid
    if marital_status not in ['single', 'married']:
        raise ValueError("Marital status must be 'single' or 'married'")

    return True
```

---

**Version:** 1.0
**Last Updated:** October 20, 2025
**For Questions:** See main README.md
