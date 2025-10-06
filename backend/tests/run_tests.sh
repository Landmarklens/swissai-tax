#!/bin/bash
# Test runner script for SwissAI Tax backend
# Run all unit tests with coverage report

echo "========================================"
echo "SwissAI Tax Backend - Test Suite"
echo "========================================"
echo ""

# Check if pytest is installed
if ! command -v pytest &> /dev/null; then
    echo "ERROR: pytest not found. Installing..."
    pip install pytest pytest-cov pytest-mock
fi

# Change to backend directory
cd "$(dirname "$0")/.." || exit

echo "Running tests with coverage..."
echo ""

# Run all tests with coverage
pytest tests/ \
    -v \
    --cov=services \
    --cov=routers \
    --cov-report=term-missing \
    --cov-report=html \
    --tb=short \
    "$@"

TEST_EXIT_CODE=$?

echo ""
echo "========================================"
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "✅ All tests passed!"
    echo "Coverage report: backend/htmlcov/index.html"
else
    echo "❌ Some tests failed (exit code: $TEST_EXIT_CODE)"
fi
echo "========================================"

exit $TEST_EXIT_CODE
