"""BVG Calculator

Occupational Pension (Berufliche Vorsorge / Pillar 2) Calculator

Source: Swiss Federal Social Insurance Office (FSIO)
- Official values: https://www.bsv.admin.ch/bsv/de/home/sozialversicherungen/bv.html
- BVG Law (Bundesgesetz über die berufliche Alters-, Hinterlassenen- und Invalidenvorsorge)

Tax year: 2024

COORDINATION DEDUCTION AND INSURED SALARY:
- Minimum annual salary for mandatory BVG: CHF 22,050 (2024)
- Coordination deduction: CHF 25,725 (2024)
- Coordinated salary = Gross salary - Coordination deduction
- Minimum coordinated salary: CHF 3,675
- Maximum coordinated salary: CHF 88,200

AGE-DEPENDENT CONTRIBUTION RATES (on coordinated salary):
- Age 25-34: 7% employee + 7% employer = 14% total
- Age 35-44: 10% employee + 10% employer = 20% total
- Age 45-54: 15% employee + 15% employer = 30% total
- Age 55-65: 18% employee + 18% employer = 36% total

TAX TREATMENT:
- Employee contributions: FULLY tax deductible (federal and canton)
- Employer contributions: NOT deductible for employee (already pre-tax)
"""
from decimal import Decimal
from typing import Dict, Optional


class BVGCalculator:
    """Calculator for BVG (occupational pension / Pillar 2) contributions"""

    # 2024 official BVG values
    MINIMUM_ANNUAL_SALARY_2024 = Decimal('22050')      # CHF 22,050
    COORDINATION_DEDUCTION_2024 = Decimal('25725')     # CHF 25,725
    MIN_COORDINATED_SALARY = Decimal('3675')           # CHF 3,675
    MAX_COORDINATED_SALARY = Decimal('88200')          # CHF 88,200

    # Age-dependent contribution rates (employee + employer each)
    RATES_BY_AGE = {
        'age_25_34': Decimal('0.07'),  # 7% each
        'age_35_44': Decimal('0.10'),  # 10% each
        'age_45_54': Decimal('0.15'),  # 15% each
        'age_55_65': Decimal('0.18'),  # 18% each
    }

    def __init__(self, tax_year: int = 2024):
        """
        Initialize BVG calculator.

        Args:
            tax_year: Tax year (default 2024)
        """
        self.tax_year = tax_year
        if tax_year != 2024:
            raise ValueError(f"BVG calculator only supports 2024, got {tax_year}")

    def _get_rate_for_age(self, age: int) -> tuple[Decimal, str]:
        """
        Get BVG contribution rate based on age.

        Args:
            age: Employee age

        Returns:
            Tuple of (rate, age_category)
        """
        if age < 25:
            return Decimal('0'), 'under_25'
        elif 25 <= age <= 34:
            return self.RATES_BY_AGE['age_25_34'], 'age_25_34'
        elif 35 <= age <= 44:
            return self.RATES_BY_AGE['age_35_44'], 'age_35_44'
        elif 45 <= age <= 54:
            return self.RATES_BY_AGE['age_45_54'], 'age_45_54'
        elif 55 <= age <= 65:
            return self.RATES_BY_AGE['age_55_65'], 'age_55_65'
        else:
            return Decimal('0'), 'over_65'

    def _calculate_coordinated_salary(self, gross_salary: Decimal,
                                     work_percentage: Decimal = Decimal('100')) -> Decimal:
        """
        Calculate coordinated salary (insured salary for BVG).

        Formula: Coordinated salary = Gross salary - Coordination deduction
        With minimum CHF 3,675 and maximum CHF 88,200

        Args:
            gross_salary: Annual gross salary
            work_percentage: Work percentage (100 = full-time)

        Returns:
            Coordinated salary
        """
        # Apply work percentage to salary and coordination deduction
        adjusted_salary = gross_salary * (work_percentage / Decimal('100'))
        adjusted_coordination = self.COORDINATION_DEDUCTION_2024 * (work_percentage / Decimal('100'))

        # Calculate coordinated salary
        coordinated = adjusted_salary - adjusted_coordination

        # Apply minimum and maximum bounds
        coordinated = max(coordinated, Decimal('0'))

        if coordinated > 0:
            # Apply minimum only if there's any coordinated salary
            coordinated = max(coordinated, self.MIN_COORDINATED_SALARY)
            coordinated = min(coordinated, self.MAX_COORDINATED_SALARY)

        return coordinated

    def calculate_employed(self, gross_salary: Decimal, age: int,
                          work_percentage: Decimal = Decimal('100')) -> Dict[str, Decimal]:
        """
        Calculate BVG for employed persons.

        Args:
            gross_salary: Annual gross salary in CHF
            age: Employee age
            work_percentage: Work percentage (100 = full-time)

        Returns:
            Dictionary with:
            - employee_contribution: Employee's BVG contribution
            - employer_contribution: Employer's BVG contribution
            - total_contribution: Total BVG contribution
            - coordinated_salary: Insured salary amount
            - rate_employee: Rate applied (employee portion)
            - age_category: Which age bracket
            - is_mandatory: Whether BVG is mandatory
            - is_tax_deductible: Whether employee contribution is deductible (True)
        """
        # Check if salary meets minimum threshold
        adjusted_salary = gross_salary * (work_percentage / Decimal('100'))
        is_mandatory = adjusted_salary >= self.MINIMUM_ANNUAL_SALARY_2024

        if not is_mandatory or age < 25:
            return {
                'employee_contribution': Decimal('0'),
                'employer_contribution': Decimal('0'),
                'total_contribution': Decimal('0'),
                'coordinated_salary': Decimal('0'),
                'rate_employee': Decimal('0'),
                'age_category': 'not_applicable',
                'is_mandatory': False,
                'note': f'BVG not mandatory: salary < CHF {self.MINIMUM_ANNUAL_SALARY_2024} or age < 25',
                'is_tax_deductible': True
            }

        # Calculate coordinated salary
        coordinated_salary = self._calculate_coordinated_salary(gross_salary, work_percentage)

        if coordinated_salary <= 0:
            return {
                'employee_contribution': Decimal('0'),
                'employer_contribution': Decimal('0'),
                'total_contribution': Decimal('0'),
                'coordinated_salary': Decimal('0'),
                'rate_employee': Decimal('0'),
                'age_category': 'not_applicable',
                'is_mandatory': is_mandatory,
                'note': 'Coordinated salary is 0 or negative',
                'is_tax_deductible': True
            }

        # Get rate for age
        rate, age_category = self._get_rate_for_age(age)

        if rate == 0:
            return {
                'employee_contribution': Decimal('0'),
                'employer_contribution': Decimal('0'),
                'total_contribution': Decimal('0'),
                'coordinated_salary': coordinated_salary.quantize(Decimal('0.01')),
                'rate_employee': Decimal('0'),
                'age_category': age_category,
                'is_mandatory': is_mandatory,
                'note': f'No BVG contributions for age category {age_category}',
                'is_tax_deductible': True
            }

        # Calculate contributions
        employee_contribution = coordinated_salary * rate
        employer_contribution = coordinated_salary * rate
        total_contribution = employee_contribution + employer_contribution

        return {
            'employee_contribution': employee_contribution.quantize(Decimal('0.01')),
            'employer_contribution': employer_contribution.quantize(Decimal('0.01')),
            'total_contribution': total_contribution.quantize(Decimal('0.01')),
            'coordinated_salary': coordinated_salary.quantize(Decimal('0.01')),
            'rate_employee': rate,
            'age_category': age_category,
            'is_mandatory': is_mandatory,
            'is_tax_deductible': True
        }

    def calculate_self_employed(self) -> Dict[str, Decimal]:
        """
        Calculate BVG for self-employed persons.

        Self-employed persons can voluntarily join Pillar 2 through various providers.
        Contributions vary based on chosen plan.

        Returns:
            Dictionary indicating voluntary nature
        """
        return {
            'contribution': Decimal('0'),
            'is_applicable': False,
            'note': 'Self-employed can voluntarily join Pillar 2. Contributions vary by provider and plan.',
            'is_tax_deductible': True
        }

    def get_info(self) -> Dict:
        """Get calculator information."""
        return {
            'contribution_type': 'BVG',
            'description': 'Occupational Pension (Pillar 2)',
            'tax_year': self.tax_year,
            'thresholds': {
                'minimum_annual_salary': float(self.MINIMUM_ANNUAL_SALARY_2024),
                'coordination_deduction': float(self.COORDINATION_DEDUCTION_2024),
                'min_coordinated_salary': float(self.MIN_COORDINATED_SALARY),
                'max_coordinated_salary': float(self.MAX_COORDINATED_SALARY)
            },
            'rates_by_age': {
                'age_25_34': float(self.RATES_BY_AGE['age_25_34']),
                'age_35_44': float(self.RATES_BY_AGE['age_35_44']),
                'age_45_54': float(self.RATES_BY_AGE['age_45_54']),
                'age_55_65': float(self.RATES_BY_AGE['age_55_65'])
            },
            'note': 'Employee contributions are FULLY tax deductible',
            'is_tax_deductible': True,
            'source': 'https://www.bsv.admin.ch/bsv/de/home/sozialversicherungen/bv.html'
        }
