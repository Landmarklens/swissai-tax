# Quick Reference - ECH0196 PDF Generator Tests

## Quick Stats
- **Coverage**: 100% (218/218 lines)
- **Tests**: 35 tests, all passing
- **Execution Time**: ~3 seconds
- **Test File**: `tests/test_ech0196_pdf_generator_extended.py`

## Run Commands

### Run Tests
```bash
cd backend
python -m pytest tests/test_ech0196_pdf_generator_extended.py -v
```

### Run with Coverage
```bash
cd backend
PYTHONPATH=/home/cn/Desktop/HomeAiCode/swissai-tax/backend \
python -m coverage run -m pytest tests/test_ech0196_pdf_generator_extended.py -v
python -m coverage report --include="*/ech0196_pdf_generator.py"
```

### Run Specific Test Class
```bash
python -m pytest tests/test_ech0196_pdf_generator_extended.py::TestECH0196PDFGeneratorGenerate -v
```

### Run Specific Test
```bash
python -m pytest tests/test_ech0196_pdf_generator_extended.py::TestECH0196PDFGeneratorGenerate::test_generate_returns_bytesio -v
```

## Test Classes

1. `TestECH0196PDFGeneratorInit` - Initialization (3 tests)
2. `TestECH0196PDFGeneratorGenerate` - Main generate method (4 tests)
3. `TestECH0196PDFGeneratorCoverSheet` - Cover page (5 tests)
4. `TestECH0196PDFGeneratorIncomeSection` - Income section (3 tests)
5. `TestECH0196PDFGeneratorDeductionsSection` - Deductions (2 tests)
6. `TestECH0196PDFGeneratorTaxSummary` - Tax summary (4 tests)
7. `TestECH0196PDFGeneratorDocumentsIndex` - Documents page (2 tests)
8. `TestECH0196PDFGeneratorBarcodePage` - Barcode page (4 tests)
9. `TestECH0196PDFGeneratorTranslations` - Translations (3 tests)
10. `TestECH0196PDFGeneratorCantonName` - Canton names (1 test)
11. `TestECH0196PDFGeneratorIntegration` - Integration (2 tests)
12. `TestECH0196PDFGeneratorEdgeCases` - Edge cases (2 tests)

## Coverage Achievement

**Before**: 12% coverage (26/218 lines)
**After**: 100% coverage (218/218 lines)
**Improvement**: +88 percentage points

## Files
- Test file: `backend/tests/test_ech0196_pdf_generator_extended.py`
- Summary: `backend/tests/TEST_COVERAGE_SUMMARY_ECH0196_PDF_GENERATOR.md`
- This file: `backend/tests/QUICK_REFERENCE_ECH0196_TESTS.md`
