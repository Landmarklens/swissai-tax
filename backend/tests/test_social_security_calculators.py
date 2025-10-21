"""Tests for Social Security Calculators

Test scenarios based on official Swiss social security rates for 2024.

Test cases cover:
1. AHV/IV/EO: Employed and self-employed with sliding scale
2. ALV: Standard and solidarity contributions
3. UVG NBU: Non-occupational accident insurance
4. BVG: Age-dependent rates and coordinated salary
5. Integration: Complete calculations for various scenarios
"""
import pytest
from decimal import Decimal
from services.social_security_calculators import (
    AHVCalculator,
    ALVCalculator,
    UVGCalculator,
    BVGCalculator,
    SocialSecurityCalculator
)


class TestAHVCalculator:
    """Tests for AHV/IV/EO calculator"""

    def test_employed_standard_salary(self):
        """Test AHV for employed person with standard salary"""
        calc = AHVCalculator(tax_year=2024)
        result = calc.calculate_employed(Decimal('85000'))

        assert result['employee_contribution'] == Decimal('4505.00')  # 85000 * 0.053
        assert result['employer_contribution'] == Decimal('4505.00')
        assert result['total_contribution'] == Decimal('9010.00')
        assert result['effective_rate_employee'] == Decimal('0.053')
        assert result['is_tax_deductible'] is False

    def test_employed_part_time(self):
        """Test AHV for part-time employed (50%)"""
        calc = AHVCalculator(tax_year=2024)
        result = calc.calculate_employed(Decimal('85000'), work_percentage=Decimal('50'))

        expected_salary = Decimal('42500')  # 85000 * 0.5
        expected_contribution = expected_salary * Decimal('0.053')

        assert result['employee_contribution'] == expected_contribution.quantize(Decimal('0.01'))
        assert result['employer_contribution'] == expected_contribution.quantize(Decimal('0.01'))

    def test_self_employed_lowest_bracket(self):
        """Test AHV for self-employed in lowest bracket (<= CHF 9,800)"""
        calc = AHVCalculator(tax_year=2024)
        result = calc.calculate_self_employed(Decimal('8000'))

        expected = Decimal('8000') * Decimal('0.05371')
        assert result['contribution'] == expected.quantize(Decimal('0.01'))
        assert result['rate_category'] == 'lowest'
        # Effective rate is quantized to 0.05 precision
        assert result['effective_rate'] == Decimal('0.05371').quantize(Decimal('0.05'))

    def test_self_employed_sliding_scale(self):
        """Test AHV for self-employed in sliding scale bracket"""
        calc = AHVCalculator(tax_year=2024)
        result = calc.calculate_self_employed(Decimal('30000'))

        # Sliding scale: Fixed CHF 4,000/year
        assert result['contribution'] == Decimal('4000.00')
        assert result['rate_category'] == 'sliding'
        # Effective rate: 4000/30000 = 13.33%
        expected_rate = (Decimal('4000') / Decimal('30000')).quantize(Decimal('0.05'))
        assert result['effective_rate'] == expected_rate

    def test_self_employed_highest_bracket(self):
        """Test AHV for self-employed in highest bracket (> CHF 58,800)"""
        calc = AHVCalculator(tax_year=2024)
        result = calc.calculate_self_employed(Decimal('100000'))

        expected = Decimal('100000') * Decimal('0.10')
        assert result['contribution'] == expected.quantize(Decimal('0.01'))
        assert result['rate_category'] == 'highest'
        assert result['effective_rate'] == Decimal('0.10')


class TestALVCalculator:
    """Tests for ALV (unemployment insurance) calculator"""

    def test_employed_below_ceiling(self):
        """Test ALV for salary below CHF 148,200 ceiling"""
        calc = ALVCalculator(tax_year=2024)
        result = calc.calculate_employed(Decimal('85000'))

        # All income at standard rate 1.1% (0.55% employee)
        expected_employee = Decimal('85000') * Decimal('0.0055')
        expected_employer = Decimal('85000') * Decimal('0.0055')

        assert result['employee_contribution'] == expected_employee.quantize(Decimal('0.01'))
        assert result['employer_contribution'] == expected_employer.quantize(Decimal('0.01'))
        assert result['solidarity_contribution_employee'] == Decimal('0.00')
        assert result['income_above_ceiling'] == Decimal('0.00')

    def test_employed_above_ceiling(self):
        """Test ALV for salary above CHF 148,200 ceiling with solidarity rate"""
        calc = ALVCalculator(tax_year=2024)
        result = calc.calculate_employed(Decimal('200000'))

        # Up to ceiling: 148,200 * 0.0055
        standard_employee = Decimal('148200') * Decimal('0.0055')
        # Above ceiling: (200,000 - 148,200) * 0.0025
        solidarity_employee = (Decimal('200000') - Decimal('148200')) * Decimal('0.0025')

        assert result['standard_contribution_employee'] == standard_employee.quantize(Decimal('0.01'))
        assert result['solidarity_contribution_employee'] == solidarity_employee.quantize(Decimal('0.01'))
        assert result['income_above_ceiling'] == Decimal('51800.00')

    def test_self_employed_not_applicable(self):
        """Test ALV for self-employed (not applicable)"""
        calc = ALVCalculator(tax_year=2024)
        result = calc.calculate_self_employed()

        assert result['contribution'] == Decimal('0')
        assert result['is_applicable'] is False


class TestUVGCalculator:
    """Tests for UVG NBU (accident insurance) calculator"""

    def test_employed_full_time(self):
        """Test UVG NBU for full-time employee"""
        calc = UVGCalculator(tax_year=2024)
        result = calc.calculate_employed(Decimal('85000'))

        # Default average rate 1.6%
        expected = Decimal('85000') * Decimal('0.016')
        assert result['nbu_contribution'] == expected.quantize(Decimal('0.01'))
        assert result['nbu_rate_used'] == Decimal('0.016')
        assert result['is_mandatory'] is True

    def test_employed_custom_rate(self):
        """Test UVG NBU with custom employer rate"""
        calc = UVGCalculator(tax_year=2024)
        custom_rate = Decimal('0.012')  # 1.2%
        result = calc.calculate_employed(Decimal('85000'), nbu_rate=custom_rate)

        expected = Decimal('85000') * custom_rate
        assert result['nbu_contribution'] == expected.quantize(Decimal('0.01'))
        assert result['nbu_rate_used'] == custom_rate

    def test_employed_below_minimum_hours(self):
        """Test UVG NBU for part-time <8 hours/week (~20%)"""
        calc = UVGCalculator(tax_year=2024)
        result = calc.calculate_employed(Decimal('85000'), work_percentage=Decimal('15'))

        # Not mandatory below 20% work percentage
        assert result['nbu_contribution'] == Decimal('0.00')
        assert result['is_mandatory'] is False


class TestBVGCalculator:
    """Tests for BVG (Pillar 2) calculator"""

    def test_coordinated_salary_calculation(self):
        """Test coordinated salary calculation"""
        calc = BVGCalculator(tax_year=2024)

        # CHF 85,000 - CHF 25,725 = CHF 59,275
        result = calc.calculate_employed(Decimal('85000'), age=35)
        assert result['coordinated_salary'] == Decimal('59275.00')

    def test_age_25_34_rate(self):
        """Test BVG for age 25-34 (7% rate)"""
        calc = BVGCalculator(tax_year=2024)
        result = calc.calculate_employed(Decimal('85000'), age=30)

        coordinated = Decimal('85000') - Decimal('25725')  # 59,275
        expected_employee = coordinated * Decimal('0.07')

        assert result['employee_contribution'] == expected_employee.quantize(Decimal('0.01'))
        assert result['employer_contribution'] == expected_employee.quantize(Decimal('0.01'))
        assert result['age_category'] == 'age_25_34'
        assert result['is_tax_deductible'] is True

    def test_age_35_44_rate(self):
        """Test BVG for age 35-44 (10% rate)"""
        calc = BVGCalculator(tax_year=2024)
        result = calc.calculate_employed(Decimal('85000'), age=40)

        coordinated = Decimal('85000') - Decimal('25725')
        expected_employee = coordinated * Decimal('0.10')

        assert result['employee_contribution'] == expected_employee.quantize(Decimal('0.01'))
        assert result['age_category'] == 'age_35_44'

    def test_age_45_54_rate(self):
        """Test BVG for age 45-54 (15% rate)"""
        calc = BVGCalculator(tax_year=2024)
        result = calc.calculate_employed(Decimal('85000'), age=50)

        coordinated = Decimal('85000') - Decimal('25725')
        expected_employee = coordinated * Decimal('0.15')

        assert result['employee_contribution'] == expected_employee.quantize(Decimal('0.01'))
        assert result['age_category'] == 'age_45_54'

    def test_age_55_65_rate(self):
        """Test BVG for age 55-65 (18% rate)"""
        calc = BVGCalculator(tax_year=2024)
        result = calc.calculate_employed(Decimal('85000'), age=60)

        coordinated = Decimal('85000') - Decimal('25725')
        expected_employee = coordinated * Decimal('0.18')

        assert result['employee_contribution'] == expected_employee.quantize(Decimal('0.01'))
        assert result['age_category'] == 'age_55_65'

    def test_below_minimum_salary(self):
        """Test BVG below minimum salary threshold"""
        calc = BVGCalculator(tax_year=2024)
        result = calc.calculate_employed(Decimal('20000'), age=35)

        assert result['employee_contribution'] == Decimal('0.00')
        assert result['is_mandatory'] is False

    def test_age_under_25(self):
        """Test BVG for age under 25 (not applicable)"""
        calc = BVGCalculator(tax_year=2024)
        result = calc.calculate_employed(Decimal('85000'), age=24)

        assert result['employee_contribution'] == Decimal('0.00')
        assert result['age_category'] == 'not_applicable'


class TestSocialSecurityCalculator:
    """Integration tests for main SocialSecurityCalculator"""

    def test_employed_complete_calculation(self):
        """Test complete social security calculation for employed person"""
        calc = SocialSecurityCalculator(tax_year=2024)
        result = calc.calculate_employed(
            gross_salary=Decimal('85000'),
            age=35,
            work_percentage=Decimal('100')
        )

        # Verify all components are calculated
        assert 'ahv_iv_eo' in result
        assert 'alv' in result
        assert 'uvg_nbu' in result
        assert 'bvg' in result

        # Verify AHV (5.3%)
        assert result['ahv_iv_eo']['employee_contribution'] == Decimal('4505.00')

        # Verify ALV (0.55% up to ceiling)
        expected_alv = Decimal('85000') * Decimal('0.0055')
        assert result['alv']['employee_contribution'] == expected_alv.quantize(Decimal('0.01'))

        # Verify UVG (~1.6%)
        expected_uvg = Decimal('85000') * Decimal('0.016')
        assert result['uvg_nbu']['nbu_contribution'] == expected_uvg.quantize(Decimal('0.01'))

        # Verify BVG (10% for age 35 on coordinated salary)
        coordinated = Decimal('85000') - Decimal('25725')
        expected_bvg = coordinated * Decimal('0.10')
        assert result['bvg']['employee_contribution'] == expected_bvg.quantize(Decimal('0.01'))

        # Verify totals
        total_employee = (
            result['ahv_iv_eo']['employee_contribution'] +
            result['alv']['employee_contribution'] +
            result['uvg_nbu']['nbu_contribution'] +
            result['bvg']['employee_contribution']
        )
        assert result['total_employee_contributions'] == total_employee

        # Verify tax deductible (only BVG)
        assert result['tax_deductible_employee'] == result['bvg']['employee_contribution']

    def test_employed_high_salary_with_solidarity(self):
        """Test calculation for high salary requiring ALV solidarity contribution"""
        calc = SocialSecurityCalculator(tax_year=2024)
        result = calc.calculate_employed(
            gross_salary=Decimal('200000'),
            age=45,
            work_percentage=Decimal('100')
        )

        # Verify ALV includes solidarity contribution
        assert result['alv']['income_above_ceiling'] > Decimal('0')
        assert result['alv']['solidarity_contribution_employee'] > Decimal('0')

        # Verify BVG uses 15% rate for age 45
        assert result['bvg']['age_category'] == 'age_45_54'

    def test_employed_part_time(self):
        """Test calculation for part-time employee (60%)"""
        calc = SocialSecurityCalculator(tax_year=2024)
        result = calc.calculate_employed(
            gross_salary=Decimal('85000'),
            age=30,
            work_percentage=Decimal('60')
        )

        # Verify work percentage is applied
        adjusted_salary = Decimal('85000') * Decimal('0.6')  # 51,000

        # AHV should be on adjusted salary
        expected_ahv = adjusted_salary * Decimal('0.053')
        assert result['ahv_iv_eo']['employee_contribution'] == expected_ahv.quantize(Decimal('0.01'))

    def test_self_employed_complete_calculation(self):
        """Test complete social security calculation for self-employed person"""
        calc = SocialSecurityCalculator(tax_year=2024)
        result = calc.calculate_self_employed(
            net_income=Decimal('75000'),
            age=40
        )

        # Verify employment type
        assert result['employment_type'] == 'self_employed'

        # Verify AHV is calculated (only mandatory contribution)
        assert result['ahv_iv_eo']['contribution'] > Decimal('0')

        # Verify ALV not applicable
        assert result['alv']['is_applicable'] is False

        # Verify UVG not applicable
        assert result['uvg']['is_applicable'] is False

        # Verify BVG not applicable
        assert result['bvg']['is_applicable'] is False

        # Total should equal AHV only
        assert result['total_contributions'] == result['ahv_iv_eo']['contribution']

    def test_self_employed_sliding_scale(self):
        """Test self-employed in AHV sliding scale bracket"""
        calc = SocialSecurityCalculator(tax_year=2024)
        result = calc.calculate_self_employed(
            net_income=Decimal('30000'),
            age=35
        )

        # Should be in sliding scale (CHF 4,000 fixed)
        assert result['ahv_iv_eo']['contribution'] == Decimal('4000.00')
        assert result['ahv_iv_eo']['rate_category'] == 'sliding'

    def test_breakdown_summary_employed(self):
        """Test human-readable breakdown for employed person"""
        calc = SocialSecurityCalculator(tax_year=2024)
        result = calc.calculate_employed(
            gross_salary=Decimal('85000'),
            age=35
        )

        summary = calc.get_breakdown_summary(result)

        assert summary['employment_type'] == 'Employed'
        assert len(summary['contributions']) == 4
        assert 'totals' in summary
        assert summary['totals']['effective_rate'] > 0

    def test_breakdown_summary_self_employed(self):
        """Test human-readable breakdown for self-employed person"""
        calc = SocialSecurityCalculator(tax_year=2024)
        result = calc.calculate_self_employed(
            net_income=Decimal('75000'),
            age=40
        )

        summary = calc.get_breakdown_summary(result)

        assert summary['employment_type'] == 'Self-Employed'
        assert len(summary['contributions']) == 1  # Only AHV
        assert 'notes' in summary

    def test_zero_income(self):
        """Test calculation with zero income"""
        calc = SocialSecurityCalculator(tax_year=2024)

        # Employed with zero salary
        result_employed = calc.calculate_employed(
            gross_salary=Decimal('0'),
            age=35
        )
        assert result_employed['total_employee_contributions'] == Decimal('0')

        # Self-employed with zero income
        result_self = calc.calculate_self_employed(
            net_income=Decimal('0'),
            age=40
        )
        assert result_self['total_contributions'] == Decimal('0')


# Run tests with: pytest tests/test_social_security_calculators.py -v
