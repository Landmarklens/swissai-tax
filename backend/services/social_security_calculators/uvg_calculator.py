"""UVG Calculator

Accident Insurance (Unfallversicherung) Calculator

Source: Swiss Federal Social Insurance Office (FSIO)
- UVG Law (Unfallversicherungsgesetz)
- SUVA and private insurers

Tax year: 2024

UVG has two components:
1. BU (Berufsunfall): Occupational accidents - paid by EMPLOYER
2. NBU (Nichtberufsunfall): Non-occupational accidents - paid by EMPLOYEE

EMPLOYED PERSONS (NBU only - what employee pays):
- Average rate: ~1.6% of gross salary
- Rates vary by insurer and industry (0.7% - 3.0% typical range)
- Applied to gross salary
- Only for employees working >8 hours/week
- NOT tax deductible (federal tax)

SELF-EMPLOYED PERSONS:
- Optional private accident insurance
- Rates vary by provider and coverage
"""
from decimal import Decimal
from typing import Dict, Optional


class UVGCalculator:
    """Calculator for UVG (accident insurance) contributions"""

    # 2024 average rate for NBU (non-occupational accidents)
    # Employee pays NBU, employer pays BU (occupational)
    RATE_NBU_EMPLOYEE_AVERAGE = Decimal('0.016')  # 1.6% average
    RATE_NBU_EMPLOYEE_LOW = Decimal('0.007')      # 0.7% low end
    RATE_NBU_EMPLOYEE_HIGH = Decimal('0.030')     # 3.0% high end

    # Minimum working hours per week for mandatory coverage
    MIN_WORKING_HOURS_PER_WEEK = 8

    def __init__(self, tax_year: int = 2024):
        """
        Initialize UVG calculator.

        Args:
            tax_year: Tax year (default 2024)
        """
        self.tax_year = tax_year
        if tax_year != 2024:
            raise ValueError(f"UVG calculator only supports 2024, got {tax_year}")

    def calculate_employed(self, gross_salary: Decimal,
                          work_percentage: Decimal = Decimal('100'),
                          nbu_rate: Optional[Decimal] = None) -> Dict[str, Decimal]:
        """
        Calculate UVG NBU for employed persons.

        Note: Only calculates NBU (non-occupational) which employee pays.
        BU (occupational) is paid by employer and not included.

        Args:
            gross_salary: Annual gross salary in CHF
            work_percentage: Work percentage (100 = full-time)
            nbu_rate: Specific NBU rate from employer (if known), otherwise uses average

        Returns:
            Dictionary with:
            - nbu_contribution: Employee's NBU contribution
            - nbu_rate_used: Rate applied
            - is_mandatory: Whether coverage is mandatory (>8 hours/week)
            - is_tax_deductible: Whether deductible (False for federal)
        """
        if gross_salary <= 0:
            return {
                'nbu_contribution': Decimal('0'),
                'nbu_rate_used': Decimal('0'),
                'is_mandatory': False,
                'is_tax_deductible': False
            }

        # Determine if mandatory (>8 hours/week for full-time)
        # Approximate: 100% = 40-42 hours/week, so >8 hours = ~20% work percentage
        is_mandatory = work_percentage >= Decimal('20')

        if not is_mandatory:
            return {
                'nbu_contribution': Decimal('0'),
                'nbu_rate_used': Decimal('0'),
                'is_mandatory': False,
                'note': 'NBU not mandatory for work <8 hours/week (~20% work percentage)',
                'is_tax_deductible': False
            }

        # Use provided rate or average
        rate_to_use = nbu_rate if nbu_rate is not None else self.RATE_NBU_EMPLOYEE_AVERAGE

        # Validate rate is in reasonable range
        if rate_to_use < self.RATE_NBU_EMPLOYEE_LOW or rate_to_use > self.RATE_NBU_EMPLOYEE_HIGH:
            raise ValueError(
                f"NBU rate {rate_to_use} outside typical range "
                f"{self.RATE_NBU_EMPLOYEE_LOW}-{self.RATE_NBU_EMPLOYEE_HIGH}"
            )

        # Apply work percentage
        adjusted_salary = gross_salary * (work_percentage / Decimal('100'))

        # Calculate NBU contribution
        nbu_contribution = adjusted_salary * rate_to_use

        return {
            'nbu_contribution': nbu_contribution.quantize(Decimal('0.01')),
            'nbu_rate_used': rate_to_use,
            'is_mandatory': is_mandatory,
            'is_tax_deductible': False
        }

    def calculate_self_employed(self) -> Dict[str, Decimal]:
        """
        Calculate UVG for self-employed persons.

        Self-employed persons must arrange private accident insurance.
        Rates vary by provider and coverage level.

        Returns:
            Dictionary indicating private insurance needed
        """
        return {
            'contribution': Decimal('0'),
            'is_applicable': False,
            'note': 'Self-employed must arrange private accident insurance. Rates vary by provider.',
            'is_tax_deductible': False
        }

    def get_info(self) -> Dict:
        """Get calculator information."""
        return {
            'contribution_type': 'UVG_NBU',
            'description': 'Non-occupational Accident Insurance (employee pays)',
            'tax_year': self.tax_year,
            'employed': {
                'rate_average': float(self.RATE_NBU_EMPLOYEE_AVERAGE),
                'rate_range_low': float(self.RATE_NBU_EMPLOYEE_LOW),
                'rate_range_high': float(self.RATE_NBU_EMPLOYEE_HIGH),
                'min_working_hours_per_week': self.MIN_WORKING_HOURS_PER_WEEK,
                'note': 'BU (occupational accidents) paid by employer, not included here'
            },
            'self_employed': {
                'is_applicable': False,
                'note': 'Must arrange private insurance, rates vary'
            },
            'is_tax_deductible': False,
            'source': 'UVG Law and SUVA guidelines'
        }
