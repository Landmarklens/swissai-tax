# Church Tax (Kirchensteuer) - Swiss Tax System

## Overview

Church tax (Kirchensteuer/Impôt ecclésiastique) is an optional tax levied by 22 out of 26 Swiss cantons to fund recognized religious institutions. It is calculated as a percentage of cantonal income tax and varies by canton, municipality, and religious denomination.

## Key Characteristics

### Cantons with Church Tax (22 cantons)
- **ZH** (Zurich), **BE** (Bern), **LU** (Lucerne), **UR** (Uri), **SZ** (Schwyz)
- **OW** (Obwalden), **NW** (Nidwalden), **GL** (Glarus), **ZG** (Zug)
- **FR** (Fribourg), **SO** (Solothurn), **BS** (Basel-Stadt), **BL** (Basel-Landschaft)
- **SH** (Schaffhausen), **AR** (Appenzell Ausserrhoden), **AI** (Appenzell Innerrhoden)
- **SG** (St. Gallen), **GR** (Graubünden), **AG** (Aargau), **TG** (Thurgau)
- **VS** (Valais), **JU** (Jura)

### Cantons WITHOUT Church Tax (4 cantons)
- **GE** (Geneva) - Voluntary contributions only
- **NE** (Neuchâtel) - Voluntary contributions only
- **VD** (Vaud) - State covers church costs from general taxes
- **TI** (Ticino) - No mandatory church tax (optional in 40/247 municipalities)

## Calculation Method

```
Church Tax = Cantonal Tax × Church Tax Rate
```

**Important:** Church tax is calculated as a percentage of **cantonal tax**, NOT as a percentage of income.

### Example Calculation
```
Income: CHF 100,000
Cantonal Tax (before multipliers): CHF 5,000
Church Tax Rate (Zurich, Catholic): 13% (0.13)

Church Tax = CHF 5,000 × 0.13 = CHF 650
```

## Recognized Denominations

### Most Common (supported in most cantons)
- **Catholic** (Römisch-Katholisch)
- **Reformed** (Evangelisch-Reformiert / Protestant)

### Additional Denominations (canton-specific)
- **Christian Catholic** (Christkatholisch) - ZH, BS, SG, ZG
- **Jewish** (Israelitisch) - BS only

## Rate Ranges by Canton

### Highest Rates
1. **Bern (BE)** - HIGHEST in Switzerland
   - Catholic: 20.7%
   - Reformed: 18.4%

2. **Lucerne (LU)**
   - Both denominations: Up to 45% (municipality-dependent)
   - Average: 25%

### Lowest Rates
1. **Zug (ZG)** - Low-tax canton
   - Catholic: 7-10%
   - Reformed: 7-10%

2. **Basel-Stadt (BS)** - Uniform across canton
   - All denominations: 8% (simplest system)

### Typical Range
Most cantons: 10-16% of cantonal tax

## Special Cases

### Basel-Stadt (BS) - Uniform Rate
- **Only canton** with uniform rate across all municipalities
- **8%** for all denominations (Catholic, Reformed, Christian Catholic, Jewish)
- Simplest church tax system in Switzerland

### Bern (BE) - Highest Rates
- Has the **highest church tax rates** in the country
- Catholic: 20.7%, Reformed: 18.4%
- Rates may vary by municipality (data needed)

### Appenzell Ausserrhoden (AR) - Unique Pattern
- **Only canton** where Reformed rates > Catholic rates
- Opposite of the typical Swiss pattern
- Catholic: ~10%, Reformed: ~11.5%

### St. Gallen (SG) - Christian Catholic Uniform
- Christian Catholic: **24% uniform** across entire canton
- Catholic and Reformed: Vary by municipality (12-15%)

### Valais (VS) - Limited Application
- Only **3 municipalities** levy separate church tax:
  - Saxon
  - Sion
  - Törbel
- Most municipalities: Canton-level average applies

## Municipality-Level Implementation

### Complete Municipality Data Available (3 cantons)
1. **Zurich (ZH)** - 160 municipalities, 480 records
   - Catholic, Reformed, Christian Catholic rates
   - Source: https://www.zh.ch/de/steuern-finanzen/steuern/kirchensteuer.html

2. **Bern (BE)** - 324 municipalities, 648 records
   - Catholic and Reformed rates
   - Source: https://www.sv.fin.be.ch/

3. **Lucerne (LU)** - 80 municipalities, 160 records
   - Catholic and Reformed rates
   - Rates vary significantly (18.4% - 45%)
   - Source: https://steuern.lu.ch/

### Canton-Level Averages (19 cantons)
For cantons without municipality-level data, canton-average rates are used as fallback.

## Database Schema

### Table: `church_tax_config`
Canton-level configuration for all 26 cantons.

```sql
CREATE TABLE swisstax.church_tax_config (
    id INTEGER PRIMARY KEY,
    canton VARCHAR(2) NOT NULL,
    has_church_tax BOOLEAN NOT NULL,
    recognized_denominations TEXT[],
    calculation_method VARCHAR(50),
    tax_year INTEGER NOT NULL,
    notes TEXT,
    official_source TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(canton, tax_year)
);
```

### Table: `church_tax_rates`
Municipality and canton-level tax rates.

```sql
CREATE TABLE swisstax.church_tax_rates (
    id INTEGER PRIMARY KEY,
    canton VARCHAR(2) NOT NULL,
    municipality_id INTEGER,           -- NULL for canton-level rates
    municipality_name VARCHAR(100),
    denomination VARCHAR(50) NOT NULL,
    rate_percentage NUMERIC(5,4) NOT NULL,
    tax_year INTEGER NOT NULL,
    source VARCHAR(50),                -- 'official_parish', 'canton_average', 'estimated'
    parish_name TEXT,
    official_source TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(canton, municipality_id, denomination, tax_year)
);
```

## ChurchTaxService API

### Calculate Church Tax

```python
from services.church_tax_service import ChurchTaxService
from decimal import Decimal

service = ChurchTaxService(tax_year=2024)

result = service.calculate_church_tax(
    canton_code='ZH',
    cantonal_tax=Decimal('10000'),
    denomination='catholic',
    municipality_id=261  # Optional: Zurich city
)

# Result:
{
    'applies': True,
    'canton': 'ZH',
    'denomination': 'catholic',
    'cantonal_tax': 10000.0,
    'rate_percentage': 0.084,
    'church_tax': 840.0,
    'municipality_id': 261,
    'municipality_name': 'Zürich',
    'source': 'official_parish',
    'official_source': 'https://www.zh.ch/...',
    'canton_info': {...}
}
```

### Get Canton Information

```python
info = service.get_canton_info('BE')

# Result:
{
    'canton': 'BE',
    'has_church_tax': True,
    'recognized_denominations': ['catholic', 'reformed', 'christian_catholic'],
    'rates': {
        'catholic': {'rate_percentage': 0.207, 'source': 'official_canton'},
        'reformed': {'rate_percentage': 0.184, 'source': 'official_canton'}
    },
    'calculation_method': 'percentage_of_cantonal_tax',
    'notes': 'HIGHEST in Switzerland! Catholic 20.7%, Reformed 18.4%',
    'official_source': 'https://www.sv.fin.be.ch/'
}
```

### Check Applicability

```python
# Check if church tax applies
applies = service.is_church_tax_applicable('ZH', 'catholic')  # True
applies = service.is_church_tax_applicable('GE', 'catholic')  # False (Geneva no tax)
applies = service.is_church_tax_applicable('ZH', 'none')      # False (not member)
```

### Compare Cantons

```python
comparison = service.compare_cantons(
    cantonal_tax=Decimal('10000'),
    denomination='catholic',
    canton_codes=['ZH', 'BE', 'GE', 'BS', 'ZG']
)

# Result shows church tax amounts across cantons
```

## Integration with TaxCalculationService

The church tax is automatically integrated into the main tax calculation service:

```python
from services.tax_calculation_service import TaxCalculationService

service = TaxCalculationService()
result = service.calculate_taxes(session_id)

# Result includes church_tax breakdown:
{
    'federal_tax': 8500.0,
    'cantonal_tax': 12000.0,
    'municipal_tax': 4800.0,
    'church_tax': {
        'applies': True,
        'canton': 'ZH',
        'denomination': 'catholic',
        'church_tax': 1560.0,
        'rate_percentage': 0.13,
        'municipality_name': 'Zürich',
        'source': 'official_parish'
    },
    'total_tax': 26860.0
}
```

## User Interview Questions

To calculate church tax, the following questions must be answered:

### Required Questions
1. **pays_church_tax** (boolean)
   - "Do you pay church tax?"
   - If False, church tax = 0

2. **religious_denomination** (string)
   - Options: 'catholic', 'reformed', 'christian_catholic', 'jewish', 'none'
   - Only asked if pays_church_tax = True

### Optional (for accuracy)
3. **municipality_id** (integer)
   - BFS municipality number
   - Enables municipality-specific rates
   - Falls back to canton average if not provided

## Official Data Sources

All data is sourced from official .ch government domains:

### Canton Sources
- **Zurich**: https://www.zh.ch/de/steuern-finanzen/steuern/kirchensteuer.html
- **Bern**: https://www.sv.fin.be.ch/
- **Lucerne**: https://steuern.lu.ch/
- **Aargau**: https://www.ag.ch/ (via official PDF)
- **St. Gallen**: https://www.sg.ch/ (via official PDF)
- **Basel-Stadt**: https://www.steuerverwaltung.bs.ch/
- **All others**: Official canton tax administration websites

### BFS Municipality Registry
- Swiss Federal Statistical Office
- https://www.bfs.admin.ch/
- Used for BFS number validation and municipality mapping

## Testing

### Run Church Tax Tests
```bash
pytest tests/test_church_tax_service.py -v
```

### Test Coverage
- 28 comprehensive tests
- All 26 cantons covered
- Municipality-level accuracy verified
- Edge cases and error handling tested

### Key Test Scenarios
1. Canton with church tax (ZH, BE, LU)
2. Canton without church tax (GE, NE, VD, TI)
3. Municipality-specific rates vs. canton averages
4. All recognized denominations
5. Special cases (BS uniform, BE highest, AR unique pattern)
6. User not church member
7. Denomination not recognized in canton

## Migration Files

### Database Migrations
1. **286d152b0116_create_church_tax_tables.py**
   - Creates church_tax_config and church_tax_rates tables
   - Creates indexes for fast lookups

2. **04958a9fc8b7_seed_church_tax_data_all_26_cantons.py**
   - Seeds canton-level configuration for all 26 cantons
   - Seeds canton-average rates for 22 cantons with church tax

3. **fdae9c789348_seed_lucerne_municipalities.py**
   - Seeds 80 Lucerne municipalities (160 records)

4. **consolidated_municipalities_seed_all_municipality_church_tax_data.py**
   - Consolidated migration for all municipalities
   - Zurich: 160 municipalities (480 records)
   - Bern: 324 municipalities (648 records)
   - Lucerne: 80 municipalities (160 records)
   - **Total: 1,288 municipality-level records**

### Apply Migrations
```bash
alembic upgrade head
```

### Verify Data
```bash
python3 -c "
from database.connection import execute_query
result = execute_query('SELECT COUNT(*) as count FROM swisstax.church_tax_rates')
print(f'Total records: {result[0][\"count\"]}')
"
```

## Rate Comparison Table

| Canton | Catholic | Reformed | Christian Catholic | Notes |
|--------|----------|----------|-------------------|-------|
| ZH | 13% avg | 12% avg | Varies | 160 municipalities |
| BE | 20.7% | 18.4% | - | HIGHEST rates |
| LU | 25% avg | 25% avg | - | Up to 45% in some municipalities |
| BS | 8% | 8% | 8% | Uniform across canton |
| ZG | 8.5% | 8% | - | Low-tax canton |
| SG | 14% avg | 13% avg | 24% uniform | Christian Catholic uniform |
| AR | 10% | 11.5% | - | Reformed > Catholic (unique) |
| GE | 0% | 0% | - | No church tax |
| NE | 0% | 0% | - | No church tax |
| VD | 0% | 0% | - | No church tax |
| TI | 0% | 0% | - | No church tax |

## Best Practices

### For Developers
1. **Always use ChurchTaxService** - Don't calculate church tax manually
2. **Provide municipality_id when available** - Ensures accurate rates
3. **Check denomination** - Verify denomination is recognized in canton
4. **Handle fallbacks** - Service automatically falls back to canton average if municipality not found
5. **Test with real data** - Use official BFS municipality numbers

### For Users
1. **Accurate denomination** - Select correct religious denomination
2. **Municipality matters** - Rates can vary significantly within cantons
3. **Optional but impactful** - Church tax is optional but can be 10-20% of cantonal tax
4. **Canton-specific** - Check if your canton levies church tax

## Future Enhancements

### Phase 2: Additional Cantons
- Extract municipality data for remaining 19 cantons
- Priority: AG, SG, TG, FR, SO (PDFs available)

### Phase 3: Multi-Year Support
- Add 2025 tax year data
- Historical data for tax comparisons

### Phase 4: Legal Entity Church Tax
- Some cantons tax legal entities (TG, GR, JU)
- Implement company church tax logic

### Phase 5: Parish Mapping
- Complex parish structures (ZH has 74 parishes)
- Map municipalities to specific parishes
- Handle multi-parish municipalities

## Support and Resources

### Documentation
- This guide: `/backend/tax_documentation/08_CHURCH_TAX.md`
- Service code: `/backend/services/church_tax_service.py`
- Tests: `/backend/tests/test_church_tax_service.py`

### External Resources
- [Swiss Federal Tax Administration](https://www.estv.admin.ch/)
- [Canton Tax Administration Websites](https://www.ch.ch/)
- [BFS Municipality Registry](https://www.bfs.admin.ch/)

### Contact
For questions about church tax implementation, consult:
1. This documentation
2. Test file examples
3. Official canton tax authorities

---

**Last Updated:** October 20, 2025
**Tax Year:** 2024
**Version:** 1.0
**Status:** ✅ Production Ready
