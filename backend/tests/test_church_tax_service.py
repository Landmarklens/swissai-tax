"""
Tests for Church Tax Service

Tests Swiss church tax calculations for all 26 cantons.
"""

import pytest
from decimal import Decimal
from services.church_tax_service import ChurchTaxService


class TestChurchTaxService:
    """Test ChurchTaxService core functionality."""

    def setup_method(self):
        """Set up test fixtures."""
        self.service = ChurchTaxService(tax_year=2024)

    def test_service_initialization(self):
        """Test service initializes correctly."""
        assert self.service.tax_year == 2024

    def test_calculate_church_tax_zurich_catholic(self):
        """Test church tax calculation for Zurich, Catholic."""
        cantonal_tax = Decimal('10000')
        result = self.service.calculate_church_tax(
            canton_code='ZH',
            cantonal_tax=cantonal_tax,
            denomination='catholic'
        )

        assert result['applies'] is True
        assert result['canton'] == 'ZH'
        assert result['denomination'] == 'catholic'
        assert result['cantonal_tax'] == 10000.0
        assert result['rate_percentage'] == 0.13  # 13% for Catholic
        assert result['church_tax'] == 1300.0  # 10000 * 0.13
        assert result['source'] == 'canton_average'

    def test_calculate_church_tax_bern_highest_rates(self):
        """Test Bern has HIGHEST rates in Switzerland."""
        cantonal_tax = Decimal('10000')

        # Catholic rate (20.7% - HIGHEST)
        result_catholic = self.service.calculate_church_tax(
            canton_code='BE',
            cantonal_tax=cantonal_tax,
            denomination='catholic'
        )
        assert result_catholic['applies'] is True
        assert result_catholic['rate_percentage'] == 0.207
        assert result_catholic['church_tax'] == 2070.0

        # Reformed rate (18.4%)
        result_reformed = self.service.calculate_church_tax(
            canton_code='BE',
            cantonal_tax=cantonal_tax,
            denomination='reformed'
        )
        assert result_reformed['applies'] is True
        assert result_reformed['rate_percentage'] == 0.184
        assert result_reformed['church_tax'] == 1840.0

    def test_calculate_church_tax_basel_stadt_uniform(self):
        """Test Basel-Stadt has uniform 8% for all denominations."""
        cantonal_tax = Decimal('10000')

        for denomination in ['catholic', 'reformed', 'christian_catholic', 'jewish']:
            result = self.service.calculate_church_tax(
                canton_code='BS',
                cantonal_tax=cantonal_tax,
                denomination=denomination
            )
            assert result['applies'] is True
            assert result['rate_percentage'] == 0.08
            assert result['church_tax'] == 800.0  # Uniform across all

    def test_calculate_church_tax_geneva_no_tax(self):
        """Test Geneva has NO church tax."""
        cantonal_tax = Decimal('10000')
        result = self.service.calculate_church_tax(
            canton_code='GE',
            cantonal_tax=cantonal_tax,
            denomination='catholic'
        )

        assert result['applies'] is False
        assert result['reason'] == 'canton_no_tax'
        assert result['church_tax'] == 0.0

    def test_cantons_without_church_tax(self):
        """Test all 4 cantons without church tax (GE, NE, VD, TI)."""
        no_tax_cantons = ['GE', 'NE', 'VD', 'TI']
        cantonal_tax = Decimal('10000')

        for canton in no_tax_cantons:
            result = self.service.calculate_church_tax(
                canton_code=canton,
                cantonal_tax=cantonal_tax,
                denomination='catholic'
            )
            assert result['applies'] is False
            assert result['reason'] == 'canton_no_tax'
            assert result['church_tax'] == 0.0

    def test_user_not_church_member(self):
        """Test user not belonging to any church (denomination='none')."""
        result = self.service.calculate_church_tax(
            canton_code='ZH',
            cantonal_tax=Decimal('10000'),
            denomination='none'
        )

        assert result['applies'] is False
        assert result['reason'] == 'user_not_member'
        assert result['church_tax'] == 0.0

    def test_denomination_not_recognized(self):
        """Test denomination not recognized in canton."""
        # Try Christian Catholic in a canton that doesn't recognize it
        result = self.service.calculate_church_tax(
            canton_code='LU',  # Lucerne only has Catholic and Reformed
            cantonal_tax=Decimal('10000'),
            denomination='christian_catholic'
        )

        assert result['applies'] is False
        assert result['reason'] == 'denomination_not_recognized'
        assert result['church_tax'] == 0.0

    def test_all_22_cantons_with_church_tax(self):
        """Test all 22 cantons that levy church tax."""
        cantons_with_tax = [
            'ZH', 'BE', 'LU', 'UR', 'SZ', 'OW', 'NW', 'GL', 'ZG', 'FR',
            'SO', 'BS', 'BL', 'SH', 'AR', 'AI', 'SG', 'GR', 'AG', 'TG', 'VS', 'JU'
        ]

        cantonal_tax = Decimal('10000')

        for canton in cantons_with_tax:
            result = self.service.calculate_church_tax(
                canton_code=canton,
                cantonal_tax=cantonal_tax,
                denomination='catholic'
            )

            assert result['applies'] is True, f"Canton {canton} should apply church tax"
            assert result['church_tax'] > 0, f"Canton {canton} should have non-zero tax"
            assert 'rate_percentage' in result

    def test_catholic_vs_reformed_rates(self):
        """Test Catholic rates are typically higher than Reformed rates."""
        cantonal_tax = Decimal('10000')

        # Test in multiple cantons (not AR which is unique)
        test_cantons = ['ZH', 'BE', 'LU', 'FR', 'SG']

        for canton in test_cantons:
            catholic = self.service.calculate_church_tax(
                canton_code=canton,
                cantonal_tax=cantonal_tax,
                denomination='catholic'
            )
            reformed = self.service.calculate_church_tax(
                canton_code=canton,
                cantonal_tax=cantonal_tax,
                denomination='reformed'
            )

            if canton != 'LU':  # Lucerne has equal rates
                assert catholic['rate_percentage'] >= reformed['rate_percentage'], \
                    f"Canton {canton}: Catholic should be >= Reformed"

    def test_appenzell_ausserrhoden_unique_pattern(self):
        """Test AR has unique pattern: Reformed > Catholic."""
        cantonal_tax = Decimal('10000')

        catholic = self.service.calculate_church_tax(
            canton_code='AR',
            cantonal_tax=cantonal_tax,
            denomination='catholic'
        )
        reformed = self.service.calculate_church_tax(
            canton_code='AR',
            cantonal_tax=cantonal_tax,
            denomination='reformed'
        )

        # Unique pattern: Reformed rate HIGHER than Catholic
        assert reformed['rate_percentage'] > catholic['rate_percentage']

    def test_st_gallen_christian_catholic_uniform(self):
        """Test St. Gallen has uniform 24% for Christian Catholic."""
        cantonal_tax = Decimal('10000')
        result = self.service.calculate_church_tax(
            canton_code='SG',
            cantonal_tax=cantonal_tax,
            denomination='christian_catholic'
        )

        assert result['applies'] is True
        assert result['rate_percentage'] == 0.24  # 24% uniform
        assert result['church_tax'] == 2400.0

    def test_zug_low_tax_canton(self):
        """Test Zug has low church tax rates."""
        cantonal_tax = Decimal('10000')
        result = self.service.calculate_church_tax(
            canton_code='ZG',
            cantonal_tax=cantonal_tax,
            denomination='catholic'
        )

        assert result['applies'] is True
        assert result['rate_percentage'] <= 0.10  # Should be low (<= 10%)

    def test_case_insensitive_canton_code(self):
        """Test canton code is case-insensitive."""
        cantonal_tax = Decimal('10000')

        result_upper = self.service.calculate_church_tax(
            canton_code='ZH',
            cantonal_tax=cantonal_tax,
            denomination='catholic'
        )

        result_lower = self.service.calculate_church_tax(
            canton_code='zh',
            cantonal_tax=cantonal_tax,
            denomination='catholic'
        )

        assert result_upper['church_tax'] == result_lower['church_tax']

    def test_zero_cantonal_tax(self):
        """Test handling of zero cantonal tax."""
        result = self.service.calculate_church_tax(
            canton_code='ZH',
            cantonal_tax=Decimal('0'),
            denomination='catholic'
        )

        assert result['applies'] is True
        assert result['church_tax'] == 0.0

    def test_very_high_cantonal_tax(self):
        """Test calculation with very high cantonal tax."""
        cantonal_tax = Decimal('1000000')  # CHF 1M cantonal tax
        result = self.service.calculate_church_tax(
            canton_code='BE',
            cantonal_tax=cantonal_tax,
            denomination='catholic'
        )

        assert result['applies'] is True
        # 20.7% of 1M = CHF 207,000
        assert result['church_tax'] == 207000.0


class TestChurchTaxServiceInfo:
    """Test information retrieval methods."""

    def setup_method(self):
        """Set up test fixtures."""
        self.service = ChurchTaxService(tax_year=2024)

    def test_get_canton_info_zurich(self):
        """Test getting canton information for Zurich."""
        info = self.service.get_canton_info('ZH')

        assert info['canton'] == 'ZH'
        assert info['has_church_tax'] is True
        assert 'catholic' in info['recognized_denominations']
        assert 'reformed' in info['recognized_denominations']
        assert 'rates' in info
        assert 'catholic' in info['rates']
        assert 'reformed' in info['rates']
        assert info['calculation_method'] == 'percentage_of_cantonal_tax'

    def test_get_canton_info_geneva(self):
        """Test getting canton information for Geneva (no tax)."""
        info = self.service.get_canton_info('GE')

        assert info['canton'] == 'GE'
        assert info['has_church_tax'] is False

    def test_get_all_cantons_info(self):
        """Test getting information for all 26 cantons."""
        all_info = self.service.get_all_cantons_info()

        assert len(all_info) == 26  # All 26 Swiss cantons
        assert 'ZH' in all_info
        assert 'GE' in all_info

        # Check cantons with church tax
        assert all_info['ZH']['has_church_tax'] is True
        assert all_info['BE']['has_church_tax'] is True

        # Check cantons without church tax
        assert all_info['GE']['has_church_tax'] is False
        assert all_info['NE']['has_church_tax'] is False
        assert all_info['VD']['has_church_tax'] is False
        assert all_info['TI']['has_church_tax'] is False

    def test_is_church_tax_applicable(self):
        """Test applicability check."""
        # Should apply
        assert self.service.is_church_tax_applicable('ZH', 'catholic') is True
        assert self.service.is_church_tax_applicable('BE', 'reformed') is True

        # Should not apply
        assert self.service.is_church_tax_applicable('GE', 'catholic') is False  # No tax canton
        assert self.service.is_church_tax_applicable('ZH', 'none') is False  # No denomination
        assert self.service.is_church_tax_applicable('LU', 'jewish') is False  # Not recognized

    def test_compare_cantons(self):
        """Test canton comparison functionality."""
        cantonal_tax = Decimal('10000')
        comparison = self.service.compare_cantons(
            cantonal_tax=cantonal_tax,
            denomination='catholic',
            canton_codes=['ZH', 'BE', 'GE', 'BS', 'ZG']
        )

        assert len(comparison) == 5

        # Check Zurich
        assert comparison['ZH']['applies'] is True
        assert comparison['ZH']['church_tax'] == 1300.0  # 13%

        # Check Bern (highest)
        assert comparison['BE']['applies'] is True
        assert comparison['BE']['church_tax'] == 2070.0  # 20.7%

        # Check Geneva (no tax)
        assert comparison['GE']['applies'] is False
        assert comparison['GE']['church_tax'] == 0.0

        # Check Basel-Stadt (uniform 8%)
        assert comparison['BS']['applies'] is True
        assert comparison['BS']['church_tax'] == 800.0

        # Verify Bern has highest
        bern_tax = comparison['BE']['church_tax']
        for canton, data in comparison.items():
            if canton != 'BE' and data['applies']:
                assert bern_tax >= data['church_tax'], "Bern should have highest rates"


class TestChurchTaxServiceEdgeCases:
    """Test edge cases and error handling."""

    def setup_method(self):
        """Set up test fixtures."""
        self.service = ChurchTaxService(tax_year=2024)

    def test_invalid_canton_code(self):
        """Test handling of invalid canton code."""
        result = self.service.calculate_church_tax(
            canton_code='XX',  # Invalid
            cantonal_tax=Decimal('10000'),
            denomination='catholic'
        )

        assert result['applies'] is False
        assert result['reason'] == 'canton_not_found'

    def test_negative_cantonal_tax(self):
        """Test handling of negative cantonal tax."""
        result = self.service.calculate_church_tax(
            canton_code='ZH',
            cantonal_tax=Decimal('-1000'),
            denomination='catholic'
        )

        # Should still calculate (result would be negative)
        assert result['applies'] is True
        assert result['church_tax'] < 0

    def test_get_canton_info_invalid(self):
        """Test getting info for invalid canton."""
        info = self.service.get_canton_info('XX')

        assert 'error' in info or info['has_church_tax'] is False

    def test_all_denominations_basel_stadt(self):
        """Test Basel-Stadt supports all 4 denominations."""
        cantonal_tax = Decimal('10000')
        denominations = ['catholic', 'reformed', 'christian_catholic', 'jewish']

        for denom in denominations:
            result = self.service.calculate_church_tax(
                canton_code='BS',
                cantonal_tax=cantonal_tax,
                denomination=denom
            )
            assert result['applies'] is True
            assert result['rate_percentage'] == 0.08


class TestChurchTaxRateComparison:
    """Test rate comparisons across cantons."""

    def setup_method(self):
        """Set up test fixtures."""
        self.service = ChurchTaxService(tax_year=2024)
        self.cantonal_tax = Decimal('10000')

    def test_rate_ranges(self):
        """Test that rates fall within expected ranges."""
        cantons_with_tax = [
            'ZH', 'BE', 'LU', 'UR', 'SZ', 'OW', 'NW', 'GL', 'ZG', 'FR',
            'SO', 'BS', 'BL', 'SH', 'AR', 'AI', 'SG', 'GR', 'AG', 'TG', 'VS', 'JU'
        ]

        for canton in cantons_with_tax:
            result = self.service.calculate_church_tax(
                canton_code=canton,
                cantonal_tax=self.cantonal_tax,
                denomination='catholic'
            )

            rate = result['rate_percentage']
            # Rates should be between 6% and 25% based on research
            assert 0.06 <= rate <= 0.25, \
                f"Canton {canton} rate {rate} outside expected range 0.06-0.25"

    def test_identify_highest_and_lowest(self):
        """Test identifying highest and lowest rate cantons."""
        cantons_with_tax = [
            'ZH', 'BE', 'LU', 'UR', 'SZ', 'OW', 'NW', 'GL', 'ZG', 'FR',
            'SO', 'BS', 'BL', 'SH', 'AR', 'AI', 'SG', 'GR', 'AG', 'TG', 'VS', 'JU'
        ]

        rates = {}
        for canton in cantons_with_tax:
            result = self.service.calculate_church_tax(
                canton_code=canton,
                cantonal_tax=self.cantonal_tax,
                denomination='catholic'
            )
            rates[canton] = result['rate_percentage']

        # Bern should be highest or near highest
        assert rates['BE'] >= 0.18, "Bern should have high rate (>= 18%)"

        # Zug and Basel-Stadt should be among lowest
        assert rates['ZG'] <= 0.10, "Zug should have low rate (<= 10%)"
        assert rates['BS'] == 0.08, "Basel-Stadt should be 8%"

    def test_lucerne_equal_rates(self):
        """Test Lucerne has equal rates for both denominations."""
        catholic = self.service.calculate_church_tax(
            canton_code='LU',
            cantonal_tax=self.cantonal_tax,
            denomination='catholic'
        )
        reformed = self.service.calculate_church_tax(
            canton_code='LU',
            cantonal_tax=self.cantonal_tax,
            denomination='reformed'
        )

        assert catholic['rate_percentage'] == reformed['rate_percentage']
        assert catholic['rate_percentage'] == 0.25  # Both 25%


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
