"""
Comprehensive Unit Tests for Wealth Tax Calculators

Tests all 26 canton wealth tax calculators to ensure accuracy and coverage.
Includes:
- Base calculator classes (WealthTaxCalculator, ProgressiveWealthTaxCalculator, ProportionalWealthTaxCalculator)
- All 26 canton-specific calculators
- Proportional (6 cantons) vs Progressive (20 cantons) structures
- Tax-free thresholds for single and married taxpayers
- Municipal multipliers
- Edge cases (below threshold, at threshold, above threshold)
- Effective rate calculations
- Canton info retrieval

Tax Year: 2024
All tests use actual 2024 wealth tax data from official canton sources.
"""

import sys
import unittest
from decimal import Decimal
from pathlib import Path
from typing import Dict

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from services.wealth_tax_calculators.base import (
    WealthTaxCalculator,
    ProgressiveWealthTaxCalculator,
    ProportionalWealthTaxCalculator
)
from services.wealth_tax_calculators import get_wealth_tax_calculator, WEALTH_TAX_CALCULATORS

# Import all canton calculators
from services.wealth_tax_calculators.zurich import ZurichWealthTaxCalculator
from services.wealth_tax_calculators.geneva import GenevaWealthTaxCalculator
from services.wealth_tax_calculators.nidwalden import NidwaldenWealthTaxCalculator
from services.wealth_tax_calculators.zug import ZugWealthTaxCalculator
from services.wealth_tax_calculators.basel_stadt import BaselStadtWealthTaxCalculator
from services.wealth_tax_calculators.vaud import VaudWealthTaxCalculator
from services.wealth_tax_calculators.bern import BernWealthTaxCalculator


class TestWealthTaxBase(unittest.TestCase):
    """Test suite for base wealth tax calculator classes"""

    def test_proportional_calculator_below_threshold(self):
        """Test proportional calculator with wealth below threshold"""
        # Use Nidwalden (lowest rate 0.25‰)
        calc = NidwaldenWealthTaxCalculator()
        result = calc.calculate(
            net_wealth=Decimal('30000'),  # Below CHF 35,000 threshold
            marital_status='single'
        )

        self.assertEqual(result['canton_wealth_tax'], Decimal('0'))
        self.assertEqual(result['taxable_wealth'], Decimal('0'))
        self.assertEqual(result['tax_free_threshold'], Decimal('35000'))

    def test_proportional_calculator_above_threshold(self):
        """Test proportional calculator with wealth above threshold"""
        # Nidwalden: CHF 35,000 threshold, 0.25‰ rate
        calc = NidwaldenWealthTaxCalculator()
        result = calc.calculate(
            net_wealth=Decimal('100000'),
            marital_status='single'
        )

        # Taxable: 100,000 - 35,000 = 65,000
        # Tax: 65,000 × 0.25‰ = 65,000 × 0.00025 = 16.25
        self.assertEqual(result['taxable_wealth'], Decimal('65000'))
        self.assertAlmostEqual(result['canton_wealth_tax'], Decimal('16.25'), places=2)

    def test_progressive_calculator_below_threshold(self):
        """Test progressive calculator with wealth below threshold"""
        # Use Zurich (CHF 80,000 threshold single)
        calc = ZurichWealthTaxCalculator()
        result = calc.calculate(
            net_wealth=Decimal('50000'),
            marital_status='single'
        )

        self.assertEqual(result['canton_wealth_tax'], Decimal('0'))
        self.assertEqual(result['taxable_wealth'], Decimal('0'))

    def test_progressive_calculator_multiple_brackets(self):
        """Test progressive calculator across multiple brackets"""
        # Zurich: CHF 80,000 threshold
        # Brackets: 0-100K: 0.3‰, 100-200K: 0.5‰, 200-500K: 1.0‰
        calc = ZurichWealthTaxCalculator()
        result = calc.calculate(
            net_wealth=Decimal('500000'),
            marital_status='single'
        )

        # Taxable: 500,000 - 80,000 = 420,000
        # Tax calculation:
        # 0-100K: 100,000 × 0.3‰ = 30
        # 100-200K: 100,000 × 0.5‰ = 50
        # 200-420K: 220,000 × 1.0‰ = 220
        # Total: 30 + 50 + 220 = 300
        self.assertEqual(result['taxable_wealth'], Decimal('420000'))
        self.assertAlmostEqual(result['canton_wealth_tax'], Decimal('300'), places=2)

    def test_married_threshold_higher(self):
        """Test that married taxpayers have higher thresholds"""
        calc = ZurichWealthTaxCalculator()

        # Single threshold: CHF 80,000
        single_result = calc.calculate(
            net_wealth=Decimal('100000'),
            marital_status='single'
        )

        # Married threshold: CHF 159,000
        married_result = calc.calculate(
            net_wealth=Decimal('100000'),
            marital_status='married'
        )

        # Single has taxable wealth, married does not
        self.assertGreater(single_result['taxable_wealth'], Decimal('0'))
        self.assertEqual(married_result['taxable_wealth'], Decimal('0'))
        self.assertGreater(single_result['canton_wealth_tax'], Decimal('0'))
        self.assertEqual(married_result['canton_wealth_tax'], Decimal('0'))

    def test_effective_rate_calculation(self):
        """Test effective rate calculation"""
        calc = NidwaldenWealthTaxCalculator()
        result = calc.calculate(
            net_wealth=Decimal('100000'),
            marital_status='single'
        )

        # Effective rate should be (tax / net_wealth) × 100
        expected_rate = (result['canton_wealth_tax'] / Decimal('100000')) * Decimal('100')
        self.assertAlmostEqual(result['effective_rate'], expected_rate, places=2)

class TestProportionalCantons(unittest.TestCase):
    """Test suite for proportional (flat rate) cantons"""

    def test_nidwalden_lowest_rate(self):
        """Test Nidwalden (LOWEST rate in Switzerland: 0.25‰)"""
        calc = NidwaldenWealthTaxCalculator()
        result = calc.calculate(
            net_wealth=Decimal('1000000'),
            marital_status='single'
        )

        # Taxable: 1,000,000 - 35,000 = 965,000
        # Tax: 965,000 × 0.25‰ = 241.25
        self.assertEqual(result['taxable_wealth'], Decimal('965000'))
        self.assertAlmostEqual(result['canton_wealth_tax'], Decimal('241.25'), places=2)

    def test_bern_proportional(self):
        """Test Bern (proportional 2.4‰)"""
        calc = BernWealthTaxCalculator()
        result = calc.calculate(
            net_wealth=Decimal('500000'),
            marital_status='single'
        )

        # Threshold: 100,000
        # Taxable: 500,000 - 100,000 = 400,000
        # Tax: 400,000 × 2.4‰ = 960
        self.assertEqual(result['taxable_wealth'], Decimal('400000'))
        self.assertAlmostEqual(result['canton_wealth_tax'], Decimal('960'), places=2)

    def test_all_proportional_cantons_exist(self):
        """Test that all 6 proportional cantons are registered"""
        proportional_cantons = ['NW', 'SZ', 'LU', 'AI', 'BE', 'UR']

        for canton_code in proportional_cantons:
            self.assertIn(canton_code, WEALTH_TAX_CALCULATORS,
                         f"Proportional canton {canton_code} not registered")

            calc = get_wealth_tax_calculator(canton_code)
            self.assertIsInstance(calc, ProportionalWealthTaxCalculator,
                                f"Canton {canton_code} should be proportional")


class TestProgressiveCantons(unittest.TestCase):
    """Test suite for progressive (bracket) cantons"""

    def test_geneva_high_rates(self):
        """Test Geneva (high rates: 1.75‰ - 4.5‰)"""
        calc = GenevaWealthTaxCalculator()
        result = calc.calculate(
            net_wealth=Decimal('1000000'),
            marital_status='single'
        )

        # Geneva has progressive brackets with higher rates
        self.assertGreater(result['canton_wealth_tax'], Decimal('0'))
        self.assertGreater(result['taxable_wealth'], Decimal('0'))

    def test_basel_stadt_highest_rates(self):
        """Test Basel-Stadt (HIGHEST rates: 1.5‰ - 7.9‰)"""
        calc = BaselStadtWealthTaxCalculator()
        result = calc.calculate(
            net_wealth=Decimal('2000000'),
            marital_status='single'
        )

        # Basel-Stadt has the highest top rate in Switzerland
        self.assertGreater(result['canton_wealth_tax'], Decimal('0'))

    def test_zug_high_thresholds(self):
        """Test Zug (HIGHEST thresholds: CHF 200K/400K)"""
        calc = ZugWealthTaxCalculator()

        # Single threshold: CHF 200,000 (doubled in 2024)
        result_single = calc.calculate(
            net_wealth=Decimal('180000'),
            marital_status='single'
        )
        self.assertEqual(result_single['canton_wealth_tax'], Decimal('0'))

        # Married threshold: CHF 400,000 (doubled in 2024)
        result_married = calc.calculate(
            net_wealth=Decimal('350000'),
            marital_status='married'
        )
        self.assertEqual(result_married['canton_wealth_tax'], Decimal('0'))

    def test_vaud_progressive(self):
        """Test Vaud progressive structure"""
        calc = VaudWealthTaxCalculator()
        result = calc.calculate(
            net_wealth=Decimal('500000'),
            marital_status='single'
        )

        # Vaud has CHF 50,000 threshold and progressive rates
        self.assertGreater(result['taxable_wealth'], Decimal('0'))
        self.assertGreater(result['canton_wealth_tax'], Decimal('0'))

    def test_all_progressive_cantons_exist(self):
        """Test that all 20 progressive cantons are registered"""
        progressive_cantons = [
            'ZH', 'ZG', 'GE', 'VD', 'BS', 'SO', 'SH', 'SG', 'GL', 'FR',
            'NE', 'VS', 'TI', 'OW', 'BL', 'AG', 'TG', 'AR', 'JU', 'GR'
        ]

        for canton_code in progressive_cantons:
            self.assertIn(canton_code, WEALTH_TAX_CALCULATORS,
                         f"Progressive canton {canton_code} not registered")

            calc = get_wealth_tax_calculator(canton_code)
            self.assertIsInstance(calc, ProgressiveWealthTaxCalculator,
                                f"Canton {canton_code} should be progressive")


class TestAllCantons(unittest.TestCase):
    """Test suite for all 26 cantons"""

    def test_all_26_cantons_registered(self):
        """Test that all 26 Swiss cantons are registered"""
        expected_cantons = [
            'ZH', 'BE', 'LU', 'UR', 'SZ', 'OW', 'NW', 'GL', 'ZG', 'FR',
            'SO', 'BS', 'BL', 'SH', 'AR', 'AI', 'SG', 'GR', 'AG', 'TG',
            'TI', 'VD', 'VS', 'NE', 'GE', 'JU'
        ]

        self.assertEqual(len(WEALTH_TAX_CALCULATORS), 26,
                        "Should have exactly 26 canton calculators")

        for canton_code in expected_cantons:
            self.assertIn(canton_code, WEALTH_TAX_CALCULATORS,
                         f"Canton {canton_code} not registered")

    def test_all_cantons_calculate_zero_wealth(self):
        """Test that all cantons return zero tax for zero wealth"""
        for canton_code in WEALTH_TAX_CALCULATORS.keys():
            calc = get_wealth_tax_calculator(canton_code)
            result = calc.calculate(
                net_wealth=Decimal('0'),
                marital_status='single'
            )

            self.assertEqual(result['canton_wealth_tax'], Decimal('0'),
                           f"Canton {canton_code} should return zero tax for zero wealth")

    def test_all_cantons_have_info(self):
        """Test that all cantons provide canton info"""
        for canton_code in WEALTH_TAX_CALCULATORS.keys():
            calc = get_wealth_tax_calculator(canton_code)
            info = calc.get_canton_info()

            self.assertIn('canton_code', info, f"Canton {canton_code} missing canton_code")
            self.assertIn('rate_structure', info, f"Canton {canton_code} missing rate_structure")
            self.assertIn('source', info, f"Canton {canton_code} missing source")
            self.assertIn(info['rate_structure'], ['proportional', 'progressive'],
                         f"Canton {canton_code} has invalid rate structure")

    def test_get_canton_calculator_invalid_code(self):
        """Test that invalid canton codes raise ValueError"""
        with self.assertRaises(ValueError):
            get_wealth_tax_calculator('XX')  # Invalid canton code

        with self.assertRaises(ValueError):
            get_wealth_tax_calculator('ZURICH')  # Full name instead of code


class TestEdgeCases(unittest.TestCase):
    """Test suite for edge cases and boundary conditions"""

    def test_wealth_exactly_at_threshold(self):
        """Test wealth exactly at threshold boundary"""
        calc = ZurichWealthTaxCalculator()
        result = calc.calculate(
            net_wealth=Decimal('80000'),  # Exactly at threshold
            marital_status='single'
        )

        # At threshold, taxable wealth should be 0
        self.assertEqual(result['taxable_wealth'], Decimal('0'))
        self.assertEqual(result['canton_wealth_tax'], Decimal('0'))

    def test_very_high_wealth(self):
        """Test very high wealth (top bracket)"""
        calc = ZurichWealthTaxCalculator()
        result = calc.calculate(
            net_wealth=Decimal('10000000'),  # CHF 10 million
            marital_status='single'
        )

        self.assertGreater(result['canton_wealth_tax'], Decimal('0'))
        self.assertGreater(result['effective_rate'], Decimal('0'))
        self.assertLess(result['effective_rate'], Decimal('1'))  # Should be under 1%

    def test_negative_wealth(self):
        """Test negative wealth (should be treated as zero)"""
        calc = NidwaldenWealthTaxCalculator()
        result = calc.calculate(
            net_wealth=Decimal('-50000'),
            marital_status='single'
        )

        # Negative wealth should result in zero tax
        self.assertEqual(result['canton_wealth_tax'], Decimal('0'))

    def test_municipal_multiplier_zero(self):
        """Test with zero municipal multiplier"""
        calc = ZurichWealthTaxCalculator()
        result = calc.calculate_with_multiplier(
            net_wealth=Decimal('500000'),
            marital_status='single',
            canton_multiplier=Decimal('1.0'),
            municipal_multiplier=Decimal('0')
        )

        # Municipal tax should be zero
        self.assertEqual(result['municipal_wealth_tax'], Decimal('0'))

    def test_municipal_multiplier_none(self):
        """Test with None municipal multiplier"""
        calc = ZurichWealthTaxCalculator()
        result = calc.calculate_with_multiplier(
            net_wealth=Decimal('500000'),
            marital_status='single',
            canton_multiplier=Decimal('1.0'),
            municipal_multiplier=None
        )

        # Should handle None gracefully
        self.assertEqual(result['municipal_wealth_tax'], Decimal('0'))


class TestComparisons(unittest.TestCase):
    """Test suite for comparing cantons"""

    def test_nidwalden_vs_basel_stadt(self):
        """Compare lowest rate (Nidwalden) vs highest rate (Basel-Stadt)"""
        net_wealth = Decimal('1000000')

        # Nidwalden (lowest: 0.25‰)
        nw_calc = NidwaldenWealthTaxCalculator()
        nw_result = nw_calc.calculate(net_wealth, 'single')

        # Basel-Stadt (highest: up to 7.9‰)
        bs_calc = BaselStadtWealthTaxCalculator()
        bs_result = bs_calc.calculate(net_wealth, 'single')

        # Basel-Stadt should have significantly higher tax
        self.assertGreater(bs_result['canton_wealth_tax'],
                          nw_result['canton_wealth_tax'],
                          "Basel-Stadt should have higher tax than Nidwalden")

    def test_threshold_comparison(self):
        """Compare cantons with different thresholds"""
        # Zug has highest threshold (CHF 200,000 single)
        # Vaud has lower threshold (CHF 50,000 single)

        net_wealth = Decimal('150000')

        zg_calc = ZugWealthTaxCalculator()
        zg_result = zg_calc.calculate(net_wealth, 'single')

        vd_calc = VaudWealthTaxCalculator()
        vd_result = vd_calc.calculate(net_wealth, 'single')

        # Zug should have no tax (below threshold)
        # Vaud should have tax (above threshold)
        self.assertEqual(zg_result['canton_wealth_tax'], Decimal('0'))
        self.assertGreater(vd_result['canton_wealth_tax'], Decimal('0'))


class TestTaxYear(unittest.TestCase):
    """Test suite for tax year handling"""

    def test_default_tax_year_2024(self):
        """Test that default tax year is 2024"""
        calc = ZurichWealthTaxCalculator()
        self.assertEqual(calc.tax_year, 2024)

    def test_explicit_tax_year(self):
        """Test setting explicit tax year"""
        calc = ZurichWealthTaxCalculator(tax_year=2024)
        self.assertEqual(calc.tax_year, 2024)


if __name__ == '__main__':
    # Run tests with verbose output
    unittest.main(verbosity=2)
