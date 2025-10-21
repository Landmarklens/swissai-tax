"""ALV Calculator

Unemployment Insurance (Arbeitslosenversicherung) Calculator

Source: Swiss Federal Social Insurance Office (FSIO)
- Official rates: https://www.ahv-iv.ch/de/Merkblätter-Formulare/Merkblätter/Arbeitslosenversicherung
- ALV Ordinance (AVIG)

Tax year: 2024

EMPLOYED PERSONS:
- Standard rate: 1.1% (0.55% employee + 0.55% employer) up to CHF 148,200
- Solidarity rate: 0.5% (0.25% employee + 0.25% employer) above CHF 148,200
- Income ceiling for standard rate: CHF 148,200 (2024)
- NOT tax deductible (federal tax)

SELF-EMPLOYED PERSONS:
- Not covered by ALV (not mandatory)
- Can opt for voluntary unemployment insurance in some cases
"""
from decimal import Decimal
from typing import Dict, Optional


class ALVCalculator:
    """Calculator for ALV (unemployment insurance) contributions"""

    # 2024 official rates
    RATE_STANDARD_EMPLOYEE = Decimal('0.0055')      # 0.55% up to ceiling
    RATE_STANDARD_EMPLOYER = Decimal('0.0055')      # 0.55% up to ceiling
    RATE_STANDARD_TOTAL = Decimal('0.011')          # 1.1% total

    RATE_SOLIDARITY_EMPLOYEE = Decimal('0.0025')    # 0.25% above ceiling
    RATE_SOLIDARITY_EMPLOYER = Decimal('0.0025')    # 0.25% above ceiling
    RATE_SOLIDARITY_TOTAL = Decimal('0.005')        # 0.5% total

    # Income ceiling for standard rate
    INCOME_CEILING_2024 = Decimal('148200')  # CHF 148,200

    def __init__(self, tax_year: int = 2024):
        """
        Initialize ALV calculator.

        Args:
            tax_year: Tax year (default 2024)
        """
        self.tax_year = tax_year
        if tax_year != 2024:
            raise ValueError(f"ALV calculator only supports 2024, got {tax_year}")

    def calculate_employed(self, gross_salary: Decimal,
                          work_percentage: Decimal = Decimal('100')) -> Dict[str, Decimal]:
        """
        Calculate ALV for employed persons with ceiling and solidarity contribution.

        Args:
            gross_salary: Annual gross salary in CHF
            work_percentage: Work percentage (100 = full-time)

        Returns:
            Dictionary with:
            - employee_contribution: Employee's ALV contribution
            - employer_contribution: Employer's ALV contribution
            - total_contribution: Total ALV contribution
            - standard_contribution_employee: Standard rate portion (employee)
            - solidarity_contribution_employee: Solidarity rate portion (employee)
            - income_up_to_ceiling: Income subject to standard rate
            - income_above_ceiling: Income subject to solidarity rate
            - is_tax_deductible: Whether deductible (False for federal)
        """
        if gross_salary <= 0:
            return {
                'employee_contribution': Decimal('0'),
                'employer_contribution': Decimal('0'),
                'total_contribution': Decimal('0'),
                'standard_contribution_employee': Decimal('0'),
                'solidarity_contribution_employee': Decimal('0'),
                'income_up_to_ceiling': Decimal('0'),
                'income_above_ceiling': Decimal('0'),
                'is_tax_deductible': False
            }

        # Apply work percentage
        adjusted_salary = gross_salary * (work_percentage / Decimal('100'))

        # Split income into standard and solidarity portions
        income_up_to_ceiling = min(adjusted_salary, self.INCOME_CEILING_2024)
        income_above_ceiling = max(Decimal('0'), adjusted_salary - self.INCOME_CEILING_2024)

        # Calculate standard rate contribution (up to ceiling)
        standard_employee = income_up_to_ceiling * self.RATE_STANDARD_EMPLOYEE
        standard_employer = income_up_to_ceiling * self.RATE_STANDARD_EMPLOYER

        # Calculate solidarity contribution (above ceiling)
        solidarity_employee = income_above_ceiling * self.RATE_SOLIDARITY_EMPLOYEE
        solidarity_employer = income_above_ceiling * self.RATE_SOLIDARITY_EMPLOYER

        # Total contributions
        employee_contribution = standard_employee + solidarity_employee
        employer_contribution = standard_employer + solidarity_employer
        total_contribution = employee_contribution + employer_contribution

        return {
            'employee_contribution': employee_contribution.quantize(Decimal('0.01')),
            'employer_contribution': employer_contribution.quantize(Decimal('0.01')),
            'total_contribution': total_contribution.quantize(Decimal('0.01')),
            'standard_contribution_employee': standard_employee.quantize(Decimal('0.01')),
            'solidarity_contribution_employee': solidarity_employee.quantize(Decimal('0.01')),
            'income_up_to_ceiling': income_up_to_ceiling.quantize(Decimal('0.01')),
            'income_above_ceiling': income_above_ceiling.quantize(Decimal('0.01')),
            'is_tax_deductible': False
        }

    def calculate_self_employed(self) -> Dict[str, Decimal]:
        """
        Calculate ALV for self-employed persons.

        Self-employed persons are NOT covered by mandatory ALV.

        Returns:
            Dictionary indicating not applicable
        """
        return {
            'contribution': Decimal('0'),
            'is_applicable': False,
            'note': 'Self-employed persons are not covered by mandatory ALV',
            'is_tax_deductible': False
        }

    def get_info(self) -> Dict:
        """Get calculator information."""
        return {
            'contribution_type': 'ALV',
            'description': 'Unemployment Insurance (Arbeitslosenversicherung)',
            'tax_year': self.tax_year,
            'employed': {
                'rate_standard_employee': float(self.RATE_STANDARD_EMPLOYEE),
                'rate_standard_employer': float(self.RATE_STANDARD_EMPLOYER),
                'rate_standard_total': float(self.RATE_STANDARD_TOTAL),
                'rate_solidarity_employee': float(self.RATE_SOLIDARITY_EMPLOYEE),
                'rate_solidarity_employer': float(self.RATE_SOLIDARITY_EMPLOYER),
                'rate_solidarity_total': float(self.RATE_SOLIDARITY_TOTAL),
                'income_ceiling': float(self.INCOME_CEILING_2024)
            },
            'self_employed': {
                'is_applicable': False,
                'note': 'Not mandatory for self-employed'
            },
            'is_tax_deductible': False,
            'source': 'https://www.ahv-iv.ch/de/Merkblätter-Formulare/Merkblätter/Arbeitslosenversicherung'
        }
