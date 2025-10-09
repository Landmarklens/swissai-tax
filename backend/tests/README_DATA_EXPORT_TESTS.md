# Data Export Service Tests - Quick Reference

## Running the Tests

### Run all data export service tests
```bash
python -m pytest tests/test_data_export_service_extended.py -v
```

### Run with coverage report
```bash
python -m pytest tests/test_data_export_service_extended.py -v --cov=services.data_export_service --cov-report=term-missing
```

### Run specific test
```bash
python -m pytest tests/test_data_export_service_extended.py::TestDataExportServiceExtended::test_generate_export_json_success -v
```

### Run all tests in quiet mode
```bash
python -m pytest tests/test_data_export_service_extended.py -q
```

### Generate HTML coverage report
```bash
python -m pytest tests/test_data_export_service_extended.py --cov=services.data_export_service --cov-report=html
# Open htmlcov/index.html in browser
```

## Test Coverage

- **Current Coverage**: 100% (155/155 lines)
- **Number of Tests**: 36
- **Execution Time**: ~0.73 seconds
- **Status**: All Passing ✓

## Test Categories

1. **Request Export** (4 tests) - Export request creation
2. **Data Collection** (5 tests) - User data gathering
3. **Serialization** (5 tests) - Data formatting
4. **JSON Export** (2 tests) - JSON generation
5. **CSV Export** (2 tests) - CSV generation
6. **Full Export Process** (9 tests) - End-to-end export
7. **Get Exports** (3 tests) - Listing user exports
8. **Cleanup** (4 tests) - Expired export removal
9. **Initialization** (1 test) - Service setup

## Key Features Tested

- ✓ JSON and CSV export formats
- ✓ User data collection from all tables
- ✓ S3 upload and download URL generation
- ✓ Email notifications
- ✓ Error handling and edge cases
- ✓ Expired export cleanup
- ✓ Database operations (mocked)
- ✓ No real S3 or database connections

## Example Test Output

```
============================== test session starts ==============================
collected 36 items

tests/test_data_export_service_extended.py::TestDataExportServiceExtended::test_request_export_json_success PASSED
tests/test_data_export_service_extended.py::TestDataExportServiceExtended::test_request_export_csv_success PASSED
[... 34 more tests ...]

================================ tests coverage ================================
Name                              Stmts   Miss  Cover
-----------------------------------------------------
services/data_export_service.py     155      0   100%
-----------------------------------------------------
TOTAL                               155      0   100%
============================== 36 passed in 0.73s ==============================
```

## Continuous Integration

Add to your CI pipeline:

```yaml
# Example for GitHub Actions
- name: Run Data Export Tests
  run: |
    cd backend
    python -m pytest tests/test_data_export_service_extended.py -v --cov=services.data_export_service --cov-fail-under=90
```

## Troubleshooting

### Tests fail due to imports
Ensure you're in the backend directory:
```bash
cd /home/cn/Desktop/HomeAiCode/swissai-tax/backend
python -m pytest tests/test_data_export_service_extended.py
```

### Coverage not showing 100%
Make sure you're only measuring the data_export_service:
```bash
python -m pytest tests/test_data_export_service_extended.py --cov=services.data_export_service --cov-report=term-missing
```

### Tests running slow
Tests should complete in under 2 seconds. If slower, check for:
- Real database connections (should be mocked)
- Real S3 operations (should be mocked)
- Real email sending (should be mocked)

## Contact

For questions about these tests, refer to:
- Test file: `/home/cn/Desktop/HomeAiCode/swissai-tax/backend/tests/test_data_export_service_extended.py`
- Service file: `/home/cn/Desktop/HomeAiCode/swissai-tax/backend/services/data_export_service.py`
- Coverage report: `/home/cn/Desktop/HomeAiCode/swissai-tax/backend/TEST_COVERAGE_REPORT_DATA_EXPORT.md`
