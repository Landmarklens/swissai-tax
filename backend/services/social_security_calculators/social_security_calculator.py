"""Social Security Calculator Service

Main service that coordinates all social security calculators and provides
comprehensive calculation for Swiss social security contributions.

This service integrates:
- AHV/IV/EO (Old Age, Disability, Income Compensation)
- ALV (Unemployment Insurance)
- UVG NBU (Non-occupational Accident Insurance)
- BVG (Occupational Pension / Pillar 2)

Usage:
    calculator = SocialSecurityCalculator(tax_year=2024)

    # For employed persons
    result = calculator.calculate_employed(
        gross_salary=Decimal('85000'),
        age=35,
        work_percentage=Decimal('100')
    )

    # For self-employed persons
    result = calculator.calculate_self_employed(
        net_income=Decimal('75000'),
        age=40
    )
"""
from decimal import Decimal
from typing import Dict, Optional
from .ahv_calculator import AHVCalculator
from .alv_calculator import ALVCalculator
from .uvg_calculator import UVGCalculator
from .bvg_calculator import BVGCalculator


class SocialSecurityCalculator:
    """
    Main service for calculating all Swiss social security contributions.
    """

    def __init__(self, tax_year: int = 2024):
        """
        Initialize social security calculator with all sub-calculators.

        Args:
            tax_year: Tax year for calculations (default 2024)
        """
        self.tax_year = tax_year

        # Initialize all sub-calculators
        self.ahv_calculator = AHVCalculator(tax_year)
        self.alv_calculator = ALVCalculator(tax_year)
        self.uvg_calculator = UVGCalculator(tax_year)
        self.bvg_calculator = BVGCalculator(tax_year)

    def calculate_employed(self, gross_salary: Decimal, age: int,
                          work_percentage: Decimal = Decimal('100'),
                          nbu_rate: Optional[Decimal] = None) -> Dict[str, any]:
        """
        Calculate all social security contributions for employed persons.

        Args:
            gross_salary: Annual gross salary in CHF
            age: Employee age (for BVG age-dependent rates)
            work_percentage: Work percentage (100 = full-time, 50 = part-time 50%, etc.)
            nbu_rate: Specific UVG NBU rate (if known from employer)

        Returns:
            Dictionary with:
            - ahv_iv_eo: AHV/IV/EO calculation results
            - alv: ALV calculation results
            - uvg_nbu: UVG NBU calculation results
            - bvg: BVG calculation results
            - total_employee_contributions: Total employee pays
            - total_employer_contributions: Total employer pays
            - total_contributions: Grand total
            - tax_deductible_employee: Amount employee can deduct from taxes
            - net_salary_after_contributions: Gross salary minus employee contributions
            - effective_rate_employee: Total employee rate as % of gross
        """
        if gross_salary <= 0:
            return self._empty_result()

        # Calculate each component
        ahv_result = self.ahv_calculator.calculate_employed(gross_salary, work_percentage)
        alv_result = self.alv_calculator.calculate_employed(gross_salary, work_percentage)
        uvg_result = self.uvg_calculator.calculate_employed(gross_salary, work_percentage, nbu_rate)
        bvg_result = self.bvg_calculator.calculate_employed(gross_salary, age, work_percentage)

        # Sum employee contributions
        total_employee = (
            ahv_result['employee_contribution'] +
            alv_result['employee_contribution'] +
            uvg_result.get('nbu_contribution', Decimal('0')) +
            bvg_result['employee_contribution']
        )

        # Sum employer contributions
        total_employer = (
            ahv_result['employer_contribution'] +
            alv_result['employer_contribution'] +
            bvg_result['employer_contribution']
        )

        total_all = total_employee + total_employer

        # Calculate tax deductible amount (only BVG employee contribution)
        tax_deductible = bvg_result['employee_contribution']

        # Calculate net salary and effective rate
        adjusted_salary = gross_salary * (work_percentage / Decimal('100'))
        net_salary = adjusted_salary - total_employee
        effective_rate = (total_employee / adjusted_salary * Decimal('100')) if adjusted_salary > 0 else Decimal('0')

        return {
            'ahv_iv_eo': ahv_result,
            'alv': alv_result,
            'uvg_nbu': uvg_result,
            'bvg': bvg_result,
            'total_employee_contributions': total_employee.quantize(Decimal('0.01')),
            'total_employer_contributions': total_employer.quantize(Decimal('0.01')),
            'total_contributions': total_all.quantize(Decimal('0.01')),
            'tax_deductible_employee': tax_deductible.quantize(Decimal('0.01')),
            'net_salary_after_contributions': net_salary.quantize(Decimal('0.01')),
            'effective_rate_employee': effective_rate.quantize(Decimal('0.01')),
            'gross_salary': gross_salary,
            'work_percentage': work_percentage,
            'age': age,
            'employment_type': 'employed'
        }

    def calculate_self_employed(self, net_income: Decimal, age: int) -> Dict[str, any]:
        """
        Calculate all social security contributions for self-employed persons.

        Self-employed have different rules:
        - AHV/IV/EO: Sliding scale 5.371% to 10% (mandatory)
        - ALV: Not applicable (not mandatory)
        - UVG: Optional private insurance
        - BVG: Optional (can join voluntarily)

        Args:
            net_income: Annual net income from self-employment in CHF
            age: Age (for informational purposes)

        Returns:
            Dictionary with:
            - ahv_iv_eo: AHV/IV/EO calculation results with sliding scale
            - alv: Not applicable
            - uvg: Not applicable (private insurance note)
            - bvg: Not applicable (voluntary note)
            - total_contributions: Total mandatory contributions (just AHV)
            - tax_deductible: Amount deductible (none for AHV)
            - net_income_after_contributions: Net income minus contributions
            - effective_rate: Total contribution rate as % of net income
        """
        if net_income <= 0:
            return self._empty_result_self_employed()

        # Calculate AHV/IV/EO (only mandatory contribution for self-employed)
        ahv_result = self.ahv_calculator.calculate_self_employed(net_income)

        # Other contributions not mandatory
        alv_result = self.alv_calculator.calculate_self_employed()
        uvg_result = self.uvg_calculator.calculate_self_employed()
        bvg_result = self.bvg_calculator.calculate_self_employed()

        # Total mandatory contributions (only AHV)
        total_contributions = ahv_result['contribution']

        # Tax deductible (none for AHV)
        tax_deductible = Decimal('0')

        # Net income after contributions
        net_after = net_income - total_contributions
        effective_rate = (total_contributions / net_income * Decimal('100')) if net_income > 0 else Decimal('0')

        return {
            'ahv_iv_eo': ahv_result,
            'alv': alv_result,
            'uvg': uvg_result,
            'bvg': bvg_result,
            'total_contributions': total_contributions.quantize(Decimal('0.01')),
            'tax_deductible': tax_deductible.quantize(Decimal('0.01')),
            'net_income_after_contributions': net_after.quantize(Decimal('0.01')),
            'effective_rate': effective_rate.quantize(Decimal('0.01')),
            'net_income': net_income,
            'age': age,
            'employment_type': 'self_employed',
            'notes': {
                'alv': 'Not mandatory for self-employed',
                'uvg': 'Optional private insurance - arrange separately',
                'bvg': 'Optional Pillar 2 - can join voluntarily through various providers'
            }
        }

    def _empty_result(self) -> Dict:
        """Return empty result for employed persons."""
        return {
            'ahv_iv_eo': {'employee_contribution': Decimal('0'), 'employer_contribution': Decimal('0')},
            'alv': {'employee_contribution': Decimal('0'), 'employer_contribution': Decimal('0')},
            'uvg_nbu': {'nbu_contribution': Decimal('0')},
            'bvg': {'employee_contribution': Decimal('0'), 'employer_contribution': Decimal('0')},
            'total_employee_contributions': Decimal('0'),
            'total_employer_contributions': Decimal('0'),
            'total_contributions': Decimal('0'),
            'tax_deductible_employee': Decimal('0'),
            'net_salary_after_contributions': Decimal('0'),
            'effective_rate_employee': Decimal('0'),
            'employment_type': 'employed'
        }

    def _empty_result_self_employed(self) -> Dict:
        """Return empty result for self-employed persons."""
        return {
            'ahv_iv_eo': {'contribution': Decimal('0')},
            'alv': {'is_applicable': False},
            'uvg': {'is_applicable': False},
            'bvg': {'is_applicable': False},
            'total_contributions': Decimal('0'),
            'tax_deductible': Decimal('0'),
            'net_income_after_contributions': Decimal('0'),
            'effective_rate': Decimal('0'),
            'employment_type': 'self_employed'
        }

    def get_breakdown_summary(self, calculation_result: Dict) -> Dict:
        """
        Get human-readable summary of contributions breakdown.

        Args:
            calculation_result: Result from calculate_employed or calculate_self_employed

        Returns:
            Dictionary with formatted breakdown for display
        """
        employment_type = calculation_result.get('employment_type', 'employed')

        if employment_type == 'employed':
            return {
                'employment_type': 'Employed',
                'contributions': [
                    {
                        'name': 'AHV/IV/EO (Old Age/Disability/Income Comp.)',
                        'employee': float(calculation_result['ahv_iv_eo']['employee_contribution']),
                        'employer': float(calculation_result['ahv_iv_eo']['employer_contribution']),
                        'rate': '5.3% + 5.3%',
                        'deductible': False
                    },
                    {
                        'name': 'ALV (Unemployment Insurance)',
                        'employee': float(calculation_result['alv']['employee_contribution']),
                        'employer': float(calculation_result['alv']['employer_contribution']),
                        'rate': '1.1% + 1.1% (up to CHF 148,200)',
                        'deductible': False
                    },
                    {
                        'name': 'UVG NBU (Non-occupational Accidents)',
                        'employee': float(calculation_result['uvg_nbu'].get('nbu_contribution', 0)),
                        'employer': 0.0,
                        'rate': '~1.6% (varies)',
                        'deductible': False
                    },
                    {
                        'name': 'BVG (Occupational Pension / Pillar 2)',
                        'employee': float(calculation_result['bvg']['employee_contribution']),
                        'employer': float(calculation_result['bvg']['employer_contribution']),
                        'rate': f"{calculation_result['bvg'].get('age_category', 'varies')}",
                        'deductible': True
                    }
                ],
                'totals': {
                    'employee_total': float(calculation_result['total_employee_contributions']),
                    'employer_total': float(calculation_result['total_employer_contributions']),
                    'grand_total': float(calculation_result['total_contributions']),
                    'tax_deductible': float(calculation_result['tax_deductible_employee']),
                    'effective_rate': float(calculation_result['effective_rate_employee'])
                }
            }
        else:  # self_employed
            return {
                'employment_type': 'Self-Employed',
                'contributions': [
                    {
                        'name': 'AHV/IV/EO (Old Age/Disability/Income Comp.)',
                        'amount': float(calculation_result['ahv_iv_eo']['contribution']),
                        'rate': f"{float(calculation_result['ahv_iv_eo']['effective_rate']) * 100:.2f}%",
                        'category': calculation_result['ahv_iv_eo']['rate_category'],
                        'deductible': False
                    }
                ],
                'notes': calculation_result.get('notes', {}),
                'totals': {
                    'total_mandatory': float(calculation_result['total_contributions']),
                    'tax_deductible': float(calculation_result['tax_deductible']),
                    'effective_rate': float(calculation_result['effective_rate'])
                }
            }

    def get_all_info(self) -> Dict:
        """Get information about all calculators."""
        return {
            'tax_year': self.tax_year,
            'ahv_iv_eo': self.ahv_calculator.get_info(),
            'alv': self.alv_calculator.get_info(),
            'uvg_nbu': self.uvg_calculator.get_info(),
            'bvg': self.bvg_calculator.get_info()
        }
