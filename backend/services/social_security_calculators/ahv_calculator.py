"""AHV/IV/EO Calculator

Old Age, Disability, and Income Compensation Insurance Calculator

Source: Swiss Federal Social Insurance Office (FSIO)
- Official rates: https://www.ahv-iv.ch/de/Merkblätter-Formulare/Merkblätter/Beiträge
- Leaflet 2.01: Contributions to AHV, IV and EO
- Leaflet 2.02: Contributions from self-employed persons

Tax year: 2024

EMPLOYED PERSONS:
- Total rate: 10.6% (5.3% employee + 5.3% employer)
- Applied to gross salary
- No income ceiling
- NOT tax deductible (federal tax)

SELF-EMPLOYED PERSONS:
- Sliding scale based on net income from self-employment
- Rates: 5.371% (lowest) to 10.0% (highest)
- Income brackets:
  * CHF 0 - 9,800: 5.371% (includes administrative costs)
  * CHF 9,800 - 58,800: Sliding scale 6.8% average (CHF 4,000/year contribution)
  * Above CHF 58,800: 10.0%
- NOT tax deductible (federal tax)
"""
from decimal import Decimal
from typing import Dict, Optional


class AHVCalculator:
    """Calculator for AHV/IV/EO contributions"""

    # 2024 official rates for employed persons
    RATE_EMPLOYED_EMPLOYEE = Decimal('0.053')  # 5.3%
    RATE_EMPLOYED_EMPLOYER = Decimal('0.053')  # 5.3%
    RATE_EMPLOYED_TOTAL = Decimal('0.106')     # 10.6%

    # 2024 official rates for self-employed
    RATE_SELF_EMPLOYED_LOWEST = Decimal('0.05371')  # 5.371% (up to CHF 9,800)
    RATE_SELF_EMPLOYED_HIGHEST = Decimal('0.10')    # 10.0% (above CHF 58,800)

    # Income thresholds for self-employed sliding scale
    THRESHOLD_LOWEST = Decimal('9800')      # Up to CHF 9,800: 5.371%
    THRESHOLD_SLIDING_END = Decimal('58800')  # Above CHF 58,800: 10.0%

    # Fixed annual contribution in sliding scale range
    FIXED_CONTRIBUTION_SLIDING = Decimal('4000')  # CHF 4,000/year

    def __init__(self, tax_year: int = 2024):
        """
        Initialize AHV calculator.

        Args:
            tax_year: Tax year (default 2024)
        """
        self.tax_year = tax_year
        if tax_year != 2024:
            raise ValueError(f"AHV calculator only supports 2024, got {tax_year}")

    def calculate_employed(self, gross_salary: Decimal,
                          work_percentage: Decimal = Decimal('100')) -> Dict[str, Decimal]:
        """
        Calculate AHV/IV/EO for employed persons.

        Args:
            gross_salary: Annual gross salary in CHF
            work_percentage: Work percentage (100 = full-time)

        Returns:
            Dictionary with:
            - employee_contribution: Employee's AHV/IV/EO contribution
            - employer_contribution: Employer's AHV/IV/EO contribution
            - total_contribution: Total AHV/IV/EO contribution
            - effective_rate_employee: Effective rate for employee
            - is_tax_deductible: Whether deductible (False for federal)
        """
        if gross_salary <= 0:
            return {
                'employee_contribution': Decimal('0'),
                'employer_contribution': Decimal('0'),
                'total_contribution': Decimal('0'),
                'effective_rate_employee': Decimal('0'),
                'is_tax_deductible': False
            }

        # Apply work percentage
        adjusted_salary = gross_salary * (work_percentage / Decimal('100'))

        # Calculate contributions (no ceiling for AHV/IV/EO)
        employee_contribution = adjusted_salary * self.RATE_EMPLOYED_EMPLOYEE
        employer_contribution = adjusted_salary * self.RATE_EMPLOYED_EMPLOYER
        total_contribution = employee_contribution + employer_contribution

        return {
            'employee_contribution': employee_contribution.quantize(Decimal('0.01')),
            'employer_contribution': employer_contribution.quantize(Decimal('0.01')),
            'total_contribution': total_contribution.quantize(Decimal('0.01')),
            'effective_rate_employee': self.RATE_EMPLOYED_EMPLOYEE,
            'is_tax_deductible': False
        }

    def calculate_self_employed(self, net_income: Decimal) -> Dict[str, Decimal]:
        """
        Calculate AHV/IV/EO for self-employed persons using sliding scale.

        Official sliding scale system:
        1. Up to CHF 9,800: 5.371% (includes admin costs)
        2. CHF 9,800 - 58,800: Fixed CHF 4,000/year (6.8% average)
        3. Above CHF 58,800: 10.0%

        Args:
            net_income: Annual net income from self-employment in CHF

        Returns:
            Dictionary with:
            - contribution: Self-employed AHV/IV/EO contribution
            - effective_rate: Actual rate applied
            - rate_category: Which bracket applied
            - is_tax_deductible: Whether deductible (False for federal)
        """
        if net_income <= 0:
            return {
                'contribution': Decimal('0'),
                'effective_rate': Decimal('0'),
                'rate_category': 'none',
                'is_tax_deductible': False
            }

        # Determine which bracket and calculate
        if net_income <= self.THRESHOLD_LOWEST:
            # Lowest bracket: 5.371%
            contribution = net_income * self.RATE_SELF_EMPLOYED_LOWEST
            effective_rate = self.RATE_SELF_EMPLOYED_LOWEST
            rate_category = 'lowest'

        elif net_income <= self.THRESHOLD_SLIDING_END:
            # Sliding scale: Fixed CHF 4,000/year
            contribution = self.FIXED_CONTRIBUTION_SLIDING
            effective_rate = (contribution / net_income) if net_income > 0 else Decimal('0')
            rate_category = 'sliding'

        else:
            # Highest bracket: 10.0%
            contribution = net_income * self.RATE_SELF_EMPLOYED_HIGHEST
            effective_rate = self.RATE_SELF_EMPLOYED_HIGHEST
            rate_category = 'highest'

        return {
            'contribution': contribution.quantize(Decimal('0.01')),
            'effective_rate': effective_rate.quantize(Decimal('0.05')),
            'rate_category': rate_category,
            'is_tax_deductible': False
        }

    def get_info(self) -> Dict:
        """Get calculator information."""
        return {
            'contribution_type': 'AHV_IV_EO',
            'description': 'Old Age, Disability, Income Compensation Insurance',
            'tax_year': self.tax_year,
            'employed': {
                'rate_employee': float(self.RATE_EMPLOYED_EMPLOYEE),
                'rate_employer': float(self.RATE_EMPLOYED_EMPLOYER),
                'rate_total': float(self.RATE_EMPLOYED_TOTAL),
                'has_ceiling': False
            },
            'self_employed': {
                'rate_lowest': float(self.RATE_SELF_EMPLOYED_LOWEST),
                'rate_highest': float(self.RATE_SELF_EMPLOYED_HIGHEST),
                'threshold_lowest': float(self.THRESHOLD_LOWEST),
                'threshold_sliding_end': float(self.THRESHOLD_SLIDING_END),
                'fixed_contribution_sliding': float(self.FIXED_CONTRIBUTION_SLIDING)
            },
            'is_tax_deductible': False,
            'source': 'https://www.ahv-iv.ch/de/Merkblätter-Formulare/Merkblätter/Beiträge'
        }
