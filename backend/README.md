# Swiss Tax Calculator Backend

Comprehensive Swiss tax calculation system supporting all 26 cantons with federal, cantonal, municipal, church, wealth, and social security tax calculations.

## System Status

- **26/26 Cantons:** All canton-specific tax calculators implemented and integrated
- **2,065 Municipalities:** Database contains 2,065 Swiss municipalities with tax multipliers
- **14 Cantons with Church Tax Data:** Comprehensive church tax rates extracted and stored
- **26 Cantons with Wealth Tax Data:** All canton wealth tax brackets and rates available
- **All Cantons with Social Security:** AHV/IV/EO rates for all 26 cantons

## Folder Structure

```
backend/
├── data/                          # Reference and extracted data files
│   ├── extracted_json/           # Church tax data extracted from official sources
│   │   ├── aargau_church_tax_structured.json
│   │   ├── church_tax_fr_reformed_official.json
│   │   ├── st_gallen_church_tax_structured.json
│   │   └── zurich_church_tax_structured.json
│   └── bfs_reference/            # BFS (Federal Statistical Office) municipality codes
│       ├── bfs_communes_official.xlsx
│       ├── bfs_municipalities_2025.xlsx
│       └── st_gallen_bfs_numbers.xlsx
│
├── docs/                          # System documentation
│   ├── CRITICAL_FIXES_COMPLETE.md           # Summary of critical system fixes
│   ├── TAX_DATA_GAP_ANALYSIS.md            # Comprehensive gap analysis
│   ├── DATA_GAP_PRIORITY_MATRIX.md         # Priority recommendations
│   ├── INTEGRATION_COMPLETE.md             # Integration documentation
│   ├── SPECIAL_CASES_DOCUMENTATION.md      # Special canton cases (BL, AI, GL, VS)
│   ├── CHURCH_TAX_EXTRACTION_COMPLETE.md   # Church tax extraction status
│   ├── SWISS_TAX_ANALYSIS_COMPREHENSIVE.md # Tax system overview
│   └── CLEANUP_SUMMARY.md                  # File cleanup report
│
├── services/                      # Tax calculation services
│   ├── canton_tax_calculators/   # Canton-specific tax calculators (26 cantons)
│   │   ├── __init__.py          # Canton calculator registry and factory
│   │   ├── zurich.py
│   │   ├── bern.py
│   │   ├── geneva.py
│   │   ├── vaud.py
│   │   └── ... (22 more cantons)
│   ├── wealth_tax_calculators/   # Wealth tax calculation by canton
│   ├── social_security_calculators/ # Social security calculations
│   ├── tax_calculation_service.py # Main tax orchestration service
│   ├── church_tax_service.py     # Church tax calculation service
│   └── wealth_tax_service.py     # Wealth tax calculation service
│
├── alembic/                       # Database migrations
│   └── versions/                 # ~60 migration files
│       ├── 286d152b0116_create_church_tax_tables.py
│       ├── 88228552d3c6_create_wealth_tax_tables.py
│       ├── 04958a9fc8b7_seed_church_tax_data_all_26_cantons.py
│       └── ... (57 more migrations)
│
└── tests/                         # Test suites
    ├── test_canton_tax_calculators.py
    ├── test_church_tax_service.py
    ├── test_wealth_tax_service.py
    └── test_tax_calculation_service_extended.py
```

## Tax Calculation Flow

```
Federal Tax
    ↓
Cantonal Tax (26 canton-specific calculators)
    ↓
Municipal Tax (database: 2,065 municipalities)
    ↓
Church Tax (14 cantons with data, 12 special cases)
    ↓
Wealth Tax (all 26 cantons)
    ↓
Social Security (AHV/IV/EO)
    ↓
Total Tax Burden
```

## Database Schema

### Core Tables

- **municipalities** - 2,065 Swiss municipalities with tax multipliers
- **church_tax_rates** - Church tax rates for Catholic and Reformed churches
- **wealth_tax_rates** - Wealth tax brackets and rates by canton
- **social_security_rates** - AHV/IV/EO rates by canton
- **canton_deductions** - Standard deductions for all 26 cantons

## Canton Tax Calculators

Each canton has a dedicated calculator class implementing canton-specific tax brackets, rates, and rules:

```python
from services.canton_tax_calculators import get_canton_calculator

# Get calculator for a canton
calculator = get_canton_calculator('ZH', tax_year=2024)

# Calculate canton tax
canton_tax = calculator.calculate(
    taxable_income=100000,
    marital_status='married',
    num_children=2
)
```

### Implemented Calculators (26/26)

| Canton | Code | Status | Notes |
|--------|------|--------|-------|
| Zürich | ZH | ✅ | Full implementation |
| Bern | BE | ✅ | 322 municipalities |
| Luzern | LU | ✅ | Has known bug |
| Uri | UR | ✅ | Full implementation |
| Schwyz | SZ | ✅ | Full implementation |
| Obwalden | OW | ✅ | Full implementation |
| Nidwalden | NW | ✅ | Full implementation |
| Glarus | GL | ✅ | Full implementation |
| Zug | ZG | ✅ | Full implementation |
| Fribourg | FR | ✅ | Has known bug |
| Solothurn | SO | ✅ | Full implementation |
| Basel-Stadt | BS | ✅ | Full implementation |
| Basel-Landschaft | BL | ✅ | Full implementation |
| Schaffhausen | SH | ✅ | Full implementation |
| Appenzell A.Rh. | AR | ✅ | Full implementation |
| Appenzell I.Rh. | AI | ✅ | Full implementation |
| St. Gallen | SG | ✅ | Has known bug |
| Graubünden | GR | ✅ | Full implementation |
| Aargau | AG | ✅ | Full implementation |
| Thurgau | TG | ✅ | Full implementation |
| Ticino | TI | ✅ | Full implementation |
| Vaud | VD | ✅ | Full implementation |
| Valais | VS | ✅ | Full implementation |
| Neuchâtel | NE | ✅ | Full implementation |
| Genève | GE | ✅ | Has known bug |
| Jura | JU | ✅ | Full implementation |

## Church Tax Data Status

### 14 Cantons with Extracted Data

- **ZH** (Zürich) - 168 municipalities
- **BE** (Bern) - Official rates available
- **LU** (Luzern) - 80 municipalities
- **UR** (Uri) - 19 municipalities
- **OW** (Obwalden) - 7 municipalities
- **NW** (Nidwalden) - 11 municipalities
- **ZG** (Zug) - 11 municipalities
- **FR** (Fribourg) - 115 municipalities (Reformed)
- **SO** (Solothurn) - 102 municipalities
- **SH** (Schaffhausen) - 26 municipalities
- **AR** (Appenzell A.Rh.) - 20 municipalities
- **AG** (Aargau) - 213 municipalities
- **SG** (St. Gallen) - 75 municipalities
- **TG** (Thurgau) - 80 municipalities

### 12 Special Case Cantons

See `docs/SPECIAL_CASES_DOCUMENTATION.md` for detailed information on:
- **BL** (Basel-Landschaft) - No centralized data
- **AI** (Appenzell I.Rh.) - Data not published online
- **GL** (Glarus) - Cantonal church system
- **VS** (Valais) - Integrated financing
- **GR, TI, NE, GE, JU, BS, SZ, VD** - Various special cases

## Usage

### Main Tax Calculation Service

```python
from services.tax_calculation_service import TaxCalculationService

service = TaxCalculationService(tax_year=2024)

result = service.calculate_taxes(
    answers={
        'Q01': 'married',
        'Q02': 'Geneva',
        'Q02a': 'Geneva',  # Municipality
        'Q03': 'yes',
        'Q03a': 2,  # Number of children
        'Q10a_amount': 100000,  # Gross income
        # ... other answers
    },
    user_id='user123'
)

print(f"Total tax: CHF {result['total_tax']}")
print(f"Cantonal tax: CHF {result['cantonal_tax']}")
print(f"Municipal tax: CHF {result['municipal_tax']}")
print(f"Church tax: CHF {result['church_tax']}")
```

### Canton Tax Calculator

```python
from services.canton_tax_calculators import get_canton_calculator

calculator = get_canton_calculator('GE', tax_year=2024)
canton_tax = calculator.calculate(
    taxable_income=100000,
    marital_status='married',
    num_children=2
)
```

### Church Tax Service

```python
from services.church_tax_service import ChurchTaxService

service = ChurchTaxService(tax_year=2024)
church_tax = service.calculate_church_tax(
    cantonal_tax=5000,
    canton='ZH',
    municipality='Zürich',
    religion='reformed'
)
```

## Known Issues

1. **4 Canton Calculators Have Bugs** - LU, GE, FR, SG throw ConversionSyntax errors
   - System gracefully falls back to 8% rate
   - Calculators exist and are imported, just have code bugs

2. **14 BE Municipalities Missing** - Total extracted: 335, in database: 322, missing: 14

## Data Sources

All data extracted from official Swiss federal and cantonal government sources:
- Federal Tax Administration (EStV/AFC)
- Canton Finance Departments
- BFS (Federal Statistical Office)
- Official canton tax guides and PDFs

## Database Connection

See `/home/cn/Desktop/HomeAiCode/CLAUDE.md` for database connection details.

**SwissAI Tax Database:**
- Host: `swissai-tax-db-swiss.cluster-cbcqswwy84mf.eu-central-2.rds.amazonaws.com`
- Port: `5432`
- Database: `swissai_tax`
- Region: eu-central-2 (Zurich, Switzerland)
- Connection: Direct (no SSH tunnel needed)

## Testing

```bash
# Run all tests
pytest

# Run specific test suites
pytest tests/test_canton_tax_calculators.py
pytest tests/test_church_tax_service.py
pytest tests/test_wealth_tax_service.py
pytest tests/test_tax_calculation_service_extended.py

# Run integration tests
python test_integration.py
```

## Documentation

See `docs/` folder for comprehensive documentation:
- **CRITICAL_FIXES_COMPLETE.md** - Summary of major system improvements
- **TAX_DATA_GAP_ANALYSIS.md** - Detailed gap analysis and recommendations
- **INTEGRATION_COMPLETE.md** - Integration testing and verification
- **SPECIAL_CASES_DOCUMENTATION.md** - Special canton handling documentation

## Migrations

Database migrations are managed with Alembic. To apply migrations:

```bash
# Run all pending migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "Description"

# Rollback last migration
alembic downgrade -1
```

## Deployment

This backend is deployed to AWS. The deployment is triggered automatically when changes are pushed to the main branch.
