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


class TestWealthTaxService(unittest.TestCase):
    """Test suite for WealthTaxService"""

    def setUp(self):
        """Set up test fixtures"""
        self.service = WealthTaxService(tax_year=2024)

    def test_service_initialization(self):
        """Test WealthTaxService initialization"""
        self.assertEqual(self.service.tax_year, 2024)

    def test_calculate_wealth_tax_zurich_single(self):
        """Test wealth tax calculation for Zurich, single taxpayer"""
        result = self.service.calculate_wealth_tax(
            canton_code='ZH',
            net_wealth=Decimal('500000'),
            marital_status='single'
        )

        self.assertIn('total_wealth_tax', result)
        self.assertIn('canton_wealth_tax', result)
        self.assertIn('municipal_wealth_tax', result)
        self.assertIn('net_wealth', result)
        self.assertIn('taxable_wealth', result)
        self.assertIn('effective_rate', result)
        self.assertEqual(result['net_wealth'], 500000.0)

    def test_calculate_wealth_tax_invalid_canton(self):
        """Test that invalid canton code raises ValueError"""
        with self.assertRaises(ValueError):
            self.service.calculate_wealth_tax(
                canton_code='XX',
                net_wealth=Decimal('500000'),
                marital_status='single'
            )

    def test_calculate_wealth_tax_below_threshold(self):
        """Test calculation with wealth below threshold"""
        # Zurich threshold: CHF 80,000 single
        result = self.service.calculate_wealth_tax(
            canton_code='ZH',
            net_wealth=Decimal('50000'),
            marital_status='single'
        )

        self.assertEqual(result['total_wealth_tax'], 0.0)
        self.assertEqual(result['taxable_wealth'], 0.0)

    def test_calculate_wealth_tax_married(self):
        """Test calculation for married couple"""
        result = self.service.calculate_wealth_tax(
            canton_code='ZH',
            net_wealth=Decimal('200000'),
            marital_status='married'
        )

        # Zurich married threshold: CHF 159,000
        self.assertGreater(result['taxable_wealth'], 0)

    @patch('services.wealth_tax_service.execute_one')
    def test_calculate_with_municipality_id(self, mock_execute_one):
        """Test calculation with municipality ID"""
        # Mock municipality data
        mock_execute_one.return_value = {
            'id': 1,
            'name': 'Zurich',
            'canton': 'ZH',
            'tax_multiplier': Decimal('1.19'),
            'wealth_tax_multiplier': None
        }

        result = self.service.calculate_wealth_tax(
            canton_code='ZH',
            net_wealth=Decimal('500000'),
            marital_status='single',
            municipality_id=1
        )

        self.assertIn('municipality_info', result)
        self.assertIsNotNone(result['municipality_info'])
        self.assertEqual(result['municipality_info']['multiplier'], 1.19)
        mock_execute_one.assert_called_once()

    @patch('services.wealth_tax_service.execute_one')
    def test_calculate_with_municipality_name(self, mock_execute_one):
        """Test calculation with municipality name"""
        # Mock municipality data
        mock_execute_one.return_value = {
            'id': 1,
            'name': 'Zurich',
            'canton': 'ZH',
            'tax_multiplier': Decimal('1.19'),
            'wealth_tax_multiplier': None
        }

        result = self.service.calculate_wealth_tax(
            canton_code='ZH',
            net_wealth=Decimal('500000'),
            marital_status='single',
            municipality_name='Zurich'
        )

        self.assertIn('municipality_info', result)
        self.assertIsNotNone(result['municipality_info'])
        mock_execute_one.assert_called_once()

    @patch('services.wealth_tax_service.execute_one')
    def test_calculate_with_wealth_tax_multiplier(self, mock_execute_one):
        """Test that wealth_tax_multiplier takes precedence over tax_multiplier"""
        # Mock municipality data with specific wealth tax multiplier
        mock_execute_one.return_value = {
            'id': 1,
            'name': 'Zurich',
            'canton': 'ZH',
            'tax_multiplier': Decimal('1.19'),
            'wealth_tax_multiplier': Decimal('1.10')  # Different from general multiplier
        }

        result = self.service.calculate_wealth_tax(
            canton_code='ZH',
            net_wealth=Decimal('500000'),
            marital_status='single',
            municipality_id=1
        )

        # Should use wealth_tax_multiplier (1.10) not tax_multiplier (1.19)
        self.assertEqual(result['municipality_info']['multiplier'], 1.10)

    @patch('services.wealth_tax_service.execute_query')
    def test_calculate_from_session_with_wealth(self, mock_execute_query):
        """Test calculation from session with wealth data"""
        # Mock session answers
        mock_execute_query.return_value = [
            {'question_id': 'has_wealth', 'answer_value': 'yes'},
            {'question_id': 'net_wealth', 'answer_value': '500000'},
            {'question_id': 'canton', 'answer_value': 'ZH'},
            {'question_id': 'municipality', 'answer_value': 'Zurich'},
            {'question_id': 'marital_status', 'answer_value': 'single'}
        ]

        result = self.service.calculate_from_session(session_id='test_session')

        self.assertIsNotNone(result)
        self.assertIn('total_wealth_tax', result)
        self.assertEqual(result['net_wealth'], 500000.0)

    @patch('services.wealth_tax_service.execute_query')
    def test_calculate_from_session_no_wealth(self, mock_execute_query):
        """Test calculation from session without wealth data"""
        # Mock session answers without wealth
        mock_execute_query.return_value = [
            {'question_id': 'has_wealth', 'answer_value': 'no'},
            {'question_id': 'canton', 'answer_value': 'ZH'}
        ]

        result = self.service.calculate_from_session(session_id='test_session')

        self.assertIsNone(result)

    @patch('services.wealth_tax_service.execute_query')
    def test_calculate_from_session_zero_wealth(self, mock_execute_query):
        """Test calculation from session with zero wealth"""
        # Mock session answers with zero wealth
        mock_execute_query.return_value = [
            {'question_id': 'has_wealth', 'answer_value': 'yes'},
            {'question_id': 'net_wealth', 'answer_value': '0'},
            {'question_id': 'canton', 'answer_value': 'ZH'}
        ]

        result = self.service.calculate_from_session(session_id='test_session')

        self.assertIsNone(result)

    def test_get_canton_info_zurich(self):
        """Test getting canton info for Zurich"""
        info = self.service.get_canton_info('ZH')

        self.assertIn('canton_code', info)
        self.assertIn('rate_structure', info)
        self.assertIn('source', info)
        self.assertEqual(info['canton_code'], 'ZH')
        self.assertEqual(info['rate_structure'], 'progressive')

    def test_get_canton_info_nidwalden(self):
        """Test getting canton info for Nidwalden (proportional)"""
        info = self.service.get_canton_info('NW')

        self.assertEqual(info['rate_structure'], 'proportional')

    def test_get_all_cantons_info(self):
        """Test getting info for all 26 cantons"""
        all_info = self.service.get_all_cantons_info()

        self.assertEqual(len(all_info), 26)
        self.assertIn('ZH', all_info)
        self.assertIn('GE', all_info)
        self.assertIn('NW', all_info)

        # Check that each canton has required fields
        for canton_code, info in all_info.items():
            if 'error' not in info:
                self.assertIn('canton_code', info)
                self.assertIn('rate_structure', info)

    def test_compare_cantons_specific_list(self):
        """Test comparing specific cantons"""
        comparison = self.service.compare_cantons(
            net_wealth=Decimal('500000'),
            marital_status='single',
            canton_codes=['ZH', 'GE', 'NW']
        )

        self.assertEqual(len(comparison), 3)
        self.assertIn('ZH', comparison)
        self.assertIn('GE', comparison)
        self.assertIn('NW', comparison)

        # Each should have calculation results
        for canton_code, result in comparison.items():
            if 'error' not in result:
                self.assertIn('total_wealth_tax', result)

    def test_compare_cantons_all(self):
        """Test comparing all cantons"""
        comparison = self.service.compare_cantons(
            net_wealth=Decimal('500000'),
            marital_status='single'
        )

        # Should have all 26 cantons
        self.assertEqual(len(comparison), 26)

    def test_is_wealth_tax_applicable_above_threshold(self):
        """Test wealth tax applicability above threshold"""
        is_applicable = self.service.is_wealth_tax_applicable(
            canton_code='ZH',
            net_wealth=Decimal('100000'),
            marital_status='single'
        )

        # Zurich threshold is CHF 80,000 single
        self.assertTrue(is_applicable)

    def test_is_wealth_tax_applicable_below_threshold(self):
        """Test wealth tax applicability below threshold"""
        is_applicable = self.service.is_wealth_tax_applicable(
            canton_code='ZH',
            net_wealth=Decimal('50000'),
            marital_status='single'
        )

        # Below threshold
        self.assertFalse(is_applicable)

    def test_is_wealth_tax_applicable_married_higher_threshold(self):
        """Test wealth tax applicability with married threshold"""
        # CHF 150,000 is above single threshold (80K) but below married threshold (159K)
        is_applicable = self.service.is_wealth_tax_applicable(
            canton_code='ZH',
            net_wealth=Decimal('150000'),
            marital_status='married'
        )

        # Below married threshold
        self.assertFalse(is_applicable)

    def test_proportional_vs_progressive_comparison(self):
        """Test comparison between proportional and progressive cantons"""
        net_wealth = Decimal('500000')

        # Nidwalden (proportional, 0.25‰)
        nw_result = self.service.calculate_wealth_tax('NW', net_wealth, 'single')

        # Zurich (progressive, 0.3-3.0‰)
        zh_result = self.service.calculate_wealth_tax('ZH', net_wealth, 'single')

        # Both should have tax
        self.assertGreater(nw_result['total_wealth_tax'], 0)
        self.assertGreater(zh_result['total_wealth_tax'], 0)

        # Both should have different effective rates
        self.assertNotEqual(nw_result['effective_rate'], zh_result['effective_rate'])


class TestWealthTaxServiceEdgeCases(unittest.TestCase):
    """Test edge cases for WealthTaxService"""

    def setUp(self):
        """Set up test fixtures"""
        self.service = WealthTaxService(tax_year=2024)

    def test_lowercase_canton_code(self):
        """Test that lowercase canton codes are handled"""
        result = self.service.calculate_wealth_tax(
            canton_code='zh',  # lowercase
            net_wealth=Decimal('500000'),
            marital_status='single'
        )

        self.assertIn('total_wealth_tax', result)

    def test_very_large_wealth(self):
        """Test with very large wealth amount"""
        result = self.service.calculate_wealth_tax(
            canton_code='ZH',
            net_wealth=Decimal('100000000'),  # CHF 100 million
            marital_status='single'
        )

        self.assertGreater(result['total_wealth_tax'], 0)
        self.assertLess(result['effective_rate'], 1)  # Should still be under 1%

    @patch('services.wealth_tax_service.execute_one')
    def test_municipality_not_found(self, mock_execute_one):
        """Test calculation when municipality is not found"""
        mock_execute_one.return_value = None  # Municipality not found

        result = self.service.calculate_wealth_tax(
            canton_code='ZH',
            net_wealth=Decimal('500000'),
            marital_status='single',
            municipality_name='NonexistentTown'
        )

        # Should still work without municipality info
        self.assertIn('total_wealth_tax', result)
        self.assertIsNone(result['municipality_info'])

    def test_compare_cantons_with_error(self):
        """Test canton comparison with invalid canton"""
        comparison = self.service.compare_cantons(
            net_wealth=Decimal('500000'),
            marital_status='single',
            canton_codes=['ZH', 'XX', 'GE']  # XX is invalid
        )

        # Should have all three, but XX should have error
        self.assertEqual(len(comparison), 3)
        self.assertIn('error', comparison['XX'])
        self.assertNotIn('error', comparison['ZH'])


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
