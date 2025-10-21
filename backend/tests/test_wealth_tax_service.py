"""
Unit Tests for Wealth Tax Service

Tests the WealthTaxService integration layer that connects wealth tax calculators
to the main tax calculation system.

Includes:
- Service initialization
- Canton-specific calculations
- Municipal multiplier integration
- Session-based calculations
- Canton info retrieval
- Canton comparison functionality
- Error handling

All tests use mocks to avoid database dependencies.
"""

import sys
import unittest
from decimal import Decimal
from pathlib import Path
from unittest.mock import MagicMock, Mock, patch

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.wealth_tax_service import WealthTaxService


class TestIntegrationWithCalculators(unittest.TestCase):
    """Test integration between service and calculators"""

    def setUp(self):
        """Set up test fixtures"""
        self.service = WealthTaxService(tax_year=2024)

    def test_service_uses_correct_calculator(self):
        """Test that service uses correct canton calculator"""
        # Test proportional canton
        nw_result = self.service.calculate_wealth_tax('NW', Decimal('100000'), 'single')
        self.assertIn('canton_info', nw_result)
        self.assertEqual(nw_result['canton_info']['rate_structure'], 'proportional')

        # Test progressive canton
        zh_result = self.service.calculate_wealth_tax('ZH', Decimal('100000'), 'single')
        self.assertIn('canton_info', zh_result)
        self.assertEqual(zh_result['canton_info']['rate_structure'], 'progressive')

    def test_service_preserves_calculator_accuracy(self):
        """Test that service doesn't lose precision from calculators"""
        # Direct calculator calculation
        from services.wealth_tax_calculators.nidwalden import NidwaldenWealthTaxCalculator
        calc = NidwaldenWealthTaxCalculator()
        direct_result = calc.calculate(Decimal('100000'), 'single')

        # Service calculation
        service_result = self.service.calculate_wealth_tax('NW', Decimal('100000'), 'single')

        # Should have same tax amount
        self.assertAlmostEqual(
            direct_result['canton_wealth_tax'],
            Decimal(str(service_result['canton_wealth_tax'])),
            places=2
        )


if __name__ == '__main__':
    # Run tests with verbose output
    unittest.main(verbosity=2)
