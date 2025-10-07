"""
Unit Tests for Enhanced Tax Calculation Service

Tests multi-canton tax calculations including:
- Primary vs secondary filing logic
- Income allocation
- Deduction calculations
- Canton-specific tax rates
"""

import sys
import unittest
from decimal import Decimal
from pathlib import Path
from unittest.mock import MagicMock, Mock, patch

sys.path.insert(0, str(Path(__file__).parent.parent))

# Import models package first to ensure all models are registered
import models
from models import TaxFilingSession
from services.enhanced_tax_calculation_service import \
    EnhancedTaxCalculationService


class TestEnhancedTaxCalculationService(unittest.TestCase):
    """Test suite for Enhanced Tax Calculation Service"""

    def setUp(self):
        """Set up test fixtures"""
        self.service = EnhancedTaxCalculationService(db=None)

        # Mock primary filing
        self.primary_filing = Mock(spec=TaxFilingSession)
        self.primary_filing.id = 'filing_primary_123'
        self.primary_filing.canton = 'ZH'
        self.primary_filing.tax_year = 2024
        self.primary_filing.is_primary = True
        self.primary_filing.profile = {
            'employment_income': 100000,
            'self_employment_income': 0,
            'capital_income': 5000,
            'rental_income_total': 20000,
            'other_income': 0,
            'marital_status': 'single',
            'num_children': 0,
            'pillar_3a_contributions': 7056,
            'insurance_premiums': 1750,
            'properties': []
        }

        # Mock secondary filing
        self.secondary_filing = Mock(spec=TaxFilingSession)
        self.secondary_filing.id = 'filing_secondary_456'
        self.secondary_filing.canton = 'GE'
        self.secondary_filing.tax_year = 2024
        self.secondary_filing.is_primary = False
        self.secondary_filing.profile = {
            'marital_status': 'single',
            'num_children': 0,
            'properties': [
                {
                    'canton': 'GE',
                    'annual_rental_income': 15000,
                    'maintenance_costs': 2000,
                    'mortgage_interest': 3000
                }
            ]
        }

    def test_calculate_all_income_primary(self):
        """Test calculation of all income sources for primary filing"""
        income = self.service._calculate_all_income(self.primary_filing.profile)

        self.assertEqual(income['employment'], Decimal('100000'))
        self.assertEqual(income['capital'], Decimal('5000'))
        self.assertEqual(income['rental'], Decimal('20000'))
        self.assertEqual(income['total'], Decimal('125000'))

    def test_calculate_property_income_only_secondary(self):
        """Test calculation of property income only for secondary filing"""
        income = self.service._calculate_property_income_only(
            self.secondary_filing.profile,
            'GE'
        )

        self.assertEqual(income['employment'], Decimal('0'))
        self.assertEqual(income['rental'], Decimal('15000'))
        self.assertEqual(income['total'], Decimal('15000'))

    def test_calculate_filing_deductions_primary(self):
        """Test deduction calculation for primary filing"""
        deductions = self.service._calculate_filing_deductions(
            self.primary_filing.profile,
            self.primary_filing
        )

        # Pillar 3a should be capped at 7056
        self.assertEqual(deductions['pillar_3a'], Decimal('7056'))

        # Insurance premiums standard deduction for single
        self.assertEqual(deductions['insurance_premiums'], Decimal('1750'))

        # Professional expenses: 3% of employment, max 4000
        self.assertEqual(deductions['professional_expenses'], Decimal('3000'))

        # Total should be sum of all deductions
        self.assertGreater(deductions['total'], Decimal('0'))

    def test_calculate_filing_deductions_secondary(self):
        """Test deduction calculation for secondary filing (property only)"""
        deductions = self.service._calculate_filing_deductions(
            self.secondary_filing.profile,
            self.secondary_filing
        )

        # Should only have property-related deductions
        self.assertEqual(deductions['pillar_3a'], Decimal('0'))
        self.assertEqual(deductions['professional_expenses'], Decimal('0'))

        # Property expenses
        self.assertEqual(deductions['property_expenses'], Decimal('2000'))
        self.assertEqual(deductions['mortgage_interest'], Decimal('3000'))

    def test_federal_tax_single(self):
        """Test federal tax calculation for single taxpayer"""
        # Test at CHF 50,000 taxable income
        tax = self.service._calculate_federal_tax(
            Decimal('50000'),
            'single'
        )

        # Should be positive and reasonable
        self.assertGreater(tax, Decimal('0'))
        self.assertLess(tax, Decimal('10000'))

    def test_federal_tax_married(self):
        """Test federal tax calculation for married taxpayer"""
        # Test at CHF 100,000 taxable income
        tax = self.service._calculate_federal_tax(
            Decimal('100000'),
            'married'
        )

        # Married rate should be lower than single for same income
        single_tax = self.service._calculate_federal_tax(
            Decimal('100000'),
            'single'
        )

        self.assertLess(tax, single_tax)

    def test_federal_tax_zero_income(self):
        """Test federal tax with zero taxable income"""
        tax = self.service._calculate_federal_tax(
            Decimal('0'),
            'single'
        )

        self.assertEqual(tax, Decimal('0'))

    def test_federal_tax_below_threshold(self):
        """Test federal tax below minimum threshold"""
        # Single threshold is 17800
        tax = self.service._calculate_federal_tax(
            Decimal('15000'),
            'single'
        )

        self.assertEqual(tax, Decimal('0'))

    @patch('services.enhanced_tax_calculation_service.get_canton_calculator')
    def test_cantonal_tax_calculation(self, mock_get_calculator):
        """Test cantonal tax calculation with mocked calculator"""
        # Mock canton calculator
        mock_calculator = Mock()
        mock_calculator.calculate.return_value = Decimal('5000')
        mock_get_calculator.return_value = mock_calculator

        tax = self.service._calculate_cantonal_tax(
            Decimal('50000'),
            'ZH',
            'single',
            0
        )

        self.assertEqual(tax, Decimal('5000'))
        mock_calculator.calculate.assert_called_once()

    def test_municipal_tax_calculation(self):
        """Test municipal tax as multiplier of cantonal tax"""
        cantonal_tax = Decimal('5000')

        # Test Zurich municipality (multiplier 1.19)
        municipal_tax = self.service._calculate_municipal_tax(
            cantonal_tax,
            'ZH',
            'Zurich'
        )

        self.assertEqual(municipal_tax, Decimal('5950'))  # 5000 * 1.19

    def test_municipal_tax_unknown_municipality(self):
        """Test municipal tax for unknown municipality (default 1.0)"""
        cantonal_tax = Decimal('5000')

        municipal_tax = self.service._calculate_municipal_tax(
            cantonal_tax,
            'ZH',
            'UnknownCity'
        )

        self.assertEqual(municipal_tax, Decimal('5000'))  # 5000 * 1.0

    def test_church_tax_member(self):
        """Test church tax for church member"""
        cantonal_tax = Decimal('5000')

        church_tax = self.service._calculate_church_tax(
            cantonal_tax,
            'ZH',
            True
        )

        # Zurich church tax is 10% of cantonal
        self.assertEqual(church_tax, Decimal('500'))

    def test_church_tax_non_member(self):
        """Test church tax for non-member"""
        cantonal_tax = Decimal('5000')

        church_tax = self.service._calculate_church_tax(
            cantonal_tax,
            'ZH',
            False
        )

        self.assertEqual(church_tax, Decimal('0'))

    @patch('services.enhanced_tax_calculation_service.get_canton_calculator')
    def test_calculate_single_filing_primary(self, mock_get_calculator):
        """Test complete calculation for primary filing"""
        # Mock canton calculator
        mock_calculator = Mock()
        mock_calculator.calculate.return_value = Decimal('8000')
        mock_get_calculator.return_value = mock_calculator

        result = self.service.calculate_single_filing(self.primary_filing)

        # Verify result structure
        self.assertIn('filing_id', result)
        self.assertIn('canton', result)
        self.assertIn('is_primary', result)
        self.assertIn('income', result)
        self.assertIn('deductions', result)
        self.assertIn('taxable_income', result)
        self.assertIn('federal_tax', result)
        self.assertIn('cantonal_tax', result)
        self.assertIn('total_tax', result)

        # Verify primary filing characteristics
        self.assertTrue(result['is_primary'])
        self.assertEqual(result['canton'], 'ZH')

        # Federal tax should be present for primary
        self.assertGreater(result['federal_tax'], 0)

        # Total tax should be sum of all taxes
        expected_total = (
            result['federal_tax'] +
            result['cantonal_tax'] +
            result['municipal_tax'] +
            result['church_tax']
        )
        self.assertEqual(result['total_tax'], expected_total)

    @patch('services.enhanced_tax_calculation_service.get_canton_calculator')
    def test_calculate_single_filing_secondary(self, mock_get_calculator):
        """Test complete calculation for secondary filing"""
        # Mock canton calculator
        mock_calculator = Mock()
        mock_calculator.calculate.return_value = Decimal('1500')
        mock_get_calculator.return_value = mock_calculator

        result = self.service.calculate_single_filing(self.secondary_filing)

        # Verify secondary filing characteristics
        self.assertFalse(result['is_primary'])
        self.assertEqual(result['canton'], 'GE')

        # Federal tax should be zero for secondary
        self.assertEqual(result['federal_tax'], 0)

        # Income should only be rental
        self.assertEqual(result['income']['employment'], 0)
        self.assertEqual(result['income']['rental'], 15000)

    def test_pillar_3a_max_limit(self):
        """Test Pillar 3a contribution is capped at maximum"""
        profile = {
            'employment_income': 100000,
            'pillar_3a_contributions': 10000,  # Over limit
            'marital_status': 'single',
            'num_children': 0
        }

        filing = Mock(spec=TaxFilingSession)
        filing.is_primary = True

        deductions = self.service._calculate_filing_deductions(profile, filing)

        # Should be capped at 7056 for employees
        self.assertEqual(deductions['pillar_3a'], Decimal('7056'))

    def test_professional_expenses_max_limit(self):
        """Test professional expenses are capped"""
        profile = {
            'employment_income': 200000,  # 3% would be 6000
            'marital_status': 'single',
            'num_children': 0
        }

        filing = Mock(spec=TaxFilingSession)
        filing.is_primary = True

        deductions = self.service._calculate_filing_deductions(profile, filing)

        # Should be capped at 4000
        self.assertEqual(deductions['professional_expenses'], Decimal('4000'))

    def test_child_deductions(self):
        """Test child deductions calculation"""
        profile = {
            'employment_income': 100000,
            'marital_status': 'married',
            'num_children': 2
        }

        filing = Mock(spec=TaxFilingSession)
        filing.is_primary = True

        deductions = self.service._calculate_filing_deductions(profile, filing)

        # Child deduction is 6600 per child for federal
        self.assertEqual(deductions['child_deduction'], Decimal('13200'))

    def test_effective_rate_calculation(self):
        """Test effective rate is calculated correctly"""
        with patch('services.enhanced_tax_calculation_service.get_canton_calculator') as mock_calc:
            mock_calculator = Mock()
            mock_calculator.calculate.return_value = Decimal('5000')
            mock_calc.return_value = mock_calculator

            result = self.service.calculate_single_filing(self.primary_filing)

            # Effective rate should be (total_tax / total_income) * 100
            expected_rate = (result['total_tax'] / result['income']['total']) * 100

            self.assertAlmostEqual(
                result['effective_rate'],
                expected_rate,
                places=2
            )


class TestMultipleFilingsCalculation(unittest.TestCase):
    """Test calculation across multiple filings"""

    def setUp(self):
        """Set up test fixtures for multi-canton scenario"""
        self.service = EnhancedTaxCalculationService(db=None)

    @unittest.skip("Skipped: Requires full database setup. Covered by integration tests.")
    @patch('services.enhanced_tax_calculation_service.FilingOrchestrationService')
    @patch('services.enhanced_tax_calculation_service.get_canton_calculator')
    def test_calculate_all_user_filings(self, mock_calc, mock_filing_service):
        """Test calculation for all user filings (primary + secondaries)"""
        # Mock filings (use plain Mock to avoid SQLAlchemy relationship resolution)
        primary = Mock()
        primary.id = 'primary_123'
        primary.canton = 'ZH'
        primary.is_primary = True
        primary.profile = {
            'employment_income': 100000,
            'rental_income_total': 30000,
            'marital_status': 'single',
            'num_children': 0
        }

        secondary1 = Mock()
        secondary1.id = 'secondary_456'
        secondary1.canton = 'GE'
        secondary1.is_primary = False
        secondary1.profile = {
            'marital_status': 'single',
            'num_children': 0,
            'properties': [
                {'canton': 'GE', 'annual_rental_income': 15000}
            ]
        }

        secondary2 = Mock()
        secondary2.id = 'secondary_789'
        secondary2.canton = 'VD'
        secondary2.is_primary = False
        secondary2.profile = {
            'marital_status': 'single',
            'num_children': 0,
            'properties': [
                {'canton': 'VD', 'annual_rental_income': 15000}
            ]
        }

        # Mock filing service
        mock_filing_instance = mock_filing_service.return_value
        mock_filing_instance.get_all_user_filings.return_value = [
            primary, secondary1, secondary2
        ]

        # Mock canton calculator
        mock_calculator = Mock()
        mock_calculator.calculate.return_value = Decimal('5000')
        mock_calc.return_value = mock_calculator

        # Calculate all filings
        result = self.service.calculate_all_user_filings('user_123', 2024)

        # Verify structure
        self.assertEqual(result['total_filings'], 3)
        self.assertIn('primary_filing', result)
        self.assertIn('secondary_filings', result)
        self.assertIn('total_tax_burden', result)

        # Verify we have one primary and two secondaries
        self.assertIsNotNone(result['primary_filing'])
        self.assertEqual(len(result['secondary_filings']), 2)

        # Total tax burden should be sum of all filings
        self.assertGreater(result['total_tax_burden'], 0)


if __name__ == '__main__':
    unittest.main()
